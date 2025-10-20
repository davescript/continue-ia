#!/usr/bin/env node
// Create a GitHub repo (if missing) and upload the current project (excluding node_modules/dist)
// Usage:
//   GITHUB_TOKEN=... node scripts/publish-to-github.mjs <repo-name> [--org <owner>] [--private] [--apply]

import fs from 'fs/promises';
import path from 'path';

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
if (!token) { console.error('Set GITHUB_TOKEN'); process.exit(1); }

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/publish-to-github.mjs <repo-name> [--org <owner>] [--private] [--apply]');
  process.exit(1);
}

const repoName = args[0];
let owner = '';
let isPrivate = args.includes('--private');
const apply = args.includes('--apply');
const orgIdx = args.indexOf('--org');
if (orgIdx >= 0 && args[orgIdx + 1]) owner = args[orgIdx + 1];

const gh = async (method, url, body) => {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `token ${token}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${await res.text()}`);
  return res.json();
};

const getViewer = async () => {
  const res = await fetch('https://api.github.com/user', { headers: { Authorization: `token ${token}` } });
  if (!res.ok) throw new Error(`user -> ${res.status}`);
  return res.json();
};

const ensureRepo = async () => {
  if (!owner) owner = (await getViewer()).login;
  const full = `${owner}/${repoName}`;
  // Check existence
  const r = await fetch(`https://api.github.com/repos/${full}`, { headers: { Authorization: `token ${token}` } });
  if (r.status === 200) return { full, created: false };
  if (!apply) {
    console.log(`[publish] (dry-run) would create repo ${full}`);
    return full;
  }
  // Create
  const endpoint = owner === (await getViewer()).login
    ? 'https://api.github.com/user/repos'
    : `https://api.github.com/orgs/${owner}/repos`;
  await gh('POST', endpoint, {
    name: repoName,
    private: isPrivate,
    auto_init: true,
  });
  console.log(`[publish] Created repo ${full}`);
  // small delay to allow repo to be fully ready
  await new Promise((r2) => setTimeout(r2, 1000));
  return { full, created: true };
};

const shouldIgnore = (rel) => {
  if (/(^|\/)node_modules(\/|$)/.test(rel)) return true;
  if (/(^|\/)dist(\/|$)/.test(rel)) return true;
  if (/(^|\.)git(\/|$)/.test(rel)) return true;
  if (/\.DS_Store$/.test(rel)) return true;
  if (/^\.github\/workflows\//.test(rel)) return true; // skip workflows if token lacks scope
  if (/^server\/data\//.test(rel)) return true;
  if (/^server\/\.env$/.test(rel) || /^client\/\.env$/.test(rel)) return true;
  return false;
};

const listFiles = async (base) => {
  const out = [];
  const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      const rel = path.relative(base, full).replace(/\\/g, '/');
      if (shouldIgnore(rel)) continue;
      if (ent.isDirectory()) await walk(full);
      else out.push(rel);
    }
  };
  await walk(base);
  return out;
};

const getContent = async (fullRepo, filePath) => {
  const url = `https://api.github.com/repos/${fullRepo}/contents/${encodeURIComponent(filePath)}`;
  const res = await fetch(url, { headers: { Authorization: `token ${token}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
};

const putFile = async (fullRepo, filePath, content, sha = null, branch = 'main') => {
  if (!apply) {
    console.log(`[publish] (dry-run) put ${filePath} (${content.length} bytes)`);
    return;
  }
  const url = `https://api.github.com/repos/${fullRepo}/contents/${encodeURIComponent(filePath)}`;
  const body = {
    message: `chore: publish ${filePath}`,
    content: Buffer.from(content).toString('base64'),
    branch,
  };
  if (sha) body.sha = sha;
  await gh('PUT', url, body);
};

const main = async () => {
  const base = process.cwd();
  const { full, created } = await ensureRepo();
  const repoMetaRes = await fetch(`https://api.github.com/repos/${full}`, { headers: { Authorization: `token ${token}` } });
  const repoMeta = await repoMetaRes.json();
  const defaultBranch = repoMeta.default_branch || 'main';
  const files = await listFiles(base);
  console.log(`[publish] Repo: ${full}. Branch: ${defaultBranch}. Files: ${files.length}. Apply=${apply}`);

  let count = 0;
  for (const rel of files) {
    const content = await fs.readFile(path.join(base, rel));
    const current = await getContent(full, rel);
    const sha = current ? current.sha : null;
    await putFile(full, rel, content, sha, defaultBranch);
    count += 1;
    if (!apply && count >= 10) break; // preview first 10 in dry-run
  }
  console.log(`[publish] Done. ${apply ? 'Uploaded' : 'Previewed'} ${apply ? files.length : Math.min(files.length, 10)} files.`);
};

main().catch((e) => { console.error('[publish] Failed:', e); process.exit(1); });
