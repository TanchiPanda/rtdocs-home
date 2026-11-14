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

  function renderWall(id, people, countId) {
    const box = el(id);
    if (!box) return;
    if (!people.length) {
      box.innerHTML = '<div class="av">—</div>';
      setText(countId, 0);
      return;
    }
    const show = people.slice(0, 24);
    box.innerHTML = show.map(u =>
      '<a class="av" href="https://github.com/' + esc(u.login) + '" target="_blank" rel="noopener" title="' + esc(u.login) + '">'
      + (u.avatar_url ? '<img src="' + esc(u.avatar_url) + '" alt="' + esc(u.login) + '" loading="lazy">' : esc(u.login.slice(0, 2)))
      + '</a>').join('')
      + (people.length > show.length ? '<div class="av more">+' + (people.length - show.length) + '</div>' : '');
    setText(countId, people.length);
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
    setText('starCount', totalStars);

    // 贡献者墙：所有仓库的 contributor 去重
    const contributors = [];
    const cseen = new Set();
    data.repos.forEach(repo => (repo.contributors || []).forEach(u => {
      if (!u || !u.login || cseen.has(u.login)) return;
      cseen.add(u.login);
      contributors.push(u);
    }));
    renderWall('contribWall', contributors, 'contribCount');
    setText('contribHint', contributors.length
      ? '共 ' + contributors.length + ' 位贡献者：代码、文档、Issue 都算。'
      : '还没有记录到贡献者，第一个 PR 等你来。');

    // Star 墙：只放真正 star 过的人
    const starrers = [];
    const sseen = new Set();
    data.repos.forEach(repo => (repo.stargazers || []).forEach(u => {
      if (!u || !u.login || sseen.has(u.login)) return;
      sseen.add(u.login);
      starrers.push(u);
    }));
    renderWall('starWall', starrers, 'starCount');
    setText('starHint', starrers.length
      ? '共 ' + starrers.length + ' 位 GitHub 用户点过 Star，鼠标悬停看名字，点开是他们的主页。'
      : '还没有人点 Star，来做第一个，头像会出现在这里。');

    if (data.updatedAt) {
      const d = new Date(data.updatedAt);
      if (!isNaN(d)) setText('updatedAt', '数据更新于 ' + d.toLocaleString('zh-CN'));
    }
  }

  async function loadPoll() {
    const box = el('pollBox');
    const teaser = el('pollTeaserVotes');
    if (!box && !teaser) return;
    let d = null;
    try {
      const r = await fetch('data/poll.json', { cache: 'no-cache' });
      if (r.ok) d = await r.json();
    } catch (e) {}
    if (d && d.closed) {
      if (box) box.innerHTML = '<p class="poll-empty">价格已定，投票已关闭。</p>';
      if (teaser) teaser.textContent = '';
      return;
    }
    if (!d || !d.options) {
      if (box) box.innerHTML = '<p class="poll-empty">投票数据暂时读不到，点下面的按钮直接去 GitHub 投。</p>';
      return;
    }
    if (teaser) teaser.textContent = (d.total || 0) + ' 票';
    if (!box) return;
    const link = el('pollLink');
    if (link && d.url) link.href = d.url;
    const total = d.total || 0;
    const max = Math.max(1, ...d.options.map(o => o.votes || 0));
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px">'
      + '<b style="font-size:15px">' + esc(d.title || '你觉得这个项目值多少钱？') + '</b>'
      + '<span style="color:var(--muted);font-size:12.5px">' + total + ' 票</span></div>'
      + d.options.map(o =>
        '<div class="poll-row"><div class="poll-head"><b>' + esc(o.label) + '</b><span>' + (o.votes || 0) + ' 票 · '
        + (total ? Math.round((o.votes || 0) / total * 100) : 0) + '%</span></div>'
        + '<div class="poll-bar"><div class="poll-fill" style="width:' + Math.round((o.votes || 0) / max * 100) + '%"></div></div></div>'
      ).join('')
      + (total ? '' : '<p class="poll-empty" style="margin-top:6px">还没有人投票，来做第一个。</p>');
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
  loadPoll();
})();
