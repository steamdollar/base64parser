// 모듈 import
import { base64ToUtf8, utf8ToBase64, isImageBase64 } from './modules/base64/index.js';
import { sendHttpRequest } from './modules/http/index.js';
import { openImageInNewTab, showResult, switchTab } from './modules/base64/ui.js';

document.addEventListener('DOMContentLoaded', () => {
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

  // 토글 스위치 초기화
  chrome.storage.sync.get(['isEnabled'], (result) => {
    const isEnabled = result.isEnabled !== undefined ? result.isEnabled : true; 
    toggleSwitch.checked = isEnabled;
    statusText.textContent = isEnabled ? '켜짐' : '꺼짐';
  });

  toggleSwitch.addEventListener('change', () => {
    const isEnabled = toggleSwitch.checked;
    chrome.storage.sync.set({ isEnabled: isEnabled }, () => {
      statusText.textContent = isEnabled ? '켜짐' : '꺼짐';
    });
  });

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
      showResult(resultDiv, '⚠️ Base64 텍스트를 입력해주세요.');
      return;
    }
    
    const imageCheck = isImageBase64(inputText);
    
    if (imageCheck.isImage) {
      // 이미지인 경우 새 탭에서 열기
      openImageInNewTab(imageCheck.dataUrl);
      showResult(resultDiv, '✓ 이미지를 새 탭에서 열었습니다!');
    } else {
      // 일반 텍스트 디코딩
      const decodedText = base64ToUtf8(inputText);
      if (decodedText) {
        showResult(resultDiv, `<strong>디코딩 결과:</strong><div class="result-text">${decodedText}</div>`, true);
      } else {
        showResult(resultDiv, '✗ 디코딩에 실패했습니다. 올바른 Base64 형식이 아닙니다.');
      }
    }
  });

  // 인코딩 버튼 클릭
  encodeButton.addEventListener('click', () => {
    const inputText = base64Input.value.trim();
    
    if (!inputText) {
      showResult(resultDiv, '⚠️ 인코딩할 텍스트를 입력해주세요.');
      return;
    }
    
    const encodedText = utf8ToBase64(inputText);
    if (encodedText) {
      showResult(resultDiv, `<strong>인코딩 결과:</strong><div class="result-text">${encodedText}</div>`, true);
    } else {
      showResult(resultDiv, '✗ 인코딩에 실패했습니다.');
    }
  });

  // HTTP 요청 버튼 클릭
  sendRequestButton.addEventListener('click', async () => {
    const url = requestUrl.value.trim();
    const method = requestMethod.value;
    const headersText = requestHeaders.value.trim();
    const bodyText = requestBody.value.trim();
    
    if (!url) {
      showResult(resultDiv, '⚠️ URL을 입력해주세요.');
      return;
    }
    
    let headers = {};
    if (headersText) {
      try {
        headers = JSON.parse(headersText);
      } catch (e) {
        showResult(resultDiv, '✗ 헤더 JSON 형식이 올바르지 않습니다.');
        return;
      }
    }
    
    let body = null;
    if (bodyText && method !== 'GET') {
      try {
        JSON.parse(bodyText); // JSON 유효성 검사
        body = bodyText;
      } catch (e) {
        showResult(resultDiv, '✗ 요청 본문 JSON 형식이 올바르지 않습니다.');
        return;
      }
    }
    
    sendRequestButton.textContent = '요청 중...';
    sendRequestButton.disabled = true;
    
    const result = await sendHttpRequest(url, method, headers, body);
    
    sendRequestButton.textContent = '요청 보내기';
    sendRequestButton.disabled = false;
    
    if (result.success) {
      const responseHtml = `
        <strong>응답 결과:</strong>
        <div class="result-text">
          <strong>상태:</strong> ${result.status} ${result.statusText}
          <br><strong>헤더:</strong>
          <pre>${JSON.stringify(result.headers, null, 2)}</pre>
          <br><strong>본문:</strong>
          <pre>${result.body}</pre>
        </div>
      `;
      showResult(resultDiv, responseHtml, true);
    } else {
      showResult(resultDiv, `✗ 요청 실패: ${result.error}`);
    }
  });
  
  // Enter 키로도 디코딩
  base64Input.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      decodeButton.click();
    }
  });
});