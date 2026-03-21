#!/usr/bin/env node
/**
 * Transforms a Tally submissions CSV export into a Supabase-ready CSV
 * for the `applications` table.
 *
 * Usage: node scripts/transform-tally-csv.js path/to/Submissions.csv
 * Output: writes applications_import.csv in the same directory
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/transform-tally-csv.js <path-to-csv>');
  process.exit(1);
}

const raw = readFileSync(inputPath, 'utf-8');
const lines = parseCSV(raw);
const headers = lines[0];
const rows = lines.slice(1);

// Map Tally columns to applications table columns
function col(row, name) {
  const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
  return idx >= 0 ? row[idx]?.trim() || '' : '';
}

const output = rows.map(row => {
  const schoolEmail = col(row, 'School email address') || col(row, "Must end with '.edu'");
  const personalEmail = col(row, 'Personal email');
  const email = schoolEmail || personalEmail;

  return {
    tally_response_id: col(row, 'Submission ID'),
    status: 'pending',
    email,
    university: col(row, 'School/University') || 'N/A',
    major: col(row, 'Major') || 'N/A',
    year_of_study: col(row, 'Year of Study') || 'N/A',
    graduation_date: col(row, 'Graduation Date') || null,
    resume_url: col(row, 'Attach resume'),
    github_url: col(row, 'GitHub'),
    linkedin_url: col(row, 'LinkedIn'),
    why_attend: col(row, 'What excites you'),
    experience_level: col(row, "level of hackathon experience"),
    dietary_restrictions: col(row, 'Dietary'),
    tshirt_size: col(row, 'T-Shirt'),
    phone_number: col(row, 'Phone number'),
    how_did_you_hear: col(row, 'How did you hear'),
  };
});

// Write CSV
const outHeaders = [
  'tally_response_id', 'status', 'email', 'university', 'major', 'year_of_study',
  'graduation_date', 'resume_url', 'github_url', 'linkedin_url', 'why_attend',
  'experience_level', 'dietary_restrictions', 'tshirt_size', 'phone_number', 'how_did_you_hear',
];

const csvLines = [
  outHeaders.join(','),
  ...output.map(row =>
    outHeaders.map(h => escapeCSV(row[h] ?? '')).join(',')
  ),
];

const outPath = join(dirname(inputPath), 'applications_import.csv');
writeFileSync(outPath, csvLines.join('\n'), 'utf-8');
console.log(`Wrote ${output.length} rows to ${outPath}`);

// --- CSV helpers ---

function escapeCSV(val) {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        if (ch === '\r') i++;
      } else {
        field += ch;
      }
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
