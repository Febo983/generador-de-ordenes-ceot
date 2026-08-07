#!/usr/bin/env node
// Extracts the last inline <script> block from index.html and runs `node --check` on it.
// Used by the PostToolUse hook so JS syntax errors surface right after an edit,
// instead of being caught later by hand.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const file = process.argv[2];
if (!file) process.exit(0);

let html;
try {
  html = fs.readFileSync(file, 'utf8');
} catch (e) {
  process.exit(0);
}

const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (!matches.length) process.exit(0);
const code = matches[matches.length - 1][1];

const tmp = path.join(os.tmpdir(), 'ceot-syntax-check-' + Date.now() + '.js');
fs.writeFileSync(tmp, code);
try {
  execFileSync(process.execPath, ['--check', tmp], { stdio: 'inherit' });
} catch (e) {
  console.error('index.html: el <script> inline tiene un error de sintaxis (ver arriba).');
  process.exitCode = 1;
} finally {
  fs.unlinkSync(tmp);
}
