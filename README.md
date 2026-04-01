# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## git 연결 방법 
첫 git 연결

ctrl + shift + p
Git: Clone

최신 코드 받기
git pull origin main

저장
git add .
git commit -m "변경점"

보내기 
git push origin main

## 프로젝트 첫 이해를 위한 요약
1. index.html : 리엑트 시작점 연결용
2. main.jsx : index.css 불러오기, App.jsx 불러오기, App 랜더링
3. App.jsx : 로그인 여부 관리, 현재 페이지 상태 관리  ( react-router-dom ==> 방식으로 바꿀 필요성이 있음)
4. LoginPage.jsx : 로그인 UI
5. HomePage.jsx : 홈 화면
6. RoutinePage.jsx : 루틴 관리 화면
7. FeedPage.jsx : 피드 화면
8. Mypage.jsx : 마이 페이지 화면
9. App.css : 모든 css module ==> 너무 한곳에 몰려있음 나눌 필요가 있어 보임
10. index.css : Vite 기본 템플릿, 전체에 적용하는 가장 바깥 스타일 (Vite : 리액트 프로젝트가 잘 돌아가게 도와주는 실행도구) ==> 정리 할 필요가 있음
11. package.json : 라이브러리
12. vite.config.js : vite 설정 화면 ( 아직 없는 설정 예: alias (@/components), proxy, 배포 base 경로, 환경 분기 설정)
13. eslint.config.js : 코드 스카일 / 문법 검사 설정 [규칙]
14. gitignore : git에 올리면 안 되는 파일 목록
15. README.md : 팀 프로젝트 설명 적는 공간 없어도 될 듯 하다
16. SignupPage.jsx : 회원가입 화면