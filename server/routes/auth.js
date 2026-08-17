const express = require('express');
const bcrypt = require('bcryptjs');
const { readJSON } = require('../lib/store');

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

module.exports = router;
