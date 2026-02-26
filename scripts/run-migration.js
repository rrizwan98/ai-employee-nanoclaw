/**
 * Database Migration Script
 * Runs all SQL migrations against PostgreSQL (Neon)
 *
 * Usage: node scripts/run-migration.js
 */

import { readFileSync, readdirSync } from 'fs';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_OcSJjk4FRn6u@ep-lucky-king-aiyr2roc-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  console.log('Connecting to PostgreSQL (Neon)...');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('Connected successfully!\n');

    // Get all migration files sorted
    const migrationsDir = join(__dirname, '..', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration(s):\n`);

    for (const file of migrationFiles) {
      const migrationPath = join(migrationsDir, file);
      const migrationSQL = readFileSync(migrationPath, 'utf8');

      console.log(`Running: ${file}`);

      try {
        await client.query(migrationSQL);
        console.log(`  OK - ${file}\n`);
      } catch (err) {
        // Skip "already exists" errors
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log(`  SKIPPED - ${file} (already applied)\n`);
        } else {
          throw err;
        }
      }
    }

    // Verify projects table columns
    console.log('Verifying projects table structure...\n');
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `);

    console.log('Projects table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    // Check for new columns
    const columns = result.rows.map(r => r.column_name);
    const newColumns = ['local_path', 'current_version', 'code_files', 'agent_type', 'slug'];
    const hasNewColumns = newColumns.every(col => columns.includes(col));

    if (hasNewColumns) {
      console.log('\n All agent storage columns present!');
    } else {
      const missing = newColumns.filter(col => !columns.includes(col));
      console.log(`\n Missing columns: ${missing.join(', ')}`);
    }

    client.release();
    console.log('\nMigrations completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
