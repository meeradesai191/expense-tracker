const express = require('express');
const path = require('path');
const expenseRoutes = require('./routes/expenses');
const pkg = require('../package.json');

const app = express();
const PORT = process.env.PORT || 3000;
const START_TIME = Date.now();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/expenses', expenseRoutes);

// Health check — used by Docker/Render to confirm the container is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000) });
});

// Build/deploy metadata — values are injected by the CI/CD pipeline at
// Docker build time (see Dockerfile ARG/ENV and .github/workflows/ci.yml)
app.get('/api/meta', (req, res) => {
  res.json({
    success: true,
    data: {
      appName: pkg.name,
      version: pkg.version,
      commit: process.env.GIT_COMMIT || 'local-dev',
      buildTime: process.env.BUILD_TIME || 'not built (running locally)',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
    },
  });
});

// Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/home.html'));
});

app.get('/expenses', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/expenses.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/about.html'));
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
