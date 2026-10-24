-- Mathematics workspace. Additive, no changes to existing tables.
CREATE TABLE IF NOT EXISTS math_students (
 id BIGSERIAL PRIMARY KEY,
 full_name VARCHAR(120) NOT NULL,
 grade SMALLINT CHECK(grade BETWEEN 2 AND 7),
 archived BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS math_students_lookup ON math_students (lower(trim(full_name))) WHERE NOT archived;
CREATE TABLE IF NOT EXISTS math_tests (
 id BIGSERIAL PRIMARY KEY,
 held_on DATE NOT NULL,
 title VARCHAR(120) NOT NULL,
 question_count SMALLINT NOT NULL CHECK(question_count BETWEEN 1 AND 200),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(held_on,title)
);
CREATE TABLE IF NOT EXISTS math_results (
 test_id BIGINT NOT NULL REFERENCES math_tests(id),
 student_id BIGINT NOT NULL REFERENCES math_students(id),
 status VARCHAR(16) NOT NULL CHECK(status IN ('present','dq')),
 correct_answers SMALLINT,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(test_id,student_id),
 CONSTRAINT math_score_valid CHECK ((status='dq' AND correct_answers IS NULL) OR (status='present' AND correct_answers BETWEEN 0 AND 200))
);
CREATE INDEX IF NOT EXISTS math_results_student ON math_results(student_id,test_id);
CREATE TABLE IF NOT EXISTS math_monthly_payments (
 student_id BIGINT NOT NULL REFERENCES math_students(id),
 month DATE NOT NULL,
 paid BOOLEAN NOT NULL DEFAULT FALSE,
 amount_uzs INTEGER CHECK(amount_uzs IS NULL OR amount_uzs BETWEEN 1000 AND 100000000),
 admin_note VARCHAR(250),
 paid_at TIMESTAMPTZ,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(student_id,month)
);
CREATE TABLE IF NOT EXISTS math_revision (
 singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK(singleton),
 revision BIGINT NOT NULL DEFAULT 1,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO math_revision(singleton) VALUES(TRUE) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS math_import_audit (
 id BIGSERIAL PRIMARY KEY,
 test_id BIGINT REFERENCES math_tests(id),
 imported_rows INTEGER NOT NULL,
 source VARCHAR(32) NOT NULL,
 imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
