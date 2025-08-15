import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// In-memory store for demo
const db = {
  users: [{ id: 1, email: 'demo@user.com', password: 'demo' }],
  txns: [
    { id: 1, userId: 1, amount: 55.20, category: 'Food', date: '2025-06-01' },
    { id: 2, userId: 1, amount: 120.00, category: 'Transport', date: '2025-06-03' },
    { id: 3, userId: 1, amount: 40.99, category: 'Food', date: '2025-06-05' }
  ]
};

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// CRUD for transactions
app.get('/transactions', auth, (req, res) => {
  const list = db.txns.filter(t => t.userId === req.user.id);
  res.json(list);
});

app.post('/transactions', auth, (req, res) => {
  const { amount, category, date } = req.body;
  const id = db.txns.length ? Math.max(...db.txns.map(t => t.id)) + 1 : 1;
  const txn = { id, userId: req.user.id, amount: Number(amount), category, date };
  db.txns.push(txn);
  res.status(201).json(txn);
});

app.delete('/transactions/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const idx = db.txns.findIndex(t => t.id === id && t.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = db.txns.splice(idx, 1);
  res.json(removed);
});

// Simple "AI" endpoint (rule-based) for demo
app.get('/insights', auth, (req, res) => {
  const list = db.txns.filter(t => t.userId === req.user.id);
  const byCat = {};
  list.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  const top = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  const tip = top ? `Consider reducing spending in "${top[0]}" to improve savings.` : 'Add transactions to get insights.';
  res.json({ byCategory: byCat, tip });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Finance backend running on http://localhost:${PORT}`));
