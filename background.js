// 모듈 import
import { decodeText, isImageBase64 } from './modules/base64/index.js';
import { isMermaidCode, renderMermaidChart } from './modules/mermaid/index.js';

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
          const decodedText = decodeText(selectedText);
          if (decodedText && !decodedText.startsWith("오류:")) {
            chrome.tabs.sendMessage(tab.id, {
              action: "copy_to_clipboard",
              text: decodedText
            }).catch(err => console.error('복사 메시지 전송 실패:', err));
          } else {
            chrome.tabs.sendMessage(tab.id, {
              action: "show_error",
              text: "디코딩 실패"
            }).catch(err => console.error('에러 메시지 표시 실패:', err));
          }
        }
      }
    });
  }
});

// Content script 재주입 함수
async function ensureContentScript(tabId) {
  try {
    // 먼저 메시지 전송 시도
    await chrome.tabs.sendMessage(tabId, { action: "ping" });
    return true;
  } catch (error) {
    // 실패하면 content script 재주입
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['libs/mermaid.min.js', 'content.js']
      });
      return true;
    } catch (injectError) {
      console.error('Content script 주입 실패:', injectError);
      return false;
    }
  }
}

// 단축키 명령어 리스너
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "decode-base64") {
    chrome.storage.sync.get(['isEnabled'], async (result) => {
      if (result.isEnabled) {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          if (tabs[0]) {
            const ready = await ensureContentScript(tabs[0].id);
            if (ready) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: "get_selection_and_process"
              }).catch(err => console.error('Base64 디코딩 메시지 전송 실패:', err));
            }
          }
        });
      }
    });
  } else if (command === "show-mermaid") {
    chrome.storage.sync.get(['isEnabled'], async (result) => {
      if (result.isEnabled) {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          if (tabs[0]) {
            const ready = await ensureContentScript(tabs[0].id);
            if (ready) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: "get_selection_for_mermaid"
              }).catch(err => console.error('Mermaid 메시지 전송 실패:', err));
            }
          }
        });
      }
    });
  }
});




// content.js로부터의 메시지를 처리하는 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    switch (request.action) {
      // Base64 처리 요청
      case "process_base64":
        const selectedText = request.text;
        const imageCheck = isImageBase64(selectedText);

        if (imageCheck.isImage) {
          openImageInNewTab(imageCheck.dataUrl);
        } else {
          const decodedText = decodeText(selectedText);
          if (decodedText && !decodedText.startsWith("오류:")) {
            chrome.tabs.sendMessage(sender.tab.id, { action: "copy_to_clipboard", text: decodedText })
              .catch(err => console.error('복사 메시지 전송 실패:', err));
          } else {
            chrome.tabs.sendMessage(sender.tab.id, { action: "show_error", text: "디코딩 실패" })
              .catch(err => console.error('에러 메시지 표시 실패:', err));
          }
        }
        break;

      // Mermaid 처리 요청
      case "process_mermaid":
        const mermaidText = request.text;
        if (isMermaidCode(mermaidText)) {
          chrome.tabs.sendMessage(sender.tab.id, { action: "showMermaidOverlay", mermaidCode: mermaidText })
            .catch(err => console.error('Mermaid 오버레이 표시 실패:', err));
        } else {
          chrome.tabs.sendMessage(sender.tab.id, { action: "show_error", text: "Mermaid 코드가 아닙니다" })
            .catch(err => console.error('에러 메시지 표시 실패:', err));
        }
        break;
    }
  })();
  
  return true; // 비동기 응답을 위해 true 반환
});