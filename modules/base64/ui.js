// 이미지를 새 탭에서 여는 함수
export function openImageInNewTab(dataUrl) {
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

// 결과 표시 함수
export function showResult(element, content, isHtml = false) {
  if (isHtml) {
    element.innerHTML = content;
  } else {
    element.textContent = content;
  }
  element.className = 'show';
}

// 탭 전환 함수
export function switchTab(targetTab, tabButtons, tabPanels) {
  // 모든 탭 버튼에서 active 클래스 제거
  tabButtons.forEach(btn => btn.classList.remove('active'));
  // 모든 탭 패널에서 active 클래스 제거
  tabPanels.forEach(panel => panel.classList.remove('active'));
  
  // 해당 탭 버튼에 active 클래스 추가
  const targetButton = Array.from(tabButtons).find(btn => btn.getAttribute('data-tab') === targetTab);
  if (targetButton) {
    targetButton.classList.add('active');
  }
  
  // 해당 탭 패널에 active 클래스 추가
  const targetPanel = document.getElementById(`${targetTab}-tab`);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }
}
