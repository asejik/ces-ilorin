import fs from 'node:fs';

/**
 * Reads environment variables for a script.
 *   node scripts/x.mjs                       -> .env.local (development / staging project)
 *   node scripts/x.mjs --env private/env/production.env   -> the production project
 * Real process environment variables win over file values. Never prints secret values.
 */
export function loadEnv(argv = process.argv) {
  const flag = argv.indexOf('--env');
  const file = flag >= 0 ? argv[flag + 1] : '.env.local';
  const env = { ...process.env };
  if (file && fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const i = line.indexOf('=');
      const k = line.slice(0, i).trim();
      if (!(k in env)) env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
  } else if (flag >= 0) {
    console.error(`Env file not found: ${file}`);
    process.exit(2);
  }
  return { env, file };
}

/** Project host with the first letters hidden, safe to print. */
export function maskedHost(url) {
  const host = new URL(url).host;
  return host.replace(/^[^.]+/, (m) => m.slice(0, 4) + '***');
}
