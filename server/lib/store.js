/* ==========================================================
   Saito サーバー - JSONファイルによる簡易永続化レイヤー
   本番運用ではSQLite/PostgreSQL等への置き換えを想定した薄いラッパー。
   ========================================================== */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(fileName) {
  return path.join(DATA_DIR, fileName);
}

function exists(fileName) {
  return fs.existsSync(filePath(fileName));
}

function readJSON(fileName, defaultValue) {
  ensureDataDir();
  if (!exists(fileName)) {
    writeJSON(fileName, defaultValue);
    return defaultValue;
  }
  const raw = fs.readFileSync(filePath(fileName), 'utf-8');
  return JSON.parse(raw);
}

function writeJSON(fileName, value) {
  ensureDataDir();
  fs.writeFileSync(filePath(fileName), JSON.stringify(value, null, 2), 'utf-8');
}

module.exports = { readJSON, writeJSON, exists, DATA_DIR };
