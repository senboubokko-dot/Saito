const express = require('express');
const bcrypt = require('bcryptjs');
const { readJSON, writeJSON } = require('../lib/store');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'IDとパスワードを入力してください。' });
  }

  const admin = readJSON('admin.json', null);
  const isValid = admin && admin.username === username && bcrypt.compareSync(password, admin.passwordHash);

  if (!isValid) {
    return res.status(401).json({ error: 'IDまたはパスワードが違います。' });
  }

  req.session.isAdmin = true;
  req.session.username = username;
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  if (!req.session) {
    return res.json({ ok: true });
  }
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/session', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.isAdmin) });
});

router.post('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '現在のパスワードと新しいパスワードを入力してください。' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: '新しいパスワードは8文字以上で入力してください。' });
  }

  const admin = readJSON('admin.json', null);
  if (!admin || !bcrypt.compareSync(currentPassword, admin.passwordHash)) {
    return res.status(401).json({ error: '現在のパスワードが正しくありません。' });
  }

  admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  writeJSON('admin.json', admin);
  res.json({ ok: true });
});

module.exports = router;
