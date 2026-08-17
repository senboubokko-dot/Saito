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

// 小説のメタ情報（タイトル・著者名・作品タイプ・備考・タグ）を編集
router.put('/:id', requireAuth, (req, res) => {
  const { title, author, worktype, note, tags } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'タイトルを入力してください。' });
  }

  const novels = loadNovels();
  const novel = novels.find((n) => n.id === req.params.id);
  if (!novel) {
    return res.status(404).json({ error: '作品が見つかりません。' });
  }

  novel.title = title.trim();
  novel.author = (author || '').trim() || '匿名';
  novel.worktype = worktype === 'derivative' ? 'derivative' : 'original';
  novel.note = (note || '').trim();
  novel.tags = Array.isArray(tags)
    ? tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 10)
    : novel.tags;
  novel.updatedAt = new Date().toISOString();

  saveNovels(novels);
  res.json(novel);
});

// 小説を削除（配下の話もまとめて削除）
router.delete('/:id', requireAuth, (req, res) => {
  const novels = loadNovels();
  const index = novels.findIndex((n) => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '作品が見つかりません。' });
  }

  novels.splice(index, 1);
  saveNovels(novels);
  res.json({ ok: true });
});

// 話の編集
router.put('/:id/chapters/:chapterId', requireAuth, (req, res) => {
  const { title, body } = req.body || {};

  if (!body || !body.trim()) {
    return res.status(400).json({ error: '本文を入力してください。' });
  }

  const novels = loadNovels();
  const novel = novels.find((n) => n.id === req.params.id);
  if (!novel) {
    return res.status(404).json({ error: '作品が見つかりません。' });
  }

  const chapter = novel.chapters.find((c) => c.id === req.params.chapterId);
  if (!chapter) {
    return res.status(404).json({ error: '話が見つかりません。' });
  }

  chapter.title = (title || '').trim() || chapter.title;
  chapter.body = body.trim();
  novel.updatedAt = new Date().toISOString();

  saveNovels(novels);
  res.json(novel);
});

// 話の削除（最後の1話は削除不可。作品ごと削除させる）
router.delete('/:id/chapters/:chapterId', requireAuth, (req, res) => {
  const novels = loadNovels();
  const novel = novels.find((n) => n.id === req.params.id);
  if (!novel) {
    return res.status(404).json({ error: '作品が見つかりません。' });
  }

  if (novel.chapters.length <= 1) {
    return res.status(400).json({ error: '最後の1話は削除できません。作品ごと削除してください。' });
  }

  const index = novel.chapters.findIndex((c) => c.id === req.params.chapterId);
  if (index === -1) {
    return res.status(404).json({ error: '話が見つかりません。' });
  }

  novel.chapters.splice(index, 1);
  // 話数の欠番を詰めて「第1話, 第2話...」の連番を保つ
  novel.chapters.forEach((c, i) => {
    c.number = i + 1;
  });
  novel.updatedAt = new Date().toISOString();

  saveNovels(novels);
  res.json(novel);
});

module.exports = router;
