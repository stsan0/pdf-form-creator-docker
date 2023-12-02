// server.js

const express = require('express');
const path = require('path'); // for path join

const app = express();
const port = 3000;

// Serve static files from public and node_modules directories
app.use(express.static('public'));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// ... other server configurations

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
