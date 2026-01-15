// 모듈 import
import { base64ToUtf8, utf8ToBase64, isImageBase64, decodeText } from './modules/base64/index.js';
import { sendHttpRequest } from './modules/http/index.js';
import { openImageInNewTab, showResult, switchTab } from './modules/base64/ui.js';
import { SettingsManager } from './modules/settings.js';
import { renderMermaidChart, showMermaidOverlay, MERMAID_EXAMPLES } from './modules/mermaid/index.js';

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

    // 메모 관련 DOM 요소들
  const memoTitle = document.getElementById('memoTitle');
  const memoContent = document.getElementById('memoContent');
  const saveMemoButton = document.getElementById('saveMemoButton');
  const savedMemosList = document.getElementById('savedMemosList');
  const memoStatus = document.getElementById('memoStatus');

  // 머메이드 관련 DOM 요소들
  const mermaidCode = document.getElementById('mermaidCode');
  const renderMermaidButton = document.getElementById('renderMermaidButton');
  const showOverlayButton = document.getElementById('showOverlayButton');
  const mermaidExamples = document.getElementById('mermaidExamples');
  const mermaidPreview = document.getElementById('mermaidPreview');
  const mermaidImage = document.getElementById('mermaidImage');
  const mermaidStatus = document.getElementById('mermaidStatus');
  const clearMermaidPreview = document.getElementById('clearMermaidPreview');

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

  // 마지막 사용 탭 복원
  chrome.storage.local.get(['lastActiveTab'], (result) => {
    const lastTab = result.lastActiveTab || 'base64';
    switchTab(lastTab, tabButtons, tabPanels);
  });

  // 탭 전환 기능
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      switchTab(targetTab, tabButtons, tabPanels);
      // 마지막 사용 탭 저장
      chrome.storage.local.set({ lastActiveTab: targetTab });
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
      // 일반 텍스트 디코딩 (JWT 자동 감지)
      const decodedText = decodeText(inputText);
      if (decodedText && !decodedText.startsWith("오류:")) {
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
  
  // 메모 기능 (K-V 형태)
  
  // 저장된 메모 리스트 로드
  async function loadSavedMemos() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['savedMemos'], (result) => {
        const memos = result.savedMemos || {};
        savedMemosList.innerHTML = '';
        
        const memoKeys = Object.keys(memos);
        if (memoKeys.length === 0) {
          savedMemosList.innerHTML = '<div style="color: #999; font-size: 12px; padding: 8px;">No saved memos</div>';
          resolve();
          return;
        }
        
        for (const title of memoKeys) {
          const memoItem = document.createElement('div');
          memoItem.className = 'token-item';
          memoItem.innerHTML = `
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${memos[title]}">${title}</span>
            <div style="display: flex; gap: 3px;">
              <button class="copy-memo-btn use-token-btn" data-title="${title}">📋 Copy</button>
              <button class="delete-memo-btn delete-token-btn" data-title="${title}">🗑️</button>
            </div>
          `;
          savedMemosList.appendChild(memoItem);
        }
        resolve();
      });
    });
  }
  
  // 메모 저장
  saveMemoButton.addEventListener('click', () => {
    const title = memoTitle.value.trim();
    const content = memoContent.value.trim();
    
    if (!title || !content) {
      memoStatus.textContent = '⚠️ Please enter both title and content';
      memoStatus.style.color = '#ff6b6b';
      setTimeout(() => { memoStatus.style.color = '#666'; memoStatus.textContent = ''; }, 2000);
      return;
    }
    
    chrome.storage.local.get(['savedMemos'], (result) => {
      const memos = result.savedMemos || {};
      memos[title] = content;
      chrome.storage.local.set({ savedMemos: memos }, () => {
        memoStatus.textContent = `✓ "${title}" saved`;
        memoStatus.style.color = '#4CAF50';
        memoTitle.value = '';
        memoContent.value = '';
        loadSavedMemos();
        setTimeout(() => { memoStatus.style.color = '#666'; memoStatus.textContent = ''; }, 2000);
      });
    });
  });
  
  // 메모 리스트 이벤트 위임 (복사/삭제)
  savedMemosList.addEventListener('click', (e) => {
    const title = e.target.getAttribute('data-title');
    if (!title) return;
    
    if (e.target.classList.contains('copy-memo-btn')) {
      chrome.storage.local.get(['savedMemos'], (result) => {
        const memos = result.savedMemos || {};
        const content = memos[title];
        if (content) {
          navigator.clipboard.writeText(content).then(() => {
            memoStatus.textContent = `✓ "${title}" copied to clipboard`;
            memoStatus.style.color = '#4CAF50';
            setTimeout(() => { memoStatus.style.color = '#666'; memoStatus.textContent = ''; }, 2000);
          });
        }
      });
    } else if (e.target.classList.contains('delete-memo-btn')) {
      if (confirm(`Delete "${title}"?`)) {
        chrome.storage.local.get(['savedMemos'], (result) => {
          const memos = result.savedMemos || {};
          delete memos[title];
          chrome.storage.local.set({ savedMemos: memos }, () => {
            memoStatus.textContent = `✓ "${title}" deleted`;
            memoStatus.style.color = '#ff6b6b';
            loadSavedMemos();
            setTimeout(() => { memoStatus.style.color = '#666'; memoStatus.textContent = ''; }, 2000);
          });
        });
      }
    }
  });
  
  // 자동 저장 (Ctrl+S)
  memoContent.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveMemoButton.click();
    }
  });
  
  // 초기 메모 로드
  loadSavedMemos();

  // ===== 머메이드 차트 기능 =====

  // 머메이드 예제 선택
  mermaidExamples.addEventListener('change', () => {
    const selectedExample = mermaidExamples.value;
    if (selectedExample && MERMAID_EXAMPLES[selectedExample]) {
      mermaidCode.value = MERMAID_EXAMPLES[selectedExample];
      mermaidPreview.style.display = 'none';
    }
  });

  // 머메이드 차트 렌더링 (popup에서는 미리보기 비활성화)
  renderMermaidButton.addEventListener('click', async () => {
    const code = mermaidCode.value.trim();

    if (!code) {
      mermaidStatus.textContent = '⚠️ Mermaid 코드를 입력해주세요.';
      mermaidStatus.style.color = '#ff6b6b';
      setTimeout(() => { mermaidStatus.style.color = '#666'; mermaidStatus.textContent = ''; }, 2000);
      return;
    }

    mermaidStatus.textContent = '✓ 코드가 확인되었습니다. 오버레이 버튼을 눌러주세요.';
    mermaidStatus.style.color = '#4CAF50';
    setTimeout(() => { mermaidStatus.style.color = '#666'; mermaidStatus.textContent = ''; }, 2000);
  });

  // 오버레이로 표시
  showOverlayButton.addEventListener('click', async () => {
    const code = mermaidCode.value.trim();

    if (!code) {
      mermaidStatus.textContent = '⚠️ Mermaid 코드를 입력해주세요.';
      mermaidStatus.style.color = '#ff6b6b';
      setTimeout(() => { mermaidStatus.style.color = '#666'; mermaidStatus.textContent = ''; }, 2000);
      return;
    }

    showOverlayButton.textContent = '표시 중...';
    showOverlayButton.disabled = true;

    try {
      // 현재 활성 탭에 메시지 전송
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab && tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showMermaidOverlay',
          mermaidCode: code
        });

        mermaidStatus.textContent = '✓ 오버레이가 표시되었습니다.';
        mermaidStatus.style.color = '#4CAF50';
        setTimeout(() => { mermaidStatus.style.color = '#666'; mermaidStatus.textContent = ''; }, 2000);
      }
    } catch (error) {
      mermaidStatus.textContent = '✗ 페이지를 새로고침한 후 다시 시도해주세요.';
      mermaidStatus.style.color = '#ff6b6b';
      setTimeout(() => { mermaidStatus.style.color = '#666'; mermaidStatus.textContent = ''; }, 3000);
    }

    showOverlayButton.textContent = '📊 오버레이 표시';
    showOverlayButton.disabled = false;
  });

  // Ctrl+Enter로 렌더링
  mermaidCode.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      renderMermaidButton.click();
    }
  });

  // 미리보기 이미지 지우기
  clearMermaidPreview.addEventListener('click', () => {
    mermaidPreview.style.display = 'none';
    mermaidImage.src = '';
  });
});