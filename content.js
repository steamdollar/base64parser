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
    return "오류: 디코딩에 실패했습니다.";
  }
}

// 백그라운드 스크립트로부터 메시지를 수신 대기
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "copy_to_clipboard") {
    // 클립보드에 복사
    navigator.clipboard.writeText(request.text).then(() => {
      showNotification("✓ 복사 완료!");
    }).catch(() => {
      showNotification("✗ 복사 실패");
    });
  } else if (request.action === "show_error") {
    // 에러 메시지 표시 (복사 없음)
    showNotification("✗ " + request.text);
  } else if (request.action === "get_selection_and_process") {
    // 선택된 텍스트 가져오기
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      // background.js로 선택된 텍스트 전달
      chrome.runtime.sendMessage({
        action: "process_base64",
        text: selectedText
      });
    }
  } else if (request.action === "showMermaidOverlay") {
    // 머메이드 차트 오버레이 표시
    showMermaidOverlay(request.imageUrl);
    sendResponse({ success: true });
    return true; // 비동기 응답을 위해 true 반환
  } else if (request.action === "get_selection_for_mermaid") {
    // 선택된 텍스트 가져오기 (Mermaid용)
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      // background.js로 선택된 텍스트 전달
      chrome.runtime.sendMessage({
        action: "process_mermaid",
        text: selectedText
      });
    }
  }
});

// 알림 메시지 표시 함수
function showNotification(message) {
  const oldNotification = document.getElementById('base64-decoder-notification');
  if (oldNotification) {
    oldNotification.remove();
  }

  const notification = document.createElement('div');
  notification.id = 'base64-decoder-notification';
  notification.textContent = message;
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    zIndex: '2147483647',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    fontWeight: 'bold'
  });

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 1500);
}

// 머메이드 차트 오버레이 표시 함수
function showMermaidOverlay(imageUrl) {
  // 기존 오버레이 제거
  const oldOverlay = document.getElementById('mermaid-chart-overlay');
  if (oldOverlay) {
    oldOverlay.remove();
  }

  // 오버레이 컨테이너 생성
  const overlay = document.createElement('div');
  overlay.id = 'mermaid-chart-overlay';

  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: '2147483646',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(5px)'
  });

  // 차트 컨테이너 생성
  const chartContainer = document.createElement('div');
  Object.assign(chartContainer.style, {
    position: 'relative',
    maxWidth: '98vw',
    maxHeight: '98vh',
    width: 'auto',
    height: 'auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '70px 40px 40px 40px', // 상단 패딩 증가 (버튼 공간)
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    overflow: 'auto',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    fontWeight: 'bold'
  });

  // 차트 이미지 생성
  const chartImage = document.createElement('img');
  chartImage.src = imageUrl;
  Object.assign(chartImage.style, {
    width: 'auto',
    height: 'auto',
    maxWidth: '100%',
    maxHeight: 'calc(98vh - 150px)', // 버튼과 패딩 공간 제외
    minWidth: '900px', // 최소 너비 증가
    minHeight: '600px', // 최소 높이 증가
    display: 'block',
    margin: '0 auto'
  });

  // 닫기 버튼 생성
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  Object.assign(closeButton.style, {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '50%',
    backgroundColor: '#ff4444',
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s'
  });

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.backgroundColor = '#cc0000';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.backgroundColor = '#ff4444';
  });

  closeButton.addEventListener('click', () => {
    overlay.remove();
  });

  // 다운로드 버튼 생성
  const downloadButton = document.createElement('button');
  downloadButton.textContent = '💾 다운로드';
  Object.assign(downloadButton.style, {
    position: 'absolute',
    top: '10px',
    left: '10px',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#2196F3',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  });

  downloadButton.addEventListener('mouseenter', () => {
    downloadButton.style.backgroundColor = '#1976D2';
  });

  downloadButton.addEventListener('mouseleave', () => {
    downloadButton.style.backgroundColor = '#2196F3';
  });

  downloadButton.addEventListener('click', () => {
    // 이미지 다운로드
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `mermaid-chart-${Date.now()}.png`;
    link.click();
  });

  // 요소 조립
  chartContainer.appendChild(closeButton);
  chartContainer.appendChild(downloadButton);
  chartContainer.appendChild(chartImage);
  overlay.appendChild(chartContainer);
  document.body.appendChild(overlay);

  // 오버레이 클릭 시 닫기 (차트 컨테이너 제외)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  // ESC 키로 닫기
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}