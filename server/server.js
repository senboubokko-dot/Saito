const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { ensureSeedData } = require('./lib/seed');
const authRoutes = require('./routes/auth');
const novelRoutes = require('./routes/novels');
const settingsRoutes = require('./routes/settings');
const readerAuthRoutes = require('./routes/readerAuth');
const bookmarkRoutes = require('./routes/bookmarks');

ensureSeedData();

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT_ROOT = path.join(__dirname, '..');

app.disable('x-powered-by');

// 各HTMLページがscriptタグを直接埋め込んでいるため、CSPは無効化し、
// それ以外の基本的なセキュリティヘッダー（X-Frame-Options等）のみ有効にする
app.use(helmet({ contentSecurityPolicy: false }));

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

// ログイン・会員登録は総当たり攻撃対策として回数制限をかける
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '試行回数が多すぎます。しばらくしてから再度お試しください。' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/reader/login', authLimiter);
app.use('/api/reader/signup', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/novels', novelRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reader', readerAuthRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// index.html / novel.html / episode.html / admin/ 以下の静的ファイルをそのまま配信
app.use(express.static(PROJECT_ROOT));

// /api/以下で該当ルートが無い場合はJSONで404を返す
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません。' });
});

// それ以外の未知のパスは共通の404ページを返す
app.use((req, res) => {
  res.status(404).sendFile(path.join(PROJECT_ROOT, '404.html'));
});

app.listen(PORT, () => {
  console.log('Saito サーバーを起動しました: http://localhost:' + PORT);
});
