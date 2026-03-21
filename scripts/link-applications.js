#!/usr/bin/env node
/**
 * Reads the original Tally CSV and generates SQL to link applications to users
 * by matching against ALL email addresses (personal, school, .edu field).
 *
 * Usage: node scripts/link-applications.js path/to/Submissions.csv
 * Output: prints SQL to stdout
 */

import { readFileSync } from 'fs';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/link-applications.js <path-to-csv>');
  process.exit(1);
}

const raw = readFileSync(inputPath, 'utf-8');
const lines = parseCSV(raw);
const headers = lines[0];
const rows = lines.slice(1);

function colIdx(name) {
  return headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
}

const submissionIdIdx = colIdx('Submission ID');
const personalEmailIdx = colIdx('Personal email');
const eduFieldIdx = colIdx("Must end with '.edu'");
const schoolEmailIdx = colIdx('School email address');
const phoneIdx = colIdx('Phone number');
const firstNameIdx = colIdx('First Name');
const lastNameIdx = colIdx('Last Name');

console.log('-- Link applications to users by matching on ALL email addresses');
console.log('-- Run this in Supabase SQL Editor after importing applications and backfilling users');
console.log('');

for (const row of rows) {
  const tallyId = row[submissionIdIdx]?.trim();
  if (!tallyId) continue;

  // Collect all possible emails for this submission
  const emails = new Set();
  [personalEmailIdx, eduFieldIdx, schoolEmailIdx].forEach(idx => {
    if (idx >= 0) {
      const val = row[idx]?.trim().toLowerCase();
      if (val && val.includes('@')) emails.add(val);
    }
  });

  if (emails.size === 0) continue;

  const emailList = [...emails].map(e => `'${e.replace(/'/g, "''")}'`).join(', ');

  console.log(`UPDATE applications SET user_id = (
  SELECT id FROM users WHERE lower(email) IN (${emailList}) LIMIT 1
) WHERE tally_response_id = '${tallyId.replace(/'/g, "''")}' AND user_id IS NULL;`);
  console.log('');
}

console.log('-- Summary: check remaining unlinked');
console.log("SELECT count(*) as unlinked FROM applications WHERE user_id IS NULL;");

// --- CSV parser ---
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        row.push(field); field = ''; rows.push(row); row = [];
        if (ch === '\r') i++;
      } else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
