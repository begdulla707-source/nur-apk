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
