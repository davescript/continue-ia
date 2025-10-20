#!/usr/bin/env node
// Push local changes of server/src/app.js to branches of PR #25 and #21, and mark PRs ready

import fs from 'fs/promises';
import { execSync } from 'child_process';

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
if (!token) { console.error('Set GITHUB_TOKEN'); process.exit(1); }

const detectRepo = () => {
  const override = process.env.GITHUB_REPO;
  if (override) return override;
  try {
    const url = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const m = url.match(/github\.com[/:]([^/]+)\/([^\.]+)(?:\.git)?$/i);
    if (m) return `${m[1]}/${m[2]}`;
  } catch {}
  return '';
};
const repo = detectRepo();
if (!repo) { console.error('Set GITHUB_REPO'); process.exit(1); }

const gh = async (method, url, body) => {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `token ${token}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${await res.text()}`);
  return res.json();
};

const getContent = async (path, branch) => gh('GET', `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`);
const putContent = async (path, message, content, branch, sha) => gh('PUT', `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`, { message, content: Buffer.from(content).toString('base64'), branch, sha });
const updatePR = async (number, patch) => gh('PATCH', `https://api.github.com/repos/${repo}/pulls/${number}`, patch);

const main = async () => {
  const localPath = new URL('../server/src/app.js', import.meta.url).pathname.replace(/%20/g, ' ');
  const newSource = await fs.readFile(localPath, 'utf8');

  const prs = [25, 21];
  for (const prNum of prs) {
    const pr = await gh('GET', `https://api.github.com/repos/${repo}/pulls/${prNum}`);
    const branch = pr.head.ref;
    const message = prNum === 25
      ? 'feat(health): extend /api/health with uptime/version'
      : 'chore(serve): static cache headers and SPA fallback';
    const current = await getContent('server/src/app.js', branch);
    await putContent('server/src/app.js', message, newSource, branch, current.sha);
    console.log(`[push] Updated ${branch} with server/src/app.js`);
    const newTitle = pr.title.replace(/^WIP:\\s*/i, '').replace(/^Ready:\\s*/i, '');
    await updatePR(prNum, { title: `Ready: ${newTitle}`, draft: false });
    console.log(`[push] PR #${prNum} marked ready for review`);
  }
};

main().catch((e) => { console.error('[push-pr-updates] Failed:', e); process.exit(1); });
