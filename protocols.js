// protocols.js - Clinical Configuration v12.0
// COMPLETE DATA SET - PRECISION DIAGNOSTICS EDITION
// NO TRUNCATION. Includes all MTS Flowcharts & Precision Protocols.

export const clinicalData = {
    // --- 1. SCREENING RULES ---
    screening: {
        hiv: {
            minAge: 16,
            maxAge: 65,
            label: "HIV Opt-Out Testing (RCEM/NICE)"
        },
        frailty: {
            minAge: 65,
            label: "Silver Book II: Frailty Assessment",
            options: [
                { val: "1", text: "1. Very Fit" },
                { val: "2", text: "2. Well" },
                { val: "3", text: "3. Managing Well" },
                { val: "4", text: "4. Vulnerable" },
                { val: "5", text: "5. Mildly Frail" },
                { val: "6", text: "6. Moderately Frail" },
                { val: "7", text: "7. Severely Frail" },
                { val: "8", text: "8. Very Severely Frail" },
                { val: "9", text: "9. Terminally Ill" }
            ]
        },
        alcohol: {
            triggerKeywords: ["alcohol", "etoh", "drink", "wine", "beer", "vodka", "whisky", "intox", "drunk", "fall", "collapse", "assault", "head injury"],
            label: "AUDIT-C Alcohol Screen"
        },
        violence: {
            complaints: ["Assault", "Stabbing", "Gunshot Wound", "Head Injury", "Limb Problem (Injury)"],
            label: "ISTV: Anonymous Violence Data"
        }
    },

    // --- 2. SCORING & SAFETY ---
    scoring: {
        news2: {
            rr: [
                { max: 8, score: 3, color: 'Red', label: '≤8' },
                { max: 11, score: 1, color: 'Yellow', label: '9-11' },
                { max: 20, score: 0, color: 'Green', label: '12-20' },
                { max: 24, score: 2, color: 'Orange', label: '21-24' },
                { max: 999, score: 3, color: 'Red', label: '≥25' }
            ],
            sats1: [ 
                { max: 91, score: 3, color: 'Red', label: '≤91' },
                { max: 93, score: 2, color: 'Orange', label: '92-93' },
                { max: 95, score: 1, color: 'Yellow', label: '94-95' },
                { max: 100, score: 0, color: 'Green', label: '≥96' }
            ],
            sats2: [ // CO2 Retainers
                { max: 83, score: 3, color: 'Red', label: '≤83' },
                { max: 85, score: 2, color: 'Orange', label: '84-85' },
                { max: 87, score: 1, color: 'Yellow', label: '86-87' },
                { max: 92, score: 0, color: 'Green', label: '88-92' },
                { max: 93, score: 1, color: 'Yellow', label: '93' },
                { max: 94, score: 2, color: 'Orange', label: '94' },
                { max: 96, score: 3, color: 'Red', label: '95-96' },
                { max: 100, score: 3, color: 'Red', label: '≥97' }
            ],
            sbp: [
                { max: 90, score: 3, color: 'Red', label: '≤90' },
                { max: 100, score: 2, color: 'Orange', label: '91-100' },
                { max: 110, score: 1, color: 'Yellow', label: '101-110' },
                { max: 219, score: 0, color: 'Green', label: '111-219' },
                { max: 999, score: 3, color: 'Red', label: '≥220' }
            ],
            hr: [
                { max: 40, score: 3, color: 'Red', label: '≤40' },
                { max: 50, score: 1, color: 'Yellow', label: '41-50' },
                { max: 90, score: 0, color: 'Green', label: '51-90' },
                { max: 110, score: 1, color: 'Yellow', label: '91-110' },
                { max: 130, score: 2, color: 'Orange', label: '111-130' },
                { max: 999, score: 3, color: 'Red', label: '≥131' }
            ],
            temp: [
                { max: 35.0, score: 3, color: 'Red', label: '≤35.0' },
                { max: 36.0, score: 1, color: 'Yellow', label: '35.1-36.0' },
                { max: 38.0, score: 0, color: 'Green', label: '36.1-38.0' },
                { max: 39.0, score: 1, color: 'Yellow', label: '38.1-39.0' },
                { max: 99.9, score: 2, color: 'Orange', label: '≥39.1' }
            ]
        }
    },
    
    paedsSafety: {
        weightCapKg: 50,
        disclaimer: "GUIDANCE ONLY. CHECK BNFc. Do not use for >50kg.",
        paracetamol: { mgPerKg: 15, maxDoseMg: 1000 },
        ibuprofen: { mgPerKg: 10, maxDoseMg: 400 },
        pewsRanges: {
            infant: { maxRR: 60, maxHR: 160 }, // <1y
            toddler: { maxRR: 40, maxHR: 140 }, // 1-4y
            child: { maxRR: 30, maxHR: 120 }, // 5-11y
            teen: { maxRR: 25, maxHR: 100 } // 12+
        }
    },

    // --- 3. FULL MTS FLOWCHARTS (ALL ENTRIES RESTORED) ---
    mtsFlowcharts: {
        "Abdominal Pain": [{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Peritonism","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Testicular torsion","priority":"Orange"},{"text":"Significant history","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"Altered GCS","priority":"Yellow"},{"text":"Haemodynamic instability","priority":"Yellow"},{"text":"New onset in elderly","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Urinary symptoms","priority":"Green"},{"text":"Recent problem","priority":"Blue"},{"text":"Old problem","priority":"Blue"}],
        "Abdominal Pain - Lower": [{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"PV Bleeding (Pregnant)","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Mild pain","priority":"Green"}],
        "Abdominal Pain - Upper": [{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Haematemesis","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Mild pain","priority":"Green"}],
        "Abdominal Pain in Children": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Peritonism","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Testicular torsion","priority":"Orange"},{"text":"Bile-stained vomit","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"Dehydration","priority":"Yellow"},{"text":"Abdominal distension","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Recent problem","priority":"Blue"}],
        "Allergy": [{"text":"Airway compromise","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Stridor","priority":"Orange"},{"text":"Wheeze","priority":"Orange"},{"text":"Oedema of tongue/throat","priority":"Orange"},{"text":"Widespread rash","priority":"Yellow"},{"text":"Facial oedema","priority":"Yellow"},{"text":"History of severe reaction","priority":"Yellow"},{"text":"Localised rash","priority":"Green"},{"text":"Itch","priority":"Green"}],
        "Assault": [{"text":"Airway compromise","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Penetrating injury to head, neck, torso","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Large haematoma","priority":"Yellow"},{"text":"History of LOC","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Small laceration","priority":"Green"},{"text":"Recent problem","priority":"Blue"}],
        "Ascites": [{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Shortness of breath","priority":"Yellow"},{"text":"Abdominal distension","priority":"Green"}],
        "Back Pain": [{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New extensive neurological deficit","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"New focal neurological deficit","priority":"Yellow"},{"text":"Cauda equina syndrome symptoms","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Mechanical back pain","priority":"Green"},{"text":"Old problem","priority":"Blue"}],
        "Bleeding - Major": [{"text":"Active exsanguination","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"History of significant blood loss","priority":"Orange"}],
        "Bleeding - Minor": [{"text":"Uncontrolled minor bleed","priority":"Yellow"},{"text":"Controlled bleed","priority":"Green"}],
        "Breathless": [{"text":"Apnoeic","priority":"Red"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Shock","priority":"Orange"},{"text":"Stridor","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Moderate respiratory distress","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Mild respiratory distress","priority":"Green"},{"text":"Cough","priority":"Green"},{"text":"Sore throat","priority":"Green"}],
        "Burns and Scalds": [{"text":"Major burn (>15% adult, >10% child)","priority":"Red"},{"text":"Airway compromise","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Inhalational injury","priority":"Orange"},{"text":"Circumferential burn","priority":"Orange"},{"text":"Chemical/electrical burn","priority":"Orange"},{"text":"Moderate burn (5-15% adult, 5-10% child)","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Burn to face, hands, feet, perineum","priority":"Yellow"},{"text":"Minor burn (<5%)","priority":"Green"},{"text":"Mild pain","priority":"Green"},{"text":"Sunburn","priority":"Blue"}],
        "Chest Pain": [{"text":"Airway compromise","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Cardiac-type chest pain at rest","priority":"Yellow"},{"text":"Pleuritic chest pain","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Recent non-cardiac pain","priority":"Green"},{"text":"Musculoskeletal pain","priority":"Green"}],
        "Chest Pain - Cardiac": [{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Cardiac pain at rest","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"}],
        "Chest Pain - Pleuritic": [{"text":"Severe pain","priority":"Orange"},{"text":"Hypoxia","priority":"Orange"},{"text":"Pleuritic pain","priority":"Yellow"}],
        "Chest Pain - Muscular": [{"text":"Severe pain","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Mild pain","priority":"Green"}],
        "Collapse": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"New GCS < 15","priority":"Orange"},{"text":"Seizing now","priority":"Orange"},{"text":"Significant injury","priority":"Orange"},{"text":"Post-ictal","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Cardiac history","priority":"Yellow"},{"text":"Simple faint, now recovered","priority":"Green"},{"text":"Normal vital signs","priority":"Green"}],
        "Confusion": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"New Confusion","priority":"Orange"},{"text":"Hypoglycaemia","priority":"Orange"},{"text":"Abnormal vital signs","priority":"Yellow"}],
        "Crying Baby": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Seizing now","priority":"Orange"},{"text":"Non-blanching rash","priority":"Orange"},{"text":"High-pitched/inconsolable cry","priority":"Orange"},{"text":"Grunting/severe respiratory distress","priority":"Orange"},{"text":"Looks unwell","priority":"Yellow"},{"text":"Dehydration","priority":"Yellow"},{"text":"Fever","priority":"Yellow"},{"text":"Parental concern","priority":"Yellow"},{"text":"Seems well","priority":"Green"}],
        "Dental Problems": [{"text":"Airway compromise","priority":"Red"},{"text":"Uncontrolled bleeding","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Facial swelling with systemic signs","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Facial swelling","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Lost filling","priority":"Blue"}],
        "Diarrhoea": [{"text":"Shock","priority":"Red"},{"text":"Severe dehydration","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Moderate dehydration","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"High fever","priority":"Yellow"},{"text":"Mild dehydration","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Diarrhoea","priority":"Green"}],
        "Ear Problems": [{"text":"Severe pain","priority":"Orange"},{"text":"Sudden onset deafness","priority":"Orange"},{"text":"Mastoid tenderness","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Discharge","priority":"Yellow"},{"text":"Foreign body","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Wax","priority":"Blue"}],
        "Eye Problems": [{"text":"Sudden loss of vision","priority":"Red"},{"text":"Chemical eye injury","priority":"Red"},{"text":"Penetrating eye injury","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Reduced visual acuity","priority":"Yellow"},{"text":"Foreign body sensation","priority":"Yellow"},{"text":"Painful red eye","priority":"Yellow"},{"text":"Flash burns","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Conjunctivitis","priority":"Green"}],
        "Fall": [{"text":"Major trauma","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Long lie (>1 hour)","priority":"Orange"},{"text":"Suspected neck of femur fracture","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"History of LOC","priority":"Yellow"},{"text":"Inability to weight bear","priority":"Yellow"},{"text":"Head injury with anticoagulants","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Able to weight bear","priority":"Green"}],
        "Fever": [{"text":"Shock","priority":"Red"},{"text":"Non-blanching rash","priority":"Orange"},{"text":"Neutropenia suspected","priority":"Orange"},{"text":"Hot","priority":"Green"}],
        "Fits": [{"text":"Seizing now","priority":"Red"},{"text":"Post-ictal, not recovering","priority":"Orange"},{"text":"New focal neurology","priority":"Orange"},{"text":"Suspected head injury","priority":"Orange"},{"text":"Post-ictal, recovering","priority":"Yellow"},{"text":"First fit","priority":"Yellow"},{"text":"Fever","priority":"Yellow"},{"text":"Known epileptic, recovered","priority":"Green"}],
        "Head Injury": [{"text":"GCS < 9","priority":"Red"},{"text":"GCS 9-12","priority":"Orange"},{"text":"Penetrating injury","priority":"Orange"},{"text":"Seizing now","priority":"Orange"},{"text":"Focal neurological deficit","priority":"Orange"},{"text":"GCS 13-14","priority":"Yellow"},{"text":"Vomiting >1 episode","priority":"Yellow"},{"text":"History of LOC >5 mins","priority":"Yellow"},{"text":"Amnesia","priority":"Yellow"},{"text":"On anticoagulants","priority":"Yellow"},{"text":"GCS 15, no other factors","priority":"Green"}],
        "Headache": [{"text":"Reduced level of consciousness (GCS < 13)","priority":"Red"},{"text":"Sudden onset severe headache ('thunderclap')","priority":"Orange"},{"text":"New neurological deficit","priority":"Orange"},{"text":"Meningism (fever, neck stiffness, photophobia)","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New onset headache >50 years","priority":"Yellow"},{"text":"Headache with visual disturbance","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Chronic headache, unchanged","priority":"Blue"}],
        "Headache - Sudden Onset": [{"text":"Reduced GCS","priority":"Red"},{"text":"Thunderclap","priority":"Orange"},{"text":"Meningism","priority":"Orange"}],
        "Headache - Meningitic": [{"text":"Purpuric Rash","priority":"Red"},{"text":"Meningism","priority":"Orange"},{"text":"Fever","priority":"Yellow"}],
        "Jaundice": [{"text":"Liver failure signs","priority":"Orange"},{"text":"Unwell","priority":"Yellow"},{"text":"Well","priority":"Green"}],
        "Joint Swelling": [{"text":"Septic arthritis suspected","priority":"Orange"},{"text":"Hot/Red joint","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"}],
        "Limb Problem (Injury)": [{"text":"Major trauma","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Neurovascular compromise","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Obvious deformity/dislocation","priority":"Orange"},{"text":"Suspected neck of femur fracture","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Inability to weight bear","priority":"Yellow"},{"text":"Large wound","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Able to weight bear","priority":"Green"},{"text":"Minor injury","priority":"Blue"}],
        "Limb Problem (Non-Injury)": [{"text":"Neurovascular compromise","priority":"Red"},{"text":"Severe pain","priority":"Orange"},{"text":"Hot, swollen, tender joint","priority":"Orange"},{"text":"Suspected DVT","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Cellulitis","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Chronic pain","priority":"Blue"}],
        "Mental Health Problem": [{"text":"Immediate risk to self or others","priority":"Red"},{"text":"Violent or aggressive","priority":"Red"},{"text":"Severe distress or agitation","priority":"Orange"},{"text":"Acute psychosis","priority":"Orange"},{"text":"Overdose (conscious)","priority":"Orange"},{"text":"Suicidal ideation with plan","priority":"Yellow"},{"text":"Distressed","priority":"Yellow"},{"text":"Self-harm (minor)","priority":"Yellow"},{"text":"Low mood, no immediate risk","priority":"Green"},{"text":"Request for medication","priority":"Blue"}],
        "Overdose": [{"text":"Unresponsive","priority":"Red"},{"text":"Seizing now","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Abnormal vital signs","priority":"Orange"},{"text":"High-risk substance","priority":"Orange"},{"text":"Deliberate self-harm intent","priority":"Yellow"},{"text":"Symptomatic but stable","priority":"Yellow"},{"text":"Asymptomatic, low-risk substance","priority":"Green"},{"text":"Information request","priority":"Blue"}],
        "Palpitations": [{"text":"Shock","priority":"Orange"},{"text":"Chest Pain","priority":"Orange"},{"text":"History of Arrhythmia","priority":"Yellow"},{"text":"Pulse irregular","priority":"Yellow"}],
        "Pregnancy": [{"text":"Imminent delivery","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Heavy vaginal bleeding","priority":"Orange"},{"text":"Seizing (eclampsia)","priority":"Orange"},{"text":"Reduced fetal movements","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Minor vaginal bleeding","priority":"Yellow"},{"text":"Ruptured membranes","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"}],
        "Rash": [{"text":"Shock","priority":"Red"},{"text":"Non-blanching rash with fever/lethargy","priority":"Orange"},{"text":"Stridor or wheeze","priority":"Orange"},{"text":"Widespread, blistering rash","priority":"Orange"},{"text":"Non-blanching rash, patient well","priority":"Yellow"},{"text":"Widespread rash with fever","priority":"Yellow"},{"text":"Localised blistering rash","priority":"Yellow"},{"text":"Itchy rash","priority":"Green"},{"text":"Localised rash, patient well","priority":"Green"}],
        "Seizure": [{"text":"Seizing now","priority":"Red"},{"text":"Status Epilepticus","priority":"Orange"},{"text":"First seizure","priority":"Yellow"},{"text":"Known epilepsy - recovered","priority":"Green"}],
        "Shortness of Breath": [{"text":"Apnoeic","priority":"Red"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Shock","priority":"Orange"},{"text":"Stridor","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Moderate respiratory distress","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Mild respiratory distress","priority":"Green"},{"text":"Cough","priority":"Green"},{"text":"Sore throat","priority":"Green"}],
        "Tiredness": [{"text":"Shock","priority":"Orange"},{"text":"Severe Anaemia suspected","priority":"Orange"},{"text":"Chronic","priority":"Blue"}],
        "Unwell Adult": [{"text":"Unresponsive or airway compromise","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"New GCS < 15","priority":"Orange"},{"text":"High risk of sepsis (meets criteria)","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Looks very unwell","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Significant history","priority":"Yellow"},{"text":"Looks well, normal vital signs","priority":"Green"},{"text":"Symptom enquiry only","priority":"Blue"}],
        "Urinary Problems": [{"text":"Shock (septic)","priority":"Red"},{"text":"Severe pain (renal colic/retention)","priority":"Orange"},{"text":"Systemically unwell with fever","priority":"Orange"},{"text":"Acute urinary retention","priority":"Yellow"},{"text":"Visible haematuria","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Symptoms of UTI","priority":"Green"},{"text":"Catheter problem","priority":"Green"}],
        "Vertigo": [{"text":"Cannot stand","priority":"Orange"},{"text":"Sudden onset","priority":"Yellow"},{"text":"Chronic","priority":"Blue"}],
        "Weakness": [{"text":"FAST Positive","priority":"Orange"},{"text":"New neurological deficit","priority":"Orange"},{"text":"Sudden onset","priority":"Orange"}],
        "Worried Parent": [{"text":"Parent states 'child is dying'","priority":"Red"},{"text":"Parent states 'child is very ill'","priority":"Orange"},{"text":"Parent states 'child is ill'","priority":"Yellow"},{"text":"Parent is worried","priority":"Green"}]
    },

    // --- 4. PRECISION CLINICAL PROTOCOLS (ALL ENTRIES UPDATED) ---
    protocols: {
        "Abdominal Pain": {
            cannula: { status: "Consider", color: "amber", size: "20G/22G", reason: "Only if vomiting or severe pain" },
            tests: {
                bedside: ["Urine Dip", "Pregnancy Test (Female)", "VBG"],
                lab: ["FBC", "U&E", "LFT", "Amylase/Lipase", "CRP"],
                imaging: ["Abdo X-Ray (only if obstruction suspected)"]
            }
        },
        "Abdominal Pain - Lower": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "Analgesia / Surgical" },
            tests: {
                bedside: ["Urine Dip", "Pregnancy Test"],
                lab: ["FBC", "U&E", "CRP", "G&S (if bleeding/pregnant)"],
                imaging: ["Ultrasound (Gynae/Appendix)"]
            }
        },
        "Abdominal Pain - Upper": {
            cannula: { status: "Essential", color: "green", size: "18G/20G", reason: "Sepsis / Pancreatitis" },
            tests: {
                bedside: ["VBG", "ECG (rule out cardiac)"],
                lab: ["FBC", "U&E", "LFT", "Amylase", "CRP", "Clotting"],
                imaging: ["CXR (Erect)", "US Biliary"]
            }
        },
        "Abdominal Pain in Children": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral fluids/analgesia preferred" },
            tests: {
                bedside: ["Urine Dip", "Blood Glucose"],
                lab: ["FBC, CRP (only if surgical/septic)"],
                imaging: ["US Abdo (Appendix?)"]
            }
        },
        "Allergy": {
            cannula: { status: "Consider", color: "amber", size: "18G", reason: "If Anaphylaxis suspected" },
            tests: {
                bedside: ["Peak Flow (if wheezy)"],
                lab: ["Mast Cell Tryptase (if anaphylaxis)"],
                imaging: []
            }
        },
        "Ascites": {
            cannula: { status: "Essential", color: "green", size: "20G", reason: "Diagnostic Tap / SBP" },
            tests: {
                bedside: ["Urine Dip"],
                lab: ["FBC", "U&E", "LFT", "Clotting", "CRP"],
                imaging: []
            }
        },
        "Back Pain": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia sufficient" },
            tests: {
                bedside: ["Urine Dip", "Neuro Obs"],
                lab: ["CRP, FBC (if infection/tumour suspected)"],
                imaging: ["MRI (if Cauda Equina)", "X-Ray (Trauma)"]
            }
        },
        "Bleeding - Major": {
            cannula: { status: "Essential", color: "green", size: "14G/16G x2", reason: "Major Haemorrhage Protocol" },
            tests: {
                bedside: ["VBG (Hb/Lactate)", "FAST Scan"],
                lab: ["Cross Match (4-6 units)", "FBC", "Clotting", "Fibrinogen"],
                imaging: ["CT Trauma / Angio"]
            }
        },
        "Bleeding - Minor": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Direct Pressure" },
            tests: {
                bedside: [],
                lab: ["Clotting (if anticoagulated)"],
                imaging: []
            }
        },
        "Breathless": {
            cannula: { status: "Essential", color: "green", size: "18G/20G", reason: "IV Meds / Fluids" },
            tests: {
                bedside: ["ECG", "ABG (if SpO2 <92%)", "VBG"],
                lab: ["FBC", "U&E", "CRP", "Blood Cultures (if febrile)"],
                imaging: ["CXR"]
            }
        },
        "Burns and Scalds": {
            cannula: { status: "Consider", color: "amber", size: "16G", reason: "Fluid Resus if >15% TBSA" },
            tests: {
                bedside: ["Weight (for Parkland)"],
                lab: ["FBC", "U&E", "Clotting", "CK (Electrical)"],
                imaging: []
            }
        },
        "Chest Pain": {
            cannula: { status: "Essential", color: "green", size: "18G/20G", reason: "Potential ACS/PE/CT" },
            tests: {
                bedside: ["ECG (within 10m)", "VBG (Lactate)", "COVID Swab"],
                lab: ["Troponin", "FBC", "U&E", "D-Dimer (if Wells Low)"],
                imaging: ["CXR (Portable if Unstable)"]
            }
        },
        "Chest Pain - Cardiac": {
            cannula: { status: "Essential", color: "green", size: "18G", reason: "ACS Protocol" },
            tests: {
                bedside: ["ECG (serial)", "VBG"],
                lab: ["Troponin (High Sens)", "FBC", "U&E", "Lipids", "Glucose"],
                imaging: ["CXR"]
            }
        },
        "Chest Pain - Pleuritic": {
            cannula: { status: "Essential", color: "green", size: "18G", reason: "CT PA likely" },
            tests: {
                bedside: ["ECG", "VBG"],
                lab: ["D-Dimer (Wells Score)", "Troponin", "FBC", "U&E"],
                imaging: ["CXR", "CTPA"]
            }
        },
        "Chest Pain - Muscular": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" },
            tests: {
                bedside: ["ECG (rule out cardiac)"],
                lab: [],
                imaging: []
            }
        },
        "Collapse": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "If cause unclear" },
            tests: {
                bedside: ["ECG", "Lying/Standing BP", "Blood Glucose"],
                lab: ["FBC", "U&E", "Troponin (if cardiac symptoms)"],
                imaging: ["CT Head (if injury)"]
            }
        },
        "Confusion": {
            cannula: { status: "Essential", color: "green", size: "20G", reason: "Delirium Screen" },
            tests: {
                bedside: ["Urine Dip", "VBG (Glucose/Calcium)", "ECG"],
                lab: ["FBC", "U&E", "LFT", "CRP", "Bone Profile", "TSH", "B12/Folate"],
                imaging: ["CT Head", "CXR"]
            }
        },
        "Dental Problems": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Refer to Dentist" },
            tests: {
                bedside: [],
                lab: [],
                imaging: ["OPG (Dental)"]
            }
        },
        "Diarrhoea": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "IV Rehydration if severe" },
            tests: {
                bedside: ["VBG (Lactate/K+)", "Stool Sample"],
                lab: ["FBC", "U&E", "CRP"],
                imaging: ["Abdo X-Ray (Colitis)"]
            }
        },
        "Ear Problems": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Topical treatment" },
            tests: {
                bedside: ["Otoscopy"],
                lab: ["Swab (if discharge)"],
                imaging: []
            }
        },
        "Eye Problems": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Topical treatment" },
            tests: {
                bedside: ["Visual Acuity", "Fluorescein", "Fundoscopy"],
                lab: [],
                imaging: ["CT Orbits (Trauma)"]
            }
        },
        "Fall": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "If IV analgesia needed" },
            tests: {
                bedside: ["Lying/Standing BP", "ECG"],
                lab: ["FBC", "U&E", "CK (if long lie)", "Bone Profile"],
                imaging: ["X-Ray (symptomatic areas)"]
            }
        },
        "Fever": {
            cannula: { status: "Essential", color: "green", size: "20G", reason: "Sepsis likely" },
            tests: {
                bedside: ["Urine Dip", "VBG", "Blood Cultures x2"],
                lab: ["FBC", "CRP", "U&E", "LFT"],
                imaging: ["CXR"]
            }
        },
        "Head Injury": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Unless GCS <15 or Anticoagulated" },
            tests: {
                bedside: ["Neuro Obs (q30m)", "Check Anticoagulant Status"],
                lab: ["Clotting Screen (if on thinners)", "Group & Save (if major)"],
                imaging: ["CT Head (NICE CG176)", "C-Spine CT?"]
            }
        },
        "Headache": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "If CT Contrast likely" },
            tests: {
                bedside: ["Neuro Obs", "Temp"],
                lab: ["FBC", "CRP", "ESR (if >50y)"],
                imaging: ["CT Head (if Red Flags present)"]
            }
        },
        "Headache - Sudden Onset": {
            cannula: { status: "Essential", color: "green", size: "18G", reason: "CT Angio / SAH" },
            tests: {
                bedside: ["Neuro Obs"],
                lab: ["Clotting", "FBC", "U&E"],
                imaging: ["CT Head + Angio"]
            }
        },
        "Jaundice": {
            cannula: { status: "Essential", color: "green", size: "20G", reason: "Liver Screen" },
            tests: {
                bedside: ["Urine Dip", "VBG"],
                lab: ["LFT (Split Bilirubin)", "Clotting (INR)", "FBC", "U&E", "Paracetamol Level"],
                imaging: ["US Liver/Biliary"]
            }
        },
        "Joint Swelling": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "Analgesia / Washout" },
            tests: {
                bedside: ["Temp"],
                lab: ["FBC", "CRP", "Urate", "Joint Aspirate (MC&S/Crystals)"],
                imaging: ["X-Ray"]
            }
        },
        "Limb Problem (Injury)": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia First" },
            tests: {
                bedside: ["Neurovascular Check", "Remove Rings"],
                lab: [],
                imaging: ["X-Ray"]
            }
        },
        "Mental Health Problem": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "May escalate agitation" },
            tests: {
                bedside: ["Physical Exam (exclude organic)"],
                lab: ["FBC", "U&E", "Tox Screen (if indicated)"],
                imaging: []
            }
        },
        "Overdose": {
            cannula: { status: "Essential", color: "green", size: "18G", reason: "Antidotes / Fluids" },
            tests: {
                bedside: ["ECG", "VBG (pH/Lactate)", "Temp"],
                lab: ["Paracetamol Level (4h)", "Salicylate", "U&E", "LFT", "Clotting"],
                imaging: []
            }
        },
        "Palpitations": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "If Adenosine/Rate control needed" },
            tests: {
                bedside: ["ECG (Rhythm Strip)", "Orthostatic BP"],
                lab: ["FBC", "U&E", "Magnesium", "TSH", "Troponin (if chest pain)"],
                imaging: []
            }
        },
        "Pregnancy": {
            cannula: { status: "Essential", color: "green", size: "16G", reason: "Haemorrhage risk" },
            tests: {
                bedside: ["Urine Dip", "Abdo Palpation"],
                lab: ["Group & Save", "FBC", "Beta-HCG (Quant)", "Rhesus Status"],
                imaging: ["Early Pregnancy Scan"]
            }
        },
        "Rash": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "If Sepsis/Meningococcal" },
            tests: {
                bedside: ["Glass Test (Meningococcal)", "Temp"],
                lab: ["FBC", "CRP", "Blood Cultures (if febrile)"],
                imaging: []
            }
        },
        "Seizure": {
            cannula: { status: "Essential", color: "green", size: "20G", reason: "Anti-epileptics" },
            tests: {
                bedside: ["Blood Glucose (Immediate)", "ECG"],
                lab: ["FBC", "U&E", "Calcium", "Magnesium", "Drug Levels (Phenytoin etc)"],
                imaging: ["CT Head (if first fit/trauma)"]
            }
        },
        "Shortness of Breath": {
            cannula: { status: "Essential", color: "green", size: "18G/20G", reason: "IV Meds / Fluids" },
            tests: {
                bedside: ["ECG", "ABG (if SpO2 <92%)", "VBG"],
                lab: ["FBC", "U&E", "CRP", "Blood Cultures (if febrile)"],
                imaging: ["CXR"]
            }
        },
        "Unwell Adult": {
            cannula: { status: "Essential", color: "green", size: "16G/18G", reason: "Sepsis/Resus" },
            tests: {
                bedside: ["VBG (Lactate)", "Urine Dip", "Blood Cultures x2"],
                lab: ["FBC", "U&E", "LFT", "CRP", "Clotting"],
                imaging: ["CXR", "Consider CT Pan-Scan"]
            }
        },
        "Urinary Problems": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "IV Antibiotics / Fluids" },
            tests: {
                bedside: ["Urine Dip", "Residual Volume (Bladder Scan)"],
                lab: ["U&E (AKI check)", "FBC", "CRP", "PSA (if retention/male)"],
                imaging: ["US KUB (if renal colic)"]
            }
        },
        "Vertigo": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "IV Anti-emetics" },
            tests: {
                bedside: ["HINTS Exam", "Dix-Hallpike", "ECG"],
                lab: ["FBC", "U&E"],
                imaging: ["CT/MRI Head (if central signs)"]
            }
        },
        "Worried Parent": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Paediatric Senior Review First" },
            tests: {
                bedside: ["Full Obs", "Hydration Check"],
                lab: [],
                imaging: []
            }
        }
    }
};
