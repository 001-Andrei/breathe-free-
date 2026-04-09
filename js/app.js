
// ═══ APP ROUTER ═══
const App = {
  currentScreen: null,
  prevScreen: null,

  navigate(screen, params) {
    params = params || {};
    this.prevScreen = this.currentScreen;
    this.currentScreen = screen;
    window.scrollTo(0,0);
    var fab = document.getElementById('sos-btn');
    if(fab) fab.classList.toggle('hd', ['welcome','breathing','urge-help'].includes(screen));
    var tabbar = document.getElementById('tabbar');
    var tabScreens = ['home','levels','tracker','journal','achievements'];
    if(tabbar) tabbar.classList.toggle('hd', !tabScreens.includes(screen));
    this._updateTabbar(screen);
    var app = document.getElementById('app');
    var data = Storage.get() || Storage.init();
    if(!data.user.setupComplete && screen !== 'welcome') {
      this.currentScreen = 'welcome';
      Screens.welcome(app, data);
      return;
    }
    switch(screen) {
      case 'welcome':      Screens.welcome(app, data); break;
      case 'home':         Screens.home(app, data); break;
      case 'levels':       Screens.levels(app, data); break;
      case 'level':        Screens.levelDetail(app, data, params.id); break;
      case 'exercise':     Screens.exercise(app, data, params.id); break;
      case 'urge-help':    Screens.urgeHelp(app, data); break;
      case 'tracker':      Screens.tracker(app, data); break;
      case 'breathing':    Screens.breathing(app, data); break;
      case 'health':       Screens.health(app, data); break;
      case 'savings':      Screens.savings(app, data); break;
      case 'achievements': Screens.achievements(app, data); break;
      case 'journal':      Screens.journal(app, data); break;
      case 'settings':     Screens.settings(app, data); break;
      default:             Screens.home(app, data);
    }
  },

  back() { this.navigate(this.prevScreen || 'home'); },

  _updateTabbar(active) {
    document.querySelectorAll('.tab-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.screen === active);
    });
  },

  init() {
    var data = Storage.init();
    var screen = data.user.setupComplete ? 'home' : 'welcome';
    var hash = window.location.hash.replace('#','');
    if(hash) screen = hash;
    this.navigate(screen);
    var newAchs = Storage.checkAndUnlockAchievements();
    newAchs.forEach(function(a){ Toast.show(a.emoji + ' ' + a.name + ' — достижение!', 'success'); });
    if('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function(){});
    }
  }
};

const Toast = {
  show(msg, type, duration) {
    duration = duration || 3000;
    var c = document.getElementById('toast-container');
    if(!c) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (type||'');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function(){ if(t.parentNode) t.remove(); }, duration);
  }
};

function fmtMins(m) {
  if(m<=0) return '0 мин';
  if(m<60) return m + ' мин';
  if(m<1440) return Math.floor(m/60) + ' ч ' + (m%60) + ' мин';
  if(m<43200) return Math.floor(m/1440) + ' д ' + Math.floor((m%1440)/60) + ' ч';
  return Math.floor(m/43200) + ' мес';
}
function fmtDays(d) {
  if(d===0) return '0 дней';
  if(d===1) return '1 день';
  if(d<5) return d + ' дня';
  return d + ' дней';
}
function today() { return new Date().toISOString().split('T')[0]; }
function confetti(elId) {
  var el = typeof elId==='string' ? document.getElementById(elId) : elId;
  if(!el) return;
  for(var i=0;i<12;i++){
    var s=document.createElement('span');
    var colors=['#4CAF82','#5B8DEF','#F5A623','#E85D5D','#8B6FC0'];
    s.style.cssText='position:absolute;width:7px;height:7px;border-radius:50%;pointer-events:none;'
      +'background:'+colors[i%5]+';left:'+(10+Math.random()*80)+'%;top:50%;'
      +'animation:confetti .9s ease forwards '+(Math.random()*.3)+'s;';
    el.style.position='relative';el.appendChild(s);
    setTimeout(function(){if(s.parentNode)s.remove();},1400);
  }
}

document.addEventListener('DOMContentLoaded', function() { App.init(); });


// ═══ SCREENS ═══
const Screens = {

welcome(el, data) {
  let step = 0;
  let draft = Object.assign({}, data.user);
  const steps = 6;
  function dots(cur) {
    return Array.from({length:steps}, (_,i) =>
      '<div class="onboard-dot' + (i===cur?' on':'') + '"></div>'
    ).join('');
  }
  function render(s) {
    step = s;
    const views = [s0,s1,s2,s3,s4,s5];
    el.innerHTML = '<div class="screen screen-full" style="padding-top:32px"><div class="onboard-dots">'
      + dots(s) + '</div>' + views[s]() + '</div>';
    bindStep(s);
  }
  function s0() {
    return '<div style="text-align:center;padding:20px 0">'
      + '<div style="font-size:64px;margin-bottom:16px">🌿</div>'
      + '<h1 style="font-size:28px;font-weight:800;margin-bottom:10px;line-height:1.2">Дыши Свободно</h1>'
      + '<p style="color:var(--text2);font-size:16px;line-height:1.6;margin-bottom:40px">'
      + 'Твой путь к свободе от никотина.<br>'
      + 'Это приложение не будет заставлять тебя бороться с тягой. '
      + 'Оно научит тебя <b>принимать её</b> — и всё равно выбирать свободу.</p>'
      + '<button class="btn-primary" onclick="window._ws(1)">Начать →</button></div>';
  }
  function s1() {
    var devs = [['pod','Pod-система','💨'],['mod','Мод','⚙️'],['disposable','Одноразка','🗑'],['other','Другое','❓']];
    return '<h2 style="font-size:22px;font-weight:800;margin-bottom:6px">Расскажи о себе</h2>'
      + '<p style="color:var(--text2);font-size:14px;margin-bottom:24px">Данные хранятся только на устройстве</p>'
      + '<div class="input-group"><label class="input-label">КАК ТЕБЯ ЗОВУТ?</label>'
      + '<input class="input" id="inp-name" placeholder="Имя" value="' + (draft.name||'') + '"></div>'
      + '<div class="input-group"><label class="input-label">ТИП УСТРОЙСТВА</label>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      + devs.map(function(d){ return '<button class="chip _dt'+(draft.deviceType===d[0]?' on':'')+'" data-val="'+d[0]+'">'+d[2]+' '+d[1]+'</button>'; }).join('')
      + '</div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'
      + '<div><label class="input-label">ЗАТЯЖЕК/ДЕНЬ</label><input class="input" id="inp-puffs" type="number" inputmode="numeric" value="'+(draft.dailyPuffs||200)+'"></div>'
      + '<div><label class="input-label">РАСХОДЫ ₽/ДЕНЬ</label><input class="input" id="inp-cost" type="number" inputmode="numeric" value="'+(draft.dailyCost||200)+'"></div>'
      + '</div>'
      + '<div class="input-group"><label class="input-label">КРЕПОСТЬ: <span id="nic-val">'+(draft.nicotineStrength||20)+'</span> мг/мл</label>'
      + '<input type="range" min="0" max="50" value="'+(draft.nicotineStrength||20)+'" oninput="document.getElementById('nic-val').textContent=this.value;window._dNic=+this.value"></div>'
      + '<button class="btn-primary" onclick="window._ws(2)">Продолжить →</button>';
  }
  function s2() {
    return '<h2 style="font-size:22px;font-weight:800;margin-bottom:6px">Метод отказа</h2>'
      + '<p style="color:var(--text2);font-size:14px;margin-bottom:24px">Оба подхода работают</p>'
      + '<div class="method-card _method'+(draft.quitMethod==='cold'?' on':'')+'" data-val="cold" style="margin-bottom:12px">'
      + '<div style="font-size:24px;margin-bottom:6px">🧊</div>'
      + '<div style="font-weight:700;font-size:16px;margin-bottom:4px">Резкий отказ</div>'
      + '<div style="color:var(--text2);font-size:14px">Выбрать дату и полностью прекратить.</div></div>'
      + '<div class="method-card _method'+(draft.quitMethod!=='cold'?' on':'')+'" data-val="gradual" style="margin-bottom:24px">'
      + '<div style="font-size:24px;margin-bottom:6px">📉</div>'
      + '<div style="font-weight:700;font-size:16px;margin-bottom:4px">Постепенное снижение</div>'
      + '<div style="color:var(--text2);font-size:14px">Снижать дозу и количество затяжек по плану.</div></div>'
      + '<button class="btn-primary" onclick="window._ws(3)">Продолжить →</button>';
  }
  function s3() {
    var now = new Date();
    var rec = new Date(now); rec.setDate(rec.getDate()+7);
    var recStr = rec.toISOString().split('T')[0];
    var minStr = now.toISOString().split('T')[0];
    return '<h2 style="font-size:22px;font-weight:800;margin-bottom:6px">Дата отказа</h2>'
      + '<p style="color:var(--text2);font-size:14px;margin-bottom:24px">1–2 недели подготовки повышают шансы</p>'
      + '<div class="input-group"><label class="input-label">ДАТА ОТКАЗА</label>'
      + '<input class="input" id="inp-date" type="date" value="'+(draft.quitDate||recStr)+'" min="'+minStr+'"></div>'
      + '<div class="card" style="background:var(--green-light);border-color:rgba(76,175,130,.2);margin-bottom:24px">'
      + '<div style="color:var(--green);font-size:14px">💡 Рекомендуем через 7 дней — используй время для прохождения уровней 1–4.</div></div>'
      + '<button class="btn-primary" onclick="window._ws(4)">Продолжить →</button>';
  }
  function s4() {
    return '<h2 style="font-size:22px;font-weight:800;margin-bottom:6px">Твои ценности</h2>'
      + '<p style="color:var(--text2);font-size:14px;margin-bottom:20px">Выбери 2–3 области. Это твой компас.</p>'
      + VALUES.map(function(v){
          var on = draft.values && draft.values.indexOf(v.id)>=0;
          return '<div class="value-card _val'+(on?' on':'')+'" data-id="'+v.id+'">'
            + '<span style="font-size:24px">'+v.emoji+'</span>'
            + '<div style="font-weight:700">'+v.name+'</div></div>';
        }).join('')
      + '<div style="height:16px"></div><button class="btn-primary" onclick="window._ws(5)">Продолжить →</button>';
  }
  function s5() {
    var vnames = (draft.values||[]).map(function(id){ var v=VALUES.find(function(x){return x.id===id;}); return v?'<span class="chip on">'+v.emoji+' '+v.name+'</span>':''; }).join('');
    return '<div style="text-align:center;padding:20px 0">'
      + '<div style="font-size:64px;margin-bottom:16px">🎉</div>'
      + '<h2 style="font-size:24px;font-weight:800;margin-bottom:10px">'+(draft.name||'Привет')+', всё готово!</h2>'
      + '<p style="color:var(--text2);font-size:15px;line-height:1.6;margin-bottom:32px">Начинаем с уровня 1 — учимся замечать.</p>'
      + '<div class="card" style="text-align:left;margin-bottom:24px">'
      + '<div style="font-size:13px;color:var(--text2);font-weight:600;margin-bottom:10px">ТВОИ ЦЕННОСТИ</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px">' + vnames + '</div></div>'
      + '<button class="btn-primary" onclick="window._wFinish()">Открыть программу →</button>'
      + '<div style="margin-top:12px;color:var(--text3);font-size:13px">💡 Добавь приложение на домашний экран</div></div>';
  }
  function bindStep(s) {
    if (s===1) {
      window._dNic = draft.nicotineStrength||20;
      document.querySelectorAll('._dt').forEach(function(b){
        b.onclick=function(){ draft.deviceType=b.dataset.val; document.querySelectorAll('._dt').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); };
      });
    }
    if (s===2) {
      document.querySelectorAll('._method').forEach(function(b){
        b.onclick=function(){ draft.quitMethod=b.dataset.val; document.querySelectorAll('._method').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); };
      });
    }
    if (s===4) {
      document.querySelectorAll('._val').forEach(function(b){
        b.onclick=function(){
          var id=b.dataset.id;
          if(!draft.values)draft.values=[];
          var idx=draft.values.indexOf(id);
          if(idx>=0){draft.values.splice(idx,1);b.classList.remove('on');}
          else if(draft.values.length<3){draft.values.push(id);b.classList.add('on');}
          else{Toast.show('Выбери не более 3','warn');}
        };
      });
    }
  }
  window._ws = function(s){
    if(step===1){
      var name=document.getElementById('inp-name').value.trim();
      if(!name){Toast.show('Введи своё имя','warn');return;}
      draft.name=name;
      draft.dailyPuffs=+document.getElementById('inp-puffs').value||200;
      draft.dailyCost=+document.getElementById('inp-cost').value||200;
      draft.nicotineStrength=window._dNic||20;
    }
    if(step===3){draft.quitDate=document.getElementById('inp-date').value;}
    if(step===4&&(!draft.values||draft.values.length===0)){Toast.show('Выбери хотя бы одну ценность','warn');return;}
    render(s);
  };
  window._wFinish=function(){
    Storage.updateUser(Object.assign({},draft,{setupComplete:true}));
    App.navigate('home');
  };
  render(0);
},


home(el, data) {
  var u = data.user, p = data.progress, logs = data.dailyLogs;
  var quitDate = u.quitDate ? new Date(u.quitDate) : null;
  var now = new Date();
  var daysSinceQuit = quitDate ? Math.max(0,Math.floor((now-quitDate)/86400000)) : 0;
  var isPrepPhase = quitDate && quitDate > now;
  var daysToQuit = isPrepPhase ? Math.ceil((quitDate-now)/86400000) : 0;
  var todayLog = logs[today()] || {puffs:0};
  var streak = p.consecutiveSmokeFree || 0;
  var lvlNum = u.currentLevel || 1;
  var curLvl = LEVELS.find(function(l){return l.id===lvlNum;})||LEVELS[0];
  var doneEx = p.exercisesCompleted || [];
  var doneCount = doneEx.filter(function(e){return e.startsWith(lvlNum+'.');}).length;
  var totalEx = curLvl ? curLvl.exercises.length : 4;
  var nextEx = curLvl ? curLvl.exercises.find(function(e){return !doneEx.includes(e.id);}) : null;
  // Status ring
  var overallProg = Math.round((p.exercisesCompleted.length / (LEVELS.reduce(function(s,l){return s+l.exercises.length;},0))) * 100);
  var healthNext = HEALTH.find(function(h){ return daysSinceQuit*1440 < h.mins; });

  el.innerHTML = '<div class="screen">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">'
    + '<div><div style="font-size:13px;color:var(--text2);font-weight:600">ПРИВЕТ, ' + (u.name||'ДРУГ').toUpperCase() + '</div>'
    + '<div style="font-size:22px;font-weight:800;margin-top:2px">'
    + (isPrepPhase ? 'До дня X: ' + daysToQuit + ' ' + (daysToQuit===1?'день':daysToQuit<5?'дня':'дней')
      : daysSinceQuit===0 ? 'Сегодня — день отказа!'
      : 'День ' + daysSinceQuit + ' без вейпа') + '</div></div>'
    + '<div style="text-align:right"><div style="font-size:12px;color:var(--text2)">Уровень ' + lvlNum + '/4</div>'
    + '<div style="font-size:12px;color:var(--green);font-weight:700">🔥 Серия: ' + streak + ' ' + (streak===1?'день':streak<5?'дня':'дней') + '</div></div>'
    + '</div>'
    // Progress ring
    + '<div class="card" style="margin-bottom:12px;background:linear-gradient(135deg,#F0FFF8,#EBF4FF)">'
    + '<div style="display:flex;align-items:center;gap:16px">'
    + '<div style="position:relative;width:64px;height:64px;flex-shrink:0">'
    + '<svg width="64" height="64" viewBox="0 0 64 64" style="transform:rotate(-90deg)">'
    + '<circle cx="32" cy="32" r="26" fill="none" stroke="#E5E5EA" stroke-width="6"/>'
    + '<circle cx="32" cy="32" r="26" fill="none" stroke="#4CAF82" stroke-width="6" stroke-linecap="round"'
    + ' stroke-dasharray="163" stroke-dashoffset="' + Math.round(163*(1-overallProg/100)) + '"/>'
    + '</svg><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--green)">' + overallProg + '%</div>'
    + '</div><div>'
    + '<div style="font-weight:700;font-size:15px">Прогресс программы</div>'
    + '<div style="color:var(--text2);font-size:13px;margin-top:2px">' + p.exercisesCompleted.length + ' упражнений выполнено</div>'
    + '</div></div></div>'
    // Quick actions
    + '<button class="btn-sos" onclick="App.navigate('urge-help')" style="margin-bottom:10px">🆘 Помощь при тяге — сейчас</button>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">'
    + '<button class="card card-sm" style="border:none;text-align:left;cursor:pointer" onclick="App.navigate('level',{id:' + lvlNum + '})">'
    + '<div style="font-size:20px;margin-bottom:4px">' + (curLvl?curLvl.emoji:'📚') + '</div>'
    + '<div style="font-weight:700;font-size:14px">Уровень ' + lvlNum + '</div>'
    + '<div style="color:var(--text2);font-size:12px">' + doneCount + '/' + totalEx + ' упр.</div>'
    + '<div class="pbar" style="margin-top:8px"><div class="pbar-fill" style="width:' + Math.round(doneCount/totalEx*100) + '%"></div></div>'
    + '</button>'
    + '<button class="card card-sm" style="border:none;text-align:left;cursor:pointer" onclick="App.navigate('tracker')">'
    + '<div style="font-size:20px;margin-bottom:4px">📊</div>'
    + '<div style="font-weight:700;font-size:14px">Трекер</div>'
    + '<div style="color:var(--text2);font-size:12px">Сегодня: ' + todayLog.puffs + ' затяжек</div>'
    + '</button></div>'
    // Stats
    + '<div class="stats-grid" style="margin-bottom:12px">'
    + '<div class="stat-card"><div class="stat-val" style="color:var(--green)">'
    + (p.moneySaved||0).toLocaleString() + ' ₽</div><div class="stat-label">Сэкономлено</div></div>'
    + '<div class="stat-card"><div class="stat-val" style="color:var(--blue)">'
    + (p.totalPuffsAvoided||0).toLocaleString() + '</div><div class="stat-label">Затяжек пропущено</div></div>'
    + '<div class="stat-card"><div class="stat-val" style="color:var(--orange)">' + p.achievements.length + '/' + ACHIEVEMENTS.length + '</div><div class="stat-label">Достижений</div></div>'
    + '<div class="stat-card"><div class="stat-val" style="color:var(--purple)">'
    + (healthNext ? fmtMins(healthNext.mins - daysSinceQuit*1440) + ' → веха' : '✓ год!')
    + '</div><div class="stat-label">До вехи здоровья</div></div>'
    + '</div>'
    // Quote
    + '<div class="card" style="background:var(--green-light);border-color:rgba(76,175,130,.2)">'
    + '<div style="font-size:14px;color:var(--green);line-height:1.5;text-align:center;font-style:italic">«'
    + QUOTES[Math.floor(Date.now()/600000) % QUOTES.length] + '»</div></div>'
    + '</div>';
},


levels(el, data) {
  var p = data.progress;
  var unlocked = p.levelsUnlocked || [1];
  var doneEx = p.exercisesCompleted || [];
  el.innerHTML = '<div class="screen">'
    + '<h2 style="font-size:22px;font-weight:800;margin-bottom:4px">Уровни программы</h2>'
    + '<p style="color:var(--text2);font-size:14px;margin-bottom:20px">Фаза 1: Подготовка к отказу</p>'
    + LEVELS.map(function(lvl){
        var isUnlocked = unlocked.includes(lvl.id);
        var doneCnt = doneEx.filter(function(e){return e.startsWith(lvl.id+'.');}).length;
        var isDone = doneCnt >= lvl.exercises.length;
        var isCur = isUnlocked && !isDone;
        var cls = 'level-card' + (isDone?' done':isCur?' current':!isUnlocked?' locked':'');
        var badgeCls = isDone?'done':isCur?'current':'locked';
        return '<div class="' + cls + '" onclick="'+(isUnlocked?'App.navigate('level',{id:'+lvl.id+'})':'')+'">'
          + '<div style="display:flex;align-items:center;gap:14px">'
          + '<div class="level-badge ' + badgeCls + '">'+(isDone?'✅':!isUnlocked?'🔒':lvl.emoji)+'</div>'
          + '<div style="flex:1">'
          + '<div style="display:flex;align-items:center;gap:8px">'
          + '<div style="font-weight:700;font-size:15px">Уровень ' + lvl.id + ': ' + lvl.title + '</div>'
          + (isDone?'<span style="font-size:11px;background:var(--green-light);color:var(--green);padding:2px 8px;border-radius:10px;font-weight:600">✓</span>':'')
          + '</div>'
          + '<div style="color:var(--text2);font-size:13px;margin-top:2px">' + lvl.subtitle + '</div>'
          + (isUnlocked ? '<div class="pbar" style="margin-top:8px"><div class="pbar-fill" style="width:'+Math.round(doneCnt/lvl.exercises.length*100)+'%"></div></div>'
            + '<div style="font-size:11px;color:var(--text3);margin-top:4px">'+doneCnt+'/'+lvl.exercises.length+' упражнений</div>'
            : '<div style="font-size:12px;color:var(--text3);margin-top:4px">🔒 Завершите предыдущий уровень</div>')
          + '</div>'
          + (isDone?'<div style="font-size:22px">'+lvl.badgeEmoji+'</div>':'')
          + '</div></div>';
      }).join('')
    + '</div>';
},

levelDetail(el, data, lvlId) {
  var lvl = LEVELS.find(function(l){return l.id===+lvlId;});
  if(!lvl){App.navigate('levels');return;}
  var doneEx = data.progress.exercisesCompleted || [];
  el.innerHTML = '<div class="screen">'
    + '<button onclick="App.navigate('levels')" style="color:var(--text2);font-size:14px;margin-bottom:16px;display:flex;align-items:center;gap:6px">'
    + '← Назад</button>'
    + '<div style="text-align:center;padding:16px 0 24px">'
    + '<div style="font-size:48px;margin-bottom:8px">'+lvl.emoji+'</div>'
    + '<h2 style="font-size:22px;font-weight:800;margin-bottom:4px">Уровень '+lvl.id+': '+lvl.title+'</h2>'
    + '<p style="color:var(--text2);font-size:14px">'+lvl.desc+'</p></div>'
    + lvl.exercises.map(function(ex){
        var done = doneEx.includes(ex.id);
        return '<div class="exercise-card'+(done?' done':'')+'" onclick="App.navigate('exercise',{id:''+ex.id+''})">'
          + '<div style="display:flex;align-items:center;gap:14px">'
          + '<div style="font-size:28px;width:44px;text-align:center">'+ex.emoji+'</div>'
          + '<div style="flex:1">'
          + '<div style="font-weight:700;font-size:15px">'+ex.title+'</div>'
          + '<div style="color:var(--text2);font-size:13px;margin-top:2px">'+(done?'✅ Выполнено':'Нажми чтобы начать')+'</div>'
          + '</div>'
          + '<div style="color:var(--text3)">›</div>'
          + '</div></div>';
      }).join('')
    + (doneEx.filter(function(e){return e.startsWith(lvlId+'.');}).length>=lvl.exercises.length
      ? '<div class="card" style="margin-top:12px;background:var(--green-light);border-color:rgba(76,175,130,.2);text-align:center">'
        + '<div style="font-size:32px;margin-bottom:8px">'+lvl.badgeEmoji+'</div>'
        + '<div style="font-weight:700;color:var(--green)">Бейдж «'+lvl.badge+'» получен!</div></div>'
      : '')
    + '</div>';
},


exercise(el, data, exId) {
  var lvlId = parseInt(exId);
  var lvl = LEVELS.find(function(l){return l.id===lvlId;});
  var ex = null;
  LEVELS.forEach(function(l){ var e=l.exercises.find(function(x){return x.id===exId;}); if(e)ex=e; });
  if(!ex){App.navigate('levels');return;}
  var done = (data.progress.exercisesCompleted||[]).includes(exId);

  function markDone() {
    Storage.completeExercise(exId);
    // Check if level complete
    var fresh = Storage.get();
    var lvlExIds = lvl.exercises.map(function(e){return e.id;});
    var allDone = lvlExIds.every(function(id){return fresh.progress.exercisesCompleted.includes(id);});
    if(allDone) {
      var nextId = lvlId + 1;
      if(nextId <= 4) Storage.unlockLevel(nextId);
      var fresh2 = Storage.get();
      fresh2.user.currentLevel = Math.max(fresh2.user.currentLevel||1, Math.min(nextId,4));
      Storage.save(fresh2);
    }
    var newAchs = Storage.checkAndUnlockAchievements();
    newAchs.forEach(function(a){Toast.show(a.emoji+' '+a.name+' — достижение!','success');});
    Toast.show('✅ Упражнение завершено!','success');
    App.navigate('level',{id:lvlId});
  }

  var body = '';
  if(ex.type==='read'||ex.type==='metaphor'||ex.type==='reframe'||ex.type==='defusion'||ex.type==='self_compassion') {
    var paras = ex.content.split('\n').map(function(p){return p?'<p style="margin-bottom:12px;font-size:16px;line-height:1.6">'+p+'</p>':'<br>';}).join('');
    body = '<div class="card" style="margin-bottom:20px">'+paras+'</div>';
  }
  if(ex.type==='story') {
    body = '<div class="card" style="margin-bottom:20px">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">'
      + '<div style="width:44px;height:44px;border-radius:50%;background:var(--green-light);display:flex;align-items:center;justify-content:center;font-size:22px">👤</div>'
      + '<div><div style="font-weight:700">'+ex.author+'</div><div style="color:var(--text2);font-size:13px">'+ex.device+'</div></div></div>'
      + ex.story.split('\n').map(function(p){return p?'<p style="margin-bottom:12px;font-size:15px;line-height:1.7;color:var(--text)">'+p+'</p>':'<br>';}).join('')
      + '</div>';
  }
  if(ex.type==='timer') {
    var dur = ex.duration||120;
    body = '<div class="card" style="margin-bottom:20px;text-align:center">'
      + ex.content.split('\n').map(function(p){return p?'<p style="margin-bottom:10px;font-size:15px;line-height:1.6;color:var(--text)">'+p+'</p>':'<br>';}).join('')
      + '<div id="timer-disp" style="font-size:48px;font-weight:800;color:var(--blue);margin:20px 0">'+Math.floor(dur/60)+':'+String(dur%60).padStart(2,'0')+'</div>'
      + '<button class="btn-primary" id="timer-btn" onclick="window._startTimer('+dur+')">▶ Начать таймер</button>'
      + '</div>';
    window._startTimer = function(secs) {
      var btn = document.getElementById('timer-btn');
      var disp = document.getElementById('timer-disp');
      if(!btn||!disp) return;
      btn.textContent='Идёт...'; btn.disabled=true;
      var rem = secs;
      var iv = setInterval(function(){
        rem--;
        if(disp) disp.textContent=Math.floor(rem/60)+':'+String(rem%60).padStart(2,'0');
        if(rem<=0){ clearInterval(iv); if(btn){btn.textContent='✅ Завершено';btn.disabled=false;btn.onclick=markDone;} }
      },1000);
    };
  }
  if(ex.type==='breathing') {
    body = '<div style="text-align:center;margin-bottom:20px"><p style="color:var(--text2);font-size:15px;margin-bottom:24px">'+ex.content+'</p>'
      + '<div class="breath-circle" id="bcirc"><div id="bph" style="font-size:16px;font-weight:700;color:var(--text)">Готов?</div>'
      + '<div id="bcnt" style="font-size:28px;font-weight:800;color:var(--blue);margin-top:4px"></div></div>'
      + '<div style="margin-top:24px"><button class="btn-primary" onclick="App.navigate('breathing')">🕊 Открыть дыхание</button></div></div>';
  }
  if(ex.type==='wave') {
    body = '<div class="card" style="margin-bottom:20px;text-align:center">'
      + '<p style="color:var(--text2);font-size:15px;line-height:1.6;margin-bottom:20px">'+ex.content+'</p>'
      + '<div style="height:80px;display:flex;align-items:flex-end;gap:3px;justify-content:center;margin-bottom:16px">'
      + Array.from({length:20},function(_,i){return '<div style="width:12px;border-radius:6px 6px 0 0;background:var(--blue);animation:wavePeak '+(1+i*0.1)+'s ease-in-out infinite alternate;height:'+(30+Math.sin(i*0.6)*25)+'px"></div>';}).join('')
      + '</div>'
      + '<div id="wave-timer" style="font-size:40px;font-weight:800;color:var(--blue);margin:12px 0">5:00</div>'
      + '<button class="btn-primary" id="wave-btn" onclick="window._startWave()">🌊 Начать (5 мин)</button></div>';
    window._startWave = function(){
      var btn=document.getElementById('wave-btn'), disp=document.getElementById('wave-timer');
      if(!btn||!disp) return;
      btn.textContent='Наблюдай...'; btn.disabled=true;
      var rem=300, iv=setInterval(function(){rem--;if(disp)disp.textContent=Math.floor(rem/60)+':'+String(rem%60).padStart(2,'0');if(rem<=0){clearInterval(iv);if(btn){btn.textContent='✅ Готово';btn.disabled=false;btn.onclick=markDone;}}},1000);
    };
  }
  if(ex.type==='bodymap') {
    var zones = ['Горло','Грудь','Живот','Руки','Голова'];
    var zoneDesc = {
      'Горло':'Горло сжимается? Это напряжение. Сглотни медленно. Сделай глубокий вдох.',
      'Грудь':'Тяжесть в груди — это тяга. Положи руку туда. Почувствуй тепло ладони.',
      'Живот':'Пустота в животе? Выпей стакан воды. Сделай 3 глубоких вдоха.',
      'Руки':'Руки тянутся? Сожми и разожми кулаки 10 раз. Встряхни ладони.',
      'Голова':'Туман в голове? Это нормально. Просто замечай. Это пройдёт.'
    };
    body = '<div class="card" style="margin-bottom:20px">'
      + '<p style="font-size:15px;line-height:1.6;margin-bottom:16px">'+ex.content+'</p>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px">'
      + zones.map(function(z){return '<button class="chip _zone" data-zone="'+z+'">'+z+'</button>';}).join('')
      + '</div><div id="zone-resp" style="min-height:60px;font-size:15px;color:var(--text2);line-height:1.6;text-align:center"></div></div>';
    setTimeout(function(){
      document.querySelectorAll('._zone').forEach(function(b){
        b.onclick=function(){
          document.querySelectorAll('._zone').forEach(function(x){x.classList.remove('on');});
          b.classList.add('on');
          var r=document.getElementById('zone-resp');
          if(r)r.textContent=zoneDesc[b.dataset.zone]||'Просто заметь это ощущение.';
        };
      });
    },100);
  }
  if(ex.type==='journal') {
    body = '<div class="card" style="margin-bottom:20px">'
      + '<p style="font-size:16px;font-weight:700;margin-bottom:16px">'+ex.prompt+'</p>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">'
      + ex.emotions.map(function(em){return '<button class="chip _em" data-em="'+em+'">'+em+'</button>';}).join('')
      + '</div>'
      + '<textarea class="input" id="jnl-note" placeholder="Дополнительно (необязательно)" style="height:80px;resize:none;display:block;line-height:1.5" rows="3"></textarea></div>';
    setTimeout(function(){
      document.querySelectorAll('._em').forEach(function(b){
        b.onclick=function(){document.querySelectorAll('._em').forEach(function(x){x.classList.remove('on');});b.classList.add('on');};
      });
    },100);
  }
  if(ex.type==='emotion') {
    body = '<div class="card" style="margin-bottom:20px">'
      + '<p style="font-size:15px;margin-bottom:16px">Выбери, что ты сейчас чувствуешь:</p>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">'
      + ex.emotions.map(function(em){return '<button class="chip _emo" data-text="'+em.text+'">'+em.name+'</button>';}).join('')
      + '</div><div id="emo-resp" style="min-height:60px;font-size:15px;color:var(--text);line-height:1.6;background:var(--bg);border-radius:12px;padding:14px;display:none"></div></div>';
    setTimeout(function(){
      document.querySelectorAll('._emo').forEach(function(b){
        b.onclick=function(){
          document.querySelectorAll('._emo').forEach(function(x){x.classList.remove('on');});
          b.classList.add('on');
          var r=document.getElementById('emo-resp');
          if(r){r.style.display='block';r.textContent=b.dataset.text;}
        };
      });
    },100);
  }
  if(ex.type==='leaves') {
    body = '<div class="card" style="margin-bottom:20px">'
      + '<p style="font-size:15px;line-height:1.6;margin-bottom:16px">'+ex.content+'</p>'
      + '<div id="leaves-river" style="background:linear-gradient(180deg,#EBF8FF,#DBEAFE);border-radius:12px;height:100px;position:relative;overflow:hidden;margin-bottom:16px">'
      + '<div style="position:absolute;bottom:0;left:0;right:0;height:40px;background:rgba(59,130,246,.1);border-radius:12px"></div>'
      + '<div id="leaves-wrap" style="position:absolute;inset:0;pointer-events:none"></div></div>'
      + '<input class="input" id="leaf-inp" placeholder="Напиши свою мысль..." style="margin-bottom:10px">'
      + '<button class="btn-primary" id="leaf-btn" onclick="window._addLeaf()">🍃 Отпустить мысль</button>'
      + '<div id="leaf-count" style="text-align:center;margin-top:10px;color:var(--text2);font-size:13px">0/5 мыслей</div></div>';
    var leafCount = 0;
    window._addLeaf = function(){
      var inp=document.getElementById('leaf-inp');
      if(!inp||!inp.value.trim())return;
      var text=inp.value.trim(); inp.value='';
      leafCount++;
      var w=document.getElementById('leaves-wrap');
      if(w){
        var leaf=document.createElement('div');
        leaf.style.cssText='position:absolute;top:'+(10+Math.random()*60)+'px;left:-120px;background:rgba(76,175,130,.8);color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;animation:leafFloat 6s linear forwards';
        leaf.textContent='🍃 '+text.substring(0,20);
        var style=document.createElement('style');
        style.textContent='@keyframes leafFloat{to{left:110%;transform:rotate('+( -15+Math.random()*30)+'deg)}}';
        document.head.appendChild(style);
        w.appendChild(leaf);
        setTimeout(function(){leaf.remove();},6500);
      }
      var cnt=document.getElementById('leaf-count');
      if(cnt)cnt.textContent=leafCount+'/5 мыслей';
      if(leafCount>=3){
        var btn=document.getElementById('leaf-btn');
        if(btn){btn.textContent='✅ Готово';btn.onclick=markDone;}
      }
    };
  }

  el.innerHTML = '<div class="screen">'
    + '<button onclick="App.navigate('level',{id:'+lvlId+'})" style="color:var(--text2);font-size:14px;margin-bottom:16px;display:flex;align-items:center;gap:6px">← Назад</button>'
    + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">'
    + '<div style="font-size:36px">'+ex.emoji+'</div>'
    + '<div><h2 style="font-size:20px;font-weight:800">'+ex.title+'</h2>'
    + '<div style="font-size:13px;color:var(--text2)">Упражнение '+ex.id+'</div></div>'
    + (done?'<div style="margin-left:auto;font-size:22px">✅</div>':'')
    + '</div>'
    + body
    + (done
      ? '<button class="btn-secondary" onclick="App.navigate('level',{id:'+lvlId+'})">← К уровню</button>'
      : ex.type==='read'||ex.type==='story'||ex.type==='metaphor'||ex.type==='reframe'||ex.type==='defusion'||ex.type==='self_compassion'||ex.type==='breathing'
        ? '<button class="btn-primary" onclick="markDone()">✅ Упражнение завершено</button>'
        : ex.type==='journal'||ex.type==='emotion'||ex.type==='bodymap'
          ? '<button class="btn-primary" onclick="markDone()">Записать и завершить ✅</button>'
          : '')
    + '</div>';

  window.markDone = markDone;
},


urgeHelp(el, data) {
  var step = 0; var urgeType = null; var intensity = 5; var won = false;
  function render(s) {
    step = s;
    if(s===0) {
      el.innerHTML = '<div class="screen screen-full" style="background:linear-gradient(135deg,#FFF3E0,#FFEBEE);min-height:100dvh">'
        + '<div style="text-align:center;padding:32px 0 20px"><div style="font-size:48px">🆘</div>'
        + '<h2 style="font-size:24px;font-weight:800;margin-top:8px">Помощь при тяге</h2>'
        + '<p style="color:var(--text2);font-size:15px;margin-top:6px">Что ты сейчас чувствуешь?</p></div>'
        + '<div style="padding:0 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px">'
        + [['body','🫀','Тело','Физические ощущения'],['emotion','💚','Эмоция','Стресс, тревога, скука'],['thought','💭','Мысль','"Мне нужна затяжка"'],['situation','🌍','Ситуация','Привычный контекст']].map(function(t){
            return '<div class="card" style="text-align:center;cursor:pointer;padding:20px 12px" onclick="window._uType(''+t[0]+'')"><div style="font-size:32px;margin-bottom:8px">'+t[1]+'</div><div style="font-weight:700">'+t[2]+'</div><div style="color:var(--text2);font-size:12px;margin-top:4px">'+t[3]+'</div></div>';
          }).join('')
        + '</div>'
        + '<div style="padding:16px"><button class="btn-secondary" onclick="App.navigate('home')">← Назад</button></div></div>';
      window._uType = function(t){urgeType=t;render(1);};
    }
    if(s===1) {
      var exercises = {
        body: [{emoji:'💨',title:'Дыхание 4-7-8',action:function(){App.navigate('breathing');}},{emoji:'🌊',title:'Волна тяги — 5 минут',action:function(){window._sosTx='wave';render(2);}}],
        emotion: [{emoji:'🏷',title:'Назови эмоцию',action:function(){window._sosTx='emotion';render(2);}},{emoji:'🤲',title:'Сострадание к себе',action:function(){window._sosTx='compassion';render(2);}}],
        thought: [{emoji:'💭',title:'У меня есть мысль, что…',action:function(){window._sosTx='defuse';render(2);}},{emoji:'🍃',title:'Мысли на листьях',action:function(){window._sosTx='leaves';render(2);}}],
        situation: [{emoji:'⚡',title:'Экстренный план',action:function(){window._sosTx='plan';render(2);}},{emoji:'💨',title:'Дыхание 4-7-8',action:function(){App.navigate('breathing');}}]
      };
      var exs = exercises[urgeType]||exercises.body;
      el.innerHTML = '<div class="screen"><button onclick="window._uBack()" style="color:var(--text2);font-size:14px;margin-bottom:16px">← Назад</button>'
        + '<h2 style="font-size:22px;font-weight:800;margin-bottom:6px">Выбери упражнение</h2>'
        + '<p style="color:var(--text2);font-size:14px;margin-bottom:20px">Одной минуты может хватить</p>'
        + exs.map(function(e,i){return '<div class="card" style="cursor:pointer;margin-bottom:10px;display:flex;align-items:center;gap:14px" onclick="window._sosEx('+i+')"><div style="font-size:32px">'+e.emoji+'</div><div style="font-weight:700;font-size:16px">'+e.title+'</div><div style="margin-left:auto;color:var(--text3)">›</div></div>';}).join('')
        + '</div>';
      window._uBack=function(){render(0);};
      window._sosEx=function(i){exs[i].action();};
    }
    if(s===2) {
      var bodies = {
        wave: '<div style="text-align:center"><p style="font-size:15px;line-height:1.6;color:var(--text2);margin-bottom:16px">Тяга — это волна. Она нарастает, достигает пика и отступает. Просто наблюдай.</p>'
          + '<div id="wt" style="font-size:48px;font-weight:800;color:var(--blue);margin:16px 0">5:00</div>'
          + '<button class="btn-primary" id="wbtn" onclick="window._startSosWave()">🌊 Наблюдать</button></div>',
        emotion: '<p style="font-size:16px;font-weight:700;margin-bottom:16px">Что именно ты чувствуешь?</p><div style="display:flex;flex-wrap:wrap;gap:8px">'
          + ['Тревога','Стресс','Скука','Грусть','Злость','Одиночество'].map(function(e){return '<button class="chip _semo" data-e="'+e+'">'+e+'</button>';}).join('')+'</div><div id="se-r" style="min-height:60px;margin-top:16px;font-size:15px;color:var(--text);line-height:1.6;background:var(--bg);border-radius:12px;padding:14px;display:none"></div>',
        compassion: '<div style="text-align:center;padding:20px 0"><div style="font-size:48px;margin-bottom:16px">🤲</div><p style="font-size:16px;line-height:1.8;color:var(--text)">Положи руку на грудь.<br><br><i>«Сейчас мне тяжело.<br>Это нормально.<br>Я делаю всё, что могу.<br>Я заслуживаю доброты.»</i><br><br>Повтори 3 раза, медленно.</p></div>',
        defuse: '<p style="font-size:15px;line-height:1.6;margin-bottom:16px">Вместо «Мне нужна затяжка» скажи:<br><b style="color:var(--blue)">"У меня есть мысль, что мне нужна затяжка"</b><br><br>Ты — не твои мысли.</p><input class="input" id="df-inp" placeholder="Твоя мысль..." style="margin-bottom:10px"><div id="df-out" style="color:var(--blue);font-weight:600;font-size:15px;min-height:40px;line-height:1.6"></div>',
        leaves: '<p style="font-size:15px;line-height:1.6;margin-bottom:16px">Запиши мысль и отпусти её 🍃</p><input class="input" id="lf-inp" placeholder="Мысль..."><button class="btn-primary" style="margin-top:10px" onclick="window._sosLeaf()">Отпустить</button><div id="lf-out" style="margin-top:12px;color:var(--green);font-size:14px"></div>',
        plan: '<p style="font-size:16px;font-weight:700;margin-bottom:12px">Прежде чем взять вейп — сделай это:</p>'
          + ['Сделай 10 глубоких вдохов','Выпей стакан воды','Выйди на свежий воздух на 2 минуты','Напиши кому-нибудь сообщение','Подожди ровно 5 минут'].map(function(t,i){return '<div class="card card-sm" style="margin-bottom:8px;display:flex;align-items:center;gap:12px"><div style="width:28px;height:28px;border-radius:50%;background:var(--orange-light);color:var(--orange);font-weight:700;display:flex;align-items:center;justify-content:center">'+(i+1)+'</div><div style="font-size:14px">'+t+'</div></div>';}).join('')
      };
      el.innerHTML = '<div class="screen"><button onclick="window._uBack2()" style="color:var(--text2);font-size:14px;margin-bottom:16px">← Назад</button>'
        + '<div class="card" style="margin-bottom:20px">' + (bodies[window._sosTx]||bodies.plan) + '</div>'
        + '<button class="btn-primary" onclick="render(3)">Проверить интенсивность →</button></div>';
      window._uBack2=function(){render(1);};
      window._startSosWave=function(){var d=document.getElementById('wt'),b=document.getElementById('wbtn');if(!d||!b)return;b.disabled=true;b.textContent='Идёт...';var r=300,iv=setInterval(function(){r--;if(d)d.textContent=Math.floor(r/60)+':'+String(r%60).padStart(2,'0');if(r<=0){clearInterval(iv);render(3);}},1000);};
      window._sosLeaf=function(){var i=document.getElementById('lf-inp'),o=document.getElementById('lf-out');if(i&&i.value.trim()&&o){o.textContent='🍃 «'+i.value+'» — отпущено';i.value='';}};
      setTimeout(function(){
        document.querySelectorAll('._semo').forEach(function(b){var msgs={'Тревога':'Тревога пытается тебя защитить. Но ты в безопасности прямо сейчас.','Стресс':'Стресс — сигнал важности. Вейп не снимет стресс, но ты справишься.','Скука':'Скука — не чрезвычайная ситуация. Она пройдёт за 3 минуты.','Грусть':'Позволь грусти быть. Она не требует действий.','Злость':'Злость — энергия. Выдохни её. Не вейп её.','Одиночество':'Напиши кому-нибудь прямо сейчас. Связь сильнее никотина.'};
          b.onclick=function(){document.querySelectorAll('._semo').forEach(function(x){x.classList.remove('on');});b.classList.add('on');var r=document.getElementById('se-r');if(r){r.style.display='block';r.textContent=msgs[b.dataset.e]||'Это нормально. Это пройдёт.';}};
        });
      },100);
    }
    if(s===3) {
      el.innerHTML = '<div class="screen"><h2 style="font-size:22px;font-weight:800;margin-bottom:16px">Как тяга сейчас?</h2>'
        + '<div class="card" style="margin-bottom:20px">'
        + '<label class="input-label">ИНТЕНСИВНОСТЬ: <span id="ints">5</span>/10</label>'
        + '<input type="range" min="1" max="10" value="5" oninput="document.getElementById('ints').textContent=this.value;window._sosInt=+this.value" style="margin-bottom:8px">'
        + '</div>'
        + '<button class="btn-primary" style="margin-bottom:10px" onclick="window._sosWin(true)">💪 Я остаюсь свободным</button>'
        + '<button class="btn-danger" onclick="window._sosWin(false)">Не справился</button></div>';
      window._sosInt=5;
      window._sosWin=function(w){won=w;render(4);};
    }
    if(s===4) {
      if(won){
        // Log win
        var fresh = Storage.get();
        if(fresh){fresh.progress.sosWins=(fresh.progress.sosWins||0)+1;Storage.save(fresh);}
        var newAchs=Storage.checkAndUnlockAchievements();
        newAchs.forEach(function(a){Toast.show(a.emoji+' '+a.name,'success');});
      }
      // Log craving
      Storage.logCraving(today(),{time:new Date().toISOString(),type:urgeType,intensity:window._sosInt||5,result:won?'won':'used'});
      el.innerHTML = '<div class="screen screen-full" style="text-align:center;padding-top:60px">'
        + (won
          ? '<div style="font-size:64px;margin-bottom:16px">🎉</div><h2 style="font-size:26px;font-weight:800;margin-bottom:10px">Ты справился!</h2><p style="color:var(--text2);font-size:16px;line-height:1.6;margin-bottom:32px">Каждая победа над тягой укрепляет новую нейронную связь.<br>Ты становишься свободнее.</p>'
          : '<div style="font-size:64px;margin-bottom:16px">💚</div><h2 style="font-size:24px;font-weight:800;margin-bottom:10px">Это не провал</h2><p style="color:var(--text2);font-size:15px;line-height:1.6;margin-bottom:32px">Один момент не определяет твой путь.<br>Важно не то, что ты упал, а то, что ты поднимаешься.</p>')
        + '<button class="btn-primary" onclick="App.navigate('home')">← На главную</button></div>';
    }
  }
  render(0);
},

tracker(el, data) {
  var u = data.user, logs = data.dailyLogs;
  var todayKey = today();
  var todayLog = logs[todayKey] || {puffs:0,mood:3,cravings:[],note:''};
  var puffs = todayLog.puffs;
  var mood = todayLog.mood || 3;
  var isPrepPhase = u.quitDate && new Date(u.quitDate) > new Date();
  var goalPuffs = isPrepPhase ? Math.round(u.dailyPuffs * 0.8) : 0;
  var moodEmojis = ['😢','😔','😐','🙂','😄'];

  function render() {
    var col = puffs===0?'var(--green)':puffs<=u.dailyPuffs*.5?'var(--blue)':puffs<=u.dailyPuffs?'var(--orange)':'var(--red)';
    el.innerHTML = '<div class="screen">'
      + '<h2 style="font-size:22px;font-weight:800;margin-bottom:4px">Трекер дня</h2>'
      + '<p style="color:var(--text2);font-size:14px;margin-bottom:20px">' + new Date().toLocaleDateString('ru',{weekday:'long',day:'numeric',month:'long'}) + '</p>'
      + '<div class="card" style="margin-bottom:12px">'
      + '<div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:12px">ЗАТЯЖЕК СЕГОДНЯ</div>'
      + '<div style="display:flex;align-items:center;justify-content:center;gap:24px">'
      + '<button class="counter-btn" onclick="window._adj(-1)">−</button>'
      + '<div style="text-align:center"><div style="font-size:56px;font-weight:900;color:'+col+';line-height:1">'+puffs+'</div>'
      + '<div style="color:var(--text2);font-size:13px;margin-top:4px">'+(u.dailyPuffs?'из '+u.dailyPuffs+' обычных':'затяжек')+'</div></div>'
      + '<button class="counter-btn" onclick="window._adj(1)">+</button>'
      + '</div>'
      + (puffs===0?'<div style="margin-top:16px;padding:12px;background:var(--green-light);border-radius:12px;color:var(--green);font-weight:700;text-align:center;font-size:15px" id="cday-msg">🎉 Чистый день!</div>':'')
      + (isPrepPhase&&goalPuffs?'<div class="pbar" style="margin-top:16px"><div class="pbar-fill" style="width:'+Math.min(100,Math.round((1-puffs/goalPuffs)*100))+'%"></div></div><div style="font-size:12px;color:var(--text3);margin-top:6px;text-align:center">Цель дня: не более '+goalPuffs+' затяжек</div>':'')
      + '</div>'
      + '<div class="card" style="margin-bottom:12px">'
      + '<div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:12px">НАСТРОЕНИЕ</div>'
      + '<div class="mood-row">'
      + moodEmojis.map(function(e,i){return '<button class="mood-btn'+(mood===i+1?' on':'')+'" onclick="window._mood('+(i+1)+')">'+e+'</button>';}).join('')
      + '</div></div>'
      + '<div class="card" style="margin-bottom:12px">'
      + '<div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:10px">ЗАМЕТКА (НЕОБЯЗАТЕЛЬНО)</div>'
      + '<textarea class="input" id="day-note" placeholder="Как прошёл день?" style="height:80px;resize:none;display:block;line-height:1.5" rows="3">'+( todayLog.note||'')+'</textarea></div>'
      + '<button class="btn-primary" onclick="window._saveDay()">💾 Сохранить</button></div>';

    window._adj=function(d){puffs=Math.max(0,puffs+d);render();};
    window._mood=function(m){mood=m;render();};
    window._saveDay=function(){
      var note=document.getElementById('day-note');
      Storage.logDay(todayKey,puffs,mood,note?note.value:'');
      Toast.show('✅ Сохранено','success');
      if(puffs===0){var m=document.getElementById('cday-msg');if(m)confetti(m);}
      var newAchs=Storage.checkAndUnlockAchievements();
      newAchs.forEach(function(a){Toast.show(a.emoji+' '+a.name,'success');});
    };
  }
  render();
},


breathing(el, data) {
  var cycles = 0, maxCycles = 3, phase = 'idle', timer = null;
  function render() {
    el.innerHTML = '<div class="screen screen-full" style="text-align:center;padding-top:40px;background:linear-gradient(135deg,#E8EAF6,#F3E5F5)">'
      + '<button onclick="App.back()" style="position:absolute;top:calc(20px + var(--st));left:16px;color:var(--text2);font-size:14px">← Назад</button>'
      + '<h2 style="font-size:22px;font-weight:800;margin-bottom:6px">Дыхание 4-7-8</h2>'
      + '<p style="color:var(--text2);font-size:14px;margin-bottom:32px">'+cycles+' / '+maxCycles+' циклов завершено</p>'
      + '<div class="breath-circle" id="bcirc"><div id="bph" style="font-size:16px;font-weight:700;color:var(--text)">'+(phase==='idle'?'Готов?':''  )+'</div>'
      + '<div id="bcnt" style="font-size:32px;font-weight:800;color:var(--blue);margin-top:4px;font-variant-numeric:tabular-nums"></div></div>'
      + '<p id="bguide" style="color:var(--text2);font-size:15px;margin-top:32px;line-height:1.6">'
      + (phase==='idle'?'Вдох 4с → Задержка 7с → Выдох 8с':'')+'</p>'
      + '<div style="margin-top:32px">'
      + (phase==='idle'?'<button class="btn-primary" style="max-width:200px;margin:0 auto" onclick="window._startBreath()">▶ Начать</button>'
        :'<button class="btn-secondary" style="max-width:200px;margin:0 auto" onclick="window._stopBreath()">⏹ Стоп</button>')
      + '</div>'
      + (cycles>=maxCycles?'<div class="card" style="margin:24px 16px;background:var(--green-light);border-color:rgba(76,175,130,.2)">'
        +'<div style="color:var(--green);font-weight:700;font-size:15px">✅ '+maxCycles+' цикла завершены! Тяга должна снизиться.</div>'
        +'<button class="btn-primary" style="margin-top:12px" onclick="App.back()">← Вернуться</button></div>':'')
      + '</div>';
    document.getElementById('bcirc').className = 'breath-circle ' + phase;
  }
  function runCycle() {
    var ph=document.getElementById('bph'), cnt=document.getElementById('bcnt'), guide=document.getElementById('bguide');
    var circ=document.getElementById('bcirc');
    if(!ph||!cnt) return;
    phase='inhale'; render();
    ph=document.getElementById('bph'); cnt=document.getElementById('bcnt');
    if(ph)ph.textContent='Вдох...';
    if(cnt)cnt.textContent='4';
    if(circ){circ.className='breath-circle inhale';}
    var t=4; var iv1=setInterval(function(){t--;if(cnt)cnt.textContent=String(t);if(t<=0){clearInterval(iv1);holdPhase();}},1000);
    timer=iv1;
  }
  function holdPhase(){
    var ph=document.getElementById('bph'),cnt=document.getElementById('bcnt'),circ=document.getElementById('bcirc');
    phase='hold';
    if(ph)ph.textContent='Задержи...';
    if(circ)circ.className='breath-circle hold';
    var t=7; if(cnt)cnt.textContent=String(t);
    var iv=setInterval(function(){t--;if(cnt)cnt.textContent=String(t);if(t<=0){clearInterval(iv);exhalePhase();}},1000);
    timer=iv;
  }
  function exhalePhase(){
    var ph=document.getElementById('bph'),cnt=document.getElementById('bcnt'),circ=document.getElementById('bcirc');
    phase='exhale';
    if(ph)ph.textContent='Выдох...';
    if(circ)circ.className='breath-circle exhale';
    var t=8; if(cnt)cnt.textContent=String(t);
    var iv=setInterval(function(){t--;if(cnt)cnt.textContent=String(t);if(t<=0){clearInterval(iv);cycles++;if(cycles<maxCycles){runCycle();}else{phase='idle';render();}}},1000);
    timer=iv;
  }
  window._startBreath=function(){cycles=0;runCycle();};
  window._stopBreath=function(){if(timer)clearInterval(timer);phase='idle';render();};
  render();
},

health(el, data) {
  var u = data.user, p = data.progress;
  var quitDate = u.quitDate ? new Date(u.quitDate) : null;
  var now = new Date();
  var minsSinceQuit = quitDate ? Math.max(0,Math.floor((now-quitDate)/60000)) : 0;
  el.innerHTML = '<div class="screen">'
    + '<h2 style="font-size:22px;font-weight:800;margin-bottom:4px">🫁 Здоровье</h2>'
    + '<p style="color:var(--text2);font-size:14px;margin-bottom:20px">Что происходит в твоём теле</p>'
    + (!u.quitDate?'<div class="card" style="background:var(--orange-light);border-color:rgba(245,166,35,.2);margin-bottom:16px;color:var(--orange)">Установи дату отказа в настройках чтобы видеть прогресс</div>':'')
    + HEALTH.map(function(h){
        var done = minsSinceQuit >= h.mins;
        var isNext = !done && HEALTH.findIndex(function(x){return minsSinceQuit<x.mins;}) === HEALTH.indexOf(h);
        var cls = done?'done':isNext?'next':'future';
        var rem = isNext ? fmtMins(h.mins - minsSinceQuit) + ' осталось' : '';
        return '<div class="health-item">'
          + '<div class="health-dot ' + cls + '">' + (done?'✓':h.icon) + '</div>'
          + '<div style="flex:1;padding:12px;border-radius:12px;background:'+(done?'var(--card)':isNext?'var(--blue-light)':'var(--bg)')+';border:1px solid '+(done?'var(--border)':isNext?'rgba(91,141,239,.2)':'transparent')+';">'
          + '<div style="font-weight:700;font-size:15px;color:'+(done?'var(--green)':isNext?'var(--blue)':'var(--text3)')+'">'+h.title+'</div>'
          + '<div style="color:var(--text2);font-size:13px;margin-top:3px;line-height:1.4">'+h.desc+'</div>'
          + (isNext?'<div style="color:var(--blue);font-size:12px;font-weight:700;margin-top:6px">⏱ '+rem+'</div>':'')
          + '<div style="color:var(--text3);font-size:11px;margin-top:4px">'+fmtMins(h.mins)+'</div>'
          + '</div></div>';
      }).join('')
    + '</div>';
},

savings(el, data) {
  var u = data.user;
  var quitDate = u.quitDate ? new Date(u.quitDate) : null;
  var now = new Date();
  var daysSince = quitDate ? Math.max(0,Math.floor((now-quitDate)/86400000)) : 0;
  var saved = Math.round(daysSince * (u.dailyCost||200));
  el.innerHTML = '<div class="screen">'
    + '<h2 style="font-size:22px;font-weight:800;margin-bottom:4px">💰 Экономия</h2>'
    + '<p style="color:var(--text2);font-size:14px;margin-bottom:20px">Деньги, которые остались с тобой</p>'
    + '<div class="card" style="text-align:center;margin-bottom:16px;background:linear-gradient(135deg,#F0FFF8,#FFF9F0)">'
    + '<div style="font-size:13px;color:var(--text2);font-weight:600;margin-bottom:8px">УЖЕ СЭКОНОМЛЕНО</div>'
    + '<div style="font-size:48px;font-weight:900;color:var(--green)">₽' + saved.toLocaleString() + '</div>'
    + '<div style="color:var(--text2);font-size:14px;margin-top:4px">за ' + fmtDays(daysSince) + '</div>'
    + '</div>'
    + '<div style="font-size:15px;font-weight:700;margin-bottom:12px">На что это можно потратить:</div>'
    + SAVINGS_GOALS.map(function(g){
        var pct = Math.min(100,Math.round((saved/g.price)*100));
        return '<div class="card card-sm" style="margin-bottom:10px">'
          + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">'
          + '<div style="font-size:24px">'+g.emoji+'</div>'
          + '<div style="flex:1"><div style="font-weight:600">'+g.name+'</div><div style="color:var(--text2);font-size:13px">₽'+g.price.toLocaleString()+'</div></div>'
          + '<div style="font-size:14px;font-weight:700;color:'+(pct>=100?'var(--green)':'var(--text3)')+'">'+pct+'%</div>'
          + '</div>'
          + '<div class="pbar"><div class="pbar-fill" style="width:'+pct+'%;background:'+(pct>=100?'linear-gradient(90deg,var(--green),#3DA870)':'linear-gradient(90deg,var(--blue),#4B8EEF)')+'"></div></div>'
          + '</div>';
      }).join('')
    + '<div class="card" style="margin-top:8px">'
    + '<div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:10px">ПРОЕКЦИЯ</div>'
    + [['1 месяц',30],['3 месяца',90],['1 год',365]].map(function(p){
        return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">'
          + '<span style="color:var(--text2)">'+p[0]+'</span>'
          + '<span style="font-weight:700;color:var(--green)">₽'+Math.round(p[1]*(u.dailyCost||200)).toLocaleString()+'</span></div>';
      }).join('')
    + '</div></div>';
},

achievements(el, data) {
  var p = data.progress;
  var cats = [{id:'level',name:'Уровни программы'},{id:'streak',name:'Серия дней'},{id:'practice',name:'Практика'}];
  el.innerHTML = '<div class="screen">'
    + '<h2 style="font-size:22px;font-weight:800;margin-bottom:4px">🏆 Достижения</h2>'
    + '<p style="color:var(--text2);font-size:14px;margin-bottom:16px">'+p.achievements.length+' из '+ACHIEVEMENTS.length+'</p>'
    + '<div class="pbar" style="margin-bottom:24px"><div class="pbar-fill" style="width:'+Math.round((p.achievements.length/ACHIEVEMENTS.length)*100)+'%"></div></div>'
    + cats.map(function(cat){
        var achs = ACHIEVEMENTS.filter(function(a){return a.cat===cat.id;});
        return '<div style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:10px;margin-top:8px">'+cat.name.toUpperCase()+'</div>'
          + '<div class="ach-grid" style="margin-bottom:16px">'
          + achs.map(function(a){
              var done = p.achievements.includes(a.id);
              return '<div class="ach-card'+(done?'':' locked')+'">'
                + '<div class="ach-icon">'+(done?a.emoji:'🔒')+'</div>'
                + '<div class="ach-name">'+a.name+'</div>'
                + '<div class="ach-desc">'+a.desc+'</div>'
                + '</div>';
            }).join('')
          + '</div>';
      }).join('')
    + '</div>';
},

journal(el, data) {
  var journal = data.journal || [];
  el.innerHTML = '<div class="screen">'
    + '<h2 style="font-size:22px;font-weight:800;margin-bottom:4px">📔 Дневник</h2>'
    + '<p style="color:var(--text2);font-size:14px;margin-bottom:20px">Триггеры и наблюдения</p>'
    + '<button class="btn-primary" style="margin-bottom:16px" onclick="App.navigate('urge-help')">+ Записать тягу</button>'
    + (journal.length===0
      ? '<div class="card" style="text-align:center;padding:32px"><div style="font-size:32px;margin-bottom:8px">📭</div><div style="color:var(--text2)">Записей пока нет</div></div>'
      : journal.slice(0,30).map(function(j){
          var d = new Date(j.date);
          var typeLabels = {body:'🫀 Тело',emotion:'💚 Эмоция',thought:'💭 Мысль',situation:'🌍 Ситуация'};
          return '<div class="card card-sm" style="margin-bottom:8px">'
            + '<div style="display:flex;justify-content:space-between;align-items:flex-start">'
            + '<div style="font-size:13px;font-weight:600;color:var(--text)">'+(typeLabels[j.type]||'Запись')+'</div>'
            + '<div style="font-size:11px;color:var(--text3)">'+d.toLocaleDateString('ru')+'</div></div>'
            + (j.intensity?'<div style="color:var(--text2);font-size:13px;margin-top:4px">Интенсивность: '+j.intensity+'/10</div>':'')
            + '<div style="font-size:12px;margin-top:4px;padding:4px 10px;border-radius:10px;display:inline-block;background:'+(j.result==='won'?'var(--green-light)':'var(--red-light)')+';color:'+(j.result==='won'?'var(--green)':'var(--red)')+'font-weight:600">'+(j.result==='won'?'✓ Справился':'Использовал')+'</div>'
            + '</div>';
        }).join('')
    )
    + '</div>';
},

settings(el, data) {
  var u = data.user;
  el.innerHTML = '<div class="screen">'
    + '<button onclick="App.back()" style="color:var(--text2);font-size:14px;margin-bottom:16px">← Назад</button>'
    + '<h2 style="font-size:22px;font-weight:800;margin-bottom:20px">⚙️ Настройки</h2>'
    + '<div class="card" style="margin-bottom:12px">'
    + '<div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:12px">ПРОФИЛЬ</div>'
    + '<div class="input-group"><label class="input-label">ИМЯ</label><input class="input" id="s-name" value="'+(u.name||'')+'"></div>'
    + '<div class="input-group"><label class="input-label">ДАТА ОТКАЗА</label><input class="input" id="s-date" type="date" value="'+(u.quitDate?u.quitDate.split('T')[0]:'')+'"></div>'
    + '<div class="input-group"><label class="input-label">РАСХОДЫ ₽/ДЕНЬ</label><input class="input" id="s-cost" type="number" value="'+(u.dailyCost||200)+'"></div>'
    + '<div class="input-group" style="margin:0"><label class="input-label">ЗАТЯЖЕК/ДЕНЬ</label><input class="input" id="s-puffs" type="number" value="'+(u.dailyPuffs||200)+'"></div>'
    + '</div>'
    + '<button class="btn-primary" style="margin-bottom:10px" onclick="window._saveSettings()">💾 Сохранить</button>'
    + '<button class="btn-danger" onclick="window._resetApp()">⟲ Сбросить все данные</button>'
    + '</div>';
  window._saveSettings=function(){
    Storage.updateUser({
      name:document.getElementById('s-name').value||u.name,
      quitDate:document.getElementById('s-date').value||u.quitDate,
      dailyCost:+document.getElementById('s-cost').value||u.dailyCost,
      dailyPuffs:+document.getElementById('s-puffs').value||u.dailyPuffs
    });
    Toast.show('✅ Сохранено','success');
  };
  window._resetApp=function(){
    if(confirm('Сбросить все данные? Это действие нельзя отменить.')){
      Storage.reset(); location.reload();
    }
  };
}
}; // end Screens

