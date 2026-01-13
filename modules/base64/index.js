// Base64URL을 Base64로 변환하는 함수
function base64URLToBase64(base64URL) {
  let base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
  // 패딩 추가
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return base64;
}

// Base64 디코딩 함수
export function base64ToUtf8(base64) {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch (e) {
    return null;
  }
}

// JWT 토큰인지 확인하고 디코딩하는 함수
function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  
  try {
    // Base64URL을 Base64로 변환 후 디코딩
    const header = base64ToUtf8(base64URLToBase64(parts[0]));
    const payload = base64ToUtf8(base64URLToBase64(parts[1]));
    
    if (!header || !payload) {
      return null;
    }
    
    // JSON 파싱 확인
    JSON.parse(header);
    JSON.parse(payload);
    
    return JSON.stringify({
      header: JSON.parse(header),
      payload: JSON.parse(payload),
      signature: parts[2]
    }, null, 2);
  } catch (e) {
    return null;
  }
}

// 텍스트 디코딩 (JWT 자동 감지)
export function decodeText(text) {
  // 1. JWT 토큰인지 확인
  const jwtResult = decodeJWT(text);
  if (jwtResult) {
    return jwtResult;
  }
  
  // 2. 일반 Base64 디코딩
  const base64Result = base64ToUtf8(text);
  if (base64Result) {
    return base64Result;
  }
  
  return "오류: 디코딩에 실패했습니다.";
}

// Base64 인코딩 함수
export function utf8ToBase64(text) {
  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    return btoa(String.fromCharCode(...bytes));
  } catch (e) {
    return null;
  }
}

// 이미지인지 판별하는 함수
export function isImageBase64(base64String) {
  if (base64String.startsWith('data:image/')) {
    return { isImage: true, dataUrl: base64String };
  }
  
  try {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < Math.min(binaryString.length, 12); i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return { isImage: true, dataUrl: `data:image/png;base64,${base64String}` };
    }
    
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return { isImage: true, dataUrl: `data:image/jpeg;base64,${base64String}` };
    }
    
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return { isImage: true, dataUrl: `data:image/gif;base64,${base64String}` };
    }
    
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return { isImage: true, dataUrl: `data:image/webp;base64,${base64String}` };
    }
  } catch (e) {
    // 디코딩 실패
  }
  
  return { isImage: false };
}
