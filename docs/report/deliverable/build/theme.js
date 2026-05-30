// 공용 테마/헬퍼 — Routine Mate 캡스톤 결과보고서 (본인 담당 파트)
const FONT = "Apple SD Gothic Neo";

const C = {
  bg:     "F4F8F7",   // 본문 배경 (연한 민트 그레이)
  dark:   "0B3B3C",   // 표지/섹션 디바이더 딥 틸
  teal:   "0E7C7B",   // 주 색상
  teal2:  "2AA8A8",   // 보조 틸
  mint:   "7FD1B9",   // 밝은 민트
  accent: "E8833A",   // 포인트 앰버
  ink:    "1E2A2A",   // 본문 텍스트
  mute:   "6B7C7C",   // 보조 텍스트
  card:   "FFFFFF",   // 카드 배경
  line:   "D6E2E2",   // 경계선
  white:  "FFFFFF",
};

const shadow = () => ({ type: "outer", color: "0B3B3C", blur: 7, offset: 3, angle: 135, opacity: 0.12 });

// 본문 슬라이드 공통 헤더(섹션칩 + 제목) + 푸터
function header(slide, pres, { tag, title, page }) {
  slide.background = { color: C.bg };
  // 상단 칩 (3.2 등)
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 0.42, w: 0.86, h: 0.46, rectRadius: 0.08,
    fill: { color: C.accent }, line: { type: "none" },
  });
  slide.addText(tag, {
    x: 0.5, y: 0.42, w: 0.86, h: 0.46, margin: 0,
    fontFace: FONT, fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle",
  });
  // 제목
  slide.addText(title, {
    x: 1.5, y: 0.4, w: 7.6, h: 0.5, margin: 0,
    fontFace: FONT, fontSize: 23, bold: true, color: C.dark, align: "left", valign: "middle",
  });
  // 헤더 구분 영역 배경
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 1.04, w: 10, h: 0.02, fill: { color: C.teal2 }, line: { type: "none" },
  });
  // 푸터
  slide.addText("Routine Mate  |  캡스톤 결과보고서", {
    x: 0.5, y: 5.28, w: 6, h: 0.3, margin: 0,
    fontFace: FONT, fontSize: 9, color: C.mute, align: "left", valign: "middle",
  });
  slide.addText(String(page), {
    x: 9.2, y: 5.28, w: 0.4, h: 0.3, margin: 0,
    fontFace: FONT, fontSize: 9, color: C.mute, align: "right", valign: "middle",
  });
}

module.exports = { FONT, C, shadow, header };
