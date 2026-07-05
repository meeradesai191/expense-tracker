const request = require('supertest');
const app = require('../src/app');
const Expense = require('../src/models/expense');
const Budget = require('../src/models/budget');

beforeEach(() => {
  Expense.reset();
  Budget.reset();
});

// ── TEST 1: Empty list at start ───────────────────────────────────
test('GET /api/expenses → returns empty array at start', async () => {
  const res = await request(app).get('/api/expenses');
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data).toEqual([]);
});

// ── TEST 2: Add a new expense ─────────────────────────────────────
test('POST /api/expenses → adds a new expense', async () => {
  const res = await request(app)
    .post('/api/expenses')
    .send({ title: 'Lunch', amount: 150, category: 'Food' });

  expect(res.statusCode).toBe(201);
  expect(res.body.success).toBe(true);
  expect(res.body.data.title).toBe('Lunch');
  expect(res.body.data.amount).toBe(150);
  expect(res.body.data.category).toBe('Food');
});

// ── TEST 3: Reject missing title ──────────────────────────────────
test('POST /api/expenses → fails if title is empty', async () => {
  const res = await request(app)
    .post('/api/expenses')
    .send({ title: '', amount: 100, category: 'Food' });

  expect(res.statusCode).toBe(400);
  expect(res.body.success).toBe(false);
});

// ── TEST 4: Reject invalid amount ─────────────────────────────────
test('POST /api/expenses → fails if amount is not positive', async () => {
  const res = await request(app)
    .post('/api/expenses')
    .send({ title: 'Snacks', amount: -20, category: 'Food' });

  expect(res.statusCode).toBe(400);
  expect(res.body.success).toBe(false);
});

// ── TEST 5: Unknown category defaults to Other ────────────────────
test('POST /api/expenses → unknown category falls back to Other', async () => {
  const res = await request(app)
    .post('/api/expenses')
    .send({ title: 'Misc', amount: 50, category: 'NotARealCategory' });

  expect(res.statusCode).toBe(201);
  expect(res.body.data.category).toBe('Other');
});

// ── TEST 6: Delete an expense ─────────────────────────────────────
test('DELETE /api/expenses/:id → deletes the expense', async () => {
  const addRes = await request(app)
    .post('/api/expenses')
    .send({ title: 'Bus ticket', amount: 30, category: 'Travel' });

  const id = addRes.body.data.id;
  const res = await request(app).delete(`/api/expenses/${id}`);
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);

  const listRes = await request(app).get('/api/expenses');
  expect(listRes.body.data.length).toBe(0);
});

// ── TEST 7: Delete non-existent expense ───────────────────────────
test('DELETE /api/expenses/999 → returns 404', async () => {
  const res = await request(app).delete('/api/expenses/999');
  expect(res.statusCode).toBe(404);
});

// ── TEST 8: Summary totals and category breakdown ─────────────────
test('GET /api/expenses/summary → returns correct totals', async () => {
  await request(app).post('/api/expenses').send({ title: 'Groceries', amount: 200, category: 'Food' });
  await request(app).post('/api/expenses').send({ title: 'Movie', amount: 300, category: 'Shopping' });

  const res = await request(app).get('/api/expenses/summary');
  expect(res.statusCode).toBe(200);
  expect(res.body.data.total).toBe(500);
  expect(res.body.data.count).toBe(2);

  const food = res.body.data.byCategory.find((c) => c.category === 'Food');
  expect(food.total).toBe(200);
});

// ── TEST 9: Edit an expense ────────────────────────────────────────
test('PUT /api/expenses/:id → edits title, amount and category', async () => {
  const addRes = await request(app)
    .post('/api/expenses')
    .send({ title: 'Coffee', amount: 40, category: 'Food' });

  const id = addRes.body.data.id;
  const res = await request(app)
    .put(`/api/expenses/${id}`)
    .send({ title: 'Coffee & snacks', amount: 80, category: 'Other' });

  expect(res.statusCode).toBe(200);
  expect(res.body.data.title).toBe('Coffee & snacks');
  expect(res.body.data.amount).toBe(80);
  expect(res.body.data.category).toBe('Other');
});

// ── TEST 10: Edit non-existent expense ────────────────────────────
test('PUT /api/expenses/999 → returns 404', async () => {
  const res = await request(app).put('/api/expenses/999').send({ title: 'x' });
  expect(res.statusCode).toBe(404);
});

// ── TEST 11: Filter by category and search by title ──────────────
test('GET /api/expenses?category=&search= → filters correctly', async () => {
  await request(app).post('/api/expenses').send({ title: 'Pizza', amount: 300, category: 'Food' });
  await request(app).post('/api/expenses').send({ title: 'Bus pass', amount: 100, category: 'Travel' });

  const catRes = await request(app).get('/api/expenses?category=Food');
  expect(catRes.body.data.length).toBe(1);
  expect(catRes.body.data[0].title).toBe('Pizza');

  const searchRes = await request(app).get('/api/expenses?search=bus');
  expect(searchRes.body.data.length).toBe(1);
  expect(searchRes.body.data[0].title).toBe('Bus pass');
});

// ── TEST 12: Sort by highest amount ───────────────────────────────
test('GET /api/expenses?sort=highest → sorts by amount descending', async () => {
  await request(app).post('/api/expenses').send({ title: 'A', amount: 50, category: 'Food' });
  await request(app).post('/api/expenses').send({ title: 'B', amount: 500, category: 'Food' });

  const res = await request(app).get('/api/expenses?sort=highest');
  expect(res.body.data[0].title).toBe('B');
});

// ── TEST 13: Set and read monthly budget ──────────────────────────
test('POST /api/expenses/budget → updates the monthly budget', async () => {
  const res = await request(app).post('/api/expenses/budget').send({ budget: 8000 });
  expect(res.statusCode).toBe(200);
  expect(res.body.data.budget).toBe(8000);

  const getRes = await request(app).get('/api/expenses/budget');
  expect(getRes.body.data.budget).toBe(8000);
});

// ── TEST 14: Summary reports over-budget correctly ────────────────
test('GET /api/expenses/summary → flags over-budget spending', async () => {
  await request(app).post('/api/expenses/budget').send({ budget: 100 });
  await request(app).post('/api/expenses').send({ title: 'Big purchase', amount: 500, category: 'Shopping' });

  const res = await request(app).get('/api/expenses/summary');
  expect(res.body.data.overBudget).toBe(true);
});

// ── TEST 15: CSV export ────────────────────────────────────────────
test('GET /api/expenses/export → returns a CSV file', async () => {
  await request(app).post('/api/expenses').send({ title: 'Notebook', amount: 60, category: 'Other' });

  const res = await request(app).get('/api/expenses/export');
  expect(res.statusCode).toBe(200);
  expect(res.headers['content-type']).toContain('text/csv');
  expect(res.text).toContain('Notebook');
});

// ── TEST 16: Health check endpoint ──────────────────────────────────
test('GET /health → returns ok status', async () => {
  const res = await request(app).get('/health');
  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe('ok');
});

// ── TEST 17: Build/deploy metadata endpoint ────────────────────────
test('GET /api/meta → returns app version and environment info', async () => {
  const res = await request(app).get('/api/meta');
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data).toHaveProperty('version');
  expect(res.body.data).toHaveProperty('commit');
  expect(res.body.data).toHaveProperty('nodeVersion');
});
