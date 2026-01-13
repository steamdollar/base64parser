// Mermaid 차트 코드를 이미지로 변환하는 모듈

/**
 * UTF-8 문자열을 Base64로 안전하게 인코딩
 * @param {string} str - 인코딩할 문자열
 * @returns {string} Base64 인코딩된 문자열
 */
function utf8ToBase64(str) {
  // UTF-8 바이트로 변환 후 Base64 인코딩
  const utf8Bytes = new TextEncoder().encode(str);
  const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binaryString);
}

/**
 * Mermaid 차트 코드를 이미지 URL로 변환
 * @param {string} mermaidCode - Mermaid 차트 코드
 * @param {string} format - 이미지 포맷 ('svg' 또는 'png'), 기본값: 'svg'
 * @returns {Promise<{success: boolean, imageUrl?: string, error?: string}>}
 */
export async function renderMermaidChart(mermaidCode, format = 'svg') {
  try {
    // Mermaid 코드 유효성 검사
    if (!mermaidCode || !mermaidCode.trim()) {
      return { success: false, error: 'Mermaid 코드가 비어있습니다.' };
    }

    // Mermaid Live Editor API를 사용하여 이미지 생성
    // https://mermaid.ink/ 서비스 사용
    // SVG는 벡터 형식으로 확대해도 선명함
    const encoded = utf8ToBase64(mermaidCode.trim());
    const endpoint = format === 'svg' ? 'svg' : 'img';
    const imageUrl = `https://mermaid.ink/${endpoint}/${encoded}`;

    return {
      success: true,
      imageUrl: imageUrl
    };
  } catch (error) {
    return {
      success: false,
      error: `렌더링 실패: ${error.message}`
    };
  }
}

/**
 * 현재 활성 탭에 Mermaid 차트 오버레이 표시
 * @param {string} imageUrl - 차트 이미지 URL
 */
export async function showMermaidOverlay(imageUrl) {
  try {
    // 현재 활성 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      return { success: false, error: '활성 탭을 찾을 수 없습니다.' };
    }

    // content script가 로드되지 않은 경우를 대비하여 에러 처리
    try {
      // content script로 메시지 전송
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showMermaidOverlay',
        imageUrl: imageUrl
      });
      return { success: true };
    } catch (sendError) {
      // content script가 로드되지 않은 경우, 스크립트 주입 후 재시도
      if (sendError.message.includes('Receiving end does not exist')) {
        return {
          success: false,
          error: '페이지를 새로고침한 후 다시 시도해주세요.'
        };
      }
      throw sendError;
    }
  } catch (error) {
    return {
      success: false,
      error: `오버레이 표시 실패: ${error.message}`
    };
  }
}

/**
 * 텍스트가 Mermaid 차트 코드인지 확인
 * @param {string} text - 확인할 텍스트
 * @returns {boolean}
 */
export function isMermaidCode(text) {
  if (!text || !text.trim()) return false;

  const trimmed = text.trim();

  // Mermaid 차트 타입 키워드 확인
  const mermaidKeywords = [
    'graph ', 'flowchart ', 'sequenceDiagram', 'classDiagram',
    'stateDiagram', 'erDiagram', 'gantt', 'pie', 'journey',
    'gitGraph', 'mindmap', 'timeline', 'quadrantChart',
    'requirementDiagram', 'C4Context'
  ];

  // 첫 줄이 Mermaid 키워드로 시작하는지 확인
  const firstLine = trimmed.split('\n')[0].trim();
  return mermaidKeywords.some(keyword => firstLine.startsWith(keyword));
}

/**
 * Mermaid 코드 예제
 */
export const MERMAID_EXAMPLES = {
  flowchart: `graph TD
    A[시작] --> B{조건 확인}
    B -->|예| C[처리 1]
    B -->|아니오| D[처리 2]
    C --> E[종료]
    D --> E`,

  sequence: `sequenceDiagram
    participant A as 사용자
    participant B as 서버
    A->>B: 요청
    B-->>A: 응답`,

  gantt: `gantt
    title 프로젝트 일정
    dateFormat  YYYY-MM-DD
    section 개발
    기획          :a1, 2024-01-01, 7d
    개발          :a2, after a1, 14d
    테스트        :a3, after a2, 7d`,

  classDiagram: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog`
};
