import { query } from "./db.js";
import { logger } from "./logger.js";

export async function initDb(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS sh_subjects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      level TEXT NOT NULL CHECK (level IN ('O-Level', 'A-Level', 'Grade 7')),
      category TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sh_study_materials (
      id SERIAL PRIMARY KEY,
      subject_id INTEGER REFERENCES sh_subjects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image', 'video', 'note')),
      file_data BYTEA,
      file_name TEXT,
      mime_type TEXT,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sh_student_users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sh_student_progress (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES sh_student_users(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES sh_subjects(id) ON DELETE CASCADE,
      materials_viewed JSONB NOT NULL DEFAULT '[]',
      last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(student_id, subject_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sh_quiz_questions (
      id SERIAL PRIMARY KEY,
      subject_id INTEGER REFERENCES sh_subjects(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_answer INTEGER NOT NULL,
      explanation TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sh_quiz_attempts (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES sh_student_users(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES sh_subjects(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      exam_mode BOOLEAN NOT NULL DEFAULT FALSE,
      taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sh_bookmarks (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES sh_student_users(id) ON DELETE CASCADE,
      material_id INTEGER REFERENCES sh_study_materials(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(student_id, material_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sh_study_planner_events (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES sh_student_users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      subject_id INTEGER REFERENCES sh_subjects(id) ON DELETE SET NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  logger.info("Study Hub database tables verified");
}
