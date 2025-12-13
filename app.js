// app.js v9.0 - Safe, Robust, Clinical Logic
// Depends on: clinicalData (protocols.js)

class TriageApp {
    constructor() {
        this.data = window.clinicalData;
        this.state = {
            patient: { id: '', dob: null, age: null, weight: null, sex: '', pregnant: false },
            obs: { rr: null, sats: null, o2: null, sbp: null, hr: null, avpu: null, temp: null, scale2: false },
            history: { complaint: '', pain: 0, allergies: '', pmh: '', meds: '' },
            triage: { discriminator: null, priority: null, reasons: [], override: null, newsScore: 0 },
            conditionals: [],
            sepsisAlertShown: false
        };
        
        this.dom = {}; // Cache DOM elements
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.populateDatalist();
        this.loadTheme();
        this.renderScreening(); 
    }

    cacheDOM() {
        // Helper to grab by data-js attribute for decoupling CSS classes from JS hooks
        const get = (id) => document.querySelector(`[data-js="${id}"]`);
        this.dom = {
            dob: get('patient-dob'),
            weight: get('patient-weight'),
            sex: get('patient-sex'),
            ageDisplay: document.getElementById('calculated-age-display'),
            femaleSection: document.getElementById('female-health-section'),
            
            // Obs
            rr: get('obs-rr'), sats: get('obs-sats'), o2: get('obs-o2'),
            sbp: get('obs-sbp'), hr: get('obs-hr'), avpu: get('obs-avpu'),
            temp: get('obs-temp'), scale2: get('obs-scale2'),
            
            // History
            complaint: get('input-complaint'),
            
            // Output
            discriminatorBox: document.getElementById('discriminator-container'),
            priorityBadge: document.getElementById('priority-display'),
            reasonsList: document.getElementById('priority-reasons'),
            newsContainer: document.getElementById('visual-ews-container'),
            note: document.getElementById('epr-note')
        };
    }

    bindEvents() {
        // Demographics Inputs
        ['dob', 'weight', 'sex'].forEach(k => {
            this.dom[k]?.addEventListener('change', () => this.handleDemographics());
        });
        
        // Obs Inputs (Debounced)
        const obsKeys = ['rr', 'sats', 'o2', 'sbp', 'hr', 'avpu', 'temp', 'scale2'];
        obsKeys.forEach(k => {
            const el = this.dom[k];
            if(el) el.addEventListener('input', () => this.handleObs());
        });

        // Complaint Search
        this.dom.complaint.addEventListener('input', (e) => this.handleComplaint(e.target.value));

        // Pain Buttons
        document.getElementById('pain-btn-container').addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') {
                document.querySelectorAll('.pain-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.history.pain = parseInt(e.target.dataset.val);
                document.getElementById('pain-val').textContent = this.state.history.pain;
                this.calcTriage();
            }
        });

        // Theme Toggle
        document.getElementById('checkbox-theme').addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });

        // Override
        document.querySelector('[data-js="check-override"]').addEventListener('change', (e) => {
            document.getElementById('override-options').classList.toggle('hidden', !e.target.checked);
            this.calcTriage();
        });
        document.querySelector('[data-js="sel-override"]').addEventListener('change', () => this.calcTriage());

        // Copy Note
        document.getElementById('btn-copy').addEventListener('click', () => {
            this.dom.note.select();
            document.execCommand('copy');
            this.showToast('Copied to clipboard', 'success');
        });
        
        // Modal Close
        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('modal-overlay').classList.add('hidden');
        });

        // Reset
        document.getElementById('btn-reset').addEventListener('click', () => {
             if(confirm("Start new patient?")) location.reload();
        });
    }

    handleDemographics() {
        const dobVal = this.dom.dob.value;
        if(dobVal) {
            const dob = new Date(dobVal);
            const diff = Date.now() - dob.getTime();
            const ageDate = new Date(diff);
            this.state.patient.age = Math.abs(ageDate.getUTCFullYear() - 1970);
            this.dom.ageDisplay.textContent = `Age: ${this.state.patient.age}`;
            
            // Safety: Disable NEWS2 for under 16
            const isPaeds = this.state.patient.age < 16;
            document.getElementById('news2-disclaimer').classList.toggle('hidden', !isPaeds);
            document.getElementById('obs-form').style.opacity = isPaeds ? '0.3' : '1';
            document.getElementById('obs-form').style.pointerEvents = isPaeds ? 'none' : 'auto';
            if(isPaeds) {
                this.dom.newsContainer.innerHTML = '';
                this.state.triage.newsScore = 0;
            }
        }

        const sex = this.dom.sex.value;
        this.state.patient.sex = sex;
        
        // Pregnancy Section Logic
        const isFemaleRepro = sex === 'Female' && this.state.patient.age >= 12 && this.state.patient.age <= 55;
        this.dom.femaleSection.classList.toggle('hidden', !isFemaleRepro);
        
        this.renderScreening();
        this.renderPaedsSafety();
        this.generateNote();
    }

    handleObs() {
        // Clamp and Sanitise
        const val = (id) => {
            const el = this.dom[id];
            if (!el || el.value === "") return null;
            let v = parseFloat(el.value);
            // Safety Clamping
            if (id === 'sats' && v > 100) v = 100;
            if (id === 'hr' && v > 300) v = 300;
            return v;
        };

        this.state.obs = {
            rr: val('rr'), sats: val('sats'), o2: this.dom.o2.value || null,
            sbp: val('sbp'), hr: val('hr'), avpu: this.dom.avpu.value || null,
            temp: val('temp'), scale2: this.dom.scale2.checked
        };

        if (this.state.patient.age >= 16) {
            this.renderVisualNEWS2();
        }
        this.calcTriage();
    }

    handleComplaint(val) {
        if (!this.data.mtsFlowcharts[val]) return;
        this.state.history.complaint = val;
        
        // Render Discriminators safely
        const container = this.dom.discriminatorBox;
        container.innerHTML = ''; // Clear current
        
        // SORT: Red -> Orange -> Yellow -> Green -> Blue
        const priorityOrder = { "Red": 1, "Orange": 2, "Yellow": 3, "Green": 4, "Blue": 5 };
        const sorted = [...this.data.mtsFlowcharts[val]].sort((a,b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        sorted.forEach(item => {
            const div = document.createElement('div');
            div.className = `discriminator priority-${item.priority}`;
            div.textContent = item.text;
            div.onclick = () => {
                // Deselect others
                Array.from(container.children).forEach(c => c.classList.remove('selected'));
                div.classList.add('selected');
                this.state.triage.discriminator = item.text;
                this.state.triage.priority = item.priority; // Base MTS priority
                this.calcTriage();
            };
            container.appendChild(div);
        });
        
        this.renderProtocolActions();
        this.generateNote();
    }

    renderVisualNEWS2() {
        const obs = this.state.obs;
        if (obs.rr === null || obs.hr === null) return; // Wait for data
        
        const container = this.dom.newsContainer;
        container.innerHTML = '';
        
        let totalScore = 0;
        const rules = this.data.scoring.news2;
        
        const buildRow = (label, value, bucketArray) => {
            if (value === null) return;
            const row = document.createElement('div');
            row.className = 'ews-row';
            
            const key = document.createElement('div');
            key.className = 'ews-key';
            key.textContent = label;
            row.appendChild(key);

            const track = document.createElement('div');
            track.className = 'ews-bar';
            
            // Logic: iterate buckets. If value matches bucket range, add score.
            let matched = false;
            let currentBucketScore = 0;
            
            // To visualize nicely, we just render the cells colored
            // And add the 'active' class to the correct one.
            
            bucketArray.forEach((bucket, index) => {
                const c = document.createElement('div');
                c.className = `ews-cell cell-${bucket.score}`;
                c.textContent = bucket.label;
                
                // Determining range
                const prevMax = index === 0 ? -999 : bucketArray[index-1].max;
                
                if (!matched && value <= bucket.max && value > prevMax) {
                    c.classList.add('active');
                    currentBucketScore = bucket.score;
                    matched = true;
                }
                track.appendChild(c);
            });
            
            totalScore += currentBucketScore;
            row.appendChild(track);
            container.appendChild(row);
        };
        
        // Use Scale 2 rules if checked
        buildRow('RR', obs.rr, rules.rr);
        buildRow('SpO2', obs.sats, obs.scale2 ? rules.sats2 : rules.sats1);
        buildRow('BP', obs.sbp, rules.sbp);
        buildRow('HR', obs.hr, rules.hr);
        buildRow('Temp', obs.temp, rules.temp);
        
        // AVPU & O2 Score
        if(obs.avpu && obs.avpu !== 'A') totalScore += 3;
        if(obs.o2 === 'O2') totalScore += 2;
        
        const scoreDiv = document.createElement('div');
        scoreDiv.style.fontWeight = 'bold';
        scoreDiv.style.textAlign = 'center';
        scoreDiv.style.marginTop = '5px';
        scoreDiv.style.padding = '5px';
        scoreDiv.style.background = totalScore >= 5 ? 'var(--red)' : 'var(--green)';
        scoreDiv.style.color = 'white';
        scoreDiv.style.borderRadius = '4px';
        scoreDiv.textContent = `NEWS2 Total: ${totalScore}`;
        container.prepend(scoreDiv);
        
        // Sepsis Trigger
        if (totalScore >= 5) this.triggerSepsisModal(totalScore);
        
        this.state.triage.newsScore = totalScore;
    }

    triggerSepsisModal(score) {
        if(this.state.sepsisAlertShown) return; // Don't spam
        const modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = "SEPSIS ALERT (NEWS2 ≥ 5)";
        document.getElementById('modal-message').innerHTML = `
            Patient has a NEWS2 score of <strong>${score}</strong>.<br><br>
            1. Is there a likely source of infection?<br>
            2. Are there Red Flags present?<br><br>
            <strong>If YES, start Sepsis 6 immediately.</strong>
        `;
        modal.classList.remove('hidden');
        this.state.sepsisAlertShown = true;
    }

    renderScreening() {
        const container = document.getElementById('screening-container');
        container.innerHTML = '';
        const age = this.state.patient.age;
        if(age === null) return;

        // Frailty
        if (age >= 65) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `<label>Frailty (Silver Book)</label>`;
            const sel = document.createElement('select');
            sel.innerHTML = '<option value="">Select CFS...</option>';
            this.data.screening.frailty.options.forEach(opt => {
                sel.add(new Option(opt.text, opt.val));
            });
            div.appendChild(sel);
            container.appendChild(div);
        }

        // Alcohol (Dismissible)
        const alcDiv = document.createElement('div');
        alcDiv.className = 'form-group';
        alcDiv.style.background = 'rgba(0,0,0,0.02)';
        alcDiv.style.padding = '10px';
        alcDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <label>AUDIT-C (Alcohol)</label>
                <button class="btn-tiny" style="color:red;" onclick="this.parentElement.parentElement.remove()">Not Relevant (X)</button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px;">
               <select id="audit1"><option>Freq?</option><option value="0">Never</option><option value="4">4+/wk</option></select>
               <select id="audit2"><option>Units?</option><option value="0">1-2</option><option value="4">10+</option></select>
               <select id="audit3"><option>Binge?</option><option value="0">Never</option><option value="4">Daily</option></select>
            </div>`;
        container.appendChild(alcDiv);
    }
    
    renderPaedsSafety() {
        const age = this.state.patient.age;
        const weight = parseFloat(this.dom.weight.value);
        const panel = document.getElementById('paeds-panel');
        const content = document.getElementById('paeds-content');
        
        if (age >= 16 || !weight) {
            panel.style.display = 'none';
            return;
        }
        
        panel.style.display = 'block';
        const safeWeight = Math.min(weight, this.data.paedsSafety.weightCapKg);
        const p = this.data.paedsSafety.paracetamol;
        const i = this.data.paedsSafety.ibuprofen;
        
        const pDose = Math.min(safeWeight * p.mgPerKg, p.maxDoseMg);
        const iDose = Math.min(safeWeight * i.mgPerKg, i.maxDoseMg);
        
        let html = `<p style="color:var(--orange); font-weight:bold;">${this.data.paedsSafety.disclaimer}</p>`;
        if (weight > 50) html += `<p style="color:var(--red); font-weight:bold;">⚠️ Weight > 50kg. Adult dosing applies.</p>`;
        else {
            html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div style="background:rgba(0,0,0,0.05); padding:10px; border-radius:4px; text-align:center;">
                    <strong>Paracetamol</strong><br>
                    <span style="font-size:1.2rem; color:var(--primary); font-weight:bold;">${pDose.toFixed(0)} mg</span><br>
                    <small>QDS (Max 1g)</small>
                </div>
                <div style="background:rgba(0,0,0,0.05); padding:10px; border-radius:4px; text-align:center;">
                    <strong>Ibuprofen</strong><br>
                    <span style="font-size:1.2rem; color:var(--primary); font-weight:bold;">${iDose.toFixed(0)} mg</span><br>
                    <small>TDS (Max 400mg)</small>
                </div>
            </div>`;
        }
        content.innerHTML = html;
    }

    renderProtocolActions() {
        const proto = this.data.protocols[this.state.history.complaint];
        const container = document.getElementById('protocol-actions');
        container.innerHTML = '';
        
        if (!proto) {
            container.innerHTML = '<p class="placeholder-text">No specific protocol logic loaded.</p>';
            return;
        }
        
        const ul = document.createElement('ul');
        proto.do.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item}</strong>`;
            ul.appendChild(li);
        });
        if(proto.consider) {
            proto.consider.forEach(item => {
                const li = document.createElement('li');
                li.style.color = 'var(--secondary)';
                li.innerHTML = `Consider: <em>${item}</em>`;
                ul.appendChild(li);
            });
        }
        container.appendChild(ul);
    }

    calcTriage() {
        // 1. Base MTS
        let p = this.state.triage.priority || 'Blue';
        let reasons = [];
        if (this.state.triage.discriminator) reasons.push(`MTS: ${this.state.triage.discriminator}`);
        
        // 2. Modifiers
        // Pain
        if (this.state.history.pain >= 7) {
            // Upgrade to Orange if currently lower
            if (['Yellow', 'Green', 'Blue'].includes(p)) {
                p = 'Orange';
                reasons.push('Severe Pain (Score 7+)');
            }
        }
        
        // NEWS2 (Adults)
        if (this.state.patient.age >= 16 && this.state.triage.newsScore >= 7) {
            p = 'Red';
            reasons.push('NEWS2 ≥ 7');
        } else if (this.state.patient.age >= 16 && this.state.triage.newsScore >= 5 && p !== 'Red') {
            p = 'Orange';
            reasons.push('NEWS2 ≥ 5');
        }
        
        // 3. Override
        const ovCheck = document.querySelector('[data-js="check-override"]');
        if (ovCheck && ovCheck.checked) {
            const ovSel = document.querySelector('[data-js="sel-override"]').value;
            if(ovSel) {
                p = ovSel;
                reasons.push(`CLINICAL OVERRIDE: ${document.querySelector('[data-js="txt-override"]').value}`);
            }
        }

        // Render
        const badge = this.dom.priorityBadge;
        badge.className = `priority-badge priority-${p}`;
        badge.textContent = p.toUpperCase();
        
        this.dom.reasonsList.innerHTML = reasons.map(r => `<div>• ${r}</div>`).join('');
        this.generateNote();
    }

    generateNote() {
        const s = this.state;
        let t = `TRIAGE NOTE - ${new Date().toLocaleString()}\n`;
        t += `ID: ${document.getElementById('patient-id').value} | Age: ${s.patient.age || '?'} | Sex: ${s.patient.sex}\n`;
        t += `Complaint: ${s.history.complaint} (${s.triage.discriminator || 'Not selected'})\n`;
        if(s.patient.age >= 16) t += `NEWS2: ${s.triage.newsScore || '-'} (RR${s.obs.rr} O2%${s.obs.sats} BP${s.obs.sbp} HR${s.obs.hr} ${s.obs.avpu})\n`;
        else t += `Paeds Obs: RR${s.obs.rr} O2%${s.obs.sats} BP${s.obs.sbp} HR${s.obs.hr} ${s.obs.avpu}\n`;
        
        t += `Pain: ${s.history.pain}/10\n`;
        t += `Outcome: ${this.dom.priorityBadge.textContent}\n`;
        
        // Add Allergies/PMH if present
        const alg = document.getElementById('allergies').value;
        if(alg) t += `Allergies: ${alg}\n`;
        
        this.dom.note.value = t;
    }
    
    // Helpers
    populateDatalist() {
        const dl = document.getElementById('flowcharts');
        if(!this.data || !this.data.mtsFlowcharts) return;
        Object.keys(this.data.mtsFlowcharts).sort().forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            dl.appendChild(opt);
        });
    }

    setComplaint(c) {
        this.dom.complaint.value = c;
        this.handleComplaint(c);
    }
    
    setQuickText(id, txt) {
        const el = document.querySelector(`[data-js="${id}"]`);
        if(el) {
            el.value = txt;
            el.dispatchEvent(new Event('input')); // Trigger update
        }
    }
    
    showToast(msg, type) {
        const t = document.createElement('div');
        t.textContent = msg;
        t.style.background = type === 'success' ? 'var(--green)' : 'var(--red)';
        t.style.color = 'white';
        t.style.padding = '10px 20px';
        t.style.borderRadius = '4px';
        t.style.marginTop = '10px';
        t.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        t.style.fontWeight = 'bold';
        
        const container = document.getElementById('toast-container');
        container.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }
    
    loadTheme() {
         if(localStorage.getItem('theme') === 'dark') {
             document.getElementById('checkbox-theme').checked = true;
             document.documentElement.setAttribute('data-theme', 'dark');
         }
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => { window.app = new TriageApp(); });
