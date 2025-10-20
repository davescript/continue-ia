#!/usr/bin/env node
// Create GitHub issues from markdown files in docs/issues
// Usage:
//   node scripts/create-issues.mjs           # dry-run preview
//   GITHUB_TOKEN=xxxx node scripts/create-issues.mjs --apply

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const root = process.cwd();
const issuesDir = path.join(root, 'docs', 'issues');
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const apply = process.argv.includes('--apply');

const detectRepo = () => {
  const override = process.env.GITHUB_REPO;
  if (override) return override;
  try {
    const url = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    // https://github.com/owner/repo.git
    const m = url.match(/github\.com[/:]([^/]+)\/([^\.]+)(?:\.git)?$/i);
    if (m) return `${m[1]}/${m[2]}`;
  } catch {}
  return '';
};

const repo = detectRepo();
if (!repo) {
  console.error('[issues] Could not detect GitHub repo (set GITHUB_REPO=owner/repo).');
  process.exit(1);
}

const parseIssues = (markdown, sprintLabel) => {
  const lines = markdown.split(/\r?\n/);
  const items = [];
  let current = null;

  const pushCurrent = () => {
    if (current) {
      current.body = current.body.trim();
      items.push(current);
      current = null;
    }
  };

  for (const line of lines) {
    const m = line.match(/^\s*\d+\)\s+(.+?)\s*$/);
    if (m) {
      pushCurrent();
      current = { title: m[1].trim(), body: '', labels: [sprintLabel] };
      continue;
    }
    if (current) {
      current.body += line + '\n';
    }
  }
  pushCurrent();
  return items;
};

const gh = async (method, url, body) => {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `token ${token}` } : {}),
      'User-Agent': 'create-issues-script',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${url} -> ${res.status} ${text}`);
  }
  return res.json();
};

const ensureLabel = async (label) => {
  if (!token) return; // skip when unauthenticated
  try {
    const url = `https://api.github.com/repos/${repo}/labels/${encodeURIComponent(label)}`;
    const res = await fetch(url, { headers: { Authorization: `token ${token}` } });
    if (res.status === 200) return; // exists
  } catch {}
  // create label if missing
  try {
    await gh('POST', `https://api.github.com/repos/${repo}/labels`, {
      name: label,
      color: '0ea5e9',
      description: 'Sprint grouping',
    });
  } catch (e) {
    // ignore label creation errors
    console.warn(`[issues] Could not create label ${label}: ${e.message}`);
  }
};

const fetchExistingTitles = async () => {
  if (!token) return new Set();
  const titles = new Set();
  // fetch first 100 issues (open+closed)
  try {
    const data = await gh(
      'GET',
      `https://api.github.com/repos/${repo}/issues?state=all&per_page=100&page=1`
    );
    for (const it of data) titles.add(it.title);
  } catch (e) {
    console.warn('[issues] Could not fetch existing issues:', e.message);
  }
  return titles;
};

const main = async () => {
  const files = await fs.readdir(issuesDir);
  const mdFiles = files.filter((f) => f.endsWith('.md')).sort();
  const toCreate = [];
  for (const file of mdFiles) {
    const label = file.replace(/\.md$/, '').replace(/-/g, ' ');
    const sprintLabel = label; // e.g., 'sprint 1'
    const content = await fs.readFile(path.join(issuesDir, file), 'utf8');
    const parsed = parseIssues(content, sprintLabel);
    parsed.forEach((it) => (it.source = file));
    toCreate.push(...parsed);
  }

  console.log(`[issues] Repo: ${repo}`);
  console.log(`[issues] Found ${toCreate.length} issues in docs/issues`);

  if (!apply) {
    toCreate.slice(0, 5).forEach((it, idx) => {
      console.log(`\n#${idx + 1} [${it.labels.join(', ')}] ${it.title}\n${it.body.slice(0, 200)}...`);
    });
    console.log('\n(dry-run) Set --apply to create on GitHub.');
    return;
  }

  if (!token) {
    console.error('Set GITHUB_TOKEN to create issues.');
    process.exit(1);
  }

  const existing = await fetchExistingTitles();
  for (const issue of toCreate) {
    await ensureLabel(issue.labels[0]);
    if (existing.has(issue.title)) {
      console.log(`[issues] Skipping existing: ${issue.title}`);
      continue;
    }
    const created = await gh('POST', `https://api.github.com/repos/${repo}/issues`, {
      title: issue.title,
      body: issue.body + `\n\n(Source: ${issue.source})`,
      labels: issue.labels,
    });
    console.log(`[issues] Created #${created.number}: ${created.title}`);
  }
};

main().catch((e) => {
  console.error('[issues] Failed:', e);
  process.exit(1);
});

