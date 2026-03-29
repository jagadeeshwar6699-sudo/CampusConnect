require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', routes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ┌─────────────────────────────────────────┐');
  console.log('  │   🎓 RVRJCCE CampusConnect Backend       │');
  console.log(`  │   ✅ Running at http://localhost:${PORT}    │`);
  console.log('  │   📁 Database: campus-data.json          │');
  console.log('  │   Press Ctrl+C to stop                   │');
  console.log('  └─────────────────────────────────────────┘');
  console.log('');
});