process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../index.js';
import { prisma } from '../lib/prisma.js';

let serverInstance;
let PORT = 3009;
let BASE_URL = `http://localhost:${PORT}`;

let adminToken;
let restaurantId;
let categoryId;
let menuItemId;
let createdOrderId;

// Second restaurant for tenant isolation testing
let secondAdminToken;
let secondRestaurantId;

test.before(async () => {
  return new Promise((resolve) => {
    serverInstance = app.listen(PORT, () => {
      resolve();
    });
  });
});

test.after(async () => {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
  await prisma.$disconnect();
});

test.describe('1. Authentication Tests', () => {
  test('POST /api/auth/login with valid credentials should return token and user info', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@brewandbean.com',
        password: 'admin123',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.token);
    assert.equal(data.data.user.email, 'admin@brewandbean.com');

    adminToken = data.data.token;
    restaurantId = data.data.user.restaurants[0].restaurantId;
  });

  test('POST /api/auth/login with invalid credentials should fail', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@brewandbean.com',
        password: 'wrongpassword',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
  });
});

test.describe('2. Public Restaurant & Menu Retrieval Tests', () => {
  test('GET /api/restaurants/brew-and-bean/menu should return cafe info, categories, and items', async () => {
    const res = await fetch(`${BASE_URL}/api/restaurants/brew-and-bean/menu`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.restaurant.slug, 'brew-and-bean');
    assert.ok(Array.isArray(data.data.categories));
    assert.ok(data.data.categories.length > 0);

    const firstCat = data.data.categories[0];
    categoryId = firstCat.id;
    menuItemId = firstCat.menuItems[0].id;
  });

  test('GET /api/restaurants/brew-and-bean/table/1 should return table details', async () => {
    const res = await fetch(`${BASE_URL}/api/restaurants/brew-and-bean/table/1`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.table.tableNumber, '1');
  });

  test('GET /api/restaurants/non-existent-slug/menu should return 404', async () => {
    const res = await fetch(`${BASE_URL}/api/restaurants/non-existent-slug/menu`);
    const data = await res.json();

    assert.equal(res.status, 404);
    assert.equal(data.success, false);
  });
});

test.describe('3. Order Placement & Validation Tests', () => {
  test('POST /api/orders should successfully place an order', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantSlug: 'brew-and-bean',
        tableNumber: '1',
        items: [
          { menuItemId, quantity: 2, note: 'Extra hot' }
        ],
        customerNote: 'Fast service please',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.orderNumber);
    assert.equal(data.data.status, 'NEW');
    assert.equal(data.data.items.length, 1);
    assert.equal(data.data.items[0].quantity, 2);

    createdOrderId = data.data.orderId;
  });

  test('POST /api/orders with empty items array should fail validation', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantSlug: 'brew-and-bean',
        tableNumber: '1',
        items: [],
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
  });

  test('POST /api/orders with non-existent menuItemId should fail', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantSlug: 'brew-and-bean',
        tableNumber: '1',
        items: [
          { menuItemId: 'invalid-id-999', quantity: 1 }
        ],
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
  });
});

test.describe('4. Kitchen & Order Status Lifecycle Tests', () => {
  test('GET /api/kitchen/orders should return live orders', async () => {
    const res = await fetch(`${BASE_URL}/api/kitchen/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  test('PATCH /api/kitchen/orders/:id/status should update status to ACCEPTED then PREPARING then READY then COMPLETED', async () => {
    const statuses = ['ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];

    for (const status of statuses) {
      const res = await fetch(`${BASE_URL}/api/kitchen/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.status, status);
    }
  });
});

test.describe('5. Tenant Isolation Tests', () => {
  test('Setup: Create second restaurant and user', async () => {
    const secondCafe = await prisma.restaurant.upsert({
      where: { slug: 'cafe-mocha' },
      update: {},
      create: {
        name: 'Café Mocha',
        slug: 'cafe-mocha',
        description: 'Second test cafe',
        currency: '₹',
      },
    });
    secondRestaurantId = secondCafe.id;

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash('mocha123', 10);

    const secondUser = await prisma.user.upsert({
      where: { email: 'admin@cafemocha.com' },
      update: { passwordHash },
      create: {
        name: 'Mocha Admin',
        email: 'admin@cafemocha.com',
        passwordHash,
        role: 'ADMIN',
      },
    });

    await prisma.restaurantUser.upsert({
      where: {
        restaurantId_userId: {
          restaurantId: secondRestaurantId,
          userId: secondUser.id,
        },
      },
      update: {},
      create: {
        restaurantId: secondRestaurantId,
        userId: secondUser.id,
        role: 'ADMIN',
      },
    });

    // Login as second admin
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cafemocha.com',
        password: 'mocha123',
      }),
    });
    const loginData = await loginRes.json();
    assert.equal(loginRes.status, 200);
    secondAdminToken = loginData.data.token;
  });

  test('Tenant Isolation: Cafe Mocha admin cannot view Brew & Bean orders', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${secondAdminToken}` },
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    // Cafe Mocha has 0 orders
    assert.equal(data.data.length, 0);
  });

  test('Tenant Isolation: Cafe Mocha admin cannot update Brew & Bean order status', async () => {
    const res = await fetch(`${BASE_URL}/api/kitchen/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secondAdminToken}`,
      },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });

    const data = await res.json();
    assert.equal(res.status, 404);
    assert.equal(data.success, false);
  });

  test('Tenant Isolation: Cafe Mocha admin cannot delete Brew & Bean menu items', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/menu/${menuItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${secondAdminToken}` },
    });

    const data = await res.json();
    assert.equal(res.status, 404);
    assert.equal(data.success, false);
  });
});
