#!/usr/bin/env node
// Configure branch protection on main: 1 review + required status check 'build'

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

const API = `https://api.github.com/repos/${repo}/branches/main/protection`;

const run = async () => {
  const res = await fetch(API, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      required_status_checks: {
        strict: false,
        contexts: ['build', 'lint'],
      },
      enforce_admins: false,
      required_pull_request_reviews: {
        required_approving_review_count: 1,
        dismiss_stale_reviews: false,
        require_code_owner_reviews: false,
      },
      restrictions: null,
      required_linear_history: true,
      allow_force_pushes: false,
      allow_deletions: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to set protection: ${res.status} ${text}`);
  }
  console.log('[protect] Branch protection applied on main');
};

run().catch((e) => {
  console.error('[protect] Failed:', e.message || e);
  process.exit(1);
});
