/**
 * Translation Module - MyMemory API
 * 무료 번역 API (일일 1000회 제한)
 */

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';
const MAX_TEXT_LENGTH = 500; // MyMemory 제한

/**
 * 텍스트 언어 감지 (간단한 휴리스틱)
 * @param {string} text
 * @returns {'ko' | 'en' | 'ja' | 'zh'}
 */
export function detectLanguage(text) {
  if (/[가-힣]/.test(text)) return 'ko';
  if (/[ひらがなカタカナ\u4e00-\u9faf]/.test(text) && /[ひらがなカタカナ]/.test(text)) return 'ja';
  if (/[\u4e00-\u9faf]/.test(text)) return 'zh';
  return 'en';
}

/**
 * 대상 언어 결정 (소스 언어에 따라)
 * @param {string} sourceLang
 * @returns {string}
 */
export function getTargetLanguage(sourceLang) {
  // 한국어면 영어로, 그 외는 한국어로
  return sourceLang === 'ko' ? 'en' : 'ko';
}

/**
 * MyMemory API로 번역
 * @param {string} text 번역할 텍스트
 * @param {string} sourceLang 소스 언어 (auto 시 자동 감지)
 * @param {string} targetLang 대상 언어
 * @returns {Promise<{success: boolean, translatedText?: string, error?: string}>}
 */
export async function translateText(text, sourceLang = 'auto', targetLang = 'ko') {
  if (!text || text.trim().length === 0) {
    return { success: false, error: '번역할 텍스트가 없습니다' };
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return { success: false, error: `텍스트가 너무 깁니다 (최대 ${MAX_TEXT_LENGTH}자)` };
  }

  // 소스 언어 자동 감지
  const detectedLang = sourceLang === 'auto' ? detectLanguage(text) : sourceLang;

  // 같은 언어면 번역 불필요
  if (detectedLang === targetLang) {
    targetLang = getTargetLanguage(detectedLang);
  }

  try {
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${detectedLang}|${targetLang}`;
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, error: `API 오류: ${response.status}` };
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return {
        success: true,
        translatedText: data.responseData.translatedText,
        sourceLang: detectedLang,
        targetLang: targetLang
      };
    }

    return {
      success: false,
      error: data.responseDetails || '번역 실패'
    };
  } catch (error) {
    return {
      success: false,
      error: `네트워크 오류: ${error.message}`
    };
  }
}

/**
 * 번역 가능 여부 확인
 * @param {string} text
 * @returns {boolean}
 */
export function isTranslatable(text) {
  return text && text.trim().length > 0 && text.length <= MAX_TEXT_LENGTH;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' }
];
