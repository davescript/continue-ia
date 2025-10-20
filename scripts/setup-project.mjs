#!/usr/bin/env node
// Bootstrap GitHub milestones and classic project board, and assign issues to sprints
// Usage: GITHUB_TOKEN=... node scripts/setup-project.mjs

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

const gh = async (method, url, body, extraHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `token ${token}`,
    'User-Agent': 'setup-project-script',
    ...extraHeaders,
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${url} -> ${res.status} ${text}`);
  }
  return res.json();
};

const ensureLabel = async (name, color = '777777', description = '') => {
  const url = `https://api.github.com/repos/${repo}/labels/${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: { Authorization: `token ${token}` } });
  if (res.status === 200) return;
  await gh('POST', `https://api.github.com/repos/${repo}/labels`, {
    name,
    color,
    description,
  });
};

const ensureMilestone = async (title, due_on, description) => {
  const list = await gh('GET', `https://api.github.com/repos/${repo}/milestones?state=all&per_page=100&page=1`);
  const found = list.find((m) => m.title.toLowerCase() === title.toLowerCase());
  if (found) return found;
  return gh('POST', `https://api.github.com/repos/${repo}/milestones`, {
    title,
    due_on,
    description,
    state: 'open',
  });
};

const listIssues = async () => {
  return gh('GET', `https://api.github.com/repos/${repo}/issues?state=open&per_page=100&page=1`);
};

const updateIssue = async (number, patch) => {
  return gh('PATCH', `https://api.github.com/repos/${repo}/issues/${number}`, patch);
};

const ensureProject = async (name) => {
  // Classic project boards API (preview header required)
  const headers = { Accept: 'application/vnd.github.inertia+json' };
  // try to find existing projects
  try {
    const projects = await gh('GET', `https://api.github.com/repos/${repo}/projects`, null, headers);
    const existing = projects.find((p) => p.name === name);
    if (existing) return existing;
    return gh('POST', `https://api.github.com/repos/${repo}/projects`, { name }, headers);
  } catch (e) {
    // Classic projects deprecated; fall back to Projects V2 (GraphQL)
    console.warn('[setup] Classic projects API unavailable, using Projects V2');
    return ensureProjectV2(name);
  }
};

const ensureColumn = async (projectId, name) => {
  const headers = { Accept: 'application/vnd.github.inertia+json' };
  const cols = await gh('GET', `https://api.github.com/projects/${projectId}/columns`, null, headers);
  const found = cols.find((c) => c.name === name);
  if (found) return found;
  return gh('POST', `https://api.github.com/projects/${projectId}/columns`, { name }, headers);
};

const addIssueToColumn = async (columnId, issueId) => {
  const headers = { Accept: 'application/vnd.github.inertia+json' };
  try {
    await gh('POST', `https://api.github.com/projects/columns/${columnId}/cards`, {
      content_id: issueId,
      content_type: 'Issue',
    }, headers);
  } catch (e) {
    // Ignore duplicates or permission issues
    console.warn('[setup] Could not add card:', e.message);
  }
};

// ===== Projects V2 (GraphQL) =====
const gql = async (query, variables) => {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data;
};

const getViewerId = async () => {
  const data = await gql(`query { viewer { id login } }`);
  return data.viewer.id;
};

const findUserProjectV2ByTitle = async (ownerId, title) => {
  const data = await gql(
    `query($ownerId:ID!, $first:Int!) {
      node(id:$ownerId) { ... on User { projectsV2(first:$first) { nodes { id title } } } }
    }`,
    { ownerId, first: 20 }
  );
  const nodes = data?.node?.projectsV2?.nodes || [];
  return nodes.find((p) => p.title === title) || null;
};

const ensureProjectV2 = async (title) => {
  const ownerId = await getViewerId();
  const existing = await findUserProjectV2ByTitle(ownerId, title);
  if (existing) return { id: existing.id, v2: true };
  const data = await gql(
    `mutation($ownerId:ID!, $title:String!) { createProjectV2(input:{ ownerId:$ownerId, title:$title }) { projectV2 { id title } } }`,
    { ownerId, title }
  );
  return { id: data.createProjectV2.projectV2.id, v2: true };
};

const getProjectV2StatusField = async (projectId) => {
  const data = await gql(
    `query($id:ID!) {
      node(id:$id) {
        ... on ProjectV2 {
          fields(first:50) {
            nodes {
              ... on ProjectV2SingleSelectField { id name options { id name } }
            }
          }
        }
      }
    }`,
    { id: projectId }
  );
  const fields = data?.node?.fields?.nodes || [];
  const status = fields.find((f) => f.name === 'Status');
  return status || null;
};

const addIssueToProjectV2 = async (projectId, issueNodeId, statusOptionName = 'Todo') => {
  const addItem = await gql(
    `mutation($projectId:ID!, $contentId:ID!) { addProjectV2ItemById(input:{ projectId:$projectId, contentId:$contentId }) { item { id } } }`,
    { projectId, contentId: issueNodeId }
  );
  const itemId = addItem.addProjectV2ItemById.item.id;
  const statusField = await getProjectV2StatusField(projectId);
  if (!statusField) return;
  const option = (statusField.options || []).find((o) => o.name.toLowerCase().includes(statusOptionName.toLowerCase()));
  if (!option) return;
  await gql(
    `mutation($projectId:ID!, $itemId:ID!, $fieldId:ID!, $optionId:String!) {
      updateProjectV2ItemFieldValue(input:{ projectId:$projectId, itemId:$itemId, fieldId:$fieldId, value:{ singleSelectOptionId:$optionId } }) { projectV2Item { id } }
    }`,
    { projectId, itemId, fieldId: statusField.id, optionId: option.id }
  );
};

const main = async () => {
  console.log('[setup] Repo:', repo);

  // Labels
  const labelSpecs = [
    ['feature', '22c55e', 'Nova funcionalidade'],
    ['bug', 'ef4444', 'Correção de bug'],
    ['chore', '6b7280', 'Tarefa de manutenção'],
    ['docs', '0ea5e9', 'Documentação'],
    ['api', 'a855f7', 'Área: API'],
    ['editor', 'fbbf24', 'Área: Editor'],
    ['render', 'f87171', 'Área: Render'],
    ['admin', '10b981', 'Área: Admin'],
    ['P0', 'b91c1c', 'Prioridade alta'],
    ['P1', 'f59e0b', 'Prioridade média'],
    ['P2', '84cc16', 'Prioridade baixa'],
    ['blocked', '111827', 'Bloqueado'],
    ['needs-info', '64748b', 'Precisa de informação'],
  ];
  for (const [name, color, desc] of labelSpecs) {
    try {
      await ensureLabel(name, color, desc);
    } catch (e) {
      console.warn('[setup] label failed', name, e.message);
    }
  }

  // Milestones
  const s1 = await ensureMilestone('Sprint 1', '2025-10-24T23:59:59Z', '2025-10-20 → 2025-10-24');
  const s2 = await ensureMilestone('Sprint 2', '2025-11-01T23:59:59Z', '2025-10-27 → 2025-11-01');
  const s3 = await ensureMilestone('Sprint 3', '2025-11-07T23:59:59Z', '2025-11-03 → 2025-11-07');

  const milestoneByLabel = {
    'sprint 1': s1,
    'sprint 2': s2,
    'sprint 3': s3,
  };

  // Assign issues to milestones by sprint label
  const issues = await listIssues();
  for (const it of issues) {
    const sprintLabel = it.labels.map((l) => l.name.toLowerCase()).find((n) => n.startsWith('sprint '));
    if (!sprintLabel) continue;
    const ms = milestoneByLabel[sprintLabel];
    if (!ms) continue;
    if (it.milestone && it.milestone.number === ms.number) continue;
    await updateIssue(it.number, { milestone: ms.number });
    console.log('[setup] Assigned', it.title, '→', ms.title);
  }

  // Project board (try classic first; ensureProject handles fallback to V2)
  const project = await ensureProject('Sprint Board');
  if (project.v2) {
    // Add issues to Project V2 with Status=Todo
    for (const it of issues) {
      const hasSprint = it.labels.some((l) => /^sprint\s+\d+$/i.test(l.name));
      if (!hasSprint) continue;
      const issueNodeId = it.node_id; // GraphQL node id
      await addIssueToProjectV2(project.id, issueNodeId, 'Todo');
    }
    console.log('[setup] Created/updated Project V2: https://github.com/users/' + repo.split('/')[0] + '/projects');
  } else {
    const cols = {};
    for (const name of ['Backlog', 'Sprint Backlog', 'In Progress', 'Review', 'QA', 'Done', 'Blocked']) {
      cols[name] = await ensureColumn(project.id, name);
    }
    const backlogColId = cols['Sprint Backlog'].id;
    for (const it of issues) {
      const hasSprint = it.labels.some((l) => /^sprint\s+\d+$/i.test(l.name));
      if (!hasSprint) continue;
      await addIssueToColumn(backlogColId, it.id);
    }
    console.log('[setup] Created/updated Classic Project: https://github.com/' + repo + '/projects');
  }
};

main().catch((e) => {
  console.error('[setup] Failed:', e);
  process.exit(1);
});
