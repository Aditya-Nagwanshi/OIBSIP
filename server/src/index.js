import http from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { seedDatabase } from './seed.js';
import { initSocket, getIO } from './services/socket.js';
import { startCronJobs } from './services/cron.js';

async function start() {
  await connectDatabase();

  if (process.env.SEED_ON_START !== 'false') {
    await seedDatabase({ quiet: true });
    console.log('[seed] Catalog and admin access verified.');
  }

  const server = http.createServer(app);
  initSocket(server);
  const cronTask = startCronJobs();

  server.listen(env.port, '0.0.0.0', () => {
    console.log('');
    console.log('  🍕  Slice Theory API');
    console.log(`  →  http://localhost:${env.port}/api/health`);
    console.log(`  →  Client: ${env.clientUrls[0]}`);
    console.log(`  →  Payments: ${env.paymentsMode === 'razorpay' ? 'Razorpay test mode' : 'Demo mock checkout'}`);
    console.log(`  →  Admin email: ${env.adminEmail} (passwordless demo access)`);
    console.log('');
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[server] ${signal} received, shutting down...`);
    cronTask?.stop();
    getIO()?.close();
    server.close(async () => {
      await disconnectDatabase().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});

start().catch((error) => {
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
