/**
 * Chrome Storage API를 async/await로 래핑한 헬퍼 모듈
 */

/**
 * chrome.storage.sync에서 데이터 가져오기
 * @param {string|string[]} keys - 가져올 키 또는 키 배열
 * @returns {Promise<Object>} 저장된 데이터
 */
export async function getSync(keys) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result);
    });
  });
}

/**
 * chrome.storage.sync에 데이터 저장
 * @param {Object} data - 저장할 데이터 객체
 * @returns {Promise<void>}
 */
export async function setSync(data) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, () => {
      resolve();
    });
  });
}

/**
 * chrome.storage.local에서 데이터 가져오기
 * @param {string|string[]} keys - 가져올 키 또는 키 배열
 * @returns {Promise<Object>} 저장된 데이터
 */
export async function getLocal(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => {
      resolve(result);
    });
  });
}

/**
 * chrome.storage.local에 데이터 저장
 * @param {Object} data - 저장할 데이터 객체
 * @returns {Promise<void>}
 */
export async function setLocal(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}
