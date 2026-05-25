// ============================================================
// main.jsx - React 진입점
// ============================================================
// 역할:
//   - #root 요소에 React 앱을 마운트합니다.
//   - BrowserRouter로 URL 기반 라우팅을 활성화합니다.
//   - PWA 서비스 워커를 등록해 설치 가능 웹앱으로 동작하게 합니다.
// ============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import "../css/index.css";
import App from "./App.jsx";

// PWA 서비스 워커를 자동 업데이트 모드로 등록합니다.
// 새 배포가 올라오면 최신 캐시를 더 빠르게 받도록 도와줍니다.
registerSW({
  immediate: true,
  onRegisterError(error) {
    console.error("PWA 서비스 워커 등록에 실패했습니다.", error);
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
