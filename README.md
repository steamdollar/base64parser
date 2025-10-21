# Base64 디코더 크롬 확장 프로그램

선택한 Base64 텍스트를 자동으로 디코딩하고, 이미지인 경우 새 탭에서 표시하는 크롬 확장 프로그램입니다.

## 기능

### 🎯 자동 감지
- Base64 텍스트와 이미지를 자동으로 구분
- 이미지(PNG, JPEG, GIF, WebP)는 새 탭에서 표시
- 일반 텍스트는 디코딩 후 클립보드에 복사

### ⌨️ 다양한 사용 방법
1. **단축키**: 텍스트 선택 후 `Alt+Shift+D`
2. **우클릭 메뉴**: 텍스트 선택 후 우클릭 → "선택한 텍스트 Base64 디코딩 (복사)"
3. **플러그인 팝업**: 확장 아이콘 클릭 → 텍스트 입력 → 디코딩 버튼

### 🎛️ On/Off 토글
- 팝업에서 기능을 켜고 끌 수 있음
- 기본값: 켜짐

## 설치 방법

### Chrome / Brave / Edge
1. 이 저장소를 다운로드 또는 클론
2. `chrome://extensions/` (또는 `brave://extensions/`, `edge://extensions/`) 접속
3. 개발자 모드 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭
5. 다운로드한 폴더 선택

## 사용 예시

### 텍스트 디코딩
```
SGVsbG8gV29ybGQh
```
→ 선택 후 `Alt+Shift+D` → `Hello World!` 복사됨

### 이미지 표시
```
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
```
→ 선택 후 `Alt+Shift+D` → 새 탭에서 이미지 열림

## 지원 형식

- **이미지**: PNG, JPEG, GIF, WebP
- **텍스트**: UTF-8 인코딩된 모든 텍스트
- **Data URL**: `data:image/...;base64,...` 형식도 지원

## 단축키 변경

`brave://extensions/shortcuts` (또는 `chrome://extensions/shortcuts`)에서 원하는 키 조합으로 변경 가능합니다.

## 기술 스택

- Manifest V3
- Vanilla JavaScript
- Chrome Extension APIs

## 라이선스

MIT License

