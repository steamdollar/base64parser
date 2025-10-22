// 모듈 import
import { base64ToUtf8, utf8ToBase64, isImageBase64 } from './modules/base64/index.js';
import { sendHttpRequest } from './modules/http/index.js';
import { openImageInNewTab, showResult, switchTab } from './modules/base64/ui.js';
import { SettingsManager } from './modules/settings.js';

document.addEventListener('DOMContentLoaded', () => {
  // 설정 관리자 초기화
  const settingsManager = new SettingsManager();
  
  // DOM 요소들 가져오기
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusText = document.getElementById('statusText');
  const base64Input = document.getElementById('base64Input');
  const decodeButton = document.getElementById('decodeButton');
  const encodeButton = document.getElementById('encodeButton');
  const requestMethod = document.getElementById('requestMethod');
  const requestUrl = document.getElementById('requestUrl');
  const requestHeaders = document.getElementById('requestHeaders');
  const requestBody = document.getElementById('requestBody');
  const sendRequestButton = document.getElementById('sendRequestButton');
  const resultDiv = document.getElementById('result');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  // 설정 관련 DOM 요소들
  const defaultUrl = document.getElementById('defaultUrl');
  const defaultMethod = document.getElementById('defaultMethod');
  const defaultHeaders = document.getElementById('defaultHeaders');
  const accessToken = document.getElementById('accessToken');
  const tokenName = document.getElementById('tokenName');
  const saveTokenButton = document.getElementById('saveTokenButton');
  const toggleTokenVisibility = document.getElementById('toggleTokenVisibility');
  const savedTokensList = document.getElementById('savedTokensList');
  const saveSettingsButton = document.getElementById('saveSettingsButton');
  const resetSettingsButton = document.getElementById('resetSettingsButton');

  // 설정 로드 및 초기화
  async function loadSettings() {
    const settings = await settingsManager.loadSettings();
    defaultUrl.value = settings.defaultUrl || '';
    defaultMethod.value = settings.defaultMethod || 'GET';
    defaultHeaders.value = settings.defaultHeaders || '{"Content-Type": "application/json"}';
    await loadSavedTokens();
    await applySettingsToFetch();
  }

  // 저장된 토큰 목록 로드
  async function loadSavedTokens() {
    const tokens = await settingsManager.getAllTokens();
    const defaultToken = await settingsManager.getDefaultToken();
    savedTokensList.innerHTML = '';
    
    for (const [name, token] of Object.entries(tokens)) {
      const tokenItem = document.createElement('div');
      tokenItem.className = 'token-item';
      const isDefault = name === defaultToken;
      tokenItem.innerHTML = `
        <span>${name} ${isDefault ? '(Default)' : ''}</span>
        <div>
          <button class="use-token-btn" data-token-name="${name}">Use</button>
          ${!isDefault ? `<button class="set-default-token-btn" data-token-name="${name}">Set Default</button>` : ''}
          <button class="delete-token-btn" data-token-name="${name}">Delete</button>
        </div>
      `;
      savedTokensList.appendChild(tokenItem);
    }
  }

  // 토큰 삭제 이벤트 위임
  savedTokensList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-token-btn')) {
      const tokenName = e.target.getAttribute('data-token-name');
      if (confirm(`Are you sure you want to delete the "${tokenName}" token?`)) {
        const success = await settingsManager.deleteToken(tokenName);
        if (success) {
          await loadSavedTokens();
          showResult(resultDiv, `✓ "${tokenName}" token has been deleted.`);
        } else {
          showResult(resultDiv, '✗ Failed to delete token.');
        }
      }
    } else if (e.target.classList.contains('use-token-btn')) {
      const tokenName = e.target.getAttribute('data-token-name');
      await useTokenInFetch(tokenName);
    } else if (e.target.classList.contains('set-default-token-btn')) {
      const tokenName = e.target.getAttribute('data-token-name');
      const success = await settingsManager.setDefaultToken(tokenName);
      if (success) {
        await loadSavedTokens();
        await applySettingsToFetch();
        showResult(resultDiv, `✓ "${tokenName}" token has been set as default.`);
      } else {
        showResult(resultDiv, '✗ Failed to set default token.');
      }
    }
  });

  // 토큰을 Fetch 탭에서 사용
  async function useTokenInFetch(tokenName) {
    const tokens = await settingsManager.getAllTokens();
    const tokenValue = tokens[tokenName];
    
    if (tokenValue) {
      // Fetch 탭으로 전환
      switchTab('fetch', tabButtons, tabPanels);
      
      // Authorization 헤더에 토큰 추가
      const formattedToken = settingsManager.formatTokenForHeader(tokenValue);
      const currentHeaders = requestHeaders.value.trim();
      
      let headers = {};
      if (currentHeaders) {
        try {
          headers = JSON.parse(currentHeaders);
        } catch (e) {
          headers = {};
        }
      }
      
      headers['Authorization'] = formattedToken;
      requestHeaders.value = JSON.stringify(headers, null, 2);
      
      showResult(resultDiv, `✓ "${tokenName}" token has been added to Authorization header.`);
    }
  }

  // 설정을 Fetch 탭에 적용
  async function applySettingsToFetch() {
    const settings = await settingsManager.loadSettings();
    if (settings.defaultUrl) {
      requestUrl.value = settings.defaultUrl;
    }
    if (settings.defaultMethod) {
      requestMethod.value = settings.defaultMethod;
    }
    
    // 기본 헤더와 기본 토큰을 결합
    let headers = {};
    if (settings.defaultHeaders) {
      try {
        headers = JSON.parse(settings.defaultHeaders);
      } catch (e) {
        headers = {};
      }
    }
    
    // 기본 토큰이 있으면 Authorization 헤더에 추가
    const defaultTokenValue = await settingsManager.getDefaultTokenValue();
    if (defaultTokenValue) {
      headers['Authorization'] = settingsManager.formatTokenForHeader(defaultTokenValue);
    }
    
    requestHeaders.value = JSON.stringify(headers, null, 2);
  }

  // 토글 스위치 초기화
  chrome.storage.sync.get(['isEnabled'], (result) => {
    const isEnabled = result.isEnabled !== undefined ? result.isEnabled : true; 
    toggleSwitch.checked = isEnabled;
    statusText.textContent = isEnabled ? 'On' : 'Off';
  });

  toggleSwitch.addEventListener('change', () => {
    const isEnabled = toggleSwitch.checked;
    chrome.storage.sync.set({ isEnabled: isEnabled }, () => {
      statusText.textContent = isEnabled ? 'On' : 'Off';
    });
  });

  // 설정 로드 실행
  loadSettings();

  // 탭 전환 기능
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      switchTab(targetTab, tabButtons, tabPanels);
    });
  });

  // 디코딩 버튼 클릭
  decodeButton.addEventListener('click', () => {
    const inputText = base64Input.value.trim();
    
    if (!inputText) {
      showResult(resultDiv, '⚠️ Please enter Base64 text.');
      return;
    }
    
    const imageCheck = isImageBase64(inputText);
    
    if (imageCheck.isImage) {
      // 이미지인 경우 새 탭에서 열기
      openImageInNewTab(imageCheck.dataUrl);
      showResult(resultDiv, '✓ Image opened in new tab!');
    } else {
      // 일반 텍스트 디코딩
      const decodedText = base64ToUtf8(inputText);
      if (decodedText) {
        showResult(resultDiv, `<strong>Decoded Result:</strong><div class="result-text">${decodedText}</div>`, true);
      } else {
        showResult(resultDiv, '✗ Decoding failed. Invalid Base64 format.');
      }
    }
  });

  // 인코딩 버튼 클릭
  encodeButton.addEventListener('click', () => {
    const inputText = base64Input.value.trim();
    
    if (!inputText) {
      showResult(resultDiv, '⚠️ Please enter text to encode.');
      return;
    }
    
    const encodedText = utf8ToBase64(inputText);
    if (encodedText) {
      showResult(resultDiv, `<strong>Encoded Result:</strong><div class="result-text">${encodedText}</div>`, true);
    } else {
      showResult(resultDiv, '✗ Encoding failed.');
    }
  });

  // HTTP 요청 버튼 클릭
  sendRequestButton.addEventListener('click', async () => {
    const url = requestUrl.value.trim();
    const method = requestMethod.value;
    const headersText = requestHeaders.value.trim();
    const bodyText = requestBody.value.trim();
    
    if (!url) {
      showResult(resultDiv, '⚠️ Please enter URL.');
      return;
    }
    
    let headers = {};
    if (headersText) {
      try {
        headers = JSON.parse(headersText);
      } catch (e) {
        showResult(resultDiv, '✗ Invalid header JSON format.');
        return;
      }
    }
    
    let body = null;
    if (bodyText && method !== 'GET') {
      try {
        JSON.parse(bodyText); // JSON 유효성 검사
        body = bodyText;
      } catch (e) {
        showResult(resultDiv, '✗ Invalid request body JSON format.');
        return;
      }
    }
    
    sendRequestButton.textContent = 'Sending...';
    sendRequestButton.disabled = true;
    
    const result = await sendHttpRequest(url, method, headers, body);
    
    sendRequestButton.textContent = 'Send Request';
    sendRequestButton.disabled = false;
    
    if (result.success) {
      const responseHtml = `
        <strong>Response Result:</strong>
        <div class="result-text">
          <strong>Status:</strong> ${result.status} ${result.statusText}
          <br><strong>Headers:</strong>
          <pre>${JSON.stringify(result.headers, null, 2)}</pre>
          <br><strong>Body:</strong>
          <pre>${result.body}</pre>
        </div>
      `;
      showResult(resultDiv, responseHtml, true);
    } else {
      showResult(resultDiv, `✗ Request failed: ${result.error}`);
    }
  });
  
  // Enter 키로도 디코딩
  base64Input.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      decodeButton.click();
    }
  });
  
  // 설정 관련 이벤트 핸들러들
  
  // 토큰 가시성 토글
  toggleTokenVisibility.addEventListener('click', () => {
    const isPassword = accessToken.type === 'password';
    accessToken.type = isPassword ? 'text' : 'password';
    toggleTokenVisibility.textContent = isPassword ? '🙈' : '👁️';
  });
  
  // 토큰 저장
  saveTokenButton.addEventListener('click', async () => {
    const tokenNameValue = tokenName.value.trim();
    const tokenValue = accessToken.value.trim();
    
    if (!tokenNameValue || !tokenValue) {
      showResult(resultDiv, '⚠️ Please enter both token name and value.');
      return;
    }
    
    const success = await settingsManager.saveToken(tokenNameValue, tokenValue);
    if (success) {
      showResult(resultDiv, `✓ "${tokenNameValue}" token has been saved.`);
      tokenName.value = '';
      accessToken.value = '';
      await loadSavedTokens();
    } else {
      showResult(resultDiv, '✗ Failed to save token.');
    }
  });
  
  // 설정 저장
  saveSettingsButton.addEventListener('click', async () => {
    const settings = {
      defaultUrl: defaultUrl.value.trim(),
      defaultMethod: defaultMethod.value,
      defaultHeaders: defaultHeaders.value.trim(),
      savedTokens: await settingsManager.getAllTokens()
    };
    
    const success = await settingsManager.saveSettings(settings);
    if (success) {
      showResult(resultDiv, '✓ Settings have been saved.');
      await applySettingsToFetch();
    } else {
      showResult(resultDiv, '✗ Failed to save settings.');
    }
  });
  
  // 설정 초기화
  resetSettingsButton.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all settings? All saved tokens will also be deleted.')) {
      const success = await settingsManager.resetSettings();
      if (success) {
        showResult(resultDiv, '✓ Settings have been reset.');
        await loadSettings();
      } else {
        showResult(resultDiv, '✗ Failed to reset settings.');
      }
    }
  });
});