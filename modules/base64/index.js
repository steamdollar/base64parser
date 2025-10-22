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
