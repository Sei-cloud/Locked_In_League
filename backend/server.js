require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const teamsRouter = require('./routes/teamRoutes'); // adjust path
const gameRoutes = require('./routes/games');


const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/teams', teamsRouter);
app.use('/api/games', gameRoutes);

// Serve frontend (plain HTML/JS/CSS)
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch-all to serve index.html for SPA routing
app.get(/^\/.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});


// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI missing in env - aborting');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Mongo connection error', err);
    process.exit(1);
  });
