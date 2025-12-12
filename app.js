// app.js - Main Logic v5.1
// Features: Class-based Architecture, Visual EWS, Clinical Override, PAT Matrix Protocols

class TriageApp {
    constructor() {
        this.state = {
            patient: {},
            history: {},
            mts: {},
            observations: {},
            scores: {},
            presentingComplaint: '',
            painScore: 0,
            override: { active: false, priority: null, rationale: '' }
        };
        this.init();
    }

    init() {
        this.populateDatalist();
        this.loadTheme();
        this.addEventListeners();
        this.updateUI(); 
    }

    populateDatalist() {
        const datalist = document.getElementById('flowcharts');
        if (typeof mtsFlowcharts !== 'undefined') {
            Object.keys(mtsFlowcharts).sort().forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                datalist.appendChild(option);
            });
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('checkbox-theme').checked = true;
        }
    }

    // --- EVENT LISTENERS ---
    addEventListeners() {
        const container = document.querySelector('.container');
        container.addEventListener('input', (e) => this.handleInput(e));
        
        document.getElementById('btn-reset').addEventListener('click', () => {
            if(confirm("Start new patient? This will clear all data.")) window.location.reload();
        });

        document.getElementById('checkbox-theme').addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });

        document.getElementById('pain-score').addEventListener('input', (e) => {
            document.getElementById('pain-score-val').textContent = e.target.value;
            this.state.painScore = parseInt(e.target.value);
            this.updateUI();
        });

        document.getElementById('mts-flowchart-input').addEventListener('input', (e) => {
            const val = e.target.value;
            if (mtsFlowcharts[val]) {
                this.state.presentingComplaint = val;
                this.state.mts = {}; // Reset previous discriminator
                this.updateUI();
            }
        });

        document.getElementById('discriminators-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('discriminator')) {
                document.querySelectorAll('.discriminator').forEach(el => el.classList.remove('selected-discriminator', 'highlight'));
                e.target.classList.add('selected-discriminator', 'highlight');
                
                this.state.mts = {
                    priority: e.target.dataset.priority,
                    discriminator: e.target.dataset.text
                };
                this.updateUI();
            }
        });

        // Override Listeners
        document.getElementById('override-toggle').addEventListener('change', (e) => {
            this.state.override.active = e.target.checked;
            document.getElementById('override-controls').style.display = e.target.checked ? 'block' : 'none';
            this.updateUI();
        });

        document.getElementById('override-priority').addEventListener('change', (e) => {
            this.state.override.priority = e.target.value;
            this.updateUI();
        });

        document.getElementById('override-rationale').addEventListener('input', (e) => {
            this.state.override.rationale = e.target.value;
            this.generateNotes();
        });

        document.getElementById('btn-copy-note').addEventListener('click', () => this.copyRichText('epr-note'));
        
        window.setQuickText = (id, text) => {
            const el = document.getElementById(id);
            if(el) { el.value = text; this.handleInput(); }
        };
    }

    handleInput() {
        this.gatherState();
        this.calculateScores();
        this.updateUI();
    }

    // --- STATE & CALCULATIONS ---

    gatherState() {
        const getVal = (id) => document.getElementById(id)?.value;
        const getCheck = (id) => document.getElementById(id)?.checked;

        // Age
        const dob = getVal('patient-dob');
        let age = null;
        if (dob) {
            const d = new Date(dob);
            const now = new Date();
            age = now.getFullYear() - d.getFullYear();
            if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) {
                age--;
            }
        }

        this.state.patient = {
            id: getVal('patient-id'),
            dob: dob,
            age: age,
            weight: parseFloat(getVal('patient-weight')),
            sex: getVal('patient-sex'),
        };

        this.state.history = {
            allergies: getVal('allergies'),
            pmh: getVal('pmh'),
            meds: getVal('meds'),
            renalImpairment: getCheck('renal-impairment')
        };

        this.state.presentingComplaint = getVal('mts-flowchart-input');
        
        // Observations
        const formType = document.getElementById('obs-form-container').dataset.formType;
        if (formType === 'news2') {
            this.state.observations = {
                rr: parseFloat(getVal('rr')),
                sats: parseFloat(getVal('sats')),
                suppO2: getCheck('supp-o2'),
                sbp: parseFloat(getVal('sbp')),
                hr: parseFloat(getVal('hr')),
                consciousness: getVal('consciousness'),
                temp: parseFloat(getVal('temp')),
                scale2: getCheck('scale2-toggle')
            };
        }
    }

    calculateScores() {
        const { age } = this.state.patient;
        const obs = this.state.observations;
        this.state.scores = { news2: null };
        
        if (age === null) return;
        
        if (age >= 16 && obs.rr) {
            let total = 0;
            const rules = scoringRules.news2;
            
            const calc = (val, ruleSet) => {
                if(isNaN(val)) return 0;
                for (let r of ruleSet) {
                    if (val <= r.max) return r.score;
                }
                return 3;
            };

            total += calc(obs.rr, rules.rr);
            total += obs.scale2 ? calc(obs.sats, rules.sats2) : calc(obs.sats, rules.sats1);
            total += obs.suppO2 ? 2 : 0; 
            total += calc(obs.sbp, rules.sbp);
            total += calc(obs.hr, rules.hr);
            total += (obs.consciousness === 'A') ? 0 : 3;
            total += calc(obs.temp, rules.temp);

            this.state.scores.news2 = { score: total };
        }
    }

    // --- UI RENDERING ---

    updateUI() {
        const { age, sex } = this.state.patient;
        
        // 1. Demographics
        document.getElementById('calculated-age-display').textContent = age !== null ? `${age} years` : '--';
        document.getElementById('pregnancy-container').style.display = (sex === 'Female' && age > 11 && age < 60) ? 'flex' : 'none';
        
        // 2. Obs Form & Visuals
        this.updateObsFormType(age);
        if (age >= 16 && this.state.observations.rr) {
            this.renderVisualNEWS2();
        } else {
            document.getElementById('visual-ews-container').innerHTML = '';
            document.getElementById('ews-display-container').style.display = 'none';
        }

        // 3. MTS
        this.updateMTS();
        
        // 4. Paediatrics
        this.renderPaedsDosing();
        
        // 5. Priority & Plan
        this.updatePriorityAndPlan();
        
        // 6. Notes
        this.generateNotes();
    }

    updateObsFormType(age) {
        const container = document.getElementById('obs-form-container');
        let newType = 'none';
        if (age !== null) {
            newType = (age < 16) ? 'pews' : 'news2';
        }

        if (container.dataset.formType !== newType) {
            container.dataset.formType = newType;
            let html = '';
            if (newType === 'news2') {
                document.getElementById('obs-title').textContent = 'Physiological Observations (NEWS2)';
                html = `
                    <div class="form-group checkbox-group" style="margin-bottom:10px; border:1px solid var(--border-color); padding:5px;">
                        <input type="checkbox" id="scale2-toggle"><label for="scale2-toggle">Use Scale 2 (CO₂ Retainer)</label>
                    </div>
                    <div class="form-grid">
                        <div class="form-group"><label>Resp Rate</label><input type="number" id="rr"></div>
                        <div class="form-group"><label>O₂ Sats (%)</label><input type="number" id="sats"></div>
                        <div class="form-group checkbox-group"><input type="checkbox" id="supp-o2"><label for="supp-o2">On O₂</label></div>
                        <div class="form-group"><label>Systolic BP</label><input type="number" id="sbp"></div>
                        <div class="form-group"><label>Heart Rate</label><input type="number" id="hr"></div>
                        <div class="form-group"><label>AVPU</label><select id="consciousness"><option value="A">Alert</option><option value="V">Voice</option><option value="P">Pain</option><option value="U">Unresponsive</option></select></div>
                        <div class="form-group"><label>Temp (°C)</label><input type="number" id="temp" step="0.1"></div>
                    </div>
                `;
            } else if (newType === 'pews') {
                document.getElementById('obs-title').textContent = 'Paediatric Observations';
                html = `<p>Paediatric scoring is simplified in this demo version.</p>`;
            }
            container.innerHTML = html;
        }
    }

    renderVisualNEWS2() {
        const obs = this.state.observations;
        const score = this.state.scores.news2?.score || 0;
        const container = document.getElementById('visual-ews-container');
        const rules = scoringRules.news2;

        const createRow = (label, currentVal, ruleSet) => {
            if(currentVal === undefined || isNaN(currentVal)) return '';
            
            const boxes = ruleSet.map(bucket => {
                return `<div class="ews-box score-${bucket.score} ${this.isInBucket(currentVal, bucket, ruleSet) ? 'active-score' : ''}">
                            ${bucket.label}
                        </div>`;
            }).join('');

            return `<div class="ews-row">
                        <div class="ews-label">${label}</div>
                        <div class="ews-track">${boxes}</div>
                        <div class="ews-val">${currentVal}</div>
                    </div>`;
        };

        const satsRules = obs.scale2 ? rules.sats2 : rules.sats1;

        let html = `
            <div style="text-align:center; margin-bottom:10px;">
                <span class="ews-total-badge ${score >= 5 ? 'score-red' : 'score-green'}">TOTAL NEWS2: ${score}</span>
            </div>
            ${createRow('Resp Rate', obs.rr, rules.rr)}
            ${createRow('O2 Sats', obs.sats, satsRules)}
            ${createRow('Sys BP', obs.sbp, rules.sbp)}
            ${createRow('Heart Rate', obs.hr, rules.hr)}
            ${createRow('Temp', obs.temp, rules.temp)}
        `;
        
        container.innerHTML = html;
        document.getElementById('ews-display-container').style.display = 'block';
    }

    isInBucket(val, bucket, allBuckets) {
        const idx = allBuckets.indexOf(bucket);
        const prevMax = idx === 0 ? -Infinity : allBuckets[idx-1].max;
        return val > prevMax && val <= bucket.max;
    }

    updateMTS() {
        const complaint = this.state.presentingComplaint;
        const container = document.getElementById('discriminators-container');
        
        if (!complaint || !mtsFlowcharts[complaint]) {
            container.innerHTML = '<p style="opacity:0.6; padding:10px;">Select a valid complaint above to see discriminators.</p>';
            return;
        }

        if (container.dataset.complaint !== complaint) {
            container.dataset.complaint = complaint;
            container.innerHTML = '';
            mtsFlowcharts[complaint].forEach(disc => {
                const div = document.createElement('div');
                div.className = `discriminator priority-${disc.priority}`;
                div.textContent = disc.text;
                div.dataset.priority = disc.priority;
                div.dataset.text = disc.text;
                container.appendChild(div);
            });
        }
    }

    renderPaedsDosing() {
        const { age, weight } = this.state.patient;
        const card = document.getElementById('paediatric-dosing-card');
        
        if (age >= 16 || !weight) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'block';
        const p = paediatricSafety.paracetamol;
        const i = paediatricSafety.ibuprofen;
        
        const paraDose = Math.min(weight * p.mgPerKg, p.maxDoseMg);
        const ibuDose = Math.min(weight * i.mgPerKg, i.maxDoseMg);
        
        document.getElementById('paediatric-dosing-results').innerHTML = `
            <div class="dosing-grid">
                <div class="dose-box">
                    <strong>Paracetamol</strong><br>
                    <span class="dose-highlight">${paraDose.toFixed(0)} mg</span><br>
                    <small>max 1g</small>
                </div>
                <div class="dose-box">
                    <strong>Ibuprofen</strong><br>
                    <span class="dose-highlight">${ibuDose.toFixed(0)} mg</span><br>
                    <small>max 400mg</small>
                </div>
            </div>
        `;
    }

    updatePriorityAndPlan() {
        const { mts, painScore, presentingComplaint, scores, override } = this.state;
        
        // 1. Calculate Base Priority
        let priority = "Blue"; 
        let reasons = [];

        if (mts.priority) {
            priority = mts.priority;
            reasons.push(`MTS Discriminator: ${mts.discriminator}`);
        }

        // Pain Rule
        if (painScore >= painProtocols.severeThreshold) {
            if (['Green','Blue','Yellow'].includes(priority)) {
                priority = 'Orange';
                reasons.push("Severe Pain Score");
            }
        }
        
        // NEWS2 Rule
        if (scores.news2?.score >= 7) {
            priority = 'Red';
            reasons.push("NEWS2 Critical (≥7)");
        } else if (scores.news2?.score >= 5) {
            if (priority !== 'Red') priority = 'Orange';
            reasons.push("NEWS2 Warning (≥5)");
        }

        // 2. Apply Override
        let finalPriority = priority;
        
        if (override.active && override.priority) {
            finalPriority = override.priority;
            reasons.push(`CLINICAL OVERRIDE: ${override.rationale}`);
        }

        // 3. Render Priority
        const summary = document.getElementById('summary-priority-display');
        summary.textContent = `${finalPriority.toUpperCase()}`;
        summary.className = `summary-priority-${finalPriority}`;
        
        document.getElementById('priority-reasons').innerHTML = reasons.map(r => `<li>${r}</li>`).join('');

        // 4. Render Plan (Split by Do/Consider/Ask)
        const container = document.getElementById('actions-list-container');
        
        const protocol = clinicalProtocols[presentingComplaint];
        if (protocol) {
            let html = '';
            
            // "Do" Section (Green/Bold)
            if (protocol.do && protocol.do.length > 0) {
                html += `<div class="plan-section">
                            <strong style="color:var(--green);">DO (Immediate):</strong>
                            <ul>${protocol.do.map(item => `<li>${item}</li>`).join('')}</ul>
                         </div>`;
            }
            
            // "Consider" Section (Orange/Italic)
            if (protocol.consider && protocol.consider.length > 0) {
                html += `<div class="plan-section">
                            <strong style="color:var(--orange);">CONSIDER (Dependent):</strong>
                            <ul>${protocol.consider.map(item => `<li><em>${item}</em></li>`).join('')}</ul>
                         </div>`;
            }
            
            // "Ask" Section (Blue)
            if (protocol.ask && protocol.ask.length > 0) {
                html += `<div class="plan-section">
                            <strong style="color:var(--primary-color);">ASK (Clinical Questions):</strong>
                            <ul>${protocol.ask.map(item => `<li>${item}</li>`).join('')}</ul>
                         </div>`;
            }

            // Pain Protocol
            if (painScore >= 7) {
                html += `<div class="plan-section" style="border-top:1px dashed #ccc; margin-top:10px; padding-top:10px;">
                            <strong>PAIN MANAGEMENT:</strong>
                            <ul><li>${painProtocols.action}</li></ul>
                         </div>`;
            }

            container.innerHTML = html || '<p>No specific protocol defined.</p>';
        } else {
             container.innerHTML = '<p style="opacity:0.6;">Select a presenting complaint.</p>';
        }
    }

    generateNotes() {
        const { patient, history, observations, scores, mts, override } = this.state;
        const now = new Date();
        
        let note = `EMERGENCY TRIAGE ASSESSMENT\n`;
        note += `Date: ${now.toLocaleString()}\n`;
        note += `---------------------------\n`;
        note += `Patient: ${patient.id || 'Unknown'} | Age: ${patient.age}y | Sex: ${patient.sex}\n`;
        note += `Complaint: ${this.state.presentingComplaint}\n`;
        if(mts.discriminator) note += `Discriminator: ${mts.discriminator}\n`;
        note += `Pain Score: ${this.state.painScore}/10\n`;
        
        if(observations.rr) {
            note += `\nOBSERVATIONS (NEWS2: ${scores.news2?.score})\n`;
            note += `HR:${observations.hr} BP:${observations.sbp} RR:${observations.rr} Sats:${observations.sats}% Temp:${observations.temp}\n`;
        }

        note += `\nHISTORY\nAllergies: ${history.allergies}\nPMH: ${history.pmh}\nMeds: ${history.meds}\n`;
        
        const protocol = clinicalProtocols[this.state.presentingComplaint];
        if(protocol) {
            note += `\nPLAN (Protocol: ${this.state.presentingComplaint})\n`;
            if(protocol.do.length) note += `Requested: ${protocol.do.join(', ')}\n`;
            if(protocol.consider.length) note += `Considered: ${protocol.consider.join(', ')}\n`;
        }

        if(override.active) {
            note += `\n*** CLINICAL OVERRIDE ACTIVATED ***\n`;
            note += `Priority adjusted to: ${override.priority}\n`;
            note += `Rationale: ${override.rationale}\n`;
        }

        document.getElementById('epr-note').value = note;
    }

    copyRichText(id) {
        const el = document.getElementById(id);
        el.select();
        document.execCommand('copy');
        this.showToast("Copied to clipboard", "info");
    }

    showToast(msg, type) {
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = msg;
        document.getElementById('toast-container').appendChild(t);
        setTimeout(() => t.remove(), 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new TriageApp();
});
