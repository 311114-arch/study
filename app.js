const USERS_KEY = 'studyGardenUsers';
const CURRENT_USER_KEY = 'studyGardenCurrentUser';
const GAS_URL_KEY = 'studyGardenGasUrl';
const API_NOTE_KEY = 'studyGardenApiNote';
const REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

const plantTypes = {
  花朵: [
    { name: '鬱金香', path: 'flower/tulip', stages: ['幼苗', '一階成長期', '二階成長期', '最終型態'] },
    { name: '櫻花', path: 'flower/cherry', stages: ['幼苗', '一階成長期', '二階成長期', '最終型態'] },
    { name: '玫瑰', path: 'flower/rose', stages: ['幼苗', '一階成長期', '二階成長期', '最終型態'] }
  ],
  草: [
    { name: '蕨類', path: 'grass/fern', stages: ['幼苗', '一階成長期', '二階成長期', '最終型態'] },
    { name: '三葉草', path: 'grass/clover', stages: ['幼苗', '一階成長期', '二階成長期', '最終型態'] },
    { name: '竹葉草', path: 'grass/bamboo', stages: ['幼苗', '一階成長期', '二階成長期', '最終型態'] }
  ],
  樹: [
    { name: '松樹', path: 'tree/pine', stages: ['幼苗', '一階成長期', '二階成長期', '最終型態'] },
    { name: '大樹', path: 'tree/tree', stages: ['幼苗', '一階成長期', '二階成長期', '最終型態'] },
    { name: '棕櫚樹', path: 'tree/palm', stages: ['幼苗', '一階成長期', '二階成長期', '最終型態'] }
  ]
};

const reminderMessages = [
  '今日先讀 20 分鐘，再種下一株植物。',
  '每次小步進步，都會長出一株新的植物。',
  '把讀書時間當成給自己澆水的時刻。',
  '你今天的努力，會在花園裡發芽。'
];

window.state = window.state || {
  users: {},
  currentUser: null,
  currentPlant: null,
  elapsedSeconds: 0,
  timer: null,
  isRunning: false,
  isHarvesting: false,
  currentPage: 'login',
  reminderIndex: 0
};

const elements = {
  loginPage: document.getElementById('login-page'),
  mainPage: document.getElementById('main-page'),
  gardenPage: document.getElementById('garden-page'),
  loginUser: document.getElementById('login-user'),
  loginPass: document.getElementById('login-pass'),
  loginBtn: document.getElementById('login-btn'),
  loginError: document.getElementById('login-error'),
  showRegister: document.getElementById('show-register'),
  showLogin: document.getElementById('show-login'),
  registerForm: document.getElementById('register-form'),
  loginForm: document.getElementById('login-form'),
  registerUser: document.getElementById('register-user'),
  registerPass: document.getElementById('register-pass'),
  registerBtn: document.getElementById('register-btn'),
  registerError: document.getElementById('register-error'),
  welcomeText: document.getElementById('welcome-text'),
  plantStageLabel: document.getElementById('plant-stage-label'),
  plantDisplay: document.getElementById('plant-display'),
  plantName: document.getElementById('plant-name'),
  plantDescription: document.getElementById('plant-description'),
  timerValue: document.getElementById('timer-value'),
  startBtn: document.getElementById('start-btn'),
  pauseBtn: document.getElementById('pause-btn'),
  resetBtn: document.getElementById('reset-btn'),
  gardenBtn: document.getElementById('garden-btn'),
  homeBtn: document.getElementById('home-btn'),
  gardenGrid: document.getElementById('garden-grid'),
  toast: document.getElementById('toast'),
  modalOverlay: document.getElementById('modal-overlay'),
  modalTitle: document.getElementById('modal-title'),
  modalMessage: document.getElementById('modal-message'),
  modalConfirmBtn: document.getElementById('modal-confirm-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  gardenSummaryLabel: document.getElementById('garden-summary-label'),
  gasUrl: document.getElementById('gas-url'),
  apiNote: document.getElementById('api-note'),
  fetchApiBtn: document.getElementById('fetch-api-btn'),
  syncGasBtn: document.getElementById('sync-gas-btn'),
  syncStatus: document.getElementById('sync-status'),
  reminderText: document.getElementById('reminder-text'),
  nextReminderBtn: document.getElementById('next-reminder-btn')
};

function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  try {
    state.users = raw ? JSON.parse(raw) : {};
  } catch (error) {
    state.users = {};
  }
}

function saveUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(state.users));
}

function loadCurrentUser() {
  const username = localStorage.getItem(CURRENT_USER_KEY);
  if (!username || !state.users[username]) return null;
  return username;
}

function saveCurrentUser(username) {
  localStorage.setItem(CURRENT_USER_KEY, username);
}

function getUserData(username) {
  const user = state.users[username];
  if (!user) return null;
  return user;
}

function ensureUserData(username) {
  if (!state.users[username]) return;
  const user = state.users[username];
  user.garden = Array.isArray(user.garden) ? user.garden : Array(56).fill(null);
  user.lastRefresh = user.lastRefresh || new Date().toISOString();
  user.weeklyPlantedCount = user.weeklyPlantedCount || 0;
  user.weeklyReadingSeconds = user.weeklyReadingSeconds || 0;
  user.pendingSummary = user.pendingSummary || null;
  
  // 修復舊的植物數據（缺少 path 和 stages）
  if (user.currentPlant && !user.currentPlant.path) {
    user.currentPlant = createRandomPlant();
  }
  
  // 修復花園中的舊植物數據
  user.garden = user.garden.map(plant => {
    if (plant && !plant.path) {
      // 嘗試根據植物名稱和類型重建完整數據
      for (const category of Object.keys(plantTypes)) {
        for (const template of plantTypes[category]) {
          if (template.name === plant.name) {
            return {
              ...plant,
              type: category,
              path: template.path,
              stages: template.stages,
              createdAt: plant.createdAt || new Date().toISOString()
            };
          }
        }
      }
    }
    return plant;
  });
}

function createRandomPlant() {
  const categories = Object.keys(plantTypes);
  const type = categories[Math.floor(Math.random() * categories.length)];
  const plant = plantTypes[type][Math.floor(Math.random() * plantTypes[type].length)];
  return {
    type,
    name: plant.name,
    path: plant.path,
    stages: plant.stages,
    createdAt: new Date().toISOString()
  };
}

function showPage(pageId) {
  state.currentPage = pageId;
  elements.loginPage.classList.toggle('active', pageId === 'login');
  elements.mainPage.classList.toggle('active', pageId === 'main');
  elements.gardenPage.classList.toggle('active', pageId === 'garden');
}

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getStage(seconds) {
  if (seconds >= 10800) return '最終型態';
  if (seconds >= 7200) return '二階成長期';
  if (seconds >= 3600) return '一階成長期';
  return '幼苗';
}

function getStageDescription(stage, plant) {
  if (stage === '幼苗') return `${plant.type}幼苗正在穩定萌芽。`;
  if (stage === '一階成長期') return `${plant.type}成長中，生命力茁壯。`;
  if (stage === '二階成長期') return `${plant.type}已進入二階，接近開花/長高。`;
  return `${plant.type}已達最終型態，準備收成。`;
}

function updatePlantDisplay() {
  if (!state.currentPlant) return;
  const stage = getStage(state.elapsedSeconds);
  elements.plantStageLabel.textContent = stage;
  
  // 根據階段獲取對應的 SVG 檔名
  let stageName = 'seedling';
  if (stage === '一階成長期') stageName = 'growth1';
  else if (stage === '二階成長期') stageName = 'growth2';
  else if (stage === '最終型態') stageName = 'final';
  
  elements.plantName.textContent = `${state.currentPlant.name}`;
  elements.plantDescription.textContent = getStageDescription(stage, state.currentPlant);
  elements.timerValue.textContent = formatTime(state.elapsedSeconds);

  elements.plantDisplay.innerHTML = '';
  
  // 如果植物有 path，則使用 SVG；否則使用預設
  if (state.currentPlant.path) {
    const icon = document.createElement('img');
    icon.src = `images/${state.currentPlant.path}-${stageName}.svg`;
    icon.alt = state.currentPlant.name;
    icon.className = 'plant-icon';
    icon.onerror = function() {
      // 如果圖片載入失敗，顯示文字
      this.style.display = 'none';
      const fallback = document.createElement('span');
      fallback.className = 'plant-icon';
      fallback.textContent = '🌱';
      elements.plantDisplay.appendChild(fallback);
    };
    
    // 根據階段添加不同的類名
    const stageClass = {
      '幼苗': 'stage-seedling',
      '一階成長期': 'stage-growth-1',
      '二階成長期': 'stage-growth-2',
      '最終型態': 'stage-final'
    }[stage];
    
    if (stageClass) {
      icon.classList.add(stageClass);
    }
    
    elements.plantDisplay.appendChild(icon);
  } else {
    // 舊數據備用方案
    const fallback = document.createElement('span');
    fallback.className = 'plant-icon stage-seedling';
    fallback.textContent = '🌱';
    fallback.style.fontSize = '2rem';
    elements.plantDisplay.appendChild(fallback);
  }

  if (stage === '最終型態') {
    elements.plantDisplay.classList.add('animate');
  } else {
    elements.plantDisplay.classList.remove('animate');
  }
}

function updateGardenSummaryLabel() {
  const user = getUserData(state.currentUser);
  if (!user) return;
  elements.gardenSummaryLabel.textContent = `已種 ${user.garden.filter(Boolean).length} 株`;
}

function saveState() {
  if (!state.currentUser) return;
  const user = getUserData(state.currentUser);
  if (!user) return;
  user.currentPlant = state.currentPlant;
  user.elapsedSeconds = state.elapsedSeconds;
  user.isRunning = state.isRunning;
  saveUsers();
}

function updateReminderDisplay() {
  if (!elements.reminderText) return;
  elements.reminderText.textContent = reminderMessages[state.reminderIndex % reminderMessages.length];
}

function nextReminder() {
  state.reminderIndex += 1;
  updateReminderDisplay();
}

function loadState() {
  const user = getUserData(state.currentUser);
  if (!user) return;
  state.currentPlant = user.currentPlant || createRandomPlant();
  state.elapsedSeconds = user.elapsedSeconds || 0;
  state.isRunning = false;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  setTimeout(() => elements.toast.classList.add('hidden'), 2800);
}

function showModal(title, message, onConfirm) {
  elements.modalTitle.textContent = title;
  elements.modalMessage.textContent = message;
  elements.modalOverlay.classList.remove('hidden');
  elements.modalConfirmBtn.onclick = () => {
    elements.modalOverlay.classList.add('hidden');
    if (typeof onConfirm === 'function') onConfirm();
  };
}

function setSyncStatus(message, type = 'info', sheetUrl = null) {
  if (!elements.syncStatus) return;
  if (sheetUrl) {
    elements.syncStatus.innerHTML = `${message} <a href="${sheetUrl}" target="_blank" style="color: #0066cc; text-decoration: underline; margin-left: 8px;">📊 查看 Sheet</a>`;
  } else {
    elements.syncStatus.textContent = message;
  }
  elements.syncStatus.className = `sync-status ${type}`;
}

function saveSyncSettings() {
  if (elements.gasUrl) {
    localStorage.setItem(GAS_URL_KEY, elements.gasUrl.value.trim());
  }
  if (elements.apiNote) {
    localStorage.setItem(API_NOTE_KEY, elements.apiNote.value);
  }
}

function loadSyncSettings() {
  if (elements.gasUrl) {
    elements.gasUrl.value = localStorage.getItem(GAS_URL_KEY) || '';
  }
  if (elements.apiNote) {
    elements.apiNote.value = localStorage.getItem(API_NOTE_KEY) || '';
  }
}

async function autoFillFromApi() {
  setSyncStatus('正在呼叫外部 API…', 'loading');

  try {
    const response = await fetch('https://www.boredapi.com/api/activity');
    if (!response.ok) throw new Error('API 回傳錯誤');
    const data = await response.json();
    const suggestion = data.activity ? `${data.activity}（${data.type || 'general'}）` : '';
    if (!suggestion) throw new Error('API 未回傳內容');
    elements.apiNote.value = suggestion;
    saveSyncSettings();
    setSyncStatus(`已自動填入：${suggestion}`, 'success');
  } catch (error) {
    try {
      const fallbackResponse = await fetch('https://api.adviceslip.com/advice');
      if (!fallbackResponse.ok) throw new Error('後備 API 回傳錯誤');
      const fallbackData = await fallbackResponse.json();
      const suggestion = fallbackData.slip?.advice || '';
      if (!suggestion) throw new Error('後備 API 未回傳內容');
      elements.apiNote.value = suggestion;
      saveSyncSettings();
      setSyncStatus(`已自動填入：${suggestion}`, 'success');
    } catch (fallbackError) {
      setSyncStatus(`無法取得 API 資料：${fallbackError.message}`, 'error');
    }
  }
}

async function syncToGoogleSheets(options = {}) {
  const gasUrl = elements.gasUrl?.value.trim();
  if (!gasUrl) {
    setSyncStatus('請先填入 Apps Script Web App URL。', 'error');
    return;
  }

  saveSyncSettings();
  const payload = SyncHelpers.buildSheetPayload({
    username: state.currentUser || '',
    plantName: options.plantName || state.currentPlant?.name || '',
    plantType: options.plantType || state.currentPlant?.type || '',
    stage: getStage(state.elapsedSeconds),
    elapsedSeconds: state.elapsedSeconds,
    apiSuggestion: elements.apiNote?.value.trim() || '',
    note: options.note || '',
    reminderText: options.reminderText || elements.reminderText?.textContent || '',
    recordDate: options.recordDate || new Date().toISOString().slice(0, 10)
  });

  setSyncStatus('正在同步到 Google Sheets…', 'loading');

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`同步失敗（${response.status}）`);
    }

    const result = await response.json().catch(() => null);
    setSyncStatus(result?.message || '資料已同步到 Google Sheets。', 'success', result?.sheetUrl);
  } catch (error) {
    setSyncStatus(`同步失敗：${error.message}`, 'error');
  }
}

function registerUser() {
  const username = elements.registerUser.value.trim();
  const password = elements.registerPass.value.trim();
  elements.registerError.textContent = '';

  if (!username || !password) {
    elements.registerError.textContent = '請輸入帳號與密碼。';
    return;
  }
  if (state.users[username]) {
    elements.registerError.textContent = '此帳號已存在，請更換帳號。';
    return;
  }

  state.users[username] = {
    password,
    garden: Array(56).fill(null),
    lastRefresh: new Date().toISOString(),
    weeklyPlantedCount: 0,
    weeklyReadingSeconds: 0,
    pendingSummary: null,
    currentPlant: createRandomPlant(),
    elapsedSeconds: 0
  };
  saveUsers();
  showToast('註冊成功，請登入。');
  elements.registerUser.value = '';
  elements.registerPass.value = '';
  toggleRegister(false);
}

function loginUser() {
  const username = elements.loginUser.value.trim();
  const password = elements.loginPass.value.trim();
  elements.loginError.textContent = '';

  if (!username || !password) {
    elements.loginError.textContent = '帳號與密碼不可為空。';
    return;
  }

  const user = state.users[username];
  if (!user || user.password !== password) {
    elements.loginError.textContent = '帳號或密碼錯誤。';
    return;
  }

  state.currentUser = username;
  saveCurrentUser(username);
  ensureUserData(username);
  loadState();
  showPage('main');
  elements.welcomeText.textContent = `歡迎，${username}`;
  updatePlantDisplay();
  updateGardenSummaryLabel();
  updateReminderDisplay();
  refreshGardenIfNeeded(false);
}

function toggleRegister(show) {
  elements.registerForm.classList.toggle('hidden', !show);
  elements.loginForm.classList.toggle('hidden', show);
  elements.loginError.textContent = '';
  elements.registerError.textContent = '';
}

function startTimer() {
  if (state.isHarvesting) return;
  if (state.isRunning) return;
  state.isRunning = true;
  elements.startBtn.textContent = '閱讀中';
  elements.startBtn.disabled = true;
  elements.pauseBtn.disabled = false;
  state.timer = setInterval(() => {
    state.elapsedSeconds += 1;
    updatePlantDisplay();
    if (state.elapsedSeconds >= 10800) {
      finishPlantGrowth();
    }
  }, 1000);
}

function pauseTimer() {
  state.isRunning = false;
  elements.startBtn.textContent = '開始';
  elements.startBtn.disabled = false;
  elements.pauseBtn.disabled = true;
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  saveState();
}

function resetTimer() {
  pauseTimer();
  state.elapsedSeconds = 0;
  updatePlantDisplay();
  saveState();
}

function finishPlantGrowth() {
  if (state.isHarvesting) return;
  state.isHarvesting = true;
  pauseTimer();
  const currentPlant = state.currentPlant;
  const user = getUserData(state.currentUser);
  if (!user) return;

  user.weeklyPlantedCount += 1;
  user.weeklyReadingSeconds += state.elapsedSeconds;
  saveUsers();
  void syncToGoogleSheets({
    plantName: currentPlant.name,
    plantType: currentPlant.type,
    note: `成長完成：${currentPlant.name}`
  });

  const harvestMessage = `恭喜！你的 ${currentPlant.name} 已長成最終型態，將種入花園。`;
  showModal('成長完成', harvestMessage, () => {
    addPlantToGarden(currentPlant);
    state.currentPlant = createRandomPlant();
    state.elapsedSeconds = 0;
    state.isHarvesting = false;
    updatePlantDisplay();
    updateGardenSummaryLabel();
    saveState();
    if (state.currentPage === 'garden') {
      renderGardenGrid();
      showToast('成長完成，已在花園中種植新植物！');
    }
  });
}

function addPlantToGarden(plant) {
  const user = getUserData(state.currentUser);
  if (!user) return;
  const emptyIndex = user.garden.indexOf(null);
  if (emptyIndex < 0) {
    showToast('花園已滿，暫時無法種植新植物。');
    return;
  }
  user.garden[emptyIndex] = plant;
  saveUsers();
}

function refreshGardenIfNeeded(immediateDisplay) {
  const user = getUserData(state.currentUser);
  if (!user) return;
  const last = new Date(user.lastRefresh).getTime();
  const now = Date.now();
  if (now - last < REFRESH_INTERVAL_MS) return;

  const summary = {
    count: user.weeklyPlantedCount,
    hours: Math.round((user.weeklyReadingSeconds / 3600) * 100) / 100
  };
  user.pendingSummary = summary;
  user.weeklyPlantedCount = 0;
  user.weeklyReadingSeconds = 0;
  user.lastRefresh = new Date().toISOString();
  saveUsers();

  if (immediateDisplay) {
    showModal('花園已更新', '你的花園已完成每週刷新，現在顯示本週結算。', () => {
      showSummary();
    });
  }
}

function showSummary() {
  const user = getUserData(state.currentUser);
  if (!user || !user.pendingSummary) return;
  const summary = user.pendingSummary;
  const message = `上週共種植 ${summary.count} 株植物，累積讀書 ${summary.hours} 小時。`;
  user.pendingSummary = null;
  saveUsers();
  showModal('本週花園結算', message, () => {});
}

function renderGardenGrid() {
  const user = getUserData(state.currentUser);
  if (!user) return;
  elements.gardenGrid.innerHTML = '';
  user.garden.forEach((plant, index) => {
    const cell = document.createElement('div');
    cell.className = 'garden-cell';
    if (plant) {
      const plantEl = document.createElement('div');
      plantEl.className = 'garden-plant';
      
      // 如果植物有 SVG 路徑，則顯示圖片；否則顯示預設內容
      if (plant.path) {
        const img = document.createElement('img');
        img.src = `images/${plant.path}-final.svg`;
        img.alt = plant.name;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.maxHeight = '50px';
        img.onerror = function() {
          // 如果圖片載入失敗，顯示植物名稱
          this.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.textContent = plant.name;
          fallback.style.color = '#2b4d27';
          fallback.style.fontSize = '0.8rem';
          plantEl.appendChild(fallback);
        };
        plantEl.appendChild(img);
      } else {
        // 舊數據：沒有 path，顯示名稱
        const nameOnly = document.createElement('div');
        nameOnly.textContent = plant.name;
        nameOnly.style.color = '#2b4d27';
        nameOnly.style.fontSize = '0.8rem';
        plantEl.appendChild(nameOnly);
      }
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = plant.name;
      plantEl.appendChild(nameSpan);
      cell.appendChild(plantEl);
    }
    elements.gardenGrid.appendChild(cell);
  });
}

function switchToGarden() {
  refreshGardenIfNeeded(true);
  renderGardenGrid();
  showPage('garden');
  const user = getUserData(state.currentUser);
  if (user && user.pendingSummary) {
    showSummary();
  }
}

function switchToMain() {
  showPage('main');
}

function logout() {
  pauseTimer();
  state.currentUser = null;
  localStorage.removeItem(CURRENT_USER_KEY);
  showPage('login');
  elements.loginUser.value = '';
  elements.loginPass.value = '';
}

function initialize() {
  loadUsers();
  loadSyncSettings();
  const username = loadCurrentUser();
  if (username) {
    state.currentUser = username;
    ensureUserData(username);
    loadState();
    elements.welcomeText.textContent = `歡迎，${username}`;
    updatePlantDisplay();
    updateGardenSummaryLabel();
    showPage('main');
    refreshGardenIfNeeded(false);
  } else {
    showPage('login');
  }

  elements.showRegister.addEventListener('click', (event) => {
    event.preventDefault();
    toggleRegister(true);
  });

  elements.showLogin.addEventListener('click', (event) => {
    event.preventDefault();
    toggleRegister(false);
  });

  elements.registerBtn.addEventListener('click', registerUser);
  elements.loginBtn.addEventListener('click', loginUser);
  elements.startBtn.addEventListener('click', startTimer);
  elements.pauseBtn.addEventListener('click', pauseTimer);
  elements.resetBtn.addEventListener('click', resetTimer);
  elements.gardenBtn.addEventListener('click', switchToGarden);
  elements.homeBtn.addEventListener('click', switchToMain);
  elements.logoutBtn.addEventListener('click', logout);
  elements.gasUrl.addEventListener('input', saveSyncSettings);
  elements.apiNote.addEventListener('input', saveSyncSettings);
  elements.fetchApiBtn.addEventListener('click', () => {
    void autoFillFromApi();
  });
  elements.syncGasBtn.addEventListener('click', () => {
    void syncToGoogleSheets({
      plantName: state.currentPlant?.name || '',
      plantType: state.currentPlant?.type || '',
      note: '手動同步'
    });
  });
  elements.nextReminderBtn.addEventListener('click', nextReminder);
  elements.modalConfirmBtn.addEventListener('click', () => {
    elements.modalOverlay.classList.add('hidden');
  });
  elements.pauseBtn.disabled = true;
  updateReminderDisplay();
  setSyncStatus(elements.gasUrl.value ? '已載入 GAS URL，可立即同步。' : '請先填入 GAS URL。', elements.gasUrl.value ? 'success' : 'info');
}

initialize();
