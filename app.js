import { clinicalData } from './protocols.js';
import * as C from './clinical.js';
import { evaluatePlan, autoContext, SOURCES, cardiacHistoryFrom } from './plan-engine.js';

const VERSION = '21.5';
const AUTO_DISCRIMINATOR_TEXT = 'Abnormal vital signs';
const HISTORY_KEY = 'triage_history_v20';
const CURRENT_KEY = 'triage_current';
const HISTORY_TTL_MS = 12 * 60 * 60 * 1000;
const CHILD_CHART = /Child|Baby|Neonate|Worried Parent/;
const ADULT_CHART = /Adult/;
// "Still to record" items that belong to sections folded away in fast triage.
const LATER_IN_FAST = /^(Clinical Frailty Scale|High-risk medicine groups|Child safeguarding)/;
const MIC_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>';

// localStorage/sessionStorage can throw (private windows, locked-down profiles) - never let that break triage.
const store = {
    get(key, fallback = null, session = false) {
        try { const v = (session ? sessionStorage : localStorage).getItem(key); return v === null ? fallback : v; } catch { return fallback; }
    },
    set(key, value, session = false) {
        try { (session ? sessionStorage : localStorage).setItem(key, value); } catch { /* preference just won't persist */ }
    },
    remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
};

const hhmm = (d) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
const ddmmyyyy = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
// NG253 risks are one word ('High'); NG254 risks carry their own wording ('Moderate to high risk (2 criteria)').
const sepsisRiskText = (sp) => (sp.guideline === 'NG254' ? sp.risk : `${sp.risk} risk`);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// EPR fields are often not Unicode-safe: keep the note to plain characters.
const plain = (s) => String(s ?? '').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/₂/g, '2').replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/·/g, '-').replace(/°/g, '').replace(/­/g, '');
const newSessionId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function freshState() {
    return {
        meta: { sessionId: newSessionId(), arrivalAt: new Date().toISOString(), startedAt: null, categorySetAt: null, lastCategory: null, obsAt: null, noteCopiedAt: null },
        patient: { ageValue: null, ageUnit: 'Years', age: null, weight: null, sex: '', pregnant: false, lmp: '', mobility: '', mobilityAssumed: false, arrivalMode: 'Self', ambulanceCallSign: '', ambulanceCaseId: '', localRef: '' },
        prehospital: { obs: { rr: null, sats: null, o2: null, sbp: null, dbp: null, hr: null, gcs: null, bm: null, ecg: '', pupils: '' }, hpc: '', tx: '', txTime: '', social: '' },
        obs: { rr: null, sats: null, o2: null, scale2: false, sbp: null, dbp: null, hr: null, temp: null, crt: null, avpu: null, gcsE: null, gcsV: null, gcsM: null, bm: null, ketones: null, pupils: '' },
        complaint: { name: '', raw: '', discriminator: null, noneApply: false, pain: null, painMethod: 'NRS', flacc: {} },
        history: { allergies: '', allergyReaction: '', pmh: '', meds: '', manualRiskFlags: {}, riskNone: false, treatmentNotes: '', planNarrative: '' },
        assess: {
            infection: null, sepsisFactors: {},
            headache: { trauma: null, sudden: null },
            headInjuryInvolved: false, ng232: {}, ng232Anticoag: null,
            stroke: { lkw: '', rosier: {}, rosierDone: false }, ecgDoneAt: null,
            fourAT: {}, nof: {}, mh: {},
            ng143: { feverReported: false, ticks: {} },
            paeds: { recentDose: null, accompaniedBy: '', safeguarding: {}, safeguardingNone: false },
            ipc: {}, ipcNone: false, corridor: {}, corridorCheckedAt: null
        },
        frailty: { cfs: null },
        screening: {},
        triage: { override: null, disposition: '', dispositionOther: '' },
        plan: [],
        ui: { pmhPromptsDismissed: false, pmhSignature: '' }
    };
}

// NICE NG232 result phrased as the nurse's action (the CT decision is the clinician's).
const NG232_ACTION = { '1h': 'Tell the ED doctor now', '8h': 'Tell the ED doctor', consider8h: 'Tell the ED doctor', observe4h: 'Tell the ED doctor' };
const ng232Nurse = (ng) => NG232_ACTION[ng.level] ? `${NG232_ACTION[ng.level]} - meets NICE criteria: ${ng.text}` : ng.text;

class TriageApp {
    constructor() {
        this.data = clinicalData;
        this.state = freshState();
        this.derived = {};
        this.built = {};
        this.$ = (id) => document.getElementById(id);

        this.initPreferences();
        this.purgeHistory();
        this.buildStatic();
        this.bindEvents();
        this.initSpeech();
        // A reload (or the browser discarding the tab) must not lose the patient being triaged.
        // Kept in sessionStorage: this tab only, gone when the tab is closed.
        let resumed = false;
        try {
            const saved = JSON.parse(store.get(CURRENT_KEY, 'null', true));
            if (saved && saved.meta && (saved.complaint.name || saved.complaint.raw || saved.patient.ageValue !== null)) {
                const f = freshState();
                Object.keys(f).forEach(k => { if (saved[k] && typeof f[k] === 'object' && !Array.isArray(f[k])) f[k] = Object.assign(f[k], saved[k]); else if (saved[k] !== undefined) f[k] = saved[k]; });
                this.state = f; resumed = true;
            }
        } catch { /* nothing to restore */ }
        this.restoreUI();
        if (resumed) this.toast('Patient restored after the page reloaded', 'info', { label: 'Start new patient', fn: () => this.newPatient() });
        window.addEventListener('pagehide', () => this.saveCurrent());

        if (store.get('seenVersion') !== VERSION) {
            store.set('seenVersion', VERSION);
            this.openModal('modal-whatsnew');
        }
        this.clock = setInterval(() => { this.renderDecision(); this.renderTimers(); }, 30000);
    }

    // ------------------------------------------------------------------ preferences & settings
    initPreferences() {
        if (store.get('theme') === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        if (store.get('quickMode') === 'on') { document.body.classList.add('quick-mode'); this.$('btn-quick-mode').classList.add('active'); this.$('btn-quick-mode').setAttribute('aria-pressed', 'true'); }
        this.shared = store.get('sharedComputer') === 'on';
        this.plainCopy = store.get('plainCopy') === 'on';
        this.dictation = store.get('dictation') === 'on';
        this.$('nurse-initials').value = store.get('initials', '', true) || '';
        this.$('set-shared').checked = this.shared;
        this.$('set-dictation').checked = this.dictation;
        this.$('set-dark').checked = store.get('theme') === 'dark';
        this.$('set-plain-copy').checked = this.plainCopy;
        this.$('btn-history').classList.toggle('hidden', this.shared);
    }

    // ------------------------------------------------------------------ state helpers
    set(path, value, opts = {}) {
        const keys = path.split('.');
        let obj = this.state;
        keys.slice(0, -1).forEach(k => { obj = obj[k]; });
        obj[keys[keys.length - 1]] = value;
        if (!this.state.meta.startedAt) this.state.meta.startedAt = new Date().toISOString();
        if (path.startsWith('obs.')) this.state.meta.obsAt = new Date().toISOString();
        if (!opts.silent) this.update();
    }

    update() {
        this.compute();
        this.render();
        this.saveCurrent();
        this.debouncedSave();
    }

    saveCurrent() { store.set(CURRENT_KEY, JSON.stringify(this.state), true); }

    // ------------------------------------------------------------------ clinical computation
    compute() {
        const s = this.state, p = s.patient, o = s.obs, d = this.data;
        p.age = !C.has(p.ageValue) ? null : (p.ageUnit === 'Months' ? p.ageValue / 12 : p.ageValue);
        const isPaeds = p.age !== null && p.age < 16;

        const risks = this.computeRiskFlags();
        const anticoagDetected = !!(s.history.manualRiskFlags.anticoag || risks.some(r => /Anticoagulant|DOAC|LMWH/.test(r)));

        let ews;
        if (p.pregnant) ews = { type: 'MEOWS', ...C.localMeows(o) };
        else if (isPaeds) ews = { type: 'PEWS', ...C.localPews(o, p.age, d.scoring.pews) };
        else ews = { type: 'NEWS2', ...C.news2(o, d.scoring.news2) };
        const newsResp = ews.type === 'NEWS2' ? C.news2Response(ews.score, ews.redParam) : null;
        const newsSum = ews.type === 'NEWS2' ? C.news2Summary(ews) : null;
        if (!s.assess.ng254) s.assess.ng254 = {}; // patients saved before NG254 was added
        const ng254Applies = p.age !== null && p.age < 16;
        const sepsis = ng254Applies
            ? C.sepsisNG254({
                age: p.age, pregnant: p.pregnant, infection: s.assess.infection, ticks: s.assess.ng254,
                obs: { ...o, gcs: [o.gcsE, o.gcsV, o.gcsM].every(C.has) ? Number(o.gcsE) + Number(o.gcsV) + Number(o.gcsM) : null },
                immunosuppressed: !!(s.history.manualRiskFlags.immunosuppressant || s.history.manualRiskFlags.steroid || s.history.manualRiskFlags.chemo || risks.some(r => /Immunosuppressant|Biologic|Steroid/.test(r)))
            })
            : C.sepsisNG253({ age: p.age, pregnant: p.pregnant, infection: s.assess.infection, news: ews.type === 'NEWS2' ? ews : { score: 0, complete: false, redParam: false } });

        const pain = C.mtsPain(s.complaint.pain);
        const feverTL = C.ng143TrafficLight({ age: p.age, obs: o, ticks: s.assess.ng143.ticks });
        const feverRelevant = feverTL.applicable && ((C.has(o.temp) && o.temp >= 38) || s.assess.ng143.feverReported);

        const flowchart = d.mtsFlowcharts[s.complaint.name] || null;
        const disc = flowchart && s.complaint.discriminator ? flowchart.find(x => x.text === s.complaint.discriminator) || null : null;
        const autoDisc = flowchart ? flowchart.find(x => x.text === AUTO_DISCRIMINATOR_TEXT) : null;

        const floors = [];
        if (autoDisc && ews.type === 'NEWS2' && p.age !== null && (ews.score >= 3 || ews.redParam)) {
            floors.push({ level: autoDisc.priority, reason: `${AUTO_DISCRIMINATOR_TEXT} (auto-detected from obs)` });
        }
        const partial = ews.complete ? '' : 'partial ';
        if (ews.type === 'NEWS2') {
            const nw = ews.complete ? `NEWS2 ${ews.score}` : `provisional NEWS2 at least ${ews.score}`;
            if (ews.score >= 7) floors.push({ level: 'Red', reason: `${nw} (7 or more)` });
            else if (ews.score >= 5) floors.push({ level: 'Orange', reason: `${nw} (5-6)` });
            else if (ews.score >= 3) floors.push({ level: 'Yellow', reason: nw });
        } else if (ews.type === 'PEWS') {
            if (ews.score >= 7) floors.push({ level: 'Red', reason: `${partial}local PEWS ${ews.score} (high)` });
            else if (ews.score >= 5) floors.push({ level: 'Orange', reason: `${partial}local PEWS ${ews.score}` });
        } else if (ews.score >= 3) {
            floors.push({ level: 'Orange', reason: `${partial}local MEOWS ${ews.score}` });
        }
        if (pain && pain.floor) floors.push({ level: pain.floor, reason: `${pain.band} pain ${s.complaint.pain}/10 (MTS pain ruler)` });
        // MTS 3rd edition v3.8 (2023) temperature discriminators, checked in the book 31 October 2026:
        // Hot baby (under 1 year, 38.5+) Orange; Very hot (41+) Orange; Hot (38.5+) Yellow. Not on injury flowcharts.
        if (C.has(o.temp) && p.age !== null && s.complaint.name && !/Injury|Wounds|Burns|Limb Problems|Falls|Major Trauma|Assault|Bites|Foreign Body|Needlestick/.test(s.complaint.name)) {
            const t = Number(o.temp);
            if (p.age < 1 && t >= 38.5) floors.push({ level: 'Orange', reason: `Hot baby (${t}°C, MTS)` });
            else if (t >= 41) floors.push({ level: 'Orange', reason: `Very hot (${t}°C, MTS)` });
            else if (t >= 38.5) floors.push({ level: 'Yellow', reason: `Hot (${t}°C, MTS)` });
        }
        if (s.assess.sepsisFactors.sepsis_rash || (feverRelevant && s.assess.ng143.ticks.non_blanching) || (sepsis.guideline === 'NG254' && s.assess.infection === 'yes' && s.assess.ng254.rash)) floors.push({ level: 'Orange', reason: 'Non-blanching rash' });

        const priority = C.triagePriority({ discriminator: disc, noneApply: s.complaint.noneApply, floors, override: s.triage.override });
        const level = priority.final;
        const seeBy = level ? C.seeBy(s.meta.arrivalAt, level, d.targetMinutes) : null;

        if (priority.triaged && level !== s.meta.lastCategory) {
            s.meta.lastCategory = level;
            s.meta.categorySetAt = new Date().toISOString();
        } else if (!priority.triaged) {
            s.meta.lastCategory = null;
            s.meta.categorySetAt = null;
        }

        // Streaming
        let stream = '-';
        if (level === 'Red') stream = 'Resus';
        else if (level === 'Orange' || level === 'Yellow') stream = 'Majors';
        else if (level === 'Green' || level === 'Blue') {
            stream = p.mobility === 'Walking' ? 'Minors / See & Treat' : (p.mobility ? 'Majors (mobility)' : 'Minors or Majors - record mobility');
        }
        if (level && isPaeds) stream = `Paeds ED (${stream})`;
        if (level && p.pregnant) stream = `Maternity / ${stream}`;

        // Reassessment timing (NEWS2 response; NG253 sepsis reassessment if shorter).
        // A provisional NEWS2 only sets a frequency when it already escalates (5+ or a red parameter):
        // a low partial score must never push the next obs hours away.
        let obsMins = newsSum ? newsSum.monitorMins : null;
        if (sepsis.status === 'assessed' && obsMins !== null && sepsis.reassessMins) obsMins = Math.min(obsMins, sepsis.reassessMins);
        // RCEM Vital Signs in Adults standard 2: abnormal vital signs are repeated within 60 minutes of the
        // first set. Any NEWS2 parameter scoring 1 or more counts as abnormal here (app interpretation).
        let rcemRepeat = false;
        if (newsSum && ews.complete && ews.score >= 1 && p.age !== null && p.age >= 16 && obsMins !== null && obsMins > 60) { obsMins = 60; rcemRepeat = true; }
        const obsBase = s.meta.obsAt ? new Date(s.meta.obsAt) : null;
        let nextObs = '-', nextObsAt = null;
        if (ews.type !== 'NEWS2') {
            // Local PEWS/MEOWS set their own frequency, but a sepsis re-check interval still applies.
            const sm = sepsis.status === 'assessed' && sepsis.reassessMins && sepsis.reassessMins <= 60 ? sepsis.reassessMins : null;
            if (sm && obsBase) { nextObsAt = new Date(obsBase.getTime() + sm * 60000); nextObs = `${hhmm(nextObsAt)} at the latest (sepsis: every ${sm} min); otherwise per local chart`; }
            else nextObs = 'Per local chart';
        }
        else if (ews.recorded === 0) nextObs = 'Obs not taken';
        else if (obsMins === null) nextObs = 'Finish the obs now';
        // Partial NEWS2 that already escalates: finishing the obs comes first, then the frequency.
        else if (!ews.complete) nextObs = `Finish the obs now, then ${obsMins === 0 ? 'continuous monitoring' : `at least every ${obsMins >= 60 ? `${obsMins / 60} h` : `${obsMins} min`}`}`;
        else if (obsMins === 0) nextObs = 'Continuous';
        else if (obsBase && obsMins) { nextObsAt = new Date(obsBase.getTime() + obsMins * 60000); nextObs = hhmm(nextObsAt) + (rcemRepeat ? ' (abnormal obs: repeat within 60 min - RCEM standard; then per NEWS2)' : ''); }

        const tools = this.activeTools(flowchart, disc, p.age);
        const ng232 = tools.ng232 ? C.ng232({ age: p.age, answers: s.assess.ng232, anticoagulated: s.assess.ng232Anticoag === null ? anticoagDetected : s.assess.ng232Anticoag }) : null;
        const rosier = tools.stroke ? C.rosier(s.assess.stroke.rosier, !!s.assess.stroke.rosierDone) : null;
        const fourAT = tools.fourAT ? C.fourAT(s.assess.fourAT) : null;
        const analgesia = isPaeds ? C.paedsAnalgesia({ age: p.age, weight: p.weight, weightCapKg: d.scoring.paedsSafety.weightCapKg }) : null;
        const gestation = p.pregnant && p.lmp ? C.gestationFromLmp(p.lmp) : null;
        const gcsTotal = [o.gcsE, o.gcsV, o.gcsM].every(C.has) ? Number(o.gcsE) + Number(o.gcsV) + Number(o.gcsM) : null;
        const ipcFlag = Object.values(s.assess.ipc).some(Boolean);

        // What is still missing before the note is complete.
        const missing = [];
        if (!store.get('initials', '', true)) missing.push('Triage nurse initials (top of screen)');
        if (p.age === null) missing.push('Age');
        if (!p.sex) missing.push('Sex');
        Object.values(this.invalid || {}).forEach(m => missing.unshift(m));
        if (!s.complaint.name) missing.push('Presenting complaint (choose a flowchart)');
        else if (!priority.triaged) missing.push('Discriminator - choose one, or "None of these apply"');
        // Age changed after the flowchart was chosen (or the wrong one was picked): flag it.
        if (s.complaint.name && p.age !== null && isPaeds && ADULT_CHART.test(s.complaint.name)) missing.push('Check the flowchart - it is for adults but the patient is under 16');
        if (s.complaint.name && p.age !== null && !isPaeds && CHILD_CHART.test(s.complaint.name)) missing.push('Check the flowchart - it is for children but the patient is 16 or over');
        if (ews.missing.length) missing.push(`Obs: ${ews.missing.join(', ')}`);
        if (!C.has(s.complaint.pain)) missing.push('Pain score');
        if (!s.history.allergies.trim()) missing.push('Allergies');
        if (!p.mobility) missing.push('Mobility');
        const frailty = isPaeds ? null : C.cfs(s.frailty.cfs);
        if (p.age !== null && p.age >= 65 && !frailty) missing.push('Clinical Frailty Scale (65 and over)');
        if (isPaeds && !C.has(p.weight)) missing.push('Weight (child)');
        if (isPaeds && !C.has(o.temp) && ews.type === 'PEWS') missing.push('Temp (child - needed for the sepsis and fever checks)');
        if (sepsis.status === 'not-asked' && (ews.score >= 3 || (C.has(o.temp) && (o.temp >= 38 || o.temp < 36)))) missing.push('Could this be an infection? (sepsis)');
        const hrTicked = Object.values(s.history.manualRiskFlags).some(Boolean);
        if (!hrTicked && !s.history.riskNone) missing.push(`High-risk medicine groups - tick any that apply or tap "${(this.autoRisks || []).length ? 'No other groups' : 'None of these'}"`);
        const sgConcern = !!(s.assess.paeds.safeguarding.nonmobile || s.assess.paeds.safeguarding.story || s.assess.paeds.safeguarding.notbrought);
        if (isPaeds && !sgConcern && !s.assess.paeds.safeguardingNone) missing.push('Child safeguarding - tick a concern or tap "No safeguarding concerns"');
        if (!ipcFlag && !s.assess.ipcNone) missing.push('Infection control - tick what applies or tap "No IPC flags"');
        if (tools.stroke) {
            if (!s.assess.stroke.lkw) missing.push('Stroke: time last known well');
            if (!s.assess.stroke.rosierDone) missing.push('Stroke: ROSIER - tick the findings, then tap "ROSIER complete"');
            if (!C.has(o.bm)) missing.push('Stroke: BM (hypoglycaemia can mimic stroke)');
        }
        if (tools.ecg && !s.assess.ecgDoneAt) missing.push('ECG (within 10 minutes of arrival)');

        this.derived = { frailty, isPaeds, risks, anticoagDetected, ews, newsResp, newsSum, sepsis, pain, feverTL, feverRelevant, flowchart, disc, autoDisc, floors, priority, level, seeBy, stream, nextObs, nextObsAt, tools, ng232, rosier, fourAT, analgesia, gestation, gcsTotal, ipcFlag, missing };
        this.derived.plan = evaluatePlan(this.planFacts(), d.bloodProfiles);
    }

    activeTools(flowchart, disc, age) {
        const t = this.data.assessmentTools, name = this.state.complaint.name;
        const inList = (list) => !!flowchart && list.includes(name);
        return {
            headache: name === 'Headache',
            ng232: inList(t.headInjury) || (inList(t.headInjuryOptional) && this.state.assess.headInjuryInvolved),
            ng232Optional: inList(t.headInjuryOptional),
            stroke: inList(t.stroke),
            ecg: inList(t.ecgTimer),
            fourAT: inList(t.delirium) || (age !== null && age >= 65 && !!flowchart),
            fourATOptional: !inList(t.delirium),
            mh: inList(t.mentalHealth),
            nof: !!disc && disc.text === t.nofDiscriminator
        };
    }

    computeRiskFlags() {
        const h = this.state.history;
        const medsRaw = (h.meds || '').toLowerCase();
        const words = medsRaw.split(/[^a-z]+/).filter(w => w.length >= 3);
        const risks = [];
        Object.entries(this.data.highRiskDrugs).forEach(([key, warning]) => {
            if (key.includes(' ') ? medsRaw.includes(key) : words.some(w => TriageApp.fuzzyMatch(w, key))) risks.push(warning);
        });
        this.autoRisks = [...new Set(risks)];
        (this.data.highRiskCategories || []).forEach(cat => { if (h.manualRiskFlags[cat.id]) risks.push(cat.warning); });
        return [...new Set(risks)];
    }

    // ------------------------------------------------------------------ fuzzy matching
    static levenshtein(a, b) {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
        for (let i = 1; i <= a.length; i++) {
            const curr = [i];
            for (let j = 1; j <= b.length; j++) curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = curr;
        }
        return prev[b.length];
    }

    static fuzzyMatch(word, target) {
        if (!word || !target) return false;
        word = word.toLowerCase(); target = target.toLowerCase();
        if (word.length < 3) return word === target;
        if (target.startsWith(word) || target.includes(word)) return true;
        if (Math.abs(word.length - target.length) > 3) return false;
        const tol = word.length <= 5 ? 1 : (word.length <= 9 ? 2 : 3);
        return TriageApp.levenshtein(word, target) <= tol;
    }

    searchCharts(query) {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        const names = Object.keys(this.data.mtsFlowcharts);
        const scores = new Map();
        const add = (n, sc, via = '') => { if (!scores.has(n) || scores.get(n).sc > sc) scores.set(n, { sc, via }); };
        names.forEach(n => {
            const l = n.toLowerCase();
            if (l === q) add(n, 0);
            else if (l.startsWith(q)) add(n, 1);
            else if (l.split(/[^a-z]+/).some(w => w && w.startsWith(q))) add(n, 2);
            else if (l.includes(q)) add(n, 3);
            else if (q.includes(' ') && q.split(/\s+/).every(w => l.includes(w))) add(n, 2.5);
        });
        Object.entries(this.data.complaintSynonyms).forEach(([term, charts]) => {
            if (term === q) charts.forEach(c => add(c, 0.5, term));
            else if (q.length >= 2 && term.startsWith(q)) charts.forEach(c => add(c, 1.5, term));
        });
        if (scores.size === 0 && q.length >= 4) {
            names.forEach(n => { if (n.toLowerCase().split(/[^a-z]+/).some(w => w.length >= 3 && TriageApp.fuzzyMatch(q, w))) add(n, 4); });
            Object.entries(this.data.complaintSynonyms).forEach(([term, charts]) => { if (term.length >= 4 && TriageApp.levenshtein(q, term) <= 2) charts.forEach(c => add(c, 4, term)); });
        }
        const age = this.state.patient.age;
        const agePenalty = (n) => age === null ? 0 : (age < 16 ? (ADULT_CHART.test(n) ? 0.3 : 0) : (CHILD_CHART.test(n) ? 0.3 : 0));
        return [...scores.entries()]
            .map(([n, v]) => ({ name: n, score: v.sc + agePenalty(n), via: v.via }))
            .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
            .slice(0, 8);
    }

    // ------------------------------------------------------------------ static UI built once
    buildStatic() {
        // Pain 0-10
        const pc = this.$('pain-btn-container');
        for (let i = 0; i <= 10; i++) {
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'pain-btn'; b.textContent = i; b.dataset.score = i;
            b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
            b.tabIndex = i === 0 ? 0 : -1;
            pc.appendChild(b);
        }
        // High-risk groups
        const grid = this.$('high-risk-meds-grid');
        (this.data.highRiskCategories || []).forEach(cat => {
            const label = document.createElement('label');
            label.className = 'hr-med-chip';
            label.title = cat.hint || '';
            label.innerHTML = `<input type="checkbox" data-cat-id="${cat.id}"> <span>${cat.label}</span>`;
            grid.appendChild(label);
        });
        this.buildScreening();
    }

    buildScreening() {
        const c = this.$('screening-container');
        c.innerHTML = '';
        Object.entries(this.data.screening).forEach(([key, def]) => {
            const div = document.createElement('div');
            div.className = 'screening-item';
            div.id = `screen-${key}`;
            let html = `<div><span class="screening-title">${esc(def.label)}</span>${def.info ? this.infoPopoverHTML(def.info) : ''}</div>`;
            if (def.options) {
                html += `<select id="screen-input-${key}" data-screen="${key}"><option value="">Not asked</option>${def.options.map(o => `<option value="${o.val}">${esc(o.text)}</option>`).join('')}</select>`;
            } else {
                html += `<div class="segmented-control" id="toggle-${key}" data-screen="${key}"><button type="button" data-value="No">No</button><button type="button" data-value="Yes">Yes</button></div>`;
            }
            div.innerHTML = html;
            c.appendChild(div);
        });
    }

    infoPopoverHTML(text) {
        if (!text) return '';
        return `<span class="info-pop"><button type="button" class="info-btn" aria-label="Reference">i</button><span class="info-bubble">${esc(text)}</span></span>`;
    }

    // ------------------------------------------------------------------ events
    bindEvents() {
        const num = C.toNumber;
        const bindInput = (id, path, transform = (v) => v, extra) => {
            const el = this.$(id);
            if (!el) return;
            const evt = el.type === 'checkbox' ? 'change' : (el.tagName === 'SELECT' ? 'change' : 'input');
            el.addEventListener(evt, () => {
                const val = el.type === 'checkbox' ? el.checked : transform(el.value);
                // A validator that returns false means "not possible": keep the typed text so the
                // nurse can see and correct it, but never score it or put it in the note.
                const ok = extra ? extra(val) : true;
                this.set(path, ok === false ? null : val);
            });
        };

        // Patient
        bindInput('patient-age', 'patient.ageValue', num, (v) => this.validateObsField('patient-age', v));
        bindInput('patient-weight', 'patient.weight', num, (v) => this.validateObsField('patient-weight', v));
        bindInput('check-pregnant', 'patient.pregnant');
        bindInput('date-lmp', 'patient.lmp');
        bindInput('patient-ref', 'patient.localRef');
        bindInput('amb-callsign', 'patient.ambulanceCallSign');
        bindInput('amb-caseid', 'patient.ambulanceCaseId');
        this.$('arrival-time').addEventListener('change', (e) => {
            const [h, m] = (e.target.value || '').split(':').map(Number);
            if (Number.isNaN(h) || Number.isNaN(m)) return;
            const now = new Date();
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
            if (d > now) d.setDate(d.getDate() - 1); // an arrival time "later" than now was yesterday
            this.set('meta.arrivalAt', d.toISOString());
        });

        // Handover
        ['hpc', 'tx', 'social'].forEach(k => bindInput(`ph-${k}`, `prehospital.${k}`));
        bindInput('ph-tx-time', 'prehospital.txTime');
        ['rr', 'sats', 'sbp', 'dbp', 'hr', 'gcs', 'bm'].forEach(k => bindInput(`ph-obs-${k}`, `prehospital.obs.${k}`, num));
        ['ecg', 'pupils'].forEach(k => bindInput(`ph-obs-${k}`, `prehospital.obs.${k}`));

        // Obs
        ['rr', 'sats', 'sbp', 'dbp', 'hr', 'temp', 'crt', 'bm', 'ketones'].forEach(k => bindInput(`obs-${k}`, `obs.${k}`, num, (v) => this.validateObsField(`obs-${k}`, v)));
        bindInput('obs-pupils', 'obs.pupils');
        bindInput('obs-scale2', 'obs.scale2');
        ['e', 'v', 'm'].forEach(k => bindInput(`obs-gcs-${k}`, `obs.gcs${k.toUpperCase()}`, num));

        // History
        bindInput('allergies', 'history.allergies');
        bindInput('allergy-reaction', 'history.allergyReaction');
        bindInput('pmh', 'history.pmh');
        bindInput('treatment-notes', 'history.treatmentNotes');
        bindInput('plan-narrative', 'history.planNarrative');
        const meds = this.$('meds');
        meds.addEventListener('input', () => this.set('history.meds', meds.value));
        meds.addEventListener('keyup', (e) => this.handleMedsAutocomplete(e));
        meds.addEventListener('blur', () => setTimeout(() => this.$('meds-suggestions').classList.add('hidden'), 200));
        this.$('high-risk-meds-grid').addEventListener('change', (e) => {
            const id = e.target.dataset.catId;
            if (!id) return;
            e.target.closest('.hr-med-chip').classList.toggle('checked', e.target.checked);
            if (e.target.checked) this.state.history.riskNone = false;
            this.set(`history.manualRiskFlags.${id}`, e.target.checked);
        });

        // Segmented controls (click + keyboard)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.segmented-control button');
            if (!btn) return;
            const group = btn.parentElement;
            this.onSegmented(group, btn.dataset.value, btn);
        });
        document.addEventListener('keydown', (e) => this.onSegmentedKey(e));

        // Screening
        this.$('screening-container').addEventListener('change', (e) => {
            const key = e.target.dataset.screen;
            if (key) this.set(`screening.${key}`, e.target.value);
        });

        // Complaint search (combobox)
        this.bindCombobox();
        this.$('quick-actions-bar').addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (!b) return;
            if (b.id === 'btn-body-map') return this.openBodyMap();
            if (b.dataset.chart) this.setComplaint(b.dataset.chart);
        });
        this.$('body-map-grid').addEventListener('click', (e) => {
            const b = e.target.closest('.map-zone');
            if (!b) return;
            this.closeModal('modal-bodymap');
            this.setComplaint(b.dataset.chart);
        });
        this.$('btn-close-map').addEventListener('click', () => this.closeModal('modal-bodymap'));

        // Discriminators (roving listbox)
        const dc = this.$('discriminator-container');
        dc.addEventListener('click', (e) => {
            const b = e.target.closest('.discriminator');
            if (b) this.chooseDiscriminator(b.dataset.text || null, b.classList.contains('none-apply'));
        });
        dc.addEventListener('keydown', (e) => {
            const items = [...dc.querySelectorAll('.discriminator')];
            const i = items.indexOf(document.activeElement);
            if (i < 0) return;
            let next = null;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = items[Math.min(i + 1, items.length - 1)];
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = items[Math.max(i - 1, 0)];
            if (e.key === 'Home') next = items[0];
            if (e.key === 'End') next = items[items.length - 1];
            if (next) { e.preventDefault(); items.forEach(x => { x.tabIndex = -1; }); next.tabIndex = 0; next.focus(); }
        });

        // Pain
        const pcont = this.$('pain-btn-container');
        pcont.addEventListener('click', (e) => {
            const b = e.target.closest('.pain-btn');
            if (b) { this.state.complaint.painMethod = 'NRS'; this.set('complaint.pain', Number(b.dataset.score)); }
        });
        let painBuffer = '', painTimer = null;
        pcont.addEventListener('keydown', (e) => {
            const cur = C.has(this.state.complaint.pain) ? this.state.complaint.pain : -1;
            if (/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                painBuffer += e.key;
                clearTimeout(painTimer);
                let v = Number(painBuffer);
                if (v > 10) { painBuffer = e.key; v = Number(e.key); }
                this.state.complaint.painMethod = 'NRS';
                this.set('complaint.pain', v);
                painTimer = setTimeout(() => { painBuffer = ''; }, 700);
                this.focusPain();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); this.set('complaint.pain', Math.min(10, cur + 1)); this.focusPain(); }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); this.set('complaint.pain', Math.max(0, cur - 1)); this.focusPain(); }
        });
        // Clinical Frailty Scale: 1-9 buttons, click the active one again to clear.
        const ccont = this.$('cfs-btn-container');
        ccont.innerHTML = C.CFS_LEVELS.map(l => `<button type="button" class="pain-btn cfs-btn" role="radio" aria-checked="false" data-cfs="${l.score}" title="${esc(l.title)}">${l.score}</button>`).join('');
        const setCfs = (v) => { this.set('frailty.cfs', v); const a = ccont.querySelector('.cfs-btn.active') || ccont.querySelector('.cfs-btn'); if (a) a.focus(); };
        ccont.addEventListener('click', (e) => {
            const b = e.target.closest('.cfs-btn');
            if (b) setCfs(this.state.frailty.cfs === Number(b.dataset.cfs) ? null : Number(b.dataset.cfs));
        });
        ccont.addEventListener('keydown', (e) => {
            const cur = this.state.frailty.cfs;
            if (/^[1-9]$/.test(e.key)) { e.preventDefault(); setCfs(Number(e.key)); }
            else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setCfs(Math.min(9, (cur || 0) + 1)); }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setCfs(Math.max(1, (cur || 2) - 1)); }
        });
        this.$('cfs-guide').innerHTML = `<div class="tool-head"><span class="tool-title">Clinical Frailty Scale - choose the description that best fits their baseline</span></div>` +
            `<div class="cfs-list">${C.CFS_LEVELS.map(l => `<button type="button" class="cfs-row" data-cfs="${l.score}"><span class="cfs-num">${l.score}</span><span><strong>${esc(l.title)}</strong><small>${esc(l.text)}</small></span></button>`).join('')}</div>` +
            `<p class="tool-note"><strong>Score the baseline:</strong> how the person was about 2 weeks before this illness or injury. Validated for people aged 65 and over; not validated for younger people, people with a stable single disability or people with a learning disability.</p>` +
            `<p class="tool-note"><strong>Dementia:</strong> ${esc(C.CFS_DEMENTIA)}</p><p class="tool-note cfs-source">${esc(C.CFS_SOURCE)}</p>`;
        this.$('cfs-guide').addEventListener('click', (e) => {
            const r = e.target.closest('.cfs-row');
            if (r) setCfs(Number(r.dataset.cfs));
        });
        this.$('btn-cfs-guide').addEventListener('click', () => {
            const g = this.$('cfs-guide'), open = g.classList.toggle('hidden') === false;
            this.$('btn-cfs-guide').setAttribute('aria-expanded', String(open));
            this.$('btn-cfs-guide').textContent = open ? 'Hide criteria' : 'Show criteria';
        });

        this.$('btn-flacc').addEventListener('click', () => {
            const panel = this.$('flacc-panel');
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden')) this.buildFlacc();
        });

        // Enter moves to the next observation.
        this.$('obs-form').addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' || e.target.tagName === 'BUTTON') return;
            if (this.focusNextObs(e.target)) e.preventDefault();
        });

        // Dynamic tool panels delegate their inputs to data-path attributes.
        document.addEventListener('change', (e) => {
            const el = e.target.closest('[data-path]');
            if (!el || el.tagName === 'DIV') return;
            let val = el.type === 'checkbox' ? el.checked : el.value;
            if (el.dataset.num !== undefined) val = C.toNumber(val);
            if (val === true && el.dataset.path.startsWith('assess.ipc.')) this.state.assess.ipcNone = false;
            if (val === true && /^assess\.paeds\.safeguarding\.(nonmobile|story|notbrought)$/.test(el.dataset.path)) this.state.assess.paeds.safeguardingNone = false;
            this.set(el.dataset.path, val);
        });
        document.addEventListener('input', (e) => {
            const el = e.target.closest('input[type="text"][data-path], input[type="datetime-local"][data-path]');
            if (el) this.set(el.dataset.path, el.value);
        });
        document.addEventListener('click', (e) => {
            const b = e.target.closest('[data-action]');
            if (!b) return;
            this.onAction(b.dataset.action, b);
        });

        // Section collapse
        this.bindSectionToggle('obs-section-toggle', 'obs-collapsible-body');
        this.bindSectionToggle('screening-section-toggle', 'screening-body');
        this.bindSectionToggle('ph-obs-toggle', 'ph-obs-collapsible');

        // Disposition: options come from clinicalData.placements (one source of truth with the plan suggestions)
        this.$('sel-disposition').innerHTML = '<option value="">Not yet decided</option>' +
            Object.entries(this.data.placements).map(([group, opts]) => `<optgroup label="${esc(group)}">${Object.entries(opts).map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</optgroup>`).join('') +
            '<option value="Other">Other (specify)</option>';
        this.$('sel-disposition').addEventListener('change', (e) => {
            this.$('txt-disposition-other').classList.toggle('hidden', e.target.value !== 'Other');
            if (e.target.value !== 'Other') this.state.triage.dispositionOther = '';
            this.set('triage.disposition', e.target.value);
        });
        bindInput('txt-disposition-other', 'triage.dispositionOther');

        // Override
        const btnO = this.$('btn-override-toggle'), panelO = this.$('override-options');
        btnO.addEventListener('click', () => {
            const opening = panelO.classList.contains('hidden');
            panelO.classList.toggle('hidden', !opening);
            btnO.classList.toggle('active', opening);
            btnO.setAttribute('aria-expanded', String(opening));
            if (!opening) { this.$('txt-override').value = ''; this.set('triage.override', null); }
        });
        const updOverride = () => {
            const reason = this.$('txt-override').value.trim(), level = this.$('sel-override').value;
            // Say what is still needed instead of silently not applying the override.
            this.$('override-msg').textContent = !level ? 'Choose a category to override to.' : (!reason ? 'Type a reason - the override applies once a reason is given.' : `Override applied: ${level}.`);
            this.$('override-msg').classList.toggle('override-msg-ok', !!(level && reason));
            this.set('triage.override', reason && level ? { level, reason } : null);
        };
        this.$('sel-override').addEventListener('change', updOverride);
        this.$('txt-override').addEventListener('input', updOverride);

        // Header
        this.$('nurse-initials').addEventListener('input', (e) => { store.set('initials', e.target.value.trim().toUpperCase(), true); this.update(); });
        this.$('btn-quick-mode').addEventListener('click', () => {
            const on = !document.body.classList.contains('quick-mode');
            document.body.classList.toggle('quick-mode', on);
            this.$('btn-quick-mode').classList.toggle('active', on);
            this.$('btn-quick-mode').setAttribute('aria-pressed', String(on));
            store.set('quickMode', on ? 'on' : 'off');
            if (!on) document.querySelectorAll('.card.quick-open').forEach(c => this.setQuickOpen(c, false));
            this.toast(on ? 'Fast triage on: only what decides the category is shown. "Show ..." opens a folded section.' : 'Fast triage off: all sections shown');
            this.update();
        });
        this.$('btn-history').addEventListener('click', () => this.openHistory());
        this.$('btn-close-history').addEventListener('click', () => this.$('history-sidebar').classList.remove('open'));
        this.$('btn-settings').addEventListener('click', () => this.openModal('modal-settings'));
        this.$('btn-help').addEventListener('click', () => this.openModal('modal-help'));
        this.$('link-whatsnew').addEventListener('click', (e) => { e.preventDefault(); this.openModal('modal-whatsnew'); });
        this.$('btn-reset').addEventListener('click', () => this.newPatient());
        this.$('btn-copy').addEventListener('click', () => this.copyNote());
        this.$('btn-sbar').addEventListener('click', () => this.openSbar());
        this.$('btn-close-sbar').addEventListener('click', () => this.closeModal('modal-sbar'));
        this.$('btn-copy-sbar').addEventListener('click', () => this.copyText(this.sbarText(), 'SBAR copied', this.sbarHtml()));
        document.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => this.closeModal(b.closest('.modal').id)));

        // Settings
        this.$('set-shared').addEventListener('change', (e) => {
            this.shared = e.target.checked;
            store.set('sharedComputer', this.shared ? 'on' : 'off');
            if (this.shared) { store.remove(HISTORY_KEY); this.toast('Recent patients switched off and cleared on this computer'); }
            this.$('btn-history').classList.toggle('hidden', this.shared);
        });
        this.$('set-dictation').addEventListener('change', (e) => {
            this.dictation = e.target.checked;
            store.set('dictation', this.dictation ? 'on' : 'off');
            this.applyDictation();
        });
        this.$('set-plain-copy').addEventListener('change', (e) => {
            this.plainCopy = e.target.checked;
            store.set('plainCopy', this.plainCopy ? 'on' : 'off');
            this.renderNote();
        });
        this.$('set-dark').addEventListener('change', (e) => {
            if (e.target.checked) document.documentElement.setAttribute('data-theme', 'dark');
            else document.documentElement.removeAttribute('data-theme');
            store.set('theme', e.target.checked ? 'dark' : 'light');
        });
        this.$('btn-clear-history').addEventListener('click', () => { store.remove(HISTORY_KEY); this.toast('Recent patients cleared'); });

        // ℹ️ popovers
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.info-btn');
            const pop = btn ? btn.closest('.info-pop') : null;
            document.querySelectorAll('.info-pop.open').forEach(p => { if (p !== pop) p.classList.remove('open'); });
            if (pop) { e.stopPropagation(); pop.classList.toggle('open'); }
        });

        // Global shortcuts
        document.addEventListener('keydown', (e) => {
            const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
            if (e.key === 'Escape') { document.querySelectorAll('.modal:not(.hidden)').forEach(m => this.closeModal(m.id)); this.$('history-sidebar').classList.remove('open'); return; }
            if (e.altKey && !e.ctrlKey && !e.metaKey) {
                const k = e.key.toLowerCase();
                const map = { c: () => this.copyNote(), s: () => this.openSbar(), n: () => this.newPatient(), k: () => this.$('input-complaint').focus(), h: () => this.openHistory() };
                if (map[k]) { e.preventDefault(); map[k](); }
                return;
            }
            if (!typing && e.key === '?') { e.preventDefault(); this.openModal('modal-help'); }
        });
    }

    bindSectionToggle(toggleId, bodyId) {
        const t = this.$(toggleId);
        t.addEventListener('click', () => this.setSectionCollapsed(toggleId, bodyId, !this.$(bodyId).classList.contains('hidden')));
    }

    setSectionCollapsed(toggleId, bodyId, collapsed) {
        const t = this.$(toggleId), b = this.$(bodyId);
        b.classList.toggle('hidden', collapsed);
        const ch = t.querySelector('.chevron');
        if (ch) ch.textContent = collapsed ? '▾' : '▴';
        t.setAttribute('aria-expanded', String(!collapsed));
        if (t.classList.contains('section-toggle')) t.closest('.card').classList.toggle('is-collapsed', collapsed);
    }

    onSegmented(group, value, btn) {
        if (!group.id) return;
        if (group.dataset.path) {
            // Tool-panel yes/no: clicking the active answer clears it back to "not answered".
            const cur = group.dataset.current;
            const next = cur === value ? null : value;
            if (group.dataset.path === 'assess.headache.sudden') {
                // Sudden onset is itself the Orange discriminator on the Headache flowchart.
                const c = this.state.complaint, thunder = 'Sudden Onset (Thunderclap)';
                if (next === 'yes') { c.discriminator = thunder; c.noneApply = false; }
                else if (c.discriminator === thunder) c.discriminator = null;
            }
            this.set(group.dataset.path, next);
            return;
        }
        if (group.dataset.screen) {
            this.set(`screening.${group.dataset.screen}`, this.state.screening[group.dataset.screen] === value ? '' : value);
            return;
        }
        switch (group.id) {
            case 'seg-arrival': {
                const amb = value === 'Ambulance';
                const pt = this.state.patient;
                // Ambulance arrivals start as Trolley, marked as assumed until the nurse confirms it.
                if (amb && !pt.mobility) { pt.mobility = 'Trolley'; pt.mobilityAssumed = true; }
                if (!amb && pt.mobilityAssumed) { pt.mobility = ''; pt.mobilityAssumed = false; }
                this.set('patient.arrivalMode', value);
                this.setSectionCollapsed('obs-section-toggle', 'obs-collapsible-body', false);
                break;
            }
            case 'seg-age-unit': this.set('patient.ageUnit', value); break;
            // One tap instead of opening a drop-down; tapping the chosen answer again clears it.
            case 'seg-sex': {
                const sex = this.state.patient.sex === value ? '' : value;
                // The pregnancy box is hidden for males: never leave a hidden "pregnant" (it switches the score to MEOWS).
                if (sex === 'Male' && this.state.patient.pregnant) {
                    this.state.patient.pregnant = false; this.state.patient.lmp = '';
                    this.$('check-pregnant').checked = false; this.$('date-lmp').value = '';
                }
                this.set('patient.sex', sex);
                break;
            }
            case 'seg-mobility': {
                // Tapping the assumed ambulance Trolley confirms it rather than clearing it.
                const pt = this.state.patient;
                const next = pt.mobility === value && !pt.mobilityAssumed ? '' : value;
                pt.mobilityAssumed = false;
                this.set('patient.mobility', next);
                break;
            }
            case 'seg-o2':
                this.set('obs.o2', this.state.obs.o2 === value ? null : value);
                // Fewer taps: once Air/O2 is chosen, go straight on to the blood pressure.
                if (this.state.obs.o2 && btn) { this.focusNextObs(btn); return; }
                break;
            case 'seg-avpu': this.set('obs.avpu', this.state.obs.avpu === value ? null : value); break;
            case 'seg-ph-o2': this.set('prehospital.obs.o2', value); break;
            default: return;
        }
        if (btn) btn.focus();
    }

    // Next stop in the obs grid (numbers, then each segmented control). Returns false at the end.
    focusNextObs(from) {
        const stops = [];
        this.$('obs-form').querySelectorAll('.obs-item').forEach(item => {
            item.querySelectorAll('input.obs-input, select.obs-input').forEach(x => stops.push(x));
            const seg = item.querySelector('.segmented-control');
            if (seg) stops.push(seg.querySelector('button.active') || seg.querySelector('button'));
        });
        const seg = from.closest('.segmented-control');
        const i = seg ? stops.findIndex(x => seg.contains(x)) : stops.indexOf(from);
        if (i < 0 || !stops[i + 1]) return false;
        stops[i + 1].focus();
        return true;
    }

    onSegmentedKey(e) {
        const btn = e.target.closest && e.target.closest('.segmented-control button');
        if (!btn || e.altKey || e.ctrlKey || e.metaKey) return;
        const group = btn.parentElement;
        const buttons = [...group.querySelectorAll('button')];
        const i = buttons.indexOf(btn);
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const n = buttons[(i + (e.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length];
            n.focus();
            return;
        }
        const keys = (group.dataset.keys || '').split(',').filter(Boolean);
        const k = e.key.toLowerCase();
        const idx = keys.indexOf(k);
        if (idx >= 0 && buttons[idx]) {
            e.preventDefault();
            const target = buttons[idx];
            if (!target.classList.contains('active')) this.onSegmented(group, target.dataset.value, target);
            if (group.contains(document.activeElement)) target.focus();
            // Keyboard obs entry runs straight on: "24 Enter 96 Enter a" lands in systolic BP.
            if (group.id === 'seg-avpu') this.focusNextObs(target);
        }
    }

    setQuickOpen(card, open) {
        card.classList.toggle('quick-open', open);
        const b = card.querySelector('.quick-more');
        if (b) { b.textContent = `${open ? 'Hide' : 'Show'} ${b.dataset.label}`; b.setAttribute('aria-expanded', String(open)); }
    }

    onAction(action, el) {
        switch (action) {
            case 'quickText': {
                const t = this.$(el.dataset.target);
                t.value = el.dataset.val;
                t.dispatchEvent(new Event('input', { bubbles: true }));
                break;
            }
            case 'switch-head-injury': this.setComplaint('Head Injury'); break;
            case 'quick-more': { const card = el.closest('.card'); this.setQuickOpen(card, !card.classList.contains('quick-open')); break; }
            case 'rosier-done': this.set('assess.stroke.rosierDone', !this.state.assess.stroke.rosierDone); break;
            case 'hr-none': this.set('history.riskNone', !this.state.history.riskNone); break;
            case 'sg-none': this.set('assess.paeds.safeguardingNone', !this.state.assess.paeds.safeguardingNone); break;
            case 'ipc-none': this.set('assess.ipcNone', !this.state.assess.ipcNone); break;
            case 'ecg-done': this.set('assess.ecgDoneAt', new Date().toISOString()); break;
            case 'ecg-undo': this.set('assess.ecgDoneAt', null); break;
            case 'corridor-checked': this.set('assess.corridorCheckedAt', new Date().toISOString()); break;
            case 'dismiss-pmh': this.state.ui.pmhPromptsDismissed = true; this.update(); break;
            case 'use-placement': {
                this.state.triage.dispositionOther = '';
                this.$('sel-disposition').value = el.dataset.value;
                this.$('txt-disposition-other').classList.add('hidden');
                this.set('triage.disposition', el.dataset.value);
                break;
            }
            default: break;
        }
    }

    focusPain() {
        const active = this.$('pain-btn-container').querySelector('.pain-btn.active');
        if (active) active.focus();
    }

    // ------------------------------------------------------------------ complaint & discriminators
    bindCombobox() {
        const input = this.$('input-complaint'), list = this.$('complaint-list');
        let active = -1, results = [];
        const close = () => { list.classList.add('hidden'); input.setAttribute('aria-expanded', 'false'); active = -1; };
        const draw = () => {
            list.innerHTML = results.map((r, i) => `<div class="combobox-option${i === active ? ' active' : ''}" role="option" id="cbo-${i}" data-name="${esc(r.name)}" aria-selected="${i === active}">${esc(r.name)}${r.via ? ` <small>"${esc(r.via)}"</small>` : ''}</div>`).join('')
                || '<div class="combobox-option" aria-disabled="true"><small>No matching flowchart - try another word</small></div>';
            list.classList.remove('hidden');
            input.setAttribute('aria-expanded', 'true');
            if (active >= 0) input.setAttribute('aria-activedescendant', `cbo-${active}`); else input.removeAttribute('aria-activedescendant');
        };
        input.addEventListener('input', () => {
            const v = input.value;
            this.state.complaint.raw = v;
            const exact = Object.keys(this.data.mtsFlowcharts).find(n => n.toLowerCase() === v.trim().toLowerCase());
            if (exact) { this.setComplaint(exact, { keepFocus: true }); close(); return; }
            if (this.state.complaint.name && v !== this.state.complaint.name) this.clearComplaint();
            results = this.searchCharts(v);
            active = results.length ? 0 : -1;
            if (v.trim()) draw(); else close();
        });
        input.addEventListener('keydown', (e) => {
            if (list.classList.contains('hidden')) {
                if (e.key === 'ArrowDown' && input.value.trim()) { results = this.searchCharts(input.value); active = 0; draw(); e.preventDefault(); }
                return;
            }
            if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, results.length - 1); draw(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); draw(); }
            else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[active]) { this.setComplaint(results[active].name); close(); this.focusFirstDiscriminator(); }
            } else if (e.key === 'Escape') close();
        });
        list.addEventListener('mousedown', (e) => {
            const o = e.target.closest('.combobox-option[data-name]');
            if (!o) return;
            e.preventDefault();
            this.setComplaint(o.dataset.name);
            close();
            this.focusFirstDiscriminator();
        });
        input.addEventListener('blur', () => setTimeout(close, 150));
    }

    focusFirstDiscriminator() {
        const first = this.$('discriminator-container').querySelector('.discriminator[tabindex="0"]') || this.$('discriminator-container').querySelector('.discriminator');
        if (first) first.focus();
    }

    clearComplaint() {
        const c = this.state.complaint;
        c.name = ''; c.discriminator = null; c.noneApply = false;
        this.state.assess.headache = { trauma: null, sudden: null };
        this.state.plan = this.state.plan.filter(i => i.category === 'Universal');
        this.update();
    }

    setComplaint(name, opts = {}) {
        if (!this.data.mtsFlowcharts[name]) return;
        const c = this.state.complaint;
        const changed = c.name !== name;
        this.$('input-complaint').value = name;
        c.raw = name;
        if (changed) {
            c.name = name; c.discriminator = null; c.noneApply = false;
            this.state.assess.headache = { trauma: null, sudden: null };
            this.state.plan = this.state.plan.filter(i => i.category === 'Universal');
            if (!this.state.meta.startedAt) this.state.meta.startedAt = new Date().toISOString();
        }
        this.update();
        if (!opts.keepFocus && changed) this.$('input-complaint').setAttribute('aria-expanded', 'false');
    }

    chooseDiscriminator(text, none) {
        const c = this.state.complaint;
        if (none) { c.noneApply = !c.noneApply; c.discriminator = null; }
        else { c.discriminator = c.discriminator === text ? null : text; c.noneApply = false; }
        this.update();
        const sel = this.$('discriminator-container').querySelector('[aria-selected="true"]');
        if (sel) sel.focus();
    }

    openBodyMap() {
        const zones = this.derived.isPaeds ? this.data.bodyMap.child : this.data.bodyMap.adult;
        this.$('body-map-grid').innerHTML = zones.map(z => `<button type="button" class="map-zone" data-chart="${esc(z.chart)}">${esc(z.label)}</button>`).join('');
        this.openModal('modal-bodymap');
    }

    // ------------------------------------------------------------------ render
    render() {
        this.renderDemographics();
        this.renderArrival();
        this.renderChips();
        this.renderDiscriminators();
        this.renderComplaintTools();
        this.renderPain();
        this.renderFrailty();
        this.renderEws();
        this.renderSepsis();
        this.renderPaeds();
        this.renderIpc();
        this.renderScreeningDynamic();
        this.renderMedsAlert();
        this.renderPmhPrompts();
        this.renderUniversalChecks();
        this.renderProtocol();
        this.renderPlacement();
        this.renderCorridor();
        this.renderDecision();
        this.renderTimers();
        this.renderNote();
    }

    renderDemographics() {
        const p = this.state.patient, d = this.derived;
        document.querySelectorAll('#seg-age-unit button').forEach(b => b.classList.toggle('active', b.dataset.value === p.ageUnit));
        document.querySelectorAll('#seg-sex button').forEach(b => b.classList.toggle('active', b.dataset.value === p.sex));
        document.querySelectorAll('#seg-mobility button').forEach(b => b.classList.toggle('active', b.dataset.value === p.mobility));
        this.$('mobility-hint').classList.toggle('hidden', !p.mobilityAssumed);
        this.$('female-health-section').classList.toggle('hidden', p.sex === 'Male');
        this.$('pregnancy-details').classList.toggle('hidden', !p.pregnant);
        const g = d.gestation;
        this.$('gestation-readout').textContent = !p.lmp ? 'Enter LMP' : (!g || !g.valid ? 'Check LMP date' : `${g.weeks}+${g.days} weeks · EDD ${ddmmyyyy(g.edd)}`);
        const est = p.age !== null && p.age <= 12 ? C.aplsWeight(p.age) : null;
        this.$('weight-estimate').textContent = est ? `APLS estimate ~${est} kg - weigh for doses` : '';
        const arr = new Date(this.state.meta.arrivalAt);
        if (document.activeElement !== this.$('arrival-time')) this.$('arrival-time').value = `${String(arr.getHours()).padStart(2, '0')}:${String(arr.getMinutes()).padStart(2, '0')}`;
    }

    renderArrival() {
        const amb = this.state.patient.arrivalMode === 'Ambulance';
        document.querySelectorAll('#seg-arrival button').forEach(b => b.classList.toggle('active', b.dataset.value === this.state.patient.arrivalMode));
        this.$('amb-fields').classList.toggle('hidden', !amb);
        // HPC (and social) for every patient; the crew-only parts only for ambulance arrivals.
        this.$('card-handover').classList.remove('hidden');
        this.$('handover-title').textContent = amb ? 'Crew handover' : 'History of presenting complaint';
        this.$('card-handover').querySelectorAll('.amb-only').forEach(el => el.classList.toggle('amb-hidden', !amb));
        if (!amb) { this.$('ph-obs-collapsible').classList.add('hidden'); this.$('ph-obs-toggle').setAttribute('aria-expanded', 'false'); }
        this.$('card-treatment-given').classList.toggle('hidden', amb);
        const pho2 = this.state.prehospital.obs.o2;
        document.querySelectorAll('#seg-ph-o2 button').forEach(b => b.classList.toggle('active', b.dataset.value === pho2));
    }

    renderChips() {
        const key = this.derived.isPaeds ? 'child' : 'adult';
        if (this.built.chips === key) return;
        this.built.chips = key;
        const charts = this.data.quickComplaints[key];
        this.$('quick-actions-bar').innerHTML = `<button type="button" class="btn-chip btn-chip-accent" id="btn-body-map">👤 Body map</button>` +
            charts.map(c => `<button type="button" class="btn-chip" data-chart="${esc(c)}">${esc(c.replace(' in Adults', '').replace(' in Children', ''))}</button>`).join('');
    }

    renderDiscriminators() {
        const d = this.derived, c = this.state.complaint, box = this.$('discriminator-container');
        if (!d.flowchart) {
            if (this.built.discKey !== '') { box.innerHTML = '<p class="placeholder-text">Choose a presenting complaint to see its discriminators.</p>'; this.built.discKey = ''; }
            return;
        }
        const autoOn = d.floors.some(f => f.reason.startsWith(AUTO_DISCRIMINATOR_TEXT));
        const sex = this.state.patient.sex;
        const key = JSON.stringify([c.name, c.discriminator, c.noneApply, autoOn, sex]);
        if (this.built.discKey === key) return;
        const hadFocus = box.contains(document.activeElement);
        this.built.discKey = key;
        const order = { Red: 1, Orange: 2, Yellow: 3, Green: 4, Blue: 5 };
        // Male-only discriminators are not offered for a female patient (unless already chosen).
        const sorted = [...d.flowchart].filter(x => !(sex === 'Female' && /testic/i.test(x.text) && x.text !== c.discriminator)).sort((a, b) => order[a.priority] - order[b.priority]);
        const selIndex = c.noneApply ? sorted.length : sorted.findIndex(x => x.text === c.discriminator);
        const tabTarget = selIndex >= 0 ? selIndex : 0;
        box.innerHTML = sorted.map((x, i) => {
            const sel = x.text === c.discriminator;
            const auto = autoOn && x.text === AUTO_DISCRIMINATOR_TEXT && !sel;
            return `<button type="button" role="option" class="discriminator priority-${x.priority}" data-text="${esc(x.text)}" aria-selected="${sel}" tabindex="${i === tabTarget ? 0 : -1}"><span>${esc(x.text)}${auto ? '<span class="auto-tag">From obs</span>' : ''}</span><span class="disc-level">${x.priority}</span></button>`;
        }).join('') + `<button type="button" role="option" class="discriminator none-apply" aria-selected="${c.noneApply}" tabindex="${tabTarget === sorted.length ? 0 : -1}"><span>None of these apply</span><span class="disc-level">Blue</span></button>`;
        if (hadFocus) {
            const f = box.querySelector('[tabindex="0"]');
            if (f) f.focus();
        }
    }

    renderPain() {
        const c = this.state.complaint, d = this.derived;
        this.$('pain-btn-container').querySelectorAll('.pain-btn').forEach(b => {
            const on = C.has(c.pain) && Number(b.dataset.score) === c.pain;
            b.classList.toggle('active', on);
            b.setAttribute('aria-checked', String(on));
            b.tabIndex = on || (!C.has(c.pain) && b.dataset.score === '0') ? 0 : -1;
        });
        this.$('pain-readout').textContent = C.has(c.pain) ? `${c.pain}/10 - ${d.pain.band.toLowerCase()}${c.painMethod === 'FLACC' ? ' (FLACC)' : ''}` : 'not assessed';
        const flaccAge = this.state.patient.age !== null && this.state.patient.age < 7;
        this.$('btn-flacc').classList.toggle('hidden', !flaccAge);
        if (!flaccAge) this.$('flacc-panel').classList.add('hidden');
    }

    renderFrailty() {
        const p = this.state.patient, v = this.state.frailty.cfs, lvl = C.cfs(v);
        const child = p.age !== null && p.age < 16;
        this.$('frailty-section').classList.toggle('hidden', child);
        if (child) return;
        this.$('cfs-btn-container').querySelectorAll('.cfs-btn').forEach(b => {
            const on = Number(b.dataset.cfs) === v;
            b.classList.toggle('active', on);
            b.setAttribute('aria-checked', String(on));
            b.tabIndex = on || (v === null && b.dataset.cfs === '1') ? 0 : -1;
        });
        this.$('cfs-guide').querySelectorAll('.cfs-row').forEach(r => r.classList.toggle('active', Number(r.dataset.cfs) === v));
        this.$('cfs-readout').textContent = lvl ? `${lvl.score} - ${lvl.title.toLowerCase()}` : 'not assessed';
        this.$('cfs-note').textContent = p.age !== null && p.age < 65
            ? 'Validated for 65 and over - use with caution under 65. Score how they were about 2 weeks before this illness or injury.'
            : 'Score how they were about 2 weeks before this illness or injury, not how they are today.';
    }

    buildFlacc() {
        const items = [
            ['face', 'Face', ['No particular expression or smile', 'Occasional grimace or frown, withdrawn', 'Frequent/constant frown, clenched jaw, quivering chin']],
            ['legs', 'Legs', ['Normal position or relaxed', 'Uneasy, restless, tense', 'Kicking or legs drawn up']],
            ['activity', 'Activity', ['Lying quietly, normal position, moves easily', 'Squirming, shifting, tense', 'Arched, rigid or jerking']],
            ['cry', 'Cry', ['No cry', 'Moans or whimpers, occasional complaint', 'Crying steadily, screams or sobs, frequent complaints']],
            ['consolability', 'Consolability', ['Content, relaxed', 'Reassured by touch or talking, distractible', 'Difficult to console or comfort']]
        ];
        const f = this.state.complaint.flacc;
        this.$('flacc-panel').innerHTML = `<div class="tool-head"><span class="tool-title">FLACC (pre-verbal children)</span><span class="tool-result" id="flacc-total"></span></div>` +
            items.map(([k, label, opts]) => `<div class="q-row"><span>${label}</span><select data-flacc="${k}"><option value="">-</option>${opts.map((o, i) => `<option value="${i}"${String(f[k]) === String(i) ? ' selected' : ''}>${i} - ${esc(o)}</option>`).join('')}</select></div>`).join('');
        const upd = () => {
            const vals = items.map(([k]) => f[k]);
            const done = vals.every(v => C.has(v));
            const total = vals.reduce((s, v) => s + (C.has(v) ? Number(v) : 0), 0);
            this.$('flacc-total').textContent = done ? `FLACC ${total}/10` : 'Complete all 5';
            if (done) { this.state.complaint.painMethod = 'FLACC'; this.set('complaint.pain', total); }
        };
        this.$('flacc-panel').querySelectorAll('select').forEach(s => s.addEventListener('change', () => { f[s.dataset.flacc] = s.value === '' ? null : Number(s.value); upd(); }));
        upd();
    }

    // Yes/No control bound to a state path (clicking the active answer clears it).
    ynHTML(path, current, labels = ['Yes', 'No'], values = ['yes', 'no']) {
        return `<div class="segmented-control yn" id="yn-${path.replace(/\./g, '-')}" data-path="${path}" data-current="${current ?? ''}">${labels.map((l, i) => `<button type="button" data-value="${values[i]}" class="${current === values[i] ? 'active' : ''}">${l}</button>`).join('')}</div>`;
    }

    checksHTML(items, basePath, values, autoItems = []) {
        return `<div class="check-grid">${autoItems.map(t => `<label class="auto"><input type="checkbox" checked disabled> ${esc(t)} (from obs)</label>`).join('')}${items.map(([k, t]) => `<label><input type="checkbox" data-path="${basePath}.${k}"${values[k] ? ' checked' : ''}> ${esc(t)}</label>`).join('')}</div>`;
    }

    renderComplaintTools() {
        const d = this.derived, s = this.state, t = d.tools, box = this.$('complaint-tools');
        const key = JSON.stringify([s.complaint.name, t, d.isPaeds, s.patient.age === null, s.assess.headache, s.complaint.discriminator, d.anticoagDetected, s.assess.ng232Anticoag]);
        if (this.built.toolsKey !== key) {
            this.built.toolsKey = key;
            let html = '';
            if (t.headache) {
                html += `<div class="tool-panel"><div class="tool-head"><span class="tool-title">Headache red flags</span></div>
                    <div class="q-row"><span>Head injury or trauma?</span>${this.ynHTML('assess.headache.trauma', s.assess.headache.trauma)}</div>
                    ${s.assess.headache.trauma === 'yes' ? '<div class="tool-actions">Head trauma: <button type="button" class="btn-tiny" data-action="switch-head-injury">Use the Head Injury flowchart</button></div>' : ''}
                    <div class="q-row"><span>Sudden onset / worst-ever headache (thunderclap)?</span>${this.ynHTML('assess.headache.sudden', s.assess.headache.sudden)}</div>
                    <p class="tool-note">Sudden onset stays on the Headache flowchart and selects "Sudden Onset (Thunderclap)" (Orange) - possible subarachnoid haemorrhage.</p></div>`;
            }
            if (t.ng232Optional && !t.ng232) {
                html += `<div class="tool-panel"><label class="check-line"><input type="checkbox" data-path="assess.headInjuryInvolved"${s.assess.headInjuryInvolved ? ' checked' : ''}> Head injury involved - show NICE NG232 CT criteria</label></div>`;
            } else if (t.ng232) {
                html += this.ng232PanelHTML();
            }
            if (t.stroke) html += this.strokePanelHTML();
            if (t.ecg) html += `<div class="tool-panel" id="ecg-panel"></div>`;
            if (t.nof) html += `<div class="tool-panel"><div class="tool-head"><span class="tool-title">Suspected fractured neck of femur</span></div>${this.checksHTML([
                ['analgesia', 'Analgesia given or offered (record in plan)'], ['block', 'Fascia iliaca block considered per local pathway'],
                ['pressure', 'Pressure areas checked; pressure-relieving mattress'], ['fourat', '4AT delirium screen completed'], ['bloods', 'AE Fractured Neck of Femur bloods (includes G&S)']], 'assess.nof', s.assess.nof)}</div>`;
            if (t.fourAT) html += this.fourATPanelHTML();
            if (t.mh) html += this.mhPanelHTML();
            box.innerHTML = html;
        }
        this.updateToolResults();
    }

    ng232PanelHTML() {
        const s = this.state, age = s.patient.age;
        if (age === null) return `<div class="tool-panel"><div class="tool-head"><span class="tool-title">NICE NG232 head injury - CT criteria</span></div><p class="tool-note">Record age first: the criteria differ for under-16s.</p></div>`;
        const adult = age >= 16;
        const a = s.assess.ng232;
        let html = `<div class="tool-panel"><div class="tool-head"><span class="tool-title">NICE NG232 head injury - CT criteria (${adult ? '16 and over' : 'under 16'})</span><span class="tool-result" id="ng232-result"></span></div>`;
        if (adult) {
            html += `<h4>CT within 1 hour if any:</h4>${this.checksHTML(C.NG232_ADULT_1H, 'assess.ng232', a)}`;
            html += `<h4>CT within 8 hours if loss of consciousness or amnesia AND any risk factor:</h4>${this.checksHTML([['loc_amnesia', 'Loss of consciousness or amnesia since the injury'], ...C.NG232_ADULT_8H], 'assess.ng232', a)}`;
            html += `<p class="tool-note">Age 65 or over is applied automatically from the age entered.</p>`;
        } else {
            html += `<h4>CT within 1 hour if any:</h4>${this.checksHTML(C.NG232_CHILD_1H, 'assess.ng232', a)}`;
            html += `<h4>Other risk factors (more than 1 = CT within 1 hour; exactly 1 = observe at least 4 hours):</h4>${this.checksHTML(C.NG232_CHILD_RISK, 'assess.ng232', a)}`;
        }
        const anti = s.assess.ng232Anticoag === null ? this.derived.anticoagDetected : s.assess.ng232Anticoag;
        html += `<label class="check-line mt-6"><input type="checkbox" id="ng232-anticoag"${anti ? ' checked' : ''}> On an anticoagulant, or an antiplatelet other than aspirin alone${this.derived.anticoagDetected ? ' <span class="text-muted">(anticoagulant detected in meds)</span>' : ''}</label>`;
        html += `<p class="tool-note" id="ng232-gcs"></p></div>`;
        setTimeout(() => {
            const cb = this.$('ng232-anticoag');
            if (cb) cb.onchange = () => this.set('assess.ng232Anticoag', cb.checked);
        });
        return html;
    }

    strokePanelHTML() {
        const s = this.state.assess.stroke;
        return `<div class="tool-panel"><div class="tool-head"><span class="tool-title">Stroke recognition</span><span class="tool-result" id="rosier-result"></span></div>
            <div class="q-row"><span>Time last known well</span><input type="datetime-local" data-path="assess.stroke.lkw" value="${esc(s.lkw)}" aria-label="Time last known well"></div>
            <p class="tool-note" id="lkw-elapsed"></p>
            <h4>ROSIER</h4>${this.checksHTML(C.ROSIER_ITEMS.map(([k, t, pts]) => [k, `${t} (${pts > 0 ? '+' : ''}${pts})`]), 'assess.stroke.rosier', s.rosier)}
            <div class="segmented-control yn mt-6" id="rosier-done-wrap"><button type="button" data-action="rosier-done" id="btn-rosier-done">ROSIER complete - score it</button></div>
            <p class="tool-note" id="rosier-bm"></p></div>`;
    }

    fourATPanelHTML() {
        const a = this.state.assess.fourAT;
        const sel = (k, opts) => `<select data-path="assess.fourAT.${k}" data-num><option value="">-</option>${opts.map(([v, t]) => `<option value="${v}"${String(a[k]) === String(v) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
        const rows = `<div class="q-row"><span>1. Alertness</span>${sel('alertness', [[0, 'Normal / mild sleepiness <10s after waking (0)'], [4, 'Clearly abnormal (4)']])}</div>
            <div class="q-row"><span>2. AMT4 (age, DOB, place, year)</span>${sel('amt4', [[0, 'No mistakes (0)'], [1, '1 mistake (1)'], [2, '2+ mistakes / untestable (2)']])}</div>
            <div class="q-row"><span>3. Attention (months backwards)</span>${sel('attention', [[0, '7+ months correct (0)'], [1, 'Starts but <7 / refuses (1)'], [2, 'Untestable (2)']])}</div>
            <div class="q-row"><span>4. Acute change or fluctuating course</span>${sel('acute', [[0, 'No (0)'], [4, 'Yes (4)']])}</div>`;
        const head = `<span class="tool-title">4AT delirium screen${this.derived.tools.fourATOptional ? ' <span class="text-muted">(aged 65+, optional)</span>' : ''}</span><span class="tool-result" id="fourat-result"></span>`;
        if (this.derived.tools.fourATOptional) {
            const started = Object.values(a).some(C.has);
            return `<details class="tool-panel"${started ? ' open' : ''}><summary class="tool-head">${head}</summary>${rows}</details>`;
        }
        return `<div class="tool-panel"><div class="tool-head">${head}</div>${rows}</div>`;
    }

    mhPanelHTML() {
        const m = this.state.assess.mh;
        const sel = (k, opts) => `<select data-path="assess.mh.${k}"><option value="">Not recorded</option>${opts.map(o => `<option${m[k] === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
        return `<div class="tool-panel"><div class="tool-head"><span class="tool-title">Mental health &amp; safety</span></div>
            <div class="q-row"><span>Mental Health Act status</span>${sel('mha', ['Informal', 'Detained - section 136', 'Detained - other section', 'Unknown'])}</div>
            <div class="q-row"><span>Risk of leaving before assessment</span>${sel('abscond', ['Low', 'Medium', 'High'])}</div>
            <div class="q-row"><span>Observation level needed</span>${sel('observation', ['General', 'Within eyesight', "Within arm's length"])}</div>
            <div class="q-row"><span>Concern about mental capacity</span>${sel('capacity', ['No', 'Yes'])}</div>
            ${this.checksHTML([['liaison', 'Mental health liaison referral made'], ['saferoom', 'Safer room / ligature check done'], ['belongings', 'Belongings searched per local policy']], 'assess.mh', m)}</div>`;
    }

    updateToolResults() {
        const d = this.derived, s = this.state;
        const res = (id, text, cls) => { const el = this.$(id); if (el) { el.textContent = text; el.className = `tool-result ${cls}`; } };
        if (d.ng232) {
            const cls = d.ng232.level === '1h' ? 'res-red' : (d.ng232.level === 'none' ? 'res-green' : 'res-amber');
            res('ng232-result', ng232Nurse(d.ng232), cls);
            const g = this.$('ng232-gcs');
            if (g) g.textContent = d.gcsTotal !== null ? `Current GCS ${d.gcsTotal} (from obs).` : '';
        }
        if (d.rosier) {
            res('rosier-result', d.rosier.text, d.rosier.likely ? 'res-red' : 'res-grey');
            const rb = this.$('btn-rosier-done');
            if (rb) { rb.classList.toggle('active', d.rosier.complete); rb.setAttribute('aria-pressed', String(d.rosier.complete)); }
            const bm = this.$('rosier-bm');
            if (bm) bm.textContent = C.has(s.obs.bm) ? `BM ${s.obs.bm} mmol/L${s.obs.bm < 4 ? ' - LOW: treat hypoglycaemia and reassess' : ''}` : 'Check BM first - hypoglycaemia can mimic stroke.';
        }
        if (d.fourAT) res('fourat-result', d.fourAT.text, d.fourAT.complete ? (d.fourAT.score >= 4 ? 'res-red' : (d.fourAT.score >= 1 ? 'res-amber' : 'res-green')) : 'res-grey');
    }

    renderTimers() {
        const d = this.derived, s = this.state;
        const ecg = this.$('ecg-panel');
        if (ecg && d.tools.ecg) {
            const due = new Date(new Date(s.meta.arrivalAt).getTime() + 10 * 60000);
            if (s.assess.ecgDoneAt) {
                const mins = Math.round((new Date(s.assess.ecgDoneAt) - new Date(s.meta.arrivalAt)) / 60000);
                ecg.innerHTML = `<div class="tool-head"><span class="tool-title">ECG</span><span class="tool-result ${mins <= 10 ? 'res-green' : 'res-amber'}">Done ${hhmm(s.assess.ecgDoneAt)} (${mins} min after arrival)</span></div><button type="button" class="btn-tiny" data-action="ecg-undo">Undo</button>`;
            } else {
                const late = new Date() > due;
                ecg.innerHTML = `<div class="tool-head"><span class="tool-title">ECG within 10 minutes of arrival</span><span class="tool-result ${late ? 'res-red' : 'res-amber'}">${late ? 'OVERDUE - was due' : 'Due by'} ${hhmm(due)}</span></div><button type="button" class="btn-primary" data-action="ecg-done">ECG done now</button>`;
            }
        }
        const lkwEl = this.$('lkw-elapsed');
        if (lkwEl) {
            const lkw = s.assess.stroke.lkw ? new Date(s.assess.stroke.lkw) : null;
            if (lkw && !Number.isNaN(lkw.getTime())) {
                const mins = Math.round((Date.now() - lkw.getTime()) / 60000);
                lkwEl.textContent = mins >= 0 ? `${Math.floor(mins / 60)} h ${mins % 60} min since last known well - alert the stroke team per local pathway.` : 'Last known well is in the future - check the time.';
            } else lkwEl.textContent = 'Record when the patient was last known to be well - it decides treatment options.';
        }
    }

    renderEws() {
        const d = this.derived, e = d.ews;
        this.$('ews-label').textContent = e.type === 'NEWS2' ? 'NEWS2' : (e.type === 'PEWS' ? 'local PEWS' : 'local MEOWS');
        const pts = {};
        e.params.forEach(p => { pts[p.key] = p.points; });
        this.$('obs-form').querySelectorAll('.obs-item[data-param]').forEach(el => {
            const v = pts[el.dataset.param];
            el.classList.remove('nw-1', 'nw-2', 'nw-3');
            if (e.type === 'NEWS2' && v) el.classList.add(`nw-${Math.min(v, 3)}`);
            if (e.type !== 'NEWS2' && v) el.classList.add(v >= 3 ? 'nw-3' : 'nw-1');
        });
        document.querySelectorAll('#seg-o2 button').forEach(b => b.classList.toggle('active', b.dataset.value === this.state.obs.o2));
        document.querySelectorAll('#seg-avpu button').forEach(b => b.classList.toggle('active', b.dataset.value === this.state.obs.avpu));
        const gt = this.$('gcs-total');
        gt.textContent = d.gcsTotal !== null ? `= ${d.gcsTotal}` : '';

        let cls = 'ews-none', text;
        const ref = e.type === 'NEWS2' ? this.data.references.news2 : (e.type === 'PEWS' ? this.data.references.pews : this.data.references.meows);
        const label = e.type === 'NEWS2' ? 'NEWS2' : (e.type === 'PEWS' ? `Local PEWS (${e.group})` : 'Local MEOWS');
        if (e.recorded === 0) text = `${label}: no obs recorded`;
        else if (!e.complete) {
            text = e.type === 'NEWS2' ? `${d.newsSum.text} - ${d.newsSum.riskText}` : `${label}: INCOMPLETE ${e.recorded}/${e.recorded + e.missing.length} - partial score ${e.score}`;
            if (e.score >= 7) cls = 'ews-crit'; else if (e.score >= 5) cls = 'ews-high'; else if (e.score >= 3 || e.redParam) cls = 'ews-mid';
        } else {
            text = `${label} ${e.score}${d.newsResp ? ` - ${d.newsResp.risk} risk` : ''}`;
            if (e.type === 'NEWS2') cls = e.score >= 7 ? 'ews-crit' : (e.score >= 5 ? 'ews-high' : (e.score >= 1 || e.redParam ? 'ews-mid' : 'ews-low'));
            else cls = e.score >= 5 ? 'ews-crit' : (e.score >= 1 ? 'ews-mid' : 'ews-low');
        }
        const tags = e.params.filter(p => p.points > 0).map(p => `<span class="news-tag">${esc(p.label)} ${esc(p.value)} (+${p.points})</span>`).join('')
            + e.missing.map(m => `<span class="news-tag missing">${esc(m)} not scored yet</span>`).join('');
        const sum = d.newsSum;
        const prov = sum && sum.status === 'provisional'
            ? `<p class="hint ews-prov-note">Provisional: missing obs are <strong>not</strong> counted as 0, so the full NEWS2 can only be the same or higher. App default - the RCP chart scores all 7.</p>` : '';
        const resp = sum && sum.monitorText ? `<span class="hint">RCP response: obs ${esc(sum.monitorText)}</span>` : (sum && sum.status === 'provisional' ? '<span class="hint">Obs frequency: record the missing obs first</span>' : '');
        this.$('visual-ews-container').innerHTML = `<span class="ews-badge ${cls}${sum && sum.status === 'provisional' ? ' ews-provisional' : ''}">${esc(text)}</span>${this.infoPopoverHTML(ref)}<div class="news-breakdown">${tags}</div>${resp}${prov}`;
    }

    renderSepsis() {
        const d = this.derived, s = this.state, sp = d.sepsis, box = this.$('sepsis-screen-container');
        const key = JSON.stringify([sp.applicable, sp.guideline || 'NG253', sp.ageText || '', s.assess.infection, sp.status === 'paeds' || sp.status === 'pregnant' || sp.status === 'no-age']);
        if (this.built.sepsisKey !== key) {
            this.built.sepsisKey = key;
            if (!sp.applicable) {
                box.innerHTML = `<div class="tool-head"><span class="tool-title">Sepsis (NICE NG253)</span></div><p class="tool-note" id="sepsis-text"></p>`;
            } else if (sp.guideline === 'NG254') {
                const items = sp.ageText === 'aged 12 to 15' ? C.NG254_ITEMS.young : sp.ageText === 'under 5' ? C.NG254_ITEMS.under5 : C.NG254_ITEMS.child;
                box.innerHTML = `<div class="tool-head"><span class="tool-title">Sepsis (NICE NG254, ${sp.ageText || 'under 16'})</span><span class="tool-result" id="sepsis-result"></span></div>
                    <div class="q-row"><span><strong>Could this be an infection?</strong> (suspected or confirmed)</span>${this.ynHTML('assess.infection', s.assess.infection)}</div>
                    <p class="tool-actions" id="sepsis-actions"></p><p class="tool-note" id="sepsis-judgement"></p>
                    ${s.assess.infection === 'yes' ? `<p class="tool-note" id="ng254-auto"></p><h4>High risk criteria</h4>${this.checksHTML(items.high, 'assess.ng254', s.assess.ng254)}<h4>Moderate to high risk criteria</h4>${this.checksHTML(items.moderate, 'assess.ng254', s.assess.ng254)}` : ''}
                    <p class="tool-note">${sp.ageText === 'under 5'
                        ? 'RR, heart rate, SpO2, temperature and CRT are scored automatically from the obs; ACVPU P or U counts as "does not wake". NICE: measure BP in under 5s if heart rate or CRT is abnormal.'
                        : `RR, heart rate, SpO2, temperature${sp.ageText === 'aged 12 to 15' ? ', systolic BP' : ' and CRT'} and ACVPU/GCS are scored automatically from the obs.`}</p>`;
            } else {
                box.innerHTML = `<div class="tool-head"><span class="tool-title">Sepsis (NICE NG253, 16 and over)</span><span class="tool-result" id="sepsis-result"></span></div>
                    <div class="q-row"><span><strong>Could this be an infection?</strong> (suspected or confirmed)</span>${this.ynHTML('assess.infection', s.assess.infection)}</div>
                    <p class="tool-actions" id="sepsis-actions"></p><p class="tool-note" id="sepsis-judgement"></p>
                    ${s.assess.infection === 'yes' ? `<h4>Also record:</h4>${this.checksHTML(this.data.sepsisConsiderations.map(c => [c.id, c.label]), 'assess.sepsisFactors', s.assess.sepsisFactors)}` : ''}
                    <p class="tool-note">Risk comes from a complete NEWS2. Chemotherapy and immunosuppression: tick the high-risk groups in History.</p>`;
            }
        }
        const t = this.$('sepsis-text');
        if (t) t.textContent = sp.text;
        const r = this.$('sepsis-result');
        if (r) {
            if (sp.status === 'assessed') {
                r.textContent = `${sepsisRiskText(sp)}${sp.provisional ? ' (provisional - obs incomplete)' : ''}`;
                r.className = `tool-result ${(sp.band || sp.risk) === 'High' ? 'res-red' : ((sp.band || sp.risk) === 'Medium' ? 'res-amber' : 'res-grey')}`;
            } else { r.textContent = sp.status === 'not-suspected' ? 'Not applied' : 'Not assessed'; r.className = 'tool-result res-grey'; }
            this.$('sepsis-actions').textContent = sp.status === 'assessed' ? sp.actions : '';
            this.$('sepsis-judgement').textContent = sp.judgement || '';
            const au = this.$('ng254-auto');
            if (au) {
                const fromObs = sp.status === 'assessed' ? [...sp.high.filter(x => !Object.values(C.NG254_ITEMS).some(g => g.high.some(([, t]) => t === x))).map(x => `high: ${x}`), ...sp.moderate.filter(x => !Object.values(C.NG254_ITEMS).some(g => g.moderate.some(([, t]) => t === x))).map(x => `moderate to high: ${x}`)] : [];
                au.textContent = fromObs.length ? `From the obs - ${fromObs.join('; ')}` : (sp.missing && sp.missing.length ? `Still to record: ${sp.missing.join(', ')}` : '');
            }
        }
    }

    renderPaeds() {
        const d = this.derived, s = this.state, p = s.patient;
        this.$('card-paeds').classList.toggle('hidden', !d.isPaeds);
        if (!d.isPaeds) { this.built.paedsKey = null; return; }
        const under5 = p.age < 5;
        const key = JSON.stringify([under5, p.age < 1, s.assess.paeds.recentDose, s.assess.ng143.feverReported, d.feverRelevant]);
        if (this.built.paedsKey !== key) {
            this.built.paedsKey = key;
            const pa = s.assess.paeds;
            let html = `<div class="tool-panel"><div class="tool-head"><span class="tool-title">Analgesia / antipyretic check</span></div>
                <div class="q-row"><span>Paracetamol or ibuprofen given in the last 4-6 hours?</span>${this.ynHTML('assess.paeds.recentDose', pa.recentDose, ['Yes', 'No', 'Unknown'], ['yes', 'no', 'unknown'])}</div>
                <div id="paeds-doses"></div>
                <p class="tool-note">Guidance only - check BNFc and your PGD. Doses use measured weight (capped at ${this.data.scoring.paedsSafety.weightCapKg} kg).</p></div>`;
            if (under5) {
                html +=`<div class="tool-panel"><div class="tool-head"><span class="tool-title">NICE NG143 fever traffic light (under 5)</span><span class="tool-result" id="ng143-result"></span></div>
                    <label class="check-line"><input type="checkbox" data-path="assess.ng143.feverReported"${s.assess.ng143.feverReported ? ' checked' : ''}> Fever reported by parent/carer (applies automatically if measured temp is 38°C or more)</label>
                    <div id="ng143-auto" class="tool-note"></div>
                    ${d.feverRelevant ? `<h4>Red features</h4>${this.checksHTML(C.NG143_ITEMS.red, 'assess.ng143.ticks', s.assess.ng143.ticks)}<h4>Amber features</h4>${this.checksHTML(C.NG143_ITEMS.amber, 'assess.ng143.ticks', s.assess.ng143.ticks)}` : ''}</div>`;
            }
            html += `<div class="tool-panel"><div class="tool-head"><span class="tool-title">Safeguarding children</span><span id="sg-result"></span></div>
                <div class="q-row"><span>Accompanied by (name / relationship)</span><input type="text" data-path="assess.paeds.accompaniedBy" value="${esc(pa.accompaniedBy)}" autocomplete="off"></div>
                ${this.checksHTML([['cpis', 'Child Protection - Information Sharing (CP-IS) checked'], ['pr', 'Person with parental responsibility identified'],
                    ['nonmobile', 'Injury or bruising in a non-mobile child'], ['story', 'Explanation inconsistent with injury or development'], ['notbrought', 'Concern about previous attendances or missed ("was not brought") appointments']], 'assess.paeds.safeguarding', pa.safeguarding)}
                <p class="tool-note" id="sg-note"></p></div>`;
            this.$('paeds-content').innerHTML = html;
        }
        const a = d.analgesia, doses = this.$('paeds-doses');
        if (doses) {
            if (a.blocked) doses.innerHTML = `<p class="tool-actions"><strong>${esc(a.blocked)}</strong></p>`;
            else if (!s.assess.paeds.recentDose) doses.innerHTML = '<p class="tool-actions">Answer the question above to see doses.</p>';
            else doses.innerHTML = `<p class="tool-actions"><strong>Paracetamol ${a.paracetamol} mg</strong> (15 mg/kg) · <strong>${a.ibuprofen === null ? 'Ibuprofen: not suitable' : `Ibuprofen ${a.ibuprofen} mg`}</strong>${a.ibuprofenNote ? ` - ${esc(a.ibuprofenNote)}` : ''}</p>${s.assess.paeds.recentDose !== 'no' ? '<p class="tool-note"><strong>Check the time and dose already given - do not exceed the maximum daily dose.</strong></p>' : ''}`;
        }
        const r = this.$('ng143-result');
        if (r) {
            const tl = d.feverTL;
            if (!d.feverRelevant) { r.textContent = 'No fever recorded'; r.className = 'tool-result res-grey'; }
            else { r.textContent = tl.level ? `${tl.level.toUpperCase()}${tl.level === 'Green' ? ' so far' : ''}` : 'Record temp, RR and HR'; r.className = `tool-result ${tl.level === 'Red' ? 'res-red' : tl.level === 'Amber' ? 'res-amber' : tl.level === 'Green' ? 'res-green' : 'res-grey'}`; }
            const au = this.$('ng143-auto');
            const obsItems = [...tl.red, ...tl.amber].filter(t => /\d/.test(t));
            if (au) au.textContent = obsItems.length ? `From obs: ${obsItems.join('; ')}` : '';
        }
        const sg = s.assess.paeds.safeguarding;
        const n = this.$('sg-note');
        const concern = !!(sg.nonmobile || sg.story || sg.notbrought);
        if (n) n.textContent = concern ? 'Safeguarding concern - follow your local child safeguarding procedure and inform the senior clinician.' : '';
        const sr = this.$('sg-result');
        if (sr) {
            if (concern) { sr.className = 'tool-result res-amber'; sr.textContent = 'Concern recorded'; }
            else {
                const on = !!s.assess.paeds.safeguardingNone;
                sr.className = 'tool-result-btn';
                sr.innerHTML = `<div class="segmented-control yn"><button type="button" data-action="sg-none" class="${on ? 'active' : ''}" aria-pressed="${on}">No safeguarding concerns</button></div>`;
            }
        }
    }

    renderIpc() {
        const s = this.state, box = this.$('ipc-panel');
        if (!this.built.ipc) {
            this.built.ipc = true;
            box.innerHTML = `<div class="tool-head"><span class="tool-title">Infection prevention &amp; control</span><span class="tool-result" id="ipc-result"></span></div>` +
                this.checksHTML([['dv', 'Diarrhoea and/or vomiting'], ['resp', 'New cough / respiratory infection symptoms'], ['rash', 'Rash with fever'],
                    ['travel', 'Travelled abroad recently (record where and when)'], ['mdro', 'Known MRSA / CPE / other resistant organism']], 'assess.ipc', s.assess.ipc);
        }
        // "No IPC flags" is a positive answer the nurse taps, like every other section: leaving the
        // boxes blank is "not asked", not "normal".
        const r = this.$('ipc-result');
        if (this.derived.ipcFlag) {
            r.innerHTML = '';
            r.textContent = 'Side room / isolation - follow local IPC policy';
            r.className = 'tool-result res-amber';
        } else {
            const on = !!s.assess.ipcNone;
            r.className = 'tool-result-btn';
            r.innerHTML = `<div class="segmented-control yn"><button type="button" data-action="ipc-none" class="${on ? 'active' : ''}" aria-pressed="${on}">No IPC flags</button></div>`;
        }
    }

    renderScreeningDynamic() {
        const age = this.state.patient.age;
        Object.entries(this.data.screening).forEach(([key, def]) => {
            const el = this.$(`screen-${key}`);
            if (!el) return;
            const show = (def.minAge === undefined || (age !== null && age >= def.minAge)) && (def.maxAge === undefined || (age !== null && age <= def.maxAge));
            el.style.display = show ? '' : 'none';
            const v = this.state.screening[key] || '';
            if (def.options) { const sel = this.$(`screen-input-${key}`); if (sel && sel.value !== v) sel.value = v; }
            else document.querySelectorAll(`#toggle-${key} button`).forEach(b => b.classList.toggle('active', b.dataset.value === v));
        });
    }

    renderCorridor() {
        const s = this.state, box = this.$('corridor-panel');
        const on = s.triage.disposition === 'Escalation' || s.triage.disposition === 'Held on Ambulance';
        box.classList.toggle('hidden', !on);
        if (!on) { this.built.corridor = false; return; }
        if (!this.built.corridor) {
            this.built.corridor = true;
            box.innerHTML = `<div class="tool-head"><span class="tool-title">Corridor / escalation care checks</span><span class="tool-result" id="corridor-last"></span></div>` +
                this.checksHTML([['dignity', 'Privacy, dignity and comfort'], ['pressure', 'Pressure areas checked'], ['fluids', 'Food and drink offered (if safe)'], ['toilet', 'Toileting offered'],
                    ['meds', 'Time-critical medicines checked'], ['callbell', 'Able to summon help'], ['obs', 'Obs repeated when due']], 'assess.corridor', s.assess.corridor) +
                `<button type="button" class="btn-tiny mt-6" data-action="corridor-checked">Record check done now</button>`;
        }
        this.$('corridor-last').textContent = s.assess.corridorCheckedAt ? `Last check ${hhmm(s.assess.corridorCheckedAt)}` : 'No check recorded';
    }

    renderMedsAlert() {
        const risks = this.derived.risks, el = this.$('meds-alert'), raw = (this.state.history.meds || '').toLowerCase();
        if (risks.length) { el.textContent = `Safety alerts: ${risks.join(', ')}`; el.className = 'meds-status-bar meds-risk'; }
        else if (/\b(nil|none|nkda|no meds|nothing)\b/.test(raw) || raw.length > 5) { el.textContent = 'No high-risk medicines detected (check the tick-boxes too)'; el.className = 'meds-status-bar meds-safe'; }
        else { el.textContent = ''; el.className = 'meds-status-bar'; }
        this.$('high-risk-meds-grid').querySelectorAll('input').forEach(cb => {
            const on = !!this.state.history.manualRiskFlags[cb.dataset.catId];
            cb.checked = on;
            cb.closest('.hr-med-chip').classList.toggle('checked', on);
        });
        // "None of these" is a positive answer; it only shows while no group is ticked.
        const hrNone = this.$('btn-hr-none'), anyTicked = Object.values(this.state.history.manualRiskFlags).some(Boolean);
        hrNone.closest('.label-actions').classList.toggle('hidden', anyTicked);
        // Groups already found in the medicines list: the button then means "no OTHER groups".
        hrNone.textContent = (this.autoRisks || []).length ? 'No other groups' : 'None of these';
        hrNone.classList.toggle('active', !anyTicked && !!this.state.history.riskNone);
        hrNone.setAttribute('aria-pressed', String(!anyTicked && !!this.state.history.riskNone));
    }

    renderPmhPrompts() {
        const raw = (this.state.history.pmh || '').toLowerCase();
        const words = raw.split(/[^a-z]+/).filter(w => w.length >= 3);
        const prompts = [...new Set(Object.entries(this.data.pmhPrompts).filter(([k]) => k.includes(' ') ? raw.includes(k) : words.some(w => TriageApp.fuzzyMatch(w, k))).map(([, t]) => t))];
        const sig = prompts.join('|');
        if (sig !== this.state.ui.pmhSignature) { this.state.ui.pmhSignature = sig; this.state.ui.pmhPromptsDismissed = false; }
        const el = this.$('pmh-prompts');
        if (!prompts.length || this.state.ui.pmhPromptsDismissed) { el.classList.add('hidden'); el.innerHTML = ''; return; }
        el.classList.remove('hidden');
        el.innerHTML = `<span>💡 ${esc(prompts.join(' '))}</span> <button type="button" class="btn-tiny" data-action="dismiss-pmh">Dismiss</button>`;
    }

    renderUniversalChecks() {
        const c = this.$('universal-checks-container');
        const items = this.derived.plan.items.filter(i => i.category === 'Universal');
        c.classList.toggle('hidden', !items.length);
        const key = JSON.stringify(items.map(i => [i.name, i.status, i.reasons]));
        if (this.built.univ === key) return;
        this.built.univ = key;
        c.innerHTML = items.length ? '<h4>Universal safety check</h4>' : '';
        items.forEach(it => c.appendChild(this.planItemEl(it)));
    }

    renderDecision() {
        const d = this.derived, s = this.state;
        if (!d.priority) return;
        const badge = this.$('priority-display');
        const lvl = d.level;
        badge.className = `priority-badge priority-${lvl || 'None'}${d.priority.provisional ? ' provisional' : ''}`;
        badge.innerHTML = lvl ? `${lvl.toUpperCase()}${d.priority.provisional ? '<small>provisional - choose a discriminator</small>' : ''}` : 'NOT YET TRIAGED';
        const mini = this.$('ews-mini'), sum = d.newsSum;
        if (sum && sum.status !== 'none') {
            mini.classList.remove('hidden');
            mini.className = `ews-mini${sum.status === 'provisional' ? ' provisional' : ''}${d.ews.score >= 7 ? ' ews-crit' : (d.ews.score >= 5 ? ' ews-high' : (d.ews.score >= 3 || d.ews.redParam ? ' ews-mid' : ''))}`;
            mini.innerHTML = sum.status === 'provisional'
                ? `<strong>${esc(sum.short)}</strong> <span>${sum.recorded}/${sum.total} obs - ${esc(sum.riskText)}</span>`
                : `<strong>${esc(sum.short)}</strong> <span>${esc(sum.riskText)}</span>`;
        } else { mini.className = 'ews-mini hidden'; mini.innerHTML = ''; }
        const sb = this.$('seeby');
        if (lvl && d.seeBy) {
            const mins = Math.round((d.seeBy - Date.now()) / 60000);
            const target = this.data.targetMinutes[lvl];
            sb.innerHTML = lvl === 'Red' ? '<span class="overdue">See immediately</span>' :
                `See by ${hhmm(d.seeBy)} <span class="${mins < 0 ? 'overdue' : ''}">(${mins < 0 ? `${-mins} min overdue` : `${mins} min left`})</span><small>${target}-minute target from arrival at ${hhmm(s.meta.arrivalAt)}</small>`;
        } else sb.innerHTML = '';
        this.$('stream-display').textContent = d.stream;
        const obsOverdue = d.nextObsAt && d.nextObsAt < new Date();
        this.$('next-obs-display').innerHTML = obsOverdue ? `<span class="overdue">${esc(d.nextObs)} - OVERDUE</span>` : esc(d.nextObs);
        this.$('priority-reasons').innerHTML = d.priority.reasons.map(r => `<div>• ${esc(r)}</div>`).join('');

        const rows = [];
        const e = d.ews;
        rows.push(['Obs', e.recorded === 0 ? ['Not taken', 'st-grey'] : (!e.complete ? (e.type === 'NEWS2' ? [`${d.newsSum.text}; not scored yet: ${e.missing.join(', ')}`, e.score >= 5 ? 'st-red' : 'st-amber'] : [`${e.type} incomplete (${e.missing.length} missing), partial ${e.score}`, 'st-amber']) : [`${e.type} ${e.score}${d.newsResp ? ` - ${d.newsResp.risk}` : ''}`, e.score >= 5 ? 'st-red' : ''])]);
        const sp = d.sepsis;
        if (sp.applicable) rows.push(['Sepsis', sp.status === 'assessed' ? [`${sepsisRiskText(sp)}${sp.provisional ? ' (provisional)' : ''}`, (sp.band || sp.risk) === 'High' ? 'st-red' : ((sp.band || sp.risk) === 'Medium' ? 'st-amber' : '')] : [sp.status === 'not-suspected' ? 'Infection not suspected' : 'Infection question not answered', 'st-grey']]);
        rows.push(['Pain', C.has(s.complaint.pain) ? [`${s.complaint.pain}/10 ${d.pain.band.toLowerCase()}`, s.complaint.pain >= 8 ? 'st-red' : ''] : ['Not assessed', 'st-grey']]);
        if (d.frailty) rows.push(['Frailty', [d.frailty.label, d.frailty.frail ? 'st-amber' : '']]);
        const al = s.history.allergies.trim();
        rows.push(['Allergies', al ? [al + (s.history.allergyReaction ? ` (${s.history.allergyReaction})` : ''), /nkda|nil/i.test(al) ? '' : 'st-red'] : ['Not recorded', 'st-grey']]);
        if (d.risks.length) rows.push(['Alerts', [`${d.risks.length} high-risk medicine / group alert${d.risks.length > 1 ? 's' : ''}`, 'st-red']]);
        if (d.feverRelevant) rows.push(['Fever <5', [d.feverTL.level ? `NICE traffic light ${d.feverTL.level}` : 'Traffic light incomplete', d.feverTL.level === 'Red' ? 'st-red' : (d.feverTL.level === 'Amber' ? 'st-amber' : '')]]);
        if (d.ng232) rows.push(['Head injury', [ng232Nurse(d.ng232), d.ng232.level === '1h' ? 'st-red' : (d.ng232.level === 'none' ? '' : 'st-amber')]]);
        if (d.tools.ecg) rows.push(['ECG', s.assess.ecgDoneAt ? [`Done ${hhmm(s.assess.ecgDoneAt)}`, ''] : [`Due by ${hhmm(new Date(new Date(s.meta.arrivalAt).getTime() + 600000))}`, 'st-amber']]);
        if (d.rosier) rows.push(['Stroke', [d.rosier.text, d.rosier.likely ? 'st-red' : '']]);
        if (d.ipcFlag) rows.push(['IPC', ['Isolation / side room needed', 'st-amber']]);
        this.$('status-list').innerHTML = rows.map(([k, [v, cls]]) => `<li><strong>${esc(k)}</strong><span class="${cls}">${esc(v)}</span></li>`).join('');

        // Fast triage: items for folded sections are listed separately as "for later", not hidden.
        const later = document.body.classList.contains('quick-mode') ? d.missing.filter(m => LATER_IN_FAST.test(m)) : [];
        const now = d.missing.filter(m => !later.includes(m));
        this.$('missing-list').innerHTML = (now.length ? `<strong>Still to record (${now.length})</strong><ul>${now.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : '') +
            (later.length ? `<div class="missing-later">Fast triage - for later (${later.length}): ${later.map(esc).join('; ')}</div>` : '');
    }

    // ------------------------------------------------------------------ plan / protocols
    // Facts for the investigations and cannula engine (plan-engine.js) - everything recorded so far.
    planFacts() {
        const s = this.state, d = this.derived, p = s.patient, h = s.history, mf = h.manualRiskFlags;
        const risks = d.risks.join(' | ');
        const meds = (h.meds || '').toLowerCase(), pmh = (h.pmh || '').toLowerCase();
        const lkw = s.assess.stroke.lkw ? new Date(s.assess.stroke.lkw) : null;
        const lkwHours = lkw && !Number.isNaN(lkw.getTime()) && lkw <= new Date() ? (Date.now() - lkw.getTime()) / 3600000 : null;
        // Is the Orange category there only because of pain? (Severe pain alone does not need IV access.)
        const orangeFrom = [];
        if (d.disc && d.disc.priority === 'Orange') orangeFrom.push(/severe pain/i.test(d.disc.text) ? 'pain' : 'other');
        d.floors.filter(f => f.level === 'Orange').forEach(f => orangeFrom.push(/pain ruler/.test(f.reason) ? 'pain' : 'other'));
        if (s.triage.override && s.triage.override.level === 'Orange') orangeFrom.push('other');
        return {
            age: p.age, sex: p.sex, pregnant: p.pregnant, weight: p.weight,
            complaint: s.complaint.name, discriminator: s.complaint.discriminator, level: d.level,
            painOnlyOrange: d.level === 'Orange' && orangeFrom.length > 0 && orangeFrom.every(x => x === 'pain'),
            ews: d.ews, obs: { ...s.obs, gcs: d.gcsTotal }, prehospitalBm: s.prehospital.obs.bm,
            sepsisRisk: d.sepsis.status === 'assessed' ? (d.sepsis.band || d.sepsis.risk) : null, infection: s.assess.infection,
            sepsisGuideline: d.sepsis.status === 'assessed' ? (d.sepsis.guideline || 'NG253') : null,
            sepsisLabel: d.sepsis.status === 'assessed' && d.sepsis.guideline === 'NG254' ? d.sepsis.risk : '',
            feverTL: d.feverRelevant ? d.feverTL.level : null,
            ng232: d.ng232 ? d.ng232.level : null, headInjury: !!d.ng232,
            rosierLikely: !!(d.rosier && d.rosier.likely), lkwHours,
            flags: {
                anticoag: s.assess.ng232Anticoag === null ? d.anticoagDetected : s.assess.ng232Anticoag,
                antiplatelet: !!mf.antiplatelet || /Antiplatelet/.test(risks),
                insulin: /Insulin/.test(risks), sulphonylurea: /Sulphonylurea/.test(risks), sglt2: /SGLT2/.test(risks),
                steroid: /Steroid/.test(risks), immunosuppressant: /Immunosuppressant|Biologic/.test(risks),
                chemo: !!mf.chemo, sickle: !!mf.sickle, dialysis: !!mf.dialysis || /dialysis/.test(pmh),
                lithium: /lithium|priadel|camcolit/.test(meds), digoxin: /digoxin/.test(meds)
            },
            diabetes: /diabet|\bt[12]dm\b|\biddm\b|\bniddm\b/.test(pmh),
            cardiacHistory: cardiacHistoryFrom(pmh),
            pain: s.complaint.pain,
            protocol: this.data.protocols[s.complaint.name] || null
        };
    }

    placementLabel(value) {
        for (const opts of Object.values(this.data.placements)) if (opts[value]) return opts[value];
        return value;
    }

    sourceHTML(reasons) {
        const keys = [...new Set(reasons.map(r => r.source).filter(k => k && k !== 'local' && SOURCES[k]))];
        if (!keys.length) return reasons.some(r => r.source === 'local') ? '<small class="protocol-source">Source: app default - adopt or change locally</small>' : '';
        return `<small class="protocol-source">Source: ${keys.map(k => SOURCES[k].url ? `<a href="${esc(SOURCES[k].url)}" target="_blank" rel="noopener">${esc(SOURCES[k].label)}</a>` : esc(SOURCES[k].label)).join('; ')}</small>`;
    }

    planItemEl(it) {
        const tag = it.status === 'now' ? 'now' : (it.status === 'suggested' ? 'suggested' : 'consider');
        const because = it.reasons.length ? `Because: ${it.reasons.map(r => r.text).join('; ')}` : (it.when ? `Consider if ${it.when}` : '');
        const extra = `${it.timing ? `<small class="protocol-timing">⏱ ${esc(it.timing)}</small>` : ''}${it.caution ? `<small class="protocol-caution">${esc(it.caution)}</small>` : ''}${it.reasons.length ? this.sourceHTML(it.reasons) : ''}`;
        let why = it.why;
        if (it.category === 'Bloods') why = `Includes: ${(this.data.bloodProfiles[it.name] || []).map(t => t.name).join(', ')}`;
        const el = this.planCheck({ name: it.name, why }, it.category, '', { tag, hint: because, extraHTML: extra });
        if (it.category === 'Bloods') el.classList.add('profile-check');
        return el;
    }

    // Nursing plan from the engine: cannula decision, bedside tests and samples, ED ICE blood bundles.
    // No imaging (nursing scope).
    renderProtocol() {
        const s = this.state, plan = this.derived.plan, container = this.$('protocol-actions');
        const cn = plan.cannula;
        const body = plan.items.filter(i => i.category !== 'Universal');
        const key = JSON.stringify([s.complaint.name, cn, body.map(i => [i.name, i.status, i.reasons, i.when, i.timing]), plan.notes]);
        if (this.built.protocolKey === key) return;
        this.built.protocolKey = key;
        container.innerHTML = '';
        if (!s.complaint.name && !body.length && cn.decision === 'not-needed') { container.innerHTML = '<p class="placeholder-text">Choose a complaint to see suggested investigations.</p>'; return; }

        const intro = document.createElement('p');
        intro.className = 'plan-intro';
        intro.textContent = 'Do now = time-critical. Suggested = indicated by the complaint, discriminator, obs or history (reasons shown). "Consider if" = only when that applies. Nursing investigations only - use clinical judgement and local policy.';
        container.appendChild(intro);

        const tone = { now: 'red', recommended: 'red', consider: 'amber', 'not-needed': 'green' }[cn.decision];
        const cd = document.createElement('div');
        cd.className = `cannula-badge cannula-${tone}`;
        const reasons = cn.reasons.filter(r => r.level === cn.decision || cn.decision === 'consider');
        cd.innerHTML = `<span aria-hidden="true">💉</span><div><strong>Cannula: ${esc(cn.label)}</strong>${cn.size ? ` (${esc(cn.size)})` : ''}` +
            (reasons.length ? `<ul class="cannula-reasons">${reasons.map(r => `<li>${esc(r.text)}</li>`).join('')}</ul>` : '<div class="cannula-reasons">No IV access trigger from what is recorded so far.</div>') +
            (cn.cautions.length ? `<div class="cannula-cautions">${cn.cautions.map(c => `<div>⚠ ${esc(c)}</div>`).join('')}</div>` : '') +
            `<div class="cannula-notes">${cn.notes.map(n => esc(n)).join(' ')}</div>${this.sourceHTML([...reasons, ...cn.notesSources.map(source => ({ source }))])}</div>`;
        container.appendChild(cd);
        if (cn.decision !== 'not-needed') {
            container.appendChild(this.planCheck({ name: 'IV cannula', why: cn.size ? `Size: ${cn.size}` : '' }, 'Cannula', '', { tag: cn.decision === 'now' ? 'now' : (cn.decision === 'recommended' ? 'suggested' : 'consider') }));
        }

        const grid = document.createElement('div');
        grid.className = 'tests-grid';
        const sec = document.createElement('div');
        sec.className = 'test-category';
        sec.innerHTML = '<h4>Bedside tests &amp; samples</h4>';
        const bedside = body.filter(i => i.category === 'Bedside');
        if (bedside.length) bedside.forEach(t => sec.appendChild(this.planItemEl(t)));
        else sec.insertAdjacentHTML('beforeend', '<p class="plan-note">No routine bedside tests for this presentation beyond full obs.</p>');
        grid.appendChild(sec);

        const bl = document.createElement('div');
        bl.className = 'test-category';
        bl.innerHTML = '<h4>Bloods - ED ICE bundles</h4>';
        const bloods = body.filter(i => i.category === 'Bloods');
        bloods.forEach(b => bl.appendChild(this.planItemEl(b)));
        if (!bloods.length && !plan.notes.some(n => n.source === 'local')) bl.insertAdjacentHTML('beforeend', '<p class="plan-note">No ED blood bundle for this presentation - bloods only if a clinician requests them.</p>');
        if (bloods.length) bl.insertAdjacentHTML('beforeend', '<div class="bbv-note">Trust policy: ICE adds a BBV screen (Hep B, Hep C, HIV) to these requests if not done in the past 12 months.</div>');
        grid.appendChild(bl);
        container.appendChild(grid);
        plan.notes.forEach(n => container.insertAdjacentHTML('beforeend', `<p class="plan-note">${esc(n.text)} ${n.source !== 'local' ? this.sourceHTML([n]) : ''}</p>`));
    }

    // Suggested placement: category-based default plus the complaint's pathways (subject to local criteria).
    renderPlacement() {
        const s = this.state, d = this.derived, box = this.$('placement-suggest');
        const base = C.basePlacement({ level: d.level, isPaeds: d.isPaeds, mobility: s.patient.mobility });
        const proto = this.data.protocols[s.complaint.name];
        const ctx = autoContext(this.planFacts());
        // Once a discriminator is chosen, pathways that depend only on a different discriminator are irrelevant.
        const chosen = !!s.complaint.discriminator || s.complaint.noneApply;
        // App default: from 20 weeks by LMP, pregnancy problems go to maternity triage rather than the EPU.
        const lateGest = !!(d.gestation && d.gestation.valid && d.gestation.weeks >= 20);
        const paths = proto ? proto.pathways.map(p => (p.to === 'EPU' && lateGest ? { ...p, to: 'Maternity', when: `pregnant, ${d.gestation.weeks} weeks by LMP (app default: 20 weeks or more)` } : p))
            .map(p => ({ ...p, on: C.planAutoMet(p.auto, ctx) }))
            .filter(p => !(chosen && !p.on && p.auto && /^disc:/.test(p.auto)))
            .filter(p => !base || p.to !== base.to || !p.on) : [];
        const key = JSON.stringify([base, paths.map(p => [p.to, p.on]), s.complaint.name, s.triage.disposition]);
        if (this.built.placementKey === key) return;
        this.built.placementKey = key;
        const row = (to, text, cls) => `<div class="place-row ${cls}"><div><strong>${esc(this.placementLabel(to))}</strong><small>${esc(text)}</small></div>` +
            (s.triage.disposition === to ? '<span class="place-chosen">✓ Selected</span>' : `<button type="button" class="btn-tiny" data-action="use-placement" data-value="${esc(to)}">Use</button>`) + '</div>';
        let html = '';
        if (base) html += row(base.to, base.why, 'suggested');
        paths.filter(p => p.on).forEach(p => { html += row(p.to, `Complaint pathway: ${p.when}`, 'suggested'); });
        paths.filter(p => !p.on).forEach(p => { html += row(p.to, `Consider if ${p.when}`, 'consider'); });
        box.innerHTML = html ? `<h4>Suggested placement</h4>${html}<p class="plan-note">Direct-to-unit pathways apply only if the patient meets local referral criteria.</p>` : '<p class="plan-note">Placement suggestions appear once the patient is triaged.</p>';
    }

    // One tickable plan item with a Planned/Requested/Done status once ticked.
    // opts.tag: 'suggested' | 'consider'; opts.hint: small line under the rationale.
    planCheck(test, category, info = '', opts = {}) {
        const name = typeof test === 'string' ? test : test.name;
        const why = typeof test === 'string' ? '' : (test.why || '');
        const div = document.createElement('div');
        div.className = `protocol-check${opts.tag ? ` plan-${opts.tag}` : ''}`;
        const tag = opts.tag === 'now' ? '<span class="plan-tag plan-tag-now">Do now</span>' : (opts.tag === 'suggested' ? '<span class="plan-tag">Suggested</span>' : '');
        div.innerHTML = `<input type="checkbox" aria-label="${esc(name)}"> <div class="protocol-check-text"><span>${category === 'Bloods' ? `<strong>${esc(name)}</strong>` : esc(name)}${tag}</span>${opts.hint ? `<small class="protocol-when">${esc(opts.hint)}</small>` : ''}${why ? `<small class="protocol-why">${esc(why)}</small>` : ''}${opts.extraHTML || ''}</div>${info ? this.infoPopoverHTML(info) : ''}` +
            `<div class="status-control" role="group" aria-label="${esc(name)} status">${['Planned', 'Requested', 'Done'].map(o => `<button type="button" class="status-btn" data-status="${o}">${o}</button>`).join('')}</div>`;
        const input = div.querySelector('input');
        const statusBox = div.querySelector('.status-control');
        // Update in place (never re-create the checkbox) so keyboard focus is kept.
        const sync = () => {
            const item = this.state.plan.find(x => x.category === category && x.name === name);
            input.checked = !!item;
            div.classList.toggle('checked', !!item);
            statusBox.classList.toggle('hidden', !item);
            statusBox.querySelectorAll('.status-btn').forEach(b => b.classList.toggle('active', !!item && item.status === b.dataset.status));
        };
        input.addEventListener('change', () => {
            if (input.checked) this.state.plan.push({ category, name, status: 'Planned' });
            else this.state.plan = this.state.plan.filter(x => !(x.category === category && x.name === name));
            sync();
            this.update();
        });
        statusBox.addEventListener('click', (e) => {
            const b = e.target.closest('.status-btn');
            const it = this.state.plan.find(x => x.category === category && x.name === name);
            if (!b || !it) return;
            it.status = b.dataset.status;
            sync();
            this.update();
        });
        sync();
        return div;
    }

    // ------------------------------------------------------------------ meds autocomplete
    handleMedsAutocomplete(e) {
        const val = e.target.value, cursor = e.target.selectionStart;
        const lastWord = val.slice(0, cursor).split(/[\s,\n]+/).pop();
        const box = this.$('meds-suggestions');
        if (!lastWord || lastWord.length < 3) { box.classList.add('hidden'); return; }
        const lower = lastWord.toLowerCase();
        let matches = this.data.drugIndex.filter(d => d.toLowerCase().startsWith(lower));
        if (!matches.length) matches = this.data.drugIndex.filter(d => TriageApp.fuzzyMatch(lower, d.toLowerCase()));
        matches = matches.slice(0, 5);
        if (!matches.length) { box.classList.add('hidden'); return; }
        box.innerHTML = matches.map(m => `<div class="suggestion-item" role="option">${esc(m)}</div>`).join('');
        box.classList.remove('hidden');
        box.querySelectorAll('.suggestion-item').forEach(item => item.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            const nv = val.slice(0, cursor - lastWord.length) + item.textContent + ', ' + val.slice(cursor);
            this.$('meds').value = nv;
            box.classList.add('hidden');
            this.$('meds').focus();
            this.set('history.meds', nv);
        }));
    }

    // [typical min, typical max, lowest possible, highest possible]. Outside "possible" the value is
    // rejected (not scored, not in the note) and listed in "Still to record"; outside "typical" it is
    // accepted with a visible "check" message.
    validateObsField(id, value) {
        const months = this.state.patient.ageUnit === 'Months';
        const bounds = {
            'obs-rr': [6, 60, 0, 80, 'Resp rate'], 'obs-sats': [70, 100, 1, 100, 'SpO2'], 'obs-sbp': [60, 250, 30, 300, 'Systolic BP'], 'obs-dbp': [30, 150, 10, 200, 'Diastolic BP'],
            'obs-hr': [30, 220, 1, 300, 'Heart rate'], 'obs-temp': [32, 42, 25, 44, 'Temp'], 'obs-crt': [0, 6, 0, 15, 'CRT'], 'obs-bm': [1.5, 35, 0.5, 60, 'BM'], 'obs-ketones': [0, 8, 0, 10, 'Ketones'],
            'patient-age': months ? [0, 24, 0, 36, 'Age'] : [0, 105, 0, 120, 'Age'], 'patient-weight': [1, 250, 0.3, 350, 'Weight']
        }[id];
        const el = this.$(id);
        if (!this.invalid) this.invalid = {};
        if (!bounds || !el) return true;
        const [min, max, hmin, hmax, label] = bounds;
        el.classList.remove('field-warning', 'field-danger');
        el.title = '';
        delete this.invalid[id];
        let msg = '';
        let ok = true;
        if (C.has(value)) {
            if (value < hmin || value > hmax) {
                el.classList.add('field-danger');
                msg = `Not possible - re-enter (${hmin} to ${hmax})`;
                this.invalid[id] = `${label}: ${value} is not possible - re-enter it`;
                ok = false;
            } else if (value < min || value > max || (id === 'obs-dbp' && C.has(this.state.obs.sbp) && value >= this.state.obs.sbp)) {
                el.classList.add('field-warning');
                msg = 'Unusual - please double-check';
            }
        }
        el.title = msg;
        const host = el.closest('.obs-item, .form-group');
        let m = host ? host.querySelector('.obs-msg') : null;
        if (host && !m && msg) { m = document.createElement('small'); m.className = 'obs-msg'; m.setAttribute('aria-live', 'polite'); host.appendChild(m); }
        if (m) { m.textContent = msg; m.classList.toggle('obs-msg-danger', !ok); }
        return ok;
    }

    // ------------------------------------------------------------------ note, SBAR, copy
    // The note is built as sections so it can be copied both as plain text and as formatted
    // text (bold headings and labels) for EPRs whose note box accepts formatting.
    noteSections() {
        const s = this.state, d = this.derived, p = s.patient, h = s.history, ph = s.prehospital, o = s.obs;
        const f = (v, unit = '') => C.has(v) ? `${v}${unit}` : '-';
        const sections = [];
        let lines = null;
        const section = (title) => { lines = []; sections.push({ title, lines }); };
        if (p.arrivalMode === 'Ambulance') {
            section('RAA - AMBULANCE HANDOVER');
            lines.push(`Call sign: ${p.ambulanceCallSign || 'Not recorded'} | Case ID: ${p.ambulanceCaseId || 'Not recorded'}`, `HPC: ${ph.hpc || 'Not recorded'}`);
            if (ph.social) lines.push(`Social: ${ph.social}`);
            lines.push(`Pre-hospital treatment${ph.txTime ? ` (given ${ph.txTime})` : ''}: ${ph.tx || 'None recorded'}`);
            const pho = ph.obs, parts = [];
            if (C.has(pho.rr)) parts.push(`RR ${pho.rr}`);
            if (C.has(pho.sats)) parts.push(`SpO2 ${pho.sats}%${pho.o2 ? ` ${pho.o2 === 'O2' ? 'on O2' : 'air'}` : ''}`);
            if (C.has(pho.sbp)) parts.push(`BP ${pho.sbp}/${f(pho.dbp)}`);
            if (C.has(pho.hr)) parts.push(`HR ${pho.hr}`);
            if (C.has(pho.gcs)) parts.push(`GCS ${pho.gcs}`);
            if (C.has(pho.bm)) parts.push(`BM ${pho.bm}`);
            if (pho.ecg) parts.push(`ECG ${pho.ecg}`);
            if (pho.pupils) parts.push(`Pupils ${pho.pupils}`);
            if (parts.length) lines.push(`Pre-hospital obs: ${parts.join(' | ')}`);
        }
        section('TRIAGE NOTE');
        lines.push(`Arrival: ${hhmm(s.meta.arrivalAt)} ${ddmmyyyy(s.meta.arrivalAt)} (${p.arrivalMode === 'Ambulance' ? 'ambulance' : 'self-presented'}) | Triage started ${s.meta.startedAt ? hhmm(s.meta.startedAt) : '-'} | Category set ${s.meta.categorySetAt ? hhmm(s.meta.categorySetAt) : '-'}`);
        lines.push(`Triage nurse: ${store.get('initials', '', true) || 'Not recorded'}`);
        if (document.body.classList.contains('quick-mode')) lines.push('Triage mode: fast triage - PMH, medicines and screening may not be complete');
        const age = !C.has(p.ageValue) ? 'Age not recorded' : (p.ageUnit === 'Months' ? `${p.ageValue} months` : `${p.ageValue}y`);
        lines.push(`Patient: ${age} ${p.sex || 'sex not recorded'}${p.localRef ? ` | Ref: ${p.localRef}` : ''}`);
        lines.push(`Mobility: ${p.mobility ? `${p.mobility}${p.mobilityAssumed ? ' (assumed from ambulance arrival, not confirmed)' : ''}` : 'not recorded'}`);
        if (C.has(p.weight)) lines.push(`Weight: ${p.weight} kg (measured)`);
        if (p.pregnant) {
            const g = d.gestation;
            lines.push(`Pregnant / <6 weeks postpartum: yes${g && g.valid ? ` - ${g.weeks}+${g.days} weeks by LMP ${ddmmyyyy(p.lmp)} (EDD ${ddmmyyyy(g.edd)})` : (p.lmp ? ` - LMP ${p.lmp}` : '')}`);
        }
        const lvl = d.level;
        if (!lvl) lines.push({ text: 'TRIAGE CATEGORY: NOT YET TRIAGED', strong: true });
        else lines.push({ strong: true, text: `TRIAGE CATEGORY: ${lvl.toUpperCase()}${d.priority.provisional ? ' (PROVISIONAL - no discriminator selected)' : ''}${lvl === 'Red' ? ' - see immediately' : ` - see by ${hhmm(d.seeBy)} (${this.data.targetMinutes[lvl]} min target)`}` });
        lines.push(`Stream: ${d.stream}`);
        if (d.priority.reasons.length) lines.push(`Reasons: ${d.priority.reasons.join('; ')}`);
        lines.push(`Next obs due: ${d.nextObs}`);
        section('PRESENTING COMPLAINT');
        lines.push(`PC: ${s.complaint.name || (s.complaint.raw ? `${s.complaint.raw} (no flowchart selected)` : 'Not recorded')}`);
        if (p.arrivalMode !== 'Ambulance' && ph.hpc) lines.push(`HPC: ${ph.hpc}`);
        if (p.arrivalMode !== 'Ambulance' && ph.social) lines.push(`Social: ${ph.social}`);
        const disc = d.disc ? `${d.disc.text} (${d.disc.priority})` : (s.complaint.noneApply ? 'None of the discriminators apply (Blue)' : 'Not selected');
        lines.push(`Discriminator: ${disc}`);
        if (d.frailty) lines.push(`Clinical Frailty Scale: ${d.frailty.score} - ${d.frailty.title} (baseline, about 2 weeks before this illness)`);
        else if (p.age !== null && p.age >= 65) lines.push('Clinical Frailty Scale: NOT RECORDED');
        lines.push(`Pain: ${C.has(s.complaint.pain) ? `${s.complaint.pain}/10 - ${d.pain.band.toLowerCase()}${s.complaint.painMethod === 'FLACC' ? ' (FLACC)' : ''}` : 'Not assessed'}`);
        section('OBSERVATIONS AND ASSESSMENT');
        const gcs = d.gcsTotal !== null ? `${d.gcsTotal} (E${o.gcsE} V${o.gcsV} M${o.gcsM})` : '-';
        lines.push(`Obs: RR ${f(o.rr)} | SpO2 ${f(o.sats, '%')} ${o.o2 ? (o.o2 === 'O2' ? 'on O2' : 'air') : '(air/O2 not recorded)'}${o.scale2 ? ' [scale 2]' : ''} | BP ${f(o.sbp)}/${f(o.dbp)} | HR ${f(o.hr)} | ACVPU ${o.avpu || '-'} | Temp ${f(o.temp)} | CRT ${f(o.crt, 's')} | GCS ${gcs} | BM ${f(o.bm)}${C.has(o.ketones) ? ` | Ketones ${o.ketones}` : ''} | Pupils ${o.pupils || '-'}`);
        const e = d.ews;
        const ewsName = e.type === 'NEWS2' ? 'NEWS2' : (e.type === 'PEWS' ? `Local PEWS (${e.group})` : 'Local MEOWS');
        if (e.recorded === 0) lines.push(`${ewsName}: NOT CALCULATED - no obs recorded`);
        else if (!e.complete && e.type === 'NEWS2') lines.push(`NEWS2: PROVISIONAL - at least ${e.score} from ${e.recorded} of ${e.recorded + e.missing.length} obs (${d.newsSum.riskText}). Not yet recorded, not scored: ${e.missing.join(', ')}. Full NEWS2 needs all 7 obs.`);
        else if (!e.complete) lines.push(`${ewsName}: INCOMPLETE - partial score ${e.score}; missing ${e.missing.join(', ')}`);
        else lines.push(`${ewsName}: ${e.score}${d.newsResp ? ` - ${d.newsResp.risk} clinical risk; obs ${d.newsResp.monitorText}` : ''}${e.params.filter(x => x.points).length ? ` [${e.params.filter(x => x.points).map(x => `${x.label} ${x.value} +${x.points}`).join(', ')}]` : ''}`);
        const sp = d.sepsis;
        if (sp.applicable) {
            if (sp.status === 'assessed') {
                lines.push(`Sepsis (NICE ${sp.guideline || 'NG253'}): infection suspected - ${sepsisRiskText(sp)}${sp.provisional ? ' (provisional, obs incomplete)' : ''}. ${sp.actions}${sp.judgement ? ` ${sp.judgement}` : ''}`);
                if (sp.guideline === 'NG254') {
                    if (sp.high.length) lines.push(`NG254 high risk criteria: ${sp.high.join('; ')}`);
                    if (sp.moderate.length) lines.push(`NG254 moderate to high risk criteria: ${sp.moderate.join('; ')}`);
                }
                const f2 = this.data.sepsisConsiderations.filter(c => s.assess.sepsisFactors[c.id]).map(c => c.label);
                if (f2.length) lines.push(`Sepsis considerations: ${f2.join('; ')}`);
            } else lines.push(`Sepsis (NICE ${sp.guideline || 'NG253'}): ${sp.status === 'not-suspected' ? 'infection not suspected' : 'infection question not answered'}`);
        }
        if (d.feverRelevant) {
            const tl = d.feverTL;
            lines.push(`Fever in under 5s (NICE NG143): ${tl.level ? tl.level.toUpperCase() : 'incomplete'}${tl.red.length ? `; red: ${tl.red.join('; ')}` : ''}${tl.amber.length ? `; amber: ${tl.amber.join('; ')}` : ''}`);
        }
        if (d.ng232) lines.push(`Head injury (NICE NG232): ${ng232Nurse(d.ng232)}${d.ng232.because.length ? ` - ${d.ng232.because.join('; ')}` : ''}`);
        if (d.tools.stroke) lines.push(`Stroke: last known well ${s.assess.stroke.lkw ? new Date(s.assess.stroke.lkw).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : 'not recorded'}; ${d.rosier.text}`);
        if (d.tools.ecg) lines.push(`ECG: ${s.assess.ecgDoneAt ? `done ${hhmm(s.assess.ecgDoneAt)}` : 'not yet done'}`);
        if (d.fourAT && d.fourAT.complete) lines.push(d.fourAT.text);
        if (d.tools.nof) { const n = Object.entries(s.assess.nof).filter(([, v]) => v).map(([k]) => k); lines.push(`#NOF checks done: ${n.length ? n.join(', ') : 'none recorded'}`); }
        if (d.tools.mh) {
            const m = s.assess.mh;
            lines.push(`Mental health: MHA ${m.mha || 'not recorded'}; leaving risk ${m.abscond || 'not recorded'}; observation ${m.observation || 'not recorded'}; capacity concern ${m.capacity || 'not recorded'}${m.liaison ? '; liaison referred' : ''}${m.saferoom ? '; safer room checked' : ''}`);
        }
        if (d.risks.length) { section('ALERTS'); d.risks.forEach(r => lines.push({ bullet: r })); }
        section('HISTORY');
        lines.push(`Allergies: ${h.allergies.trim() || 'NOT RECORDED'}${h.allergyReaction ? ` (reaction: ${h.allergyReaction})` : ''}`);
        lines.push(`PMH: ${h.pmh || 'Not recorded'}`);
        lines.push(`Medicines: ${h.meds || 'Not recorded'}`);
        if (!Object.values(h.manualRiskFlags).some(Boolean)) {
            const auto = (this.autoRisks || []).length;
            lines.push(`High-risk medicine groups: ${auto ? `found in the medicines list (see ALERTS); other groups ${h.riskNone ? 'none (checked)' : 'NOT CHECKED'}` : (h.riskNone ? 'none of these (checked)' : 'NOT CHECKED')}`);
        }
        if (p.arrivalMode !== 'Ambulance' && h.treatmentNotes) lines.push(`Treatment before triage: ${h.treatmentNotes}`);
        if (d.isPaeds) {
            const pa = s.assess.paeds, sg = Object.entries(pa.safeguarding).filter(([, v]) => v).map(([k]) => ({ cpis: 'CP-IS checked', pr: 'parental responsibility identified', nonmobile: 'injury in non-mobile child', story: 'inconsistent explanation', notbrought: 'previous attendance / not brought concern' }[k]));
            lines.push(`Child: accompanied by ${pa.accompaniedBy || 'not recorded'}; analgesia in last 4-6h: ${pa.recentDose || 'not asked'}${sg.length ? `; safeguarding: ${sg.join(', ')}` : ''}${(pa.safeguarding.nonmobile || pa.safeguarding.story || pa.safeguarding.notbrought) ? '' : `; safeguarding concerns: ${pa.safeguardingNone ? 'none (checked)' : 'NOT CHECKED'}`}`);
        }
        section('SCREENING');
        const scr = Object.entries(this.data.screening).filter(([k]) => s.screening[k]).map(([k, def]) => `${def.label}: ${def.options ? (def.options.find(o2 => o2.val === s.screening[k]) || {}).text : s.screening[k]}`);
        if (scr.length) lines.push(`Screening: ${scr.join('; ')}`);
        if (!d.ipcFlag) lines.push(`Infection control: ${s.assess.ipcNone ? 'no IPC flags (screened)' : 'NOT SCREENED'}`);
        if (d.ipcFlag) lines.push(`Infection control: ${Object.entries(s.assess.ipc).filter(([, v]) => v).map(([k]) => ({ dv: 'D&V', resp: 'respiratory symptoms', rash: 'rash with fever', travel: 'recent travel', mdro: 'resistant organism' }[k])).join(', ')} - side room / isolation per local policy`);
        section('PLAN');
        const cn = d.plan.cannula;
        if (s.complaint.name || cn.decision !== 'not-needed') lines.push(`Cannula decision support: ${cn.label}${cn.size ? ` (${cn.size})` : ''}${cn.reasons.length ? ` - ${cn.reasons.filter(r => r.level === cn.decision || cn.decision === 'consider').map(r => r.text).join('; ')}` : ''}`);
        if (s.plan.length) {
            const g = {};
            s.plan.forEach(i => { (g[i.category] = g[i.category] || []).push(`${i.name} (${i.status})`); });
            ['Universal', 'Cannula', 'Bedside', 'Bloods'].filter(c => g[c]).forEach(cat => lines.push(`${cat}: ${g[cat].join(', ')}`));
        }
        if (h.planNarrative) lines.push(`Narrative: ${h.planNarrative}`);
        if (s.triage.disposition) lines.push(`Placement: ${s.triage.disposition === 'Other' ? (s.triage.dispositionOther || 'Other') : this.placementLabel(s.triage.disposition)}`);
        if (s.triage.disposition === 'Escalation' || s.triage.disposition === 'Held on Ambulance') {
            const done = Object.entries(s.assess.corridor).filter(([, v]) => v).map(([k]) => k);
            lines.push(`Corridor care: ${done.length ? done.join(', ') : 'no checks recorded'}${s.assess.corridorCheckedAt ? ` - last check ${hhmm(s.assess.corridorCheckedAt)}` : ''}`);
        }
        // The triage decision leads the note for every patient; the crew handover follows it.
        const ti = sections.findIndex(x => x.title === 'TRIAGE NOTE');
        if (ti > 0) sections.unshift(sections.splice(ti, 1)[0]);
        return sections.filter(x => x.lines.length);
    }

    composeNote() {
        const out = [];
        this.noteSections().forEach((sec, i) => {
            if (i) out.push('');
            out.push(sec.title);
            sec.lines.forEach(l => out.push(typeof l === 'string' ? l : (l.bullet !== undefined ? `- ${l.bullet}` : l.text)));
        });
        return plain(out.join('\n'));
    }

    // Formatted version: bold section headings and bold labels, nothing else (no colours, tables or
    // fonts), so it takes on the EPR's own style. Characters are kept plain as in the text version.
    composeNoteHtml() {
        const label = /^([#A-Za-z][A-Za-z0-9 #/()'&.,-]{0,48}):\s([\s\S]*)$/;
        const line = (l) => {
            if (typeof l !== 'string') {
                if (l.bullet !== undefined) return `&bull; ${esc(plain(l.bullet))}`;
                return `<strong>${esc(plain(l.text))}</strong>`;
            }
            const m = plain(l).match(label);
            return m ? `<strong>${esc(m[1])}:</strong> ${esc(m[2])}` : esc(plain(l));
        };
        const body = this.noteSections().map(sec => `<p><strong><u>${esc(plain(sec.title))}</u></strong><br>${sec.lines.map(line).join('<br>')}</p>`).join('');
        return `<div>${body}</div>`;
    }

    renderNote() {
        this.$('epr-note').value = this.composeNote();
        const prev = this.$('epr-note-formatted');
        if (prev) prev.innerHTML = this.composeNoteHtml();
        const plainOnly = this.plainCopy;
        if (prev) prev.classList.toggle('hidden', plainOnly);
        this.$('epr-note').classList.toggle('hidden', !plainOnly);
    }

    sbarText() {
        const x = this.sbarParts();
        return `S: ${x.S}\nB: ${x.B}\nA: ${x.A}\nR: ${x.R}`;
    }

    sbarHtml() {
        const x = this.sbarParts();
        return `<div><p><strong><u>SBAR HANDOVER</u></strong><br>${['S', 'B', 'A', 'R'].map(k => `<strong>${k}:</strong> ${esc(x[k])}`).join('<br>')}</p></div>`;
    }

    sbarParts() {
        const s = this.state, d = this.derived, p = s.patient, h = s.history;
        const age = C.has(p.ageValue) ? (p.ageUnit === 'Months' ? `${p.ageValue}-month-old` : `${p.ageValue}-year-old`) : 'age not recorded,';
        const S = `I have a ${age} ${p.sex ? p.sex.toLowerCase() : 'patient (sex not recorded)'} who arrived ${p.arrivalMode === 'Ambulance' ? 'by ambulance' : 'self-presented'} at ${hhmm(s.meta.arrivalAt)} with ${s.complaint.name || s.complaint.raw || 'an unrecorded complaint'}. Triage category: ${d.level ? d.level + (d.priority.provisional ? ' (provisional)' : '') : 'not yet triaged'}.`;
        const B = `PMH: ${h.pmh || 'not recorded'}. Allergies: ${h.allergies.trim() || 'NOT RECORDED'}${h.allergyReaction ? ` (${h.allergyReaction})` : ''}.${d.risks.length ? ` Alerts: ${d.risks.join('; ')}.` : ''}${d.frailty ? ` Baseline frailty: ${d.frailty.label}.` : ''}`;
        const e = d.ews;
        let A = e.recorded === 0 ? 'Obs not yet taken.' : (e.type === 'NEWS2' && !e.complete ? `Provisional NEWS2 at least ${e.score} (${e.missing.join(', ')} not yet recorded).` : `${e.type === 'NEWS2' ? 'NEWS2' : `Local ${e.type}`} ${e.complete ? e.score : `incomplete (partial ${e.score}, missing ${e.missing.join(', ')})`}.`);
        if (d.sepsis.status === 'assessed') A += ` Suspected infection - ${d.sepsis.guideline || 'NG253'} ${sepsisRiskText(d.sepsis)}.`;
        if (C.has(s.complaint.pain)) A += ` Pain ${s.complaint.pain}/10.`;
        if (d.ng232) A += ` Head injury: ${ng232Nurse(d.ng232)}.`;
        if (d.feverRelevant && d.feverTL.level) A += ` NICE fever traffic light ${d.feverTL.level}.`;
        let R = `Stream: ${d.stream}. Next obs due: ${d.nextObs}.`;
        if (s.plan.length) R += ` Plan: ${s.plan.map(x => `${x.name} (${x.status})`).join(', ')}.`;
        if (d.tools.ecg && !s.assess.ecgDoneAt) R += ' ECG not yet done - outstanding.';
        if (d.level === 'Red') R += ' Requires immediate review.';
        const one = (t) => plain(t).replace(/\s*\n+\s*/g, '; ');
        return { S: one(S), B: one(B), A: one(A), R: one(R) };
    }

    openSbar() {
        const x = this.sbarParts();
        this.$('sbar-s').textContent = x.S; this.$('sbar-b').textContent = x.B; this.$('sbar-a').textContent = x.A; this.$('sbar-r').textContent = x.R;
        this.openModal('modal-sbar');
    }

    // Copies plain text and, unless "plain text only" is set, a formatted (HTML) copy as well.
    // The EPR decides which it uses: a rich text note box keeps the bold headings, a plain box
    // gets the plain text, laid out with headings and blank lines.
    async copyText(text, msg, html = null) {
        const rich = html && !this.plainCopy;
        if (rich && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
            try {
                await navigator.clipboard.write([new ClipboardItem({
                    'text/plain': new Blob([text], { type: 'text/plain' }),
                    'text/html': new Blob([html], { type: 'text/html' })
                })]);
                this.toast(msg); return true;
            } catch { /* fall through to the older routes */ }
        }
        if (!rich && navigator.clipboard && navigator.clipboard.writeText) {
            try { await navigator.clipboard.writeText(text); this.toast(msg); return true; } catch { /* fall through */ }
        }
        // Older browsers and locked-down profiles: a copy event can still carry both formats.
        let ok = false;
        const onCopy = (ev) => {
            ev.clipboardData.setData('text/plain', text);
            if (rich) ev.clipboardData.setData('text/html', html);
            ev.preventDefault();
        };
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.addEventListener('copy', onCopy);
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        document.removeEventListener('copy', onCopy);
        ta.remove();
        this.toast(ok ? msg : 'Copy failed - open "Preview EPR note", select it and copy by hand', ok ? 'info' : 'error');
        return ok;
    }

    async copyNote() {
        this.state.meta.noteCopiedAt = new Date().toISOString();
        this.renderNote();
        const ok = await this.copyText(this.composeNote(), this.plainCopy ? 'EPR note copied (plain text)' : 'EPR note copied', this.composeNoteHtml());
        if (ok && this.derived.missing.length) this.toast(`Copied - still to record: ${this.derived.missing.length} item${this.derived.missing.length > 1 ? 's' : ''} (see panel)`, 'error');
        this.debouncedSave();
    }

    // ------------------------------------------------------------------ modals, toasts
    openModal(id) {
        const m = this.$(id);
        m.classList.remove('hidden');
        m.setAttribute('aria-hidden', 'false');
        this.lastFocus = document.activeElement;
        const f = m.querySelector('button, input, select');
        if (f) f.focus({ preventScroll: true });
        // Start long boxes (What's new) at the top even though focus is on a button lower down.
        m.querySelectorAll('.modal-box').forEach(b => { b.scrollTop = 0; });
    }

    closeModal(id) {
        const m = this.$(id);
        if (!m || m.classList.contains('hidden')) return;
        m.classList.add('hidden');
        m.setAttribute('aria-hidden', 'true');
        if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus();
    }

    showConfirm(message, title = 'Please confirm') {
        return new Promise((resolve) => {
            this.$('modal-confirm-title').textContent = title;
            this.$('modal-confirm-message').textContent = message;
            this.openModal('modal-confirm');
            const ok = this.$('modal-confirm-ok'), cancel = this.$('modal-confirm-cancel');
            const done = (r) => { this.closeModal('modal-confirm'); ok.onclick = null; cancel.onclick = null; resolve(r); };
            ok.onclick = () => done(true);
            cancel.onclick = () => done(false);
        });
    }

    toast(msg, type = 'info', action) {
        const el = document.createElement('div');
        el.className = `toast${type === 'error' ? ' toast-error' : ''}`;
        el.textContent = msg;
        if (action) {
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'btn-tiny'; b.textContent = action.label;
            b.onclick = () => { action.fn(); el.remove(); };
            el.appendChild(b);
        }
        this.$('toast-container').appendChild(el);
        setTimeout(() => el.remove(), action ? 10000 : 4000);
    }

    // ------------------------------------------------------------------ new patient / undo
    newPatient() {
        const snapshot = JSON.stringify(this.state);
        this.saveSession();
        this.state = freshState();
        this.restoreUI();
        this.$('input-complaint').focus();
        this.toast('New patient started', 'info', { label: 'Undo', fn: () => { this.state = JSON.parse(snapshot); this.restoreUI(); this.toast('Previous patient restored'); } });
    }

    // ------------------------------------------------------------------ recent patients (local only)
    purgeHistory() {
        try {
            // Pre-v20 history could contain names/DOB and used a different format: remove it.
            if (localStorage.getItem('triage_history') !== null) { localStorage.removeItem('triage_history'); }
            if (this.shared) { localStorage.removeItem(HISTORY_KEY); return; }
            const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            const fresh = list.filter(x => Date.now() - x.savedAt < HISTORY_TTL_MS);
            if (fresh.length !== list.length) localStorage.setItem(HISTORY_KEY, JSON.stringify(fresh));
        } catch { /* storage unavailable */ }
    }

    debouncedSave() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.saveSession(), 800);
    }

    saveSession() {
        const s = this.state, p = s.patient;
        if (this.shared || (!s.complaint.name && p.age === null)) return;
        try {
            const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]').filter(x => Date.now() - x.savedAt < HISTORY_TTL_MS && x.sessionId !== s.meta.sessionId);
            const age = !C.has(p.ageValue) ? '' : (p.ageUnit === 'Months' ? `${p.ageValue}m` : `${p.ageValue}y`);
            list.unshift({
                sessionId: s.meta.sessionId,
                label: [p.localRef, age, p.sex].filter(Boolean).join(' · ') || 'Patient',
                complaint: s.complaint.name,
                priority: this.derived.level || 'Untriaged',
                savedAt: Date.now(),
                data: s
            });
            localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 20)));
        } catch { /* storage full or unavailable */ }
    }

    openHistory() {
        if (this.shared) return;
        this.purgeHistory();
        const list = (() => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } })();
        const box = this.$('history-list');
        box.innerHTML = list.length ? '' : '<p class="hint">No recent patients on this computer.</p>';
        list.forEach(x => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'history-item';
            b.style.borderLeft = `5px solid var(--${x.priority === 'Untriaged' ? 'grey' : x.priority.toLowerCase()})`;
            const t = document.createElement('div'); t.className = 'history-item-title'; t.textContent = x.label;
            const c = document.createElement('div'); c.textContent = x.complaint || 'No complaint';
            const m = document.createElement('div'); m.className = 'history-item-meta';
            const a = document.createElement('span'); a.textContent = x.priority;
            const tm = document.createElement('span'); tm.textContent = new Date(x.savedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            m.append(a, tm); b.append(t, c, m);
            b.addEventListener('click', async () => {
                if (!(await this.showConfirm('Load this patient? The current screen will be replaced (you can undo).', 'Load patient'))) return;
                const snapshot = JSON.stringify(this.state);
                this.state = Object.assign(freshState(), x.data);
                this.restoreUI();
                this.$('history-sidebar').classList.remove('open');
                this.toast('Patient loaded', 'info', { label: 'Undo', fn: () => { this.state = JSON.parse(snapshot); this.restoreUI(); } });
            });
            box.appendChild(b);
        });
        this.$('history-sidebar').classList.add('open');
    }

    // ------------------------------------------------------------------ push state into the static inputs
    restoreUI() {
        const s = this.state, p = s.patient, o = s.obs, h = s.history, ph = s.prehospital;
        const val = (id, v) => { const el = this.$(id); if (el) el.value = C.has(v) ? v : ''; };
        const chk = (id, v) => { const el = this.$(id); if (el) el.checked = !!v; };
        this.invalid = {};
        val('patient-age', p.ageValue); val('patient-weight', p.weight); this.validateObsField('patient-age', p.ageValue); this.validateObsField('patient-weight', p.weight);
        chk('check-pregnant', p.pregnant); val('date-lmp', p.lmp); val('patient-ref', p.localRef); val('amb-callsign', p.ambulanceCallSign); val('amb-caseid', p.ambulanceCaseId);
        val('ph-hpc', ph.hpc); val('ph-tx', ph.tx); val('ph-tx-time', ph.txTime); val('ph-social', ph.social);
        ['rr', 'sats', 'sbp', 'dbp', 'hr', 'gcs', 'bm', 'ecg', 'pupils'].forEach(k => val(`ph-obs-${k}`, ph.obs[k]));
        ['rr', 'sats', 'sbp', 'dbp', 'hr', 'temp', 'crt', 'bm', 'ketones'].forEach(k => { val(`obs-${k}`, o[k]); this.validateObsField(`obs-${k}`, o[k]); });
        val('obs-pupils', o.pupils); chk('obs-scale2', o.scale2);
        val('obs-gcs-e', o.gcsE); val('obs-gcs-v', o.gcsV); val('obs-gcs-m', o.gcsM);
        val('input-complaint', s.complaint.name || s.complaint.raw);
        val('allergies', h.allergies); val('allergy-reaction', h.allergyReaction); val('pmh', h.pmh); val('meds', h.meds); val('treatment-notes', h.treatmentNotes); val('plan-narrative', h.planNarrative);
        val('sel-disposition', s.triage.disposition); val('txt-disposition-other', s.triage.dispositionOther);
        this.$('txt-disposition-other').classList.toggle('hidden', s.triage.disposition !== 'Other');
        const ov = s.triage.override;
        this.$('override-options').classList.toggle('hidden', !ov);
        this.$('btn-override-toggle').classList.toggle('active', !!ov);
        if (ov) { val('sel-override', ov.level); val('txt-override', ov.reason); } else { val('sel-override', ''); val('txt-override', ''); }
        this.$('override-msg').textContent = ov ? `Override applied: ${ov.level}.` : '';
        this.$('flacc-panel').classList.add('hidden');
        this.setSectionCollapsed('obs-section-toggle', 'obs-collapsible-body', false);
        this.built = {};
        this.compute();
        this.render();
        this.saveCurrent();
    }

    // ------------------------------------------------------------------ dictation (opt-in)
    initSpeech() {
        this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        document.querySelectorAll('.mic-btn').forEach(btn => {
            btn.innerHTML = MIC_ICON;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!this.SpeechRecognition) return;
                const target = this.$(btn.dataset.target);
                const rec = new this.SpeechRecognition();
                rec.lang = 'en-GB';
                rec.continuous = false;
                btn.classList.add('listening');
                rec.onresult = (ev) => {
                    const text = ev.results[0][0].transcript;
                    target.value = target.tagName === 'TEXTAREA' && target.value ? `${target.value}. ${text}` : text;
                    target.dispatchEvent(new Event('input', { bubbles: true }));
                };
                rec.onerror = () => { btn.classList.remove('listening'); this.toast('Dictation failed - check the microphone', 'error'); };
                rec.onend = () => btn.classList.remove('listening');
                rec.start();
            });
        });
        this.applyDictation();
    }

    applyDictation() {
        document.body.classList.toggle('dictation-on', this.dictation && !!this.SpeechRecognition);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new TriageApp(); });
