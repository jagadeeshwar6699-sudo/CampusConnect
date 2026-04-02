const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let db;

async function connect() {
  if (!db) {
    await client.connect();
    db = client.db('campusconnect');
    console.log('✅ Connected to MongoDB Atlas');
    await seed();
  }
  return db;
}

async function seed() {
  const bcrypt = require('bcryptjs');
  const users = db.collection('users');
  const count = await users.countDocuments();
  if (count > 0) return;

  console.log('🌱 Seeding database...');
  const C = ['#003399','#7c3aed','#c0392b','#c48a00','#16a34a','#0891b2'];
  function ago(days) { return new Date(Date.now() - days * 86400000).toISOString(); }

  await users.insertMany([
    { id:'seed_1', name:'Priya S.',   email:'priya@rvrjcce.ac.in',   password:bcrypt.hashSync('password123',10), dept:'CSE 3rd Year',  color:C[0], created_at:ago(7) },
    { id:'seed_2', name:'Rahul K.',   email:'rahul@rvrjcce.ac.in',   password:bcrypt.hashSync('password123',10), dept:'ECE 4th Year',  color:C[3], created_at:ago(6) },
    { id:'seed_3', name:'Ananya M.',  email:'ananya@rvrjcce.ac.in',  password:bcrypt.hashSync('password123',10), dept:'CSE 3rd Year',  color:C[1], created_at:ago(5) },
    { id:'seed_4', name:'Vikram T.',  email:'vikram@rvrjcce.ac.in',  password:bcrypt.hashSync('password123',10), dept:'MECH 2nd Year', color:C[4], created_at:ago(4) },
    { id:'seed_5', name:'Karthik N.', email:'karthik@rvrjcce.ac.in', password:bcrypt.hashSync('password123',10), dept:'CSE 4th Year',  color:C[0], created_at:ago(3) }
  ]);

  await db.collection('posts').insertMany([
    { id:'p1', author_id:'seed_1', category:'academics', text:'Anyone has notes for Data Structures Unit 3? Exam next week — missed two classes 🙏', created_at:ago(2) },
    { id:'p2', author_id:'seed_2', category:'career',    text:'TCS is coming to campus next month! Practice aptitude on IndiaBix and DSA on LeetCode.', created_at:ago(1) },
    { id:'p3', author_id:'seed_3', category:'tech',      text:'Built my portfolio with React + Tailwind. Deployed free on Vercel. Happy to review yours!', created_at:ago(0.5) },
    { id:'p4', author_id:'seed_4', category:'general',   text:'Reading room near CSE block is open till 9pm now. Great for late-night prep 📚', created_at:ago(0.2) }
  ]);

  await db.collection('questions').insertMany([
    { id:'q1', author_id:'seed_1', title:'How to prepare for TCS NQT?',                    detail:'2 months left. Which topics for coding?',               tags:['placement','aptitude'], votes:14, solved:true,  created_at:ago(3)   },
    { id:'q2', author_id:'seed_2', title:'Best projects for internship resume — 2nd year?', detail:'What projects get noticed by recruiters?',              tags:['internship','projects'],votes:22, solved:true,  created_at:ago(2)   },
    { id:'q3', author_id:'seed_3', title:'How to score well in DBMS practicals?',           detail:'Not clear on normalization and SQL joins.',             tags:['academics','dbms'],    votes:9,  solved:false, created_at:ago(0.1) },
    { id:'q4', author_id:'seed_4', title:'Free Machine Learning resources?',                detail:'YouTube or Coursera? What actually works from scratch?',tags:['academics','python'],  votes:18, solved:true,  created_at:ago(5)   }
  ]);

  await db.collection('events').insertMany([
    { id:'e1', author_id:'seed_5', title:'Hackathon 4.0 – 2025',              category:'hackathon', emoji:'💻', date_str:'March 22–23 | 9:00AM', venue:'RVRJCCE Main Campus',        bg_color:'#001a4d', reg_link:null, deadline:null, created_at:ago(10) },
    { id:'e2', author_id:'seed_2', title:'Rujangna Annual Cultural Fest 2025', category:'cultural',  emoji:'🎭', date_str:'April 5–7 | All Day',   venue:'RVRJCCE College Ground',     bg_color:'#2d0050', reg_link:null, deadline:null, created_at:ago(9)  },
    { id:'e3', author_id:'seed_3', title:'Data Science & ML Workshop',         category:'workshop',  emoji:'📊', date_str:'March 28 | 9:00AM',    venue:'CS Seminar Hall',             bg_color:'#003300', reg_link:null, deadline:null, created_at:ago(8)  },
    { id:'e4', author_id:'seed_5', title:'TCS Campus Placement Drive',         category:'placement', emoji:'🏢', date_str:'April 2 | 8:00AM',     venue:'Placement Cell, Admin Block', bg_color:'#2d1a00', reg_link:null, deadline:null, created_at:ago(7)  },
    { id:'e5', author_id:'seed_4', title:'Inter-Department Cricket Tournament',category:'sports',    emoji:'🏏', date_str:'April 12 | 8:00AM',    venue:'RVRJCCE Sports Ground',       bg_color:'#1a1a00', reg_link:null, deadline:null, created_at:ago(6)  },
    { id:'e6', author_id:'seed_1', title:'FDP on AI & Deep Learning',          category:'fdp',       emoji:'🎓', date_str:'March 25–29 | 10:00AM',venue:'ECE Seminar Hall',            bg_color:'#00001a', reg_link:null, deadline:null, created_at:ago(5)  }
  ]);

  await db.collection('achievements').insertMany([
    { id:'a1', author_id:'seed_5', title:'Placed at TCS – ₹7 LPA',           who_label:'Karthik N. · CSE 4th Year · 2024 Batch',           body:'IndiaBix + LeetCode + mock interviews = TCS offer. Happy to guide!',                medal:'🥇', created_at:ago(3)  },
    { id:'a2', author_id:'seed_3', title:'1st Place – Smart India Hackathon', who_label:'Team Nexus (Ananya, Rahul, Priya) · CSE 3rd Year', body:'Won SIH 2024 with AI crop disease detection now piloted in 3 AP villages!',        medal:'🏆', created_at:ago(7)  },
    { id:'a3', author_id:'seed_4', title:'GATE 2025 – AIR 412',              who_label:'Vikram T. · ME 4th Year',                          body:'Standard textbooks + 10 years previous papers = AIR 412 in GATE 2025 Mechanical.',medal:'🎯', created_at:ago(14) }
  ]);

  console.log('✅ Done! Test login: priya@rvrjcce.ac.in / password123');
}

const db_api = {
  async getUsers()            { const d = await connect(); return d.collection('users').find().toArray(); },
  async getUserById(id)       { const d = await connect(); return d.collection('users').findOne({ id }); },
  async getUserByEmail(e)     { const d = await connect(); return d.collection('users').findOne({ email: e }); },
  async addUser(u)            { const d = await connect(); await d.collection('users').insertOne(u); },

  async getPosts(cat)         { const d = await connect(); const q = (cat && cat !== 'all') ? { category: cat } : {}; return d.collection('posts').find(q).sort({ created_at: -1 }).toArray(); },
  async getPostById(id)       { const d = await connect(); return d.collection('posts').findOne({ id }); },
  async addPost(p)            { const d = await connect(); await d.collection('posts').insertOne(p); },
  async deletePost(id)        { const d = await connect(); await d.collection('posts').deleteOne({ id }); },
  async getLikes(pid)         { const d = await connect(); return (await d.collection('post_likes').find({ post_id: pid }).toArray()).map(l => l.user_id); },
  async toggleLike(pid, uid)  {
    const d = await connect();
    const exists = await d.collection('post_likes').findOne({ post_id: pid, user_id: uid });
    if (exists) { await d.collection('post_likes').deleteOne({ post_id: pid, user_id: uid }); return false; }
    await d.collection('post_likes').insertOne({ post_id: pid, user_id: uid }); return true;
  },
  async getReplies(pid)       { const d = await connect(); return d.collection('replies').find({ post_id: pid }).sort({ created_at: 1 }).toArray(); },
  async addReply(r)           { const d = await connect(); await d.collection('replies').insertOne(r); },
  async deleteReply(id)       { const d = await connect(); await d.collection('replies').deleteOne({ id }); },
  async getQuestions()        { const d = await connect(); return d.collection('questions').find().sort({ created_at: -1 }).toArray(); },
  async getQuestionById(id)   { const d = await connect(); return d.collection('questions').findOne({ id }); },
  async addQuestion(q)        { const d = await connect(); await d.collection('questions').insertOne(q); },
  async deleteQuestion(id)    { const d = await connect(); await d.collection('questions').deleteOne({ id }); },
  async getAnswers(qid)       { const d = await connect(); return d.collection('answers').find({ question_id: qid }).sort({ created_at: 1 }).toArray(); },
  async addAnswer(a)          { const d = await connect(); await d.collection('answers').insertOne(a); },
  async deleteAnswer(id)      { const d = await connect(); await d.collection('answers').deleteOne({ id }); },
  async markSolved(qid)       { const d = await connect(); await d.collection('questions').updateOne({ id: qid }, { $set: { solved: true } }); },
  async voteQuestion(id, dir) {
    const d = await connect();
    const q = await d.collection('questions').findOne({ id });
    if (!q) return 0;
    const votes = (q.votes || 0) + dir;
    await d.collection('questions').updateOne({ id }, { $set: { votes } });
    return votes;
  },

  async getEvents(cat)        { const d = await connect(); const q = (cat && cat !== 'all') ? { category: cat } : {}; return d.collection('events').find(q).sort({ created_at: -1 }).toArray(); },
  async getEventById(id)      { const d = await connect(); return d.collection('events').findOne({ id }); },
  async addEvent(e)           { const d = await connect(); await d.collection('events').insertOne(e); },
  async updateEvent(id, fields) { const d = await connect(); await d.collection('events').updateOne({ id }, { $set: fields }); },
  async deleteEvent(id)       { const d = await connect(); await d.collection('events').deleteOne({ id }); },
  async getRegs(eid)          { const d = await connect(); return (await d.collection('event_regs').find({ event_id: eid }).toArray()).map(r => r.user_id); },
  async toggleReg(eid, uid)   {
    const d = await connect();
    const exists = await d.collection('event_regs').findOne({ event_id: eid, user_id: uid });
    if (exists) { await d.collection('event_regs').deleteOne({ event_id: eid, user_id: uid }); return false; }
    await d.collection('event_regs').insertOne({ event_id: eid, user_id: uid }); return true;
  },

  async getAchievements()     { const d = await connect(); return d.collection('achievements').find().sort({ created_at: -1 }).toArray(); },
  async addAchievement(a)     { const d = await connect(); await d.collection('achievements').insertOne(a); },
  async deleteAchievement(id) { const d = await connect(); await d.collection('achievements').deleteOne({ id }); },
  async getClaps(aid)         { const d = await connect(); return (await d.collection('ach_claps').find({ ach_id: aid }).toArray()).map(c => c.user_id); },
  async toggleClap(aid, uid)  {
    const d = await connect();
    const exists = await d.collection('ach_claps').findOne({ ach_id: aid, user_id: uid });
    if (exists) { await d.collection('ach_claps').deleteOne({ ach_id: aid, user_id: uid }); return false; }
    await d.collection('ach_claps').insertOne({ ach_id: aid, user_id: uid }); return true;
  },

  async stats() {
    const d = await connect();
    return {
      users:        await d.collection('users').countDocuments(),
      questions:    await d.collection('questions').countDocuments(),
      events:       await d.collection('events').countDocuments(),
      achievements: await d.collection('achievements').countDocuments(),
    };
  }
};

module.exports = db_api;