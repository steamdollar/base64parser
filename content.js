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

// Mac 환경에서 Option+Q (Alt+Q) 단축키가 특수기호(œ) 등 입력기로 전용되어 
// chrome.commands 가 무시되는 이슈를 해결하기 위한 전역 Fallback 로직
document.addEventListener('keydown', (e) => {
  // 사용자가 폼 요소에 타이핑 중일 때는 단축키 무시
  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  const isEditable = document.activeElement ? document.activeElement.isContentEditable : false;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || isEditable) {
    return;
  }

  // Alt(Option) 키가 눌린 상태에서 키 코드가 'KeyQ' 또는 문자 'q', 'œ' 가 입력된 경우
  if (e.altKey && (e.code === 'KeyQ' || e.key.toLowerCase() === 'q' || e.key === 'œ')) {
    e.preventDefault();
    
    // 선택된 텍스트 가져오기
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
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

// ===== Mermaid 오버레이 관련 상수 및 헬퍼 함수들 =====

const OVERLAY_Z_INDEX = 2147483646;
const BUTTON_Z_INDEX = 2147483647;

const COLORS = {
  closeButton: '#ff4444',
  closeButtonHover: '#cc0000',
  downloadButton: '#2196F3',
  downloadButtonHover: '#1976D2',
  error: 'red'
};

// 오버레이 요소 생성
function createOverlayElement() {
  const overlay = document.createElement('div');
  overlay.id = 'mermaid-chart-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: String(OVERLAY_Z_INDEX),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(5px)'
  });
  return overlay;
}

// 차트 컨테이너 생성
function createChartContainer() {
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'relative',
    maxWidth: '75vw',
    maxHeight: '75vh',
    minWidth: '750px',
    minHeight: '600px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '70px 40px 40px 40px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    overflow: 'auto',
    fontFamily: 'Arial, sans-serif',
    fontSize: '20px',
    fontWeight: 'bold',
    boxSizing: 'border-box'
  });
  return container;
}

// Mermaid 렌더링 영역 생성
function createChartDiv() {
  const chartDiv = document.createElement('div');
  chartDiv.className = 'mermaid-chart-content';
  Object.assign(chartDiv.style, {
    width: 'max-content',
    minWidth: '100%',
    minHeight: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: '20px',
    boxSizing: 'border-box'
  });
  return chartDiv;
}

// 오버레이 버튼 생성 (공용)
function createOverlayButton(config) {
  const button = document.createElement('button');
  button.textContent = config.text;
  Object.assign(button.style, {
    position: 'absolute',
    top: '10px',
    border: 'none',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ...config.style
  });

  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = config.hoverColor;
  });
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = config.color;
  });

  return button;
}

// SVG 스타일 처리
function processSvgElement(svgElement, chartContainer) {
  const originalWidth = svgElement.getAttribute('width');
  const originalHeight = svgElement.getAttribute('height');

  // viewBox에서 실제 픽셀 차원 추출 (Mermaid가 width="100%"를 적용하는 경우 대비)
  const viewBox = svgElement.getAttribute('viewBox');
  let viewWidth = originalWidth;
  let viewHeight = originalHeight;

  if (viewBox) {
    const pts = viewBox.split(/[\s,]+/);
    if (pts.length === 4) {
      viewWidth = pts[2];
      viewHeight = pts[3];
    }
  }

  // 컨테이너 높이에 맞춰 비례 확대로 세로 공간 채우기
  if (chartContainer && viewHeight) {
    const containerHeight = chartContainer.clientHeight - 120; // 패딩(70+40) 및 여유분 고려
    const vHeight = parseFloat(viewHeight);
    const vWidth = parseFloat(viewWidth);

    // 차트가 컨테이너보다 작을 경우에만 확대
    if (vHeight < containerHeight) {
      const ratio = containerHeight / vHeight;
      viewHeight = containerHeight;
      viewWidth = vWidth * ratio;
    }
  }

  // 계산된 크기(px)를 스타일로 적용하여 자동 축소 방지 (!important로 강제 적용)
  if (viewHeight) {
    const heightVal = String(viewHeight).endsWith('px') ? viewHeight : `${viewHeight}px`;
    svgElement.style.setProperty('height', heightVal, 'important');
  }
  if (viewWidth) {
    const widthVal = String(viewWidth).endsWith('px') ? viewWidth : `${viewWidth}px`;
    svgElement.style.setProperty('width', widthVal, 'important');
    svgElement.style.setProperty('min-width', widthVal, 'important');
  }

  svgElement.style.display = 'block';
  svgElement.style.setProperty('max-width', 'none', 'important'); // 가로 제한 강제 해제
  svgElement.style.flexShrink = '0'; // Flexbox 환경에서 축소 방지

  const style = document.createElement('style');
  style.textContent = `
    #mermaid-chart-overlay svg * { overflow: visible !important; }
    #mermaid-chart-overlay .nodeLabel,
    #mermaid-chart-overlay .edgeLabel,
    #mermaid-chart-overlay text { overflow: visible !important; }
    #mermaid-chart-overlay foreignObject { overflow: visible !important; }
    #mermaid-chart-overlay foreignObject > div {
      overflow: visible !important;
      white-space: nowrap !important;
      text-overflow: clip !important;
    }
    #mermaid-chart-overlay .nodeLabel > span,
    #mermaid-chart-overlay .edgeLabel > span { white-space: nowrap !important; }
  `;
  chartContainer.appendChild(style);
}

// Mermaid 차트 렌더링
function renderMermaidToDiv(mermaidCode, chartDiv, chartContainer) {
  if (typeof mermaid === 'undefined') {
    chartDiv.innerHTML = `<p style="color: ${COLORS.error};">Mermaid 라이브러리를 찾을 수 없습니다.</p>`;
    return;
  }

  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      flowchart: { htmlLabels: true, curve: 'basis' }
    });

    const id = 'mermaid-' + Date.now();

    try {
      mermaid.render(id, mermaidCode, (svgCode) => {
        chartDiv.innerHTML = svgCode;
        const svgElement = chartDiv.querySelector('svg');
        if (svgElement) {
          processSvgElement(svgElement, chartContainer);
        }
      });
    } catch (renderError) {
      chartDiv.innerHTML = `<p style="color: ${COLORS.error};">렌더링 오류: ${renderError.message}</p>`;
      console.error('Mermaid 렌더링 오류:', renderError);
    }
  } catch (error) {
    chartDiv.innerHTML = `<p style="color: ${COLORS.error};">초기화 오류: ${error.message}</p>`;
    console.error('Mermaid 초기화 오류:', error);
  }
}

// SVG 다운로드
function downloadSvg(chartDiv) {
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
}

// 오버레이 이벤트 설정
function setupOverlayEvents(overlay, chartContainer) {
  // 오버레이 바깥 클릭 시 닫기
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

  // 마우스 휠로 가로 스크롤 가능하게 처리 (세로 스크롤이 없을 때만)
  if (chartContainer) {
    chartContainer.addEventListener('wheel', (e) => {
      const isHorizontalOverflow = chartContainer.scrollWidth > chartContainer.clientWidth;
      const isVerticalOverflow = chartContainer.scrollHeight > chartContainer.clientHeight;

      // 수직 스크롤이 없고 가로 스크롤만 있을 때만 휠을 가로로 전환
      if (e.deltaY !== 0 && isHorizontalOverflow && !isVerticalOverflow) {
        e.preventDefault();
        chartContainer.scrollLeft += e.deltaY;
      }
      // 세로 스크롤이 있는 경우에는 브라우저 기본 동작(수직 스크롤)을 따름
    }, { passive: false });
  }
}

// 머메이드 차트 오버레이 표시 함수 (메인)
async function showMermaidOverlay(mermaidCode) {
  // 기존 오버레이 제거
  const oldOverlay = document.getElementById('mermaid-chart-overlay');
  if (oldOverlay) {
    oldOverlay.remove();
  }

  // 요소 생성
  const overlay = createOverlayElement();
  const chartContainer = createChartContainer();
  const chartDiv = createChartDiv();

  // Mermaid 렌더링
  renderMermaidToDiv(mermaidCode, chartDiv, chartContainer);

  // 닫기 버튼
  const closeButton = createOverlayButton({
    text: '✕',
    color: COLORS.closeButton,
    hoverColor: COLORS.closeButtonHover,
    style: {
      right: '10px',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: COLORS.closeButton,
      fontSize: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  });
  closeButton.addEventListener('click', () => overlay.remove());

  // 다운로드 버튼
  const downloadButton = createOverlayButton({
    text: '💾 다운로드',
    color: COLORS.downloadButton,
    hoverColor: COLORS.downloadButtonHover,
    style: {
      left: '10px',
      padding: '8px 16px',
      borderRadius: '6px',
      backgroundColor: COLORS.downloadButton,
      fontSize: '14px'
    }
  });
  downloadButton.addEventListener('click', () => downloadSvg(chartDiv));

  // 요소 조립
  chartContainer.appendChild(closeButton);
  chartContainer.appendChild(downloadButton);
  chartContainer.appendChild(chartDiv);
  overlay.appendChild(chartContainer);
  document.body.appendChild(overlay);

  // 이벤트 설정
  setupOverlayEvents(overlay, chartContainer);
}