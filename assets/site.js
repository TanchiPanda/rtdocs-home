(function () {
  const REPOS = ['r6t5-docs-community', 'r6t5-docs-docker', 'r6t5-docs', 'r6t5hubacc'];
  const OWNER = 'TanchiPanda';

  function el(id) { return document.getElementById(id); }
  function setText(id, v) { const n = el(id); if (n) n.textContent = v; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderAvatars(list, total) {
    const wall = el('avatarWall');
    if (!wall) return;
    const show = 24;
    const items = list.slice(0, show);
    wall.innerHTML = items.map(u =>
      '<a class="av" href="https://github.com/' + esc(u.login) + '" target="_blank" rel="noopener" title="' + esc(u.login) + '">'
      + (u.avatar_url ? '<img src="' + esc(u.avatar_url) + '" alt="' + esc(u.login) + '" loading="lazy" referrerpolicy="no-referrer">' : esc(u.login.slice(0, 1).toUpperCase()))
      + '</a>').join('');
    if (total > show) {
      const more = document.createElement('span');
      more.className = 'av more';
      more.textContent = '+' + (total - show);
      wall.appendChild(more);
    }
    if (!items.length) wall.innerHTML = '<div class="av more">暂无</div>';
  }

  async function load() {
    let data = null;
    try {
      const r = await fetch('data/repos.json', { cache: 'no-cache' });
      if (r.ok) data = await r.json();
    } catch (e) {}
    if (!data || !data.repos) {
      setText('starHint', 'Star 数据暂时读不到，可以直接去 GitHub 查看。');
      return;
    }
    const totalStars = data.repos.reduce((s, x) => s + (x.stars || 0), 0);
    const totalForks = data.repos.reduce((s, x) => s + (x.forks || 0), 0);
    setText('statStars', totalStars);
    setText('statForks', totalForks);
    setText('wallStars', totalStars);
    setText('repoCount', data.repos.length);
    setText('starBtnNum', totalStars ? 'Star ' + totalStars : 'Star');

    const seen = new Set();
    const people = [];
    data.repos.forEach(repo => (repo.stargazers || []).forEach(u => {
      if (!u || !u.login || seen.has(u.login)) return;
      seen.add(u.login);
      people.push(u);
    }));
    let uniqTotal = seen.size;
    if (!uniqTotal) {
      // 还没有 Star 时，展示贡献者头像，页面不至于空着
      data.repos.forEach(repo => (repo.contributors || []).forEach(u => {
        if (!u || !u.login || seen.has(u.login)) return;
        seen.add(u.login);
        people.push(u);
      }));
      uniqTotal = seen.size;
    }
    renderAvatars(people, uniqTotal);
    setText('starHint', uniqTotal
      ? (data.repos.some(r => (r.stargazers || []).length)
        ? '共 ' + uniqTotal + ' 位 GitHub 用户点过 Star，鼠标悬停看名字，点开是他们的主页。'
        : '项目刚起步，先展示贡献者；点 Star 后你的头像会出现在这里。')
      : '还没有 Star，来做第一个吧。');

    if (data.updatedAt) {
      const d = new Date(data.updatedAt);
      if (!isNaN(d)) setText('updatedAt', '数据更新于 ' + d.toLocaleString('zh-CN'));
    }
  }

  // 代码块复制
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    navigator.clipboard.writeText(btn.dataset.copy).then(() => {
      const old = btn.textContent;
      btn.textContent = '已复制';
      setTimeout(() => { btn.textContent = old; }, 1400);
    });
  });

  // 导航高亮
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navlink').forEach(a => {
    const href = a.getAttribute('href');
    if (href === here) a.classList.add('active');
  });

  load();
})();
