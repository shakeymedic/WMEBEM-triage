// app.js - Main Logic v8.0 (Integrated)
// Features: Class-based Architecture, Smart Opportunistic Screening, Smart Logic Tags, Visual EWS

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
            override: { active: false, priority: null, rationale: '' },
            activeConditionals: [],
            smartTags: {}, // detected keywords like 'anticoagulant', 'penicillin'
            screening: { hivOptOut: false, auditScore: 0 }
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

    addEventListeners() {
        const container = document.querySelector('.container');
        container.addEventListener('input', (e) => this.handleInput(e));
        
        document.getElementById('btn-reset').addEventListener('click', () => {
            if(confirm("Start new patient?")) window.location.reload();
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
                this.state.mts = {};
                this.state.activeConditionals = [];
                this.updateUI();
            }
        });

        document.getElementById('discriminators-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('discriminator')) {
                document.querySelectorAll('.discriminator').forEach(el => el.classList.remove('selected-discriminator', 'highlight'));
                e.target.classList.add('selected-discriminator', 'highlight');
                this.state.mts = { priority: e.target.dataset.priority, discriminator: e.target.dataset.text };
                this.updateUI();
            }
        });

        // HIV Opt-Out Logic
        document.getElementById('btn-hiv-optout').addEventListener('click', () => {
            this.state.screening.hivOptOut = !this.state.screening.hivOptOut;
            const btn = document.getElementById('btn-hiv-optout');
            const reason = document.getElementById('hiv-optout-reason');
            const check = document.getElementById('hiv-test-agreed');
            
            if(this.state.screening.hivOptOut) {
                btn.textContent = "Cancel Opt-Out";
                btn.style.borderColor = "var(--red)";
                btn.style.color = "var(--red)";
                reason.style.display = 'block';
                check.checked = false;
            } else {
                btn.textContent = "Patient Opted Out";
                btn.style.borderColor = "var(--primary-color)";
                btn.style.color = "var(--primary-color)";
                reason.style.display = 'none';
                check.checked = true;
            }
            this.generateNotes();
        });

        // AUDIT-C Logic
        ['audit-1','audit-2','audit-3'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.calcAuditC());
        });

        // Smoker Logic
        document.getElementById('patient-smoker').addEventListener('change', (e) => {
            document.getElementById('smoker-advice').style.display = e.target.checked ? 'block' : 'none';
        });

        // Dynamic Questions Checklist
        document.getElementById('actions-list-container').addEventListener('change', (e) => {
            if (e.target.classList.contains('conditional-checkbox')) {
                const testToAdd = e.target.dataset.add;
                if (e.target.checked) this.state.activeConditionals.push(testToAdd);
                else this.state.activeConditionals = this.state.activeConditionals.filter(t => t !== testToAdd);
                this.updatePriorityAndPlan();
                this.generateNotes();
            }
        });

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

    calcAuditC() {
        const s1 = parseInt(document.getElementById('audit-1').value);
        const s2 = parseInt(document.getElementById('audit-2').value);
        const s3 = parseInt(document.getElementById('audit-3').value);
        const score = s1 + s2 + s3;
        this.state.screening.auditScore = score;
        
        const resDiv = document.getElementById('audit-result');
        resDiv.textContent = `Score: ${score}/12`;
        if (score >= 5) {
            resDiv.innerHTML += ` <span style="color:var(--orange); font-weight:bold;">(Positive - Give Brief Advice)</span>`;
        }
        this.generateNotes();
    }

    handleInput() {
        this.gatherState();
        this.calculateScores();
        this.updateUI();
    }

    gatherState() {
        const getVal = (id) => document.getElementById(id)?.value;
        const getCheck = (id) => document.getElementById(id)?.checked;

        const dob = getVal('patient-dob');
        let age = null;
        if (dob) {
            const d = new Date(dob);
            const now = new Date();
            age = now.getFullYear() - d.getFullYear();
            if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
        }

        this.state.patient = {
            id: getVal('patient-id'),
            dob: dob,
            age: age,
            weight: parseFloat(getVal('patient-weight')),
            sex: getVal('patient-sex'),
        };

        const meds = getVal('meds') || "";
        const allergies = getVal('allergies') || "";
        const pmh = getVal('pmh') || "";

        this.state.history = { allergies, pmh, meds, renalImpairment: getCheck('renal-impairment') };
        
        // --- SMART LOGIC ---
        this.state.smartTags = {};
        if (/warfarin|apixiban|rivaroxaban|edoxaban|dabigatran|heparin|blood\s*thinner|doac/i.test(meds)) this.state.smartTags.anticoagulant = true;
        if (/penicillin|amoxicillin|co-amoxiclav|augmentin/i.test(allergies)) this.state.smartTags.penicillinAllergy = true;
        if (/chemo|immunocompromised|neutropen/i.test(pmh + meds)) this.state.smartTags.immunocompromised = true;
        
        // Alcohol Trigger
        const complaint = getVal('mts-flowchart-input') || "";
        if (screeningRules.alcohol.triggerKeywords.some(kw => (pmh + meds + complaint).toLowerCase().includes(kw))) {
            this.state.smartTags.alcohol = true;
        }

        this.state.presentingComplaint = complaint;
        
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
            const rules = scoringRulesData.news2;
            const calc = (val, ruleSet) => {
                if(isNaN(val)) return 0;
                for (let r of ruleSet) { if (val <= r.max) return r.score; }
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

    updateUI() {
        const { age, sex } = this.state.patient;
        document.getElementById('calculated-age-display').textContent = age !== null ? `${age} years` : '--';
        document.getElementById('pregnancy-container').style.display = (sex === 'Female' && age > 11 && age < 60) ? 'flex' : 'none';
        
        this.updateObsFormType(age);
        if (age >= 16 && this.state.observations.rr) this.renderVisualNEWS2();
        else document.getElementById('visual-ews-container').innerHTML = '';

        this.updateScreeningVisibility(age);
        this.updateMTS();
        this.renderPaedsDosing();
        this.updatePriorityAndPlan();
        this.generateNotes();
    }

    updateScreeningVisibility(age) {
        // HIV: Age 16-65
        document.getElementById('hiv-screen').style.display = (age >= screeningRules.hiv.minAge && age <= screeningRules.hiv.maxAge) ? 'block' : 'none';
        
        // Frailty: Age >= 65
        document.getElementById('frailty-screen').style.display = (age >= screeningRules.frailty.minAge) ? 'block' : 'none';
        
        // Alcohol: Smart Tag or Manual
        document.getElementById('alcohol-screen').style.display = this.state.smartTags.alcohol ? 'block' : 'none';
        
        // ISTV: Violence Tag
        const isViolence = screeningRules.violence.complaints.includes(this.state.presentingComplaint);
        document.getElementById('istv-screen').style.display = isViolence ? 'block' : 'none';
    }

    updateObsFormType(age) {
        const container = document.getElementById('obs-form-container');
        let newType = 'none';
        if (age !== null) newType = (age < 16) ? 'pews' : 'news2';

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
                    </div>`;
            } else if (newType === 'pews') {
                document.getElementById('obs-title').textContent = 'Paediatric Observations';
                html = `<p>Paediatric scoring is simplified in this demo.</p>`;
            }
            container.innerHTML = html;
        }
    }

    renderVisualNEWS2() {
        const obs = this.state.observations;
        const score = this.state.scores.news2?.score || 0;
        const container = document.getElementById('visual-ews-container');
        const rules = scoringRulesData.news2;

        const createRow = (label, currentVal, ruleSet) => {
            if(currentVal === undefined || isNaN(currentVal)) return '';
            const boxes = ruleSet.map(bucket => {
                const isActive = this.isInBucket(currentVal, bucket, ruleSet);
                return `<div class="ews-box score-${bucket.score} ${isActive ? 'active-score' : ''}">${bucket.label}</div>`;
            }).join('');
            return `<div class="ews-row"><div class="ews-label">${label}</div><div class="ews-track">${boxes}</div><div class="ews-val">${currentVal}</div></div>`;
        };
        const satsRules = obs.scale2 ? rules.sats2 : rules.sats1;
        let html = `
            <div style="text-align:center; margin-bottom:10px;">
                <span class="ews-total-badge ${score >= 5 ? 'score-red' : 'score-green'}">TOTAL NEWS2: ${score}</span>
            </div>
            ${createRow('RR', obs.rr, rules.rr)}
            ${createRow('Sats', obs.sats, satsRules)}
            ${createRow('SBP', obs.sbp, rules.sbp)}
            ${createRow('HR', obs.hr, rules.hr)}
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
        const protocol = clinicalProtocols[complaint];
        if (!complaint || !mtsFlowcharts[complaint]) { container.innerHTML = '<p style="opacity:0.6; padding:10px;">Select a complaint.</p>'; return; }
        
        let descHtml = '';
        if (protocol && protocol.details) {
            descHtml = `<div style="background:var(--input-bg); padding:10px; border-left:4px solid var(--primary-color); margin-bottom:10px; font-size:0.9em;"><strong>Verify:</strong> ${protocol.details}</div>`;
        }
        if (container.dataset.complaint !== complaint) {
            container.dataset.complaint = complaint;
            container.innerHTML = descHtml;
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
        if (age >= 16 || !weight) { card.style.display = 'none'; return; }
        card.style.display = 'block';
        const p = paediatricSafety.paracetamol;
        const i = paediatricSafety.ibuprofen;
        const paraDose = Math.min(weight * p.mgPerKg, p.maxDoseMg);
        const ibuDose = Math.min(weight * i.mgPerKg, i.maxDoseMg);
        document.getElementById('paediatric-dosing-results').innerHTML = `
            <div class="dosing-grid">
                <div class="dose-box"><strong>Paracetamol</strong><br><span class="dose-highlight">${paraDose.toFixed(0)} mg</span><br><small>max 1g</small></div>
                <div class="dose-box"><strong>Ibuprofen</strong><br><span class="dose-highlight">${ibuDose.toFixed(0)} mg</span><br><small>max 400mg</small></div>
            </div>`;
    }

    updatePriorityAndPlan() {
        const { mts, painScore, presentingComplaint, scores, override, activeConditionals, smartTags } = this.state;
        let priority = mts.priority || "Blue"; 
        let reasons = [];
        if (mts.priority) reasons.push(`MTS: ${mts.discriminator}`);
        if (painScore >= 7) { if(['Green','Blue','Yellow'].includes(priority)) { priority = 'Orange'; reasons.push("Severe Pain"); } }
        if (scores.news2?.score >= 7) { priority = 'Red'; reasons.push("NEWS2 ≥7"); }
        else if (scores.news2?.score >= 5 && priority !== 'Red') { priority = 'Orange'; reasons.push("NEWS2 ≥5"); }
        if (override.active && override.priority) { priority = override.priority; reasons.push(`OVERRIDE: ${override.rationale}`); }
        
        const summary = document.getElementById('summary-priority-display');
        summary.textContent = priority.toUpperCase();
        summary.className = `summary-priority-${priority}`;
        document.getElementById('priority-reasons').innerHTML = reasons.map(r => `<li>${r}</li>`).join('');

        const container = document.getElementById('actions-list-container');
        const protocol = clinicalProtocols[presentingComplaint];
        if (protocol) {
            let html = '';
            if (smartTags.penicillinAllergy) html += `<div class="alert-box alert-red">⚠ PENICILLIN ALLERGY</div>`;
            if (smartTags.immunocompromised) html += `<div class="alert-box alert-orange">⚠ SEPSIS RISK (Immuno)</div>`;
            
            const allDo = [...protocol.do];
            activeConditionals.forEach(ac => { if(!allDo.includes(ac)) allDo.push(ac); });
            
            // Auto-check smart logic
            if (protocol.conditionals) {
                protocol.conditionals.forEach(cond => {
                    if (cond.smartTag && smartTags[cond.smartTag] && !allDo.includes(cond.add)) allDo.push(cond.add);
                });
            }

            if (allDo.length) html += `<div class="plan-section"><strong style="color:var(--green);">MANDATORY:</strong><ul>${allDo.map(i=>`<li>${i}</li>`).join('')}</ul></div>`;
            if (protocol.consider.length) html += `<div class="plan-section"><strong style="color:var(--orange);">CONSIDER:</strong><ul>${protocol.consider.map(i=>`<li><em>${i}</em></li>`).join('')}</ul></div>`;
            if (protocol.conditionals.length) {
                html += `<div class="plan-section"><strong style="color:var(--primary-color);">QUESTIONS:</strong><div class="q-list">
                    ${protocol.conditionals.map(cond => {
                        const isSmart = cond.smartTag && smartTags[cond.smartTag];
                        return `<div class="q-item">
                            <input type="checkbox" class="conditional-checkbox" data-add="${cond.add}" ${activeConditionals.includes(cond.add)||isSmart?'checked':''}>
                            <label>${cond.question} <strong>${isSmart?'(Auto-Checked)':''}</strong></label>
                        </div>`;
                    }).join('')}
                </div></div>`;
            }
            container.innerHTML = html;
        } else container.innerHTML = '<p>Select complaint.</p>';
    }

    generateNotes() {
        const { patient, history, observations, scores, mts, override, activeConditionals, smartTags, screening } = this.state;
        const now = new Date();
        let note = `EMERGENCY TRIAGE | ${now.toLocaleString()}\n`;
        note += `Patient: ${patient.id||'Unknown'} | ${patient.age}y | ${patient.sex}\n`;
        note += `Complaint: ${this.state.presentingComplaint} | ${mts.discriminator||''}\n`;
        if(observations.rr) note += `NEWS2: ${scores.news2?.score} (HR:${observations.hr} BP:${observations.sbp} RR:${observations.rr} Sats:${observations.sats}%)\n`;
        note += `PMH: ${history.pmh} | Meds: ${history.meds} | Allergies: ${history.allergies}\n`;
        
        // Screening Notes
        if(screening.hivOptOut) note += `HIV: OPTED OUT (${document.getElementById('hiv-reason-select').value})\n`;
        else if(patient.age >= 16 && patient.age <= 65) note += `HIV: Screen Accepted (Opt-out policy)\n`;
        
        if(screening.auditScore > 0) note += `Alcohol: AUDIT-C Score ${screening.auditScore}/12\n`;
        if(document.getElementById('cfs-score').value) note += `Frailty: CFS ${document.getElementById('cfs-score').value}\n`;
        if(document.getElementById('istv-location').value) note += `ISTV: ${document.getElementById('istv-location').value}, ${document.getElementById('istv-weapon').value}\n`;

        // Protocol Plan Note
        const protocol = clinicalProtocols[this.state.presentingComplaint];
        if(protocol) {
            note += `PLAN:\n`;
            const allDo = [...protocol.do];
            activeConditionals.forEach(ac => { if(!allDo.includes(ac)) allDo.push(ac); });
            // Re-run smart logic for note accuracy
            if(protocol.conditionals) {
                protocol.conditionals.forEach(cond => {
                    if(cond.smartTag && smartTags[cond.smartTag] && !allDo.includes(cond.add)) allDo.push(cond.add);
                });
            }
            if(allDo.length) note += `Tests: ${allDo.join(', ')}\n`;
        }

        if(override.active) note += `OVERRIDE: ${override.priority} (${override.rationale})\n`;
        document.getElementById('epr-note').value = note;
    }

    copyRichText(id) {
        document.getElementById(id).select();
        document.execCommand('copy');
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new TriageApp(); });
