import { clinicalData } from './protocols.js';

class TriageApp {
    constructor() {
        this.data = clinicalData;
        
        this.initialState = {
            patient: { id: '', dob: null, age: null, weight: null, sex: '', pregnant: false, mobility: 'Walking' },
            obs: { rr: null, sats: null, o2: 'Air', sbp: null, dbp: null, hr: null, avpu: 'A', temp: null, crt: null, scale2: false },
            history: { complaint: '', pain: 0, allergies: '', pmh: '', meds: '', riskFlags: [], planNarrative: '' },
            triage: { 
                discriminator: null, 
                basePriority: 'Blue', 
                finalPriority: 'Blue', 
                reasons: [], 
                override: null, 
                newsScore: 0,
                newsBreakdown: [],
                pewsGroup: null,
                stream: 'Pending',
                timer: '--'
            },
            ui: { sepsisAlertShown: false, redFlagChecked: false },
            actionsTaken: [] 
        };

        this.state = JSON.parse(JSON.stringify(this.initialState));
        this.saveTimeout = null;
        this.dom = {}; 

        this.cacheDOM();
        this.renderScreening(); 
        this.bindEvents();
        this.populateDatalist();
        this.renderPainButtons();
        
        this.initSpeech();
        this.loadHistory();
        
        if(localStorage.getItem('theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('checkbox-theme').checked = true;
        }
    }

    setState(updates) {
        for (const key in updates) {
            if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
                this.state[key] = { ...this.state[key], ...updates[key] };
            } else {
                this.state[key] = updates[key];
            }
        }
        this.runClinicalLogic();
        this.render();
        this.debouncedSave();
    }

    runClinicalLogic() {
        if (this.state.patient.dob) {
            const diff = Date.now() - new Date(this.state.patient.dob).getTime();
            this.state.patient.age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        }

        this.checkMedsRisks();

        const p = this.state.patient;
        this.state.triage.newsScore = 0;
        this.state.triage.newsBreakdown = [];

        if (p.pregnant) {
            this.calcMEOWS();
        } else if (p.age !== null && p.age < 16) {
            this.calcPEWS();
        } else {
            this.calcNEWS2();
        }

        this.calcTriagePriority();
        this.calcStreamAndTimer();
    }

    checkMedsRisks() {
        const meds = (this.state.history.meds || '').toLowerCase();
        let risks = [];
        Object.entries(this.data.highRiskDrugs).forEach(([key, warning]) => {
            if (meds.includes(key)) risks.push(warning);
        });
        const safeWords = ['nil', 'none', 'nkda', 'no meds', 'nothing'];
        const el = document.getElementById('meds-alert');
        if (risks.length > 0) {
            this.state.history.riskFlags = risks;
            el.innerHTML = `⚠️ SAFETY ALERTS: ${[...new Set(risks)].join(', ')}`;
            el.className = 'meds-status-bar meds-risk';
        } else if (safeWords.some(k => meds.includes(k)) || meds.length > 5) {
            this.state.history.riskFlags = [];
            el.innerHTML = '✅ No High Risks Detected';
            el.className = 'meds-status-bar meds-safe';
        } else {
             this.state.history.riskFlags = [];
             el.innerHTML = '';
             el.className = 'meds-status-bar';
        }
    }

    calcNEWS2() {
        const obs = this.state.obs;
        const rules = this.data.scoring.news2;
        let score = 0;
        let breakdown = [];
        const getScore = (val, buckets, label) => {
            if (val === null || val === '') return 0;
            const match = buckets.find(b => val <= b.max);
            const s = match ? match.score : 3;
            if (s > 0) breakdown.push(`${label}: ${val} (+${s})`);
            return s;
        };
        if(obs.rr) score += getScore(obs.rr, rules.rr, 'RR');
        if(obs.sats) score += getScore(obs.sats, obs.scale2 ? rules.sats2 : rules.sats1, 'SpO2');
        if(obs.sbp) score += getScore(obs.sbp, rules.sbp, 'BP');
        if(obs.hr) score += getScore(obs.hr, rules.hr, 'HR');
        if(obs.temp) score += getScore(obs.temp, rules.temp, 'Temp');
        if (obs.avpu !== 'A') { score += 3; breakdown.push(`AVPU: ${obs.avpu} (+3)`); }
        if (obs.o2 === 'O2') { score += 2; breakdown.push(`O2: On (+2)`); }
        this.state.triage.newsScore = score;
        this.state.triage.newsBreakdown = breakdown;
    }

    calcPEWS() {
        const obs = this.state.obs;
        const age = this.state.patient.age;
        if (age === null) return;
        let group = 'teen';
        if (age < 1) group = 'infant';
        else if (age < 5) group = 'toddler';
        else if (age < 12) group = 'child';
        
        const data = this.data.scoring.pews[group];
        let score = 0;
        let breakdown = [];
        const getScore = (val, buckets, label) => {
            if (val === null || val === '') return 0;
            const match = buckets.find(b => val <= b.max);
            const s = match ? match.score : 3;
            if (s > 0) breakdown.push(`${label}: ${val} (+${s})`);
            return s;
        };
        if (obs.rr) score += getScore(obs.rr, data.rr, 'RR');
        if (obs.hr) score += getScore(obs.hr, data.hr, 'HR');
        if (obs.sats && obs.sats < 94) { score += 3; breakdown.push('Sats <94 (+3)'); }
        if (obs.o2 === 'O2') { score += 2; breakdown.push('O2 (+2)'); }
        if (obs.crt > 2) { score += 1; breakdown.push('CRT >2s (+1)'); }
        if (obs.avpu !== 'A') { score += 3; breakdown.push('AVPU (+3)'); }
        
        this.state.triage.newsScore = score;
        this.state.triage.newsBreakdown = breakdown;
        this.state.triage.pewsGroup = group;
    }

    calcMEOWS() {
        // Red/Yellow trigger system logic translated to score for visual consistency
        const obs = this.state.obs;
        let score = 0;
        let breakdown = [];
        // Triggers based on Standard MEOWS
        if(obs.rr < 10 || obs.rr > 30) { score+=3; breakdown.push('RR Red'); }
        else if(obs.rr > 20) { score+=1; breakdown.push('RR Yellow'); }
        
        if(obs.hr < 40 || obs.hr > 120) { score+=3; breakdown.push('HR Red'); }
        else if(obs.hr > 100) { score+=1; breakdown.push('HR Yellow'); }
        
        if(obs.sbp < 90 || obs.sbp > 160) { score+=3; breakdown.push('SBP Red'); }
        else if(obs.sbp > 150) { score+=1; breakdown.push('SBP Yellow'); }
        
        if(obs.dbp > 100) { score+=3; breakdown.push('DBP >100 (Red)'); }
        else if(obs.dbp >= 90) { score+=1; breakdown.push('DBP >90 (Yellow)'); }
        
        if(obs.sats < 95) { score+=3; breakdown.push('Sats <95 (Red)'); }
        if(obs.temp > 38 || obs.temp < 35) { score+=3; breakdown.push('Temp Red'); }
        else if(obs.temp > 37.5 || obs.temp < 36) { score+=1; breakdown.push('Temp Yellow'); }
        
        this.state.triage.newsScore = score;
        this.state.triage.newsBreakdown = breakdown;
    }

    calcTriagePriority() {
        let p = this.state.triage.discriminator ? this.state.triage.basePriority : 'Blue';
        let reasons = this.state.triage.discriminator ? [`MTS: ${this.state.triage.discriminator}`] : [];

        if (this.state.history.pain >= 7) {
            const isShocked = (this.state.obs.hr > 110) || (this.state.obs.sbp && this.state.obs.sbp < 90);
            if (['Yellow', 'Green', 'Blue'].includes(p)) {
                p = 'Orange';
                reasons.push(isShocked ? 'Severe Pain + Shock Signs' : 'Severe Pain (Priority Analgesia)');
            }
        }

        const score = this.state.triage.newsScore;
        const isPaeds = this.state.patient.age !== null && this.state.patient.age < 16;
        const isPreg = this.state.patient.pregnant;

        if (isPaeds) {
            if (score >= 7) { p = 'Red'; reasons.push(`PEWS ${score} (High Risk)`); }
            else if (score >= 5 && p !== 'Red') { p = 'Orange'; reasons.push(`PEWS ${score} (Mod Risk)`); }
        } else if (isPreg) {
            if (score >= 3) { p = 'Orange'; reasons.push(`MEOWS Abnormal (Score ${score})`); }
        } else {
            if (score >= 7) { p = 'Red'; reasons.push(`NEWS2 ${score} (≥7)`); }
            else if (score >= 5 && p !== 'Red') { p = 'Orange'; reasons.push(`NEWS2 ${score} (≥5 Sepsis?)`); }
            else if (score >= 3 && p === 'Green') { p = 'Yellow'; reasons.push(`NEWS2 ${score}`); }
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
        const timers = { 'Red': 'IMMEDIATE', 'Orange': '15 mins', 'Yellow': '60 mins', 'Green': '120 mins', 'Blue': '240 mins' };
        this.state.triage.timer = timers[p] || '--';

        let stream = 'Majors';
        if (p === 'Red' || p === 'Orange') stream = 'RESUS / MAJORS';
        else if (p === 'Green' || p === 'Blue') {
            if (this.state.patient.mobility === 'Walking') stream = 'See & Treat / Minors';
            else stream = 'Majors (Mobility)';
        }
        
        if (this.state.patient.age !== null && this.state.patient.age < 16) stream = `Paeds (${stream})`;
        if (this.state.patient.pregnant) stream = `Maternity / ${stream}`;
        this.state.triage.stream = stream;
    }

    cacheDOM() {
        this.dom = {
            complaintInput: document.getElementById('input-complaint'),
            discriminatorBox: document.getElementById('discriminator-container'),
            medsInput: document.getElementById('meds'),
            suggestionsBox: document.getElementById('meds-suggestions')
        };
    }

    bindEvents() {
        const bind = (id, key, path, transform = (v) => v) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', (e) => {
                const val = el.type === 'checkbox' ? e.target.checked : transform(e.target.value);
                const update = {};
                if (path === 'obs') update.obs = { [key]: val };
                else if (path === 'patient') update.patient = { [key]: val };
                else if (path === 'history') update.history = { [key]: val };
                this.setState(update);
            });
        };

        bind('obs-rr', 'rr', 'obs', parseFloat); 
        bind('obs-sats', 'sats', 'obs', parseFloat);
        bind('obs-sbp', 'sbp', 'obs', parseFloat); 
        bind('obs-dbp', 'dbp', 'obs', parseFloat); 
        bind('obs-hr', 'hr', 'obs', parseFloat);
        bind('obs-temp', 'temp', 'obs', parseFloat); 
        bind('obs-crt', 'crt', 'obs', parseFloat); 
        bind('obs-scale2', 'scale2', 'obs');
        bind('patient-dob', 'dob', 'patient'); 
        bind('patient-id', 'id', 'patient');
        bind('patient-weight', 'weight', 'patient', parseFloat);
        bind('patient-sex', 'sex', 'patient'); 
        bind('patient-mobility', 'mobility', 'patient');
        bind('check-pregnant', 'pregnant', 'patient');
        bind('allergies', 'allergies', 'history');
        bind('pmh', 'pmh', 'history');
        
        document.getElementById('plan-narrative').addEventListener('input', (e) => {
            this.setState({ history: { planNarrative: e.target.value } });
        });

        this.dom.medsInput.addEventListener('keyup', (e) => this.handleMedsAutocomplete(e));
        this.dom.medsInput.addEventListener('blur', () => setTimeout(() => this.dom.suggestionsBox.classList.add('hidden'), 200));
        this.dom.medsInput.addEventListener('input', (e) => this.setState({ history: { meds: e.target.value } }));

        document.querySelectorAll('.segmented-control button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parent = e.target.parentElement;
                if (!parent.id || parent.id.startsWith('toggle-')) return; 
                parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const val = e.target.dataset.value;
                if (parent.id === 'seg-avpu') this.setState({ obs: { avpu: val } });
                if (parent.id === 'seg-o2') this.setState({ obs: { o2: val } });
            });
        });

        this.dom.complaintInput.addEventListener('input', (e) => this.handleComplaint(e.target.value));

        document.querySelector('.dashboard').addEventListener('click', (e) => {
            if (e.target.dataset.action === 'setComplaint') {
                this.dom.complaintInput.value = e.target.dataset.val;
                this.handleComplaint(e.target.dataset.val);
            }
            if (e.target.dataset.action === 'quickText') {
                e.preventDefault();
                const target = document.getElementById(e.target.dataset.target);
                target.value = e.target.dataset.val;
                target.dispatchEvent(new Event('input')); 
            }
        });

        const btnBodyMap = document.getElementById('btn-body-map');
        const modalBodyMap = document.getElementById('modal-bodymap');
        btnBodyMap.addEventListener('click', () => modalBodyMap.classList.remove('hidden'));
        document.getElementById('btn-close-map').addEventListener('click', () => modalBodyMap.classList.add('hidden'));
        document.querySelectorAll('.map-zone').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.target.dataset.val;
                this.dom.complaintInput.value = val;
                this.handleComplaint(val);
                modalBodyMap.classList.add('hidden');
            });
        });

        document.getElementById('btn-sbar').addEventListener('click', () => {
            this.generateSBAR();
            document.getElementById('modal-sbar').classList.remove('hidden');
        });
        document.getElementById('btn-close-sbar').addEventListener('click', () => {
            document.getElementById('modal-sbar').classList.add('hidden');
        });

        const btnOverride = document.getElementById('btn-override-toggle');
        const panelOverride = document.getElementById('override-options');
        btnOverride.addEventListener('click', () => {
            const isHidden = panelOverride.classList.contains('hidden');
            panelOverride.classList.toggle('hidden');
            btnOverride.classList.toggle('active', isHidden);
            if (!isHidden) this.setState({ triage: { override: null } });
        });

        const updateOverride = () => {
            const level = document.getElementById('sel-override').value;
            const reason = document.getElementById('txt-override').value;
            if (reason) this.setState({ triage: { override: { level, reason } } });
        };
        document.getElementById('sel-override').addEventListener('change', updateOverride);
        document.getElementById('txt-override').addEventListener('input', updateOverride);

        document.getElementById('checkbox-theme').addEventListener('change', (e) => {
            if(e.target.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            }
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if(confirm("Start new patient? Unsaved data will be lost.")) window.location.reload();
        });

        document.getElementById('btn-copy').addEventListener('click', () => {
            const note = document.getElementById('epr-note');
            note.select();
            document.execCommand('copy');
            this.showToast('Note copied to clipboard');
        });

        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('modal-overlay').classList.add('hidden');
        });
    }

    handleMedsAutocomplete(e) {
        const val = e.target.value;
        const cursor = e.target.selectionStart;
        const textBefore = val.slice(0, cursor);
        const lastWord = textBefore.split(/[\s,\n]+/).pop();

        if (lastWord.length < 3) {
            this.dom.suggestionsBox.classList.add('hidden');
            return;
        }

        const matches = this.data.drugIndex.filter(d => d.toLowerCase().startsWith(lastWord.toLowerCase())).slice(0, 5);
        
        if (matches.length > 0) {
            this.dom.suggestionsBox.innerHTML = matches.map(m => `<div class="suggestion-item">${m}</div>`).join('');
            this.dom.suggestionsBox.classList.remove('hidden');
            this.dom.suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const wordToReplace = lastWord;
                    const newValue = val.slice(0, cursor - wordToReplace.length) + item.textContent + val.slice(cursor);
                    this.dom.medsInput.value = newValue + ', ';
                    this.dom.suggestionsBox.classList.add('hidden');
                    this.dom.medsInput.focus();
                    this.setState({ history: { meds: newValue } });
                });
            });
        } else {
            this.dom.suggestionsBox.classList.add('hidden');
        }
    }

    renderScreening() {
        const container = document.getElementById('screening-container');
        container.innerHTML = '';
        Object.entries(this.data.screening).forEach(([key, data]) => {
            const div = document.createElement('div');
            div.className = 'screening-item';
            div.id = `screen-${key}`;
            let html = `<span class="screening-title">${data.label}</span>`;
            if (data.options) {
                html += `<select id="screen-input-${key}" class="w-full"><option value="">Select...</option>`;
                data.options.forEach(opt => html += `<option value="${opt.val}">${opt.text}</option>`);
                html += `</select>`;
            } else if (data.yesNo) {
                html += `<div class="segmented-control" id="toggle-${key}">
                    <button type="button" data-val="No" class="active">No</button>
                    <button type="button" data-val="Yes">Yes</button>
                </div>`;
            }
            div.innerHTML = html;
            container.appendChild(div);
            
            const toggle = div.querySelector('.segmented-control');
            if(toggle) {
                toggle.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        this.renderNote(); 
                    });
                });
            } else {
                div.querySelector('select')?.addEventListener('change', () => this.renderNote());
            }
        });
    }

    renderScreeningDynamic() {
        const age = this.state.patient.age;
        const frailtyDiv = document.getElementById('screen-frailty');
        if(frailtyDiv) frailtyDiv.style.display = (age !== null && age >= 65) ? 'block' : 'none';
        const fallsDiv = document.getElementById('screen-falls');
        if(fallsDiv) fallsDiv.style.display = (age !== null && age >= 65) ? 'block' : 'none';
    }

    renderPainButtons() {
        const c = document.getElementById('pain-btn-container');
        c.innerHTML = '';
        for (let i = 0; i <= 10; i++) {
            const b = document.createElement('button');
            b.className = 'pain-btn';
            b.textContent = i;
            b.type = "button";
            b.onclick = () => {
                document.querySelectorAll('.pain-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                document.getElementById('pain-val').textContent = i;
                this.setState({ history: { pain: i } });
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

    handleComplaint(val) {
        const lowerVal = val.toLowerCase();
        if (lowerVal === 'headache' && !this.state.ui.redFlagChecked) {
             const check = confirm("⚠️ RED FLAG CHECK:\nIs there any history of trauma, fall, or sudden onset?");
             if (check) {
                 val = "Head Injury"; 
                 this.dom.complaintInput.value = val;
                 this.showToast('Switched to Head Injury Protocol', 'error');
             }
             this.state.ui.redFlagChecked = true;
        }

        this.setState({ history: { ...this.state.history, complaint: val } });
        
        const calcBox = document.getElementById('calculator-container');
        const calcData = this.data.calculators ? this.data.calculators[val] : null;
        
        if (calcData) {
            calcBox.classList.remove('hidden');
            let html = `<span class="calc-title">🧮 ${calcData.title}</span>`;
            calcData.criteria.forEach((c, idx) => {
                html += `<div class="calc-item"><label>${c.text}</label>
                         <input type="checkbox" data-score="${c.points}" class="calc-trigger"></div>`;
            });
            html += `<div class="calc-score-display">Score: <span id="calc-score-val">0</span></div>`;
            calcBox.innerHTML = html;
            
            const triggers = calcBox.querySelectorAll('.calc-trigger');
            triggers.forEach(t => t.addEventListener('change', () => {
                let s = 0;
                triggers.forEach(x => { if(x.checked) s += parseFloat(x.dataset.score); });
                document.getElementById('calc-score-val').textContent = s;
            }));
        } else {
            calcBox.classList.add('hidden');
        }

        if (!this.data.mtsFlowcharts[val]) return;

        const container = this.dom.discriminatorBox;
        container.innerHTML = '';
        
        const order = { "Red": 1, "Orange": 2, "Yellow": 3, "Green": 4, "Blue": 5 };
        const sorted = [...this.data.mtsFlowcharts[val]].sort((a,b) => order[a.priority] - order[b.priority]);

        sorted.forEach(item => {
            const div = document.createElement('div');
            div.className = `discriminator priority-${item.priority}`;
            div.innerHTML = `<span>${item.text}</span> <span style="font-weight:bold; opacity:0.6;">${item.priority}</span>`;
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
            if (proto.cannula) {
                const cDiv = document.createElement('div');
                cDiv.className = `cannula-badge cannula-${proto.cannula.color}`;
                cDiv.innerHTML = `
                    <div style="font-size:2rem; margin-right:15px;">💉</div>
                    <div>
                        <strong>Cannula: ${proto.cannula.status}</strong><br>
                        <small>${proto.cannula.reason} (${proto.cannula.size})</small>
                    </div>
                `;
                container.appendChild(cDiv);
            }

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

            const cats = [
                { key: 'bedside', icon: '🫀', label: 'Bedside' },
                { key: 'lab', icon: '🩸', label: 'Bloods' },
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
        } else {
            container.innerHTML = `<p class="placeholder-text">No specific protocol for "${complaint}"</p>`;
        }
    }

    render() {
        this.renderDemographics();
        this.renderNEWS2();
        this.renderPaedsSafety();
        this.renderPlan();
        this.renderScreeningDynamic(); 
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
        
        if (this.state.patient.pregnant || (this.state.patient.age !== null && this.state.patient.age < 16)) {
            // Special handling for MEOWS/PEWS rendering
            if(this.state.patient.pregnant) {
                const score = this.state.triage.newsScore;
                const el = document.createElement('div');
                el.className = `priority-badge ${score >= 3 ? 'priority-Red' : (score > 0 ? 'priority-Yellow' : 'priority-Green')}`;
                if(score >= 3) el.classList.add('pulse-alert');
                el.style.padding = '10px';
                el.style.fontSize = '1.1rem';
                el.textContent = `MEOWS Score: ${score}`;
                container.appendChild(el);
            } else if (this.state.patient.age < 16) {
                const score = this.state.triage.newsScore;
                const el = document.createElement('div');
                el.className = `priority-badge ${score >= 5 ? 'priority-Red' : (score >= 1 ? 'priority-Yellow' : 'priority-Green')}`;
                if(score >= 5) el.classList.add('pulse-alert');
                el.style.padding = '10px';
                el.style.fontSize = '1.1rem';
                el.textContent = `PEWS Score: ${score} (${this.state.triage.pewsGroup})`;
                container.appendChild(el);
            }
        } else {
            const score = this.state.triage.newsScore;
            const el = document.createElement('div');
            el.className = `priority-badge ${score >= 5 ? 'priority-Red' : (score >= 1 ? 'priority-Yellow' : 'priority-Green')}`;
            if(score >= 5) el.classList.add('pulse-alert');
            el.style.padding = '10px';
            el.style.fontSize = '1.1rem';
            el.textContent = `NEWS2 Score: ${score}`;
            container.appendChild(el);
        }

        const breakdownDiv = document.createElement('div');
        breakdownDiv.className = 'news-breakdown';
        this.state.triage.newsBreakdown.forEach(text => {
            const chip = document.createElement('span');
            chip.className = 'news-tag';
            if (text.includes('Red') || text.includes('+3')) chip.classList.add('high');
            else if (text.includes('Yellow') || text.includes('+')) chip.classList.add('positive');
            chip.textContent = text;
            breakdownDiv.appendChild(chip);
        });
        container.appendChild(breakdownDiv);
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
            ? `<strong>Weight ${weight}kg</strong> (${safeWeight}kg used for calcs)<br>Paracetamol: ${para}mg | Ibuprofen: ${ibu}mg`
            : `<span style="color:var(--red); font-weight:bold;">⚠️ Enter Weight for drug doses</span>`;

        pewsContent.innerHTML = '';
    }

    renderPlan() {
        const t = this.state.triage;
        const badge = document.getElementById('priority-display');
        
        badge.className = 'priority-badge';
        badge.classList.add(`priority-${t.finalPriority}`);
        if(t.finalPriority === 'Red') badge.classList.add('pulse-alert');
        
        badge.textContent = t.finalPriority.toUpperCase();
        document.getElementById('stream-display').textContent = `Stream: ${t.stream}`;
        document.getElementById('timer-display').textContent = `Target: ${t.timer}`;
        document.getElementById('priority-reasons').innerHTML = t.reasons.map(r => `<div>• ${r}</div>`).join('');
        
        const sepsisRisk = (t.newsScore >= 5 || t.reasons.some(r => r.toLowerCase().includes('sepsis')));
        document.getElementById('sepsis-actions').classList.toggle('hidden', !sepsisRisk);
    }

    renderNote() {
        const p = this.state.patient;
        const t = this.state.triage;
        const h = this.state.history;
        
        let txt = `TRIAGE NOTE - ${new Date().toLocaleString('en-GB')}\n`;
        txt += `ID: ${p.id || 'Unknown'} | ${p.age}y ${p.sex} | Mobility: ${p.mobility}\n`;
        txt += `Complaint: ${h.complaint} (${t.discriminator || 'Not defined'})\n`;
        txt += `Pain: ${h.pain}/10\n`;
        
        if (p.pregnant) txt += `MEOWS: ${t.newsScore} [${t.newsBreakdown.join(', ')}]\n`;
        else if (p.age >= 16) txt += `NEWS2: ${t.newsScore} [${t.newsBreakdown.join(', ')}]\n`;
        else txt += `PEWS: ${t.newsScore} (${t.pewsGroup}) [${t.newsBreakdown.join(', ')}]\n`;
        
        txt += `Obs: RR${this.state.obs.rr || '-'} Sat${this.state.obs.sats || '-'}${this.state.obs.o2} BP${this.state.obs.sbp || '-'}/${this.state.obs.dbp || '-'} HR${this.state.obs.hr || '-'} T${this.state.obs.temp || '-'} ${this.state.obs.avpu}\n`;
        
        txt += `\nOUTCOME: ${t.finalPriority.toUpperCase()}\n`;
        txt += `Stream: ${t.stream}\n`;
        if (t.reasons.length > 0) txt += `Reasons:\n- ${t.reasons.join('\n- ')}\n`;
        
        if(h.riskFlags && h.riskFlags.length > 0) {
            txt += `\n⚠️ CLINICAL ALERTS:\n- ${[...new Set(h.riskFlags)].join('\n- ')}`;
        }
        
        if(h.allergies) txt += `\nAllergies: ${h.allergies}`;
        if(h.pmh) txt += `\nPMH: ${h.pmh}`;
        if(h.meds) txt += `\nMeds: ${h.meds}`;
        
        const proto = this.data.protocols[h.complaint];
        if (proto && proto.cannula) {
             txt += `\n\nProtocol: ${h.complaint}`;
             txt += `\nCannula: ${proto.cannula.status} (${proto.cannula.reason})`;
        }

        if (this.state.actionsTaken.length > 0) {
            txt += `\nActions:\n- ${this.state.actionsTaken.join('\n- ')}\n`;
        }
        
        const getScreenVal = (id) => {
            const el = document.getElementById(id);
            if(el) return el.value;
            const toggle = document.querySelector(`#toggle-${id.replace('screen-input-', '')} .active`);
            if(toggle) return toggle.textContent;
            return null;
        }
        
        let screenTxt = '';
        Object.keys(this.data.screening).forEach(key => {
            const val = getScreenVal(`screen-input-${key}`) || getScreenVal(key);
            if(val && val !== 'No' && val !== 'Select...') {
                screenTxt += `\n${this.data.screening[key].label}: ${val}`;
            }
        });
        if(screenTxt) txt += `\n${screenTxt}`;

        if (h.planNarrative) {
            txt += `\n\nPLAN / NARRATIVE:\n${h.planNarrative}`;
        }
        
        document.getElementById('epr-note').value = txt;
    }

    generateSBAR() {
        const p = this.state.patient;
        const t = this.state.triage;
        const h = this.state.history;
        
        const s = `I have ${p.id || 'a patient'}, ${p.age}y ${p.sex}, presenting with ${h.complaint}. Priority ${t.finalPriority}.`;
        
        let b = `${h.pmh || 'Nil PMH'}. `;
        if(h.riskFlags.length > 0) b += `Alert: ${h.riskFlags.join(', ')}. `;
        if(h.anticoagulated) b += `On Anticoagulants. `;
        
        let a = '';
        if(p.pregnant) a = `MEOWS ${t.newsScore}. `;
        else if(p.age < 16) a = `PEWS ${t.newsScore}. `;
        else a = `NEWS2 ${t.newsScore}. `;
        
        if(t.newsScore > 0) a += `(${t.newsBreakdown.join(', ')}). `;
        if(h.pain > 0) a += `Pain ${h.pain}/10. `;
        
        let r = `Streamed to ${t.stream}. `;
        const proto = this.data.protocols[h.complaint];
        if(proto && proto.tests) {
            r += `Plan: ${proto.tests.bedside.join(', ')} & Bloods. `;
        }
        if(t.finalPriority === 'Red') r += `Requires immediate review.`;
        
        document.getElementById('sbar-s').textContent = s;
        document.getElementById('sbar-b').textContent = b;
        document.getElementById('sbar-a').textContent = a;
        document.getElementById('sbar-r').textContent = r;
    }

    debouncedSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveSession(), 1000);
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
        if(existingIndex >= 0) sessions.splice(existingIndex, 1);
        sessions.unshift(current); 
        if(sessions.length > 15) sessions.pop(); 
        localStorage.setItem('triage_history', JSON.stringify(sessions));
    }

    showToast(msg, type='info') {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = msg;
        if(type === 'error') el.style.background = 'var(--red)';
        container.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    initSpeech() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        document.querySelectorAll('.mic-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = e.currentTarget.dataset.target; 
                const targetEl = document.getElementById(targetId);
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.lang = 'en-GB';
                e.currentTarget.classList.add('listening');
                recognition.onresult = (event) => {
                    const text = event.results[0][0].transcript;
                    if(targetEl.tagName === 'TEXTAREA' && targetEl.value) targetEl.value += `. ${text}`;
                    else targetEl.value = text;
                    targetEl.dispatchEvent(new Event('input')); 
                    this.showToast('Dictation captured');
                };
                recognition.onerror = (err) => {
                    console.error(err);
                    e.currentTarget.classList.remove('listening');
                    this.showToast('Dictation failed', 'error');
                };
                recognition.onend = () => e.currentTarget.classList.remove('listening');
                recognition.start();
            });
        });
    }

    loadHistory() {
        document.getElementById('btn-history').addEventListener('click', () => {
            document.getElementById('history-sidebar').classList.add('open');
            this.renderHistoryList();
        });
        document.getElementById('btn-close-history').addEventListener('click', () => {
            document.getElementById('history-sidebar').classList.remove('open');
        });
    }

    renderHistoryList() {
        const list = document.getElementById('history-list');
        const sessions = JSON.parse(localStorage.getItem('triage_history') || '[]');
        list.innerHTML = '';
        if(sessions.length === 0) list.innerHTML = '<p class="text-muted">No recent patients locally stored.</p>';
        sessions.forEach(s => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.style.borderLeft = `5px solid var(--${s.priority})`;
            div.innerHTML = `
                <div style="font-weight:bold; font-size:1.1rem;">${s.id}</div>
                <div>${s.complaint || 'No complaint'}</div>
                <div class="text-muted" style="font-size:0.8rem; margin-top:5px; display:flex; justify-content:space-between;">
                    <span>${s.priority.toUpperCase()}</span>
                    <span>${s.time}</span>
                </div>
            `;
            div.onclick = () => {
                if(confirm("Load this patient? Unsaved data on current screen will be lost.")) {
                    this.state = s.data;
                    this.restoreUI();
                    document.getElementById('history-sidebar').classList.remove('open');
                    this.showToast('Patient loaded');
                }
            };
            list.appendChild(div);
        });
    }

    restoreUI() {
        const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val !== null ? val : ''; };
        const setCheck = (id, val) => { const el = document.getElementById(id); if(el) el.checked = !!val; };
        
        const { patient, obs, history, triage } = this.state;
        
        setVal('patient-id', patient.id); 
        setVal('patient-dob', patient.dob);
        setVal('patient-weight', patient.weight); 
        setVal('patient-sex', patient.sex);
        setVal('patient-mobility', patient.mobility); 
        setCheck('check-pregnant', patient.pregnant);
        
        setVal('obs-rr', obs.rr); 
        setVal('obs-sats', obs.sats); 
        setVal('obs-sbp', obs.sbp);
        setVal('obs-dbp', obs.dbp);
        setVal('obs-hr', obs.hr); 
        setVal('obs-temp', obs.temp); 
        setVal('obs-crt', obs.crt);
        setCheck('obs-scale2', obs.scale2);
        
        document.querySelectorAll('#seg-avpu button').forEach(b => b.classList.toggle('active', b.dataset.value === obs.avpu));
        document.querySelectorAll('#seg-o2 button').forEach(b => b.classList.toggle('active', b.dataset.value === obs.o2));
        
        setVal('input-complaint', history.complaint); 
        setVal('allergies', history.allergies); 
        setVal('pmh', history.pmh); 
        setVal('meds', history.meds);
        setVal('plan-narrative', history.planNarrative);
        
        document.querySelectorAll('.pain-btn').forEach(b => b.classList.toggle('active', parseInt(b.textContent) === history.pain));
        document.getElementById('pain-val').textContent = history.pain;

        const btnOverride = document.getElementById('btn-override-toggle');
        const panelOverride = document.getElementById('override-options');
        if(triage.override) {
            panelOverride.classList.remove('hidden');
            btnOverride.classList.add('active');
            setVal('sel-override', triage.override.level);
            setVal('txt-override', triage.override.reason);
        } else {
            panelOverride.classList.add('hidden');
            btnOverride.classList.remove('active');
        }
        
        this.handleComplaint(history.complaint); 
        this.render();
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new TriageApp(); });
