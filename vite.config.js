import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // [추가 2026-05-18 / 배포 준비 - cloudflared 터널]
  // 오류번호: 배포 준비 (Vite 호스트 차단)
  // 날짜: 2026-05-18
  // 기대효과:
  //   Vite 5+ 는 보안상 외부 도메인으로 dev server 접근 시
  //   "Blocked request. This host is not allowed" 로 차단한다.
  //   cloudflared Quick Tunnel URL 은 실행마다 바뀌고, 추후 Named Tunnel
  //   도메인(godsanglog.com 등)으로도 바뀌므로 호스트 하드코딩 불가
  //   → 전체 허용(true)으로 터널/도메인 무엇이든 통과.
  // 장점:
  //   - dev server 한정 → npm run build(프로덕션 정적 산출물)엔 영향 없음.
  //   - 터널 URL 바뀔 때마다 config 수정 불필요.
  // 주의: 개발/데모(터널) 편의용. 운영 정적 호스팅 시에는 무관.
  // [추가 2026-05-18 / 배포 준비 - 터널 정적 서빙]
  // 오류번호: 배포 준비 ($RefreshSig$ / HMR WebSocket 400)
  // 날짜: 2026-05-18
  // 기대효과:
  //   npm run dev 는 HMR(Fast Refresh)을 전제하는데, cloudflared 터널을
  //   통과하면 HMR preamble 주입 실패 → $RefreshSig$ undefined → 흰 화면.
  //   배포/터널 노출은 `npm run build` 후 `npm run preview`(정적 서빙)로
  //   해야 HMR 자체가 없어 깔끔하다. preview 도 외부 호스트 허용 필요.
  // 장점:
  //   - 터널/도메인 무엇이든 통과(allowedHosts:true), 모든 인터페이스 바인딩(host:true).
  //   - dev 서버 설정과 분리 → 로컬 개발(npm run dev)은 영향 없음.
  preview: {
    allowedHosts: true,
    host: true,
    port: 5173,   // 터널/.env 를 그대로 쓰려고 dev 와 동일 포트
  },
  server: {
    allowedHosts: true,
    // [추가 2026-05-18 / 배포 준비 - cloudflared 터널]
    // 오류번호: 배포 준비 (cloudflared 가 Vite 에 연결 못 함)
    // 날짜: 2026-05-18
    // 기대효과:
    //   Vite 기본 바인딩이 macOS 에서 [::1](IPv6 localhost)만 잡혀,
    //   cloudflared(localhost→127.0.0.1 IPv4 접근)가 연결 실패 →
    //   터널 화면이 안 뜨던 문제. host:true 로 0.0.0.0(IPv4+IPv6
    //   모든 인터페이스) 바인딩 → cloudflared/외부 접근 가능.
    // 장점:
    //   - start.sh(npm run dev) / docker 양쪽 모두 적용 (config 한 곳).
    //   - 프로덕션 정적 빌드와 무관 (dev server 한정).
    host: true,
  },
})
