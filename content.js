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
  if (request.action === "ping") {
    // Content script 로드 확인용
    sendResponse({ status: "ready" });
    return true;
  } else if (request.action === "copy_to_clipboard") {
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
    // 머메이드 차트 오버레이 표시 (클라이언트 사이드 렌더링)
    showMermaidOverlay(request.mermaidCode);
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

// 머메이드 차트 오버레이 표시 함수 (클라이언트 사이드 렌더링)
async function showMermaidOverlay(mermaidCode) {
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
    maxWidth: '95vw',
    maxHeight: '95vh',
    minWidth: '750px',
    minHeight: '480px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '70px 40px 40px 40px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    overflow: 'auto',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    fontWeight: 'bold',
    boxSizing: 'border-box'
  });

  // Mermaid 렌더링 영역 생성
  const chartDiv = document.createElement('div');
  chartDiv.className = 'mermaid-chart-content';
  Object.assign(chartDiv.style, {
    width: '100%',
    minHeight: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '20px',
    boxSizing: 'border-box'
  });

  // Mermaid 초기화 및 렌더링
  if (typeof mermaid !== 'undefined') {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        flowchart: {
          htmlLabels: true,
          curve: 'basis'
        }
      });

      const id = 'mermaid-' + Date.now();

      // 콜백 방식 사용 (구버전 호환)
      try {
        mermaid.render(id, mermaidCode, (svgCode) => {
          chartDiv.innerHTML = svgCode;

          // SVG 크기 및 텍스트 처리
          const svgElement = chartDiv.querySelector('svg');
          if (svgElement) {
            // 원본 크기 보존
            const originalWidth = svgElement.getAttribute('width');
            const originalHeight = svgElement.getAttribute('height');

            // viewBox 설정
            if (!svgElement.getAttribute('viewBox') && originalWidth && originalHeight) {
              svgElement.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
            }

            // SVG 스타일 설정 - 크기 제한 제거
            svgElement.removeAttribute('width');
            svgElement.removeAttribute('height');
            svgElement.style.width = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.display = 'block';

            // 모든 텍스트 관련 요소에 CSS 주입
            const style = document.createElement('style');
            style.textContent = `
              #mermaid-chart-overlay svg * {
                overflow: visible !important;
              }
              #mermaid-chart-overlay .nodeLabel,
              #mermaid-chart-overlay .edgeLabel,
              #mermaid-chart-overlay text {
                overflow: visible !important;
              }
              #mermaid-chart-overlay foreignObject {
                overflow: visible !important;
              }
              #mermaid-chart-overlay foreignObject > div {
                overflow: visible !important;
                white-space: nowrap !important;
                text-overflow: clip !important;
              }
              #mermaid-chart-overlay .nodeLabel > span,
              #mermaid-chart-overlay .edgeLabel > span {
                white-space: nowrap !important;
              }
            `;
            chartContainer.appendChild(style);
          }
        });
      } catch (renderError) {
        chartDiv.innerHTML = `<p style="color: red;">렌더링 오류: ${renderError.message}</p>`;
        console.error('Mermaid 렌더링 오류:', renderError);
      }
    } catch (error) {
      chartDiv.innerHTML = `<p style="color: red;">초기화 오류: ${error.message}</p>`;
      console.error('Mermaid 초기화 오류:', error);
    }
  } else {
    chartDiv.innerHTML = `<p style="color: red;">Mermaid 라이브러리를 찾을 수 없습니다.</p>`;
  }

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
    // SVG 다운로드
    const svgElement = chartDiv.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mermaid-chart-${Date.now()}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
  });

  // 요소 조립
  chartContainer.appendChild(closeButton);
  chartContainer.appendChild(downloadButton);
  chartContainer.appendChild(chartDiv);
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