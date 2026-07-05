// In-memory monthly budget setting
let monthlyBudget = 5000;

function get() {
  return monthlyBudget;
}

function set(amount) {
  monthlyBudget = amount;
  return monthlyBudget;
}

function reset() {
  monthlyBudget = 5000;
}

module.exports = { get, set, reset };
