#!/usr/bin/env node
/**
 * Executes migrations against Supabase using the Management API.
 * Usage: SUPABASE_SERVICE_ROLE_KEY=<key> node supabase/run-migrations.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'esccnfqkavtvngowizgc';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌  Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('    Run: SUPABASE_SERVICE_ROLE_KEY=<key> node supabase/run-migrations.js');
  process.exit(1);
}

async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    // Try the Management API as fallback
    const mgmtRes = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: sql }),
      }
    );
    if (!mgmtRes.ok) {
      const text = await mgmtRes.text();
      throw new Error(`SQL execution failed: ${text}`);
    }
    return mgmtRes.json();
  }
  return res.json();
}

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`🚀  Running ${files.length} migration(s)...\n`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    process.stdout.write(`  ➜  ${file} ... `);
    try {
      await execSQL(sql);
      console.log('✅  done');
    } catch (err) {
      console.log('❌  failed');
      console.error(`     ${err.message}`);
      process.exit(1);
    }
  }

  console.log('\n✅  All migrations applied successfully!');
}

runMigrations().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
