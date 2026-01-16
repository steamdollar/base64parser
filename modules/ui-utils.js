/**
 * UI 유틸리티 함수
 */

import { COLORS, TIMING } from './constants.js';

/**
 * 상태 메시지 표시
 * @param {HTMLElement} element - 메시지를 표시할 요소
 * @param {string} message - 표시할 메시지
 * @param {'success'|'error'|'warning'|'muted'} type - 메시지 타입
 * @param {number} duration - 표시 시간 (밀리초)
 */
export function showStatusMessage(element, message, type = 'muted', duration = TIMING.statusMessageDuration) {
  element.textContent = message;
  element.style.color = COLORS[type] || COLORS.muted;

  setTimeout(() => {
    element.style.color = COLORS.muted;
    element.textContent = '';
  }, duration);
}
