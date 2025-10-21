// 디코딩 함수
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
    return "오류: 디코딩에 실패했습니다.";
  }
}

// 이미지인지 판별하는 함수
function isImageBase64(base64String) {
  // 1. data:image로 시작하는지 체크
  if (base64String.startsWith('data:image/')) {
    return { isImage: true, dataUrl: base64String };
  }
  
  // 2. 순수 Base64인 경우 바이트 시그니처 체크
  try {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < Math.min(binaryString.length, 12); i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return { isImage: true, dataUrl: `data:image/png;base64,${base64String}` };
    }
    
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return { isImage: true, dataUrl: `data:image/jpeg;base64,${base64String}` };
    }
    
    // GIF: 47 49 46 38 (GIF8)
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return { isImage: true, dataUrl: `data:image/gif;base64,${base64String}` };
    }
    
    // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return { isImage: true, dataUrl: `data:image/webp;base64,${base64String}` };
    }
  } catch (e) {
    // 디코딩 실패하면 이미지가 아님
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

// 컨텍스트 메뉴 생성 함수
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "decode-selection",
      title: "선택한 텍스트 Base64 디코딩 (복사)",
      contexts: ["selection"]
    });
  });
}

// 확장 프로그램이 처음 설치될 때 실행
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ isEnabled: true });
  createContextMenu();
});

// service worker 시작될 때마다 메뉴 생성
createContextMenu();

// 오른쪽 클릭 메뉴가 클릭되었을 때 실행될 리스너
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "decode-selection" && info.selectionText) {
    chrome.storage.sync.get(['isEnabled'], (result) => {
      if (result.isEnabled) {
        const selectedText = info.selectionText.trim();
        const imageCheck = isImageBase64(selectedText);
        
        if (imageCheck.isImage) {
          // 이미지인 경우 새 탭에서 열기
          openImageInNewTab(imageCheck.dataUrl);
        } else {
          // 일반 텍스트인 경우 디코딩 후 복사
          const decodedText = base64ToUtf8(selectedText);
          if (decodedText && !decodedText.startsWith("오류:")) {
            chrome.tabs.sendMessage(tab.id, {
              action: "copy_to_clipboard",
              text: decodedText
            });
          } else {
            chrome.tabs.sendMessage(tab.id, {
              action: "show_error",
              text: "디코딩 실패"
            });
          }
        }
      }
    });
  }
});

// 단축키 명령어 리스너
chrome.commands.onCommand.addListener((command) => {
  if (command === "decode-base64") {
    chrome.storage.sync.get(['isEnabled'], (result) => {
      if (result.isEnabled) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "get_selection_and_process"
            });
          }
        });
      }
    });
  }
});

// content.js로부터 Base64 처리 요청 받기
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "process_base64") {
    const selectedText = request.text;
    const imageCheck = isImageBase64(selectedText);
    
    if (imageCheck.isImage) {
      // 이미지인 경우 새 탭에서 열기
      openImageInNewTab(imageCheck.dataUrl);
    } else {
      // 일반 텍스트인 경우 디코딩 후 복사
      const decodedText = base64ToUtf8(selectedText);
      if (decodedText && !decodedText.startsWith("오류:")) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "copy_to_clipboard",
          text: decodedText
        });
      } else {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "show_error",
          text: "디코딩 실패"
        });
      }
    }
  }
});