import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'farmer',
        display_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        price NUMERIC NOT NULL,
        quantity TEXT,
        location TEXT,
        image_url TEXT,
        seller_name TEXT,
        seller_phone TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS product_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL,
        buyer_name TEXT NOT NULL,
        buyer_phone TEXT NOT NULL,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        video_url TEXT,
        type TEXT NOT NULL DEFAULT 'image',
        whatsapp TEXT,
        published BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS advert_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'standard',
        advert_type TEXT NOT NULL DEFAULT 'image',
        status TEXT NOT NULL DEFAULT 'pending',
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        generated_image_url TEXT,
        generated_video_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS intern_attachment_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_name TEXT NOT NULL,
        student_email TEXT NOT NULL,
        institution TEXT NOT NULL,
        program TEXT NOT NULL,
        year TEXT NOT NULL,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        response TEXT,
        farmer_email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS consultations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        response TEXT,
        payment_status TEXT NOT NULL DEFAULT 'free',
        payment_ref TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS study_materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        grade TEXT NOT NULL,
        subject TEXT,
        file_type TEXT NOT NULL,
        file_data TEXT,
        file_name TEXT,
        mime_type TEXT,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        grade TEXT NOT NULL,
        category TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS subjects_name_grade_idx ON subjects (LOWER(name), grade);
    `);

    // Seed default subjects
    const defaultSubjects: [string, string, string][] = [
      ["Mathematics", "grade7", "Core"],
      ["English Language", "grade7", "Core"],
      ["Science", "grade7", "Core"],
      ["Social Studies", "grade7", "Humanities"],
      ["Shona", "grade7", "Languages"],
      ["Ndebele", "grade7", "Languages"],
      ["General Paper", "grade7", "Core"],
      ["Mathematics", "olevel", "Core"],
      ["English Language", "olevel", "Core"],
      ["Biology", "olevel", "Sciences"],
      ["Chemistry", "olevel", "Sciences"],
      ["Physics", "olevel", "Sciences"],
      ["Combined Science", "olevel", "Sciences"],
      ["History", "olevel", "Humanities"],
      ["Geography", "olevel", "Humanities"],
      ["Commerce", "olevel", "Business"],
      ["Accounts", "olevel", "Business"],
      ["Computer Science", "olevel", "Technology"],
      ["Art", "olevel", "Arts"],
      ["Agriculture", "olevel", "Technical"],
      ["Pure Mathematics", "alevel", "Core"],
      ["Applied Mathematics", "alevel", "Core"],
      ["Further Mathematics", "alevel", "Core"],
      ["Biology", "alevel", "Sciences"],
      ["Chemistry", "alevel", "Sciences"],
      ["Physics", "alevel", "Sciences"],
      ["Economics", "alevel", "Business"],
      ["Accounting", "alevel", "Business"],
      ["Business Studies", "alevel", "Business"],
      ["History", "alevel", "Humanities"],
      ["English Literature", "alevel", "Humanities"],
      ["Geography", "alevel", "Humanities"],
      ["Computer Science", "alevel", "Technology"],
      ["Agriculture", "alevel", "Technical"],
    ];

    for (const [name, grade, category] of defaultSubjects) {
      await client.query(
        `INSERT INTO subjects (name, grade, category) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [name, grade, category]
      );
    }

    console.log("All tables created/verified and subjects seeded.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
