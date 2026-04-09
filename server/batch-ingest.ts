/**
 * Batch ingest all transcript files from a directory
 * Usage: npx tsx server/batch-ingest.ts <directory> <competitorName>
 */

import { readdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const [dir, ...nameArgs] = process.argv.slice(2);
const competitorName = nameArgs.join(' ');

if (!dir || !competitorName) {
  console.log('Usage: npx tsx server/batch-ingest.ts <directory> <competitorName>');
  process.exit(1);
}

const files = readdirSync(dir)
  .filter(f => f.endsWith('.txt') && !f.startsWith('Nuevo documento'))
  .sort();

console.log(`\n🚀 Batch ingesting ${files.length} files from ${dir}`);
console.log(`   Competitor: ${competitorName}`);
console.log(`   Delay: 8s between files (Groq rate limits)\n`);

let success = 0;
let failed = 0;

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const filePath = join(dir, file);

  console.log(`\n[${i + 1}/${files.length}] ${file}`);

  try {
    const result = execSync(
      `npx tsx server/pipeline.ts ingest-file "${filePath}" "${competitorName}"`,
      { cwd: 'D:/Dev/nexora-content-engine', encoding: 'utf-8', timeout: 120000 }
    );

    // Check if it actually succeeded
    if (result.includes('✅ Done!')) {
      success++;
      console.log(`  ✅ OK`);
    } else {
      failed++;
      console.log(`  ⚠️ Partial: ${result.slice(-200)}`);
    }
  } catch (err: any) {
    failed++;
    console.log(`  ❌ Failed: ${err.message?.slice(0, 200)}`);
  }

  // Wait 8 seconds between files to respect Groq free tier rate limits
  if (i < files.length - 1) {
    process.stdout.write('  ⏳ Waiting 8s...');
    await new Promise(r => setTimeout(r, 8000));
    console.log(' ready');
  }
}

console.log(`\n\n📊 Batch complete!`);
console.log(`   ✅ Success: ${success}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   Total: ${files.length}`);
