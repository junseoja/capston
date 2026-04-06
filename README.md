# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 프론트 엔드 버전입니다.

## 회원가입 시 중복체크를 할 수 있도록 임시 사용자 목록 상태 추가

  //회원가입 시 중복체크를 할 수 있도록 임시 사용자 목록 상태 추가
  const [users, setUsers] = useState([
    {
      id: 1,
      userId: "test123",
      password: "test123",
      nickname: "테스트",
      email: "demo@routine.com",
      gender: "female",
      birth: "2000-01-01",
    },
  ]);


  ## 업데이트
  
  피드 업로드 하는 과정 추가
  댓글 및 하트 기능 추가