import postgres from 'postgres'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`[config] Missing required env var: ${name}`)
  return value
}

export const sql = postgres(requiredEnv('DATABASE_URL'), { ssl: 'require' })

export async function runMigrations(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz DEFAULT now()
    )
  `

  const applied = new Set(
    (await sql`SELECT version FROM schema_migrations`).map((r) => r.version)
  )

  const migrationsDir = join(import.meta.dir, '../../db/migrations')
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (applied.has(file)) continue
    console.log(`[migrate] applying ${file}`)
    await sql.unsafe(readFileSync(join(migrationsDir, file), 'utf-8'))
    await sql`INSERT INTO schema_migrations (version) VALUES (${file})`
    console.log(`[migrate] done: ${file}`)
  }
}
