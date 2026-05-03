/**
 * EduMaps 전용 Google Apps Script (GAS) 통합 코드
 */

function doGet(e) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var itemsSheet = spreadsheet.getSheetByName("아이템");
  var itemsData = getSheetDataAsObjects(itemsSheet);
  var usageSheet = spreadsheet.getSheetByName("활용");
  var usageData = getSheetDataAsObjects(usageSheet);
  
  var result = itemsData.map(function(item) {
    var relatedUsages = usageData.filter(function(usage) {
      return usage.linked_id === item.id;
    });
    
    var gradeTopics = relatedUsages.map(function(u) {
      return {
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
      // category: 오프라인(지역), 온라인(영역) - 단일 선택
      category: item.category || "기타",
      // tags: 오프라인(체험유형), 온라인(자료유형) - 다중 선택 (쉼표 구분)
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

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📍 EduMaps 도구')
      .addItem('선택한 행 좌표 자동 입력', 'fetchCoordinatesForSelectedRow')
      .addToUi();
}

function fetchCoordinatesForSelectedRow() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var currentRow = sheet.getActiveCell().getRow();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var titleIdx = headers.indexOf('title') + 1;
  var latIdx = headers.indexOf('lat') + 1;
  var lngIdx = headers.indexOf('lng') + 1;

  if (titleIdx === 0 || latIdx === 0 || lngIdx === 0) return;
  var title = sheet.getRange(currentRow, titleIdx).getValue();
  if (!title) return;

  var response = Maps.newGeocoder().geocode(title);
  if (response.status === 'OK') {
    var result = response.results[0];
    sheet.getRange(currentRow, latIdx).setValue(result.geometry.location.lat);
    sheet.getRange(currentRow, lngIdx).setValue(result.geometry.location.lng);
  }
}
