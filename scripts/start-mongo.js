const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dbPath = path.join(root, 'tools', 'mongodb-data');
const logDir = path.join(root, 'tools', 'mongodb-logs');
const logPath = path.join(logDir, 'mongod.log');
const candidates = [
  path.join(root, 'tools', 'mongodb', 'mongodb-win32-x86_64-windows-7.0.14', 'bin', 'mongod.exe'),
  path.join(root, 'tools', 'mongodb', 'bin', 'mongod.exe'),
];

function tcpProbe(port, host = '127.0.0.1', timeout = 1200) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
  });
}

async function main() {
  if (await tcpProbe(27017)) {
    console.log('[mongo] Already running on 127.0.0.1:27017 - using the existing instance.');
    setInterval(() => {}, 1 << 30);
    return;
  }

  const binary = candidates.find((candidate) => fs.existsSync(candidate));
  if (!binary) {
    console.error(
      '[mongo] MongoDB binary was not found.\n' +
        'Run the setup steps in README.md or install MongoDB and set MONGODB_URI in server/.env.'
    );
    process.exit(1);
  }

  fs.mkdirSync(dbPath, { recursive: true });
  fs.mkdirSync(logDir, { recursive: true });

  const child = spawn(
    binary,
    ['--dbpath', dbPath, '--logpath', logPath, '--port', '27017', '--bind_ip', '127.0.0.1'],
    { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }
  );

  child.stdout.on('data', (chunk) => process.stdout.write(`[mongo] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[mongo] ${chunk}`));
  child.on('exit', (code) => {
    console.error(`[mongo] mongod exited with code ${code}. See ${logPath}`);
    process.exit(code || 1);
  });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await tcpProbe(27017)) {
      console.log('[mongo] MongoDB is ready on mongodb://127.0.0.1:27017');
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const shutdown = () => {
    if (!child.killed) child.kill('SIGTERM');
    setTimeout(() => process.exit(0), 600);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('[mongo] Failed to start:', error);
  process.exit(1);
});
