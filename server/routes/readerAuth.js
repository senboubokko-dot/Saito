const express = require('express');
const bcrypt = require('bcryptjs');
const { readJSON, writeJSON } = require('../lib/store');

const router = express.Router();

function loadReaders() {
  return readJSON('readers.json', []);
}

function saveReaders(readers) {
  writeJSON('readers.json', readers);
}

router.post('/signup', (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'ユーザー名を入力してください。' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'パスワードは8文字以上で入力してください。' });
  }

  const readers = loadReaders();
  const cleanUsername = username.trim();

  if (readers.some((r) => r.username === cleanUsername)) {
    return res.status(409).json({ error: 'そのユーザー名はすでに使われています。' });
  }

  const reader = {
    id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    username: cleanUsername,
    email: (email || '').trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    bookmarks: [],
    createdAt: new Date().toISOString()
  };

  readers.push(reader);
  saveReaders(readers);

  req.session.readerId = reader.id;
  req.session.readerUsername = reader.username;
  res.status(201).json({ ok: true, username: reader.username });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'ユーザー名とパスワードを入力してください。' });
  }

  const readers = loadReaders();
  const reader = readers.find((r) => r.username === username.trim());
  const isValid = reader && bcrypt.compareSync(password, reader.passwordHash);

  if (!isValid) {
    return res.status(401).json({ error: 'ユーザー名またはパスワードが違います。' });
  }

  req.session.readerId = reader.id;
  req.session.readerUsername = reader.username;
  res.json({ ok: true, username: reader.username });
});

router.post('/logout', (req, res) => {
  if (req.session) {
    delete req.session.readerId;
    delete req.session.readerUsername;
  }
  res.json({ ok: true });
});

router.get('/session', (req, res) => {
  const loggedIn = !!(req.session && req.session.readerId);
  res.json({ loggedIn, username: loggedIn ? req.session.readerUsername : null });
});

module.exports = router;
