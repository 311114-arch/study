function doGet(e) {
  return HtmlService.createHtmlOutput('Study Garden GAS is running.');
}

function doPost(e) {
  try {
    const payload = typeof e.postData.contents === 'string' && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : {};

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('StudyGarden') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('StudyGarden');
    const headers = ['timestamp', 'recordDate', 'username', 'plantName', 'plantType', 'stage', 'elapsedSeconds', 'apiSuggestion', 'note', 'reminderText'];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    const values = headers.map((key) => payload[key] ?? '');
    sheet.appendRow(values);

    return ContentService.createTextOutput(JSON.stringify({ ok: true, message: '已寫入 Google Sheets' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
