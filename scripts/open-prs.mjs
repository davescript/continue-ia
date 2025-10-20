#!/usr/bin/env node
// Create draft PRs for P0 sprint 1 issues without local git state

import { execSync } from 'child_process';
import fs from 'fs/promises';

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

const getRef = async (ref) => gh('GET', `https://api.github.com/repos/${repo}/git/ref/${encodeURIComponent(ref)}`);
const createRef = async (ref, sha) => gh('POST', `https://api.github.com/repos/${repo}/git/refs`, { ref: `refs/heads/${ref}`, sha });
const createOrUpdateFile = async (path, content, message, branch) => gh('PUT', `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`, { message, content: Buffer.from(content).toString('base64'), branch });
const createPR = async (title, head, base, body, draft=true) => gh('POST', `https://api.github.com/repos/${repo}/pulls`, { title, head, base, body, draft });
const addLabels = async (number, labels) => gh('POST', `https://api.github.com/repos/${repo}/issues/${number}/labels`, { labels });

const listIssues = async () => gh('GET', `https://api.github.com/repos/${repo}/issues?state=open&per_page=100&page=1`);

const makeSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

const main = async () => {
  const issues = await listIssues();
  const sprint1 = issues.filter((i) => i.labels.some((l) => l.name.toLowerCase()==='sprint 1'));
  const p0 = sprint1.filter((i) => i.labels.some((l) => l.name==='P0'));
  if (p0.length === 0) { console.log('No P0 issues found.'); return; }

  const { object: { sha: mainSha } } = await getRef('heads/main');

  for (const it of p0) {
    const branch = `feature/${it.number}-${makeSlug(it.title)}`;
    // create branch if not exists
    let created = false;
    try {
      await getRef(`heads/${branch}`);
    } catch {
      await createRef(branch, mainSha);
      created = true;
    }
    // add placeholder file
    const path = `docs/prs/issue-${it.number}.md`;
    const body = `# ${it.title}\n\nRascunho do PR para implementação.\n\n- [ ] Implementar\n- [ ] Testar\n- [ ] Atualizar docs\n\nCloses #${it.number}`;
    await createOrUpdateFile(path, body, `chore(pr): scaffold for #${it.number}`, branch);
    // open PR if not opened
    const prTitle = `WIP: ${it.title}`;
    const pr = await createPR(prTitle, branch, 'main', `Closes #${it.number}\n\n${body}`, true);
    await addLabels(pr.number, ['P0', 'feature']);
    console.log(`[pr] Created #${pr.number}: ${pr.title}`);
  }
};

main().catch((e) => { console.error('[open-prs] Failed:', e); process.exit(1); });

