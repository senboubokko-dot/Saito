const path = require('path');
const express = require('express');
const session = require('express-session');

const { ensureSeedData } = require('./lib/seed');
const authRoutes = require('./routes/auth');
const novelRoutes = require('./routes/novels');
const settingsRoutes = require('./routes/settings');

ensureSeedData();

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT_ROOT = path.join(__dirname, '..');

app.disable('x-powered-by');
app.use(express.json());

app.use(
  session({
    name: 'saito.sid',
    secret: process.env.SESSION_SECRET || 'saito-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8 // 8時間
    }
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/novels', novelRoutes);
app.use('/api/settings', settingsRoutes);

// index.html / novel.html / episode.html / admin/ 以下の静的ファイルをそのまま配信
app.use(express.static(PROJECT_ROOT));

app.listen(PORT, () => {
  console.log('Saito サーバーを起動しました: http://localhost:' + PORT);
});
