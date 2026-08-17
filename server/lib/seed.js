/* ==========================================================
   Saito サーバー - 初回起動時のデータ初期化
   data/ 以下にファイルが無い場合のみ、デモ用のデータを作成する
   ========================================================== */

const bcrypt = require('bcryptjs');
const { readJSON, writeJSON, exists } = require('./store');

const DEFAULT_ADMIN = {
  username: 'admin',
  // 初回セットアップ用の仮パスワード。必ずログイン後すぐに変更してください。
  password: 'change-this-password'
};

const DEFAULT_SETTINGS = {
  siteTitle: 'Saito',
  perPage: 12,
  sortOrder: 'updated_desc',
  showTagSearch: true,
  filterTags: ['ファンタジー', '恋愛', 'ミステリー', 'オリジナル', '二次創作']
};

function demoNovels() {
  const now = new Date('2026-08-17T00:00:00+09:00').toISOString();

  return [
    {
      id: 'n1',
      title: 'サンプル小説タイトル その一',
      author: '著者名A',
      worktype: 'original',
      note: '読者への一言や注意事項など、あらすじ以外の補足情報が入ります。読者が続きを読みたくなるような説明文をここに配置します。',
      tags: ['ファンタジー', '異世界', '冒険'],
      createdAt: new Date('2026-08-01T00:00:00+09:00').toISOString(),
      updatedAt: now,
      chapters: [
        {
          id: 'n1-c1',
          number: 1,
          title: '物語のはじまり',
          body:
            '朝の光が窓辺に差し込むころ、少女はいつもより早く目を覚ました。今日という日が、これまでとは違う一日になることを、まだ知らないままに。\n' +
            'ここに本文が入ります。実際の投稿では、管理画面の「本文」欄に入力した内容がこのエリアに表示されます。段落ごとに読みやすい行間と余白を確保し、スマートフォンでも快適に読み進められるようにしています。\n' +
            'この続きは、次の話へのボタンから読み進めることができます。目次に戻って別の話を選ぶこともできます。',
          createdAt: new Date('2026-08-01T00:00:00+09:00').toISOString()
        },
        {
          id: 'n1-c2',
          number: 2,
          title: '出会い',
          body:
            '第2話の本文がここに入ります。管理画面の「既存の小説に新しい話を追加」から、このように話数を増やしていくことができます。\n' +
            '章が増えるごとに、作品詳細ページの目次にも自動的に反映されます。',
          createdAt: new Date('2026-08-05T00:00:00+09:00').toISOString()
        },
        {
          id: 'n1-c3',
          number: 3,
          title: '旅立ち',
          body:
            '第3話の本文がここに入ります。これが最後の話の場合、話を読むページの「次の話」ボタンは自動的に「目次に戻る」に切り替わります。',
          createdAt: now
        }
      ]
    },
    {
      id: 'n2',
      title: 'サンプル小説タイトル その二',
      author: '著者名B',
      worktype: 'original',
      note: '学園を舞台にした短めの物語です。',
      tags: ['恋愛', '学園'],
      createdAt: new Date('2026-08-16T00:00:00+09:00').toISOString(),
      updatedAt: new Date('2026-08-16T00:00:00+09:00').toISOString(),
      chapters: [
        {
          id: 'n2-c1',
          number: 1,
          title: '第1話',
          body: 'ここに本文が入ります。管理画面から投稿すると、この内容が置き換わります。',
          createdAt: new Date('2026-08-16T00:00:00+09:00').toISOString()
        }
      ]
    },
    {
      id: 'n3',
      title: 'サンプル小説タイトル その三',
      author: '著者名C',
      worktype: 'derivative',
      note: 'ミステリー要素のある短編の二次創作作品です。',
      tags: ['ミステリー', '短編'],
      createdAt: new Date('2026-08-15T00:00:00+09:00').toISOString(),
      updatedAt: new Date('2026-08-15T00:00:00+09:00').toISOString(),
      chapters: [
        {
          id: 'n3-c1',
          number: 1,
          title: '第1話',
          body: 'ここに本文が入ります。管理画面から投稿すると、この内容が置き換わります。',
          createdAt: new Date('2026-08-15T00:00:00+09:00').toISOString()
        }
      ]
    }
  ];
}

function ensureSeedData() {
  if (!exists('admin.json')) {
    writeJSON('admin.json', {
      username: DEFAULT_ADMIN.username,
      passwordHash: bcrypt.hashSync(DEFAULT_ADMIN.password, 10)
    });
    console.log(
      '[seed] 管理者アカウントを作成しました → ID: ' + DEFAULT_ADMIN.username +
      ' / パスワード: ' + DEFAULT_ADMIN.password +
      '（必ずログイン後に変更してください。現状パスワード変更画面は未実装のため、data/admin.json を直接更新してください）'
    );
  }

  if (!exists('settings.json')) {
    writeJSON('settings.json', DEFAULT_SETTINGS);
  }

  if (!exists('novels.json')) {
    writeJSON('novels.json', demoNovels());
  }

  // readJSON呼び出しはファイルが無い場合の自己修復も兼ねる
  readJSON('admin.json', null);
  readJSON('settings.json', DEFAULT_SETTINGS);
  readJSON('novels.json', []);
}

module.exports = { ensureSeedData, DEFAULT_SETTINGS };
