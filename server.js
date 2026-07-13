const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache control headers — archivos de código SIEMPRE frescos
app.use((req, res, next) => {
  if (req.url.match(/\.(css|js|html)$/) || req.url === '/') {
    // JS, CSS, HTML: siempre revalidar con el servidor (no servir versión vieja)
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  } else if (req.url.match(/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|wav|mp3)$/)) {
    // Imágenes, fuentes y audio: cachear 1 hora (no cambian seguido)
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route: serve index.html for SPA-like behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌙 Sistema Discoteca corriendo en http://localhost:${PORT}`);
});