import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const mongoBin = path.join(
  root,
  'tools',
  'mongodb',
  'mongodb-win32-x86_64-windows-7.0.14',
  'bin',
  'mongod.exe'
);
const testDataDir = path.join(root, 'tools', 'mongodb-test-data');
const testLogDir = path.join(root, 'tools', 'mongodb-logs');
const mongoPort = 27018;
const apiPort = 5101;
const baseUrl = `http://127.0.0.1:${apiPort}`;

process.env.NODE_ENV = 'test';
process.env.PORT = String(apiPort);
process.env.MONGODB_URI = `mongodb://127.0.0.1:${mongoPort}/slice-theory-test`;
process.env.SEED_ON_START = 'false';
process.env.PAYMENTS_MODE = 'mock';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.ADMIN_EMAIL = 'Demo_SliceTheory@pizza';
process.env.JWT_SECRET = 'slice-theory-test-secret-0123456789abcdef';
process.env.SMTP_HOST = '';
process.env.LOW_STOCK_CRON = '';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

async function waitForPort(port, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await portOpen(port)) return;
    await wait(250);
  }
  throw new Error(`Timed out waiting for port ${port}`);
}

async function request(pathname, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  return { status: response.status, data };
}

function tokenFromUrl(url) {
  return new URL(url).searchParams.get('token');
}

const address = {
  line1: '42 Test Lane, Bandra',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400050',
  phone: '9876543210',
  instructions: 'Ring the bell twice.',
};

test('Slice Theory API end-to-end smoke flow', { timeout: 180000 }, async (t) => {
  fs.mkdirSync(testDataDir, { recursive: true });
  fs.mkdirSync(testLogDir, { recursive: true });

  let mongodOutput = '';
  const mongod = spawn(
    mongoBin,
    [
      '--dbpath',
      testDataDir,
      '--port',
      String(mongoPort),
      '--bind_ip',
      '127.0.0.1',
      '--logpath',
      path.join(testLogDir, 'test-mongod.log'),
      '--logappend',
      '--wiredTigerCacheSizeGB',
      '0.25',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  mongod.stdout.on('data', (chunk) => {
    mongodOutput += chunk.toString();
  });
  mongod.stderr.on('data', (chunk) => {
    mongodOutput += chunk.toString();
  });

  let server;
  let disconnectDatabase;

  try {
    await waitForPort(mongoPort);

    const { connectDatabase } = await import('../src/config/db.js');
    const { default: app } = await import('../src/app.js');
    const { seedDatabase } = await import('../src/seed.js');

    disconnectDatabase = (await import('../src/config/db.js')).disconnectDatabase;
    const connection = await connectDatabase();
    await connection.dropDatabase();
    const seeded = await seedDatabase({ quiet: true });
    assert.equal(seeded.pizzaCount, 6);
    assert.equal(seeded.inventoryCount, 27);

    server = await new Promise((resolve, reject) => {
      const instance = app.listen(apiPort, '127.0.0.1', () => resolve(instance));
      instance.once('error', reject);
    });

    let adminToken = '';
    let userToken = '';
    let userTwoToken = '';
    let presetOrder = null;
    let customOrder = null;

    await t.test('health and catalog are wired', async () => {
      const health = await request('/api/health');
      assert.equal(health.status, 200);
      assert.equal(health.data.database, 'connected');

      const pizzas = await request('/api/catalog/pizzas');
      assert.equal(pizzas.status, 200);
      assert.equal(pizzas.data.pizzas.length, 6);
      const margherita = pizzas.data.pizzas.find((pizza) => pizza.slug === 'classic-margherita');
      assert.ok(margherita);
      assert.equal(margherita.isVegetarian, true);
      assert.ok(Array.isArray(margherita.badges));
      assert.ok(margherita.prepMinutes > 0);
      assert.equal(margherita.canOrder, true);
      assert.ok(margherita.recipe.length >= 4);

      const config = await request('/api/catalog/config');
      assert.equal(config.status, 200);
      assert.equal(config.data.payments.mode, 'mock');
      assert.equal(config.data.admin.email, 'Demo_SliceTheory@pizza');

      const builder = await request('/api/catalog/builder-options');
      assert.equal(builder.status, 200);
      for (const group of ['base', 'sauce', 'cheese', 'vegetable']) {
        assert.ok(builder.data.groups[group].length > 0, `${group} options should exist`);
      }
      assert.equal(builder.data.sizes.length, 3);
    });

    await t.test('registration, verification and login', async () => {
      const registration = await request('/api/auth/register', {
        method: 'POST',
        body: { name: 'Smoke Tester', email: 'smoke.user@example.com', password: 'PizzaSlice123' },
      });
      assert.equal(registration.status, 201);
      assert.equal(registration.data.user.isVerified, false);
      assert.ok(registration.data.devVerifyUrl);

      const unverified = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'smoke.user@example.com', password: 'PizzaSlice123' },
      });
      assert.equal(unverified.status, 403);
      assert.equal(unverified.data.code, 'EMAIL_UNVERIFIED');

      const verifyToken = tokenFromUrl(registration.data.devVerifyUrl);
      assert.ok(verifyToken);
      const verification = await request('/api/auth/verify-email', {
        method: 'POST',
        body: { token: verifyToken },
      });
      assert.equal(verification.status, 200);
      assert.equal(verification.data.user.isVerified, true);
      userToken = verification.data.token;

      const login = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'smoke.user@example.com', password: 'PizzaSlice123' },
      });
      assert.equal(login.status, 200);
      userToken = login.data.token;

      const me = await request('/api/auth/me', { token: userToken });
      assert.equal(me.status, 200);
      assert.equal(me.data.user.email, 'smoke.user@example.com');

      const registrationTwo = await request('/api/auth/register', {
        method: 'POST',
        body: { name: 'Second Tester', email: 'smoke.two@example.com', password: 'PizzaSlice456' },
      });
      assert.equal(registrationTwo.status, 201);
      const secondToken = tokenFromUrl(registrationTwo.data.devVerifyUrl);
      const verifiedTwo = await request('/api/auth/verify-email', {
        method: 'POST',
        body: { token: secondToken },
      });
      assert.equal(verifiedTwo.status, 200);
      userTwoToken = verifiedTwo.data.token;
    });

    await t.test('admin login and authorization boundaries', async () => {
      const anonymous = await request('/api/admin/stats');
      assert.equal(anonymous.status, 401);

      const userDenied = await request('/api/admin/stats', { token: userToken });
      assert.equal(userDenied.status, 403);
      assert.equal(userDenied.data.code, 'ADMIN_ONLY');

      const admin = await request('/api/auth/admin/login', {
        method: 'POST',
        body: { email: 'demo_slicetheory@pizza' },
      });
      assert.equal(admin.status, 200);
      assert.equal(admin.data.user.role, 'admin');
      assert.equal(admin.data.passwordless, true);
      adminToken = admin.data.token;

      const wrongAdmin = await request('/api/auth/admin/login', {
        method: 'POST',
        body: { email: 'not-admin@example.com' },
      });
      assert.equal(wrongAdmin.status, 401);
    });

    await t.test('catalog stock and inventory shapes', async () => {
      const inventory = await request('/api/admin/inventory', { token: adminToken });
      assert.equal(inventory.status, 200);
      assert.equal(inventory.data.items.length, 27);
      assert.ok(inventory.data.lowStockCount >= 2);
      const lowItem = inventory.data.items.find((item) => item.slug === 'whole-wheat');
      assert.equal(lowItem.isLowStock, true);
    });

    await t.test('preset order creation, mock payment and stock reservation', async () => {
      const before = await request('/api/admin/inventory', { token: adminToken });
      const beforeBySlug = new Map(before.data.items.map((item) => [item.slug, item.stock]));

      const created = await request('/api/orders', {
        method: 'POST',
        token: userToken,
        body: {
          items: [{ kind: 'preset', pizzaSlug: 'classic-margherita', size: 'medium', quantity: 1 }],
          deliveryAddress: address,
        },
      });
      assert.equal(created.status, 201);
      assert.equal(created.data.payment.mode, 'mock');
      assert.equal(created.data.order.status, 'payment_pending');
      assert.ok(created.data.order.pricing.total > 0);
      presetOrder = created.data.order;

      const invalid = await request('/api/orders', {
        method: 'POST',
        token: userToken,
        body: {
          items: [{ kind: 'preset', pizzaSlug: 'classic-margherita', size: 'gigantic', quantity: 1 }],
          deliveryAddress: address,
        },
      });
      assert.equal(invalid.status, 422);

      const paid = await request('/api/payments/mock/confirm', {
        method: 'POST',
        token: userToken,
        body: { orderId: presetOrder.id },
      });
      assert.equal(paid.status, 200);
      assert.equal(paid.data.order.status, 'received');
      assert.equal(paid.data.order.payment.status, 'paid');

      const after = await request('/api/admin/inventory', { token: adminToken });
      const afterBySlug = new Map(after.data.items.map((item) => [item.slug, item.stock]));
      for (const slug of ['classic-hand-tossed', 'classic-tomato', 'mozzarella', 'fresh-basil']) {
        assert.equal(afterBySlug.get(slug), beforeBySlug.get(slug) - 1, `${slug} should drop by 1`);
      }

      const mine = await request(`/api/orders/${presetOrder.id}`, { token: userToken });
      assert.equal(mine.status, 200);
      assert.equal(mine.data.order.payment.status, 'paid');
    });

    await t.test('order ownership is enforced', async () => {
      const forbidden = await request(`/api/orders/${presetOrder.id}`, { token: userTwoToken });
      assert.equal(forbidden.status, 404);
      assert.equal(forbidden.data.code, 'ORDER_NOT_FOUND');
    });

    await t.test('admin stats, order search and status flow', async () => {
      const stats = await request('/api/admin/stats', { token: adminToken });
      assert.equal(stats.status, 200);
      assert.ok(stats.data.stats.revenue >= presetOrder.pricing.total);
      assert.ok(stats.data.stats.totalOrders >= 1);
      assert.ok(Array.isArray(stats.data.weekly) && stats.data.weekly.length === 7);
      assert.ok(Array.isArray(stats.data.recentOrders));

      const search = await request(
        `/api/admin/orders?search=${encodeURIComponent(presetOrder.orderNumber)}`,
        { token: adminToken }
      );
      assert.equal(search.status, 200);
      assert.equal(search.data.orders.length, 1);
      assert.equal(search.data.orders[0].id, presetOrder.id);
      assert.ok(search.data.orders[0].allowedStatuses.includes('in_kitchen'));

      const transitions = ['in_kitchen', 'out_for_delivery', 'delivered'];
      for (const status of transitions) {
        const updated = await request(`/api/admin/orders/${presetOrder.id}/status`, {
          method: 'PATCH',
          token: adminToken,
          body: { status, note: `Smoke test moved to ${status}.` },
        });
        assert.equal(updated.status, 200);
        assert.equal(updated.data.order.status, status);
      }

      const lateCancel = await request(`/api/admin/orders/${presetOrder.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'cancelled' },
      });
      assert.equal(lateCancel.status, 409);
      assert.equal(lateCancel.data.code, 'INVALID_TRANSITION');

      const mine = await request(`/api/orders/${presetOrder.id}`, { token: userToken });
      assert.equal(mine.data.order.status, 'delivered');
      assert.ok(mine.data.order.timeline.length >= 4);
    });

    await t.test('custom builder order reserves and restores stock on cancel', async () => {
      const builder = await request('/api/catalog/builder-options');
      const base = builder.data.groups.base[0];
      const sauce = builder.data.groups.sauce[0];
      const cheese = builder.data.groups.cheese[0];
      const veg = builder.data.groups.vegetable[0];

      const before = await request('/api/admin/inventory', { token: adminToken });
      const beforeById = new Map(before.data.items.map((item) => [item.id, item.stock]));

      const created = await request('/api/orders', {
        method: 'POST',
        token: userToken,
        body: {
          items: [
            {
              kind: 'custom',
              baseId: base.id,
              sauceId: sauce.id,
              cheeseId: cheese.id,
              vegetableIds: [veg.id],
              size: 'large',
              quantity: 2,
            },
          ],
          deliveryAddress: address,
        },
      });
      assert.equal(created.status, 201);
      customOrder = created.data.order;
      assert.equal(customOrder.items[0].kind, 'custom');
      assert.equal(customOrder.items[0].quantity, 2);
      assert.ok(customOrder.items[0].custom.base.name);
      assert.equal(customOrder.items[0].custom.base.price, base.price);

      const paid = await request('/api/payments/mock/confirm', {
        method: 'POST',
        token: userToken,
        body: { orderId: customOrder.id },
      });
      assert.equal(paid.status, 200);

      const after = await request('/api/admin/inventory', { token: adminToken });
      const afterById = new Map(after.data.items.map((item) => [item.id, item.stock]));
      for (const id of [base.id, sauce.id, cheese.id, veg.id]) {
        assert.equal(afterById.get(id), beforeById.get(id) - 2, 'custom stock should drop by quantity');
      }

      const cancelled = await request(`/api/admin/orders/${customOrder.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'cancelled', note: 'Smoke test cancellation.' },
      });
      assert.equal(cancelled.status, 200);
      assert.equal(cancelled.data.order.status, 'cancelled');

      const restored = await request('/api/admin/inventory', { token: adminToken });
      const restoredById = new Map(restored.data.items.map((item) => [item.id, item.stock]));
      for (const id of [base.id, sauce.id, cheese.id, veg.id]) {
        assert.equal(restoredById.get(id), beforeById.get(id), 'cancel should restore stock');
      }
    });

    await t.test('out-of-stock payment fails without reserving partial stock', async () => {
      const inventory = await request('/api/admin/inventory', { token: adminToken });
      const mozzarella = inventory.data.items.find((item) => item.slug === 'mozzarella');
      const originalStock = mozzarella.stock;

      const zeroed = await request(`/api/admin/inventory/${mozzarella.id}`, {
        method: 'PATCH',
        token: adminToken,
        body: { stock: 0 },
      });
      assert.equal(zeroed.status, 200);

      const created = await request('/api/orders', {
        method: 'POST',
        token: userToken,
        body: {
          items: [{ kind: 'preset', pizzaSlug: 'classic-margherita', size: 'medium', quantity: 1 }],
          deliveryAddress: address,
        },
      });
      assert.equal(created.status, 201);

      const failed = await request('/api/payments/mock/confirm', {
        method: 'POST',
        token: userToken,
        body: { orderId: created.data.order.id },
      });
      assert.equal(failed.status, 409);
      assert.equal(failed.data.code, 'OUT_OF_STOCK');

      const stillPending = await request(`/api/orders/${created.data.order.id}`, { token: userToken });
      assert.equal(stillPending.data.order.status, 'payment_pending');

      const restored = await request(`/api/admin/inventory/${mozzarella.id}`, {
        method: 'PATCH',
        token: adminToken,
        body: { stock: originalStock },
      });
      assert.equal(restored.status, 200);
      assert.equal(restored.data.item.stock, originalStock);
    });

    await t.test('inventory create, adjust and duplicate guards', async () => {
      const created = await request('/api/admin/inventory', {
        method: 'POST',
        token: adminToken,
        body: {
          category: 'vegetable',
          name: 'Smoke Test Herb',
          price: 35,
          stock: 40,
          lowStockThreshold: 5,
        },
      });
      assert.equal(created.status, 201);
      assert.equal(created.data.item.slug, 'smoke-test-herb');

      const duplicate = await request('/api/admin/inventory', {
        method: 'POST',
        token: adminToken,
        body: {
          category: 'vegetable',
          name: 'Smoke Test Herb',
          price: 35,
          stock: 40,
        },
      });
      assert.equal(duplicate.status, 409);
      assert.equal(duplicate.data.code, 'DUPLICATE_SLUG');

      const adjusted = await request(`/api/admin/inventory/${created.data.item.id}`, {
        method: 'PATCH',
        token: adminToken,
        body: { adjustBy: -4 },
      });
      assert.equal(adjusted.status, 200);
      assert.equal(adjusted.data.item.stock, 36);

      const conflicting = await request(`/api/admin/inventory/${created.data.item.id}`, {
        method: 'PATCH',
        token: adminToken,
        body: { stock: 10, adjustBy: 2 },
      });
      assert.equal(conflicting.status, 422);
      assert.equal(conflicting.data.code, 'CONFLICTING_STOCK_UPDATE');
    });

    await t.test('low stock alert check and history', async () => {
      const check = await request('/api/admin/alerts/check', {
        method: 'POST',
        token: adminToken,
        body: { force: true },
      });
      assert.equal(check.status, 200);
      assert.ok(Array.isArray(check.data.lowItems));
      assert.ok(check.data.lowItems.length >= 2);
      assert.equal(check.data.sent, true);
      assert.equal(check.data.status, 'outbox');

      const history = await request('/api/admin/alerts', { token: adminToken });
      assert.equal(history.status, 200);
      assert.ok(history.data.alerts.length >= 1);
      assert.ok(history.data.alerts.some((alert) => alert.status === 'outbox'));

      const outboxFiles = fs.readdirSync(path.join(root, 'server', 'logs', 'outbox'));
      assert.ok(outboxFiles.length >= 1);
    });

    await t.test('forgot and reset password flow', async () => {
      const forgot = await request('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: 'smoke.user@example.com' },
      });
      assert.equal(forgot.status, 200);
      assert.ok(forgot.data.devResetUrl);

      const resetToken = tokenFromUrl(forgot.data.devResetUrl);
      const reset = await request('/api/auth/reset-password', {
        method: 'POST',
        body: { token: resetToken, password: 'NewPizzaPass456' },
      });
      assert.equal(reset.status, 200);
      assert.equal(reset.data.user.isVerified, true);

      const oldLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'smoke.user@example.com', password: 'PizzaSlice123' },
      });
      assert.equal(oldLogin.status, 401);

      const newLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'smoke.user@example.com', password: 'NewPizzaPass456' },
      });
      assert.equal(newLogin.status, 200);
      userToken = newLogin.data.token;

      const orders = await request('/api/orders', { token: userToken });
      assert.equal(orders.status, 200);
      assert.ok(orders.data.orders.length >= 3);
    });
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (disconnectDatabase) {
      await disconnectDatabase().catch(() => {});
    }
    if (mongod && !mongod.killed) {
      mongod.kill();
      const exited = await Promise.race([
        new Promise((resolve) => mongod.once('exit', () => resolve(true))),
        wait(8000).then(() => false),
      ]);
      if (!exited) {
        spawnSync('taskkill', ['/PID', String(mongod.pid), '/T', '/F']);
      }
    }
    if (process.env.SMOKE_DEBUG) {
      console.log(mongodOutput);
    }
  }
});
