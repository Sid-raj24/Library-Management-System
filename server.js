// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const bookRoutes = require('./src/routes/bookRoutes');
const issueRoutes = require('./src/routes/issueRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static HTML/CSS/JS files
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth' , authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// const guardPage = (requiredRole) => {
//   return (req, res, next) => {
//     next();
//   }
// }