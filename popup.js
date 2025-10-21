// Base64 디코딩 함수
function base64ToUtf8(base64) {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch (e) {
    return null;
  }
}

// 이미지인지 판별하는 함수
function isImageBase64(base64String) {
  if (base64String.startsWith('data:image/')) {
    return { isImage: true, dataUrl: base64String };
  }
  
  try {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < Math.min(binaryString.length, 12); i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return { isImage: true, dataUrl: `data:image/png;base64,${base64String}` };
    }
    
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return { isImage: true, dataUrl: `data:image/jpeg;base64,${base64String}` };
    }
    
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return { isImage: true, dataUrl: `data:image/gif;base64,${base64String}` };
    }
    
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return { isImage: true, dataUrl: `data:image/webp;base64,${base64String}` };
    }
  } catch (e) {
    // 디코딩 실패
  }
  
  return { isImage: false };
}

// 이미지를 새 탭에서 여는 함수
function openImageInNewTab(dataUrl) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Base64 Image</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          background: #2b2b2b;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        img {
          max-width: 100%;
          max-height: 100vh;
          object-fit: contain;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
      </style>
    </head>
    <body>
      <img src="${dataUrl}" alt="Decoded Image">
    </body>
    </html>
  `;
  
  const blob = new Blob([html], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  chrome.tabs.create({ url: blobUrl });
}

document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusText = document.getElementById('statusText');
  const base64Input = document.getElementById('base64Input');
  const decodeButton = document.getElementById('decodeButton');
  const resultDiv = document.getElementById('result');

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

  // 디코딩 버튼 클릭
  decodeButton.addEventListener('click', () => {
    const inputText = base64Input.value.trim();
    
    if (!inputText) {
      resultDiv.textContent = '⚠️ Base64 텍스트를 입력해주세요.';
      resultDiv.className = 'show';
      return;
    }
    
    const imageCheck = isImageBase64(inputText);
    
    if (imageCheck.isImage) {
      // 이미지인 경우 새 탭에서 열기
      openImageInNewTab(imageCheck.dataUrl);
      resultDiv.textContent = '✓ 이미지를 새 탭에서 열었습니다!';
      resultDiv.className = 'show';
    } else {
      // 일반 텍스트 디코딩
      const decodedText = base64ToUtf8(inputText);
      if (decodedText) {
        resultDiv.innerHTML = `<strong>디코딩 결과:</strong><div class="result-text">${decodedText}</div>`;
        resultDiv.className = 'show';
      } else {
        resultDiv.textContent = '✗ 디코딩에 실패했습니다. 올바른 Base64 형식이 아닙니다.';
        resultDiv.className = 'show';
      }
    }
  });
  
  // Enter 키로도 디코딩
  base64Input.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      decodeButton.click();
    }
  });
});