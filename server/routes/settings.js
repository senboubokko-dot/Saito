const express = require('express');
const { readJSON, writeJSON } = require('../lib/store');
const requireAuth = require('../middleware/requireAuth');
const { DEFAULT_SETTINGS } = require('../lib/seed');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(readJSON('settings.json', DEFAULT_SETTINGS));
});

router.post('/', requireAuth, (req, res) => {
  const { siteTitle, perPage, sortOrder, showTagSearch, filterTags } = req.body || {};
  const current = readJSON('settings.json', DEFAULT_SETTINGS);

  const updated = {
    siteTitle: (siteTitle || current.siteTitle || 'Saito').trim(),
    perPage: Number(perPage) > 0 ? Number(perPage) : current.perPage,
    sortOrder: sortOrder || current.sortOrder,
    showTagSearch: !!showTagSearch,
    filterTags: Array.isArray(filterTags)
      ? filterTags.map((t) => String(t).trim()).filter(Boolean).slice(0, 10)
      : current.filterTags
  };

  writeJSON('settings.json', updated);
  res.json(updated);
});

module.exports = router;
