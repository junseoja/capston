// React 앱의 진입점 (Entry Point)
// 브라우저의 #root 엘리먼트에 React 앱을 마운트한다

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // URL 기반 라우팅 활성화 (뒤로가기 지원)
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter: 브라우저 History API를 사용해 URL 변경을 감지
        이 안에 있는 컴포넌트들은 useNavigate, useLocation 등 라우터 훅 사용 가능 */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
