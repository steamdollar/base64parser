/**
 * 메모 관리 모듈 - K-V 형태의 메모 CRUD 기능
 */

import { getLocal, setLocal } from '../storage.js';

const STORAGE_KEY = 'savedMemos';

/**
 * 모든 메모 가져오기
 * @returns {Promise<Object>} 메모 객체 (key: title, value: content)
 */
export async function getAllMemos() {
  const result = await getLocal([STORAGE_KEY]);
  return result[STORAGE_KEY] || {};
}

/**
 * 특정 메모 가져오기
 * @param {string} title - 메모 제목
 * @returns {Promise<string|null>} 메모 내용 또는 null
 */
export async function getMemo(title) {
  const memos = await getAllMemos();
  return memos[title] || null;
}

/**
 * 메모 저장
 * @param {string} title - 메모 제목
 * @param {string} content - 메모 내용
 * @returns {Promise<boolean>} 성공 여부
 */
export async function saveMemo(title, content) {
  try {
    const memos = await getAllMemos();
    memos[title] = content;
    await setLocal({ [STORAGE_KEY]: memos });
    return true;
  } catch (error) {
    console.error('메모 저장 실패:', error);
    return false;
  }
}

/**
 * 메모 삭제
 * @param {string} title - 삭제할 메모 제목
 * @returns {Promise<boolean>} 성공 여부
 */
export async function deleteMemo(title) {
  try {
    const memos = await getAllMemos();
    if (!(title in memos)) {
      return false;
    }
    delete memos[title];
    await setLocal({ [STORAGE_KEY]: memos });
    return true;
  } catch (error) {
    console.error('메모 삭제 실패:', error);
    return false;
  }
}
