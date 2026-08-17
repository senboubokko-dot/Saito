module.exports = function requireReaderAuth(req, res, next) {
  if (req.session && req.session.readerId) {
    return next();
  }
  res.status(401).json({ error: 'ログインが必要です。' });
};
