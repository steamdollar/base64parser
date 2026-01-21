Technical Reference: YouTube Transcript Module Implementation
1. Reference: Manifest V3 Configuration (Incremental)
기존 manifest.json에 아래 설정을 병합하십시오.

JSON

{
  "permissions": [
    "storage",
    "scripting",
    "activeTab"
  ],
  "host_permissions": [
    "https://www.youtube.com/*",
    "https://www.google.com/api/timedtext*"
  ],
  "content_scripts": [
    {
      "matches": ["https://www.youtube.com/watch?v*"],
      "js": ["content/youtube-module.js"]
    }
  ]
}
2. Reference: Core Logic Snippets
2.1 Main World Data Extraction (content/youtube-module.js)
유튜브의 내부 상태값에 접근하기 위한 인젝션 및 메시징 로직입니다.

JavaScript

/**
 * 핵심: Isolated World의 제한을 우회하여 window 객체에 접근
 */
function getYoutubeMetadata() {
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      try {
        const playerResponse = window.ytInitialPlayerResponse;
        const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (tracks && tracks.length > 0) {
          // 최우선순위 자막 트랙의 baseUrl 전송
          window.postMessage({ type: 'YT_RAW_URL', url: tracks[0].baseUrl }, '*');
        } else {
          window.postMessage({ type: 'YT_ERROR', msg: 'No captions found' }, '*');
        }
      } catch (e) {
        window.postMessage({ type: 'YT_ERROR', msg: e.message }, '*');
      }
    })();
  `;
  document.documentElement.appendChild(script);
  script.remove();
}

// 팝업 요청 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "YT_TRANSCRIPT_REQ") {
    getYoutubeMetadata();

    const handleMessage = async (event) => {
      if (event.data.type === 'YT_RAW_URL') {
        window.removeEventListener('message', handleMessage);
        const transcript = await fetchAndParse(event.data.url);
        sendResponse({ status: "success", data: transcript });
      } else if (event.data.type === 'YT_ERROR') {
        window.removeEventListener('message', handleMessage);
        sendResponse({ status: "error", msg: event.data.msg });
      }
    };
    window.addEventListener('message', handleMessage);
    return true; // 비동기 응답 처리
  }
});
2.2 Transcript Parser (utils/transcript-parser.js)
json3 포맷을 정제된 평문으로 변환하는 유틸리티입니다.

JavaScript

/**
 * YouTube JSON3 포맷 파싱 및 HTML 엔티티 디코딩
 */
const parseTranscript = (jsonData) => {
  if (!jsonData.events) return "";

  return jsonData.events
    .filter(event => event.segs) // 자막 조각이 있는 이벤트만 필터링
    .map(event => {
      return event.segs
        .map(seg => seg.utf8)
        .join('')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    })
    .join(' ') // 단어 간 공백 결합
    .replace(/\s+/g, ' ') // 중복 공백 제거
    .trim();
};
3. Reference: Storage & UI Integration (popup/popup.js)
추출된 데이터를 임시 보관하고 클립보드에 복사하는 로직입니다.

JavaScript

// 팝업 로드 시 기존 데이터 복구
document.addEventListener('DOMContentLoaded', async () => {
  const saved = await chrome.storage.local.get(["yt_temp_data"]);
  if (saved.yt_temp_data) {
    document.getElementById('transcript-area').value = saved.yt_temp_data;
  }
});

// 추출 버튼 클릭 핸들러
async function onExtractClick() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { type: "YT_TRANSCRIPT_REQ" }, (response) => {
    if (response?.status === "success") {
      const text = response.data;
      // 1. UI 업데이트
      document.getElementById('transcript-area').value = text;
      // 2. 임시 저장 (Storage)
      chrome.storage.local.set({ "yt_temp_data": text });
    }
  });
}

// 클립보드 복사
function copyToClipboard() {
  const text = document.getElementById('transcript-area').value;
  navigator.clipboard.writeText(text).then(() => {
    showToast("복사 완료!");
  });
}
4. Engineering Edge Cases (에이전트 주의사항)
TimedText URL 유효성: 추출된 baseUrl은 일정 시간이 지나면 만료될 수 있습니다. 팝업을 열 때마다 혹은 버튼을 누를 때마다 새로 추출하도록 설계되었습니다.

Auto-generated Captions: 자동 생성 자막의 경우 tracks[0]에 해당 데이터가 위치하므로 동일한 로직으로 처리가 가능합니다.

UI Blocking: 자막 데이터가 매우 큰 경우(1시간 이상의 영상) fetch와 join 연산 시 메인 스레드가 차단되지 않도록 async/await를 철저히 사용해야 합니다.