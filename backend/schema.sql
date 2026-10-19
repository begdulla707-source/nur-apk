CREATE TABLE IF NOT EXISTS app_subjects (id BIGSERIAL PRIMARY KEY, code TEXT NOT NULL UNIQUE, title TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS app_groups (id BIGSERIAL PRIMARY KEY, subject_id BIGINT NOT NULL REFERENCES app_subjects(id), code TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', archived BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(subject_id,code));

CREATE TABLE IF NOT EXISTS app_students (id BIGSERIAL PRIMARY KEY, group_id BIGINT NOT NULL REFERENCES app_groups(id), full_name TEXT NOT NULL CHECK (length(full_name) <= 120), archived BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS app_sessions (id BIGSERIAL PRIMARY KEY, group_id BIGINT NOT NULL REFERENCES app_groups(id), title TEXT NOT NULL, held_on DATE NOT NULL, archived BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS app_marks (id BIGSERIAL PRIMARY KEY, session_id BIGINT NOT NULL REFERENCES app_sessions(id), student_id BIGINT NOT NULL REFERENCES app_students(id), score NUMERIC(5,2), absent BOOLEAN NOT NULL DEFAULT FALSE, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(session_id,student_id), CHECK ((absent = TRUE AND score IS NULL) OR (absent = FALSE AND score BETWEEN 0 AND 100)));

CREATE TABLE IF NOT EXISTS app_notices (id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, archived BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE INDEX IF NOT EXISTS app_students_by_group ON app_students(group_id);

CREATE INDEX IF NOT EXISTS app_sessions_by_group ON app_sessions(group_id);

CREATE INDEX IF NOT EXISTS app_marks_by_student ON app_marks(student_id);

INSERT INTO app_subjects(code,title) VALUES ('mat','Matematika'),('fiz','Fizika'),('rus','Rus tili'),('eng','Ingliz tili') ON CONFLICT(code) DO NOTHING;

INSERT INTO app_groups(subject_id, code, title) SELECT s.id, x.code, x.code || ' guruhi' FROM app_subjects s CROSS JOIN (VALUES ('A'),('B'),('C'),('V'),('G'),('J'),('H')) AS x(code) WHERE s.code='mat' ON CONFLICT(subject_id,code) DO NOTHING;
