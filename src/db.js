// src/db.js  –  JSON file database (pure JS, no build tools needed)
const fs   = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, '..', 'campus-data.json');

// ─── LOAD / SAVE ─────────────────────────────────────────────────────────────
function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('DB load error:', e.message);
  }
  return { users:[], posts:[], post_likes:[], questions:[], events:[], event_regs:[], achievements:[], ach_claps:[] };
}

function save(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('DB save error:', e.message);
  }
}

function ago(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

// ─── SEED DATA ───────────────────────────────────────────────────────────────
function seed(data) {
  if (data.users.length > 0) return data;
  console.log('🌱  Seeding database...');
  const C = ['#003399','#7c3aed','#c0392b','#c48a00','#16a34a','#0891b2'];
  data.users.push(
    { id:'seed_1', name:'Priya S.',   email:'priya@rvrjcce.ac.in',   password:bcrypt.hashSync('password123',10), dept:'CSE 3rd Year',  color:C[0], created_at:ago(7) },
    { id:'seed_2', name:'Rahul K.',   email:'rahul@rvrjcce.ac.in',   password:bcrypt.hashSync('password123',10), dept:'ECE 4th Year',  color:C[3], created_at:ago(6) },
    { id:'seed_3', name:'Ananya M.',  email:'ananya@rvrjcce.ac.in',  password:bcrypt.hashSync('password123',10), dept:'CSE 3rd Year',  color:C[1], created_at:ago(5) },
    { id:'seed_4', name:'Vikram T.',  email:'vikram@rvrjcce.ac.in',  password:bcrypt.hashSync('password123',10), dept:'MECH 2nd Year', color:C[4], created_at:ago(4) },
    { id:'seed_5', name:'Karthik N.', email:'karthik@rvrjcce.ac.in', password:bcrypt.hashSync('password123',10), dept:'CSE 4th Year',  color:C[0], created_at:ago(3) }
  );
  data.posts.push(
    { id:'p1', author_id:'seed_1', category:'academics', text:'Anyone has notes for Data Structures Unit 3? Exam next week — missed two classes 🙏', created_at:ago(2) },
    { id:'p2', author_id:'seed_2', category:'career',    text:'TCS is coming to campus next month! Practice aptitude on IndiaBix and DSA on LeetCode.', created_at:ago(1) },
    { id:'p3', author_id:'seed_3', category:'tech',      text:'Built my portfolio with React + Tailwind. Deployed free on Vercel. Happy to review yours!', created_at:ago(0.5) },
    { id:'p4', author_id:'seed_4', category:'general',   text:'Reading room near CSE block is open till 9pm now. Great for late-night prep 📚', created_at:ago(0.2) }
  );
  data.questions.push(
    { id:'q1', author_id:'seed_1', title:'How to prepare for TCS NQT?',                    detail:'2 months left. Which topics for coding?',               tags:['placement','aptitude'], votes:14, solved:true,  created_at:ago(3)   },
    { id:'q2', author_id:'seed_2', title:'Best projects for internship resume — 2nd year?', detail:'What projects get noticed by recruiters?',              tags:['internship','projects'],votes:22, solved:true,  created_at:ago(2)   },
    { id:'q3', author_id:'seed_3', title:'How to score well in DBMS practicals?',           detail:'Not clear on normalization and SQL joins.',             tags:['academics','dbms'],    votes:9,  solved:false, created_at:ago(0.1) },
    { id:'q4', author_id:'seed_4', title:'Free Machine Learning resources?',                detail:'YouTube or Coursera? What actually works from scratch?',tags:['academics','python'],  votes:18, solved:true,  created_at:ago(5)   }
  );
  data.events.push(
    { id:'e1', author_id:'seed_5', title:'Hackathon 4.0 – 2025',               category:'hackathon', emoji:'💻', date_str:'March 22–23 | 9:00AM', venue:'RVRJCCE Main Campus',        bg_color:'#001a4d', reg_link:null, created_at:ago(10) },
    { id:'e2', author_id:'seed_2', title:'Rujangna Annual Cultural Fest 2025',  category:'cultural',  emoji:'🎭', date_str:'April 5–7 | All Day',   venue:'RVRJCCE College Ground',     bg_color:'#2d0050', reg_link:null, created_at:ago(9)  },
    { id:'e3', author_id:'seed_3', title:'Data Science & ML Workshop',          category:'workshop',  emoji:'📊', date_str:'March 28 | 9:00AM',    venue:'CS Seminar Hall',             bg_color:'#003300', reg_link:null, created_at:ago(8)  },
    { id:'e4', author_id:'seed_5', title:'TCS Campus Placement Drive',          category:'placement', emoji:'🏢', date_str:'April 2 | 8:00AM',     venue:'Placement Cell, Admin Block', bg_color:'#2d1a00', reg_link:null, created_at:ago(7)  },
    { id:'e5', author_id:'seed_4', title:'Inter-Department Cricket Tournament', category:'sports',    emoji:'🏏', date_str:'April 12 | 8:00AM',    venue:'RVRJCCE Sports Ground',       bg_color:'#1a1a00', reg_link:null, created_at:ago(6)  },
    { id:'e6', author_id:'seed_1', title:'FDP on AI & Deep Learning',           category:'fdp',       emoji:'🎓', date_str:'March 25–29 | 10:00AM',venue:'ECE Seminar Hall',             bg_color:'#00001a', reg_link:null, created_at:ago(5)  }
  );
  data.achievements.push(
    { id:'a1', author_id:'seed_5', title:'Placed at TCS – ₹7 LPA',           who_label:'Karthik N. · CSE 4th Year · 2024 Batch',            body:'IndiaBix + LeetCode + mock interviews = TCS offer. Happy to guide!',                             medal:'🥇', created_at:ago(3)  },
    { id:'a2', author_id:'seed_3', title:'1st Place – Smart India Hackathon', who_label:'Team Nexus (Ananya, Rahul, Priya) · CSE 3rd Year',  body:'Won SIH 2024 with AI crop disease detection now piloted in 3 AP villages!',                       medal:'🏆', created_at:ago(7)  },
    { id:'a3', author_id:'seed_4', title:'GATE 2025 – AIR 412',              who_label:'Vikram T. · ME 4th Year',                           body:'Standard textbooks + 10 years previous papers = AIR 412 in GATE 2025 Mechanical.',                 medal:'🎯', created_at:ago(14) }
  );
  save(data);
  console.log('✅  Done! Test login: priya@rvrjcce.ac.in / password123');
  return data;
}

// ─── DB OBJECT ───────────────────────────────────────────────────────────────
let _d = seed(load());

const db = {
  // users
  getUsers()              { return _d.users; },
  getUserById(id)         { return _d.users.find(u => u.id === id) || null; },
  getUserByEmail(e)       { return _d.users.find(u => u.email === e) || null; },
  addUser(u)              { _d.users.push(u); save(_d); },

  // posts
  getPosts(cat)           { return (cat && cat !== 'all') ? _d.posts.filter(p => p.category === cat) : [..._d.posts]; },
  getPostById(id)         { return _d.posts.find(p => p.id === id) || null; },
  addPost(p)              { _d.posts.unshift(p); save(_d); },
  deletePost(id)          { _d.posts = _d.posts.filter(p => p.id !== id); save(_d); },
  getLikes(pid)           { return _d.post_likes.filter(l => l.post_id === pid).map(l => l.user_id); },
  toggleLike(pid, uid)    {
    const i = _d.post_likes.findIndex(l => l.post_id === pid && l.user_id === uid);
    if (i > -1) { _d.post_likes.splice(i, 1); save(_d); return false; }
    _d.post_likes.push({ post_id: pid, user_id: uid }); save(_d); return true;
  },

  // questions
  getQuestions()          { return [..._d.questions]; },
  getQuestionById(id)     { return _d.questions.find(q => q.id === id) || null; },
  addQuestion(q)          { _d.questions.unshift(q); save(_d); },
  deleteQuestion(id)      { _d.questions = _d.questions.filter(q => q.id !== id); save(_d); },
  voteQuestion(id, dir)   {
    const q = _d.questions.find(q => q.id === id);
    if (q) { q.votes += dir; save(_d); return q.votes; }
    return 0;
  },

  // events
  getEvents(cat)          { return (cat && cat !== 'all') ? _d.events.filter(e => e.category === cat) : [..._d.events]; },
  getEventById(id)        { return _d.events.find(e => e.id === id) || null; },
  addEvent(e)             { _d.events.unshift(e); save(_d); },
  getRegs(eid)            { return _d.event_regs.filter(r => r.event_id === eid).map(r => r.user_id); },
  toggleReg(eid, uid)     {
    const i = _d.event_regs.findIndex(r => r.event_id === eid && r.user_id === uid);
    if (i > -1) { _d.event_regs.splice(i, 1); save(_d); return false; }
    _d.event_regs.push({ event_id: eid, user_id: uid }); save(_d); return true;
  },

  // achievements
  getAchievements()       { return [..._d.achievements]; },
  addAchievement(a)       { _d.achievements.unshift(a); save(_d); },
  deleteAchievement(id)   { _d.achievements = _d.achievements.filter(a => a.id !== id); save(_d); },
  getClaps(aid)           { return _d.ach_claps.filter(c => c.ach_id === aid).map(c => c.user_id); },
  toggleClap(aid, uid)    {
    const i = _d.ach_claps.findIndex(c => c.ach_id === aid && c.user_id === uid);
    if (i > -1) { _d.ach_claps.splice(i, 1); save(_d); return false; }
    _d.ach_claps.push({ ach_id: aid, user_id: uid }); save(_d); return true;
  },

  // stats — exact live counts from DB only
  stats() {
    return {
      users        : _d.users.length,
      questions    : _d.questions.length,
      events       : _d.events.length,
      achievements : _d.achievements.length,
    };
  }
};

module.exports = db;
