/* ==========================================================
   Saito 公開ページ共通 - ヘッダーの読者向けナビゲーション
   ログイン状態に応じて「ログイン / 会員登録」または
   「マイページ / ログアウト」を表示する
   ========================================================== */

(function () {
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderReaderNav() {
    var nav = document.getElementById('reader-nav');
    if (!nav) return;

    fetch('/api/reader/session')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.loggedIn) {
          nav.innerHTML =
            '<span class="reader-nav-name">' + escapeHtml(data.username) + ' さん</span>' +
            '<a href="mypage.html">マイページ</a>' +
            '<button type="button" id="reader-logout-btn">ログアウト</button>';
          document.getElementById('reader-logout-btn').addEventListener('click', function () {
            fetch('/api/reader/logout', { method: 'POST' }).then(function () {
              window.location.reload();
            });
          });
        } else {
          nav.innerHTML =
            '<a href="login.html">ログイン</a>' +
            '<a href="signup.html">会員登録</a>';
        }
      })
      .catch(function () {
        nav.innerHTML = '';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderReaderNav);
  } else {
    renderReaderNav();
  }
})();
