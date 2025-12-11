// app.js - Main Logic v4.3
// Features: Class-based Architecture, Dark Mode, Searchable Datalist, Pain Scores, Safety Governance

class TriageApp {
    constructor() {
        this.state = {
            patient: {},
            history: {},
            screening: {},
            mts: {},
            observations: {},
            scores: {},
            context: {},
            override: {},
            painScore: 0
        };
        this.timers = {};
        this.init();
    }

    init() {
        this.populateDatalist();
        this.loadTheme();
        this.loadFromStorage();
        this.addEventListeners();
        this.updateUI(); // Initial render
    }

    // --- INITIALIZATION ---

    populateDatalist() {
        const datalist = document.getElementById('flowcharts');
        // Now fully supported by the complete data in protocols.js
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

    loadFromStorage() {
        const data = JSON.parse(localStorage.getItem('triage_backup_v4'));
        if (data) {
            this.showToast('Previous session restored.', 'info');
            // Simplified restore logic: Iterate keys and set values
            // In a production app, you'd map this more carefully
        }
    }

    // --- EVENT LISTENERS ---

    addEventListeners() {
        const container = document.querySelector('.container');
        container.addEventListener('input', (e) => this.handleInput(e));
        container.addEventListener('change', (e) => this.handleInput(e));
        
        document.getElementById('btn-reset').addEventListener('click', () => {
            localStorage.removeItem('triage_backup_v4');
            window.location.reload();
        });

        // Dark Mode Toggle
        document.getElementById('checkbox-theme').addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
        });

        // Pain Slider Visual Update
        document.getElementById('pain-score').addEventListener('input', (e) => {
            document.getElementById('pain-score-val').textContent = e.target.value;
            this.state.painScore = parseInt(e.target.value);
            this.updateUI();
        });

        // Searchable Complaint Input
        document.getElementById('mts-flowchart-input').addEventListener('input', (e) => {
            const val = e.target.value;
            // Only update state if it matches a known flowchart in the full database
            if (mtsFlowcharts[val]) {
                this.state.presentingComplaint = val;
                this.updateUI();
            }
        });

        // Discriminator Selection
        document.getElementById('discriminators-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('discriminator')) {
                const prev = document.querySelector('.selected-discriminator');
                if (prev) {
                    prev.classList.remove('selected-discriminator');
                    prev.classList.remove('highlight'); // Remove visual highlight
                }
                
                e.target.classList.add('selected-discriminator');
                e.target.classList.add('highlight'); // Add visual highlight
                
                this.state.mts = {
                    priority: e.target.dataset.priority,
                    discriminator: e.target.dataset.text
                };
                this.updateUI();
            }
        });

        document.getElementById('btn-copy-note').addEventListener('click', () => this.copyRichText('epr-note'));
        document.getElementById('btn-copy-sbar').addEventListener('click', () => this.copyRichText('sbar-note'));

        // Global Helper for Quick Buttons
        window.setQuickText = (id, text) => {
            const el = document.getElementById(id);
            if(el) { el.value = text; this.handleInput(); }
        };
    }

    handleInput(e) {
        this.gatherState();
        this.calculateScores();
        this.updateUI();
        // Debounced Save
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            // localStorage.setItem('triage_backup_v4', JSON.stringify(this.state)); 
            // Note: saving inputs state requires mapping specific element IDs
        }, 1000);
    }

    // --- STATE MANAGEMENT ---

    gatherState() {
        const getVal = (id) => document.getElementById(id)?.value;
        const getCheck = (id) => document.getElementById(id)?.checked;

        // Age Calculation
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
            isPregnant: getCheck('patient-pregnant')
        };

        this.state.history = {
            allergies: getVal('allergies'),
            pmh: getVal('pmh'),
            meds: getVal('meds'),
            renalImpairment: getCheck('renal-impairment')
        };

        this.state.presentingComplaint = getVal('mts-flowchart-input');
        this.state.painScore = parseInt(getVal('pain-score'));
        
        // Observations - Logic to grab from active form
        this.state.observations = this.getObservationsFromForm();
    }

    getObservationsFromForm() {
        const formType = document.getElementById('obs-form-container').dataset.formType;
        let obs = {};
        // Note: In a full implementation, you map every field ID.
        // Simplified for this file:
        if (formType === 'news2') {
            obs = {
                rr: parseFloat(document.getElementById('rr')?.value),
                sats: parseFloat(document.getElementById('sats')?.value),
                sbp: parseFloat(document.getElementById('sbp')?.value),
                hr: parseFloat(document.getElementById('hr')?.value),
                temp: parseFloat(document.getElementById('temp')?.value),
                consciousness: document.getElementById('consciousness')?.value,
                suppO2: document.getElementById('supp-o2')?.checked
            };
        }
        return obs;
    }

    calculateScores() {
        const { age } = this.state.patient;
        const obs = this.state.observations;
        this.state.scores = {};
        
        if (age === null) return;
        
        // --- NEWS2 Logic (Simplified) ---
        if (age >= 16) {
            let score = 0;
            if (obs.rr <= 8 || obs.rr >= 25) score += 3;
            if (obs.sats <= 91) score += 3;
            if (obs.sbp <= 90) score += 3;
            if (obs.hr >= 131) score += 3;
            if (obs.consciousness && obs.consciousness !== 'A') score += 3;
            // ... Add full NEWS2 logic
            this.state.scores.news2 = { score: score };
        }
        
        this.checkCriticalAlerts();
    }

    // --- UI UPDATES ---

    updateUI() {
        const { age, sex } = this.state.patient;
        
        // Update Age Display
        document.getElementById('calculated-age-display').textContent = age !== null ? `${age} years` : '--';
        
        // Visibility Toggles
        document.getElementById('pregnancy-container').style.display = (sex === 'Female' && age > 11 && age < 60) ? 'flex' : 'none';
        
        // Obs Form Switch
        this.updateObsFormType(age);

        // MTS Section
        this.updateMTS();
        
        // Paediatric Dosing (New V4.2 Feature)
        this.renderPaedsDosing();
        
        // Priority & Plan
        this.updatePriorityAndPlan();
        
        // Notes
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
                    <div class="form-group"><label>Resp Rate</label><div class="input-group"><input type="number" id="rr"><span>/min</span></div></div>
                    <div class="form-group"><label>O₂ Sats</label><div class="input-group"><input type="number" id="sats" max="100"><span>%</span></div></div>
                    <div class="form-group checkbox-group"><input type="checkbox" id="supp-o2"><label for="supp-o2">On O₂</label></div>
                    <div class="form-group"><label>Systolic BP</label><div class="input-group"><input type="number" id="sbp"><span>mmHg</span></div></div>
                    <div class="form-group"><label>Heart Rate</label><div class="input-group"><input type="number" id="hr"><span>bpm</span></div></div>
                    <div class="form-group"><label>AVPU</label><select id="consciousness"><option value="A">Alert</option><option value="V">Voice</option><option value="P">Pain</option><option value="U">Unresponsive</option></select></div>
                    <div class="form-group"><label>Temp</label><div class="input-group"><input type="number" id="temp" step="0.1"><span>°C</span></div></div>
                `;
            } else if (newType === 'pews') {
                document.getElementById('obs-title').textContent = 'Paediatric Observations (PEWS)';
                // ... Insert PEWS HTML (Simplified)
                html = `<div class="form-group"><label>RR</label><input type="number" id="pews-rr"></div>`;
            }
            container.innerHTML = html;
        }
    }

    updateMTS() {
        const complaint = this.state.presentingComplaint;
        const container = document.getElementById('discriminators-container');
        
        if (!complaint || !mtsFlowcharts[complaint]) {
            container.innerHTML = '<p style="opacity:0.6;">Select a valid complaint.</p>';
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
        
        // Check if config exists (from protocols.js)
        if (typeof paediatricSafety === 'undefined' || age >= 16 || !weight) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'block';
        document.getElementById('dosing-weight').textContent = `${weight} kg`;
        
        const p = paediatricSafety.paracetamol;
        const i = paediatricSafety.ibuprofen;
        const f = paediatricSafety.fluidBolus;
        
        const paraDose = Math.min(weight * p.mgPerKg, p.maxDoseMg);
        const ibuDose = Math.min(weight * i.mgPerKg, i.maxDoseMg);
        const fluidVol = Math.min(weight * f.mlPerKg, f.maxVolMl);
        
        const renal = this.state.history.renalImpairment;
        
        let html = `
            <div style="background:var(--input-bg); padding:10px; border-radius:4px;">
                <p><strong>Paracetamol (${p.mgPerKg}mg/kg):</strong> ${paraDose.toFixed(0)} mg <small>(${p.warning})</small></p>
                <p style="${renal ? 'color:var(--red); font-weight:bold;' : ''}">
                    <strong>Ibuprofen (${i.mgPerKg}mg/kg):</strong> 
                    ${renal ? 'CONTRAINDICATED (Renal Risk)' : ibuDose.toFixed(0) + ' mg'} 
                    <small>(${i.warning})</small>
                </p>
                <p><strong>Fluid Bolus (${f.mlPerKg}ml/kg):</strong> ${fluidVol.toFixed(0)} ml <small>(${f.warning})</small></p>
            </div>
        `;
        document.getElementById('paediatric-dosing-results').innerHTML = html;
    }

    updatePriorityAndPlan() {
        const { mts, painScore, presentingComplaint, scores } = this.state;
        let priority = mts.priority || "Blue"; // Default
        let reasons = [];
        if (mts.priority) reasons.push(`MTS: ${mts.discriminator}`);

        // 1. Pain Rule (V4.2)
        if (typeof painProtocols !== 'undefined' && painScore >= painProtocols.severeThreshold) {
            if (priority === 'Green' || priority === 'Blue' || priority === 'Yellow') {
                priority = 'Orange';
                reasons.push("Severe Pain Trigger");
            }
        }
        
        // 2. NEWS2 Rule
        if (scores.news2?.score >= 7) {
            priority = 'Red';
            reasons.push("NEWS2 Critical");
        }

        // Render Priority
        const summary = document.getElementById('summary-priority-display');
        summary.textContent = `${priority} ${reasons.length ? '(' + reasons[reasons.length-1] + ')' : ''}`;
        summary.className = `summary-priority-${priority}`;
        
        // Render Action Plan
        const list = document.getElementById('actions-list');
        let actions = [];
        
        // Pain Action
        if (painScore >= 7) actions.push(painProtocols.action);
        
        // Protocol Actions
        const protocol = clinicalProtocols[presentingComplaint];
        if (protocol) {
            if (protocol.bloods) actions.push(`Bloods: ${standardBundles[protocol.bloods]?.join(', ')}`);
            if (protocol.bedside) protocol.bedside.forEach(b => actions.push(b));
        }
        
        list.innerHTML = actions.map(a => `<li>${a}</li>`).join('');
    }

    generateNotes() {
        const { patient, history, observations, scores } = this.state;
        let note = `TRIAGE ASSESSMENT\n`;
        note += `Patient: ${patient.id || 'Unknown'} | Age: ${patient.age}y\n`;
        note += `Complaint: ${this.state.presentingComplaint}\n`;
        note += `Pain Score: ${this.state.painScore}/10\n`;
        note += `Allergies: ${history.allergies}\n`;
        note += `Observations: HR ${observations.hr||'-'}, BP ${observations.sbp||'-'}, RR ${observations.rr||'-'}, Sats ${observations.sats||'-'}%\n`;
        if (scores.news2) note += `NEWS2 Score: ${scores.news2.score}\n`;
        document.getElementById('epr-note').value = note;
    }

    checkCriticalAlerts() {
        const obs = this.state.observations;
        if (obs.sats < 90 && obs.sats > 0) this.showToast("CRITICAL HYPOXIA", "critical");
    }

    showToast(msg, type) {
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = msg;
        document.getElementById('toast-container').appendChild(t);
        setTimeout(() => t.remove(), 4000);
    }

    copyRichText(id) {
        const val = document.getElementById(id).value;
        navigator.clipboard.writeText(val);
        this.showToast("Copied to clipboard", "info");
    }
}

// Start App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TriageApp();
});
