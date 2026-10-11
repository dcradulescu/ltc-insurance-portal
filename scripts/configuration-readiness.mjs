// Pure, offline configuration review. Never return values, URLs, or credentials.
export function reviewConfiguration(env) {
  const issues = [];
  const add = (severity, key, message) => issues.push({ severity, key, message });
  const error = (key, message) => add('error', key, message);
  const warn = (key, message) => add('warning', key, message);
  const placeholder = value => /^(?:REPLACE(?:_|$)|CHANGEME$|YOUR[_-]|USER$|PASSWORD$|HOST$|DATABASE$)/i.test(value);
  const reservedHost = host => /(^|\.)(localhost|example|test|invalid)$|(^|\.)example\.(com|org|net)$|^your-domain\./i.test(host);
  function required(key, value = env[key]) {
    if (!value?.trim()) { error(key, 'A nonempty value is required.'); return false; }
    if (placeholder(value)) { error(key, 'Replace the template placeholder.'); return false; }
    return true;
  }
  function url(key, value, { originOnly = false, publicHost = false, allowQuery = false } = {}) {
    if (!required(key, value)) return null;
    if (value !== value.trim()) { error(key, 'Remove leading or trailing whitespace from the URL.'); return null; }
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || (!allowQuery && parsed.search) || parsed.hash) {
        error(key, 'Use an HTTPS URL without embedded credentials, query parameters, or a fragment.'); return null;
      }
      if (reservedHost(parsed.hostname) || (publicHost && ['127.0.0.1', '[::1]', '0.0.0.0', '[::]'].includes(parsed.hostname))) {
        error(key, 'Replace the placeholder or loopback host with the deployment host.'); return null;
      }
      if (originOnly && parsed.pathname !== '/') { error(key, 'Use an origin only, without a path.'); return null; }
      return parsed;
    } catch { error(key, 'Use a valid HTTPS URL.'); return null; }
  }
  function integer(key, fallback, minimum, maximum) {
    const value = env[key] ?? fallback;
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < minimum || Number(value) > maximum) {
      error(key, `Use an integer from ${minimum} through ${maximum}.`); return null;
    }
    return Number(value);
  }
  function boolean(key) {
    if (env[key] !== undefined && !['true', 'false', ''].includes(env[key])) error(key, 'Use the exact value true or false, or leave unset.');
  }
  function mailbox(key) {
    if (!required(key)) return;
    const value = env[key];
    // Nodemailer supports display names; inspect only the enclosed address.
    const match = value.includes('<') || value.includes('>')
      ? value.match(/^[^<>\r\n]+<([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)>$/)
      : value.match(/^([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)$/);
    if (!match || /[\r\n]/.test(value)) error(key, 'Use one valid email address, optionally with a display name.');
    else if (reservedHost(match[1].split('@')[1])) error(key, 'Replace the example email address.');
  }

  if (env.NODE_ENV !== 'production') error('NODE_ENV', 'Set production for the production configuration check.');
  required('APP_ID', env.APP_ID ?? 'ltc-insurance-portal');
  if (required('JWT_SECRET') && env.JWT_SECRET.trim().length < 64) error('JWT_SECRET', 'Use at least 64 characters from a cryptographically random source.');
  const appUrl = url('APP_PUBLIC_URL', env.APP_PUBLIC_URL, { originOnly: true, publicHost: true });
  integer('PORT', '3000', 1, 65535);
  if (env.TRUST_PROXY_HOPS) {
    integer('TRUST_PROXY_HOPS', '', 0, 100);
    warn('TRUST_PROXY_HOPS', 'Verify this count against the actual reverse-proxy path; this check cannot inspect the topology.');
  }
  if (env.CORS_ORIGINS) {
    const origins = env.CORS_ORIGINS.split(',').map(value => value.trim());
    const parsed = origins.map(value => url('CORS_ORIGINS', value, { originOnly: true, publicHost: true }));
    if (appUrl && !parsed.some(value => value?.origin === appUrl.origin)) error('CORS_ORIGINS', 'Include the APP_PUBLIC_URL origin.');
  }
  if (env.VITE_PUBLIC_URL) {
    const client = url('VITE_PUBLIC_URL', env.VITE_PUBLIC_URL, { originOnly: true, publicHost: true });
    if (client && appUrl && client.origin !== appUrl.origin) error('VITE_PUBLIC_URL', 'Keep this origin consistent with APP_PUBLIC_URL.');
  }
  if (env.VITE_ZAPIER_WEBHOOK_URL) error('VITE_ZAPIER_WEBHOOK_URL', 'Remove this legacy client-exposed setting; use ZAPIER_WEBHOOK_URL on the server.');

  if (required('DATABASE_URL')) {
    try {
      const db = new URL(env.DATABASE_URL);
      const parts = [db.hostname, decodeURIComponent(db.username), decodeURIComponent(db.password), decodeURIComponent(db.pathname.slice(1))];
      if (db.protocol !== 'mysql:' || parts.some(value => !value || placeholder(value)) || db.hash || db.pathname.slice(1).includes('/') || (db.hostname !== 'localhost' && reservedHost(db.hostname))) {
        error('DATABASE_URL', 'Use a mysql connection URL with a host, user, password, and database name; replace all template fields.');
      }
      if (db.username === 'root') warn('DATABASE_URL', 'Use an application account restricted to the portal database.');
      warn('DATABASE_URL', 'Connectivity, schema, database permissions, and transport security require separate verification.');
    } catch { error('DATABASE_URL', 'Use a valid mysql connection URL; percent-encode credential special characters.'); }
  }

  required('S3_BUCKET'); required('S3_REGION', env.S3_REGION ?? 'us-east-1');
  const access = env.S3_ACCESS_KEY_ID ?? env.S3_ACCESS_KEY ?? '';
  const secret = env.S3_SECRET_ACCESS_KEY ?? env.S3_SECRET_KEY ?? '';
  if (access || secret) { required('S3_ACCESS_KEY_ID', access); required('S3_SECRET_ACCESS_KEY', secret); }
  else warn('S3 credentials', 'No explicit S3 credentials are set. Verify the AWS SDK credential chain or runtime role in the deployment environment.');
  if (env.S3_ENDPOINT) url('S3_ENDPOINT', env.S3_ENDPOINT);
  boolean('S3_FORCE_PATH_STYLE');
  if (env.S3_PUBLIC_BASE_URL) warn('S3_PUBLIC_BASE_URL', 'This legacy setting does not control private portal downloads.');

  required('OPENAI_API_KEY'); required('OPENAI_MODEL');
  const ai = url('OPENAI_BASE_URL', env.OPENAI_BASE_URL ?? 'https://api.openai.com');
  if (ai && /\/v1\/?$/.test(ai.pathname)) error('OPENAI_BASE_URL', 'Remove the trailing /v1: the current adapter appends /v1/chat/completions.');

  if (required('SMTP_HOST') && (reservedHost(env.SMTP_HOST) || /[\s/:]/.test(env.SMTP_HOST))) error('SMTP_HOST', 'Use the SMTP hostname, without a URL scheme, port, or placeholder domain.');
  const smtpPort = integer('SMTP_PORT', '587', 1, 65535); boolean('SMTP_SECURE');
  if (smtpPort === 465 && env.SMTP_SECURE !== 'true') warn('SMTP_SECURE', 'Port 465 is typically implicit TLS. Confirm the provider setting before sending.');
  if (env.SMTP_USER || env.SMTP_PASS) { required('SMTP_USER'); required('SMTP_PASS'); }
  else warn('SMTP authentication', 'No SMTP credentials are set. Confirm that the configured relay permits this application.');
  mailbox('SMTP_FROM'); mailbox('NOTIFY_OWNER_EMAIL');
  if (env.ZAPIER_WEBHOOK_URL) {
    url('ZAPIER_WEBHOOK_URL', env.ZAPIER_WEBHOOK_URL, { allowQuery: true });
    warn('ZAPIER_WEBHOOK_URL', 'Explicit email requests prefer the webhook. Owner/contact notifications still require SMTP.');
  }
  const smsKeys = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
  const smsConfigured = smsKeys.some(key => !!env[key]);
  if (smsConfigured) {
    smsKeys.forEach(key => required(key));
    if (env.TWILIO_PHONE_NUMBER && !/^\+[1-9]\d{7,14}$/.test(env.TWILIO_PHONE_NUMBER)) error('TWILIO_PHONE_NUMBER', 'Use an international number beginning with + and the country code.');
    warn('SMS', 'Provider delivery must be tested separately. Automatic SMS scheduling is not implemented.');
  }
  return {
    scope: 'offline production configuration review',
    configurationValid: !issues.some(issue => issue.severity === 'error'),
    deploymentReady: false,
    liveChecksPerformed: false,
    optionalSms: smsConfigured ? 'configured_unverified' : 'disabled',
    issues,
    remainingVerification: ['Database connectivity, schema and permissions', 'Private object storage upload and authorized downloads', 'Email delivery and webhook mappings', 'AI model access', 'Hosted HTTPS, cookies and reverse proxy', 'Account rollout and legacy migration review'],
  };
}
