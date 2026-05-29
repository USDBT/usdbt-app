import postgres from 'postgres'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL?.trim()
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set')

const sql = postgres(DATABASE_URL, { ssl: 'require' })
const migrationsDir = join(import.meta.dir, '../db/migrations')

// Ensure tracking table exists first
await sql`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    applied_at timestamptz DEFAULT now()
  )
`

const applied = new Set(
  (await sql`SELECT version FROM schema_migrations`).map((r) => r.version)
)

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql') && f !== '000_schema_migrations.sql')
  .sort()

let count = 0
for (const file of files) {
  if (applied.has(file)) {
    console.log(`[migrate] skip (already applied): ${file}`)
    continue
  }
  const content = readFileSync(join(migrationsDir, file), 'utf-8')
  console.log(`[migrate] applying ${file}`)
  await sql.unsafe(content)
  await sql`INSERT INTO schema_migrations (version) VALUES (${file})`
  console.log(`[migrate] done: ${file}`)
  count++
}

await sql.end()
console.log(`[migrate] finished — ${count} new migration(s) applied`)
