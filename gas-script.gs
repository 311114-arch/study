// Google Sheet 配置
const SHEET_NAME = 'StudyGarden';

function doGet(e) {
  return HtmlService.createHtmlOutput('Study Garden GAS is running.');
}

function doOptions(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.TEXT);
  output.append('');
  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type, X-CORS-TOKEN');
  output.addHeader('Access-Control-Max-Age', '3600');
  return output;
}

function doPost(e) {
  try {
    Logger.log('=== doPost 被調用 ===');
    Logger.log('Request: ' + JSON.stringify(e));
    
    // 解析請求內容
    let payload = {};
    
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
        Logger.log('Payload parsed: ' + JSON.stringify(payload));
      } catch (parseError) {
        Logger.log('JSON parse error: ' + parseError);
        return createCorsResponse({ ok: false, message: 'Invalid JSON format: ' + parseError });
      }
    }

    // 取得或建立試算表
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetId = spreadsheet.getId();
    Logger.log('Sheet ID: ' + sheetId);
    
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      Logger.log('Created new sheet: ' + SHEET_NAME);
    }

    // 設置表頭
    const headers = ['timestamp', 'recordDate', 'username', 'plantName', 'plantType', 'stage', 'elapsedSeconds', 'apiSuggestion', 'note', 'reminderText'];
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      Logger.log('Headers added');
    }

    // 寫入數據
    const timestamp = new Date().toISOString();
    const values = [
      timestamp,
      payload.recordDate || new Date().toISOString().slice(0, 10),
      payload.username || '',
      payload.plantName || '',
      payload.plantType || '',
      payload.stage || '',
      payload.elapsedSeconds || 0,
      payload.apiSuggestion || '',
      payload.note || '',
      payload.reminderText || ''
    ];
    
    sheet.appendRow(values);
    Logger.log('Data written: ' + JSON.stringify(values));

    return createCorsResponse({ 
      ok: true, 
      message: '已寫入 Google Sheets',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/' + sheetId + '/edit'
    });
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createCorsResponse({ ok: false, message: 'Error: ' + error.toString() });
  }
}

function createCorsResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type, X-CORS-TOKEN')
    .addHeader('Access-Control-Max-Age', '3600')
    .addHeader('X-Content-Type-Options', 'nosniff')
    .addHeader('Vary', 'Origin');
}
