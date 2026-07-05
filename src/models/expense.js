// In-memory storage (acts like a simple database)
let expenses = [];
let nextId = 1;

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Other'];

class Expense {
  constructor(title, amount, category) {
    this.id = nextId++;
    this.title = title;
    this.amount = amount;
    this.category = category;
    this.createdAt = new Date().toISOString();
  }
}

function getAll() {
  return expenses;
}

function getById(id) {
  return expenses.find((e) => e.id === parseInt(id));
}

function add(title, amount, category) {
  const expense = new Expense(title, amount, category);
  expenses.push(expense);
  return expense;
}

function update(id, { title, amount, category }) {
  const expense = getById(id);
  if (!expense) return null;
  if (title !== undefined) expense.title = title;
  if (amount !== undefined) expense.amount = amount;
  if (category !== undefined && CATEGORIES.includes(category)) expense.category = category;
  return expense;
}

function remove(id) {
  const index = expenses.findIndex((e) => e.id === parseInt(id));
  if (index === -1) return false;
  expenses.splice(index, 1);
  return true;
}

function summary() {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = CATEGORIES.map((cat) => ({
    category: cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  }));
  return { total, count: expenses.length, byCategory };
}

// Reset (used in tests)
function reset() {
  expenses = [];
  nextId = 1;
}

module.exports = { getAll, getById, add, update, remove, summary, reset, CATEGORIES };
