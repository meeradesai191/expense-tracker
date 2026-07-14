const express = require('express');
const router = express.Router();
const Expense = require('../models/expense');
const Budget = require('../models/budget');

// GET /api/expenses — get expenses, with optional ?category= &search= &sort=
router.get('/', (req, res) => {
  let list = Expense.getAll();
  const { category, search, sort } = req.query;

  if (category && category !== 'All') {
    list = list.filter((e) => e.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((e) => e.title.toLowerCase().includes(q));
  }

  list = [...list];
  if (sort === 'highest') list.sort((a, b) => b.amount - a.amount);
  else if (sort === 'lowest') list.sort((a, b) => a.amount - b.amount);
  else if (sort === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first (default)

  res.json({ success: true, data: list });
});

// GET /api/expenses/summary — total + category-wise breakdown + budget usage
router.get('/summary', (req, res) => {
  const summary = Expense.summary();
  const budget = Budget.get();
  res.json({
    success: true,
    data: {
      ...summary,
      budget,
      budgetUsedPercent: budget > 0 ? Math.round((summary.total / budget) * 100) : 0,
      overBudget: summary.total > budget,
    },
  });
});

// GET /api/expenses/export — download all expenses as CSV
router.get('/export', (req, res) => {
  const rows = Expense.getAll();
  const header = 'ID,Title,Amount,Category,Date\n';
  const body = rows
    .map((e) => `${e.id},"${e.title.replace(/"/g, '""')}",${e.amount},${e.category},${e.createdAt}`)
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
  res.send(header + body);
});

// GET /api/budget — current monthly budget
router.'/budget', (req, res) => {
  res.json({ success: true, data: { budget: Budget.get() } });
});

// POST /api/budget — update monthly budget
router.post('/budget', (req, res) => {
  const amt = parseFloat(req.body.budget);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ success: false, message: 'Budget must be a positive number' });
  }
  Budget.set(amt);
  res.json({ success: true, data: { budget: Budget.get() } });
});

// POST /api/expenses — add a new expense
router.post('/', (req, res) => {
  const { title, amount, category } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
  }

  const cat = Expense.CATEGORIES.includes(category) ? category : 'Other';
  const expense = Expense.add(title.trim(), amt, cat);
  res.status(201).json({ success: true, data: expense });
});

// PUT /api/expenses/:id — edit an expense
router.put('/:id', (req, res) => {
  const { title, amount, category } = req.body;
  const updates = {};

  if (title !== undefined) {
    if (title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title cannot be empty' });
    }
    updates.title = title.trim();
  }
  if (amount !== undefined) {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }
    updates.amount = amt;
  }
  if (category !== undefined) updates.category = category;

  const expense = Expense.update(req.params.id, updates);
  if (!expense) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }
  res.json({ success: true, data: expense });
});

// DELETE /api/expenses/:id — delete an expense
router.delete('/:id', (req, res) => {
  const deleted = Expense.remove(req.params.id);

  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }

  res.json({ success: true, message: 'Expense deleted successfully' });
});

module.exports = router;
