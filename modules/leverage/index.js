/**
 * 레버리지 계산기 모듈
 * 코인 선물 거래용 TP/SL 가격 계산
 */

/**
 * TP/SL 가격 계산
 * @param {number} entryPrice - 체결가
 * @param {number} leverage - 레버리지 배수
 * @param {number} lossPercent - 손실율 (%)
 * @param {'long' | 'short'} position - 포지션 방향
 * @returns {{ tp: number, sl: number }}
 */
export function calculateTPSL(entryPrice, leverage, lossPercent, position) {
  // 실제 가격 변동폭 = 체결가 × (손실율% / 레버리지 / 100)
  const priceChange = entryPrice * (lossPercent / leverage / 100);

  if (position === 'long') {
    // Long: 가격 상승 = 이익, 가격 하락 = 손실
    return {
      tp: entryPrice + priceChange,
      sl: entryPrice - priceChange
    };
  } else {
    // Short: 가격 하락 = 이익, 가격 상승 = 손실
    return {
      tp: entryPrice - priceChange,
      sl: entryPrice + priceChange
    };
  }
}

/**
 * 숫자를 천단위 구분자가 있는 문자열로 변환
 * @param {number} num - 숫자
 * @param {number} decimals - 소수점 자릿수 (기본: 자동)
 * @returns {string}
 */
export function formatPrice(num, decimals = null) {
  if (isNaN(num) || num === null || num === undefined) {
    return '-';
  }

  // 소수점 자릿수 자동 결정 (원본 가격의 소수점 자릿수 유지)
  if (decimals === null) {
    const str = num.toString();
    const decimalIndex = str.indexOf('.');
    decimals = decimalIndex === -1 ? 0 : Math.min(str.length - decimalIndex - 1, 8);
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * 입력값 유효성 검사
 * @param {number} entryPrice
 * @param {number} leverage
 * @param {number} lossPercent
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateInputs(entryPrice, leverage, lossPercent) {
  if (isNaN(entryPrice) || entryPrice <= 0) {
    return { valid: false, error: '체결가를 입력해주세요' };
  }
  if (isNaN(leverage) || leverage <= 0 || leverage > 125) {
    return { valid: false, error: '레버리지는 1~125 사이로 입력해주세요' };
  }
  if (isNaN(lossPercent) || lossPercent <= 0 || lossPercent > 100) {
    return { valid: false, error: '손실율은 1~100% 사이로 입력해주세요' };
  }
  return { valid: true };
}
