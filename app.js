// Kana Dojo app logic. Requires data.js (loaded first).
// ═══════════════════════════════════════
//  BRUTE FORCE SETS — 12 sets × 10 kanji
// ═══════════════════════════════════════
const BF_SETS = [
  { name:'Numbers & Time', theme:'Foundation: counting & time words',
    kanji: KANJI.filter(x=>x.c==='Numbers').slice(0,10) },
  { name:'More Numbers & Time', theme:'Time words and larger numbers',
    kanji: [...KANJI.filter(x=>x.c==='Numbers').slice(10), ...KANJI.filter(x=>x.c==='Time').slice(0,7)] },
  { name:'Time of Day', theme:'Every, morning, night and noon',
    kanji: KANJI.filter(x=>x.c==='Time').slice(7) },
  { name:'People & Names', theme:'Words for people and relationships',
    kanji: KANJI.filter(x=>x.c==='People') },
  { name:'Nature I', theme:'Mountains, rivers, sky and elements',
    kanji: KANJI.filter(x=>x.c==='Nature').slice(0,10) },
  { name:'Nature II', theme:'More nature: trees, forest, snow, wind',
    kanji: KANJI.filter(x=>x.c==='Nature').slice(10) },
  { name:'Body & Mind', theme:'The human body and senses',
    kanji: KANJI.filter(x=>x.c==='Body') },
  { name:'Directions & Space', theme:'Navigate the world around you',
    kanji: KANJI.filter(x=>x.c==='Direction') },
  { name:'Actions I', theme:'Core verbs: eat, drink, see, listen, go',
    kanji: KANJI.filter(x=>x.c==='Actions').slice(0,9) },
  { name:'Actions II', theme:'More verbs: buy, sell, sleep, wait, return',
    kanji: KANJI.filter(x=>x.c==='Actions').slice(9) },
  { name:'Adjectives', theme:'Describe the world around you',
    kanji: KANJI.filter(x=>x.c==='Adjectives') },
  { name:'Society & Places', theme:'Cities, buildings, transport, money',
    kanji: KANJI.filter(x=>x.c==='Society') },
  { name:'Daily Life', theme:'Food, objects, senses and energy',
    kanji: KANJI.filter(x=>x.c==='Daily Life') },
  // ── Game / VN sets ──
  { name:'Combat & Skills', theme:'Battle, weapons, attack and defence',
    kanji: KANJI.filter(x=>x.c==='Combat') },
  { name:'Magic & Spirits', theme:'Spells, gods, seals and summons',
    kanji: KANJI.filter(x=>x.c==='Magic') },
  { name:'Emotion & Drama', theme:'Love, fear, tears — the VN essentials',
    kanji: KANJI.filter(x=>x.c==='Emotion') },
  { name:'Story & Heroes', theme:'Kings, princesses, fate and bonds',
    kanji: KANJI.filter(x=>x.c==='Story') },
  { name:'World & Settings', theme:'Castles, dungeons, islands, ruins',
    kanji: KANJI.filter(x=>x.c==='World') },
  { name:'Game Systems', theme:'Stats, speed, recovery, experience',
    kanji: KANJI.filter(x=>x.c==='Game Systems') },
  { name:'Darkness & Conflict', theme:'Death, demons, blood, betrayal',
    kanji: KANJI.filter(x=>x.c==='Darkness') },
  { name:'Full Game Run', theme:'Mixed drill across all game/VN kanji',
    kanji: shuffle(KANJI.filter(x=>['Combat','Magic','Emotion','Story','World','Game Systems','Darkness','Elements','Sacred','Movement','Mind','Power'].includes(x.c))).slice(0,20) },
  // ── New thematic sets ──
  { name:'Elements & Forces', theme:'Light, fire, ice, thunder, shadow and storm',
    kanji: KANJI.filter(x=>x.c==='Elements') },
  { name:'Sacred & Forbidden', theme:'Holy, evil, dragons, beasts, pacts and binding',
    kanji: KANJI.filter(x=>x.c==='Sacred') },
  { name:'Movement & Change', theme:'Run, fly, start, end, transform, reincarnate',
    kanji: KANJI.filter(x=>x.c==='Movement') },
  { name:'Mind & Will', theme:'Sincerity, faith, pride, hate, shame and madness',
    kanji: KANJI.filter(x=>x.c==='Mind') },
  { name:'Power & Rule', theme:'Generals, armies, flags, conquest and authority',
    kanji: KANJI.filter(x=>x.c==='Power') },
];

// ═══════════════════════════════════════
//  STATE
// ═══════════════════════════════════════
let qSet = 'hiragana', pool = [], cur = null, qAnswered = false;
let qC = 0, qW = 0, qS = 0, qBS = 0, seen = new Set();
let kFilter = 'All';
let bfMastered = 0;

// ── BF State ──
// Phase: 'familiarise' | 'drill' | 'cumulative' | 'complete'
const BF_REPS_NEEDED = 3; // correct reps per card in drill phase
let bf = {
  setIdx: -1,
  phase: null,
  famIdx: 0,
  drillPool: [],
  drillCur: null,
  drillReps: {}, // {kanjiChar: correctCount}
  hintVisible: false,
  inputLocked: false,
  cumPool: [],
  cumCur: null,
  cumAnswered: false,
  cumReps: {},
  setStatus: BF_SETS.map(()=>({ phase:'untouched', mastered:false }))
};

// ═══════════════════════════════════════
//  NAV
// ═══════════════════════════════════════
const NAV_ORDER = ['home','chart','quiz','kanji','bruteforce','vocabulary','wordbf','sentences','progress'];
function go(id) {
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
  const idx = NAV_ORDER.indexOf(id);
  if(idx>=0) document.querySelectorAll('.nav-tab')[idx].classList.add('active');
  if(id==='chart') buildChart('hiragana');
  if(id==='quiz') initQuiz();
  if(id==='kanji') buildKanji();
  if(id==='bruteforce') buildBFSetList();
  if(id==='vocabulary') buildVocab();
  if(id==='wordbf') buildWBFSetList();
  if(id==='sentences') buildSentences();
  if(id==='progress') buildProgress();
}

// ═══════════════════════════════════════
//  CHARTS
// ═══════════════════════════════════════
function showChart(type, btn) {
  document.querySelectorAll('#chart .tog').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  buildChart(type);
}
function buildChart(type) {
  const data = type==='hiragana' ? H : KT;
  const basic = data.slice(0,46), daku = data.slice(46,71), combo = data.slice(71);
  const grid = arr => arr.map(c=>`<div class="kana-cell"><span class="kana">${c.k}</span><span class="roma">${c.r}</span></div>`).join('');
  document.getElementById('chart-out').innerHTML =
    `<div class="sec-label">Basic (${type==='hiragana'?'ひらがな':'カタカナ'}) — 46 characters</div>
     <div class="kana-grid">${grid(basic)}</div>
     <div class="sec-label">Dakuten · Handakuten (voiced / semi-voiced)</div>
     <div class="kana-grid">${grid(daku)}</div>
     <div class="sec-label">Combination Sounds (digraphs)</div>
     <div class="kana-grid">${grid(combo)}</div>`;
}

// ═══════════════════════════════════════
//  QUIZ
// ═══════════════════════════════════════
function getPool(s) {
  if(s==='hiragana') return H;
  if(s==='katakana') return KT;
  if(s==='both') return [...H,...KT];
  if(s==='kanji') return KANJI.map(x=>({k:x.k,r:x.e,h:x.h,t:x.t}));
  if(s==='vocab') return VOCAB.map(v=>({k:v.jp, t:v.t, r:v.e, jp:v.jp, romaji:v.r, type:'vocab'}));
}
function setSet(s, btn) {
  qSet=s;
  document.querySelectorAll('#quiz-sets .tog').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  initQuiz();
}
function initQuiz() {
  pool = shuffle([...getPool(qSet)]);
  nextQ();
}
function nextQ() {
  qAnswered=false;
  document.getElementById('fc').classList.remove('flipped');
  document.getElementById('fb').textContent='';
  document.getElementById('fb').className='feedback-msg';
  if(!pool.length) pool=shuffle([...getPool(qSet)]);
  cur=pool.pop(); seen.add(cur.k);
  document.getElementById('cq').textContent=cur.k;
  document.getElementById('ca').textContent=cur.r;
  if(cur.type === 'vocab') {
    document.getElementById('ca2').textContent = `Katakana: ${cur.t} | Romaji: ${cur.romaji}`;
  } else {
    document.getElementById('ca2').textContent=cur.h?`ひ: ${cur.h}　カ: ${cur.t}`:'';
  }
  document.getElementById('qpool').textContent=`Pool: ${pool.length+1}`;
  buildChoices(); updateScore();
}
function flip() { document.getElementById('fc').classList.toggle('flipped'); }
function buildChoices() {
  const all=getPool(qSet);
  const wrong=shuffle(all.filter(c=>c.k!==cur.k&&c.r!==cur.r)).slice(0,3);
  const opts=shuffle([cur,...wrong]);
  document.getElementById('choices').innerHTML=opts.map(o=>
    `<button class="choice-btn" onclick="check(this,'${o.r.replace(/'/g,"\\'")}')">${o.r}</button>`
  ).join('');
}
function check(btn,val) {
  if(qAnswered) return; qAnswered=true;
  const ok=val===cur.r;
  const fb=document.getElementById('fb');
  if(ok){ btn.classList.add('correct'); qC++;qS++;if(qS>qBS)qBS=qS; fb.textContent='✓ Correct!'+(qS>2?' · streak '+qS:''); fb.className='feedback-msg ok'; }
  else { btn.classList.add('wrong'); qW++;qS=0; fb.textContent='✗ Wrong — answer: '+cur.r; fb.className='feedback-msg no';
    document.querySelectorAll('.choice-btn').forEach(b=>{if(b.textContent===cur.r)b.classList.add('correct');}); }
  document.querySelectorAll('.choice-btn').forEach(b=>b.disabled=true);
  updateScore();
}
function updateScore() {
  document.getElementById('qc').textContent=qC;
  document.getElementById('qw').textContent=qW;
  document.getElementById('qs').textContent=qS;
}

// ═══════════════════════════════════════
//  KANJI REFERENCE
// ═══════════════════════════════════════
function buildKanji(f) {
  f=f||kFilter; kFilter=f;
  const cats=['All',...new Set(KANJI.map(x=>x.c))];
  document.getElementById('kf').innerHTML=cats.map(c=>
    `<button class="tog ${c===kFilter?'active':''}" onclick="buildKanji('${c}')">${c}</button>`).join('');
  const data=kFilter==='All'?KANJI:KANJI.filter(x=>x.c===kFilter);
  document.getElementById('kg').innerHTML=data.map(x=>`
    <div class="kanji-card">
      <div class="kanji-cat">${x.c}</div>
      <div class="kanji-char">${x.k}</div>
      <div class="kanji-hira">ひ: ${x.h}</div>
      <div class="kanji-kata">カ: ${x.t}</div>
      <div class="kanji-meaning">${x.e}</div>
      <div class="kanji-radical">⊙ ${x.rad}</div>
    </div>`).join('');
}

// ═══════════════════════════════════════
//  SENTENCES
// ═══════════════════════════════════════
function buildSentences() {
  document.getElementById('sl').innerHTML=SENTENCES.map((s,i)=>`
    <div class="sent-box">
      <div class="sent-jp">${s.jp}</div>
      <div class="sent-btns">
        <button class="reveal-btn" onclick="stog('sr${i}',this,'${s.r.replace(/'/g,"\\'")}')">Show Reading</button>
        <button class="reveal-btn" onclick="stog('se${i}',this,'${s.e.replace(/'/g,"\\'")}')">Show Meaning</button>
        <button class="reveal-btn" onclick="stog('sv${i}',this,'${s.v.replace(/'/g,"\\'")}')">Vocabulary</button>
      </div>
      <div class="sent-read" id="sr${i}"></div>
      <div class="sent-en" id="se${i}"></div>
      <div class="sent-voc" id="sv${i}"></div>
    </div>`).join('');
}
function stog(id,btn,txt) {
  const el=document.getElementById(id);
  if(el.textContent){el.textContent='';btn.textContent=btn.textContent.replace('Hide','Show');}
  else{el.textContent=txt;btn.textContent='Hide';}
}

// ═══════════════════════════════════════
//  PROGRESS
// ═══════════════════════════════════════
function buildProgress() {
  const tot=qC+qW;
  document.getElementById('pc').textContent=qC;
  document.getElementById('pa').textContent=tot?Math.round(qC/tot*100)+'%':'—';
  document.getElementById('pb').textContent=qBS;
  document.getElementById('pseen').textContent=seen.size;
  document.getElementById('pbf').textContent=bf.setStatus.filter(s=>s.mastered).length;
}

// ════════════════════════════════════════════════════════
//  BRUTE FORCE MODE
// ════════════════════════════════════════════════════════

function buildBFSetList() {
  const list = document.getElementById('bf-set-list');
  list.innerHTML = BF_SETS.map((s,i)=>{
    const st = bf.setStatus[i];
    const pips = s.kanji.map((_,j)=>{
      const k = s.kanji[j].k;
      const reps = bf.drillReps[k]||0;
      const cls = st.mastered||reps>=BF_REPS_NEEDED?'done':(bf.setIdx===i?'active':'');
      return `<span class="bf-pip ${cls}"></span>`;
    }).join('');
    const statusText = st.mastered?'&#10003; Mastered':st.phase==='drill'?'Drilling\u2026':st.phase==='familiarise'?'Familiarising\u2026':'Not started';
    return `<div class="bf-set-card ${bf.setIdx===i?'active-set':''} ${st.mastered?'done':''}" onclick="bfSelectSet(${i})">
      <div class="bf-set-num">Set ${i+1} &middot; ${s.kanji.length} kanji</div>
      <div class="bf-set-name">${s.name}</div>
      <div class="bf-set-kanji">${s.kanji.map(x=>x.k).join(' ')}</div>
      <div class="bf-set-status">
        <div class="bf-pips">${pips}</div>
        <span style="font-size:.68rem;color:var(--muted)">${statusText}</span>
      </div>
    </div>`;
  }).join('');
  // Keep Phase 3 chips in sync
  p3BuildChips();
}

function bfSelectSet(idx) {
  bf.setIdx = idx;
  bf.hintVisible = false;
  const st = bf.setStatus[idx];
  
  // If mastered AND re-drilling (coming from completion screen), reset to Phase 1
  if(st.mastered && bf.redrilling) {
    bf.redrilling = false;
    bf.setStatus[idx].phase = 'untouched';
    BF_SETS[idx].kanji.forEach(x=>{bf.drillReps[x.k]=0;});
    bfStartFamiliarise(idx);
    buildBFSetList();
    return;
  }
  
  if(st.mastered) {
    bfStartDrill(idx); return;
  }
  if(st.phase==='drill') {
    bfStartDrill(idx); return;
  }
  bfStartFamiliarise(idx);
  buildBFSetList();
}

// ── PHASE 1: FAMILIARISE ──────────────────
function bfStartFamiliarise(idx) {
  bf.phase = 'familiarise';
  bf.famIdx = 0;
  bf.setStatus[idx].phase = 'familiarise';
  bfRenderFamiliarise();
}

function bfRenderFamiliarise() {
  const set = BF_SETS[bf.setIdx];
  const k = set.kanji[bf.famIdx];
  const arena = document.getElementById('bf-arena');
  const pct = Math.round((bf.famIdx/set.kanji.length)*100);

  arena.innerHTML = `
    <div class="bf-phase-banner">
      <div class="bf-phase-icon"></div>
      <div><div class="bf-phase-title">Phase 1 — Familiarise</div>
      <div class="bf-phase-sub">Study each kanji with its meaning shown. Take your time.</div></div>
    </div>
    <div class="bf-prog-track"><div class="bf-prog-fill" style="width:${pct}%"></div></div>
    <div class="bf-card reveal-mode">
      <div class="bf-card-counter">${bf.famIdx+1} / ${set.kanji.length}</div>
      <div class="bf-kanji-display" style="cursor:default">${k.k}</div>
      <div class="bf-hint-box">
        <div class="bf-hint-meaning">${k.e}</div>
        <div class="bf-hint-reads">ひ: ${k.h} · カ: ${k.t}</div>
      </div>
      <div class="bf-radical-bar">⊙ Radical: ${k.rad}</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:4px">
      ${bf.famIdx>0?`<button class="btn-ghost" onclick="bfFamNav(-1)">← Back</button>`:''}
      ${bf.famIdx<set.kanji.length-1
        ? `<button class="btn-ink" onclick="bfFamNav(1)">Next →</button>`
        : `<button class="btn-ink" onclick="bfTransitionToDrill()" style="background:var(--bf-accent);color:var(--bf-fg)">Start Drilling </button>`
      }
    </div>
    <div style="text-align:center;margin-top:14px;font-size:.78rem;color:var(--muted)">
      Study all ${set.kanji.length} kanji, then begin the drill. You can return here anytime.
    </div>`;
}

function bfFamNav(dir) {
  bf.famIdx = Math.max(0, Math.min(BF_SETS[bf.setIdx].kanji.length-1, bf.famIdx+dir));
  bfRenderFamiliarise();
}

// ── PHASE 2: DRILL ───────────────────────
function bfTransitionToDrill() {
  bf.setStatus[bf.setIdx].phase = 'drill';
  bfStartDrill(bf.setIdx);
}

function bfStartDrill(idx) {
  bf.phase = 'drill';
  bf.setIdx = idx;
  const set = BF_SETS[idx];
  // Init rep counts for this set's kanji
  set.kanji.forEach(k => { if(!(k.k in bf.drillReps)) bf.drillReps[k.k]=0; });
  // Build pool: kanji that still need reps
  bf.drillPool = shuffle(set.kanji.filter(k=>bf.drillReps[k.k]<BF_REPS_NEEDED));
  bfNextDrill();
}

function bfNextDrill() {
  const set = BF_SETS[bf.setIdx];
  // Refresh pool from set's incomplete kanji
  const remaining = set.kanji.filter(k=>bf.drillReps[k.k]<BF_REPS_NEEDED);
  if(remaining.length===0) {
    bfCheckSetComplete(); return;
  }
  if(!bf.drillPool.length) bf.drillPool = shuffle([...remaining]);
  bf.drillCur = bf.drillPool.pop();
  bf.hintVisible = false;
  bf.inputLocked = false;
  bfRenderDrill();
}

function bfRenderDrill() {
  const set = BF_SETS[bf.setIdx];
  const k = bf.drillCur;
  const reps = bf.drillReps[k.k]||0;
  const totalDone = set.kanji.reduce((s,x)=>s+Math.min(bf.drillReps[x.k]||0,BF_REPS_NEEDED),0);
  const totalNeeded = set.kanji.length * BF_REPS_NEEDED;
  const pct = Math.round((totalDone/totalNeeded)*100);

  // Rep dots for current card
  const dots = Array.from({length:BF_REPS_NEEDED},(_,i)=>
    `<div class="bf-rep-dot ${i<reps?'done':i===reps?'active':''}"></div>`).join('');

  // Summary row
  const summary = set.kanji.map(x=>{
    const r=bf.drillReps[x.k]||0;
    return `<span style="font-size:.9rem;font-family:'Noto Serif JP',serif;color:${r>=BF_REPS_NEEDED?'var(--correct)':x.k===k.k?'var(--bf-accent)':'var(--muted)'}">${x.k}</span>`;
  }).join(' ');

  document.getElementById('bf-arena').innerHTML = `
    <div class="bf-phase-banner">
      <div class="bf-phase-icon"></div>
      <div><div class="bf-phase-title">Phase 2 — Drill</div>
      <div class="bf-phase-sub">Hint hidden. Tap the kanji to peek. Type the English meaning.</div></div>
    </div>
    <div class="bf-prog-track"><div class="bf-prog-fill" style="width:${pct}%"></div></div>
    <div style="text-align:center;font-size:.82rem;color:var(--muted);margin-bottom:10px">${summary}</div>
    <div class="bf-card" id="bf-main-card">
      <div class="bf-card-counter">${BF_REPS_NEEDED - reps} more correct to pass</div>
      <div style="position:relative;display:inline-block">
        <div class="bf-kanji-display" id="bf-k-display" onclick="bfToggleHint()">${k.k}</div>
        <div class="bf-hint-popup" id="bf-popup">
          <div class="bf-popup-meaning">${k.e}</div>
          <div class="bf-popup-reads">ひ: ${k.h} · カ: ${k.t}</div>
        </div>
      </div>
      <div class="bf-tap-hint">Tap the kanji to peek at the hint</div>
    </div>
    <div class="bf-rep-row">${dots}</div>
    <div class="bf-input-area">
      <input class="bf-input" id="bf-inp" type="text" placeholder="Type the English meaning…" autocomplete="off"
        onkeydown="if(event.key==='Enter')bfSubmit()">
      <button class="bf-submit" id="bf-sub-btn" onclick="bfSubmit()">Submit</button>
      <div class="bf-feedback" id="bf-fb"></div>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
      <button class="btn-ghost" style="font-size:.82rem;padding:7px 16px" onclick="bfStartFamiliarise(bf.setIdx)">← Back to Study</button>
    </div>`;

  document.getElementById('bf-inp').focus();
}

function bfToggleHint() {
  bf.hintVisible = !bf.hintVisible;
  const p = document.getElementById('bf-popup');
  if(p) p.classList.toggle('show', bf.hintVisible);
}

function bfSubmit() {
  if(bf.inputLocked) return;
  const inp = document.getElementById('bf-inp');
  const val = inp.value.trim().toLowerCase();
  if(!val) return;
  const k = bf.drillCur;
  // Accept if any keyword in the correct answer appears
  const ok = matchAnswer(val, k.e);

  bf.inputLocked = true;
  const fb = document.getElementById('bf-fb');
  const card = document.getElementById('bf-main-card');
  const inp2 = document.getElementById('bf-inp');
  const btn = document.getElementById('bf-sub-btn');

  if(ok) {
    bf.drillReps[k.k] = (bf.drillReps[k.k]||0)+1;
    inp2.classList.add('ok'); card.classList.add('correct-flash');
    fb.textContent = '✓ Correct! ' + k.e;
    fb.className = 'bf-feedback ok';
    btn.disabled = true;
    setTimeout(()=>{ bfNextDrill(); }, 900);
  } else {
    inp2.classList.add('no'); card.classList.add('wrong-flash');
    fb.innerHTML = `✗ Not quite — the answer is: <strong>${k.e}</strong>`;
    fb.className = 'bf-feedback no';
    // Show the hint popup automatically on wrong
    const p = document.getElementById('bf-popup');
    if(p){ p.classList.add('show'); bf.hintVisible=true; }
    btn.textContent = 'Try again';
    btn.onclick = ()=>{
      inp2.value=''; inp2.classList.remove('no'); card.classList.remove('wrong-flash');
      fb.textContent=''; bf.inputLocked=false;
      btn.textContent='Submit';           // ADD THIS
      btn.onclick=bfSubmit;
      inp2.focus();
    };
  }
}

function bfCheckSetComplete() {
  // Phase 2 complete → directly mark mastered (no auto Phase 3)
  bfMarkSetMastered(bf.setIdx);
}

// ── SET MASTERED ──────────────────────────
function bfMarkSetMastered(idx) {
  bf.setStatus[idx].mastered = true;
  bf.setStatus[idx].phase = 'mastered';
  bfMastered = bf.setStatus.filter(s=>s.mastered).length;
  buildBFSetList();
  p3BuildChips(); // refresh Phase 3 chip selector
  const set = BF_SETS[idx];
  const nextIdx = idx+1 < BF_SETS.length ? idx+1 : -1;
  const masteredTotal = bf.setStatus.slice(0,idx+1).reduce((s,_,i)=>s+BF_SETS[i].kanji.length,0);
  document.getElementById('bf-arena').innerHTML = `
    <div class="bf-complete">
      <div class="bf-complete-icon"></div>
      <div class="bf-complete-title">Set ${idx+1} Mastered!</div>
      <div class="bf-complete-sub">
        You've drilled all <strong>${set.kanji.length} kanji</strong> in "<em>${set.name}</em>" to completion.
        <br><br>
        Want to test your memory across multiple sets? Try <strong>Phase 3 — Cumulative Quiz</strong> below.
      </div>
      <div class="bf-complete-actions">
        <button class="btn-ghost" onclick="bf.redrilling=true;bfSelectSet(${idx})">Re-drill this set</button>
        ${nextIdx>=0?`<button class="btn-ink" style="background:var(--bf-accent);color:var(--bf-fg)" onclick="bfSelectSet(${nextIdx})">Next: Set ${nextIdx+1} &#8594;</button>`:''}
        <button class="btn-gold" onclick="document.getElementById('bf-p3-panel').scrollIntoView({behavior:'smooth'})">Go to Phase 3 &#8595;</button>
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════════
//  PHASE 3 — STANDALONE CUMULATIVE QUIZ
// ════════════════════════════════════════════════════════

const P3_REPS = 2; // always 2 reps per kanji

// Which set indices are selected for Phase 3 (default: set 0)
let p3Selected = new Set([0]);

// Phase 3 runtime state
let p3 = {
  active: false,
  pool: [],       // kanji objects in this quiz
  cur: null,
  reps: {},       // {kanjiChar: correctCount}
  workingPool: [],
  hintVisible: false,
  inputLocked: false,
  mistakes: [],   // {k, e, h, t} — unique chars that were wrong at least once
  startTime: null,
  totalAttempts: 0,
};

function p3BuildChips() {
  const grid = document.getElementById('bf-p3-chips');
  if(!grid) return;
  grid.innerHTML = BF_SETS.map((s,i) => {
    const sel = p3Selected.has(i);
    const mastered = bf.setStatus[i].mastered;
    return `<div class="bf-p3-chip ${sel?'selected':''}" onclick="p3ToggleChip(${i})" id="p3-chip-${i}">
      <span class="chip-dot"></span>
      <span class="bf-p3-chip-name">Set ${i+1}</span>
      <span class="bf-p3-chip-count">${s.kanji.length}k</span>
      ${mastered?'<span style="font-size:.65rem;color:var(--correct);font-weight:700">&#10003;</span>':''}
    </div>`;
  }).join('');
  p3UpdateCount();
}

function p3ToggleChip(i) {
  if(p3Selected.has(i)) {
    // prevent deselecting the last one
    if(p3Selected.size === 1) return;
    p3Selected.delete(i);
  } else {
    p3Selected.add(i);
  }
  p3BuildChips();
}

function p3SelectAll() {
  BF_SETS.forEach((_,i)=>p3Selected.add(i));
  p3BuildChips();
}

function p3SelectNone() {
  p3Selected = new Set([0]); // keep at least set 1
  p3BuildChips();
}

function p3SelectMastered() {
  const mastered = BF_SETS.map((_,i)=>i).filter(i=>bf.setStatus[i].mastered);
  if(mastered.length === 0) return; // nothing mastered yet, leave untouched
  p3Selected = new Set(mastered);
  p3BuildChips();
}

function p3UpdateCount() {
  const total = [...p3Selected].reduce((s,i)=>s+BF_SETS[i].kanji.length, 0);
  const el = document.getElementById('bf-p3-count');
  const btn = document.getElementById('bf-p3-launch-btn');
  if(el) el.textContent = `${total} kanji selected across ${p3Selected.size} set${p3Selected.size!==1?'s':''}`;
  if(btn) btn.disabled = total === 0;
}

function p3Launch() {
  // Build the pool from selected sets
  let allKanji = [];
  [...p3Selected].sort((a,b)=>a-b).forEach(i => {
    BF_SETS[i].kanji.forEach(k => {
      if(!allKanji.find(x=>x.k===k.k)) allKanji.push(k); // deduplicate
    });
  });

  p3 = {
    active: true,
    pool: allKanji,
    cur: null,
    reps: {},
    workingPool: [],
    hintVisible: false,
    inputLocked: false,
    mistakes: [],
    startTime: Date.now(),
    totalAttempts: 0,
  };
  allKanji.forEach(k => { p3.reps[k.k] = 0; });
  p3.workingPool = shuffle([...allKanji]);

  // Scroll arena into view and render first card
  document.getElementById('bf-p3-arena').scrollIntoView({behavior:'smooth', block:'start'});
  p3Next();
}

function p3Next() {
  const remaining = p3.pool.filter(k => p3.reps[k.k] < P3_REPS);
  if(remaining.length === 0) { p3ShowResults(); return; }
  if(!p3.workingPool.length) p3.workingPool = shuffle([...remaining]);
  // pick only from remaining
  let candidate;
  while(p3.workingPool.length) {
    candidate = p3.workingPool.pop();
    if(p3.reps[candidate.k] < P3_REPS) break;
    candidate = null;
  }
  if(!candidate) { p3.workingPool = shuffle([...remaining]); candidate = p3.workingPool.pop(); }
  p3.cur = candidate;
  p3.hintVisible = false;
  p3.inputLocked = false;
  p3Render();
}

function p3Render() {
  const k = p3.cur;
  const reps = p3.reps[k.k];
  const totalDone = p3.pool.reduce((s,x)=>s+Math.min(p3.reps[x.k],P3_REPS),0);
  const totalNeeded = p3.pool.length * P3_REPS;
  const pct = Math.round((totalDone/totalNeeded)*100);
  const remaining = p3.pool.filter(x=>p3.reps[x.k]<P3_REPS).length;
  const dots = Array.from({length:P3_REPS},(_,i)=>
    `<div class="bf-rep-dot ${i<reps?'done':i===reps?'active':''}"></div>`).join('');

  // Mini set labels for context
  const setLabel = BF_SETS.findIndex(s=>s.kanji.find(x=>x.k===k.k));

  document.getElementById('bf-p3-arena').innerHTML = `
    <div class="bf-phase-banner">
      <div class="bf-phase-icon"></div>
      <div>
        <div class="bf-phase-title">Phase 3 — Cumulative Quiz</div>
        <div class="bf-phase-sub">${p3.pool.length} kanji · ${remaining} remaining · 2 reps each</div>
      </div>
      <div style="margin-left:auto;font-size:.8rem;opacity:.85">${pct}% done</div>
    </div>
    <div class="bf-prog-track">
      <div class="bf-prog-fill" style="width:${pct}%"></div>
    </div>
    <div class="bf-card" id="p3-card">
      <div class="bf-card-counter">${P3_REPS - reps} more correct to pass</div>
      <div style="position:relative;display:inline-block">
        <div class="bf-kanji-display" onclick="p3ToggleHint()">${k.k}</div>
        <div class="bf-hint-popup" id="p3-popup">
          <div class="bf-popup-meaning">${k.e}</div>
          <div class="bf-popup-reads">&#12402;: ${k.h} &#12459;: ${k.t}</div>
        </div>
      </div>
      <div class="bf-tap-hint">Tap the kanji to peek at the hint</div>
    </div>
    <div class="bf-rep-row">${dots}</div>
    <div class="bf-input-area">
      <input class="bf-input" id="p3-inp" type="text" placeholder="Type the English meaning…" autocomplete="off"
        onkeydown="if(event.key==='Enter')p3Submit()">
      <button class="bf-submit" id="p3-btn" onclick="p3Submit()">Submit</button>
      <div class="bf-feedback" id="p3-fb"></div>
    </div>
    <div style="text-align:center;margin-top:14px">
      <button class="btn-ghost" style="font-size:.8rem;padding:6px 14px" onclick="p3Abort()">&#10005; Quit &amp; return to selector</button>
    </div>`;

  document.getElementById('p3-inp').focus();
}

function p3ToggleHint() {
  p3.hintVisible = !p3.hintVisible;
  const p = document.getElementById('p3-popup');
  if(p) p.classList.toggle('show', p3.hintVisible);
}

function p3Submit() {
  if(p3.inputLocked) return;
  const inp = document.getElementById('p3-inp');
  const val = inp.value.trim().toLowerCase();
  if(!val) return;
  const k = p3.cur;
  const ok = matchAnswer(val, k.e);

  p3.inputLocked = true;
  p3.totalAttempts++;
  const fb = document.getElementById('p3-fb');
  const card = document.getElementById('p3-card');
  const btn = document.getElementById('p3-btn');
  const inpEl = document.getElementById('p3-inp');

  if(ok) {
    p3.reps[k.k]++;
    inpEl.classList.add('ok'); card.classList.add('correct-flash');
    fb.textContent = '✓ ' + k.e; fb.className = 'bf-feedback ok';
    btn.disabled = true;
    setTimeout(()=>p3Next(), 800);
  } else {
    // Track unique mistakes
    if(!p3.mistakes.find(m=>m.k===k.k)) p3.mistakes.push(k);
    inpEl.classList.add('no'); card.classList.add('wrong-flash');
    fb.innerHTML = '&#10007; Answer: <strong>' + k.e + '</strong>';
    fb.className = 'bf-feedback no';
    const pop = document.getElementById('p3-popup');
    if(pop){ pop.classList.add('show'); p3.hintVisible=true; }
    btn.textContent = 'Try again';
    btn.onclick = () => {
      inpEl.value=''; inpEl.classList.remove('no'); card.classList.remove('wrong-flash');
      fb.textContent=''; p3.inputLocked=false;
      btn.textContent='Submit'; btn.onclick=p3Submit; btn.disabled=false;
      inpEl.focus();
    };
  }
}

function p3Abort() {
  p3.active = false;
  document.getElementById('bf-p3-arena').innerHTML = '';
}

function p3ShowResults() {
  p3.active = false;
  const elapsed = Math.round((Date.now() - p3.startTime)/1000);
  const mins = Math.floor(elapsed/60), secs = elapsed%60;
  const timeStr = mins>0 ? `${mins}m ${secs}s` : `${secs}s`;
  const total = p3.pool.length;
  const correct = total; // all passed since reps completed
  const mistakes = p3.mistakes.length;
  const accuracy = p3.totalAttempts>0 ? Math.round((p3.pool.length*P3_REPS)/p3.totalAttempts*100) : 100;

  // Grade
  let grade, gradeColor;
  if(accuracy>=95){grade='S';gradeColor='var(--gold)';}
  else if(accuracy>=80){grade='A';gradeColor='var(--correct)';}
  else if(accuracy>=65){grade='B';gradeColor='var(--blue)';}
  else if(accuracy>=50){grade='C';gradeColor='var(--muted)';}
  else{grade='D';gradeColor='var(--red)';}

  const mistakesHTML = mistakes>0 ? `
    <div class="bf-p3-mistakes">
      <div class="bf-p3-mistakes-title">&#10007; Struggled with (${mistakes})</div>
      ${p3.mistakes.map(m=>`
        <div class="bf-p3-mistake-row">
          <span class="bf-p3-mistake-k">${m.k}</span>
          <div>
            <div class="bf-p3-mistake-e">${m.e}</div>
            <div class="bf-p3-mistake-r">ひ: ${m.h} · カ: ${m.t}</div>
          </div>
        </div>`).join('')}
    </div>` : `<div style="color:var(--correct);font-weight:700;margin-bottom:18px"> Perfect — no mistakes!</div>`;

  const setNames = [...p3Selected].sort((a,b)=>a-b).map(i=>`Set ${i+1}`).join(', ');

  document.getElementById('bf-p3-arena').innerHTML = `
    <div class="bf-p3-results">
      <div class="bf-p3-results-icon"></div>
      <div class="bf-p3-results-title">Phase 3 Complete</div>
      <div style="font-size:.83rem;color:var(--muted);margin-bottom:16px">Sets: ${setNames} · ${total} kanji · 2 reps each</div>
      <div class="bf-p3-stats-row">
        <div class="bf-p3-stat">
          <div class="bf-p3-stat-num" style="color:${gradeColor}">${grade}</div>
          <div class="bf-p3-stat-lbl">Grade</div>
        </div>
        <div class="bf-p3-stat">
          <div class="bf-p3-stat-num">${accuracy}%</div>
          <div class="bf-p3-stat-lbl">Accuracy</div>
        </div>
        <div class="bf-p3-stat">
          <div class="bf-p3-stat-num">${timeStr}</div>
          <div class="bf-p3-stat-lbl">Time</div>
        </div>
        <div class="bf-p3-stat">
          <div class="bf-p3-stat-num" style="color:${mistakes>0?'var(--red)':'var(--correct)'}">${mistakes}</div>
          <div class="bf-p3-stat-lbl">Mistakes</div>
        </div>
      </div>
      ${mistakesHTML}
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn-ghost" onclick="p3Abort()">Back to Selector</button>
        <button class="btn-gold" onclick="p3Launch()">Retry Same Sets</button>
      </div>
    </div>`;
}

// ═══════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════
const WBF_SETS = [
  { name:'Greetings & Basics',    theme:'Essential first phrases and manners',       words: VOCAB.filter(v=>v.c==='Greetings') },
  { name:'Pronouns & People',     theme:'Who is who — people words',                 words: VOCAB.filter(v=>v.c==='Pronouns') },
  { name:'Verbs I — Motion',      theme:'Core motion and communication verbs',       words: VOCAB.filter(v=>v.c==='Verbs I') },
  { name:'Verbs II — Daily',      theme:'Everyday action verbs',                     words: VOCAB.filter(v=>v.c==='Verbs II') },
  { name:'Verbs III — Expressive',theme:'Higher-level expressive verbs',             words: VOCAB.filter(v=>v.c==='Verbs III') },
  { name:'Verbs IV — Combat',     theme:'Fight, defend, live and die',               words: VOCAB.filter(v=>v.c==='Verbs IV') },
  { name:'Adjectives I',          theme:'Size, speed and quality',                   words: VOCAB.filter(v=>v.c==='Adjectives I') },
  { name:'Adjectives II',         theme:'Feeling, appearance and vibe',              words: VOCAB.filter(v=>v.c==='Adjectives II') },
  { name:'Time & Place',          theme:'When and where — navigate the world',       words: VOCAB.filter(v=>v.c==='Time & Place') },
  { name:'Questions',             theme:'Ask anything — the question words',         words: VOCAB.filter(v=>v.c==='Questions') },
  { name:'Emotions',              theme:'Express your inner world',                  words: VOCAB.filter(v=>v.c==='Emotions') },
  { name:'Nature & Weather',      theme:'Sky, sea, mountain, wind and rain',         words: VOCAB.filter(v=>v.c==='Nature') },
  { name:'Food & Drink',          theme:'Essential food and drink vocabulary',       words: VOCAB.filter(v=>v.c==='Food & Drink') },
  { name:'Body & Health',         theme:'Body parts, health and feelings',           words: VOCAB.filter(v=>v.c==='Body & Health') },
  { name:'Numbers & Counters',    theme:'Count things the Japanese way',             words: VOCAB.filter(v=>v.c==='Numbers') },
  { name:'Home & Daily Life',     theme:'Around the house and daily objects',        words: VOCAB.filter(v=>v.c==='Daily Life') },
  { name:'Transport & City',      theme:'Getting around town',                       words: VOCAB.filter(v=>v.c==='Transport') },
  { name:'Game & VN I — Combat',  theme:'Battle, weapons, heroes and enemies',      words: VOCAB.filter(v=>v.c==='Game & VN I') },
  { name:'Game & VN II — Story',  theme:'Fate, bonds, hope, love and despair',      words: VOCAB.filter(v=>v.c==='Game & VN II') },
  { name:'Game & VN III — World', theme:'Kingdoms, dungeons, quests and bosses',    words: VOCAB.filter(v=>v.c==='Game & VN III') },
  { name:'World & Settings',      theme:'Towns, castles, islands and harbours',     words: VOCAB.filter(v=>v.c==='World') },
  { name:'School & Study',       theme:'Classroom, exams, clubs and language',        words: VOCAB.filter(v=>v.c==='School') },
  { name:'Family',                theme:'Parents, siblings and relatives',              words: VOCAB.filter(v=>v.c==='Family') },
  { name:'Colours',               theme:'The full colour palette in Japanese',         words: VOCAB.filter(v=>v.c==='Colours') },
  { name:'Verbs V — Everyday',    theme:'Play, work, rest, exist, move and change',    words: VOCAB.filter(v=>v.c==='Verbs V') },
  { name:'Game & VN IV — Isekai', theme:'Reincarnation, magic power, legends, heroes', words: VOCAB.filter(v=>v.c==='Game & VN IV') },
  { name:'VN Adjectives',         theme:'The emotional vocabulary of visual novels',   words: VOCAB.filter(v=>v.c==='VN Adjectives') },
  { name:'RPG Systems',           theme:'Party, guild, class, skills and rewards',     words: VOCAB.filter(v=>v.c==='RPG Systems') },
];

// ═══════════════════════════════════════
//  VOCABULARY REFERENCE
// ═══════════════════════════════════════
let vocabCatFilter = 'All';
function buildVocab() {
  const searchEl = document.getElementById('vocab-search');
  const search = searchEl ? searchEl.value.toLowerCase() : '';
  const cats = ['All', ...new Set(VOCAB.map(v=>v.c))];
  const filterEl = document.getElementById('vocab-cat-filters');
  if(filterEl) filterEl.innerHTML = cats.map(c=>
    `<button class="tog ${c===vocabCatFilter?'active':''}" style="padding:4px 12px;font-size:.78rem" onclick="vocabSetCat('${c.replace(/'/g,"\\'")}')">${c}</button>`
  ).join('');
  let rows = VOCAB;
  if(vocabCatFilter !== 'All') rows = rows.filter(v=>v.c===vocabCatFilter);
  if(search) rows = rows.filter(v=>
    v.e.toLowerCase().includes(search)||v.r.toLowerCase().includes(search)||
    v.jp.includes(search)||v.h.includes(search)
  );
  const countEl = document.getElementById('vocab-count');
  if(countEl) countEl.textContent = `Showing ${rows.length} of ${VOCAB.length} words`;
  const tbody = document.getElementById('vocab-tbody');
  if(tbody) tbody.innerHTML = rows.map(v=>`<tr>
    <td data-label="Japanese"><span class="vocab-jp">${v.jp}</span></td>
    <td data-label="Hiragana"><span class="vocab-hira">${v.h}</span></td>
    <td data-label="Katakana"><span class="vocab-kata">${v.t}</span></td>
    <td data-label="Romaji"><span class="vocab-roma">${v.r}</span></td>
    <td data-label="English"><span class="vocab-en">${v.e}</span></td>
    <td data-label="Category"><span class="vocab-cat-badge">${v.c}</span></td>
  </tr>`).join('');
}
function vocabSetCat(c) { vocabCatFilter=c; buildVocab(); }

// ═══════════════════════════════════════
//  WORD BRUTE FORCE
// ═══════════════════════════════════════
const WBF_REPS = 3, WP3_REPS = 2;
let wbf = {
  setIdx:-1, phase:null, famIdx:0, drillPool:[], drillCur:null,
  drillReps:{}, hintVisible:false, inputLocked:false,
  setStatus: WBF_SETS.map(()=>({ phase:'untouched', mastered:false }))
};
let wp3Selected = new Set([0]);
let wp3 = { active:false,pool:[],cur:null,reps:{},workingPool:[],hintVisible:false,inputLocked:false,mistakes:[],startTime:null,totalAttempts:0 };

function buildWBFSetList() {
  const list = document.getElementById('wbf-set-list'); if(!list) return;
  list.innerHTML = WBF_SETS.map((s,i)=>{
    const st=wbf.setStatus[i];
    const pips=s.words.map((_,j)=>{ const r=wbf.drillReps[s.words[j].jp]||0; const cls=st.mastered||r>=WBF_REPS?'done':(wbf.setIdx===i?'active':''); return `<span class="bf-pip ${cls}"></span>`; }).join('');
    const statusText=st.mastered?'✓ Mastered':st.phase==='drill'?'Drilling…':st.phase==='familiarise'?'Familiarising…':'Not started';
    return `<div class="bf-set-card ${wbf.setIdx===i?'active-set':''} ${st.mastered?'done':''}" style="${wbf.setIdx===i?'border-color:var(--wbf);background:color-mix(in srgb, var(--wbf) 5%, transparent)':''}" onclick="wbfSelectSet(${i})">
      <div class="bf-set-num">Set ${i+1} · ${s.words.length} words</div>
      <div class="bf-set-name">${s.name}</div>
      <div class="bf-set-kanji" style="font-family:'Zen Kaku Gothic New',sans-serif;font-size:.76rem;color:var(--muted)">${s.words.slice(0,5).map(w=>w.jp).join(' · ')}…</div>
      <div class="bf-set-status"><div class="bf-pips">${pips}</div><span style="font-size:.68rem;color:var(--muted)">${statusText}</span></div>
    </div>`;
  }).join('');
  wp3BuildChips();
}

function wbfSelectSet(idx) {
  wbf.setIdx=idx; wbf.hintVisible=false;
  const st=wbf.setStatus[idx];

  
  if(st.mastered && wbf.redrilling) {
    wbf.redrilling = false;
    wbf.setStatus[idx].phase = 'untouched';
    WBF_SETS[idx].words.forEach(w=>{wbf.drillReps[w.jp]=0;});
    wbfStartFamiliarise(idx);
    buildWBFSetList();
    return;
  }
  
  if(st.mastered) {
    wbfStartDrill(idx); return;
  }
  if(st.phase==='drill') {
    wbfStartDrill(idx); return;
  }
  wbfStartFamiliarise(idx);
  buildWBFSetList();

}

// Phase 1
function wbfStartFamiliarise(idx){ wbf.phase='familiarise'; wbf.famIdx=0; wbf.setStatus[idx].phase='familiarise'; wbfRenderFamiliarise(); }
function wbfRenderFamiliarise() {
  const set=WBF_SETS[wbf.setIdx]; const w=set.words[wbf.famIdx]; const pct=Math.round((wbf.famIdx/set.words.length)*100);
  document.getElementById('wbf-arena').innerHTML=`
    <div class="bf-phase-banner">
      <div class="bf-phase-icon"></div>
      <div><div class="bf-phase-title">Phase 1 — Familiarise</div><div class="bf-phase-sub">Study each word with all four forms shown.</div></div>
    </div>
    <div class="bf-prog-track"><div class="bf-prog-fill" style="width:${pct}%"></div></div>
    <div class="bf-card reveal-mode" style="border-color:var(--wbf)">
      <div class="bf-card-counter">${wbf.famIdx+1} / ${set.words.length}</div>
      <div style="font-family:'Noto Serif JP',serif;font-size:2.2rem;margin-bottom:12px;color:var(--ink)">${w.jp}</div>
      <div class="bf-hint-box" style="background:color-mix(in srgb, var(--wbf) 8%, transparent);border-color:color-mix(in srgb, var(--wbf) 25%, transparent)">
        <div style="font-size:.84rem;color:var(--wbf);margin-bottom:4px;font-family:'Noto Serif JP',serif">ひ: ${w.h} &nbsp;|&nbsp; カ: ${w.t}</div>
        <div style="font-size:.82rem;color:var(--muted);font-style:italic">Romaji: ${w.r}</div>
        <div style="font-size:1.15rem;font-weight:700;color:var(--ink);margin-top:8px">${w.e}</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:14px">
      ${wbf.famIdx>0?`<button class="btn-ghost" onclick="wbfFamNav(-1)">← Back</button>`:''}
      ${wbf.famIdx<set.words.length-1
        ?`<button class="btn-ink" onclick="wbfFamNav(1)" style="background:var(--wbf);color:var(--wbf-fg)">Next →</button>`
        :`<button class="btn-ink" onclick="wbfTransitionToDrill()" style="background:var(--wbf);color:var(--wbf-fg)">Start Drilling </button>`}
    </div>`;
}
function wbfFamNav(dir){ wbf.famIdx=Math.max(0,Math.min(WBF_SETS[wbf.setIdx].words.length-1,wbf.famIdx+dir)); wbfRenderFamiliarise(); }

// Phase 2
function wbfTransitionToDrill(){ wbf.setStatus[wbf.setIdx].phase='drill'; wbfStartDrill(wbf.setIdx); }
function wbfStartDrill(idx){
  wbf.phase='drill'; wbf.setIdx=idx;
  WBF_SETS[idx].words.forEach(w=>{ if(!(w.jp in wbf.drillReps)) wbf.drillReps[w.jp]=0; });
  wbf.drillPool=shuffle(WBF_SETS[idx].words.filter(w=>wbf.drillReps[w.jp]<WBF_REPS));
  wbfNextDrill();
}
function wbfNextDrill(){
  const set=WBF_SETS[wbf.setIdx]; const remaining=set.words.filter(w=>wbf.drillReps[w.jp]<WBF_REPS);
  if(!remaining.length){wbfMarkMastered(wbf.setIdx);return;}
  if(!wbf.drillPool.length) wbf.drillPool=shuffle([...remaining]);
  wbf.drillCur=wbf.drillPool.pop(); wbf.hintVisible=false; wbf.inputLocked=false; wbfRenderDrill();
}
function wbfRenderDrill(){
  const set=WBF_SETS[wbf.setIdx]; const w=wbf.drillCur; const reps=wbf.drillReps[w.jp]||0;
  const totalDone=set.words.reduce((s,x)=>s+Math.min(wbf.drillReps[x.jp]||0,WBF_REPS),0);
  const pct=Math.round((totalDone/(set.words.length*WBF_REPS))*100);
  const dots=Array.from({length:WBF_REPS},(_,i)=>`<div class="bf-rep-dot ${i<reps?'done':i===reps?'active':''}" style="${i===reps?'background:var(--wbf);border-color:var(--wbf)':''}"></div>`).join('');
  const summary=set.words.map(x=>{ const r=wbf.drillReps[x.jp]||0; return `<span style="font-size:.76rem;font-family:'Noto Serif JP',serif;color:${r>=WBF_REPS?'var(--correct)':x.jp===w.jp?'var(--wbf)':'var(--muted)'}">${x.jp}</span>`; }).join(' ');
  document.getElementById('wbf-arena').innerHTML=`
    <div class="bf-phase-banner">
      <div class="bf-phase-icon"></div>
      <div><div class="bf-phase-title">Phase 2 — Drill</div><div class="bf-phase-sub">Hint hidden. Tap the word to peek. Type the English meaning.</div></div>
    </div>
    <div class="bf-prog-track"><div class="bf-prog-fill" style="width:${pct}%"></div></div>
    <div style="text-align:center;font-size:.82rem;color:var(--muted);margin-bottom:10px">${summary}</div>
    <div class="bf-card" id="wbf-main-card">
      <div class="bf-card-counter">${WBF_REPS-reps} more correct to pass</div>
      <div style="position:relative;display:inline-block">
        <div style="font-family:'Noto Serif JP',serif;font-size:2.2rem;cursor:pointer;user-select:none" onclick="wbfToggleHint()">${w.jp}</div>
        <div class="wbf-hint-popup" id="wbf-popup">
          <div class="wbf-popup-en">${w.e}</div>
          <div class="wbf-popup-reads">ひ: ${w.h} · カ: ${w.t} · ${w.r}</div>
        </div>
      </div>
      <div class="bf-tap-hint">Tap the word to peek at the hint</div>
    </div>
    <div class="bf-rep-row">${dots}</div>
    <div class="bf-input-area">
      <input class="bf-input" id="wbf-inp" type="text" placeholder="Type the English meaning…" autocomplete="off" onkeydown="if(event.key==='Enter')wbfSubmit()">
      <button class="bf-submit" id="wbf-sub-btn" onclick="wbfSubmit()" style="background:var(--wbf);color:var(--wbf-fg)">Submit</button>
      <div class="bf-feedback" id="wbf-fb"></div>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
      <button class="btn-ghost" style="font-size:.82rem;padding:7px 14px" onclick="wbfStartFamiliarise(wbf.setIdx)">← Back to Study</button>
    </div>`;
  document.getElementById('wbf-inp').focus();
}
function wbfToggleHint(){ wbf.hintVisible=!wbf.hintVisible; const p=document.getElementById('wbf-popup'); if(p) p.classList.toggle('show',wbf.hintVisible); }
function wbfSubmit(){
  if(wbf.inputLocked) return;
  const inp=document.getElementById('wbf-inp'); const val=inp.value.trim().toLowerCase(); if(!val) return;
  const w=wbf.drillCur; const ok = matchAnswer(val, w.e);
  wbf.inputLocked=true;
  const fb=document.getElementById('wbf-fb'),card=document.getElementById('wbf-main-card'),
        inpEl=document.getElementById('wbf-inp'),btn=document.getElementById('wbf-sub-btn');
  if(ok){
    wbf.drillReps[w.jp]=(wbf.drillReps[w.jp]||0)+1; inpEl.classList.add('ok'); card.classList.add('correct-flash');
    fb.textContent='✓ '+w.e; fb.className='bf-feedback ok'; btn.disabled=true;
    setTimeout(()=>wbfNextDrill(),850);
  } else {
    inpEl.classList.add('no'); card.classList.add('wrong-flash');
    fb.innerHTML='✗ Answer: <strong>'+w.e+'</strong> ('+w.r+')'; fb.className='bf-feedback no';
    const p=document.getElementById('wbf-popup'); if(p){p.classList.add('show');wbf.hintVisible=true;}
    btn.textContent='Try again';
    btn.onclick=()=>{inpEl.value='';inpEl.classList.remove('no');card.classList.remove('wrong-flash');
      fb.textContent='';wbf.inputLocked=false;btn.textContent='Submit';btn.onclick=wbfSubmit;btn.disabled=false;inpEl.focus();};
  }
}

// Mastered
function wbfMarkMastered(idx){
  wbf.setStatus[idx].mastered=true; wbf.setStatus[idx].phase='mastered';
  buildWBFSetList();
  const set=WBF_SETS[idx]; const nextIdx=idx+1<WBF_SETS.length?idx+1:-1;
  document.getElementById('wbf-arena').innerHTML=`
    <div class="bf-complete" style="border-color:var(--wbf)">
      <div class="bf-complete-icon"></div>
      <div class="bf-complete-title">Set ${idx+1} Mastered!</div>
      <div class="bf-complete-sub">All <strong>${set.words.length} words</strong> in "<em>${set.name}</em>" drilled to completion.<br>Try Phase 3 below to test across multiple sets.</div>
      <div class="bf-complete-actions">
        <button class="btn-ghost" onclick="wbf.redrilling=true;wbfSelectSet(${idx})">Re-drill this set</button>
        ${nextIdx>=0?`<button class="btn-ink" style="background:var(--wbf);color:var(--wbf-fg)" onclick="wbfSelectSet(${nextIdx})">Next: Set ${nextIdx+1} →</button>`:''}
        <button class="btn-teal" onclick="document.getElementById('wbf-p3-panel').scrollIntoView({behavior:'smooth'})">Go to Phase 3 ↓</button>
      </div>
    </div>`;
}

// Word Phase 3
function wp3BuildChips(){
  const grid=document.getElementById('wbf-p3-chips'); if(!grid) return;
  grid.innerHTML=WBF_SETS.map((s,i)=>{
    const sel=wp3Selected.has(i); const mastered=wbf.setStatus[i].mastered;
    return `<div class="bf-p3-chip ${sel?'selected':''}" style="${sel?'border-color:var(--wbf);background:color-mix(in srgb, var(--wbf) 10%, transparent)':''}" onclick="wp3ToggleChip(${i})">
      <span class="chip-dot" style="${sel?'background:var(--wbf)':''}"></span>
      <span class="bf-p3-chip-name">Set ${i+1}</span>
      <span class="bf-p3-chip-count">${s.words.length}w</span>
      ${mastered?'<span style="font-size:.65rem;color:var(--correct);font-weight:700">✓</span>':''}
    </div>`;
  }).join('');
  wp3UpdateCount();
}
function wp3ToggleChip(i){ if(wp3Selected.has(i)){if(wp3Selected.size===1)return;wp3Selected.delete(i);}else wp3Selected.add(i); wp3BuildChips(); }
function wp3SelectAll(){ WBF_SETS.forEach((_,i)=>wp3Selected.add(i)); wp3BuildChips(); }
function wp3SelectNone(){ wp3Selected=new Set([0]); wp3BuildChips(); }
function wp3SelectMastered(){ const m=WBF_SETS.map((_,i)=>i).filter(i=>wbf.setStatus[i].mastered); if(!m.length)return; wp3Selected=new Set(m); wp3BuildChips(); }
function wp3UpdateCount(){
  const total=[...wp3Selected].reduce((s,i)=>s+WBF_SETS[i].words.length,0);
  const el=document.getElementById('wbf-p3-count'),btn=document.getElementById('wbf-p3-launch-btn');
  if(el) el.textContent=`${total} words selected across ${wp3Selected.size} set${wp3Selected.size!==1?'s':''}`;
  if(btn) btn.disabled=total===0;
}
function wp3Launch(){
  let allWords=[]; [...wp3Selected].sort((a,b)=>a-b).forEach(i=>{ WBF_SETS[i].words.forEach(w=>{if(!allWords.find(x=>x.jp===w.jp))allWords.push(w);}); });
  wp3={active:true,pool:allWords,cur:null,reps:{},workingPool:[],hintVisible:false,inputLocked:false,mistakes:[],startTime:Date.now(),totalAttempts:0};
  allWords.forEach(w=>{wp3.reps[w.jp]=0;}); wp3.workingPool=shuffle([...allWords]);
  document.getElementById('wbf-p3-arena').scrollIntoView({behavior:'smooth',block:'start'}); wp3Next();
}
function wp3Next(){
  const remaining=wp3.pool.filter(w=>wp3.reps[w.jp]<WP3_REPS);
  if(!remaining.length){wp3ShowResults();return;}
  if(!wp3.workingPool.length) wp3.workingPool=shuffle([...remaining]);
  let c; while(wp3.workingPool.length){c=wp3.workingPool.pop();if(wp3.reps[c.jp]<WP3_REPS)break;c=null;}
  if(!c){wp3.workingPool=shuffle([...remaining]);c=wp3.workingPool.pop();}
  wp3.cur=c; wp3.hintVisible=false; wp3.inputLocked=false; wp3Render();
}
function wp3Render(){
  const w=wp3.cur; const reps=wp3.reps[w.jp];
  const totalDone=wp3.pool.reduce((s,x)=>s+Math.min(wp3.reps[x.jp],WP3_REPS),0);
  const pct=Math.round((totalDone/(wp3.pool.length*WP3_REPS))*100);
  const remaining=wp3.pool.filter(x=>wp3.reps[x.jp]<WP3_REPS).length;
  const dots=Array.from({length:WP3_REPS},(_,i)=>`<div class="bf-rep-dot ${i<reps?'done':i===reps?'active':''}" style="${i===reps?'background:var(--wbf);border-color:var(--wbf)':''}"></div>`).join('');
  document.getElementById('wbf-p3-arena').innerHTML=`
    <div class="bf-phase-banner">
      <div class="bf-phase-icon"></div>
      <div><div class="bf-phase-title">Phase 3 — Word Cumulative Quiz</div><div class="bf-phase-sub">${wp3.pool.length} words · ${remaining} remaining · 2 reps each</div></div>
      <div style="margin-left:auto;font-size:.8rem;opacity:.85">${pct}%</div>
    </div>
    <div class="bf-prog-track"><div class="bf-prog-fill" style="width:${pct}%"></div></div>
    <div class="bf-card" id="wp3-card">
      <div class="bf-card-counter">${WP3_REPS-reps} more correct to pass</div>
      <div style="position:relative;display:inline-block">
        <div style="font-family:'Noto Serif JP',serif;font-size:2.2rem;cursor:pointer;user-select:none" onclick="wp3ToggleHint()">${w.jp}</div>
        <div class="wbf-hint-popup" id="wp3-popup">
          <div class="wbf-popup-en">${w.e}</div>
          <div class="wbf-popup-reads">ひ: ${w.h} · カ: ${w.t} · ${w.r}</div>
        </div>
      </div>
      <div class="bf-tap-hint">Tap the word to peek</div>
    </div>
    <div class="bf-rep-row">${dots}</div>
    <div class="bf-input-area">
      <input class="bf-input" id="wp3-inp" type="text" placeholder="Type the English meaning…" autocomplete="off" onkeydown="if(event.key==='Enter')wp3Submit()">
      <button class="bf-submit" id="wp3-btn" onclick="wp3Submit()" style="background:var(--wbf);color:var(--wbf-fg)">Submit</button>
      <div class="bf-feedback" id="wp3-fb"></div>
    </div>
    <div style="text-align:center;margin-top:12px">
      <button class="btn-ghost" style="font-size:.8rem;padding:6px 14px" onclick="wp3Abort()">✕ Quit</button>
    </div>`;
  document.getElementById('wp3-inp').focus();
}
function wp3ToggleHint(){ wp3.hintVisible=!wp3.hintVisible; const p=document.getElementById('wp3-popup'); if(p) p.classList.toggle('show',wp3.hintVisible); }
function wp3Submit(){
  if(wp3.inputLocked) return;
  const inp=document.getElementById('wp3-inp'); const val=inp.value.trim().toLowerCase(); if(!val) return;
  const w=wp3.cur; const ok = matchAnswer(val, w.e);
  wp3.inputLocked=true; wp3.totalAttempts++;
  const fb=document.getElementById('wp3-fb'),card=document.getElementById('wp3-card'),
        btn=document.getElementById('wp3-btn'),inpEl=document.getElementById('wp3-inp');
  if(ok){
    wp3.reps[w.jp]++; inpEl.classList.add('ok'); card.classList.add('correct-flash');
    fb.textContent='✓ '+w.e; fb.className='bf-feedback ok'; btn.disabled=true;
    setTimeout(()=>wp3Next(),800);
  } else {
    if(!wp3.mistakes.find(m=>m.jp===w.jp)) wp3.mistakes.push(w);
    inpEl.classList.add('no'); card.classList.add('wrong-flash');
    fb.innerHTML='✗ Answer: <strong>'+w.e+'</strong> ('+w.r+')'; fb.className='bf-feedback no';
    const p=document.getElementById('wp3-popup'); if(p){p.classList.add('show');wp3.hintVisible=true;}
    btn.textContent='Try again';
    btn.onclick=()=>{inpEl.value='';inpEl.classList.remove('no');card.classList.remove('wrong-flash');fb.textContent='';wp3.inputLocked=false;btn.textContent='Submit';btn.onclick=wp3Submit;btn.disabled=false;inpEl.focus();};
  }
}
function wp3Abort(){ wp3.active=false; document.getElementById('wbf-p3-arena').innerHTML=''; }
function wp3ShowResults(){
  wp3.active=false;
  const elapsed=Math.round((Date.now()-wp3.startTime)/1000);
  const mins=Math.floor(elapsed/60),secs=elapsed%60;
  const timeStr=mins>0?`${mins}m ${secs}s`:`${secs}s`;
  const accuracy=wp3.totalAttempts>0?Math.round((wp3.pool.length*WP3_REPS)/wp3.totalAttempts*100):100;
  const mistakes=wp3.mistakes.length;
  let grade,gc; if(accuracy>=95){grade='S';gc='var(--gold)';}else if(accuracy>=80){grade='A';gc='var(--correct)';}else if(accuracy>=65){grade='B';gc='var(--blue)';}else if(accuracy>=50){grade='C';gc='var(--muted)';}else{grade='D';gc='var(--red)';}
  const mHTML=mistakes>0?`<div class="bf-p3-mistakes"><div class="bf-p3-mistakes-title">✗ Struggled with (${mistakes})</div>${wp3.mistakes.map(m=>`<div class="bf-p3-mistake-row"><span style="font-family:'Noto Serif JP',serif;font-size:1rem;min-width:90px">${m.jp}</span><div><div class="bf-p3-mistake-e">${m.e}</div><div class="bf-p3-mistake-r">${m.r} · ひ: ${m.h}</div></div></div>`).join('')}</div>`:'<div style="color:var(--correct);font-weight:700;margin-bottom:18px"> Perfect — no mistakes!</div>';
  const setNames=[...wp3Selected].sort((a,b)=>a-b).map(i=>`Set ${i+1}`).join(', ');
  document.getElementById('wbf-p3-arena').innerHTML=`
    <div class="bf-p3-results" style="border-color:var(--wbf)">
      <div class="bf-p3-results-icon"></div>
      <div class="bf-p3-results-title">Word Phase 3 Complete</div>
      <div style="font-size:.83rem;color:var(--muted);margin-bottom:16px">Sets: ${setNames} · ${wp3.pool.length} words</div>
      <div class="bf-p3-stats-row">
        <div class="bf-p3-stat"><div class="bf-p3-stat-num" style="color:${gc}">${grade}</div><div class="bf-p3-stat-lbl">Grade</div></div>
        <div class="bf-p3-stat"><div class="bf-p3-stat-num">${accuracy}%</div><div class="bf-p3-stat-lbl">Accuracy</div></div>
        <div class="bf-p3-stat"><div class="bf-p3-stat-num">${timeStr}</div><div class="bf-p3-stat-lbl">Time</div></div>
        <div class="bf-p3-stat"><div class="bf-p3-stat-num" style="color:${mistakes>0?'var(--red)':'var(--correct)'}">${mistakes}</div><div class="bf-p3-stat-lbl">Mistakes</div></div>
      </div>
      ${mHTML}
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn-ghost" onclick="wp3Abort()">Back to Selector</button>
        <button class="btn-teal" onclick="wp3Launch()">Retry Same Sets</button>
      </div>
    </div>`;
}

function shuffle(a) { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

// ── INIT ──
buildChart('hiragana');
initQuiz();
buildBFSetList();
p3BuildChips();
buildVocab();
buildWBFSetList();
wp3BuildChips();
// ── Answer matching (typed meanings) ──
function normAns(s){return s.toLowerCase().replace(/\(.*?\)/g,' ').replace(/[^a-z0-9' ]+/g,' ').replace(/\b(to|a|an|the)\b/g,' ').replace(/\s+/g,' ').trim();}
function editDist(a,b){const m=[];for(let i=0;i<=a.length;i++)m[i]=[i];for(let j=1;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length];}
function matchAnswer(input,meaning){
  const v=normAns(input); if(!v) return false;
  return meaning.split('/').map(normAns).filter(Boolean).some(alt=>alt===v||(v.length>=4&&alt.split(' ').includes(v))||(v.length>=5&&editDist(alt,v)<=1));
}

// ── Theme ──
(function(){
  const btn=document.getElementById('themeToggle');
  const sync=()=>{btn.textContent=document.documentElement.classList.contains('dark')?'Light':'Dark';};
  sync();
  window.toggleTheme=function(){
    const d=document.documentElement.classList.toggle('dark');
    try{localStorage.setItem('kd-theme',d?'dark':'light');}catch(e){}
    sync();
  };
})();
