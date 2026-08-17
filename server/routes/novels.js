const express = require('express');
const { readJSON, writeJSON } = require('../lib/store');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

function loadNovels() {
  return readJSON('novels.json', []);
}

function saveNovels(novels) {
  writeJSON('novels.json', novels);
}

// 一覧表示に必要な情報だけを返す（本文は詳細取得時のみ返す）
function summarize(novel) {
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

router.get('/', (req, res) => {
  const novels = loadNovels();
  const sorted = novels.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(sorted.map(summarize));
});

router.get('/:id', (req, res) => {
  const novels = loadNovels();
  const novel = novels.find((n) => n.id === req.params.id);
  if (!novel) {
    return res.status(404).json({ error: '作品が見つかりません。' });
  }
  res.json(novel);
});

// 新規小説の投稿（タイトル・タグ等のメタ情報 + 第1話をまとめて作成）
router.post('/', requireAuth, (req, res) => {
  const { title, author, worktype, note, tags, chapterTitle, body } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'タイトルを入力してください。' });
  }
  if (!body || !body.trim()) {
    return res.status(400).json({ error: '本文を入力してください。' });
  }

  const cleanTags = Array.isArray(tags)
    ? tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 10)
    : [];

  const now = new Date().toISOString();
  const id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const novel = {
    id,
    title: title.trim(),
    author: (author || '').trim() || '匿名',
    worktype: worktype === 'derivative' ? 'derivative' : 'original',
    note: (note || '').trim(),
    tags: cleanTags,
    createdAt: now,
    updatedAt: now,
    chapters: [
      {
        id: id + '-c1',
        number: 1,
        title: (chapterTitle || '').trim() || '第1話',
        body: body.trim(),
        createdAt: now
      }
    ]
  };

  const novels = loadNovels();
  novels.push(novel);
  saveNovels(novels);

  res.status(201).json(novel);
});

// 既存の小説に新しい話を追加
router.post('/:id/chapters', requireAuth, (req, res) => {
  const { title, body } = req.body || {};

  if (!body || !body.trim()) {
    return res.status(400).json({ error: '本文を入力してください。' });
  }

  const novels = loadNovels();
  const novel = novels.find((n) => n.id === req.params.id);
  if (!novel) {
    return res.status(404).json({ error: '作品が見つかりません。' });
  }

  const now = new Date().toISOString();
  const number = novel.chapters.length + 1;

  novel.chapters.push({
    id: novel.id + '-c' + number,
    number,
    title: (title || '').trim() || '第' + number + '話',
    body: body.trim(),
    createdAt: now
  });
  novel.updatedAt = now;

  saveNovels(novels);
  res.status(201).json(novel);
});

module.exports = router;
