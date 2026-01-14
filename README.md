# Context Decoder - 개발자 통합 도구 크롬 확장 프로그램

Base64 인코딩/디코딩, HTTP API 테스트, Mermaid 차트 시각화, 메모 관리 등 다양한 개발자 도구를 제공하는 크롬 확장 프로그램입니다.

## 주요 기능

### 1. 📦 Base64 인코딩/디코딩
- **Base64 디코딩**: Base64 텍스트를 UTF-8로 변환
- **Base64 인코딩**: 일반 텍스트를 Base64로 변환
- **JWT 토큰 자동 파싱**: JWT 형식 자동 감지 및 헤더/페이로드 추출
- **이미지 자동 인식**: PNG, JPEG, GIF, WebP 이미지를 새 탭에서 표시
- **Data URL 지원**: `data:image/...;base64,...` 형식 자동 처리

#### 사용 방법
1. **단축키**: 텍스트 선택 후 `Alt+Shift+D`
2. **우클릭 메뉴**: 텍스트 선택 후 우클릭 → "선택한 텍스트 Base64 디코딩 (복사)"
3. **플러그인 팝업**: Base64 탭에서 텍스트 입력 → 디코드/인코드 버튼

### 2. 🌐 HTTP API 테스트
- **HTTP 메서드 지원**: GET, POST, PUT, DELETE, PATCH
- **커스텀 헤더**: JSON 형식으로 헤더 설정
- **요청 바디**: JSON 바디 전송
- **토큰 자동 추가**: 저장된 기본 토큰을 헤더에 자동 추가
- **응답 표시**: 상태 코드, 헤더, 바디를 상세하게 표시
- **기본값 설정**: 자주 사용하는 URL, 메서드, 헤더 저장

### 3. 📊 Mermaid 차트 시각화
- **다이어그램 타입 지원**:
  - Flowchart (플로우차트)
  - Sequence Diagram (시퀀스 다이어그램)
  - Class Diagram (클래스 다이어그램)
  - State Diagram (상태 다이어그램)
  - ER Diagram (ERD)
  - Gantt Chart (간트 차트)
  - Pie Chart (파이 차트)
  - Git Graph, Mindmap, Timeline 등
- **클라이언트 사이드 렌더링**: 로컬에서 SVG 생성
- **오버레이 표시**: 현재 웹 페이지에 차트를 오버레이로 표시
- **예제 제공**: 다양한 다이어그램 예제
- **단축키**: 선택한 Mermaid 코드에서 `Alt+Q`로 오버레이 표시
- **SVG 다운로드**: 렌더링된 차트를 SVG 파일로 저장

### 4. 📝 메모 관리 (K-V 시스템)
- **키-값 저장**: 제목과 내용으로 메모 저장
- **로컬 저장**: Chrome Local Storage에 안전하게 저장
- **복사 기능**: 저장된 메모를 클립보드로 복사
- **삭제 기능**: 불필요한 메모 삭제
- **단축키**: `Ctrl+S`로 메모 저장

### 5. ⚙️ 설정 및 토큰 관리
- **기본 설정 저장**:
  - 기본 URL
  - 기본 HTTP 메서드
  - 기본 헤더
- **토큰 관리**:
  - 여러 토큰 저장 및 관리
  - 토큰 이름 지정
  - 기본 토큰 설정
  - Bearer 토큰 자동 포맷팅
  - 토큰 가시성 토글 (보안)
- **동기화**: Chrome Storage Sync를 통한 설정 동기화

### 6. 🎛️ On/Off 토글
- 팝업에서 확장 기능을 켜고 끌 수 있음
- 기본값: 켜짐

## 설치 방법

### Chrome / Brave / Edge
1. 이 저장소를 다운로드 또는 클론
2. `chrome://extensions/` (또는 `brave://extensions/`, `edge://extensions/`) 접속
3. 개발자 모드 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭
5. 다운로드한 폴더 선택

## 사용 예시

### 1. Base64 텍스트 디코딩
```
SGVsbG8gV29ybGQh
```
→ 선택 후 `Alt+Shift+D` → `Hello World!` 클립보드에 복사됨

### 2. JWT 토큰 디코딩
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.Xmj...
```
→ 팝업의 Base64 탭에서 자동으로 헤더와 페이로드 파싱

### 3. Base64 이미지 표시
```
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
```
→ 선택 후 `Alt+Shift+D` → 새 탭에서 이미지 열림

### 4. HTTP API 요청
Fetch 탭에서:
- URL: `https://api.example.com/users`
- 메서드: GET
- 헤더: `{"Authorization": "Bearer your-token"}`
→ Send Request 클릭 → 응답 표시

### 5. Mermaid 차트 렌더링
Mermaid 탭 또는 웹 페이지에서 Mermaid 코드 선택:
```
graph TD
    A[Start] --> B[Process]
    B --> C[End]
```
→ `Alt+Q` 또는 팝업에서 렌더링 → 오버레이로 차트 표시

### 6. 메모 저장
Memo 탭에서:
- 제목: `API 엔드포인트`
- 내용: `https://api.example.com/v1`
→ 저장 버튼 클릭 → 나중에 복사 버튼으로 빠르게 사용

## 지원 형식

- **이미지**: PNG, JPEG, GIF, WebP
- **텍스트**: UTF-8 인코딩된 모든 텍스트
- **Data URL**: `data:image/...;base64,...` 형식
- **JWT**: JSON Web Token 자동 파싱
- **HTTP**: GET, POST, PUT, DELETE, PATCH
- **Mermaid**: 모든 Mermaid 다이어그램 타입

## 단축키

| 기능 | 단축키 | 설명 |
|------|--------|------|
| Base64 디코딩 | `Alt+Shift+D` | 선택한 텍스트를 Base64 디코딩 |
| Mermaid 오버레이 | `Alt+Q` | 선택한 Mermaid 코드를 오버레이로 표시 |
| Base64 디코드 (팝업) | `Ctrl+Enter` | Base64 탭에서 디코드 실행 |
| Mermaid 렌더링 (팝업) | `Ctrl+Enter` | Mermaid 탭에서 렌더링 실행 |
| 메모 저장 (팝업) | `Ctrl+S` | Memo 탭에서 메모 저장 |

단축키 변경: `chrome://extensions/shortcuts` (또는 `brave://extensions/shortcuts`)에서 수정 가능합니다.

## 기술 스택

- **Chrome Extension**: Manifest V3
- **언어**: Vanilla JavaScript (모듈화)
- **Chrome APIs**:
  - Storage API (Local & Sync)
  - Context Menus API
  - Commands API (단축키)
  - Tabs API
  - Runtime Messaging
- **외부 라이브러리**:
  - Mermaid.js (클라이언트 사이드 차트 렌더링)

## 프로젝트 구조

```
base64parser/
├── manifest.json              # 확장 프로그램 설정
├── popup.html                 # 메인 UI
├── popup.js                   # UI 로직 및 탭 관리
├── background.js              # 백그라운드 서비스 워커
├── content.js                 # 콘텐츠 스크립트
├── libs/
│   └── mermaid.min.js        # Mermaid 라이브러리
├── modules/
│   ├── base64/
│   │   ├── index.js          # Base64 인코딩/디코딩 로직
│   │   └── ui.js             # UI 유틸리티
│   ├── http/
│   │   └── index.js          # HTTP 요청 모듈
│   ├── mermaid/
│   │   └── index.js          # Mermaid 차트 렌더링
│   └── settings.js           # 설정 및 토큰 관리
└── images/
    ├── icon48.png
    └── icon128.png
```

## 개발 가이드

### 모듈 추가하기
1. `modules/` 폴더에 새 모듈 생성
2. `popup.html`에 탭 추가
3. `popup.js`에서 탭 이벤트 핸들러 추가
4. 필요시 `background.js`와 `content.js`에서 메시지 처리 추가

### 빌드 및 배포
1. 코드 수정 후 `chrome://extensions/`에서 새로고침
2. 배포시 `.git`, `node_modules` 등 제외
3. ZIP으로 압축하여 Chrome Web Store에 업로드

## 라이선스

MIT License

---

**Made with ❤️ for developers**

