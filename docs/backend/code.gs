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

  // (참고용) 시트 데이터를 JSON으로 직접 확인하고 싶을 때의 엔드포인트.
  // 실제 사이트는 '발행' 버튼이 GitHub에 커밋한 resources.json을 빌드 시점에 읽으므로,
  // 사용자 요청 경로에서는 더 이상 이 엔드포인트를 호출하지 않는다.
  return ContentService.createTextOutput(JSON.stringify(buildResourcesJson()))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 시트(아이템 + 활용)를 프론트엔드가 소비하는 JSON 페이로드로 변환한다.
 * doGet(참고용 API)과 publishToGitHub(발행)에서 공용으로 사용한다.
 * @return {{ generatedAt: string, items: Object[] }}
 */
function buildResourcesJson() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var itemsSheet = spreadsheet.getSheetByName("아이템");
  var itemsData = getSheetDataAsObjects(itemsSheet);
  var usageSheet = spreadsheet.getSheetByName("활용");
  var usageData = getSheetDataAsObjects(usageSheet);

  var items = itemsData.map(function(item) {
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

  // 발행 시각(KST). 프론트의 '데이터 최종 갱신' 표시에 사용된다.
  var generatedAt = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy.MM.dd HH:mm');
  return { generatedAt: generatedAt, items: items, changelog: buildChangelog_() };
}

/**
 * '변경이력' 시트에서 '최근 업데이트 내용' 항목을 읽는다.
 *   A=날짜, B=내용 (1행 헤더, 2행부터 데이터, 행 순서 그대로 — 최신을 위에)
 * 시트가 없거나 비면 빈 배열을 반환하고, 프론트는 기본(하드코딩) 항목으로 폴백한다.
 * @return {{ date: string, text: string }[]}
 */
function buildChangelog_() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('변경이력');
    if (!sheet) return [];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    var rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues(); // A,B
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var d = rows[i][0];
      var t = rows[i][1];
      if (String(d).trim() === '' && String(t).trim() === '') continue;
      var dateStr = (d instanceof Date)
        ? Utilities.formatDate(d, 'Asia/Seoul', 'yyyy.MM.dd')
        : String(d).trim();
      out.push({ date: dateStr, text: String(t).trim() });
    }
    return out;
  } catch (e) {
    return [];
  }
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
 * GitHub 발행 설정을 스크립트 속성에서 읽는다.
 * [설정 방법] Apps Script 편집기 → 프로젝트 설정 → 스크립트 속성에 등록:
 *   GITHUB_TOKEN  (필수) : Contents 읽기/쓰기 권한의 Fine-grained PAT
 *   GITHUB_OWNER  (선택, 기본 eduinside)
 *   GITHUB_REPO   (선택, 기본 edumaps-project)
 *   GITHUB_BRANCH (선택, 기본 main)  ← 개발 중에는 feat/static-export 로 지정
 *   GITHUB_PATH   (선택, 기본 src/data/resources.json)
 */
function getGithubConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    token: props.getProperty('GITHUB_TOKEN') || '',
    owner: props.getProperty('GITHUB_OWNER') || 'eduinside',
    repo: props.getProperty('GITHUB_REPO') || 'edumaps-project',
    branch: props.getProperty('GITHUB_BRANCH') || 'main',
    path: props.getProperty('GITHUB_PATH') || 'src/data/resources.json'
  };
}

/**
 * 시트 데이터를 GitHub의 resources.json으로 커밋(발행)한다.
 * → Cloudflare Pages가 push를 감지해 자동으로 빌드·배포한다.
 * (기존 triggerRevalidation을 대체: /api/refresh 호출 → GitHub 커밋)
 */
function publishToGitHub(password) {
  if (!verifyPassword(password)) {
    throw new Error('인증 오류: 권한이 없습니다.');
  }
  var cfg = getGithubConfig_();
  if (!cfg.token) {
    return { success: false, message: 'GITHUB_TOKEN이 설정되지 않았습니다. 스크립트 속성에 PAT를 등록해주세요.' };
  }

  var payload = buildResourcesJson();
  var contentStr = JSON.stringify(payload, null, 2);
  var apiBase = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path;
  var headers = {
    'Authorization': 'Bearer ' + cfg.token,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  try {
    // 1) 현재 파일의 SHA 조회 (없으면 신규 생성)
    var sha = null;
    var getResp = UrlFetchApp.fetch(apiBase + '?ref=' + encodeURIComponent(cfg.branch), {
      method: 'get', headers: headers, muteHttpExceptions: true
    });
    if (getResp.getResponseCode() === 200) {
      sha = JSON.parse(getResp.getContentText()).sha;
    }

    // 2) PUT으로 커밋 (한글 보존을 위해 UTF-8 base64 인코딩)
    var body = {
      message: '데이터 발행: ' + payload.generatedAt + ' (관리자 패널)',
      content: Utilities.base64Encode(contentStr, Utilities.Charset.UTF_8),
      branch: cfg.branch
    };
    if (sha) body.sha = sha;

    var putResp = UrlFetchApp.fetch(apiBase, {
      method: 'put', headers: headers,
      contentType: 'application/json',
      payload: JSON.stringify(body), muteHttpExceptions: true
    });
    var code = putResp.getResponseCode();
    if (code === 200 || code === 201) {
      var commit = JSON.parse(putResp.getContentText());
      var commitUrl = (commit && commit.commit && commit.commit.html_url) || '';
      appendPublishHistory_(payload, cfg.branch, commitUrl);
      return {
        success: true,
        message: '발행 완료! 약 1~3분 내 사이트에 반영됩니다. (' + payload.items.length + '개 항목, ' + cfg.branch + ' 브랜치)',
        url: commitUrl
      };
    }
    return { success: false, message: 'GitHub 커밋 실패 (HTTP ' + code + '): ' + putResp.getContentText() };
  } catch (e) {
    return { success: false, message: '네트워크/실행 오류: ' + e.toString() };
  }
}

/**
 * 발행 이력을 '공통' 시트 A20부터 한 줄씩(아래로) 기록한다.
 *   A=발행시각, B=항목수, C=브랜치, D=커밋링크, E=발행자(이메일)
 * 이력 기록 실패가 발행 자체를 막지 않도록 try/catch로 보호한다.
 * (헤더가 필요하면 A19 등 19행 이하에 수동으로 넣으면 됨 — 이력은 20행부터)
 */
function appendPublishHistory_(payload, branch, commitUrl) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('공통');
    if (!sheet) return; // 공통 시트가 없으면 조용히 스킵
    var START_ROW = 20;

    // START_ROW부터 A열에서 첫 번째 빈 행을 찾아 그 행에 기록 (append)
    var row = START_ROW;
    var lastRow = sheet.getLastRow();
    if (lastRow >= START_ROW) {
      var colA = sheet.getRange(START_ROW, 1, lastRow - START_ROW + 1, 1).getValues();
      var i = 0;
      while (i < colA.length && String(colA[i][0]).trim() !== '') i++;
      row = START_ROW + i;
    }

    var who = '';
    try { who = Session.getActiveUser().getEmail() || ''; } catch (e2) {}

    sheet.getRange(row, 1, 1, 5).setValues([[
      payload.generatedAt,
      payload.items.length,
      branch,
      commitUrl,
      who
    ]]);
  } catch (e) {
    // 이력 기록 실패는 무시 — 발행(커밋)은 이미 성공한 상태
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
      .addSeparator()
      .addItem('선택 영역 맞춤법 교정', 'proofreadSelectedRange')
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

/* ==========================================
   선택 영역 한국어 맞춤법 교정 도구
   --------------------------------------------
   외부 무료 맞춤법 검사기(다음 grammar_checker)를 이용해 선택한 셀의
   오탈자·띄어쓰기·맞춤법을 교정하고 내용을 즉시 덮어쓴다.

   - 별도 API 키가 필요 없다(부산대 검사기는 서버 이전으로 비공식 호출이
     불안정해져, 동일 계열의 다음 검사기를 사용한다).
   - 비공식 외부 서비스 응답 포맷에 의존하므로, 서비스가 바뀌면 동작이
     멈출 수 있다. 이 경우 해당 셀은 '실패'로 처리되어 원문이 그대로
     보존된다(잘못된 값으로 덮어쓰지 않는다).
   ========================================== */

var DAUM_GRAMMAR_URL = 'https://dic.daum.net/grammar_checker.do';
var DAUM_MAX_CHARS = 1000;            // 한 요청에 보낼 최대 글자 수
var DAUM_REQUEST_INTERVAL_MS = 400;   // 연속 요청 간격(차단 방지)
var DAUM_VALID_MARKER = '="screen_out">맞춤법 검사기 본문</h2>';
var DAUM_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * [메뉴] 선택 영역 맞춤법 교정
 * 선택한 모든 텍스트 셀을 한국어 맞춤법 검사기로 교정한 뒤 즉시 덮어쓴다.
 * (빈 셀·숫자·날짜·수식 셀은 건너뛴다)
 */
function proofreadSelectedRange() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var sheet = ss.getActiveSheet();
  var rangeList = sheet.getActiveRangeList();

  if (!rangeList) {
    ui.alert('교정할 셀을 먼저 선택해 주세요.');
    return;
  }

  // 1) 교정 대상(문자열이 있고 수식이 아닌 셀) 수집
  var ranges = rangeList.getRanges();
  var targets = []; // { cell: Range, text: string }
  for (var r = 0; r < ranges.length; r++) {
    var range = ranges[r];
    var values = range.getValues();
    var formulas = range.getFormulas();
    var startRow = range.getRow();
    var startCol = range.getColumn();
    for (var i = 0; i < values.length; i++) {
      for (var j = 0; j < values[i].length; j++) {
        var val = values[i][j];
        var isFormula = formulas[i][j] !== '';
        if (!isFormula && typeof val === 'string' && val.trim() !== '') {
          targets.push({ cell: sheet.getRange(startRow + i, startCol + j), text: val });
        }
      }
    }
  }

  if (targets.length === 0) {
    ui.alert('선택한 영역에 교정할 텍스트가 없습니다.\n(빈 셀·숫자·수식 셀은 제외됩니다)');
    return;
  }

  // 2) 셀별 교정 수행 (기존 '좌표 자동 입력'처럼 즉시 덮어쓰기)
  ss.toast(targets.length + '개 셀 맞춤법 교정을 시작합니다…', '📍 EduMaps', 5);
  var changedCells = 0;
  var totalFixes = 0;
  var failedCells = 0;

  for (var t = 0; t < targets.length; t++) {
    var result;
    try {
      result = daumSpellCheck_(targets[t].text);
    } catch (e) {
      Logger.log('맞춤법 교정 실패: ' + e);
      result = { corrected: targets[t].text, fixCount: 0, ok: false };
    }

    if (!result.ok) {
      failedCells++;            // 서비스 오류 → 원문 보존
      continue;
    }
    if (result.corrected !== targets[t].text) {
      targets[t].cell.setValue(result.corrected);
      changedCells++;
      totalFixes += result.fixCount;
    }
  }
  SpreadsheetApp.flush();

  // 3) 결과 요약
  var summary = '대상 ' + targets.length + '개 중 ' + changedCells + '개 셀 수정' +
    ' (' + totalFixes + '곳 교정)';
  if (failedCells > 0) {
    summary += ' · 실패 ' + failedCells + '개(원문 유지)';
  }
  ss.toast(summary, '📍 맞춤법 교정 완료', 8);
}

/**
 * 다음 맞춤법 검사기로 한 셀의 텍스트를 교정한다.
 * @param {string} text 원문
 * @return {{corrected: string, fixCount: number, ok: boolean}}
 *   ok=false면 서비스 오류로 교정하지 못한 것이므로 원문을 유지해야 한다.
 */
function daumSpellCheck_(text) {
  var original = String(text);
  // 요청에는 <...> 형태의 태그를 제거한 사본을 보낸다(교정은 원문에 적용).
  var cleaned = original.replace(/<[^ㄱ-ㅎㅏ-ㅣ가-힣>]+>/g, '');
  var chunks = splitByLengthOnSeparators_(cleaned, '.,\n', DAUM_MAX_CHARS);

  // 동일 오류 토큰은 한 번만 적용 (token -> suggestion)
  var typoMap = {};
  for (var c = 0; c < chunks.length; c++) {
    if (chunks[c].trim() === '') continue;

    var response = UrlFetchApp.fetch(DAUM_GRAMMAR_URL, {
      method: 'post',
      payload: { sentence: chunks[c] },
      headers: { 'User-Agent': DAUM_UA },
      muteHttpExceptions: true,
      followRedirects: true
    });

    if (response.getResponseCode() !== 200) {
      return { corrected: original, fixCount: 0, ok: false };
    }
    var body = response.getContentText();
    var looksValid = body.indexOf(DAUM_VALID_MARKER) !== -1 ||
      body.indexOf('data-error-type') !== -1;
    if (!looksValid) {
      return { corrected: original, fixCount: 0, ok: false };
    }

    var typos = parseDaumTypos_(body);
    for (var k = 0; k < typos.length; k++) {
      var token = typos[k].token;
      if (token && !Object.prototype.hasOwnProperty.call(typoMap, token)) {
        typoMap[token] = typos[k].suggestion;
      }
    }
    if (c < chunks.length - 1) Utilities.sleep(DAUM_REQUEST_INTERVAL_MS);
  }

  // 원문에 교정 적용
  var corrected = original;
  var fixCount = 0;
  for (var tok in typoMap) {
    if (!Object.prototype.hasOwnProperty.call(typoMap, tok)) continue;
    var suggestion = typoMap[tok];
    if (suggestion == null || tok === suggestion) continue;
    var replaced = replaceWholeToken_(corrected, tok, suggestion);
    if (replaced !== corrected) {
      corrected = replaced;
      fixCount++;
    }
  }
  return { corrected: corrected, fixCount: fixCount, ok: true };
}

/**
 * 다음 응답(HTML)에서 교정 정보를 추출한다.
 * @return {Array<{token: string, suggestion: string}>}
 */
function parseDaumTypos_(body) {
  var typos = [];
  var found = -1;
  while (true) {
    found = body.indexOf('data-error-type', found + 1);
    if (found === -1) break;
    var end = body.indexOf('>', found + 1);
    if (end === -1) break;
    var line = body.substring(found, end);
    var token = decodeHtmlEntities_(getDaumAttr_(line, 'data-error-input='));
    var suggestion = decodeHtmlEntities_(getDaumAttr_(line, 'data-error-output='));
    if (token) typos.push({ token: token, suggestion: suggestion });
  }
  return typos;
}

/** key="value" 형태에서 key 뒤 첫 따옴표쌍 안의 값을 추출한다. */
function getDaumAttr_(str, key) {
  var found = str.indexOf(key);
  if (found === -1) return '';
  var firstQuote = str.indexOf('"', found + 1);
  if (firstQuote === -1) return '';
  var secondQuote = str.indexOf('"', firstQuote + 1);
  if (secondQuote === -1) return '';
  return str.substring(firstQuote + 1, secondQuote);
}

/** 기본 HTML 엔티티를 디코드한다. (&amp;는 이중 디코드 방지를 위해 마지막에 처리) */
function decodeHtmlEntities_(str) {
  if (!str) return str;
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, function (m, n) { return String.fromCharCode(parseInt(n, 16)); })
    .replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(parseInt(n, 10)); })
    .replace(/&amp;/g, '&');
}

/**
 * 원문에서 오류 토큰을 교정어로 치환한다.
 * 앞뒤가 한글이 아닌 '단어 경계'에서만 치환해, 더 긴 단어의 일부가
 * 잘못 교정되는 것을 막는다. (정규식 lookbehind 미사용 → 모든 런타임 호환)
 */
function replaceWholeToken_(text, token, suggestion) {
  if (!token || token === suggestion) return text;
  var korean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
  var tlen = token.length;
  var out = '';
  var i = 0;
  while (i < text.length) {
    if (text.substr(i, tlen) === token) {
      var before = i === 0 ? '' : text.charAt(i - 1);
      var afterIdx = i + tlen;
      var after = afterIdx >= text.length ? '' : text.charAt(afterIdx);
      var beforeOk = before === '' || !korean.test(before);
      var afterOk = after === '' || !korean.test(after);
      if (beforeOk && afterOk) {
        out += suggestion;
        i += tlen;
        continue;
      }
    }
    out += text.charAt(i);
    i++;
  }
  return out;
}

/**
 * 문자열을 separator(각 문자)의 경계에서 limit 길이 이하 조각으로 나눈다.
 * hanspell split-string.byLength 포트.
 */
function splitByLengthOnSeparators_(string, separator, limit) {
  var splitted = [];
  var found = -1;
  var lastFound = -1;
  var lastSplitted = -1;

  while (true) {
    found = indexOfAnyChar_(string, separator, lastFound + 1);
    if (found === -1) break;
    if (found - lastSplitted > limit) {
      splitted.push(string.substr(lastSplitted + 1, lastFound - lastSplitted));
      lastSplitted = lastFound;
    }
    lastFound = found;
  }

  if (lastSplitted + 1 !== string.length) {
    if (string.length - lastSplitted - 1 <= limit) {
      splitted.push(string.substr(lastSplitted + 1));
    } else {
      if (lastSplitted !== lastFound) {
        splitted.push(string.substr(lastSplitted + 1, lastFound - lastSplitted));
      }
      splitted.push(string.substr(lastFound + 1));
    }
  }
  return splitted;
}

/** string에서 chars의 문자 중 가장 먼저 나오는 위치를 반환한다(없으면 -1). */
function indexOfAnyChar_(string, chars, from) {
  var best = -1;
  for (var i = 0; i < chars.length; i++) {
    var idx = string.indexOf(chars.charAt(i), from);
    if (idx > -1 && (best === -1 || idx < best)) best = idx;
  }
  return best;
}
