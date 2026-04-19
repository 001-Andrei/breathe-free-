
// ═══ STORAGE ═══
const Storage = {
  KEY: 'breathe_v2',

  get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  },

  save(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch(e) {}
  },

  init() {
    const existing = this.get();
    if (existing) return existing;
    const fresh = {
      user: {
        name: '', quitDate: null, quitMethod: 'cold',
        deviceType: 'iqos',
        gradualReductionPct: 20,
        gradualStartDate: null,
        dailyPuffs: 20, packPrice: 6.50, packSize: 20, dailyCost: 6.50,
        savingsGoals: null,
        values: [], currentLevel: 1, setupComplete: false
      },
      progress: {
        smokeFreedays: 0, longestStreak: 0,
        totalPuffsAvoided: 0, moneySaved: 0,
        exercisesCompleted: [], levelsUnlocked: [1],
        achievements: [], consecutiveSmokeFree: 0,
        sosWins: 0, lastLogDate: null
      },
      dailyLogs: {},
      journal: [],
      valuesJournal: [],
      settings: { notifications: false, reminderTime: '20:00' },
      aiAdvice: { apiKey: '', date: null, text: null, sosDate: null, sosText: null }
    };
    this.save(fresh);
    return fresh;
  },

  getUser() { return (this.get() || this.init()).user; },
  getProgress() { return (this.get() || this.init()).progress; },
  getDailyLogs() { return (this.get() || this.init()).dailyLogs; },
  getJournal() { return (this.get() || this.init()).journal; },

  updateUser(patch) {
    const d = this.get() || this.init();
    Object.assign(d.user, patch);
    this.save(d);
  },

  getGradualGoalForDate(dateStr, userObj) {
    const d = this.get() || this.init();
    const u = userObj || d.user;
    if (!u || u.quitMethod !== 'gradual') return null;
    const start = new Date((u.gradualStartDate || u.quitDate || new Date().toISOString()).split('T')[0]);
    const current = new Date((dateStr || new Date().toISOString()).split('T')[0]);
    const dayMs = 24 * 60 * 60 * 1000;
    const weekIndex = Math.max(0, Math.floor((current - start) / dayMs / 7));
    const reduction = Math.min(90, Math.max(5, +u.gradualReductionPct || 20)) / 100;
    const base = Math.max(1, +u.dailyPuffs || 1);
    const target = Math.round(base * Math.pow(1 - reduction, weekIndex));
    return Math.max(0, target);
  },

  updateProgress(patch) {
    const d = this.get() || this.init();
    Object.assign(d.progress, patch);
    this.save(d);
  },

  logDay(date, puffs, mood, note) {
    const d = this.get() || this.init();
    if (!d.dailyLogs[date]) d.dailyLogs[date] = { puffs: 0, mood: 3, cravings: [], note: '' };
    d.dailyLogs[date].puffs = puffs;
    if (mood !== undefined) d.dailyLogs[date].mood = mood;
    if (note !== undefined) d.dailyLogs[date].note = note;
    // Update streak
    this._updateStreak(d);
    this.save(d);
    return d;
  },

  logCraving(date, craving) {
    const d = this.get() || this.init();
    if (!d.dailyLogs[date]) d.dailyLogs[date] = { puffs: 0, mood: 3, cravings: [], note: '' };
    d.dailyLogs[date].cravings.push(craving);
    this.save(d);
  },

  completeExercise(exId) {
    const d = this.get() || this.init();
    if (!d.progress.exercisesCompleted.includes(exId)) {
      d.progress.exercisesCompleted.push(exId);
    }
    this.save(d);
    return d;
  },

  unlockLevel(lvlId) {
    const d = this.get() || this.init();
    if (!d.progress.levelsUnlocked.includes(lvlId)) {
      d.progress.levelsUnlocked.push(lvlId);
    }
    this.save(d);
  },

  unlockAchievement(achId) {
    const d = this.get() || this.init();
    if (!d.progress.achievements.includes(achId)) {
      d.progress.achievements.push(achId);
    }
    this.save(d);
    return d;
  },

  addJournalEntry(entry) {
    const d = this.get() || this.init();
    d.journal.unshift({ ...entry, date: new Date().toISOString() });
    this.save(d);
  },

  addValuesEntry(entry) {
    const d = this.get() || this.init();
    if (!d.valuesJournal) d.valuesJournal = [];
    d.valuesJournal.unshift({ ...entry, date: new Date().toISOString() });
    this.save(d);
  },

  _updateStreak(d) {
    const logs = d.dailyLogs;
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let cur = new Date();
    while (true) {
      const k = cur.toISOString().split('T')[0];
      const log = logs[k];
      if (log && log.puffs === 0) { streak++; }
      else if (k !== today) break;
      cur.setDate(cur.getDate() - 1);
      if (streak > 90) break;
    }
    d.progress.consecutiveSmokeFree = streak;
    if (streak > d.progress.longestStreak) d.progress.longestStreak = streak;
    // Total smoke-free days
    d.progress.smokeFreedays = Object.values(logs).filter(l => l.puffs === 0).length;
    // Auto-unlock Phase 2 levels (5-8) when streak >= 7 and previous level complete
    if (streak >= 7) {
      const exCounts = { 4: 5, 5: 5, 6: 5, 7: 5 }; // exercises per level
      [5, 6, 7, 8].forEach(lvlId => {
        if (!d.progress.levelsUnlocked.includes(lvlId)) {
          const prevId = lvlId - 1;
          const needed = exCounts[prevId] || 4;
          const prevDone = d.progress.exercisesCompleted.filter(e => e.startsWith(prevId + '.')).length >= needed;
          if (prevDone) d.progress.levelsUnlocked.push(lvlId);
        }
      });
    }
    // Money saved — based on actual unsmoked sticks × price per stick
    const u = d.user;
    if (u.dailyPuffs) {
      const sticksSaved = Object.values(logs).reduce((s, l) => s + Math.max(0, u.dailyPuffs - l.puffs), 0);
      d.progress.totalPuffsAvoided = sticksSaved;
      const pricePerStick = (u.packPrice || 6.50) / (u.packSize || u.dailyPuffs || 20);
      d.progress.moneySaved = Math.round(sticksSaved * pricePerStick * 100) / 100;
    }
  },

  checkAndUnlockAchievements() {
    const d = this.get();
    if (!d) return [];
    const p = d.progress;
    const newOnes = [];
    for (const ach of ACHIEVEMENTS) {
      if (!p.achievements.includes(ach.id) && ach.check(p)) {
        p.achievements.push(ach.id);
        newOnes.push(ach);
      }
    }
    if (newOnes.length) this.save(d);
    return newOnes;
  },

  saveAIKey(key) {
    const d = this.get() || this.init();
    if (!d.aiAdvice) d.aiAdvice = { apiKey: '', date: null, text: null, sosDate: null, sosText: null };
    d.aiAdvice.apiKey = key;
    this.save(d);
  },

  saveAIAdvice(date, text) {
    const d = this.get() || this.init();
    if (!d.aiAdvice) d.aiAdvice = { apiKey: '', date: null, text: null, sosDate: null, sosText: null };
    d.aiAdvice.date = date;
    d.aiAdvice.text = text;
    this.save(d);
  },

  saveSosAdvice(date, text) {
    const d = this.get() || this.init();
    if (!d.aiAdvice) d.aiAdvice = { apiKey: '', date: null, text: null, sosDate: null, sosText: null };
    d.aiAdvice.sosDate = date;
    d.aiAdvice.sosText = text;
    this.save(d);
  },

  reset() {
    localStorage.removeItem(this.KEY);
  }
};
