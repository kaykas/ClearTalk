#!/usr/bin/env node

// Deploy migrations directly to Supabase using service role key
const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://berubgvunuldigjqpcju.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlcnViZ3Z1bnVsZGlnanFwY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMDYxNywiZXhwIjoyMDkwMjA2NjE3fQ.wecxul1cFggOTbcxGRRBxw7gIuJpVNuQAn9_VTaJnHg';

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: 'berubgvunuldigjqpcju.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runMigrations() {
  console.log('🚀 Deploying ClearTalk database migrations...\n');

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;

    console.log(`📄 Running ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    try {
      await executeSql(sql);
      console.log(`✅ ${file} completed\n`);
    } catch (err) {
      console.error(`❌ ${file} failed:`);
      console.error(err.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 All migrations deployed successfully!');
}

runMigrations().catch(console.error);
