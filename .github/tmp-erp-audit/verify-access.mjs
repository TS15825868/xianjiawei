import { writeFileSync } from 'node:fs';

const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
const apiToken = String(process.env.CLOUDFLARE_API_TOKEN || '').trim();
const domain = 'xianjiawei-internal.tung314069.workers.dev';
const baseUrl = `https://${domain}`;

if (!accountId) throw new Error('缺少 CLOUDFLARE_ACCOUNT_ID');
if (!apiToken) throw new Error('缺少 CLOUDFLARE_API_TOKEN');

const headers = { authorization: `Bearer ${apiToken}`, 'content-type': 'application/json' };
const apiBase = `https://api.cloudflare.com/client/v4/accounts/${accountId}/access`;
const result = {
  ok: false,
  strategy: 'disposable_service_token',
  service_token_created: false,
  policy_created: false,
  policy_precedence: null,
  health_http: 0,
  health_json: false,
  cleanup_policy: false,
  cleanup_token: false,
  error: '',
  checked_at: new Date().toISOString(),
};
let serviceToken = null;
let app = null;
let policy = null;

async function cf(path, init = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  let payload = null;
  try { payload = await response.json(); } catch {}
  if (!response.ok || payload?.success === false) {
    const message = payload?.errors?.map((item) => item.message).filter(Boolean).join('；') || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload?.result ?? payload;
}

try {
  const apps = await cf('/apps?per_page=1000');
  app = (Array.isArray(apps) ? apps : []).find((item) => String(item.domain || '').toLowerCase() === domain.toLowerCase());
  if (!app) throw new Error(`找不到 Cloudflare Access 應用：${domain}`);

  const existingPolicies = await cf(`/apps/${app.id}/policies?per_page=1000`);
  const usedPrecedences = new Set((Array.isArray(existingPolicies) ? existingPolicies : [])
    .map((item) => Number(item.precedence))
    .filter((value) => Number.isInteger(value) && value > 0));
  let precedence = 1;
  while (usedPrecedences.has(precedence)) precedence += 1;
  result.policy_precedence = precedence;

  serviceToken = await cf('/service_tokens', {
    method: 'POST',
    body: JSON.stringify({
      name: `GitHub Public Readonly ERP Health ${process.env.GITHUB_RUN_ID || Date.now()}`,
      duration: '1h',
    }),
  });
  if (!serviceToken?.id || !serviceToken?.client_id || !serviceToken?.client_secret) throw new Error('Cloudflare 未回傳完整短效 Service Token');
  result.service_token_created = true;

  policy = await cf(`/apps/${app.id}/policies`, {
    method: 'POST',
    body: JSON.stringify({
      name: `GitHub Public Readonly ERP Health ${process.env.GITHUB_RUN_ID || Date.now()}`,
      decision: 'non_identity',
      precedence,
      include: [{ service_token: { token_id: serviceToken.id } }],
      exclude: [],
      require: [],
      session_duration: '1h',
    }),
  });
  if (!policy?.id) throw new Error('Cloudflare 未回傳短效 Service Auth Policy');
  result.policy_created = true;

  await new Promise((resolve) => setTimeout(resolve, 5000));
  const response = await fetch(`${baseUrl}/healthz?t=${Date.now()}`, {
    headers: {
      'CF-Access-Client-Id': serviceToken.client_id,
      'CF-Access-Client-Secret': serviceToken.client_secret,
      accept: 'application/json',
    },
    redirect: 'manual',
  });
  result.health_http = response.status;
  let health = null;
  try { health = await response.json(); } catch {}
  result.health_json = response.status === 200 && health?.ok === true;
  if (!result.health_json) throw new Error(`Cloudflare Access 健康端點未回傳有效 JSON（HTTP ${response.status}）`);
  result.health = {
    ok: health.ok === true,
    service: String(health.service || ''),
    version: String(health.version || ''),
    storage: String(health.storage || ''),
  };
  result.ok = true;
} catch (error) {
  result.error = String(error?.message || error);
} finally {
  if (policy?.id && app?.id) {
    try {
      await cf(`/apps/${app.id}/policies/${policy.id}`, { method: 'DELETE' });
      result.cleanup_policy = true;
    } catch (error) {
      result.cleanup_policy_error = String(error?.message || error);
    }
  }
  if (serviceToken?.id) {
    try {
      await cf(`/service_tokens/${serviceToken.id}`, { method: 'DELETE', body: '{}' });
      result.cleanup_token = true;
    } catch (error) {
      result.cleanup_token_error = String(error?.message || error);
    }
  }
  writeFileSync('/tmp/cloudflare-access-health-result.json', `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

if (!result.ok || !result.cleanup_policy || !result.cleanup_token) throw new Error(result.error || result.cleanup_policy_error || result.cleanup_token_error || 'Cloudflare Access 短效健康驗證失敗');
console.log(`PASS Cloudflare Access真正健康JSON：HTTP ${result.health_http}；短效Policy與Token已清除。`);
