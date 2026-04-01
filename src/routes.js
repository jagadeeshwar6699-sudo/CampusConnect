const express = require('express');
const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { authMiddleware, signToken } = require('./auth');
const { MongoClient } = require('mongodb');

const router = express.Router();

function ini(name) { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(); }
const COLORS = ['#003399','#7c3aed','#c0392b','#c48a00','#16a34a','#0891b2','#ea580c','#db2777'];
function strColor(s) { let h=0; for (const c of s) h=(h*31+c.charCodeAt(0))&0xffffffff; return COLORS[Math.abs(h)%COLORS.length]; }
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h/24);
  if (d < 7)  return `${d}d ago`;
  return `${Math.floor(d/7)}w ago`;
}
function uidFromReq(req) {
  try {
    const t = (req.headers['authorization']||'').split(' ')[1];
    return require('jsonwebtoken').verify(t, process.env.JWT_SECRET||'rvrjcce-campus-secret-2025').id;
  } catch { return null; }
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, dept } = req.body;
    if (!name||!email||!password) return res.status(400).json({ error:'Name, email and password are required.' });
    if (password.length < 6)      return res.status(400).json({ error:'Password must be at least 6 characters.' });
    if (await db.getUserByEmail(email)) return res.status(409).json({ error:'An account with this email already exists.' });
    const id    = uuidv4();
    const color = strColor(name);
    const user  = { id, name, email, password: bcrypt.hashSync(password,10), dept:dept||'', color, created_at: new Date().toISOString() };
    await db.addUser(user);
    const safe = { id, name, email, dept:dept||'', color, ini:ini(name) };
    res.json({ token: signToken(safe), user: safe });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email||!password) return res.status(400).json({ error:'Email and password are required.' });
    const row = await db.getUserByEmail(email);
    if (!row || !bcrypt.compareSync(password, row.password))
      return res.status(401).json({ error:'Invalid email or password.' });
    const safe = { id:row.id, name:row.name, email:row.email, dept:row.dept, color:row.color, ini:ini(row.name) };
    res.json({ token: signToken(safe), user: safe });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const row = await db.getUserById(req.user.id);
    if (!row) return res.status(404).json({ error:'User not found' });
    res.json({ id:row.id, name:row.name, email:row.email, dept:row.dept, color:row.color, ini:ini(row.name) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', async (req, res) => {
  try { res.json(await db.stats()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── POSTS ────────────────────────────────────────────────────────────────────

router.get('/posts', async (req, res) => {
  try {
    const uid   = uidFromReq(req);
    const posts = await db.getPosts(req.query.cat);
    const result = await Promise.all(posts.map(async p => {
      const author = await db.getUserById(p.author_id);
      const likes  = await db.getLikes(p.id);
      return {
        id:p.id, author:author?.name||'Unknown', ini:ini(author?.name||'?'), col:author?.color||'#64748b',
        cat:p.category, text:p.text, likes, comments:0,
        time:timeAgo(p.created_at), uid:p.author_id, isOwn:p.author_id===uid
      };
    }));
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/posts', authMiddleware, async (req, res) => {
  try {
    const { text, category } = req.body;
    if (!text?.trim()) return res.status(400).json({ error:'Text is required.' });
    const post = { id:uuidv4(), author_id:req.user.id, category:category||'general', text:text.trim(), created_at:new Date().toISOString() };
    await db.addPost(post);
    const user = await db.getUserById(req.user.id);
    res.json({ id:post.id, author:user.name, ini:ini(user.name), col:user.color, cat:post.category, text:post.text, likes:[], comments:0, time:'just now', uid:req.user.id, isOwn:true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const liked = await db.toggleLike(req.params.id, req.user.id);
    const count = (await db.getLikes(req.params.id)).length;
    res.json({ liked, count });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await db.getPostById(req.params.id);
    if (!post)                          return res.status(404).json({ error:'Not found' });
    if (post.author_id !== req.user.id) return res.status(403).json({ error:'Forbidden' });
    await db.deletePost(req.params.id);
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── QUESTIONS ────────────────────────────────────────────────────────────────

router.get('/questions', async (req, res) => {
  try {
    const uid = uidFromReq(req);
    let qs = await db.getQuestions();
    if (req.query.tag && req.query.tag !== 'all') qs = qs.filter(q => q.tags.includes(req.query.tag));
    if (req.query.q) { const lq=req.query.q.toLowerCase(); qs = qs.filter(q => q.title.toLowerCase().includes(lq)||q.detail.toLowerCase().includes(lq)); }
    const result = await Promise.all(qs.map(async q => ({
      id:q.id, title:q.title, prev:q.detail||'Click to see full question.',
      tags:q.tags||[], votes:q.votes, ans:0, solved:!!q.solved,
      by:(await db.getUserById(q.author_id))?.name||'Unknown', t:timeAgo(q.created_at),
      uid:q.author_id, isOwn:q.author_id===uid
    })));
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/questions', authMiddleware, async (req, res) => {
  try {
    const { title, detail, tags } = req.body;
    if (!title?.trim()) return res.status(400).json({ error:'Title is required.' });
    const q = { id:uuidv4(), author_id:req.user.id, title:title.trim(), detail:detail||'', tags:tags||['general'], votes:0, solved:false, created_at:new Date().toISOString() };
    await db.addQuestion(q);
    const user = await db.getUserById(req.user.id);
    res.json({ id:q.id, title:q.title, prev:q.detail||'Click to see.', tags:q.tags, votes:0, ans:0, solved:false, by:user?.name, t:'just now', uid:req.user.id, isOwn:true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/questions/:id/vote', authMiddleware, async (req, res) => {
  try {
    const votes = await db.voteQuestion(req.params.id, req.body.dir===-1 ? -1 : 1);
    res.json({ votes });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/questions/:id', authMiddleware, async (req, res) => {
  try {
    const q = await db.getQuestionById(req.params.id);
    if (!q)                           return res.status(404).json({ error:'Not found' });
    if (q.author_id !== req.user.id)  return res.status(403).json({ error:'Forbidden' });
    await db.deleteQuestion(req.params.id);
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── EVENTS ───────────────────────────────────────────────────────────────────

router.get('/events', async (req, res) => {
  try {
    const uid = uidFromReq(req);
    const evs = await db.getEvents(req.query.cat);
    const result = await Promise.all(evs.map(async e => {
      const regs = await db.getRegs(e.id);
      return {
        id:e.id, cat:e.category, emoji:e.emoji, bg:e.bg_color,
        title:e.title, date:e.date_str, venue:e.venue,
        reg_link:e.reg_link||null,
        deadline:e.deadline||null,
        count:regs.length, registered:regs.includes(uid), uid:e.author_id
      };
    }));
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/events', authMiddleware, async (req, res) => {
  try {
    const { title, category, date_str, venue, reg_link, deadline } = req.body;
    if (!title?.trim()||!date_str?.trim()) return res.status(400).json({ error:'Title and date required.' });
    const EMOJIS = { workshop:'📊', hackathon:'💻', cultural:'🎭', sports:'🏅', placement:'🏢', fdp:'🎓', conference:'🔬' };
    const BGS    = { workshop:'#003300', hackathon:'#001a4d', cultural:'#2d0050', sports:'#1a1a00', placement:'#2d1a00', fdp:'#00001a', conference:'#1a0000' };
    const cat    = category||'workshop';
    let link = reg_link?.trim() || null;
    if (link && !link.startsWith('http')) link = 'https://' + link;
    const ev = { id:uuidv4(), author_id:req.user.id, title:title.trim(), category:cat, emoji:EMOJIS[cat]||'📅', date_str:date_str.trim(), venue:venue||'RVRJCCE Campus', bg_color:BGS[cat]||'#001144', reg_link:link, deadline:deadline||null, created_at:new Date().toISOString() };
    await db.addEvent(ev);
    res.json({ id:ev.id, cat, emoji:ev.emoji, bg:ev.bg_color, title:ev.title, date:ev.date_str, venue:ev.venue, reg_link:link, deadline:deadline||null, count:0, registered:false, uid:req.user.id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/events/:id', authMiddleware, async (req, res) => {
  try {
    const { title, category, date_str, venue, reg_link, deadline } = req.body;
    if (!title?.trim()||!date_str?.trim()) return res.status(400).json({ error:'Title and date required.' });
    const EMOJIS = { workshop:'📊', hackathon:'💻', cultural:'🎭', sports:'🏅', placement:'🏢', fdp:'🎓', conference:'🔬' };
    const BGS    = { workshop:'#003300', hackathon:'#001a4d', cultural:'#2d0050', sports:'#1a1a00', placement:'#2d1a00', fdp:'#00001a', conference:'#1a0000' };
    const cat = category||'workshop';
    let link = reg_link?.trim() || null;
    if (link && !link.startsWith('http')) link = 'https://' + link;
    await db.updateEvent(req.params.id, {
      title:title.trim(), category:cat, emoji:EMOJIS[cat]||'📅',
      date_str:date_str.trim(), venue:venue||'RVRJCCE Campus',
      bg_color:BGS[cat]||'#001144', reg_link:link, deadline:deadline||null
    });
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/events/:id', authMiddleware, async (req, res) => {
  try {
    const ev = await db.getEventById(req.params.id);
    if (!ev) return res.status(404).json({ error:'Not found' });
    await db.deleteEvent(req.params.id);
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/events/:id/register', authMiddleware, async (req, res) => {
  try {
    const ev = await db.getEventById(req.params.id);
    if (!ev) return res.status(404).json({ error:'Event not found' });
    if (ev.deadline && new Date() > new Date(ev.deadline)) {
      return res.status(403).json({ error:'Registration deadline has passed for this event.' });
    }
    const registered = await db.toggleReg(req.params.id, req.user.id);
    const count      = (await db.getRegs(req.params.id)).length;
    res.json({ registered, count });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────

router.get('/achievements', async (req, res) => {
  try {
    const uid  = uidFromReq(req);
    const achs = await db.getAchievements();
    const result = await Promise.all(achs.map(async a => {
      const claps = await db.getClaps(a.id);
      return { id:a.id, medal:a.medal, title:a.title, who:a.who_label, body:a.body, claps, clapped:claps.includes(uid), t:timeAgo(a.created_at), uid:a.author_id, isOwn:a.author_id===uid };
    }));
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/achievements', authMiddleware, async (req, res) => {
  try {
    const { title, who_label, body, medal } = req.body;
    if (!title?.trim()||!body?.trim()) return res.status(400).json({ error:'Title and story required.' });
    const a = { id:uuidv4(), author_id:req.user.id, title:title.trim(), who_label:who_label||req.user.name, body:body.trim(), medal:medal||'🥇', created_at:new Date().toISOString() };
    await db.addAchievement(a);
    res.json({ id:a.id, medal:a.medal, title:a.title, who:a.who_label, body:a.body, claps:[], clapped:false, t:'just now', uid:req.user.id, isOwn:true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/achievements/:id/clap', authMiddleware, async (req, res) => {
  try {
    const clapped = await db.toggleClap(req.params.id, req.user.id);
    const count   = (await db.getClaps(req.params.id)).length;
    res.json({ clapped, count });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/achievements/:id', authMiddleware, async (req, res) => {
  try {
    const achs = await db.getAchievements();
    const a = achs.find(x => x.id === req.params.id);
    if (!a)                          return res.status(404).json({ error:'Not found' });
    if (a.author_id !== req.user.id) return res.status(403).json({ error:'Forbidden' });
    await db.deleteAchievement(req.params.id);
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;