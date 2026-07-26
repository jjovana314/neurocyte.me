import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';

dotenv.config();

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_URL,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    multipleStatements: true,
  });
  console.log('Connected to database.');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
      \`name\` varchar(255) NOT NULL,
      \`appliedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    'SELECT `name` FROM `schema_migrations`',
  );
  const applied = new Set(rows.map((row) => row.name as string));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  let ranCount = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Already applied, skipping: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`Applying: ${file}`);
    await connection.query(sql);
    await connection.query(
      'INSERT INTO `schema_migrations` (`name`) VALUES (?)',
      [file],
    );
    ranCount++;
  }

  console.log(
    ranCount > 0
      ? `Migration complete: ${ranCount} file(s) applied.`
      : 'Migration complete: nothing to apply, already up to date.',
  );

  await connection.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
