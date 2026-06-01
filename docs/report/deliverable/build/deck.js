const pptxgen = require("pptxgenjs");
const { FONT, C, shadow, header } = require("./theme.js");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.author = "Routine Mate Team";
pres.title = "Routine Mate 캡스톤 결과보고서 — 본인 담당 파트";

// 페이지 자동 카운터 (표지=1, 이후 슬라이드마다 ++) — 슬라이드 삽입 시 재번호 불필요
let PAGE = 1;
const pg = () => ++PAGE;

// 카드(흰 박스 + 좌측 틸 바) 헬퍼
function card(slide, x, y, w, h, barColor = C.teal) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: C.card }, line: { color: C.line, width: 1 }, shadow: shadow(),
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.09, h, fill: { color: barColor }, line: { type: "none" },
  });
}

/* ======================= 표지 ======================= */
(function cover() {
  const s = pres.addSlide();
  s.background = { color: C.dark };
  // 우측 민트 모티프
  s.addShape(pres.shapes.OVAL, { x: 7.7, y: -1.2, w: 3.6, h: 3.6, fill: { color: C.teal, transparency: 35 }, line: { type: "none" } });
  s.addShape(pres.shapes.OVAL, { x: 8.9, y: 3.4, w: 2.6, h: 2.6, fill: { color: C.teal2, transparency: 45 }, line: { type: "none" } });

  s.addText("CAPSTONE FINAL REPORT", { x: 0.7, y: 0.95, w: 8, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.mint, charSpacing: 3 });
  s.addText("Routine Mate", { x: 0.66, y: 1.35, w: 8.4, h: 1.0, margin: 0, fontFace: FONT, fontSize: 54, bold: true, color: C.white });
  s.addText("루틴 관리 · 인증 SNS 웹 서비스", { x: 0.7, y: 2.45, w: 8.4, h: 0.5, margin: 0, fontFace: FONT, fontSize: 20, color: "CFE8E1" });

  // 담당 파트 칩
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 3.2, w: 4.5, h: 0.5, rectRadius: 0.1, fill: { color: C.accent }, line: { type: "none" } });
  s.addText("본인 담당 파트 — 백엔드 · DB · 인프라", { x: 0.7, y: 3.2, w: 4.5, h: 0.5, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.white, align: "center", valign: "middle" });

  s.addText([
    { text: "수록 섹션  ", options: { bold: true, color: C.mint } },
    { text: "3.2 데이터베이스 구성  ·  3.3 소스 파일 구성  ·  3.4 메뉴별 기능  ·  3.7 느낀점  ·  4. 향후 과제  ·  부록 실행 방법", options: { color: "BFD8D2" } },
  ], { x: 0.7, y: 3.95, w: 8.6, h: 0.4, margin: 0, fontFace: FONT, fontSize: 12 });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 4.7, w: 8.6, h: 0.02, fill: { color: C.teal2 }, line: { type: "none" } });
  s.addText([
    { text: "컴퓨터공학과   ", options: { bold: true, color: C.white } },
    { text: "학번 20XXXXXX   이름 OOO", options: { color: "BFD8D2" } },
  ], { x: 0.7, y: 4.8, w: 8.6, h: 0.35, margin: 0, fontFace: FONT, fontSize: 12 });
})();

/* ============== 3.2 ① 데이터베이스 개요 & 설계 원칙 ============== */
(function dbOverview() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.2", title: "데이터베이스 구성 — 개요 및 설계 원칙", page: pg() });

  // 좌측: DBMS 환경 카드
  card(s, 0.5, 1.32, 3.5, 3.55, C.teal);
  s.addText("DBMS 환경", { x: 0.72, y: 1.5, w: 3.1, h: 0.4, margin: 0, fontFace: FONT, fontSize: 16, bold: true, color: C.teal });
  s.addText([
    { text: "MySQL 8", options: { bold: true, color: C.ink, breakLine: true } },
    { text: "AWS RDS 관리형 인스턴스", options: { color: C.mute, fontSize: 11, breakLine: true, paraSpaceAfter: 8 } },
    { text: "접속 계층", options: { bold: true, color: C.ink, breakLine: true } },
    { text: "FastAPI + PyMySQL 커넥션 풀", options: { color: C.mute, fontSize: 11, breakLine: true, paraSpaceAfter: 8 } },
    { text: "문자셋 · 시간대", options: { bold: true, color: C.ink, breakLine: true } },
    { text: "utf8mb4 / KST(+09:00) 통일", options: { color: C.mute, fontSize: 11, breakLine: true, paraSpaceAfter: 8 } },
    { text: "테이블 수", options: { bold: true, color: C.ink, breakLine: true } },
    { text: "총 14개 (5개 도메인 그룹)", options: { color: C.mute, fontSize: 11 } },
  ], { x: 0.72, y: 1.95, w: 3.15, h: 2.85, margin: 0, fontFace: FONT, fontSize: 13, lineSpacingMultiple: 1.05 });

  // 우측: 4개 설계 원칙 2x2
  const principles = [
    ["UUID v7 기본키", "모든 PK는 CHAR(36) UUID v7. 시간순 단조 증가로 B-Tree 인덱스 효율↑, 추측 불가로 보안↑"],
    ["Soft Delete", "주요 도메인은 deleted_at으로 논리 삭제·복구 가능. (feed_comments·feed_likes는 Hard Delete 예외)"],
    ["트랜잭션 · 커넥션 풀", "라우터마다 try/except/rollback/finally로 풀 반환 → 장기 운영에도 커넥션 누수 0"],
    ["참조 무결성", "FK + 복합 인덱스 설계. 탈퇴 사용자는 LEFT JOIN+COALESCE로 게시물 보존"],
  ];
  const gx = 4.25, gy = 1.32, gw = 2.55, gh = 1.7, gapx = 0.15, gapy = 0.15;
  principles.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * (gw + gapx), y = gy + row * (gh + gapy);
    card(s, x, y, gw, gh, C.accent);
    s.addText(p[0], { x: x + 0.22, y: y + 0.16, w: gw - 0.34, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13.5, bold: true, color: C.dark });
    s.addText(p[1], { x: x + 0.22, y: y + 0.6, w: gw - 0.36, h: gh - 0.72, margin: 0, fontFace: FONT, fontSize: 10.5, color: C.mute, valign: "top", lineSpacingMultiple: 1.0 });
  });
})();

/* ============== 3.2 ② 테이블 구성 (도메인 5그룹) ============== */
(function dbTables() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.2", title: "데이터베이스 구성 — 테이블 구성 (14개)", page: pg() });

  const groups = [
    ["계정 · 세션", C.teal, ["users — 계정/프로필(bio·아바타)", "sessions — 로그인 세션·만료 관리"]],
    ["루틴", C.teal2, ["routines — 시간대별 루틴", "routine_completions — 일자별 완료 기록"]],
    ["피드 (소셜)", "3E8E7E", ["feeds — 인증 게시글 본문", "feed_images — S3 파일 URL", "feed_comments — 댓글(Hard Delete)", "feed_likes — 좋아요(UNIQUE 토글)"]],
    ["챌린지", "5B8A72", ["challenges — 관리자 챌린지", "challenge_participants — 참여 매핑", "challenge_proofs — 인증 본문·피드공유", "challenge_proof_files — 인증 파일"]],
    ["운영", C.accent, ["notices — 공지", "reports — 피드 신고(카테고리 6종)"]],
  ];

  // 카드 높이 메트릭 (세로 넘침 방지: 타이트하게)
  const HEAD = 0.44, ROWH = 0.28, PAD = 0.12, GAP = 0.16, TOP = 1.26;
  function groupCard(x, y, w, gi) {
    const g = groups[gi];
    const rows = g[2];
    const h = HEAD + rows.length * ROWH + PAD;
    card(s, x, y, w, h, g[1]);
    s.addText(g[0], { x: x + 0.22, y: y + 0.1, w: w - 0.4, h: 0.32, margin: 0, fontFace: FONT, fontSize: 13.5, bold: true, color: g[1] });
    s.addText(rows.map((r, idx) => ({ text: r, options: { breakLine: idx < rows.length - 1, color: C.ink, fontSize: 10 } })),
      { x: x + 0.24, y: y + HEAD, w: w - 0.44, h: rows.length * ROWH, margin: 0, fontFace: FONT, valign: "top", lineSpacingMultiple: 1.02 });
    return h;
  }
  // 좌측 컬럼: 피드(4) + 챌린지(4)
  let y1 = TOP;
  y1 += groupCard(0.5, y1, 4.45, 2) + GAP;
  groupCard(0.5, y1, 4.45, 3);
  // 우측 컬럼: 계정·세션(2) + 루틴(2) + 운영(2)
  let y2 = TOP;
  y2 += groupCard(5.05, y2, 4.45, 0) + GAP;
  y2 += groupCard(5.05, y2, 4.45, 1) + GAP;
  groupCard(5.05, y2, 4.45, 4);
})();

/* ============== 3.2 ②-2 ERD 관계도 ============== */
(function erd() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.2", title: "데이터베이스 — ERD 관계도", page: pg() });
  // 좌측: ERD 이미지 (원본 7648x9952, 비율 0.768)
  const ih = 3.95, iw = ih * 0.768;
  s.addImage({ path: "erd.png", x: 0.45, y: 1.2, w: iw, h: ih });
  // 우측 패널
  const px = 4.0, pw = 5.55;
  s.addText("14개 테이블 · 5개 도메인 그룹 · FK 관계 24개", { x: px, y: 1.28, w: pw, h: 0.4, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: C.dark });
  const legend = [
    ["계정 · 세션", C.teal, "users, sessions"],
    ["루틴", C.teal2, "routines, routine_completions"],
    ["피드 (소셜)", "3E8E7E", "feeds, feed_images, feed_comments, feed_likes"],
    ["챌린지", "5B8A72", "challenges, participants, proofs, proof_files"],
    ["운영", C.accent, "notices, reports"],
  ];
  let ly = 1.85;
  legend.forEach((g) => {
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: ly + 0.04, w: 0.22, h: 0.22, fill: { color: g[1] }, line: { type: "none" } });
    s.addText(g[0], { x: px + 0.34, y: ly - 0.04, w: pw - 0.34, h: 0.3, margin: 0, fontFace: FONT, fontSize: 12, bold: true, color: C.dark });
    s.addText(g[2], { x: px + 0.34, y: ly + 0.24, w: pw - 0.34, h: 0.3, margin: 0, fontFace: FONT, fontSize: 9.5, color: C.mute });
    ly += 0.6;
  });
  // 하단 노트 카드
  card(s, px, 4.78, pw, 0.5, C.accent);
  s.addText([
    { text: "PK = UUID v7", options: { bold: true, color: C.accent } },
    { text: "  ·  주요 테이블 Soft Delete  ·  상세: dbdiagram.io + routine_mate.dbml", options: { color: C.ink } },
  ], { x: px + 0.2, y: 4.78, w: pw - 0.3, h: 0.5, margin: 0, fontFace: FONT, fontSize: 9.5, valign: "middle" });
})();

/* ============== 3.2 ②-3 테이블 관계 (Cardinality) ============== */
(function relationships() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.2", title: "데이터베이스 — 테이블 관계 (Cardinality)", page: pg() });
  s.addText("대부분 부모 1 : 자식 N 관계이며, 좋아요·챌린지 참여는 중간 테이블을 둔 N : M 이다. (엄격한 1:1 관계는 없음)", {
    x: 0.5, y: 1.16, w: 9, h: 0.32, margin: 0, fontFace: FONT, fontSize: 11, bold: true, color: C.teal,
  });
  const rows = [
    ["users → sessions", "1 : N", "한 사용자가 여러 세션(로그인) 보유"],
    ["users → routines", "1 : N", "한 사용자가 여러 루틴 등록"],
    ["routines → routine_completions", "1 : N", "한 루틴에 여러 일자 완료 기록"],
    ["users → feeds", "1 : N", "한 사용자가 여러 인증 피드 작성"],
    ["feeds → feed_images", "1 : N", "한 피드에 여러 첨부 파일(S3)"],
    ["feeds → feed_comments", "1 : N", "한 피드에 여러 댓글"],
    ["feeds → feed_likes", "1 : N", "한 피드에 여러 좋아요"],
    ["users ↔ feeds (좋아요)", "N : M", "feed_likes 중간 테이블로 다대다"],
    ["challenges → challenge_proofs", "1 : N", "한 챌린지에 여러 인증"],
    ["challenge_proofs → challenge_proof_files", "1 : N", "한 인증에 여러 첨부 파일"],
    ["users ↔ challenges (참여)", "N : M", "challenge_participants 중간 테이블"],
    ["feeds → reports", "1 : N", "한 피드에 여러 신고 누적"],
    ["users → reports", "1 : N", "신고자·대상자·처리관리자(역할별)"],
  ];
  const head = ["관계", "유형", "설명"].map((t, i) => ({
    text: t, options: { fill: { color: C.teal }, color: C.white, bold: true, fontSize: 11, align: i === 1 ? "center" : "left", valign: "middle" },
  }));
  const body = rows.map((r, i) => {
    const zebra = i % 2 ? "EEF5F4" : "FFFFFF";
    const tcol = r[1].includes("N : M") ? C.accent : C.teal;
    return [
      { text: r[0], options: { fill: { color: zebra }, color: C.ink, bold: true, fontSize: 10, align: "left", valign: "middle" } },
      { text: r[1], options: { fill: { color: zebra }, color: tcol, bold: true, fontSize: 10.5, align: "center", valign: "middle" } },
      { text: r[2], options: { fill: { color: zebra }, color: C.ink, fontSize: 10, align: "left", valign: "middle" } },
    ];
  });
  s.addTable([head, ...body], {
    x: 0.5, y: 1.56, w: 9.0, colW: [3.7, 1.1, 4.2], rowH: 0.0, autoPage: false,
    border: { type: "solid", pt: 0.5, color: "D6E2E2" }, fontFace: FONT, valign: "middle", margin: [2, 5, 2, 5],
  });
})();

/* ============== 3.2 ③ 파일(프로젝트 디렉터리) 내용 구성 ============== */
(function fileStructure() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.2", title: "파일 내용 구성 — 프로젝트 디렉터리", page: pg() });

  s.addText("React(프론트) · Express(BFF) · FastAPI(API) 3-Tier 구조를 디렉터리로 분리", {
    x: 0.5, y: 1.18, w: 9, h: 0.35, margin: 0, fontFace: FONT, fontSize: 12.5, bold: true, color: C.teal,
  });

  const cols = [
    ["src/frontend  (React 19 + Vite)", C.teal, [
      "App.jsx — 라우터/세션 복원",
      "LoginPage · SignupPage",
      "RoutinePage · HomePage",
      "FeedPage · MyPage · StatsPage",
      "ChallengePage · AdminPage",
      "NoticeList · NoticeDetail",
      "config.js — API_BASE 단일 출처",
    ]],
    ["src/backend  (Express BFF)", C.teal2, [
      "app.js — 미들웨어·세션·라우터",
      "lib/s3.js — S3 키 검증·삭제",
      "middleware/ — requireAuth·Admin",
      "routes/ — login·routine·feed",
      "  comment·like·mypage·stats",
      "  notice·report·challenge",
      "database.js — fetchJson 헬퍼",
    ]],
    ["src/python_api  (FastAPI)", "3E8E7E", [
      "app.py — INTERNAL_API_KEY 게이트",
      "database.py — PyMySQL 풀",
      "routers/ — user·routine",
      "  completion·feed·comment·like",
      "  mypage·stats·notice·report",
      "  challenge",
      "requirements.txt",
    ]],
  ];
  const x0 = 0.5, w = 2.92, gap = 0.27, y0 = 1.6, h = 2.92;
  cols.forEach((c, i) => {
    const x = x0 + i * (w + gap);
    card(s, x, y0, w, h, c[1]);
    s.addText(c[0], { x: x + 0.18, y: y0 + 0.14, w: w - 0.3, h: 0.55, margin: 0, fontFace: FONT, fontSize: 12.5, bold: true, color: c[1], valign: "top" });
    s.addText(c[2].map((r, idx) => ({ text: r, options: { breakLine: idx < c[2].length - 1, color: C.ink, fontSize: 10 } })),
      { x: x + 0.2, y: y0 + 0.78, w: w - 0.36, h: h - 0.9, margin: 0, fontFace: FONT, valign: "top", lineSpacingMultiple: 1.12 });
  });

  // 하단 보조 디렉터리
  card(s, 0.5, 4.68, 9.0, 0.48, C.accent);
  s.addText([
    { text: "공통 · 배포  ", options: { bold: true, color: C.accent } },
    { text: "docs/(보고서·마이그레이션 SQL·아키텍처)  ·  Dockerfile.*(.prod)  ·  docker-compose(.prod).yml  ·  start*.sh", options: { color: C.ink } },
  ], { x: 0.72, y: 4.68, w: 8.6, h: 0.48, margin: 0, fontFace: FONT, fontSize: 10.5, valign: "middle" });
})();

/* ============== 3.3 ① 소스 구성 한눈에 (통계) ============== */
(function srcOverview() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.3", title: "소스 파일 구성 — 한눈에 보기", page: pg() });

  // 3개 stat 콜아웃
  const stats = [
    ["43", "개 소스 파일", "프론트 14 · 백엔드 16 · API 13"],
    ["15,300+", "라인 (LOC)", "CSS · 외부 라이브러리 제외 실측"],
    ["3", "계층 (Tier)", "React · Express BFF · FastAPI"],
  ];
  const sx = 0.5, sw = 2.9, sgap = 0.3, sy = 1.35, sh = 1.7;
  stats.forEach((st, i) => {
    const x = sx + i * (sw + sgap);
    card(s, x, sy, sw, sh, C.teal);
    s.addText(st[0], { x: x + 0.2, y: sy + 0.18, w: sw - 0.4, h: 0.75, margin: 0, fontFace: FONT, fontSize: 40, bold: true, color: C.teal, align: "left" });
    s.addText(st[1], { x: x + 0.22, y: sy + 0.92, w: sw - 0.4, h: 0.32, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: C.dark });
    s.addText(st[2], { x: x + 0.22, y: sy + 1.24, w: sw - 0.42, h: 0.36, margin: 0, fontFace: FONT, fontSize: 9.5, color: C.mute });
  });

  // 담당 분담 카드
  card(s, 0.5, 3.35, 9.0, 1.5, C.accent);
  s.addText("담당 분담", { x: 0.72, y: 3.5, w: 8.5, h: 0.35, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.accent });
  s.addText([
    { text: "본인", options: { bold: true, color: C.teal } },
    { text: "  Express BFF · FastAPI 라우터 중 챌린지를 제외한 전부, DB 스키마·마이그레이션, Docker·AWS·배포 (백엔드·DB·인프라)", options: { color: C.ink, breakLine: true } },
    { text: "팀원", options: { bold: true, color: C.accent } },
    { text: "  프론트엔드(React) 전체, 챌린지 API(challenge.js · challenge.py)", options: { color: C.ink } },
  ], { x: 0.72, y: 3.9, w: 8.55, h: 0.9, margin: 0, fontFace: FONT, fontSize: 11, valign: "top", lineSpacingMultiple: 1.15, paraSpaceAfter: 6 });
})();

// 파일 표 슬라이드 헬퍼
function fileTableSlide(tag, title, page, headerColor, rows) {
  const s = pres.addSlide();
  header(s, pres, { tag, title, page });
  const head = ["파일", "라인수", "담당", "기능"].map(t => ({
    text: t, options: { fill: { color: headerColor }, color: C.white, bold: true, fontSize: 11, align: t === "라인수" || t === "담당" ? "center" : "left", valign: "middle" },
  }));
  const body = rows.map((r, i) => {
    const zebra = i % 2 === 1 ? "EEF5F4" : "FFFFFF";
    const ownColor = r[2].includes("팀원") ? C.accent : C.teal;
    return [
      { text: r[0], options: { fill: { color: zebra }, color: C.ink, bold: true, fontSize: 9.5, align: "left", valign: "middle" } },
      { text: String(r[1]), options: { fill: { color: zebra }, color: C.mute, fontSize: 9.5, align: "center", valign: "middle" } },
      { text: r[2], options: { fill: { color: zebra }, color: ownColor, bold: true, fontSize: 9, align: "center", valign: "middle" } },
      { text: r[3], options: { fill: { color: zebra }, color: C.ink, fontSize: 9, align: "left", valign: "middle" } },
    ];
  });
  s.addTable([head, ...body], {
    x: 0.5, y: 1.28, w: 9.0, colW: [2.05, 0.85, 0.95, 5.15],
    rowH: 0.0, autoPage: false, border: { type: "solid", pt: 0.5, color: "D6E2E2" },
    fontFace: FONT, valign: "middle", margin: [2, 4, 2, 4],
  });
}

/* ============== 3.3 ② Frontend ============== */
fileTableSlide("3.3", "소스 파일 구성 — Frontend (React 19) · 팀원 담당", pg(), C.teal, [
  ["App.jsx", 899, "팀원", "라우터 · 새로고침 세션 자동복원 · 전역 상태"],
  ["LoginPage.jsx", 338, "팀원", "로그인 · 아이디/비밀번호 찾기"],
  ["SignupPage.jsx", 628, "팀원", "회원가입 · 중복확인 · 입력 유효성 검사"],
  ["RoutinePage.jsx", 437, "팀원", "시간대별 루틴 등록 · 완료 토글"],
  ["HomePage.jsx", 936, "팀원", "홈 · 오늘의 루틴 · 인증 사진 업로드"],
  ["FeedPage.jsx", 1091, "팀원", "피드 무한스크롤 · 댓글 · 좋아요 · 신고 모달"],
  ["MyPage.jsx", 904, "팀원", "프로필 · 갤러리 · 핵심지표 · 아바타 업로드"],
  ["StatsPage.jsx", 318, "팀원", "시간대/주간/월간 달성률 차트"],
  ["ChallengePage.jsx", 971, "팀원", "챌린지 목록 · 참가 · 인증 업로드"],
  ["AdminPage.jsx", 862, "팀원", "공지 · 신고 처리 · 관리자(+챌린지 등록)"],
  ["NoticeList/Detail.jsx", 256, "팀원", "공지 목록 · 상세 열람"],
  ["main.jsx · config.js", 47, "팀원", "앱 엔트리 · API_BASE 단일 출처"],
]);

/* ============== 3.3 ③ Backend (Express BFF) ============== */
fileTableSlide("3.3", "소스 파일 구성 — Backend (Express BFF)", pg(), C.teal2, [
  ["app.js", 201, "본인", "미들웨어 · 세션 · CORS · 라우터 마운트"],
  ["database.js", 708, "본인", "FastAPI 호출 · fetchJson 헬퍼 · 세션 DB"],
  ["lib/s3.js", 104, "본인", "S3 키 검증 · 객체 삭제 (보안 가드)"],
  ["middleware/ (auth·admin)", 77, "본인", "세션 인증 가드 · 관리자 권한 가드"],
  ["login.js", 605, "본인", "인증 · 세션 발급 · 프로필 · 아바타 업로드"],
  ["routine.js", 82, "본인", "루틴 CRUD 중계"],
  ["completion.js", 107, "본인", "루틴 완료 기록 중계"],
  ["feed.js", 219, "본인", "피드 · multer-s3 업로드 · orphan 보상삭제"],
  ["comment.js · like.js", 132, "본인", "댓글 · 좋아요 토글 중계"],
  ["mypage.js · stats.js", 97, "본인", "마이페이지 · 통계 중계"],
  ["notice.js", 140, "본인", "공지 중계 (관리자)"],
  ["report.js", 128, "본인", "신고 접수 · 제재 처리 중계"],
  ["challenge.js", 306, "팀원", "챌린지 업로드 · CRUD · 현황 중계"],
]);

/* ============== 3.3 ④ FastAPI ============== */
fileTableSlide("3.3", "소스 파일 구성 — Application API (FastAPI)", pg(), "3E8E7E", [
  ["app.py", 120, "본인", "INTERNAL_API_KEY 게이트 · 라우터 마운트"],
  ["database.py", 200, "본인", "PyMySQL 커넥션 풀 · slow-SQL 로그"],
  ["user.py", 697, "본인", "회원가입 · 세션 · 프로필 수정"],
  ["routine.py", 235, "본인", "루틴 CRUD"],
  ["completion.py", 293, "본인", "완료 기록 · 하루 1회 중복 방지"],
  ["feed.py", 646, "본인", "단일 JOIN · 커서 페이지네이션 · 챌린지 병합"],
  ["comment.py", 192, "본인", "댓글 CRUD · 작성자 소유 검증"],
  ["like.py", 159, "본인", "좋아요 UNIQUE 제약 토글"],
  ["mypage.py", 263, "본인", "summary · gallery · 연속달성(streak) 집계"],
  ["stats.py", 239, "본인", "시간대/기간별 달성률 집계"],
  ["notice.py", 402, "본인", "공지 CRUD"],
  ["report.py", 454, "본인", "신고 접수 · 중복 차단 · 관리자 제재"],
  ["challenge.py", 840, "팀원", "챌린지 참여 · 인증 · 관리자 CRUD"],
]);

/* ===== 공용: 가로 파이프라인 (요청 흐름) ===== */
function pipeline(s, y, h, steps) {
  const n = steps.length, x0 = 0.5, total = 9.0, gap = 0.42;
  const bw = (total - (n - 1) * gap) / n;
  steps.forEach((st, i) => {
    const x = x0 + i * (bw + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: bw, h, rectRadius: 0.08, fill: { color: st.c || C.teal }, line: { type: "none" }, shadow: shadow() });
    s.addText(st.t, { x: x + 0.06, y: y + 0.14, w: bw - 0.12, h: 0.4, margin: 0, fontFace: FONT, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle" });
    s.addText(st.s, { x: x + 0.06, y: y + 0.52, w: bw - 0.12, h: h - 0.6, margin: 0, fontFace: FONT, fontSize: 9, color: "E6F2F0", align: "center", valign: "top", lineSpacingMultiple: 1.0 });
    if (i < n - 1) s.addText("▶", { x: x + bw, y, w: gap, h, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.accent, align: "center", valign: "middle" });
  });
}
/* ===== 공용: 핵심 포인트 카드 ===== */
function pointsCard(s, y, h, title, points) {
  card(s, 0.5, y, 9.0, h, C.accent);
  s.addText(title, { x: 0.72, y: y + 0.14, w: 8.5, h: 0.32, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: C.accent });
  s.addText(points.map((p, i) => ({ text: p, options: { bullet: { code: "2022" }, color: C.ink, breakLine: i < points.length - 1 } })),
    { x: 0.8, y: y + 0.52, w: 8.4, h: h - 0.64, margin: 0, fontFace: FONT, fontSize: 11.5, valign: "top", lineSpacingMultiple: 1.18, paraSpaceAfter: 4 });
}

/* ============== 3.4 ① 메뉴 구성 맵 ============== */
(function menuMap() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.4", title: "메뉴별 기능 — 화면 구성 맵", page: pg() });
  const menus = [
    ["회원가입 · 로그인", "계정 생성 · httpOnly 세션", C.teal],
    ["홈", "오늘의 루틴 · 인증 업로드", C.teal],
    ["루틴", "시간대별 등록 · 완료 체크", C.teal],
    ["피드", "인증 사진 · 댓글 · 좋아요", C.teal2],
    ["마이페이지", "프로필 · 갤러리 · 연속달성", C.teal2],
    ["통계", "시간대/주간/월간 달성률", C.teal2],
    ["챌린지", "참가 · 인증 · 피드 공유", C.accent],
    ["공지", "관리자 공지 열람", "3E8E7E"],
    ["신고", "피드 신고 · 카테고리 6종", "3E8E7E"],
    ["관리자", "공지 · 신고 · 챌린지 관리", C.dark],
  ];
  const cols = 5, gx = 0.5, gy = 1.45, gap = 0.2;
  const tw = (9.0 - (cols - 1) * gap) / cols, th = 1.55;
  menus.forEach((m, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = gx + col * (tw + gap), y = gy + row * (th + 0.25);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: tw, h: th, fill: { color: C.card }, line: { color: C.line, width: 1 }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: tw, h: 0.09, fill: { color: m[2] }, line: { type: "none" } });
    s.addShape(pres.shapes.OVAL, { x: x + tw / 2 - 0.22, y: y + 0.28, w: 0.44, h: 0.44, fill: { color: m[2] }, line: { type: "none" } });
    s.addText(String(i + 1), { x: x + tw / 2 - 0.22, y: y + 0.28, w: 0.44, h: 0.44, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.white, align: "center", valign: "middle" });
    s.addText(m[0], { x: x + 0.08, y: y + 0.78, w: tw - 0.16, h: 0.34, margin: 0, fontFace: FONT, fontSize: 11.5, bold: true, color: C.dark, align: "center" });
    s.addText(m[1], { x: x + 0.1, y: y + 1.12, w: tw - 0.2, h: 0.38, margin: 0, fontFace: FONT, fontSize: 8.5, color: C.mute, align: "center", valign: "top", lineSpacingMultiple: 1.0 });
  });
})();

/* ============== 3.4 ② 인증 시나리오 ============== */
(function authScenario() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.4", title: "메뉴별 기능 — 회원가입 · 로그인 시나리오", page: pg() });
  pipeline(s, 1.45, 1.15, [
    { t: "회원가입 입력", s: "아이디·비번·닉네임", c: C.teal },
    { t: "중복 검사", s: "login_id UNIQUE", c: C.teal2 },
    { t: "bcrypt 해시", s: "salt round 10", c: "3E8E7E" },
    { t: "세션 발급", s: "httpOnly 쿠키", c: C.teal },
    { t: "로그인 유지", s: "credentials:include", c: C.dark },
  ]);
  pointsCard(s, 3.0, 1.95, "핵심 포인트", [
    "비밀번호는 Express에서 bcrypt 해시 후 저장 → DB에는 해시 문자열만 보관(평문 금지)",
    "세션 ID(UUID v4)는 DB sessions 테이블 + httpOnly 쿠키 → JS 접근 불가로 XSS 토큰 탈취 방어",
    "login_id UNIQUE 인덱스 + Express 사전 검증 이중화 → 동시 가입 레이스에도 안전",
    "레거시 평문 비밀번호는 로그인 성공 시 자동으로 bcrypt 해시로 교체(lazy migration)",
  ]);
})();

/* ============== 3.4 ③ 루틴 등록·완료 시나리오 ============== */
(function routineScenario() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.4", title: "메뉴별 기능 — 루틴 등록 · 완료 체크", page: pg() });
  // 좌: 단계, 우: 규칙
  const steps = [
    ["1", "루틴 등록", "아침/점심/저녁 시간대 + 제목 입력 → routines INSERT"],
    ["2", "완료 체크 ✓", "체크 시 오늘 동일 루틴 완료 행 확인 후 INSERT (BEGIN→COMMIT)"],
    ["3", "달성률 재계산", "distinct routine_id 기준 1회 인정 → 즉시 화면 반영"],
    ["4", "체크 해제", "Soft Delete (deleted_at) → 기록 보존하며 미완료 처리"],
  ];
  let y = 1.45;
  steps.forEach((st) => {
    card(s, 0.5, y, 5.4, 0.78, C.teal);
    s.addShape(pres.shapes.OVAL, { x: 0.66, y: y + 0.17, w: 0.44, h: 0.44, fill: { color: C.teal }, line: { type: "none" } });
    s.addText(st[0], { x: 0.66, y: y + 0.17, w: 0.44, h: 0.44, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.white, align: "center", valign: "middle" });
    s.addText(st[1], { x: 1.25, y: y + 0.1, w: 4.5, h: 0.3, margin: 0, fontFace: FONT, fontSize: 12.5, bold: true, color: C.dark });
    s.addText(st[2], { x: 1.25, y: y + 0.38, w: 4.55, h: 0.36, margin: 0, fontFace: FONT, fontSize: 9, color: C.mute, valign: "top", lineSpacingMultiple: 1.0 });
    y += 0.92;
  });
  // 우측 규칙 카드
  card(s, 6.1, 1.45, 3.4, 3.4, C.accent);
  s.addText("완료 판정 규칙", { x: 6.3, y: 1.6, w: 3.0, h: 0.34, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: C.accent });
  s.addText([
    { text: "오늘 완료 = DATE(completed_at) = CURDATE()", options: { breakLine: true, bold: true, color: C.dark } },
    { text: "(KST 기준 통일)", options: { breakLine: true, color: C.mute, fontSize: 9, paraSpaceAfter: 10 } },
    { text: "하루 여러 번 체크해도", options: { breakLine: true, bold: true, color: C.dark } },
    { text: "distinct routine_id 단위 1회만 인정", options: { breakLine: true, color: C.mute, fontSize: 9, paraSpaceAfter: 10 } },
    { text: "마이페이지 달성률·연속달성", options: { breakLine: true, bold: true, color: C.dark } },
    { text: "계산도 동일 규칙 적용", options: { color: C.mute, fontSize: 9 } },
  ], { x: 6.3, y: 2.05, w: 3.05, h: 2.6, margin: 0, fontFace: FONT, fontSize: 11, valign: "top", lineSpacingMultiple: 1.1 });
})();

/* ============== 3.4 ④ 피드 시나리오 ============== */
(function feedScenario() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.4", title: "메뉴별 기능 — 피드 작성 · 무한 스크롤", page: pg() });
  pipeline(s, 1.45, 1.15, [
    { t: "사진 선택", s: "이미지/영상", c: C.teal },
    { t: "multer-s3", s: "S3 직접 PUT", c: C.teal2 },
    { t: "feeds INSERT", s: "feeds+images", c: "3E8E7E" },
    { t: "커서 조회", s: "GET /feed?cursor", c: C.teal },
    { t: "무한 스크롤", s: "Observer", c: C.dark },
  ]);
  pointsCard(s, 3.0, 1.95, "핵심 포인트", [
    "multer-s3가 EC2 임시 디스크를 건너뛰고 S3로 직접 업로드 → 디스크 IO 0, 임시파일 청소 불필요",
    "FastAPI INSERT 실패 시 Express가 업로드된 S3 객체를 보상 삭제(orphan 청소)",
    "커서 페이지네이션(created_at, feed_id) → 새 글 추가/삭제에도 중복·누락 없음",
    "챌린지 인증(share_to_feed=1)을 같은 피드 목록에 source_type 메타로 병합 표시",
  ]);
})();

/* ============== 3.4 ⑤ 마이페이지 · 통계 ============== */
(function mypageScenario() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.4", title: "메뉴별 기능 — 마이페이지 · 통계 (단일 응답)", page: pg() });
  // 단일 호출 → 3블록 (출발 블록은 채워진 틸 박스)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.45, w: 2.5, h: 1.1, rectRadius: 0.08, fill: { color: C.teal }, line: { type: "none" }, shadow: shadow() });
  s.addText([{ text: "GET /mypage", options: { bold: true, color: C.white, breakLine: true } }, { text: "한 번의 호출", options: { color: "E6F2F0", fontSize: 10 } }],
    { x: 0.5, y: 1.45, w: 2.5, h: 1.1, margin: 0, fontFace: FONT, fontSize: 13, align: "center", valign: "middle" });
  s.addText("▶", { x: 3.0, y: 1.45, w: 0.5, h: 1.1, margin: 0, fontFace: FONT, fontSize: 16, bold: true, color: C.accent, align: "center", valign: "middle" });
  const blocks = [["user", "프로필 1행"], ["summary", "루틴·완료·streak"], ["gallery", "피드+이미지"]];
  blocks.forEach((b, i) => {
    const x = 3.55 + i * 2.02;
    card(s, x, 1.45, 1.9, 1.1, C.teal2);
    s.addText(b[0], { x: x + 0.05, y: 1.55, w: 1.8, h: 0.4, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: C.dark, align: "center" });
    s.addText(b[1], { x: x + 0.05, y: 1.95, w: 1.8, h: 0.5, margin: 0, fontFace: FONT, fontSize: 9.5, color: C.mute, align: "center", valign: "top" });
  });
  pointsCard(s, 3.0, 1.95, "집계 설계", [
    "한 번의 /mypage 호출로 user + summary + gallery 동시 수신 → 새로고침 시 N+1 호출 제거",
    "연속 달성(streak): 오늘부터 거꾸로 '하루 1개 이상 완료'가 끊기지 않는 길이를 앱에서 계산(최근 365일)",
    "통계: 시간대별 7일 달성률 + 월별 캘린더 완료일 + 누적 인증 수를 인덱스(user_id, completed_at) 위에서 집계",
    "모든 집계는 FastAPI에서 단일 JSON으로 모아 응답 → 프론트는 차트 렌더링에만 집중",
  ]);
})();

/* ============== 3.4 ⑥ 공지 · 신고 · 챌린지 연동 ============== */
(function noticeReportScenario() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.4", title: "메뉴별 기능 — 공지 · 신고 · 챌린지 연동", page: pg() });
  // 좌: 신고 흐름 / 우: 공지·챌린지
  card(s, 0.5, 1.4, 4.5, 3.45, C.teal);
  s.addText("피드 신고", { x: 0.72, y: 1.54, w: 4.1, h: 0.34, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: C.teal });
  s.addText([
    { text: "신고 대상은 피드 전용", options: { bullet: { code: "2022" }, bold: true, color: C.dark, breakLine: true } },
    { text: "카테고리 6종 + 상세 사유 입력", options: { bullet: { code: "2022" }, color: C.ink, breakLine: true } },
    { text: "신고자는 세션에서 주입(위조 방지)", options: { bullet: { code: "2022" }, color: C.ink, breakLine: true } },
    { text: "대상자는 feed_id로 작성자 자체 조회", options: { bullet: { code: "2022" }, color: C.ink, breakLine: true } },
    { text: "동일인 중복 신고(pending) 409 차단", options: { bullet: { code: "2022" }, color: C.ink, breakLine: true } },
    { text: "관리자: 한 피드의 신고 일괄 처리(completed)", options: { bullet: { code: "2022" }, color: C.ink } },
  ], { x: 0.8, y: 1.95, w: 4.05, h: 2.8, margin: 0, fontFace: FONT, fontSize: 10.5, valign: "top", lineSpacingMultiple: 1.15, paraSpaceAfter: 5 });

  card(s, 5.2, 1.4, 4.3, 3.45, C.accent);
  s.addText("공지 · 챌린지 연동", { x: 5.42, y: 1.54, w: 4.0, h: 0.34, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: C.accent });
  s.addText([
    { text: "공지", options: { bold: true, color: C.dark, breakLine: true } },
    { text: "관리자가 작성(requireAdmin), 사용자는 목록·상세 열람, Soft Delete 필터 적용", options: { color: C.ink, breakLine: true, paraSpaceAfter: 10, fontSize: 10.5 } },
    { text: "챌린지 → 피드 공유", options: { bold: true, color: C.dark, breakLine: true } },
    { text: "챌린지 인증을 별도 feeds 행으로 복제하지 않고, share_to_feed=1 인증을 GET /feed 단계에서 source_type=\"challenge\" 메타로 병합", options: { color: C.ink, breakLine: true, paraSpaceAfter: 10, fontSize: 10.5 } },
    { text: "관리자 페이지", options: { bold: true, color: C.dark, breakLine: true } },
    { text: "공지 작성 · 신고 처리 · 챌린지 현황을 한 화면에서 운영", options: { color: C.ink, fontSize: 10.5 } },
  ], { x: 5.42, y: 1.95, w: 4.0, h: 2.8, margin: 0, fontFace: FONT, fontSize: 10.5, valign: "top", lineSpacingMultiple: 1.12 });
})();

/* ===== 공용: 2x2 테마 카드 ===== */
function quadCards(s, items, startY, cardH) {
  const gx = 0.5, gw = 4.45, gapx = 0.1, gapy = 0.18;
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * (gw + gapx), y = startY + row * (cardH + gapy);
    card(s, x, y, gw, cardH, it.c || C.teal);
    s.addText(it.h, { x: x + 0.22, y: y + 0.14, w: gw - 0.4, h: 0.34, margin: 0, fontFace: FONT, fontSize: 14, bold: true, color: it.c || C.teal });
    s.addText(it.d, { x: x + 0.24, y: y + 0.52, w: gw - 0.44, h: cardH - 0.64, margin: 0, fontFace: FONT, fontSize: 10.5, color: C.ink, valign: "top", lineSpacingMultiple: 1.12 });
  });
}

/* ============== 3.7 프로젝트를 수행하며 배우고 느낀점 ============== */
(function reflection() {
  const s = pres.addSlide();
  header(s, pres, { tag: "3.7", title: "프로젝트를 수행하며 배우고 느낀점", page: pg() });
  quadCards(s, [
    { h: "설계로 체득한 것", c: C.teal, d: "3-Tier(BFF) 구조를 직접 설계하며 '왜 계층을 나누는가'를 코드로 이해했다. 세션·CORS·업로드는 Express가, 도메인 로직·DB는 FastAPI가 맡도록 신뢰 경계를 나누니 책임과 보안이 명확해졌다." },
    { h: "운영을 가정한 문제 해결", c: C.teal2, d: "커넥션 누수·S3 orphan 파일·분산 트랜잭션 같은 문제를 마주하며 풀 반환(try/finally), 보상 삭제, 커서 페이지네이션을 도입했다. PyMySQL 커넥션 풀을 의존성 없이 직접 구현하며 동시성·자원 관리를 깊이 배웠다." },
    { h: "데이터 무결성과 품질", c: "3E8E7E", d: "Soft Delete 필터 누락 같은 무결성 이슈를 P0로 분류해 잡았고, 백로그·코드리뷰 문서로 기술 부채를 추적했다. 모든 수정에 4요소 주석 규칙을 세워 협업 가독성을 높였다." },
    { h: "협업과 통합", c: C.accent, d: "프론트엔드 팀에 API 명세·응답 스키마를 제공해 연동을 맞추고, Docker로 팀 전체의 개발·운영 환경을 일치시켰다. 혼자가 아니라 함께 굴러가는 코드를 만드는 법을 배웠다." },
  ], 1.32, 1.62);
  // 한 줄 소회
  card(s, 0.5, 4.78, 9.0, 0.5, C.dark);
  s.addText("\"동작하는 코드에서 운영 가능한 코드로 가는 거리\"를 체감한 프로젝트였다.", {
    x: 0.5, y: 4.78, w: 9.0, h: 0.5, margin: 0, fontFace: FONT, fontSize: 12.5, bold: true, color: C.dark, align: "center", valign: "middle",
  });
})();

/* ============== 4. 향후 과제 (본인 담당 관점) ============== */
(function future() {
  const s = pres.addSlide();
  header(s, pres, { tag: "4", title: "향후 과제 — 백엔드 · DB · 인프라 관점", page: pg() });
  s.addText("※ 향후 과제는 팀원별 각자 작성 — 아래는 본인 담당 영역(백엔드·DB·인프라)의 개선 로드맵", {
    x: 0.5, y: 1.16, w: 9, h: 0.32, margin: 0, fontFace: FONT, fontSize: 11, bold: true, color: C.teal,
  });
  quadCards(s, [
    { h: "권한 모델 고도화", c: C.teal, d: "현재 login_id == \"admin\" 문자열 판별을 users.role 기반 RBAC로 전환. /me 응답에 role을 포함해 새로고침 후 관리자 상태까지 복구." },
    { h: "인증 보안 강화", c: C.teal2, d: "비밀번호 변경 시 전체 세션 무효화, 아이디/비밀번호 찾기 IP 기준 rate limit, 이메일 토큰 기반 재설정, Helmet/CSP 헤더 적용." },
    { h: "운영 관측성", c: "3E8E7E", d: "slow request/SQL 로그를 CloudWatch·Grafana로 연동, 5xx 비율·커넥션 풀 대기 알림, 관리자 행위 audit log 테이블 도입." },
    { h: "성능 · 자동화", c: C.accent, d: "이미지 압축·썸네일(WebP), 커넥션 풀 파라미터 튜닝, CI에서 lint/build/py_compile 자동 실행으로 배포 전 회귀 차단, 무중단 롤링 배포." },
  ], 1.55, 1.6);
})();

/* ============== 부록. 실행 방법 (Windows) ============== */
(function runGuide() {
  const s = pres.addSlide();
  header(s, pres, { tag: "부록", title: "실행 방법 (Windows)", page: pg() });
  s.addText("React + Express + FastAPI 3계층. DB(AWS RDS)·파일저장소(S3)는 외부 인프라 → 실행 시 자격증명(.env) 필요.", {
    x: 0.5, y: 1.18, w: 9, h: 0.32, margin: 0, fontFace: FONT, fontSize: 11.5, bold: true, color: C.teal,
  });
  pipeline(s, 1.6, 1.12, [
    { t: "① 사전 준비", s: "Git · Docker Desktop", c: C.teal },
    { t: "② 소스 받기", s: "git clone · checkout dev", c: C.teal2 },
    { t: "③ 환경변수", s: ".env 3개 작성", c: "3E8E7E" },
    { t: "④ 실행", s: "docker compose up --build", c: C.teal },
    { t: "⑤ 접속", s: "localhost:5173", c: C.dark },
  ]);
  pointsCard(s, 3.1, 1.95, "핵심 안내", [
    "DB(AWS RDS)·파일저장소(S3)는 외부 인프라이므로 실행하려면 자격증명 .env가 필요하다(제출 시 별도 전달).",
    "src\\backend\\.env 와 src\\python_api\\.env 의 INTERNAL_API_KEY 는 반드시 같은 값이어야 한다.",
    "Docker 없이도 가능: PowerShell 3개에서 uvicorn app:app --port 8000 · npm start(backend) · npm run dev(루트).",
    "접속은 http://localhost:5173 (Express 3000·FastAPI 8000은 내부 통신용).",
  ]);
})();

pres.writeFile({ fileName: "RoutineMate_본인담당파트.pptx" }).then(f => console.log("WROTE:", f));
