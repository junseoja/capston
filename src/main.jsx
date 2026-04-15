// ============================================================
// main.jsx - React 앱 진입점 (Entry Point)
// ============================================================
// 역할:
//   - 브라우저의 #root 엘리먼트에 React 앱을 마운트
//   - BrowserRouter로 앱을 감싸 URL 기반 라우팅 활성화
//   - StrictMode로 감싸 개발 환경에서 잠재적 문제 감지
//
// BrowserRouter:
//   - 브라우저의 History API를 사용해 URL 변경 감지
//   - 이 안에 있는 모든 컴포넌트에서 useNavigate, useLocation 등 라우터 훅 사용 가능
//   - 뒤로가기/앞으로가기 버튼 동작 지원
//
// StrictMode:
//   - 개발 모드에서만 동작 (프로덕션 빌드에는 영향 없음)
//   - 컴포넌트를 두 번 렌더링하여 부작용(side effect) 감지
//   - 더 이상 사용되지 않는 API 경고 표시
// ============================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// public/index.html의 <div id="root"> 엘리먼트를 React 앱의 루트로 사용
createRoot(document.getElementById('root')).render(
    <StrictMode>
        {/* BrowserRouter: URL 경로 기반 라우팅 활성화
            App.jsx의 Routes, Route 컴포넌트가 이 안에서 동작 */}
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
)
