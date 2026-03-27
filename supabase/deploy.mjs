#!/usr/bin/env node

// Deploy migrations to Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://berubgvunuldigjqpcju.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlcnViZ3Z1bnVsZGlnanFwY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMDYxNywiZXhwIjoyMDkwMjA2NjE3fQ.wecxul1cFggOTbcxGRRBxw7gIuJpVNuQAn9_VTaJnHg';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function executeSql(sql) {
  // Use the RPC endpoint to execute raw SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) throw error;
  return data;
}

async function runMigrations() {
  console.log('🚀 Deploying ClearTalk database migrations to Supabase...\n');

  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`📄 Running ${file}...`);
    const sql = readFileSync(join(migrationsDir, file), 'utf8');

    try {
      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        await executeSql(statement + ';');
      }

      console.log(`✅ ${file} completed\n`);
    } catch (err) {
      console.error(`❌ ${file} failed:`);
      console.error(err.message);
      // Continue with other migrations
    }
  }

  console.log('\n🎉 Migrations deployment complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Check Supabase dashboard for tables');
  console.log('   2. Run seed data if needed');
  console.log('   3. Test the app!');
}

runMigrations().catch(console.error);
