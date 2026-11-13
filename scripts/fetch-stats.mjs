#!/usr/bin/env node
// 抓取各仓库 star / fork 数 + 最近 stargazers 头像，写入 data/repos.json
// 用法：GITHUB_TOKEN=xxx node scripts/fetch-stats.mjs
import fs from 'node:fs';
import path from 'node:path';

const OWNER = process.env.OWNER || 'TanchiPanda';
const REPOS = (process.env.REPOS || 'r6t5-docs-community,r6t5-docs-docker,r6t5-docs,r6t5hubacc').split(',').map(s => s.trim()).filter(Boolean);
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const OUT = path.join(process.cwd(), 'data', 'repos.json');

async function api(url) {
  const r = await fetch(url, {
    headers: Object.assign({ Accept: 'application/vnd.github+json', 'User-Agent': 'rtdocs-home-stats' },
      TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}),
  });
  if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
  return r.json();
}

const repos = [];
for (const name of REPOS) {
  try {
    const repo = await api(`https://api.github.com/repos/${OWNER}/${name}`);
    let stargazers = [];
    try {
      const list = await api(`https://api.github.com/repos/${OWNER}/${name}/stargazers?per_page=100`);
      stargazers = (Array.isArray(list) ? list : []).slice(-40).map(u => ({
        login: u.login,
        avatar_url: u.avatar_url || '',
      }));
    } catch (e) {
      console.warn('stargazers failed:', name, e.message);
    }
    let contributors = [];
    try {
      const list = await api(`https://api.github.com/repos/${OWNER}/${name}/contributors?per_page=100`);
      contributors = (Array.isArray(list) ? list : []).slice(-20).map(u => ({ login: u.login, avatar_url: u.avatar_url || '' }));
    } catch (e) {}
    repos.push({
      name,
      contributors,
      full: repo.full_name,
      url: repo.html_url,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      stargazers,
    });
    console.log(name, 'stars=' + (repo.stargazers_count || 0));
  } catch (e) {
    console.warn('repo failed:', name, e.message);
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  updatedAt: new Date().toISOString(),
  owner: OWNER,
  repos,
}, null, 2) + '\n');
console.log('written', OUT);
