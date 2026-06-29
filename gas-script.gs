// Google Sheet 配置
const SHEET_NAME = 'StudyGarden';

function doGet(e) {
  return HtmlService.createHtmlOutput('Study Garden GAS is running.');
}

function getSheetInfo() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetId = spreadsheet.getId();
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/edit';
    return {
      ok: true,
      sheetUrl: sheetUrl,
      sheetName: SHEET_NAME
    };
  } catch (error) {
    return {
      ok: false,
      message: 'Error accessing sheet: ' + error.toString()
    };
  }
}

function doPost(e) {
  try {
    // 解析請求內容
    let payload = {};
    
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseError) {
        Logger.log('JSON parse error: ' + parseError);
        return createCorsResponse({ ok: false, message: 'Invalid JSON format' });
      }
    }

    // 取得或建立試算表
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetId = spreadsheet.getId();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    // 設置表頭
    const headers = ['timestamp', 'recordDate', 'username', 'plantName', 'plantType', 'stage', 'elapsedSeconds', 'apiSuggestion', 'note', 'reminderText'];
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
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
    Logger.log('Data written successfully: ' + JSON.stringify(values));

    return createCorsResponse({ 
      ok: true, 
      message: '已寫入 Google Sheets',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/' + sheetId + '/edit'
    });
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createCorsResponse({ ok: false, message: error.toString() });
  }
}

function createCorsResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type, X-CORS-TOKEN')
    .addHeader('X-Content-Type-Options', 'nosniff');
}
