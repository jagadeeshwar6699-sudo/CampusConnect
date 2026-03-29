const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token provided' });

  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = { authMiddleware, signToken };
```

---

**`.env`** (never pushed to GitHub)
```
JWT_SECRET=rvrjcce-campus-secret-2025
PORT=3000
```

---

**`.env.example`** (safe to push)
```
JWT_SECRET=your_secret_here
PORT=3000