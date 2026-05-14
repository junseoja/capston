-- ============================================================
-- 2026-05-13 마이그레이션 — 관리자 페이지 + 챌린지 시스템
-- ============================================================
-- 추가되는 테이블 6개:
--   1) challenges               — 챌린지 기본 정보
--   2) challenge_participants   — 챌린지 참여자
--   3) challenge_proofs         — 챌린지 인증
--   4) challenge_proof_files    — 챌린지 인증 이미지/영상
--   5) notices                  — 관리자 공지사항
--   6) reports                  — 게시글 신고
--
-- 기존 규약 준수:
--   - PK: CHAR(36) UUID v7 (기존 users/feeds/routines 와 일관)
--   - 시간대: KST (DB 커넥션에서 SET time_zone='+09:00')
--   - Soft Delete: deleted_at DATETIME NULL (2026-05-01 도입 패턴)
--   - 실제 FOREIGN KEY 사용 (users/feeds 와 연결)
--
-- 적용 전 주의:
--   1. AWS RDS 백업 또는 스냅샷 후 실행 권장.
--   2. 외래키 추가 시 기존 users/feeds 데이터가 모두 정상이어야 함.
--   3. 트래픽 적은 시간대에 실행 (CREATE TABLE 자체는 가벼움).
--   4. 트랜잭션 단위로 묶고 싶으면 전체를 START TRANSACTION; ... COMMIT; 으로 감싸기.
--      (MySQL 의 DDL 은 암시적 commit 이라 trans 효과 제한적 — 백업이 가장 안전)
--
-- 카테고리 정책 결정 사항 (D1~D4):
--   D1) challenge.category          : VARCHAR(50) 자유 입력 (routines.category 와 일관)
--   D2) notice.category             : ENUM 4종 (NoticeList 필터와 정확히 일치)
--   D3) report.report_category      : ENUM 6종 (FeedPage Stage 2-5 신고 모달과 일치)
--   D4) challenge_proof_files.file_type : VARCHAR(50) mime (feed_images 패턴과 통일)
-- ============================================================


-- ─────────────────────────────────────────────────────────
-- 1) challenges — 챌린지 기본 정보
-- ─────────────────────────────────────────────────────────
CREATE TABLE challenges (
    challenge_id        CHAR(36) PRIMARY KEY                              COMMENT 'UUID v7',

    title               VARCHAR(100) NOT NULL                             COMMENT '챌린지 제목',
    description         TEXT NULL                                         COMMENT '챌린지 설명',
    category            VARCHAR(50) NULL                                  COMMENT '운동/공부/미라클모닝/건강/생활습관 등 (자유)',

    start_date          DATE NOT NULL                                     COMMENT '시작일',
    end_date            DATE NOT NULL                                     COMMENT '종료일',
    total_days          INT UNSIGNED NOT NULL                             COMMENT '총 진행 일수',

    participant_count   INT UNSIGNED NOT NULL DEFAULT 0                   COMMENT '참여자 수 캐시',

    created_by          CHAR(36) NULL                                     COMMENT '생성 관리자 user_id',

    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME NULL                                     COMMENT 'Soft Delete',

    CONSTRAINT chk_challenge_date CHECK (start_date <= end_date),
    CONSTRAINT fk_challenges_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),

    INDEX idx_challenges_active (deleted_at, start_date, end_date),
    INDEX idx_challenges_created_by (created_by, deleted_at)
) COMMENT='챌린지 기본 정보';


-- ─────────────────────────────────────────────────────────
-- 2) challenge_participants — 챌린지 참여자
-- ─────────────────────────────────────────────────────────
CREATE TABLE challenge_participants (
    participant_id      CHAR(36) PRIMARY KEY                              COMMENT 'UUID v7',
    challenge_id        CHAR(36) NOT NULL,
    user_id             CHAR(36) NOT NULL,

    joined_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status              ENUM('ACTIVE','COMPLETED','STOPPED') NOT NULL DEFAULT 'ACTIVE' COMMENT '참여 상태',

    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_participants_challenge_user (challenge_id, user_id),
    CONSTRAINT fk_participants_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id) ON DELETE CASCADE,
    CONSTRAINT fk_participants_user      FOREIGN KEY (user_id)      REFERENCES users(user_id),

    INDEX idx_participants_user (user_id, status)
) COMMENT='챌린지 참여자';


-- ─────────────────────────────────────────────────────────
-- 3) challenge_proofs — 챌린지 인증
-- ─────────────────────────────────────────────────────────
CREATE TABLE challenge_proofs (
    proof_id            CHAR(36) PRIMARY KEY                              COMMENT 'UUID v7',
    challenge_id        CHAR(36) NOT NULL,
    user_id             CHAR(36) NOT NULL,

    content             TEXT NULL                                         COMMENT '인증 글',
    proof_date          DATE NOT NULL                                     COMMENT '하루 1회 인증 제한 기준',

    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at          DATETIME NULL                                     COMMENT 'Soft Delete',

    UNIQUE KEY uq_proofs_challenge_user_date (challenge_id, user_id, proof_date),
    CONSTRAINT fk_proofs_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id) ON DELETE CASCADE,
    CONSTRAINT fk_proofs_user      FOREIGN KEY (user_id)      REFERENCES users(user_id),

    INDEX idx_proofs_user_active (user_id, deleted_at, proof_date),
    INDEX idx_proofs_challenge_active (challenge_id, deleted_at, proof_date)
) COMMENT='챌린지 인증 내역';


-- ─────────────────────────────────────────────────────────
-- 4) challenge_proof_files — 챌린지 인증 이미지/영상
-- ─────────────────────────────────────────────────────────
CREATE TABLE challenge_proof_files (
    proof_file_id       CHAR(36) PRIMARY KEY                              COMMENT 'UUID v7',
    proof_id            CHAR(36) NOT NULL,

    file_url            VARCHAR(500) NOT NULL                             COMMENT 'S3 URL',
    file_type           VARCHAR(50)  NOT NULL                             COMMENT 'mime: image/jpeg, video/mp4 등 (기존 feed_images 와 통일)',
    file_order          INT UNSIGNED NOT NULL DEFAULT 0                   COMMENT '표시 순서',

    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_proof_files_proof FOREIGN KEY (proof_id) REFERENCES challenge_proofs(proof_id) ON DELETE CASCADE,

    INDEX idx_proof_files_proof_order (proof_id, file_order)
) COMMENT='챌린지 인증 이미지/영상';


-- ─────────────────────────────────────────────────────────
-- 5) notices — 관리자 공지사항
-- ─────────────────────────────────────────────────────────
CREATE TABLE notices (
    notice_id           CHAR(36) PRIMARY KEY                              COMMENT 'UUID v7',
    category            ENUM('일반','이벤트','점검','업데이트') NOT NULL  COMMENT 'NoticeList 필터와 일치',

    title               VARCHAR(255) NOT NULL,
    content             TEXT NOT NULL,
    post_date           DATE NOT NULL                                     COMMENT '리스트 표시용 게시일',

    created_by          CHAR(36) NULL                                     COMMENT '작성 관리자 user_id',

    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME NULL                                     COMMENT 'Soft Delete',

    CONSTRAINT fk_notices_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),

    INDEX idx_notices_active (deleted_at, post_date),
    INDEX idx_notices_category (category, deleted_at, post_date)
) COMMENT='관리자 공지사항';


-- ─────────────────────────────────────────────────────────
-- 6) reports — 게시글 신고
-- ─────────────────────────────────────────────────────────
CREATE TABLE reports (
    report_id           CHAR(36) PRIMARY KEY                              COMMENT 'UUID v7',
    feed_id             CHAR(36) NOT NULL                                 COMMENT '신고된 게시글',
    reporter_user_id    CHAR(36) NOT NULL                                 COMMENT '신고한 사용자',
    target_user_id      CHAR(36) NOT NULL                                 COMMENT '게시글 작성자',

    report_category     ENUM('욕설/비방','부적절한 홍보','도용/저작권','스팸/도배','음란/혐오','기타') NOT NULL COMMENT 'FeedPage 신고 모달 카테고리와 일치',
    report_detail       TEXT NULL                                         COMMENT '상세 사유 (선택)',

    status              ENUM('pending','completed') NOT NULL DEFAULT 'pending',
    admin_comment       TEXT NULL                                         COMMENT '관리자가 제재 시 작성',
    processed_by        CHAR(36) NULL                                     COMMENT '처리 관리자 user_id',

    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP       COMMENT '신고 접수 시각',
    processed_at        DATETIME NULL                                     COMMENT '관리자 조치 완료 시각',
    deleted_at          DATETIME NULL                                     COMMENT 'Soft Delete',

    CONSTRAINT fk_reports_feed         FOREIGN KEY (feed_id)          REFERENCES feeds(feed_id),
    CONSTRAINT fk_reports_reporter     FOREIGN KEY (reporter_user_id) REFERENCES users(user_id),
    CONSTRAINT fk_reports_target       FOREIGN KEY (target_user_id)   REFERENCES users(user_id),
    CONSTRAINT fk_reports_processed_by FOREIGN KEY (processed_by)     REFERENCES users(user_id),

    INDEX idx_reports_status (status, deleted_at, created_at),
    INDEX idx_reports_feed   (feed_id, deleted_at),
    INDEX idx_reports_target (target_user_id, deleted_at)
) COMMENT='게시글 신고';


-- ============================================================
-- 적용 후 검증 SQL (예시)
-- ============================================================
-- 테이블 생성 확인:
--   SHOW TABLES LIKE 'challenge%';
--   SHOW TABLES LIKE 'notices';
--   SHOW TABLES LIKE 'reports';
--
-- 컬럼 / FK / 인덱스 확인:
--   DESCRIBE challenges;
--   SHOW CREATE TABLE challenges \G
--   SHOW INDEX FROM challenges;
--
-- ENUM 확인 (notices/reports):
--   SHOW COLUMNS FROM notices WHERE Field='category';
--   SHOW COLUMNS FROM reports WHERE Field='report_category';
-- ============================================================


-- ============================================================
-- 롤백 시 (만약 잘못 생성됐을 때) — 역순으로 DROP
-- ============================================================
-- 주의: 실제 데이터 들어간 상태에서 DROP 하면 데이터 영구 손실.
-- 개발/스테이징 환경에서만 사용.
--
-- DROP TABLE IF EXISTS reports;
-- DROP TABLE IF EXISTS notices;
-- DROP TABLE IF EXISTS challenge_proof_files;
-- DROP TABLE IF EXISTS challenge_proofs;
-- DROP TABLE IF EXISTS challenge_participants;
-- DROP TABLE IF EXISTS challenges;
-- ============================================================
