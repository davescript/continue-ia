#!/usr/bin/env node
// Set P0/P1 labels on Sprint 1 issues

import { execSync } from 'child_process';

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
if (!token) {
  console.error('Set GITHUB_TOKEN to run this script.');
  process.exit(1);
}

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
if (!repo) {
  console.error('Unable to detect repo. Set GITHUB_REPO=owner/repo');
  process.exit(1);
}

const gh = async (method, url, body) => {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${url} -> ${res.status} ${text}`);
  }
  return res.json();
};

const listIssues = async () => gh('GET', `https://api.github.com/repos/${repo}/issues?state=open&per_page=100&page=1`);
const updateLabels = async (number, labels) => gh('PATCH', `https://api.github.com/repos/${repo}/issues/${number}`, { labels });

const main = async () => {
  const issues = await listIssues();
  const sprint1 = issues.filter((i) => i.labels.some((l) => l.name.toLowerCase() === 'sprint 1'));

  const p0Titles = [
    'I-1 Healthcheck API',
    'I-2 Categorias (produtos)',
    'I-3 Produtos',
    'I-4 Acessórios',
    'I-9 Servir front',
  ];
  const p1Titles = [
    'I-5 Checkout Stripe (mock sem chave)',
    'I-6 Autenticação Admin',
    'I-7 Observabilidade e Segurança',
    'I-8 Seeds e Runbook',
  ];

  for (const it of sprint1) {
    const names = it.labels.map((l) => l.name);
    if (p0Titles.includes(it.title)) {
      const next = Array.from(new Set([...names, 'P0']));
      await updateLabels(it.number, next);
      console.log('[triage] P0 ->', it.title);
    } else if (p1Titles.includes(it.title)) {
      const next = Array.from(new Set([...names, 'P1']))
        .filter((n) => n !== 'P2');
      await updateLabels(it.number, next);
      console.log('[triage] P1 ->', it.title);
    }
  }
};

main().catch((e) => {
  console.error('[triage] Failed:', e.message || e);
  process.exit(1);
});

