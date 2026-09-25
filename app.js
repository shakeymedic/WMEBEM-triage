import { clinicalData } from './protocols.js';
import * as C from './clinical.js';

const VERSION = '20.1';
const AUTO_DISCRIMINATOR_TEXT = 'Abnormal vital signs';
const HISTORY_KEY = 'triage_history_v20';
const HISTORY_TTL_MS = 12 * 60 * 60 * 1000;
const CHILD_CHART = /Child|Baby|Neonate|Worried Parent/;
const ADULT_CHART = /Adult/;
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
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// EPR fields are often not Unicode-safe: keep the note to plain characters.
const plain = (s) => String(s ?? '').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/₂/g, '2').replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/·/g, '-').replace(/­/g, '');
const newSessionId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function freshState() {
    return {
        meta: { sessionId: newSessionId(), arrivalAt: new Date().toISOString(), startedAt: null, categorySetAt: null, lastCategory: null, obsAt: null, noteCopiedAt: null },
        patient: { ageValue: null, ageUnit: 'Years', age: null, weight: null, sex: '', pregnant: false, lmp: '', mobility: '', arrivalMode: 'Self', ambulanceCallSign: '', ambulanceCaseId: '', localRef: '' },
        prehospital: { obs: { rr: null, sats: null, o2: null, sbp: null, dbp: null, hr: null, gcs: null, bm: null, ecg: '', pupils: '' }, hpc: '', tx: '', txTime: '', social: '' },
        obs: { rr: null, sats: null, o2: null, scale2: false, sbp: null, dbp: null, hr: null, temp: null, crt: null, avpu: null, gcsE: null, gcsV: null, gcsM: null, bm: null, pupils: '' },
        complaint: { name: '', raw: '', discriminator: null, noneApply: false, pain: null, painMethod: 'NRS', flacc: {} },
        history: { allergies: '', allergyReaction: '', pmh: '', meds: '', manualRiskFlags: {}, treatmentNotes: '', planNarrative: '' },
        assess: {
            infection: null, sepsisFactors: {},
            headache: { trauma: null, sudden: null },
            headInjuryInvolved: false, ng232: {}, ng232Anticoag: null,
            stroke: { lkw: '', rosier: {} }, ecgDoneAt: null,
            fourAT: {}, nof: {}, mh: {},
            ng143: { feverReported: false, ticks: {} },
            paeds: { recentDose: null, accompaniedBy: '', safeguarding: {} },
            ipc: {}, corridor: {}, corridorCheckedAt: null
        },
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
        this.restoreUI();

        if (store.get('seenVersion') !== VERSION) {
            store.set('seenVersion', VERSION);
            this.openModal('modal-whatsnew');
        }
        this.clock = setInterval(() => { this.renderDecision(); this.renderTimers(); }, 30000);
    }

    // ------------------------------------------------------------------ preferences & settings
    initPreferences() {
        if (store.get('theme') === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        if (store.get('quickMode') === 'on') { document.body.classList.add('quick-mode'); this.$('btn-quick-mode').classList.add('active'); }
        this.shared = store.get('sharedComputer') === 'on';
        this.dictation = store.get('dictation') === 'on';
        this.$('nurse-initials').value = store.get('initials', '', true) || '';
        this.$('set-shared').checked = this.shared;
        this.$('set-dictation').checked = this.dictation;
        this.$('set-dark').checked = store.get('theme') === 'dark';
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
        this.debouncedSave();
    }

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
        const sepsis = C.sepsisNG253({ age: p.age, pregnant: p.pregnant, infection: s.assess.infection, news: ews.type === 'NEWS2' ? ews : { score: 0, complete: false, redParam: false } });

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
            if (ews.score >= 7) floors.push({ level: 'Red', reason: `${partial}NEWS2 ${ews.score} (7 or more)` });
            else if (ews.score >= 5) floors.push({ level: 'Orange', reason: `${partial}NEWS2 ${ews.score} (5-6)` });
            else if (ews.score >= 3) floors.push({ level: 'Yellow', reason: `${partial}NEWS2 ${ews.score}` });
        } else if (ews.type === 'PEWS') {
            if (ews.score >= 7) floors.push({ level: 'Red', reason: `${partial}local PEWS ${ews.score} (high)` });
            else if (ews.score >= 5) floors.push({ level: 'Orange', reason: `${partial}local PEWS ${ews.score}` });
        } else if (ews.score >= 3) {
            floors.push({ level: 'Orange', reason: `${partial}local MEOWS ${ews.score}` });
        }
        if (pain && pain.floor) floors.push({ level: pain.floor, reason: `${pain.band} pain ${s.complaint.pain}/10 (MTS pain ruler)` });
        if (s.assess.sepsisFactors.sepsis_rash || (feverRelevant && s.assess.ng143.ticks.non_blanching)) floors.push({ level: 'Orange', reason: 'Non-blanching rash' });

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
        let obsMins = newsResp ? newsResp.monitorMins : null;
        if (sepsis.status === 'assessed' && obsMins !== null) obsMins = Math.min(obsMins, sepsis.reassessMins);
        const obsBase = s.meta.obsAt ? new Date(s.meta.obsAt) : null;
        let nextObs = '-', nextObsAt = null;
        if (ews.type !== 'NEWS2') nextObs = 'Per local chart';
        else if (ews.recorded === 0) nextObs = 'Obs not taken';
        else if (obsMins === 0) nextObs = 'Continuous';
        else if (obsBase && obsMins) { nextObsAt = new Date(obsBase.getTime() + obsMins * 60000); nextObs = hhmm(nextObsAt); }

        const tools = this.activeTools(flowchart, disc, p.age);
        const ng232 = tools.ng232 ? C.ng232({ age: p.age, answers: s.assess.ng232, anticoagulated: s.assess.ng232Anticoag === null ? anticoagDetected : s.assess.ng232Anticoag }) : null;
        const rosier = tools.stroke ? C.rosier(s.assess.stroke.rosier) : null;
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
        if (!s.complaint.name) missing.push('Presenting complaint (choose a flowchart)');
        else if (!priority.triaged) missing.push('Discriminator - choose one, or "None of these apply"');
        if (ews.missing.length) missing.push(`Obs: ${ews.missing.join(', ')}`);
        if (!C.has(s.complaint.pain)) missing.push('Pain score');
        if (!s.history.allergies.trim()) missing.push('Allergies');
        if (!p.mobility) missing.push('Mobility');
        if (isPaeds && !C.has(p.weight)) missing.push('Weight (child)');
        if (sepsis.status === 'not-asked' && (ews.score >= 3 || (C.has(o.temp) && (o.temp >= 38 || o.temp < 36)))) missing.push('Could this be an infection? (sepsis)');
        if (tools.ecg && !s.assess.ecgDoneAt) missing.push('ECG (within 10 minutes of arrival)');

        this.derived = { isPaeds, risks, anticoagDetected, ews, newsResp, sepsis, pain, feverTL, feverRelevant, flowchart, disc, autoDisc, floors, priority, level, seeBy, stream, nextObs, nextObsAt, tools, ng232, rosier, fourAT, analgesia, gestation, gcsTotal, ipcFlag, missing };
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
        return `<span class="info-pop"><button type="button" class="info-btn" aria-label="Reference">ℹ️</button><span class="info-bubble">${esc(text)}</span></span>`;
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
                if (extra) extra(val);
                this.set(path, val);
            });
        };

        // Patient
        bindInput('patient-age', 'patient.ageValue', num);
        bindInput('patient-weight', 'patient.weight', num);
        bindInput('patient-sex', 'patient.sex');
        bindInput('patient-mobility', 'patient.mobility');
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
        ['rr', 'sats', 'sbp', 'dbp', 'hr', 'temp', 'crt', 'bm'].forEach(k => bindInput(`obs-${k}`, `obs.${k}`, num, (v) => this.validateObsField(`obs-${k}`, v)));
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
        this.$('btn-flacc').addEventListener('click', () => {
            const panel = this.$('flacc-panel');
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden')) this.buildFlacc();
        });

        // Enter moves to the next observation.
        this.$('obs-form').addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' || e.target.tagName === 'BUTTON') return;
            const stops = [];
            this.$('obs-form').querySelectorAll('.obs-item').forEach(item => {
                item.querySelectorAll('input.obs-input, select.obs-input').forEach(x => stops.push(x));
                const seg = item.querySelector('.segmented-control');
                if (seg) stops.push(seg.querySelector('button.active') || seg.querySelector('button'));
            });
            const i = stops.indexOf(e.target);
            if (i >= 0 && stops[i + 1]) { e.preventDefault(); stops[i + 1].focus(); }
        });

        // Dynamic tool panels delegate their inputs to data-path attributes.
        document.addEventListener('change', (e) => {
            const el = e.target.closest('[data-path]');
            if (!el || el.tagName === 'DIV') return;
            let val = el.type === 'checkbox' ? el.checked : el.value;
            if (el.dataset.num !== undefined) val = C.toNumber(val);
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
            const reason = this.$('txt-override').value.trim();
            this.set('triage.override', reason ? { level: this.$('sel-override').value, reason } : null);
        };
        this.$('sel-override').addEventListener('change', updOverride);
        this.$('txt-override').addEventListener('input', updOverride);

        // Header
        this.$('nurse-initials').addEventListener('input', (e) => { store.set('initials', e.target.value.trim().toUpperCase(), true); this.update(); });
        this.$('btn-quick-mode').addEventListener('click', () => {
            const on = !document.body.classList.contains('quick-mode');
            document.body.classList.toggle('quick-mode', on);
            this.$('btn-quick-mode').classList.toggle('active', on);
            store.set('quickMode', on ? 'on' : 'off');
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
        this.$('btn-copy-sbar').addEventListener('click', () => this.copyText(this.sbarText(), 'SBAR copied'));
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
                if (amb && !this.state.patient.mobility) { this.state.patient.mobility = 'Trolley'; this.$('patient-mobility').value = 'Trolley'; }
                this.set('patient.arrivalMode', value);
                this.setSectionCollapsed('obs-section-toggle', 'obs-collapsible-body', false);
                break;
            }
            case 'seg-age-unit': this.set('patient.ageUnit', value); break;
            case 'seg-o2': this.set('obs.o2', this.state.obs.o2 === value ? null : value); break;
            case 'seg-avpu': this.set('obs.avpu', this.state.obs.avpu === value ? null : value); break;
            case 'seg-ph-o2': this.set('prehospital.obs.o2', value); break;
            default: return;
        }
        if (btn) btn.focus();
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
            target.focus();
        }
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
        this.$('card-handover').classList.toggle('hidden', !amb);
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
        const key = JSON.stringify([c.name, c.discriminator, c.noneApply, autoOn]);
        if (this.built.discKey === key) return;
        const hadFocus = box.contains(document.activeElement);
        this.built.discKey = key;
        const order = { Red: 1, Orange: 2, Yellow: 3, Green: 4, Blue: 5 };
        const sorted = [...d.flowchart].sort((a, b) => order[a.priority] - order[b.priority]);
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
            const bm = this.$('rosier-bm');
            if (bm) bm.textContent = C.has(s.obs.bm) ? `BM ${s.obs.bm} mmol/L${s.obs.bm < 3.5 ? ' - LOW: treat hypoglycaemia and reassess' : ''}` : 'Check BM first - hypoglycaemia can mimic stroke.';
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
            text = `${label}: INCOMPLETE ${e.recorded}/${e.recorded + e.missing.length} - partial score ${e.score}`;
            if (e.score >= 7) cls = 'ews-crit'; else if (e.score >= 5) cls = 'ews-high'; else if (e.score >= 3 || e.redParam) cls = 'ews-mid';
        } else {
            text = `${label} ${e.score}${d.newsResp ? ` - ${d.newsResp.risk} risk` : ''}`;
            if (e.type === 'NEWS2') cls = e.score >= 7 ? 'ews-crit' : (e.score >= 5 ? 'ews-high' : (e.score >= 1 || e.redParam ? 'ews-mid' : 'ews-low'));
            else cls = e.score >= 5 ? 'ews-crit' : (e.score >= 1 ? 'ews-mid' : 'ews-low');
        }
        const tags = e.params.filter(p => p.points > 0).map(p => `<span class="news-tag">${esc(p.label)} ${esc(p.value)} (+${p.points})</span>`).join('')
            + e.missing.map(m => `<span class="news-tag missing">${esc(m)} missing</span>`).join('');
        this.$('visual-ews-container').innerHTML = `<span class="ews-badge ${cls}">${esc(text)}</span>${this.infoPopoverHTML(ref)}<div class="news-breakdown">${tags}</div>${d.newsResp && e.recorded ? `<span class="hint">RCP response: obs ${esc(d.newsResp.monitorText)}</span>` : ''}`;
    }

    renderSepsis() {
        const d = this.derived, s = this.state, sp = d.sepsis, box = this.$('sepsis-screen-container');
        const key = JSON.stringify([sp.applicable, s.assess.infection, sp.status === 'paeds' || sp.status === 'pregnant' || sp.status === 'no-age']);
        if (this.built.sepsisKey !== key) {
            this.built.sepsisKey = key;
            if (!sp.applicable) {
                box.innerHTML = `<div class="tool-head"><span class="tool-title">Sepsis (NICE NG253)</span></div><p class="tool-note" id="sepsis-text"></p>`;
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
                r.textContent = `${sp.risk} risk${sp.provisional ? ' (provisional - obs incomplete)' : ''}`;
                r.className = `tool-result ${sp.risk === 'High' ? 'res-red' : (sp.risk === 'Moderate' ? 'res-amber' : 'res-grey')}`;
            } else { r.textContent = sp.status === 'not-suspected' ? 'Not applied' : 'Not assessed'; r.className = 'tool-result res-grey'; }
            this.$('sepsis-actions').textContent = sp.status === 'assessed' ? sp.actions : '';
            this.$('sepsis-judgement').textContent = sp.judgement || '';
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
            html += `<div class="tool-panel"><div class="tool-head"><span class="tool-title">Safeguarding children</span></div>
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
            else doses.innerHTML = `<p class="tool-actions"><strong>Paracetamol ${a.paracetamol} mg</strong> (15 mg/kg) · <strong>${a.ibuprofen === null ? 'Ibuprofen: not suitable' : `Ibuprofen ${a.ibuprofen} mg`}</strong>${a.ibuprofen === null ? '' : ' (10 mg/kg)'}${a.ibuprofenNote ? ` - ${esc(a.ibuprofenNote)}` : ''}</p>${s.assess.paeds.recentDose !== 'no' ? '<p class="tool-note"><strong>Check the time and dose already given - do not exceed the maximum daily dose.</strong></p>' : ''}`;
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
        if (n) n.textContent = (sg.nonmobile || sg.story || sg.notbrought) ? 'Safeguarding concern - follow your local child safeguarding procedure and inform the senior clinician.' : '';
    }

    renderIpc() {
        const s = this.state, box = this.$('ipc-panel');
        if (!this.built.ipc) {
            this.built.ipc = true;
            box.innerHTML = `<div class="tool-head"><span class="tool-title">Infection prevention &amp; control</span><span class="tool-result" id="ipc-result"></span></div>` +
                this.checksHTML([['dv', 'Diarrhoea and/or vomiting'], ['resp', 'New cough / respiratory infection symptoms'], ['rash', 'Rash with fever'],
                    ['travel', 'Travelled abroad recently (record where and when)'], ['mdro', 'Known MRSA / CPE / other resistant organism']], 'assess.ipc', s.assess.ipc);
        }
        const r = this.$('ipc-result');
        r.textContent = this.derived.ipcFlag ? 'Side room / isolation - follow local IPC policy' : 'No IPC flags';
        r.className = `tool-result ${this.derived.ipcFlag ? 'res-amber' : 'res-grey'}`;
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
        const p = this.state.patient, c = this.$('universal-checks-container');
        // Anyone who could be pregnant: not male, not already known pregnant, age 12-55 or not yet recorded.
        const show = p.sex !== 'Male' && !p.pregnant && (p.age === null || (p.age >= 12 && p.age <= 55));
        c.classList.toggle('hidden', !show);
        const key = show ? JSON.stringify([p.sex, p.age === null, this.state.plan.filter(i => i.category === 'Universal')]) : 'off';
        if (this.built.univ === key) return;
        this.built.univ = key;
        if (!show) { c.innerHTML = ''; return; }
        c.innerHTML = '<h4>Universal safety check</h4>';
        const why = p.sex === 'Female' && p.age !== null ? 'Female aged 12-55 - exclude pregnancy whatever the complaint' : 'Age or sex not recorded yet - offer if the patient could be pregnant';
        c.appendChild(this.planCheck({ name: 'Pregnancy test (urine hCG)', why }, 'Universal', '', { tag: 'suggested' }));
    }

    renderDecision() {
        const d = this.derived, s = this.state;
        if (!d.priority) return;
        const badge = this.$('priority-display');
        const lvl = d.level;
        badge.className = `priority-badge priority-${lvl || 'None'}${d.priority.provisional ? ' provisional' : ''}`;
        badge.innerHTML = lvl ? `${lvl.toUpperCase()}${d.priority.provisional ? '<small>provisional - choose a discriminator</small>' : ''}` : 'NOT YET TRIAGED';
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
        rows.push(['Obs', e.recorded === 0 ? ['Not taken', 'st-grey'] : (!e.complete ? [`${e.type} incomplete (${e.missing.length} missing), partial ${e.score}`, 'st-amber'] : [`${e.type} ${e.score}${d.newsResp ? ` - ${d.newsResp.risk}` : ''}`, e.score >= 5 ? 'st-red' : ''])]);
        const sp = d.sepsis;
        if (sp.applicable) rows.push(['Sepsis', sp.status === 'assessed' ? [`${sp.risk} risk${sp.provisional ? ' (provisional)' : ''}`, sp.risk === 'High' ? 'st-red' : (sp.risk === 'Moderate' ? 'st-amber' : '')] : [sp.status === 'not-suspected' ? 'Infection not suspected' : 'Infection question not answered', 'st-grey']]);
        rows.push(['Pain', C.has(s.complaint.pain) ? [`${s.complaint.pain}/10 ${d.pain.band.toLowerCase()}`, s.complaint.pain >= 8 ? 'st-red' : ''] : ['Not assessed', 'st-grey']]);
        const al = s.history.allergies.trim();
        rows.push(['Allergies', al ? [al + (s.history.allergyReaction ? ` (${s.history.allergyReaction})` : ''), /nkda|nil/i.test(al) ? '' : 'st-red'] : ['Not recorded', 'st-grey']]);
        if (d.risks.length) rows.push(['Alerts', [`${d.risks.length} high-risk medicine / group alert${d.risks.length > 1 ? 's' : ''}`, 'st-red']]);
        if (d.feverRelevant) rows.push(['Fever <5', [d.feverTL.level ? `NICE traffic light ${d.feverTL.level}` : 'Traffic light incomplete', d.feverTL.level === 'Red' ? 'st-red' : (d.feverTL.level === 'Amber' ? 'st-amber' : '')]]);
        if (d.ng232) rows.push(['Head injury', [ng232Nurse(d.ng232), d.ng232.level === '1h' ? 'st-red' : (d.ng232.level === 'none' ? '' : 'st-amber')]]);
        if (d.tools.ecg) rows.push(['ECG', s.assess.ecgDoneAt ? [`Done ${hhmm(s.assess.ecgDoneAt)}`, ''] : [`Due by ${hhmm(new Date(new Date(s.meta.arrivalAt).getTime() + 600000))}`, 'st-amber']]);
        if (d.rosier) rows.push(['Stroke', [d.rosier.text, d.rosier.likely ? 'st-red' : '']]);
        if (d.ipcFlag) rows.push(['IPC', ['Isolation / side room needed', 'st-amber']]);
        this.$('status-list').innerHTML = rows.map(([k, [v, cls]]) => `<li><strong>${esc(k)}</strong><span class="${cls}">${esc(v)}</span></li>`).join('');

        this.$('missing-list').innerHTML = d.missing.length ? `<strong>Still to record (${d.missing.length})</strong><ul>${d.missing.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : '';
    }

    // ------------------------------------------------------------------ plan / protocols
    // What the plan's `auto` conditions are evaluated against (see protocols.js section 7b).
    planContext() {
        const s = this.state, d = this.derived, o = s.obs;
        return {
            age: s.patient.age, pregnant: s.patient.pregnant, bm: o.bm, discriminator: s.complaint.discriminator,
            // Sepsis bloods: NG253 moderate/high risk (adults), NG143 amber/red (under 5s) or a sepsis discriminator.
            sepsis: (d.sepsis.status === 'assessed' && (d.sepsis.risk === 'High' || d.sepsis.risk === 'Moderate')) ||
                (d.feverRelevant && (d.feverTL.level === 'Red' || d.feverTL.level === 'Amber')) || /sepsis/i.test(s.complaint.discriminator || ''),
            anticoag: s.assess.ng232Anticoag === null ? d.anticoagDetected : s.assess.ng232Anticoag
        };
    }

    placementLabel(value) {
        for (const opts of Object.values(this.data.placements)) if (opts[value]) return opts[value];
        return value;
    }

    // Cannula "consider" becomes "suggested now" when the patient is sick enough to need IV access.
    cannulaNow() {
        const d = this.derived;
        if (d.level === 'Red' || d.level === 'Orange') return `${d.level} category`;
        if (d.ews && d.ews.type === 'NEWS2' && d.ews.score >= 5) return `NEWS2 ${d.ews.score}`;
        if (d.sepsis && d.sepsis.status === 'assessed' && (d.sepsis.risk === 'High' || d.sepsis.risk === 'Moderate')) return `${d.sepsis.risk.toLowerCase()} sepsis risk`;
        return '';
    }

    // Nursing plan: cannula, bedside tests and samples, ED ICE blood bundles. No imaging (nursing scope).
    renderProtocol() {
        const complaint = this.state.complaint.name;
        const proto = this.data.protocols[complaint];
        const container = this.$('protocol-actions');
        const ctx = this.planContext();
        const mark = (list) => list.map(it => ({ ...it, on: C.planAutoMet(it.auto, ctx) }));
        const bedside = proto ? mark(proto.bedside) : [], bloods = proto ? mark(proto.bloods) : [];
        const now = proto && proto.cannula.status === 'consider' ? this.cannulaNow() : '';
        const key = JSON.stringify([complaint, bedside.map(x => x.on), bloods.map(x => x.on), now]);
        if (this.built.protocolKey === key) return;
        this.built.protocolKey = key;
        container.innerHTML = '';
        if (!complaint) { container.innerHTML = '<p class="placeholder-text">Choose a complaint to see suggested investigations.</p>'; return; }
        if (!proto) { container.innerHTML = `<p class="placeholder-text">No suggested investigations for "${esc(complaint)}".</p>`; return; }

        const intro = document.createElement('p');
        intro.className = 'plan-intro';
        intro.textContent = 'Suggested = indicated now from the complaint, discriminator, obs or history. "Consider if" = only when that applies. Nursing investigations only - use clinical judgement and local policy.';
        container.appendChild(intro);

        const cn = proto.cannula;
        const label = { recommended: 'Recommended', consider: now ? 'Suggested now' : 'Consider', 'not-routine': 'Not routinely needed' }[cn.status];
        const tone = cn.status === 'recommended' || now ? 'red' : (cn.status === 'consider' ? 'amber' : 'green');
        const cd = document.createElement('div');
        cd.className = `cannula-badge cannula-${tone}`;
        cd.innerHTML = `<span aria-hidden="true">💉</span><div><strong>Cannula: ${label}</strong>${cn.size ? ` (${esc(cn.size)})` : ''} - ${esc(cn.reason)}${now ? ` <em>(${esc(now)})</em>` : ''}</div>`;
        container.appendChild(cd);
        if (cn.status !== 'not-routine') {
            const tag = cn.status === 'recommended' || now ? 'suggested' : 'consider';
            container.appendChild(this.planCheck({ name: `IV cannula ${cn.size}`, why: '' }, 'Cannula', '', { tag }));
        }

        const order = (list) => [...list.filter(x => x.on), ...list.filter(x => !x.on)];
        const opts = (it) => it.on ? { tag: 'suggested', hint: it.when && it.auto !== 'always' ? `Because: ${it.when}` : '' } : { tag: 'consider', hint: `Consider if ${it.when}` };
        const grid = document.createElement('div');
        grid.className = 'tests-grid';
        const sec = document.createElement('div');
        sec.className = 'test-category';
        sec.innerHTML = '<h4>Bedside tests &amp; samples</h4>';
        if (bedside.length) order(bedside).forEach(t => sec.appendChild(this.planCheck(t, 'Bedside', '', opts(t))));
        else sec.insertAdjacentHTML('beforeend', '<p class="plan-note">No routine bedside tests for this presentation beyond full obs.</p>');
        grid.appendChild(sec);

        const bl = document.createElement('div');
        bl.className = 'test-category';
        bl.innerHTML = '<h4>Bloods - ED ICE bundles</h4>';
        order(bloods).forEach(b => {
            const tests = (this.data.bloodProfiles[b.profile] || []).map(t => t.name).join(', ');
            const el = this.planCheck({ name: b.profile, why: `Includes: ${tests}` }, 'Bloods', '', opts(b));
            el.classList.add('profile-check');
            bl.appendChild(el);
        });
        if (proto.bloodsNote) bl.insertAdjacentHTML('beforeend', `<p class="plan-note">${esc(proto.bloodsNote)}</p>`);
        else if (!bloods.length) bl.insertAdjacentHTML('beforeend', '<p class="plan-note">No ED blood bundle for this presentation - bloods only if a clinician requests them.</p>');
        if (bloods.length) bl.insertAdjacentHTML('beforeend', '<div class="bbv-note">Trust policy: ICE adds a BBV screen (Hep B, Hep C, HIV) to these requests if not done in the past 12 months.</div>');
        grid.appendChild(bl);
        container.appendChild(grid);
    }

    // Suggested placement: category-based default plus the complaint's pathways (subject to local criteria).
    renderPlacement() {
        const s = this.state, d = this.derived, box = this.$('placement-suggest');
        const base = C.basePlacement({ level: d.level, isPaeds: d.isPaeds, mobility: s.patient.mobility });
        const proto = this.data.protocols[s.complaint.name];
        const ctx = this.planContext();
        // Once a discriminator is chosen, pathways that depend only on a different discriminator are irrelevant.
        const chosen = !!s.complaint.discriminator || s.complaint.noneApply;
        const paths = proto ? proto.pathways.map(p => ({ ...p, on: C.planAutoMet(p.auto, ctx) }))
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
        const tag = opts.tag === 'suggested' ? '<span class="plan-tag">Suggested</span>' : '';
        div.innerHTML = `<input type="checkbox" aria-label="${esc(name)}"> <div class="protocol-check-text"><span>${category === 'Bloods' ? `<strong>${esc(name)}</strong>` : esc(name)}${tag}</span>${opts.hint ? `<small class="protocol-when">${esc(opts.hint)}</small>` : ''}${why ? `<small class="protocol-why">${esc(why)}</small>` : ''}</div>${info ? this.infoPopoverHTML(info) : ''}` +
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

    validateObsField(id, value) {
        const bounds = {
            'obs-rr': [4, 60, 0, 100], 'obs-sats': [50, 100, 0, 100], 'obs-sbp': [40, 260, 0, 300], 'obs-dbp': [20, 160, 0, 200],
            'obs-hr': [25, 220, 0, 300], 'obs-temp': [30, 42, 20, 45], 'obs-crt': [0, 8, 0, 15], 'obs-bm': [1, 35, 0, 60]
        }[id];
        const el = this.$(id);
        if (!bounds || !el) return;
        const [min, max, hmin, hmax] = bounds;
        el.classList.remove('field-warning', 'field-danger');
        el.title = '';
        if (!C.has(value)) return;
        if (value < hmin || value > hmax) { el.classList.add('field-danger'); el.title = `Physiologically implausible - please check (${hmin}-${hmax})`; }
        else if (value < min || value > max) { el.classList.add('field-warning'); el.title = `Unusual value - please double-check (typical ${min}-${max})`; }
    }

    // ------------------------------------------------------------------ note, SBAR, copy
    composeNote() {
        const s = this.state, d = this.derived, p = s.patient, h = s.history, ph = s.prehospital, o = s.obs;
        const f = (v, unit = '') => C.has(v) ? `${v}${unit}` : '-';
        const lines = [];
        if (p.arrivalMode === 'Ambulance') {
            lines.push('RAA - AMBULANCE HANDOVER', `Call sign: ${p.ambulanceCallSign || 'Not recorded'} | Case ID: ${p.ambulanceCaseId || 'Not recorded'}`, `PC: ${s.complaint.name || s.complaint.raw || 'Not recorded'}`, `HPC: ${ph.hpc || 'Not recorded'}`);
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
            lines.push('---');
        }
        lines.push('TRIAGE NOTE');
        lines.push(`Arrival ${hhmm(s.meta.arrivalAt)} ${ddmmyyyy(s.meta.arrivalAt)} (${p.arrivalMode === 'Ambulance' ? 'ambulance' : 'self-presented'}) | Triage started ${s.meta.startedAt ? hhmm(s.meta.startedAt) : '-'} | Category set ${s.meta.categorySetAt ? hhmm(s.meta.categorySetAt) : '-'}`);
        lines.push(`Triage nurse: ${store.get('initials', '', true) || 'Not recorded'}`);
        const age = !C.has(p.ageValue) ? 'Age not recorded' : (p.ageUnit === 'Months' ? `${p.ageValue} months` : `${p.ageValue}y`);
        lines.push(`Patient: ${age} ${p.sex || 'sex not recorded'} | Mobility: ${p.mobility || 'not recorded'}${p.localRef ? ` | Ref: ${p.localRef}` : ''}`);
        if (C.has(p.weight)) lines.push(`Weight: ${p.weight} kg (measured)`);
        if (p.pregnant) {
            const g = d.gestation;
            lines.push(`Pregnant / <6 weeks postpartum: yes${g && g.valid ? ` - ${g.weeks}+${g.days} weeks by LMP ${ddmmyyyy(p.lmp)} (EDD ${ddmmyyyy(g.edd)})` : (p.lmp ? ` - LMP ${p.lmp}` : '')}`);
        }
        lines.push(`PC: ${s.complaint.name || (s.complaint.raw ? `${s.complaint.raw} (no flowchart selected)` : 'Not recorded')}`);
        const disc = d.disc ? `${d.disc.text} (${d.disc.priority})` : (s.complaint.noneApply ? 'None of the discriminators apply (Blue)' : 'Not selected');
        lines.push(`Discriminator: ${disc}`);
        lines.push(`Pain: ${C.has(s.complaint.pain) ? `${s.complaint.pain}/10 - ${d.pain.band.toLowerCase()}${s.complaint.painMethod === 'FLACC' ? ' (FLACC)' : ''}` : 'Not assessed'}`);
        const gcs = d.gcsTotal !== null ? `${d.gcsTotal} (E${o.gcsE} V${o.gcsV} M${o.gcsM})` : '-';
        lines.push(`Obs: RR ${f(o.rr)} | SpO2 ${f(o.sats, '%')} ${o.o2 ? (o.o2 === 'O2' ? 'on O2' : 'air') : '(air/O2 not recorded)'}${o.scale2 ? ' [scale 2]' : ''} | BP ${f(o.sbp)}/${f(o.dbp)} | HR ${f(o.hr)} | ACVPU ${o.avpu || '-'} | Temp ${f(o.temp)} | CRT ${f(o.crt, 's')} | GCS ${gcs} | BM ${f(o.bm)} | Pupils ${o.pupils || '-'}`);
        const e = d.ews;
        const ewsName = e.type === 'NEWS2' ? 'NEWS2' : (e.type === 'PEWS' ? `Local PEWS (${e.group})` : 'Local MEOWS');
        if (e.recorded === 0) lines.push(`${ewsName}: NOT CALCULATED - no obs recorded`);
        else if (!e.complete) lines.push(`${ewsName}: INCOMPLETE - partial score ${e.score}; missing ${e.missing.join(', ')}`);
        else lines.push(`${ewsName}: ${e.score}${d.newsResp ? ` - ${d.newsResp.risk} clinical risk; obs ${d.newsResp.monitorText}` : ''}${e.params.filter(x => x.points).length ? ` [${e.params.filter(x => x.points).map(x => `${x.label} ${x.value} +${x.points}`).join(', ')}]` : ''}`);
        const sp = d.sepsis;
        if (sp.applicable) {
            if (sp.status === 'assessed') {
                lines.push(`Sepsis (NICE NG253): infection suspected - ${sp.risk} risk${sp.provisional ? ' (provisional, obs incomplete)' : ''}. ${sp.actions}${sp.judgement ? ` ${sp.judgement}` : ''}`);
                const f2 = this.data.sepsisConsiderations.filter(c => s.assess.sepsisFactors[c.id]).map(c => c.label);
                if (f2.length) lines.push(`Sepsis considerations: ${f2.join('; ')}`);
            } else lines.push(`Sepsis (NICE NG253): ${sp.status === 'not-suspected' ? 'infection not suspected' : 'infection question not answered'}`);
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
        if (d.risks.length) { lines.push('ALERTS:'); d.risks.forEach(r => lines.push(`- ${r}`)); }
        lines.push(`Allergies: ${h.allergies.trim() || 'NOT RECORDED'}${h.allergyReaction ? ` (reaction: ${h.allergyReaction})` : ''}`);
        lines.push(`PMH: ${h.pmh || 'Not recorded'}`);
        lines.push(`Medicines: ${h.meds || 'Not recorded'}`);
        if (p.arrivalMode !== 'Ambulance' && h.treatmentNotes) lines.push(`Treatment before triage: ${h.treatmentNotes}`);
        if (d.isPaeds) {
            const pa = s.assess.paeds, sg = Object.entries(pa.safeguarding).filter(([, v]) => v).map(([k]) => ({ cpis: 'CP-IS checked', pr: 'parental responsibility identified', nonmobile: 'injury in non-mobile child', story: 'inconsistent explanation', notbrought: 'previous attendance / not brought concern' }[k]));
            lines.push(`Child: accompanied by ${pa.accompaniedBy || 'not recorded'}; analgesia in last 4-6h: ${pa.recentDose || 'not asked'}${sg.length ? `; safeguarding: ${sg.join(', ')}` : ''}`);
        }
        const scr = Object.entries(this.data.screening).filter(([k]) => s.screening[k]).map(([k, def]) => `${def.label}: ${def.options ? (def.options.find(o2 => o2.val === s.screening[k]) || {}).text : s.screening[k]}`);
        if (scr.length) lines.push(`Screening: ${scr.join('; ')}`);
        if (d.ipcFlag) lines.push(`Infection control: ${Object.entries(s.assess.ipc).filter(([, v]) => v).map(([k]) => ({ dv: 'D&V', resp: 'respiratory symptoms', rash: 'rash with fever', travel: 'recent travel', mdro: 'resistant organism' }[k])).join(', ')} - side room / isolation per local policy`);
        if (s.plan.length) {
            const g = {};
            s.plan.forEach(i => { (g[i.category] = g[i.category] || []).push(`${i.name} (${i.status})`); });
            lines.push('PLAN:');
            ['Universal', 'Cannula', 'Bedside', 'Bloods'].filter(c => g[c]).forEach(cat => lines.push(`${cat}: ${g[cat].join(', ')}`));
        }
        if (h.planNarrative) lines.push(`Narrative: ${h.planNarrative}`);
        if (s.triage.disposition) lines.push(`Placement: ${s.triage.disposition === 'Other' ? (s.triage.dispositionOther || 'Other') : this.placementLabel(s.triage.disposition)}`);
        if (s.triage.disposition === 'Escalation' || s.triage.disposition === 'Held on Ambulance') {
            const done = Object.entries(s.assess.corridor).filter(([, v]) => v).map(([k]) => k);
            lines.push(`Corridor care: ${done.length ? done.join(', ') : 'no checks recorded'}${s.assess.corridorCheckedAt ? ` - last check ${hhmm(s.assess.corridorCheckedAt)}` : ''}`);
        }
        const lvl = d.level;
        if (!lvl) lines.push('TRIAGE CATEGORY: NOT YET TRIAGED');
        else lines.push(`TRIAGE CATEGORY: ${lvl.toUpperCase()}${d.priority.provisional ? ' (PROVISIONAL - no discriminator selected)' : ''}${lvl === 'Red' ? ' - see immediately' : ` - see by ${hhmm(d.seeBy)} (${this.data.targetMinutes[lvl]} min target)`}`);
        lines.push(`Stream: ${d.stream}`);
        if (d.priority.reasons.length) lines.push(`Reasons: ${d.priority.reasons.join('; ')}`);
        lines.push(`Next obs due: ${d.nextObs}`);
        return plain(lines.join('\n'));
    }

    renderNote() { this.$('epr-note').value = this.composeNote(); }

    sbarText() {
        const x = this.sbarParts();
        return `S: ${x.S}\nB: ${x.B}\nA: ${x.A}\nR: ${x.R}`;
    }

    sbarParts() {
        const s = this.state, d = this.derived, p = s.patient, h = s.history;
        const age = C.has(p.ageValue) ? (p.ageUnit === 'Months' ? `${p.ageValue}-month-old` : `${p.ageValue}-year-old`) : 'age not recorded,';
        const S = `I have a ${age} ${p.sex ? p.sex.toLowerCase() : 'patient (sex not recorded)'} who arrived ${p.arrivalMode === 'Ambulance' ? 'by ambulance' : 'self-presented'} at ${hhmm(s.meta.arrivalAt)} with ${s.complaint.name || s.complaint.raw || 'an unrecorded complaint'}. Triage category: ${d.level ? d.level + (d.priority.provisional ? ' (provisional)' : '') : 'not yet triaged'}.`;
        const B = `PMH: ${h.pmh || 'not recorded'}. Allergies: ${h.allergies.trim() || 'NOT RECORDED'}${h.allergyReaction ? ` (${h.allergyReaction})` : ''}.${d.risks.length ? ` Alerts: ${d.risks.join('; ')}.` : ''}`;
        const e = d.ews;
        let A = e.recorded === 0 ? 'Obs not yet taken.' : `${e.type === 'NEWS2' ? 'NEWS2' : `Local ${e.type}`} ${e.complete ? e.score : `incomplete (partial ${e.score}, missing ${e.missing.join(', ')})`}.`;
        if (d.sepsis.status === 'assessed') A += ` Suspected infection - NG253 ${d.sepsis.risk} risk.`;
        if (C.has(s.complaint.pain)) A += ` Pain ${s.complaint.pain}/10.`;
        if (d.ng232) A += ` Head injury: ${ng232Nurse(d.ng232)}.`;
        if (d.feverRelevant && d.feverTL.level) A += ` NICE fever traffic light ${d.feverTL.level}.`;
        let R = `Stream: ${d.stream}. Next obs due: ${d.nextObs}.`;
        if (s.plan.length) R += ` Plan: ${s.plan.map(x => `${x.name} (${x.status})`).join(', ')}.`;
        if (d.level === 'Red') R += ' Requires immediate review.';
        const one = (t) => plain(t).replace(/\s*\n+\s*/g, '; ');
        return { S: one(S), B: one(B), A: one(A), R: one(R) };
    }

    openSbar() {
        const x = this.sbarParts();
        this.$('sbar-s').textContent = x.S; this.$('sbar-b').textContent = x.B; this.$('sbar-a').textContent = x.A; this.$('sbar-r').textContent = x.R;
        this.openModal('modal-sbar');
    }

    async copyText(text, msg) {
        try { await navigator.clipboard.writeText(text); this.toast(msg); return true; } catch {
            const ta = document.createElement('textarea');
            ta.value = text; document.body.appendChild(ta); ta.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch { ok = false; }
            ta.remove();
            this.toast(ok ? msg : 'Copy failed - open "Preview EPR note" and copy manually', ok ? 'info' : 'error');
            return ok;
        }
    }

    async copyNote() {
        this.state.meta.noteCopiedAt = new Date().toISOString();
        this.renderNote();
        const ok = await this.copyText(this.$('epr-note').value, 'EPR note copied');
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
        if (f) f.focus();
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
        val('patient-age', p.ageValue); val('patient-weight', p.weight); val('patient-sex', p.sex); val('patient-mobility', p.mobility);
        chk('check-pregnant', p.pregnant); val('date-lmp', p.lmp); val('patient-ref', p.localRef); val('amb-callsign', p.ambulanceCallSign); val('amb-caseid', p.ambulanceCaseId);
        val('ph-hpc', ph.hpc); val('ph-tx', ph.tx); val('ph-tx-time', ph.txTime); val('ph-social', ph.social);
        ['rr', 'sats', 'sbp', 'dbp', 'hr', 'gcs', 'bm', 'ecg', 'pupils'].forEach(k => val(`ph-obs-${k}`, ph.obs[k]));
        ['rr', 'sats', 'sbp', 'dbp', 'hr', 'temp', 'crt', 'bm'].forEach(k => { val(`obs-${k}`, o[k]); this.validateObsField(`obs-${k}`, o[k]); });
        val('obs-pupils', o.pupils); chk('obs-scale2', o.scale2);
        val('obs-gcs-e', o.gcsE); val('obs-gcs-v', o.gcsV); val('obs-gcs-m', o.gcsM);
        val('input-complaint', s.complaint.name || s.complaint.raw);
        val('allergies', h.allergies); val('allergy-reaction', h.allergyReaction); val('pmh', h.pmh); val('meds', h.meds); val('treatment-notes', h.treatmentNotes); val('plan-narrative', h.planNarrative);
        val('sel-disposition', s.triage.disposition); val('txt-disposition-other', s.triage.dispositionOther);
        this.$('txt-disposition-other').classList.toggle('hidden', s.triage.disposition !== 'Other');
        const ov = s.triage.override;
        this.$('override-options').classList.toggle('hidden', !ov);
        this.$('btn-override-toggle').classList.toggle('active', !!ov);
        if (ov) { val('sel-override', ov.level); val('txt-override', ov.reason); } else val('txt-override', '');
        this.$('flacc-panel').classList.add('hidden');
        this.setSectionCollapsed('obs-section-toggle', 'obs-collapsible-body', false);
        this.built = {};
        this.compute();
        this.render();
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
