const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer,
} = require("docx");

const FONT = "Apple SD Gothic Neo";
const TEAL = "0E7C7B", TEAL2 = "2AA8A8", DARK = "0B3B3C", ACCENT = "C2641F", INK = "1E2A2A", MUTE = "5C6B6B", LINE = "CFE0DE", ZEBRA = "EEF5F4";
const CW = 9360; // content width (US Letter, 1" margins)

// ── 텍스트/문단 헬퍼 ──
const T = (text, o = {}) => new TextRun({ text, font: FONT, ...o });
const P = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [children], spacing: { after: 120, line: 276 }, ...o });
function body(text, o = {}) { return P([T(text, { size: 22, color: INK })], o); }
function bullet(runs) { return new Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 60, line: 264 }, children: Array.isArray(runs) ? runs : [runs] }); }
function H1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [T(text, { size: 30, bold: true, color: DARK })], spacing: { before: 320, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL2, space: 4 } } }); }
function H2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [T(text, { size: 25, bold: true, color: TEAL })], spacing: { before: 220, after: 110 } }); }

// ── 표 헬퍼 ──
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: LINE };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
function cell(text, w, { head = false, fill, align = AlignmentType.LEFT, color, bold = false, size = 19 } = {}) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 50, bottom: 50, left: 110, right: 90 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: align, spacing: { after: 0, line: 240 }, children: [T(text, { size: head ? 20 : size, bold: head || bold, color: head ? "FFFFFF" : (color || INK) })] })],
  });
}
// 소스 파일 표: [파일, 라인수, 담당, 설명]
function fileTable(rows, headColor) {
  const cw = [2350, 900, 820, 5290];
  const header = new TableRow({ tableHeader: true, children: [
    cell("파일", cw[0], { head: true, fill: headColor }),
    cell("라인수", cw[1], { head: true, fill: headColor, align: AlignmentType.CENTER }),
    cell("담당", cw[2], { head: true, fill: headColor, align: AlignmentType.CENTER }),
    cell("기능 설명", cw[3], { head: true, fill: headColor }),
  ]});
  const body = rows.map((r, i) => {
    const fill = i % 2 ? ZEBRA : "FFFFFF";
    const own = r[2].includes("팀원") ? ACCENT : TEAL;
    return new TableRow({ children: [
      cell(r[0], cw[0], { fill, bold: true }),
      cell(String(r[1]), cw[1], { fill, align: AlignmentType.CENTER, color: MUTE }),
      cell(r[2], cw[2], { fill, align: AlignmentType.CENTER, color: own, bold: true }),
      cell(r[3], cw[3], { fill }),
    ]});
  });
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: cw, rows: [header, ...body] });
}
// 일반 3열 표: [a,b,c] with custom widths/labels
function triTable(headers, rows, cw, headColor) {
  const header = new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, cw[i], { head: true, fill: headColor, align: i === 0 ? AlignmentType.LEFT : AlignmentType.LEFT })) });
  const trows = rows.map((r, i) => {
    const fill = i % 2 ? ZEBRA : "FFFFFF";
    return new TableRow({ children: r.map((c, j) => cell(c, cw[j], { fill, bold: j === 0 })) });
  });
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: cw, rows: [header, ...trows] });
}
const gap = () => new Paragraph({ spacing: { after: 80 }, children: [] });

// ===== 데이터 =====
const backendRows = [
  ["app.js", 201, "본인", "Express 진입점. 보안·세션·CORS 미들웨어 등록, 전체 라우터 마운트, 글로벌 에러 핸들러로 일관된 오류 응답."],
  ["database.js", 708, "본인", "FastAPI 내부 호출 래퍼(fetchJson)와 세션 DB 접근, 도메인별 호출 함수를 모은 데이터 접근 계층."],
  ["lib/s3.js", 104, "본인", "S3 클라이언트 생성, URL→키 추출·검증(버킷 호스트 정확 매칭·경로 traversal 차단·prefix 화이트리스트), 객체 삭제."],
  ["middleware/requireAuth.js", 35, "본인", "쿠키 sessionId로 DB 세션을 검증하고 req.user를 주입하는 인증 가드."],
  ["middleware/requireAdmin.js", 42, "본인", "requireAuth 뒤에 체이닝되어 관리자 권한(login_id)을 확인하는 권한 가드."],
  ["routes/login.js", 605, "본인", "회원가입·로그인·세션 발급(httpOnly 쿠키)·프로필/아바타 수정·아이디/비밀번호 찾기. bcrypt 해싱과 평문→해시 lazy 마이그레이션."],
  ["routes/routine.js", 82, "본인", "루틴 등록·조회·삭제 요청을 FastAPI로 중계."],
  ["routes/completion.js", 107, "본인", "루틴 완료 기록 생성·오늘/이력 조회·취소 중계."],
  ["routes/feed.js", 219, "본인", "피드 작성(multer-s3로 S3 직접 업로드)·조회·삭제, 실패 시 업로드 객체 보상 삭제."],
  ["routes/comment.js", 91, "본인", "댓글 작성·목록·삭제 중계."],
  ["routes/like.js", 41, "본인", "좋아요 토글 중계."],
  ["routes/mypage.js", 45, "본인", "마이페이지 통합 조회 중계."],
  ["routes/stats.js", 52, "본인", "통계 데이터 조회 중계."],
  ["routes/notice.js", 140, "본인", "공지 작성·수정·삭제·조회 중계(작성은 관리자 가드)."],
  ["routes/report.js", 128, "본인", "신고 접수·목록·상세·제재 처리 중계. 신고자 user_id를 세션에서 주입."],
  ["routes/challenge.js", 306, "팀원", "챌린지 참여·인증 업로드·관리자 CRUD/현황 중계."],
];
const apiRows = [
  ["app.py", 120, "본인", "FastAPI 진입점. INTERNAL_API_KEY 게이트 미들웨어로 내부 호출만 허용, 느린 요청 로깅, 라우터 마운트."],
  ["database.py", 200, "본인", "의존성 없이 직접 구현한 PyMySQL 커넥션 풀(LifoQueue+오버플로·ping 재연결), KST 설정, 느린 SQL 로깅."],
  ["routers/user.py", 697, "본인", "회원가입(UUID v7)·로그인 조회·중복 확인·세션 생성/조회/삭제·프로필 수정."],
  ["routers/routine.py", 235, "본인", "루틴 등록·시간대별 조회·삭제(Soft Delete)."],
  ["routers/completion.py", 293, "본인", "완료 기록 생성(하루 1회 보장)·오늘/이력 조회·취소."],
  ["routers/feed.py", 646, "본인", "피드 단일 JOIN 조회·커서 페이지네이션·이미지 일괄 INSERT·챌린지 인증(share_to_feed) 병합."],
  ["routers/comment.py", 192, "본인", "댓글 생성·작성자 JOIN 목록·소유자 검증 삭제."],
  ["routers/like.py", 159, "본인", "UNIQUE 제약 기반 좋아요 INSERT/DELETE 토글, 카운트 조회."],
  ["routers/mypage.py", 263, "본인", "user·summary·gallery 통합 응답과 연속 달성(streak) 집계."],
  ["routers/stats.py", 239, "본인", "시간대/주간/월간 달성률 집계."],
  ["routers/notice.py", 402, "본인", "공지 생성·수정·삭제·목록/상세."],
  ["routers/report.py", 454, "본인", "신고 접수·중복(pending) 차단·관리자 일괄 제재·목록/상세."],
  ["routers/challenge.py", 840, "팀원", "챌린지 목록·참여·인증·관리자 CRUD/현황."],
];
const frontRows = [
  ["App.jsx", 899, "팀원", "라우팅·새로고침 세션 복원·전역 상태."],
  ["LoginPage.jsx", 338, "팀원", "로그인·아이디/비밀번호 찾기 화면."],
  ["SignupPage.jsx", 628, "팀원", "회원가입·중복 확인·입력 검증 화면."],
  ["HomePage.jsx", 936, "팀원", "홈·오늘의 루틴·인증 사진 업로드."],
  ["RoutinePage.jsx", 437, "팀원", "시간대별 루틴 등록·완료 토글."],
  ["FeedPage.jsx", 1091, "팀원", "피드 무한스크롤·댓글·좋아요·신고 모달."],
  ["MyPage.jsx", 904, "팀원", "프로필·갤러리·핵심지표·아바타 업로드."],
  ["StatsPage.jsx", 318, "팀원", "달성률 차트."],
  ["ChallengePage.jsx", 971, "팀원", "챌린지 목록·참가·인증 화면."],
  ["AdminPage.jsx", 862, "팀원", "공지·신고 처리·관리자 화면."],
  ["NoticeList/Detail.jsx", 256, "팀원", "공지 목록·상세 열람."],
  ["main.jsx · config.js", 47, "팀원", "앱 엔트리·API_BASE 단일 출처."],
];
const tableRows = [
  ["계정·세션", "users", "계정·프로필(닉네임/이메일/생년월일/bio/아바타), bcrypt 비밀번호."],
  ["", "sessions", "로그인 세션 저장·만료(expires_at) 관리."],
  ["루틴", "routines", "사용자별 시간대(아침/점심/저녁) 루틴."],
  ["", "routine_completions", "일자별 루틴 완료 기록."],
  ["피드", "feeds", "루틴 인증 게시글 본문."],
  ["", "feed_images", "게시글 첨부 파일(S3 URL, 이미지/영상)."],
  ["", "feed_comments", "게시글 댓글 (Hard Delete)."],
  ["", "feed_likes", "좋아요. like_id PK + UNIQUE(feed_id, user_id)."],
  ["챌린지", "challenges", "관리자 등록 챌린지."],
  ["", "challenge_participants", "챌린지 참여 매핑(복합 PK)."],
  ["", "challenge_proofs", "챌린지 인증 본문·피드 공유 여부(share_to_feed)."],
  ["", "challenge_proof_files", "챌린지 인증 첨부 파일."],
  ["운영", "notices", "관리자 공지."],
  ["", "reports", "피드 신고(카테고리 6종, 신고자/대상자, 처리 상태)."],
];
const dirRows = [
  ["src/frontend", "팀원", "React 19 + Vite 클라이언트."],
  ["src/backend", "본인", "Express BFF — 세션·파일 업로드·라우팅·신뢰 경계."],
  ["src/python_api", "본인", "FastAPI 도메인 API + MySQL 접근 계층."],
  ["docs/", "본인", "보고서·마이그레이션 SQL·아키텍처 문서."],
  ["Dockerfile.* / docker-compose*.yml", "본인", "컨테이너 이미지 빌드·개발/운영 오케스트레이션."],
  ["start*.sh", "본인", "로컬·Docker 실행 스크립트."],
];

// ===== 문서 구성 =====
const children = [];
// 표지 헤더
children.push(new Paragraph({ spacing: { after: 60 }, children: [T("캡스톤 결과보고서", { size: 24, bold: true, color: TEAL })] }));
children.push(new Paragraph({ spacing: { after: 60 }, children: [T("Routine Mate — 루틴 관리·인증 SNS 웹 서비스", { size: 40, bold: true, color: DARK })] }));
children.push(new Paragraph({ spacing: { after: 40 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 6 } }, children: [T("본인 담당 파트 — 백엔드 · DB · 인프라", { size: 24, bold: true, color: ACCENT })] }));
children.push(new Paragraph({ spacing: { before: 120, after: 200 }, children: [T("컴퓨터공학과   학번 20XXXXXX   이름 OOO", { size: 22, color: MUTE })] }));
children.push(body("본 문서는 Routine Mate 캡스톤 프로젝트에서 본인이 담당한 백엔드(Express BFF)·애플리케이션 API(FastAPI)·데이터베이스·인프라 영역을 중심으로 데이터베이스 구성, 소스 파일 구성, 메뉴별 기능, 수행 소감, 향후 과제를 정리한 결과보고서이다.", { }));

// 3.2
children.push(H1("3.2 데이터베이스 구성 · 파일 내용 구성"));
children.push(H2("3.2.1 데이터베이스 환경 및 설계 원칙"));
children.push(body("데이터베이스는 AWS RDS의 MySQL 8을 사용하며, FastAPI가 PyMySQL 커넥션 풀을 통해 접근한다. 모든 세션의 문자셋은 utf8mb4, 시간대는 KST(+09:00)로 통일하였다. 도메인 테이블은 총 14개로 5개 그룹(계정·세션 / 루틴 / 피드 / 챌린지 / 운영)으로 나뉜다."));
children.push(bullet([T("UUID v7 기본키 — ", { size: 22, bold: true, color: DARK }), T("모든 PK는 CHAR(36) UUID v7. 앞 비트가 타임스탬프라 B-Tree 인덱스에 단조 증가하고, 추측이 어려워 보안에 유리하다.", { size: 22, color: INK })]));
children.push(bullet([T("Soft Delete — ", { size: 22, bold: true, color: DARK }), T("주요 도메인은 deleted_at으로 논리 삭제하여 복구가 가능하다. 단 feed_comments·feed_likes는 Hard Delete(물리 삭제) 예외다.", { size: 22, color: INK })]));
children.push(bullet([T("트랜잭션·커넥션 풀 — ", { size: 22, bold: true, color: DARK }), T("모든 라우터가 try/except/rollback/finally로 커넥션을 풀에 반환해 장기 운영에도 누수가 없다.", { size: 22, color: INK })]));
children.push(bullet([T("참조 무결성 — ", { size: 22, bold: true, color: DARK }), T("FK와 복합 인덱스를 설계하고, 탈퇴 사용자 게시물은 LEFT JOIN + COALESCE로 “(탈퇴 사용자)”로 보존한다.", { size: 22, color: INK })]));
children.push(H2("3.2.2 테이블 구성 (14개)"));
children.push(triTable(["도메인", "테이블", "설명"], tableRows, [1500, 2400, 5460], TEAL));
children.push(gap());
children.push(H2("3.2.3 파일 내용 구성 (프로젝트 디렉터리)"));
children.push(body("프로젝트는 React(프론트) · Express(BFF) · FastAPI(API)의 3-Tier 구조를 디렉터리로 분리한다. 본인은 src/backend, src/python_api, 데이터베이스 스키마, 배포 구성을 담당하였다."));
children.push(triTable(["경로", "담당", "설명"], dirRows, [3000, 1100, 5260], TEAL2));

// 3.3
children.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [T("3.3 소스 파일 구성", { size: 30, bold: true, color: DARK })], spacing: { before: 0, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL2, space: 4 } } }));
children.push(body("프로젝트 소스는 3계층 총 43개 파일, 약 15,300 라인(CSS·외부 라이브러리 제외 실측)으로 구성된다. 본인은 Express BFF와 FastAPI 라우터 중 챌린지를 제외한 전부, DB 스키마·마이그레이션, Docker·AWS 배포를 담당하였고, 프론트엔드(React) 전체와 챌린지 API(challenge.js·challenge.py)는 팀원이 담당하였다. 아래 표는 파일별 라인수·담당·기능 설명이다."));
children.push(H2("3.3.1 Backend — Express BFF (본인 담당, 챌린지 제외)"));
children.push(fileTable(backendRows, TEAL));
children.push(gap());
children.push(H2("3.3.2 Application API — FastAPI (본인 담당, 챌린지 제외)"));
children.push(fileTable(apiRows, TEAL2));
children.push(gap());
children.push(H2("3.3.3 Frontend — React (팀원 담당)"));
children.push(fileTable(frontRows, ACCENT));

// 3.4
children.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [T("3.4 메뉴별 시나리오 기능 설명", { size: 30, bold: true, color: DARK })], spacing: { before: 0, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL2, space: 4 } } }));
children.push(body("브라우저(React)는 Express BFF만 호출하고, Express는 세션을 검증한 뒤 X-Internal-Api-Key를 붙여 FastAPI를 호출하며, FastAPI가 MySQL에 접근한다. 아래는 주요 메뉴별 요청 흐름과 핵심 처리이다."));
children.push(H2("① 회원가입 · 로그인"));
children.push(body("회원가입 입력 → login_id 중복 검사 → bcrypt(salt round 10) 해시 → 세션 발급(httpOnly 쿠키) → 이후 모든 요청은 credentials:include로 쿠키 자동 첨부. 비밀번호는 Express에서 해시한 뒤 전달되어 DB에는 해시 문자열만 저장되고(평문 금지), 세션 ID(UUID v4)는 sessions 테이블과 httpOnly 쿠키에 저장되어 JS 접근이 불가하다(XSS 토큰 탈취 방어). login_id UNIQUE 인덱스와 Express 사전 검증을 이중화하여 동시 가입 레이스에도 안전하다."));
children.push(H2("② 루틴 등록 · 완료 체크"));
children.push(body("아침/점심/저녁 시간대와 제목으로 루틴을 등록(routines INSERT)하고, 체크 시 오늘 동일 루틴의 완료 행을 확인한 뒤 INSERT한다(BEGIN→COMMIT). ‘오늘 완료’는 DATE(completed_at)=CURDATE() 기준이며, 하루에 여러 번 체크해도 distinct routine_id 단위로 1회만 인정한다. 체크 해제는 Soft Delete(deleted_at)로 처리해 기록을 보존한다. 마이페이지 달성률·연속 달성 계산도 동일한 규칙을 따른다."));
children.push(H2("③ 피드 작성 · 무한 스크롤"));
children.push(body("사진/영상을 선택하면 multer-s3가 EC2 임시 디스크를 거치지 않고 S3로 직접 업로드한 뒤, FastAPI가 feeds와 feed_images를 한 트랜잭션으로 INSERT한다. FastAPI INSERT가 실패하면 Express가 업로드된 S3 객체를 보상 삭제(orphan 청소)한다. 목록은 (created_at, feed_id) 커서 페이지네이션으로 조회하여 새 글 추가·삭제에도 중복·누락이 없으며, 화면은 IntersectionObserver로 무한 스크롤한다. 챌린지 인증(share_to_feed=1)은 별도 행으로 복제하지 않고 조회 단계에서 source_type 메타로 병합한다."));
children.push(H2("④ 마이페이지 · 통계 (단일 응답)"));
children.push(body("한 번의 GET /mypage 호출로 user(프로필) · summary(루틴·완료·연속달성) · gallery(피드+이미지)를 동시에 받아 새로고침 시의 N+1 호출을 제거한다. 연속 달성(streak)은 오늘부터 거꾸로 ‘하루 1개 이상 완료’가 끊기지 않는 길이를 최근 365일 범위에서 계산한다. 통계는 시간대별 7일 달성률·월별 캘린더 완료일·누적 인증 수를 (user_id, completed_at) 인덱스 위에서 집계해 단일 JSON으로 응답한다."));
children.push(H2("⑤ 공지 · 신고 · 챌린지 연동"));
children.push(body("공지는 관리자(requireAdmin)가 작성하고 사용자는 목록·상세를 열람하며 Soft Delete 필터가 적용된다. 신고는 피드 전용으로 카테고리 6종과 상세 사유를 입력하며, 신고자(reporter_user_id)는 세션에서 주입하고 대상자는 feed_id로 작성자를 자체 조회해 위조를 방지한다. 같은 사용자가 같은 피드를 다시 신고(pending)하면 409로 차단하고, 관리자는 한 피드의 신고를 일괄 처리(completed)한다. 챌린지 인증은 share_to_feed=1일 때 GET /feed 단계에서 일반 피드와 병합되어 노출된다."));

// 3.7
children.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [T("3.7 프로젝트를 수행하며 배우고 느낀점", { size: 30, bold: true, color: DARK })], spacing: { before: 0, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL2, space: 4 } } }));
children.push(body("3-Tier(BFF) 구조를 직접 설계하면서 ‘왜 계층을 나누는가’를 코드로 이해하게 되었다. 세션·CORS·파일 업로드는 Express가, 순수 도메인 로직과 DB 접근은 FastAPI가 맡도록 신뢰 경계를 나누니 책임과 보안 범위가 명확해졌다."));
children.push(body("동작하는 수준을 넘어 운영을 가정하자 새로운 문제들이 보였다. 커넥션 누수, S3 orphan 파일, 분산 트랜잭션, 세션 만료 같은 문제를 마주하며 try/finally 커넥션 풀 반환, 업로드 보상 삭제, 커서 페이지네이션을 도입했다. 특히 외부 의존성 없이 PyMySQL 커넥션 풀을 직접 구현하면서 동시성과 자원 관리의 원리를 깊이 배울 수 있었다."));
children.push(body("데이터 무결성과 품질 관리의 중요성도 체감했다. Soft Delete 필터 누락 같은 무결성 이슈를 P0로 분류해 바로잡았고, 백로그와 코드 리뷰 문서로 기술 부채를 추적했으며, 모든 수정에 오류번호·날짜·기대효과·장점의 4요소 주석 규칙을 세워 협업 가독성을 높였다."));
children.push(body("마지막으로 협업의 가치를 배웠다. 프론트엔드 팀에 API 명세와 응답 스키마를 제공해 연동을 맞추고, Docker로 팀 전체의 개발·운영 환경을 일치시켰다. 결국 이 프로젝트는 ‘동작하는 코드’에서 ‘운영 가능한 코드’로 가는 거리를 체감하게 해 준 경험이었다."));

// 4
children.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [T("4. 향후 과제", { size: 30, bold: true, color: DARK })], spacing: { before: 0, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL2, space: 4 } } }));
children.push(body("향후 과제는 팀원별로 각자 작성하며, 아래는 본인 담당 영역(백엔드·DB·인프라) 관점의 개선 로드맵이다."));
children.push(bullet([T("권한 모델 고도화 — ", { size: 22, bold: true, color: DARK }), T("login_id == “admin” 문자열 판별을 users.role 기반 RBAC로 전환하고, /me 응답에 role을 포함해 새로고침 후 관리자 상태까지 복구한다.", { size: 22, color: INK })]));
children.push(bullet([T("인증 보안 강화 — ", { size: 22, bold: true, color: DARK }), T("비밀번호 변경 시 전체 세션 무효화, 아이디/비밀번호 찾기 IP 기준 rate limit, 이메일 토큰 기반 재설정, Helmet/CSP 헤더 적용.", { size: 22, color: INK })]));
children.push(bullet([T("운영 관측성 — ", { size: 22, bold: true, color: DARK }), T("slow request/SQL 로그를 CloudWatch·Grafana로 연동, 5xx 비율·커넥션 풀 대기 시간 알림, 관리자 행위 audit log 테이블 도입.", { size: 22, color: INK })]));
children.push(bullet([T("성능·자동화 — ", { size: 22, bold: true, color: DARK }), T("이미지 압축·썸네일(WebP), 커넥션 풀 파라미터 튜닝, CI에서 lint/build/py_compile 자동 실행으로 회귀 차단, 무중단 롤링 배포.", { size: 22, color: INK })]));

// ===== 문서 객체 =====
const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { run: { color: TEAL }, paragraph: { indent: { left: 460, hanging: 260 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [T("Routine Mate 캡스톤 결과보고서   ·   ", { size: 16, color: MUTE }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: MUTE })] })] }) },
    children,
  }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync("RoutineMate_본인담당파트.docx", buf); console.log("WROTE docx"); });
