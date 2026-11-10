import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const env = { ...process.env };
env.WRANGLER_LOG_PATH ??= path.join(root, '.wrangler/logs');
env.WRANGLER_SEND_METRICS ??= 'false';
if (env.SITES_MANAGED_LINUX_CONTAINER === '1' && !env.XDG_CONFIG_HOME) {
  env.XDG_CONFIG_HOME = path.join(root, '.wrangler/config');
  await mkdir(env.XDG_CONFIG_HOME, { recursive: true });
}
const child = spawn(process.execPath, [path.join(root, 'node_modules/wrangler/bin/wrangler.js'), ...process.argv.slice(2)], {
  cwd: root, env, stdio: 'inherit',
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
