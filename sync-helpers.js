(function (global) {
  function buildSheetPayload(data = {}) {
    const {
      username = '',
      plantName = '',
      plantType = '',
      stage = '',
      elapsedSeconds = 0,
      apiSuggestion = '',
      note = '',
      reminderText = '',
      recordDate = new Date().toISOString().slice(0, 10)
    } = data;

    return {
      timestamp: new Date().toISOString(),
      recordDate,
      username,
      plantName,
      plantType,
      stage,
      elapsedSeconds,
      apiSuggestion,
      note,
      reminderText
    };
  }

  function summarizeApiData(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      if (data.content && data.author) return `${data.content} — ${data.author}`;
      if (data.content) return data.content;
      if (data.activity) return data.activity;
      if (data.quote) return data.quote;
      if (data.text) return data.text;
    }
    return '';
  }

  const api = {
    buildSheetPayload,
    summarizeApiData
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.SyncHelpers = api;
})(typeof window !== 'undefined' ? window : globalThis);
