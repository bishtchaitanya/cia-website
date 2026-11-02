#!/usr/bin/env node
/*
 *   node scripts/render-page.mjs --check   plain-English content report (npm run check)
 *   node scripts/render-page.mjs           prints {"head","body",...} as JSON (debugging)
 */
import { renderSite, formatErrors } from './render-core.mjs';

const checkOnly = process.argv.includes('--check');
const result = await renderSite({ checkOnly });

if (!result.ok) {
  console.error(formatErrors(result.errors));
  process.exit(1);
}
if (checkOnly) {
  console.log(`✔ Content looks good: ${result.summary}.`);
  for (const w of result.warnings) console.log(`  ⚠ ${w}`);
  for (const n of result.notes) console.log(`  ${n}`);
} else {
  process.stdout.write(JSON.stringify(result));
}
