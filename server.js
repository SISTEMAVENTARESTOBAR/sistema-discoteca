const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache control headers for better performance
app.use((req, res, next) => {
  // Cache static assets for 1 day
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route: serve index.html for SPA-like behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌙 Sistema Discoteca corriendo en http://localhost:${PORT}`);
});
