const express = require('express');
const { readJSON, writeJSON } = require('../lib/store');
const requireReaderAuth = require('../middleware/requireReaderAuth');

const router = express.Router();

function loadReaders() {
  return readJSON('readers.json', []);
}

function saveReaders(readers) {
  writeJSON('readers.json', readers);
}

function loadNovels() {
  return readJSON('novels.json', []);
}

function summarizeNovel(novel) {
  return {
    id: novel.id,
    title: novel.title,
    author: novel.author,
    worktype: novel.worktype,
    note: novel.note,
    tags: novel.tags,
    createdAt: novel.createdAt,
    updatedAt: novel.updatedAt,
    chapterCount: novel.chapters.length
  };
}

function findReader(req) {
  const readers = loadReaders();
  return readers.find((r) => r.id === req.session.readerId);
}

// ログイン中の読者がブックマークした作品一覧
router.get('/', requireReaderAuth, (req, res) => {
  const reader = findReader(req);
  if (!reader) {
    return res.status(401).json({ error: 'ログインが必要です。' });
  }

  const novels = loadNovels();
  const bookmarked = (reader.bookmarks || [])
    .map((novelId) => novels.find((n) => n.id === novelId))
    .filter(Boolean)
    .map(summarizeNovel);

  res.json(bookmarked);
});

router.post('/:novelId', requireReaderAuth, (req, res) => {
  const novels = loadNovels();
  if (!novels.some((n) => n.id === req.params.novelId)) {
    return res.status(404).json({ error: '作品が見つかりません。' });
  }

  const readers = loadReaders();
  const reader = readers.find((r) => r.id === req.session.readerId);
  if (!reader) {
    return res.status(401).json({ error: 'ログインが必要です。' });
  }

  reader.bookmarks = reader.bookmarks || [];
  if (!reader.bookmarks.includes(req.params.novelId)) {
    reader.bookmarks.push(req.params.novelId);
    saveReaders(readers);
  }

  res.json({ ok: true, bookmarked: true });
});

router.delete('/:novelId', requireReaderAuth, (req, res) => {
  const readers = loadReaders();
  const reader = readers.find((r) => r.id === req.session.readerId);
  if (!reader) {
    return res.status(401).json({ error: 'ログインが必要です。' });
  }

  reader.bookmarks = (reader.bookmarks || []).filter((id) => id !== req.params.novelId);
  saveReaders(readers);

  res.json({ ok: true, bookmarked: false });
});

module.exports = router;
