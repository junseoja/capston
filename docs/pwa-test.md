# PWA 테스트 방법

Routimate 프론트엔드에 PWA 설치 기능이 정상 반영됐는지 확인하는 절차입니다.

## 1. 의존성 설치

```bash
npm install
```

## 2. 프로덕션 빌드 생성

```bash
npm run build
```

## 3. 로컬 프리뷰 실행

```bash
npm run preview
```

## 4. Chrome 개발자도구에서 확인

1. `http://localhost:5173` 접속
2. 개발자도구 열기
3. `Application` 탭 진입
4. `Manifest` 메뉴에서 아래 항목 확인
   - `name: Routimate`
   - `short_name: Routimate`
   - `display: standalone`
   - 아이콘 192 / 512 / maskable 아이콘 로드 여부
5. `Service Workers` 메뉴에서 서비스 워커 등록 여부 확인
6. 필요 시 `Update on reload`를 켜고 새로고침해서 최신 캐시 반영 상태 확인

## 5. 배포 후 실제 설치 확인

1. `https://routimate.com` 접속
2. Android Chrome 또는 PC Chrome에서 설치 아이콘/설치 배너 확인
3. 설치 후 독립 실행 창(standalone)으로 열리는지 확인
4. 새 버전 배포 후 다시 접속했을 때 오래된 화면이 지속되지 않는지 확인

## 6. 체크 포인트

- `https://api.routimate.com` API 요청은 서비스 워커 캐시가 아니라 네트워크로 처리되어야 함
- 로그인, 루틴 완료, 이미지 업로드, 챌린지 업로드가 캐시 때문에 깨지지 않아야 함
- PWA 설정 변경 후에는 프론트 Docker 이미지 또는 배포 빌드를 반드시 다시 생성해야 함

## 7. 아이콘 교체 메모

- 현재 `public/icons/`에는 배포 테스트용 PNG 아이콘이 들어 있습니다.
- 브랜드 확정 로고가 준비되면 아래 파일을 교체하면 됩니다.
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`
  - `public/icons/maskable-icon-512.png`
