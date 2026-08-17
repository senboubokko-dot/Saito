/* ==========================================================
   Saito 管理画面 - タグ追加入力の共通スクリプト
   1つの入力につき最大10個までタグを追加できるようにする
   ========================================================== */

function setupTagInput(options) {
  var input = document.getElementById(options.inputId);
  var addButton = document.getElementById(options.addButtonId);
  var list = document.getElementById(options.listId);
  var hidden = options.hiddenId ? document.getElementById(options.hiddenId) : null;
  var hint = document.getElementById(options.hintId);
  var max = options.max || 10;
  var tags = (options.initial || []).slice(0, max);

  function render() {
    list.innerHTML = '';
    tags.forEach(function (tag) {
      var li = document.createElement('li');
      li.className = 'tag-chip';

      var label = document.createElement('span');
      label.textContent = tag;
      li.appendChild(label);

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('aria-label', 'タグ「' + tag + '」を削除');
      removeBtn.addEventListener('click', function () {
        tags = tags.filter(function (t) { return t !== tag; });
        render();
      });
      li.appendChild(removeBtn);

      list.appendChild(li);
    });

    if (hidden) hidden.value = tags.join(',');
    hint.textContent = 'タグは1〜' + max + '個まで追加できます（' + tags.length + '/' + max + '）';

    var limitReached = tags.length >= max;
    input.disabled = limitReached;
    addButton.disabled = limitReached;
  }

  function addTag() {
    var value = input.value.trim();
    if (!value) return;
    if (tags.length >= max) return;
    if (tags.indexOf(value) !== -1) {
      input.value = '';
      return;
    }
    tags.push(value);
    input.value = '';
    render();
    input.focus();
  }

  addButton.addEventListener('click', addTag);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  });

  render();

  return {
    getTags: function () {
      return tags.slice();
    },
    setTags: function (newTags) {
      tags = (newTags || []).slice(0, max);
      render();
    }
  };
}
