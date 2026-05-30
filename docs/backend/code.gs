/**
 * EduMaps 전용 Google Apps Script (GAS) 통합 코드 및 관리자 백엔드 (GA4 API 의존성 제거 버전)
 */

function doGet(e) {
  // 관리자 모드 파라미터가 있을 경우 관리자 HTML 화면을 제공
  if (e && e.parameter && e.parameter.mode === 'admin') {
    return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('📍 EduMaps 관리자 패널')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // 기존 API 로직 (ISR 데이터 제공)
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var itemsSheet = spreadsheet.getSheetByName("아이템");
  var itemsData = getSheetDataAsObjects(itemsSheet);
  var usageSheet = spreadsheet.getSheetByName("활용");
  var usageData = getSheetDataAsObjects(usageSheet);
  
  var result = itemsData.map(function(item) {
    var relatedUsages = usageData.map(function(u, idx) {
      u._original_index = idx; // 활용 시트의 원래 행 순서 저장
      return u;
    }).filter(function(usage) {
      return usage.linked_id === item.id;
    });
    
    var gradeTopics = relatedUsages.map(function(u) {
      return {
        usage_index: u._original_index, // 정렬을 위한 인덱스
        grade: parseInt(u.grade) || 0,
        subject: u.subject || "",
        month: u.month || "",
        topic_title: u.topic_title || "",
        description: u.description || "",
        inquiry_questions: u.inquiry_questions ? String(u.inquiry_questions).split("\n").map(function(s) { return s.trim(); }) : [],
        post_activities: u.post_activities ? String(u.post_activities).split("\n").map(function(s) { return s.trim(); }) : []
      };
    });
    
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      category: item.category || "기타",
      tags: item.tags ? String(item.tags).split(",").map(function(s) { return s.trim(); }) : [],
      recommended_grade: (function(rg) {
        if (!rg) return [];
        var s = String(rg);
        if (s.indexOf("전학년") > -1) return ["1", "2", "3", "4", "5", "6"];
        return s.split(",").map(function(v) { return v.trim(); });
      })(item.recommended_grade),
      description: item.description || "",
      location: {
        lat: parseFloat(item.lat) || 0,
        lng: parseFloat(item.lng) || 0
      },
      image_url: item.image_url || "",
      external_url: item.external_url || "",
      grade_topics: gradeTopics
    };
  });
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetDataAsObjects(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  var keys = rows[0];
  var data = [];
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    for (var j = 0; j < keys.length; j++) {
      obj[keys[j]] = rows[i][j];
    }
    if (obj['id'] || obj['linked_id']) data.push(obj);
  }
  return data;
}

/* ==========================================
   관리자 모드 전용 백엔드 함수 (CRUD & Settings)
   ========================================== */

/**
 * 관리자 비밀번호 검증
 */
function verifyPassword(password) {
  var userPwd = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!userPwd) {
    userPwd = 'edumaps123!'; // 초깃값
  }
  return password === userPwd;
}

/**
 * 관리자 비밀번호 변경
 */
function changePassword(oldPassword, newPassword) {
  if (!verifyPassword(oldPassword)) {
    throw new Error('이전 비밀번호가 일치하지 않습니다.');
  }
  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error('새 비밀번호는 최소 4글자 이상이어야 합니다.');
  }
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', newPassword);
  return true;
}

/**
 * 아이템 및 활용 시트의 로우 데이터 로드
 */
function getAllData(password) {
  if (!verifyPassword(password)) {
    throw new Error('인증 오류: 권한이 없습니다.');
  }
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var itemsSheet = spreadsheet.getSheetByName("아이템");
  var usageSheet = spreadsheet.getSheetByName("활용");
  
  var items = getSheetRawData(itemsSheet);
  var usages = getSheetRawData(usageSheet);
  
  return {
    items: items,
    usages: usages
  };
}

/**
 * 시트 데이터를 원시 배열 구조 그대로 로드하며, 원래 인덱스 저장
 */
function getSheetRawData(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  var keys = rows[0];
  var data = [];
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    var hasData = false;
    for (var j = 0; j < keys.length; j++) {
      obj[keys[j]] = rows[i][j];
      if (rows[i][j] !== "") {
        hasData = true;
      }
    }
    obj._original_index = i - 1; // 0-based 로우 인덱스 (헤더 제외한 데이터 행 순서)
    if (hasData && (obj['id'] !== undefined || obj['linked_id'] !== undefined)) {
      data.push(obj);
    }
  }
  return data;
}

/**
 * 아이템 저장 (추가 및 수정)
 */
function saveItem(password, item) {
  if (!verifyPassword(password)) {
    throw new Error('인증 오류: 권한이 없습니다.');
  }
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName("아이템");
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  
  var idIndex = headers.indexOf("id");
  if (idIndex === -1) throw new Error("'id' 컬럼을 찾을 수 없습니다.");
  
  var targetRowIndex = -1;
  var existingIds = [];
  
  // 기존 ID 탐색 및 수집
  for (var i = 1; i < rows.length; i++) {
    var rowId = String(rows[i][idIndex]).trim();
    existingIds.push(rowId);
    if (rowId === String(item.id).trim() && rowId !== "") {
      targetRowIndex = i + 1; // 1-based Row Number
    }
  }
  
  // ID 자동 생성 (신규 추가이고 ID가 공백일 때)
  if (!item.id || String(item.id).trim() === "") {
    var prefix = item.type === "ONLINE" ? "res_0" : "res_1";
    var maxNum = 0;
    for (var k = 0; k < existingIds.length; k++) {
      var idStr = existingIds[k];
      if (idStr.indexOf(prefix) === 0) {
        var numPart = parseInt(idStr.substring(prefix.length)) || 0;
        if (numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }
    // 시작값을 11로 부여 (기존 ID 구조 res_011, res_111 감안)
    var nextNum = maxNum === 0 ? 11 : maxNum + 1;
    item.id = prefix + nextNum;
  }
  
  // 행 값 생성
  var rowValues = [];
  for (var col = 0; col < headers.length; col++) {
    var key = headers[col];
    var val = item[key];
    if (val === undefined) val = "";
    
    // 포맷팅 및 형변환
    if (key === "lat" || key === "lng") {
      val = val === "" ? 0 : parseFloat(val) || 0;
    } else if (key === "recommended_grade" || key === "tags") {
      if (Array.isArray(val)) {
        val = val.join(", ");
      }
    }
    rowValues.push(val);
  }
  
  if (targetRowIndex > 0) {
    // 기존 데이터 수정
    sheet.getRange(targetRowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    // 신규 데이터 추가
    sheet.appendRow(rowValues);
  }
  
  return item.id;
}

/**
 * 아이템 삭제 및 연계된 추천활용 정보 삭제
 */
function deleteItem(password, itemId) {
  if (!verifyPassword(password)) {
    throw new Error('인증 오류: 권한이 없습니다.');
  }
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var itemsSheet = spreadsheet.getSheetByName("아이템");
  var usageSheet = spreadsheet.getSheetByName("활용");
  
  // 1. 아이템 시트에서 삭제
  var itemsRows = itemsSheet.getDataRange().getValues();
  var itemsHeaders = itemsRows[0];
  var itemIdCol = itemsHeaders.indexOf("id");
  if (itemIdCol !== -1) {
    for (var i = itemsRows.length - 1; i >= 1; i--) {
      if (String(itemsRows[i][itemIdCol]).trim() === String(itemId).trim()) {
        itemsSheet.deleteRow(i + 1);
        break;
      }
    }
  }
  
  // 2. 활용 시트에서 매칭된 행 연쇄 삭제
  var usageRows = usageSheet.getDataRange().getValues();
  var usageHeaders = usageRows[0];
  var linkedIdCol = usageHeaders.indexOf("linked_id");
  if (linkedIdCol !== -1) {
    for (var j = usageRows.length - 1; j >= 1; j--) {
      if (String(usageRows[j][linkedIdCol]).trim() === String(itemId).trim()) {
        usageSheet.deleteRow(j + 1);
      }
    }
  }
  
  return true;
}

/**
 * 추천장소 활용 단원 정보 저장 (추가 및 수정)
 */
function saveUsage(password, usage, originalIndex) {
  if (!verifyPassword(password)) {
    throw new Error('인증 오류: 권한이 없습니다.');
  }
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName("활용");
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  var rowValues = [];
  for (var col = 0; col < headers.length; col++) {
    var key = headers[col];
    var val = usage[key];
    if (val === undefined) val = "";
    
    // 줄바꿈으로 여러 문항 저장
    if ((key === "inquiry_questions" || key === "post_activities") && Array.isArray(val)) {
      val = val.join("\n");
    }
    rowValues.push(val);
  }
  
  if (typeof originalIndex === 'number' && originalIndex >= 0) {
    // 기존 행 수정 (originalIndex + 2가 실제 구글 시트 행 번호)
    sheet.getRange(originalIndex + 2, 1, 1, headers.length).setValues([rowValues]);
  } else {
    // 신규 행 추가
    sheet.appendRow(rowValues);
  }
  return true;
}

/**
 * 추천장소 활용 단원 정보 삭제
 */
function deleteUsage(password, originalIndex) {
  if (!verifyPassword(password)) {
    throw new Error('인증 오류: 권한이 없습니다.');
  }
  
  if (typeof originalIndex !== 'number' || originalIndex < 0) {
    throw new Error("유효하지 않은 인덱스입니다.");
  }
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName("활용");
  sheet.deleteRow(originalIndex + 2); // originalIndex는 0-based 이므로 +2 row
  return true;
}

/**
 * 웹사이트(Next.js) URL 저장
 */
function saveFrontUrl(password, url) {
  if (!verifyPassword(password)) {
    throw new Error('인증 오류: 권한이 없습니다.');
  }
  PropertiesService.getScriptProperties().setProperty('FRONT_URL', url);
  return true;
}

/**
 * 웹사이트(Next.js) URL 로드
 */
function getFrontUrl(password) {
  if (!verifyPassword(password)) {
    throw new Error('인증 오류: 권한이 없습니다.');
  }
  return PropertiesService.getScriptProperties().getProperty('FRONT_URL') || "";
}

/**
 * Next.js 캐시 갱신(Revalidate) 트리거
 */
function triggerRevalidation(password) {
  if (!verifyPassword(password)) {
    throw new Error('인증 오류: 권한이 없습니다.');
  }
  var url = getFrontUrl(password);
  if (!url) {
    throw new Error('웹사이트 URL이 설정되지 않았습니다. 설정 탭에서 입력해주세요.');
  }
  
  if (url.substring(url.length - 1) === '/') {
    url = url.substring(0, url.length - 1);
  }
  var refreshUrl = url + '/api/refresh';
  
  try {
    var response = UrlFetchApp.fetch(refreshUrl, { muteHttpExceptions: true });
    var code = response.getResponseCode();
    var content = response.getContentText();
    
    if (code === 200) {
      return { success: true, message: '캐시가 성공적으로 갱신되었습니다.' };
    } else {
      return { success: false, message: '서버 응답 오류 (HTTP ' + code + '): ' + content };
    }
  } catch (e) {
    return { success: false, message: '네트워크 연결 오류: ' + e.toString() };
  }
}

/**
 * 장소명을 기반으로 위경도 좌표를 조회하여 반환 (프론트엔드 호출용)
 */
function fetchCoordinatesFromBackend(title) {
  if (!title) return null;
  try {
    var response = Maps.newGeocoder().geocode(title);
    if (response.status === 'OK' && response.results.length > 0) {
      var result = response.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      };
    }
  } catch (e) {
    Logger.log("Geocoding failed for: " + title + " / Error: " + e.toString());
  }
  return null;
}

/* ==========================================
   기존 시트 도구 함수들
   ========================================== */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📍 EduMaps 도구')
      .addItem('선택한 행 좌표 자동 입력', 'fetchCoordinatesForSelectedRow')
      .addToUi();
}

function fetchCoordinatesForSelectedRow() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var ranges = sheet.getActiveRangeList().getRanges();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var titleIdx = headers.indexOf('title') + 1;
  var latIdx = headers.indexOf('lat') + 1;
  var lngIdx = headers.indexOf('lng') + 1;

  if (titleIdx === 0 || latIdx === 0 || lngIdx === 0) return;

  for (var r = 0; r < ranges.length; r++) {
    var range = ranges[r];
    var startRow = range.getRow();
    var numRows = range.getNumRows();

    for (var i = 0; i < numRows; i++) {
      var currentRow = startRow + i;
      var title = sheet.getRange(currentRow, titleIdx).getValue();
      if (!title) continue;

      var response = Maps.newGeocoder().geocode(title);
      if (response.status === 'OK' && response.results.length > 0) {
        var result = response.results[0];
        sheet.getRange(currentRow, latIdx).setValue(result.geometry.location.lat);
        sheet.getRange(currentRow, lngIdx).setValue(result.geometry.location.lng);
      }
      
      Utilities.sleep(200); // 구글 맵스 API 연속 호출 오류 방지
    }
  }
}
