import { clinicalData } from './protocols.js';

class TriageApp {
    constructor() {
        this.data = clinicalData;
        
        // Initial State
        this.state = {
            patient: { id: '', dob: null, age: null, weight: null, sex: '', pregnant: false, mobility: 'Walking' },
            obs: { rr: null, sats: null, o2: 'Air', sbp: null, hr: null, avpu: 'A', temp: null, scale2: false },
            history: { complaint: '', pain: 0, allergies: '', pmh: '', meds: '' },
            triage: { 
                discriminator: null, 
                basePriority: 'Blue', 
                finalPriority: 'Blue', 
                reasons: [], 
                override: null, 
                newsScore: 0,
                stream: 'Pending',
                timer: '--'
            },
            ui: { sepsisAlertShown: false, redFlagChecked: false },
            actionsTaken: [] 
        };

        this.cacheDOM();
        this.bindEvents();
        this.populateDatalist();
        this.renderPainButtons();
        
        this.initSpeech();
        this.loadHistory();
    }

    // --- CORE ARCHITECTURE ---

    setState(updates) {
        this.state = { ...this.state, ...updates };
        if (updates.patient || updates.obs || updates.history) {
             this.runClinicalLogic();
        }
        this.render();
    }

    runClinicalLogic() {
        if (this.state.patient.dob) {
            const diff = Date.now() - new Date(this.state.patient.dob).getTime();
            this.state.patient.age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        }

        const isPregnant = this.state.patient.pregnant;
        
        if (isPregnant) {
             this.state.triage.newsScore = 0; 
        } else if (this.state.patient.age >= 16) {
            this.calcNEWS2();
        } else {
            this.state.triage.newsScore = 0; 
        }

        this.calcTriagePriority();
        this.calcStreamAndTimer();
        this.saveSession();
    }

    // --- CLINICAL CALCULATORS ---

    calcNEWS2() {
        const obs = this.state.obs;
        const rules = this.data.scoring.news2;
        let score = 0;

        const getScore = (val, buckets) => {
            if (val === null) return 0;
            const match = buckets.find(b => val <= b.max);
            return match ? match.score : 3;
        };

        if(obs.rr !== null) score += getScore(obs.rr, rules.rr);
        if(obs.sats !== null) score += getScore(obs.sats, obs.scale2 ? rules.sats2 : rules.sats1);
        if(obs.sbp !== null) score += getScore(obs.sbp, rules.sbp);
        if(obs.hr !== null) score += getScore(obs.hr, rules.hr);
        if(obs.temp !== null) score += getScore(obs.temp, rules.temp);
        
        if (obs.avpu !== 'A') score += 3;
        if (obs.o2 === 'O2') score += 2;

        this.state.triage.newsScore = score;
    }

    calcTriagePriority() {
        let p = this.state.triage.discriminator ? this.state.triage.basePriority : 'Blue';
        let reasons = this.state.triage.discriminator ? [`MTS: ${this.state.triage.discriminator}`] : [];

        if (this.state.history.pain >= 7) {
            const isShocked = (this.state.obs.hr > 110) || (this.state.obs.sbp && this.state.obs.sbp < 90);
            if (isShocked) {
                if (['Yellow', 'Green', 'Blue'].includes(p)) {
                    p = 'Orange';
                    reasons.push('Severe Pain + Shock Signs');
                }
            } else {
                reasons.push('Plan: Priority Analgesia Required');
            }
        }

        if (this.state.patient.age >= 16 && !this.state.patient.pregnant) {
            if (this.state.triage.newsScore >= 7) {
                p = 'Red';
                reasons.push('NEWS2 ≥ 7');
            } else if (this.state.triage.newsScore >= 5 && p !== 'Red') {
                p = 'Orange';
                reasons.push('NEWS2 ≥ 5 (Sepsis Screen?)');
            }
        }

        if (this.state.triage.override) {
            p = this.state.triage.override.level;
            reasons.push(`OVERRIDE: ${this.state.triage.override.reason}`);
        }

        this.state.triage.finalPriority = p;
        this.state.triage.reasons = reasons;
    }

    calcStreamAndTimer() {
        const p = this.state.triage.finalPriority;
        const mobility = this.state.patient.mobility;
        
        const timers = { 'Red': 'IMMEDIATE', 'Orange': '15 mins', 'Yellow': '60 mins', 'Green': '120 mins', 'Blue': '240 mins' };
        this.state.triage.timer = timers[p] || '--';

        let stream = 'Majors';
        if (p === 'Red' || p === 'Orange') {
            stream = 'RESUS / MAJORS';
        } else if (p === 'Green' || p === 'Blue') {
            if (mobility === 'Walking') stream = 'See & Treat / Minors';
            else stream = 'Majors (Mobility)';
        } else {
            stream = 'Majors';
        }

        this.state.triage.stream = stream;
    }

    // --- PHASE 2 & 3: FEATURES ---
    
    initSpeech() {
        if (!('webkitSpeechRecognition' in window)) return;
        document.querySelectorAll('.mic-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.dataset.target;
                const targetEl = document.getElementById(targetId);
                const recognition = new webkitSpeechRecognition();
                recognition.continuous = false;
                recognition.lang = 'en-GB';
                e.target.classList.add('listening');
                
                recognition.onresult = (event) => {
                    const text = event.results[0][0].transcript;
                    if(targetEl.tagName === 'TEXTAREA' && targetEl.value) {
                        targetEl.value += `. ${text}`;
                    } else {
                        targetEl.value = text;
                    }
                    targetEl.dispatchEvent(new Event('input'));
                    e.target.classList.remove('listening');
                    if(targetId === 'input-complaint') this.handleComplaint(targetEl.value);
                };
                recognition.onerror = () => e.target.classList.remove('listening');
                recognition.onend = () => e.target.classList.remove('listening');
                recognition.start();
            });
        });
    }

    saveSession() {
        if(!this.state.patient.id && !this.state.history.complaint) return;
        const sessions = JSON.parse(localStorage.getItem('triage_history') || '[]');
        const current = {
            id: this.state.patient.id || 'Unknown',
            complaint: this.state.history.complaint,
            priority: this.state.triage.finalPriority,
            time: new Date().toLocaleString(),
            data: this.state
        };
        const existingIndex = sessions.findIndex(s => s.id === current.id && s.id !== 'Unknown');
        if(existingIndex >= 0) sessions[existingIndex] = current;
        else sessions.unshift(current);
        if(sessions.length > 10) sessions.pop();
        localStorage.setItem('triage_history', JSON.stringify(sessions));
    }

    loadHistory() {
        document.getElementById('btn-history').addEventListener('click', () => {
            document.getElementById('history-sidebar').classList.add('open');
            this.renderHistoryList();
        });
    }

    renderHistoryList() {
        const list = document.getElementById('history-list');
        const sessions = JSON.parse(localStorage.getItem('triage_history') || '[]');
        list.innerHTML = '';
        if(sessions.length === 0) list.innerHTML = '<p>No recent patients.</p>';
        sessions.forEach(s => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.style.borderLeft = `4px solid var(--${s.priority})`;
            div.innerHTML = `<div style="font-weight:bold">${s.id}</div><div>${s.complaint || 'No complaint'}</div><div class="history-meta"><span>${s.priority}</span><span>${s.time}</span></div>`;
            div.onclick = () => {
                if(confirm("Load this patient? Unsaved data will be lost.")) {
                    this.state = s.data;
                    this.restoreUI();
                    document.getElementById('history-sidebar').classList.remove('open');
                }
            };
            list.appendChild(div);
        });
    }

    restoreUI() {
        const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
        const setCheck = (id, val) => { const el = document.getElementById(id); if(el) el.checked = !!val; };
        const p = this.state.patient, o = this.state.obs, h = this.state.history;
        
        setVal('patient-id', p.id); setVal('patient-dob', p.dob);
        setVal('patient-weight', p.weight); setVal('patient-sex', p.sex);
        setVal('patient-mobility', p.mobility); setCheck('check-pregnant', p.pregnant);
        
        setVal('obs-rr', o.rr); setVal('obs-sats', o.sats); setVal('obs-sbp', o.sbp);
        setVal('obs-hr', o.hr); setVal('obs-temp', o.temp); setCheck('obs-scale2', o.scale2);
        
        document.querySelectorAll('#seg-avpu button').forEach(b => b.classList.toggle('active', b.dataset.value === o.avpu));
        document.querySelectorAll('#seg-o2 button').forEach(b => b.classList.toggle('active', b.dataset.value === o.o2));
        
        setVal('input-complaint', h.complaint); setVal('allergies', h.allergies); setVal('pmh', h.pmh); setVal('meds', h.meds);
        
        document.querySelectorAll('.pain-btn').forEach(b => b.classList.toggle('active', parseInt(b.textContent) === h.pain));
        document.getElementById('pain-val').textContent = h.pain;

        setCheck('check-override', !!this.state.triage.override);
        if(this.state.triage.override) {
            document.getElementById('override-options').classList.remove('hidden');
            setVal('sel-override', this.state.triage.override.level);
            setVal('txt-override', this.state.triage.override.reason);
        } else {
            document.getElementById('override-options').classList.add('hidden');
        }
        
        this.handleComplaint(h.complaint);
        this.render();
    }

    // --- RENDERING ---

    render() {
        this.renderDemographics();
        this.renderNEWS2();
        this.renderPaedsSafety();
        this.renderPlan();
        this.renderNote();
    }

    renderDemographics() {
        const p = this.state.patient;
        document.getElementById('calculated-age-display').textContent = p.age !== null ? `Age: ${p.age}` : 'Age: --';
        const isFemaleRepro = p.sex === 'Female' && p.age >= 12 && p.age <= 55;
        document.getElementById('female-health-section').classList.toggle('hidden', !isFemaleRepro);
        const isPaeds = p.age !== null && p.age < 16;
        document.getElementById('obs-form').style.opacity = isPaeds ? '0.5' : '1';
    }

    renderNEWS2() {
        const container = document.getElementById('visual-ews-container');
        container.innerHTML = '';
        if (this.state.patient.pregnant) {
            container.innerHTML = '<div class="warning-box" style="text-align:center;">PREGNANT PATIENT: NEWS2 Disabled.<br>Use Obstetric Early Warning Score (MEWS).</div>';
            return;
        }
        if (this.state.patient.age < 16) {
            container.innerHTML = '<div style="text-align:center; opacity:0.6;">Adult NEWS2 disabled. See Paeds Safety below.</div>';
            return;
        }
        const score = this.state.triage.newsScore;
        const el = document.createElement('div');
        el.className = `priority-badge ${score >= 5 ? 'priority-Red' : 'priority-Green'}`;
        if(score >= 5) el.classList.add('pulse-alert');
        el.style.fontSize = '1.2rem';
        el.style.padding = '10px';
        el.textContent = `NEWS2 Score: ${score}`;
        container.appendChild(el);
    }

    renderPaedsSafety() {
        const p = this.state.patient;
        const panel = document.getElementById('paeds-panel');
        const content = document.getElementById('paeds-content');
        const pewsContent = document.getElementById('pews-content');

        if (p.age === null || p.age >= 16) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        const weight = p.weight || 0;
        const safeWeight = Math.min(weight, this.data.paedsSafety.weightCapKg);
        const para = Math.min(safeWeight * 15, 1000).toFixed(0);
        const ibu = Math.min(safeWeight * 10, 400).toFixed(0);
        
        content.innerHTML = weight > 0 
            ? `<strong>Weight ${weight}kg</strong><br>Paracetamol: ${para}mg | Ibuprofen: ${ibu}mg`
            : `<span style="color:var(--red)">Enter Weight for drug doses</span>`;

        let group = 'teen';
        if (p.age < 1) group = 'infant'; else if (p.age < 5) group = 'toddler'; else if (p.age < 12) group = 'child';
        const limits = this.data.paedsSafety.pewsRanges[group];
        const obs = this.state.obs;
        let flags = [];
        if (obs.rr && obs.rr > limits.maxRR) flags.push(`RR High (> ${limits.maxRR})`);
        if (obs.hr && obs.hr > limits.maxHR) flags.push(`HR High (> ${limits.maxHR})`);
        if (obs.sats && obs.sats < 94) flags.push(`SpO2 Low (< 94%)`);
        pewsContent.innerHTML = flags.length > 0 ? `<div class="warning-box"><strong>ABNORMAL PHYSIOLOGY (${group.toUpperCase()}):</strong><br>${flags.join('<br>')}</div>` : `<div style="color:var(--green); text-align:center;">Vitals within normal range for ${group}</div>`;
    }

    renderPlan() {
        const t = this.state.triage;
        const badge = document.getElementById('priority-display');
        badge.className = `priority-badge priority-${t.finalPriority}`;
        if(t.finalPriority === 'Red') badge.classList.add('pulse-alert');
        badge.textContent = t.finalPriority.toUpperCase();
        document.getElementById('stream-display').textContent = `Stream: ${t.stream}`;
        document.getElementById('timer-display').textContent = `Retriage Due: ${t.timer}`;
        document.getElementById('priority-reasons').innerHTML = t.reasons.map(r => `<div>• ${r}</div>`).join('');
        const showSepsis = (t.newsScore >= 5 || t.reasons.some(r => r.toLowerCase().includes('sepsis')));
        document.getElementById('sepsis-actions').classList.toggle('hidden', !showSepsis);
    }

    renderNote() {
        const p = this.state.patient;
        const t = this.state.triage;
        let txt = `TRIAGE NOTE - ${new Date().toLocaleString()}\n`;
        txt += `ID: ${document.getElementById('patient-id').value || 'Unknown'} | ${p.age}y ${p.sex} | Mobility: ${p.mobility}\n`;
        txt += `Complaint: ${this.state.history.complaint} (${t.discriminator || 'None'})\n`;
        txt += `Obs: RR${this.state.obs.rr || '-'} Sat${this.state.obs.sats || '-'}${this.state.obs.o2} BP${this.state.obs.sbp || '-'} HR${this.state.obs.hr || '-'} T${this.state.obs.temp || '-'} ${this.state.obs.avpu}\n`;
        
        if (p.pregnant) txt += `NEWS2 N/A (Pregnant)\n`;
        else if (p.age >= 16) txt += `NEWS2: ${t.newsScore}\n`;
        
        txt += `\nOUTCOME: ${t.finalPriority.toUpperCase()}\n`;
        txt += `Stream: ${t.stream}\n`;
        if (t.reasons.length > 0) txt += `Reasons:\n- ${t.reasons.join('\n- ')}\n`;
        
        const alg = document.getElementById('allergies').value;
        if(alg) txt += `\nAllergies: ${alg}`;
        
        // NEW: Render Cannula & Test Decisions
        const proto = this.data.protocols[this.state.history.complaint];
        if (proto && proto.cannula) {
             txt += `\nCannula Plan: ${proto.cannula.status} (${proto.cannula.reason})`;
        }

        if (this.state.actionsTaken.length > 0) {
            txt += `\n\nProtocol Actions:\n- ${this.state.actionsTaken.join('\n- ')}\n`;
        }
        
        if (p.pregnant) txt += `\n*** PREGNANCY ALERT ***\nNEWS2 Skipped. Clinical assessment required.\n`;
        document.getElementById('epr-note').value = txt;
    }

    // --- PROTOCOL RENDERING (UPDATED) ---

    handleComplaint(val) {
        if (val.toLowerCase() === 'headache' && !this.state.ui.redFlagChecked) {
             if (confirm("RED FLAG CHECK: Is there any history of trauma or fall?")) {
                 val = "Head Injury";
                 this.dom.complaintInput.value = val;
             }
             this.state.ui.redFlagChecked = true;
        }

        this.setState({ history: { ...this.state.history, complaint: val } });
        
        if (!this.data.mtsFlowcharts[val]) return;

        const container = this.dom.discriminatorBox;
        container.innerHTML = '';
        
        const sorted = [...this.data.mtsFlowcharts[val]].sort((a,b) => {
             const order = { "Red": 1, "Orange": 2, "Yellow": 3, "Green": 4, "Blue": 5 };
             return order[a.priority] - order[b.priority];
        });

        sorted.forEach(item => {
            const div = document.createElement('div');
            div.className = `discriminator priority-${item.priority}`;
            div.textContent = item.text;
            div.onclick = () => {
                Array.from(container.children).forEach(c => c.classList.remove('selected'));
                div.classList.add('selected');
                this.setState({ triage: { ...this.state.triage, discriminator: item.text, basePriority: item.priority } });
            };
            container.appendChild(div);
        });
        
        this.renderProtocol(val);
    }
    
    renderProtocol(complaint) {
        const proto = this.data.protocols[complaint];
        const container = document.getElementById('protocol-actions');
        container.innerHTML = '';
        this.state.actionsTaken = [];

        if (proto && proto.tests) {
            // 1. CANNULA BADGE
            if (proto.cannula) {
                const cDiv = document.createElement('div');
                cDiv.className = `cannula-badge cannula-${proto.cannula.color}`;
                cDiv.innerHTML = `
                    <div style="font-size:1.5rem; margin-right:10px;">💉</div>
                    <div>
                        <strong>Cannula: ${proto.cannula.status}</strong><br>
                        <small>${proto.cannula.reason} (${proto.cannula.size})</small>
                    </div>
                `;
                container.appendChild(cDiv);
            }

            // 2. HELPER FOR CHECKBOXES
            const createCheck = (text) => {
                const div = document.createElement('div');
                div.className = 'protocol-check';
                div.innerHTML = `<input type="checkbox"> <span>${text}</span>`;
                div.querySelector('input').addEventListener('change', (e) => {
                    div.classList.toggle('checked', e.target.checked);
                    if(e.target.checked) this.state.actionsTaken.push(text);
                    else this.state.actionsTaken = this.state.actionsTaken.filter(t => t !== text);
                    this.renderNote();
                });
                return div;
            };

            // 3. CATEGORIES
            const cats = [
                { key: 'bedside', icon: '🫀', label: 'Bedside' },
                { key: 'lab', icon: '🩸', label: 'Labs' },
                { key: 'imaging', icon: '📷', label: 'Imaging' }
            ];

            cats.forEach(cat => {
                if(proto.tests[cat.key] && proto.tests[cat.key].length > 0) {
                    const section = document.createElement('div');
                    section.className = 'test-category';
                    section.innerHTML = `<h4>${cat.icon} ${cat.label}</h4>`;
                    proto.tests[cat.key].forEach(test => section.appendChild(createCheck(test)));
                    container.appendChild(section);
                }
            });

        } else if (proto && proto.do) {
             // Fallback for old protocol structure
             const ul = document.createElement('ul');
             proto.do.forEach(item => { const li = document.createElement('li'); li.innerHTML = `<strong>${item}</strong>`; ul.appendChild(li); });
             container.appendChild(ul);
        } else {
            container.textContent = "No specific protocol loaded.";
        }
    }

    cacheDOM() {
        this.dom = {
            complaintInput: document.getElementById('input-complaint'),
            discriminatorBox: document.getElementById('discriminator-container')
        };
    }

    bindEvents() {
        const bind = (id, key, path = 'obs', transform = (v) => v) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', (e) => {
                const val = el.type === 'checkbox' ? e.target.checked : transform(e.target.value);
                if (path === 'obs') this.setState({ obs: { ...this.state.obs, [key]: val } });
                if (path === 'patient') this.setState({ patient: { ...this.state.patient, [key]: val } });
            });
        };

        bind('obs-rr', 'rr', 'obs', parseFloat); bind('obs-sats', 'sats', 'obs', parseFloat);
        bind('obs-sbp', 'sbp', 'obs', parseFloat); bind('obs-hr', 'hr', 'obs', parseFloat);
        bind('obs-temp', 'temp', 'obs', parseFloat); bind('obs-scale2', 'scale2', 'obs');
        bind('patient-dob', 'dob', 'patient'); bind('patient-weight', 'weight', 'patient', parseFloat);
        bind('patient-sex', 'sex', 'patient'); bind('patient-mobility', 'mobility', 'patient');
        bind('check-pregnant', 'pregnant', 'patient');

        document.querySelectorAll('.segmented-control button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parent = e.target.parentElement;
                parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const val = e.target.dataset.value;
                if (parent.id === 'seg-avpu') this.setState({ obs: { ...this.state.obs, avpu: val } });
                if (parent.id === 'seg-o2') this.setState({ obs: { ...this.state.obs, o2: val } });
            });
        });

        this.dom.complaintInput.addEventListener('input', (e) => this.handleComplaint(e.target.value));

        document.querySelector('.dashboard').addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'setComplaint') {
                this.dom.complaintInput.value = e.target.dataset.val;
                this.handleComplaint(e.target.dataset.val);
            }
            if (action === 'quickText') {
                const target = document.getElementById(e.target.dataset.target);
                target.value = e.target.dataset.val;
                target.dispatchEvent(new Event('input'));
            }
        });

        document.getElementById('check-override').addEventListener('change', (e) => {
             const div = document.getElementById('override-options');
             div.classList.toggle('hidden', !e.target.checked);
             if (!e.target.checked) this.setState({ triage: { ...this.state.triage, override: null } });
        });
        
        const updateOverride = () => {
            if (!document.getElementById('check-override').checked) return;
            this.setState({ triage: { ...this.state.triage, override: { level: document.getElementById('sel-override').value, reason: document.getElementById('txt-override').value } } });
        };
        document.getElementById('sel-override').addEventListener('change', updateOverride);
        document.getElementById('txt-override').addEventListener('input', updateOverride);
        
        ['allergies', 'pmh', 'meds'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                this.setState({ history: { ...this.state.history, [id]: e.target.value } });
            });
        });
    }

    renderPainButtons() {
        const c = document.getElementById('pain-btn-container');
        c.innerHTML = '';
        for (let i = 0; i <= 10; i++) {
            const b = document.createElement('button');
            b.className = 'pain-btn';
            b.textContent = i;
            b.onclick = () => {
                document.querySelectorAll('.pain-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                document.getElementById('pain-val').textContent = i;
                this.setState({ history: { ...this.state.history, pain: i } });
            };
            c.appendChild(b);
        }
    }

    populateDatalist() {
        const dl = document.getElementById('flowcharts');
        Object.keys(this.data.mtsFlowcharts).sort().forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            dl.appendChild(opt);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new TriageApp(); });
