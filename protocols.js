// protocols.js - Clinical Configuration v8.0 (Complete)
// INCLUDES: Full MTS, PAT Matrix, Smart Logic Hooks, & RCEM/NICE Screening Rules

// --- 1. SCREENING & SMART TRIGGERS ---
const screeningRules = {
    hiv: {
        minAge: 16,
        maxAge: 65, // Standard opt-out window
        label: "HIV Opt-Out Testing (RCEM/NICE)"
    },
    frailty: {
        minAge: 65,
        trigger: "auto",
        label: "Silver Book II: Frailty Assessment"
    },
    alcohol: {
        // Triggers AUDIT-C visibility if these words appear in History/Complaint
        triggerKeywords: ["alcohol", "etoh", "drink", "wine", "beer", "vodka", "whisky", "intox", "drunk", "fall", "collapse", "assault", "head injury"],
        label: "AUDIT-C Alcohol Screen"
    },
    violence: {
        // Triggers ISTV data collection form
        complaints: ["Assault", "Stabbing", "Gunshot Wound", "Head Injury", "Limb Problem (Injury)"],
        label: "ISTV: Anonymous Violence Data"
    }
};

// --- 2. SCORING THRESHOLDS (NEWS2) ---
// Standard RCP NEWS2 thresholds for the visual chart
const scoringRulesData = {
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
};

const paediatricSafety = {
    paracetamol: { mgPerKg: 15, maxDoseMg: 1000, warning: "Max 1g/dose. QDS." },
    ibuprofen: { mgPerKg: 10, maxDoseMg: 400, warning: "Max 400mg/dose. TDS." },
    fluidBolus: { mlPerKg: 20, maxVolMl: 500, warning: "Reassess after every bolus" }
};

const painProtocols = {
    severeThreshold: 7, 
    action: "Analgesia: Administer strong analgesia within 20 mins"
};

// --- 3. FULL MANCHESTER TRIAGE SYSTEM (MTS) DATA ---
const mtsFlowcharts = {
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
};

// --- 4. CLINICAL PROTOCOLS (PAT MATRIX MAPPING) ---
// smartTag: 'anticoagulant' triggers auto-check if keywords found in meds.
const clinicalProtocols = {
    "Allergy": {
        details: "Reaction to allergen.",
        do: ["U&E", "FBC"],
        consider: ["CRP", "Cannula"],
        conditionals: []
    },
    "Abdominal Pain - Lower": {
        details: "Pain in lower quadrants.",
        do: ["U&E", "CRP", "Bone profile", "FBC", "VBG", "Urine Dip", "Pregnancy Test", "Cannula"],
        consider: ["G&S", "Coagulation", "Beta HCG", "Bladder Scan"],
        conditionals: []
    },
    "Abdominal Pain - Upper": {
        details: "Pain in upper quadrants (epigastric, RUQ, LUQ).",
        do: ["U&E", "LFT", "CRP", "Amylase", "Bone profile", "FBC", "VBG", "ECG", "Pregnancy Test", "Cannula"],
        consider: ["G&S", "Coagulation", "Beta HCG", "Troponin"],
        conditionals: []
    },
    "Ascites": {
        details: "Abdominal swelling/fluid.",
        do: ["Coagulation", "U&E", "LFT", "CRP", "FBC", "VBG", "Cannula"],
        consider: ["Blood culture", "Amylase"],
        conditionals: []
    },
    "Bleeding - Major": {
        details: "Active exsanguination or unstable.",
        do: ["Cross Match", "G&S", "Coagulation", "U&E", "LFT", "FBC", "VBG", "Cannula"],
        consider: [],
        conditionals: [
            { question: "Is Major Haemorrhage Protocol activated?", add: "MHP Pack 1" },
            { question: "On Anticoagulants?", add: "Reversal Agent?", smartTag: "anticoagulant" }
        ]
    },
    "Bleeding - Minor": {
        details: "Controlled or minor bleeding.",
        do: ["Coagulation", "U&E", "LFT", "FBC", "VBG"],
        consider: ["G&S", "Cannula"],
        conditionals: [
            { question: "Evidence of infection?", add: "Blood Cultures" },
            { question: "On Anticoagulants?", add: "Check INR/Levels", smartTag: "anticoagulant" }
        ]
    },
    "Breathless": {
        details: "Shortness of breath / Dyspnoea.",
        do: ["U&E", "CRP", "FBC", "VBG", "ECG", "Cannula"],
        consider: ["G&S", "Blood culture", "D-Dimer", "Coagulation", "Troponin", "Pregnancy Test"],
        conditionals: [
            { question: "On Anticoagulants (Warfarin/DOAC)?", add: "INR/Coag", smartTag: "anticoagulant" }
        ]
    },
    "Bruising - Non traumatic": {
        details: "Spontaneous bruising.",
        do: ["Coagulation", "U&E", "LFT", "FBC"],
        consider: [],
        conditionals: [
            { question: "O2 Sats < 94%?", add: "ABG" },
            { question: "On Anticoagulants?", add: "Review Meds", smartTag: "anticoagulant" }
        ]
    },
    "Calf Pain and Swelling": {
        details: "Unilateral sudden onset.",
        do: ["U&E", "CRP", "FBC"],
        consider: ["D-Dimer", "Coagulation"],
        conditionals: [
            { question: "Tachycardic or Bradycardic?", add: "ECG" }
        ]
    },
    "Chest Pain - Cardiac": {
        details: "Central crushing chest pain with radiation and history of angina (chest pain on exertion).",
        do: ["Coagulation", "U&E", "FBC", "ECG", "Troponin", "Cannula"],
        consider: ["CXR"],
        conditionals: [
            { question: "Systemically unwell?", add: "Sepsis Screen" }
        ]
    },
    "Chest Pain - Dyspepsia": {
        details: "Indigestion / Heartburn / Acid reflux.",
        do: ["U&E", "FBC", "ECG"],
        consider: ["LFT", "Amylase", "Coagulation"],
        conditionals: []
    },
    "Chest Pain - Muscular": {
        details: "Tender, worse on moving around.",
        do: ["U&E", "FBC"],
        consider: [],
        conditionals: []
    },
    "Chest Pain - Pleuritic": {
        details: "Worse on breathing/inspiration.",
        do: ["Coagulation", "U&E", "CRP", "FBC", "VBG", "ECG", "CXR", "Cannula"],
        consider: ["D-Dimer", "Troponin"],
        conditionals: [
            { question: "On Anticoagulants?", add: "Review for PE", smartTag: "anticoagulant" }
        ]
    },
    "Confusion": {
        details: "New or worsening confusion.",
        do: ["U&E", "LFT", "CRP", "B12/Folate", "Bone profile", "TSH", "FBC", "VBG"],
        consider: ["Blood culture", "CXR", "Cannula"],
        conditionals: []
    },
    "Diarrhoea": {
        details: "Type 6 or 7 stool.",
        do: ["U&E", "CRP", "Bone profile", "FBC", "VBG", "Cannula"],
        consider: ["TSH", "Stool Sample"],
        conditionals: []
    },
    "Fall": {
        details: "Mechanical fall or collapse.",
        do: ["Coagulation", "U&E", "FBC", "VBG", "ECG", "Lying/Standing BP"],
        consider: ["CRP", "CK", "Cannula"],
        conditionals: [
            { question: "Head Injury Sustained?", add: "CT Head (NICE)" },
            { question: "On Anticoagulants?", add: "CT Head (Risk)", smartTag: "anticoagulant" }
        ]
    },
    "Fever": {
        details: "Temp > 38.0 or reported.",
        do: ["U&E", "LFT", "CRP", "FBC", "VBG", "Blood culture", "Urine Dip", "Pregnancy Test", "CXR", "Cannula"],
        consider: [],
        conditionals: []
    },
    "Head Injury": {
        details: "Trauma to head. (NICE CG176)",
        do: ["U&E", "FBC", "Coagulation"],
        consider: ["Cannula"],
        conditionals: [
            { question: "On Anticoagulants?", add: "CT Head (Mandatory)", smartTag: "anticoagulant" },
            { question: "GCS < 15 or Vomiting?", add: "CT Head within 1h" }
        ]
    },
    "Headache - Tension/Migraine": {
        details: "Pulsating/Pounding/Throbbing.",
        do: ["U&E", "FBC"],
        consider: [],
        conditionals: []
    },
    "Headache - Sudden Onset": {
        details: "Worse pain ever, 5 min onset (Thunderclap).",
        do: ["Coagulation", "U&E", "FBC", "Pregnancy Test", "Cannula"],
        consider: [],
        conditionals: [
            { question: "On Anticoagulants?", add: "Urgent CT/Reversal", smartTag: "anticoagulant" }
        ]
    },
    "Headache - Meningitic": {
        details: "Confusion, Fever, Rash, Neck Stiffness.",
        do: ["Coagulation", "U&E", "CRP", "FBC", "VBG", "Cannula"],
        consider: [],
        conditionals: []
    },
    "Headache - New, 50yrs+": {
        details: "New onset in older patient.",
        do: ["U&E", "FBC", "ESR"],
        consider: [],
        conditionals: []
    },
    "Jaundice": {
        details: "Yellowing of skin/sclera.",
        do: ["Coagulation", "U&E", "LFT", "CRP", "Amylase", "LDH", "FBC", "VBG", "Pregnancy Test"],
        consider: ["Blood culture", "Cannula"],
        conditionals: []
    },
    "Joint Swelling - Other": {
        details: "Gradual onset. Generally Well.",
        do: ["Coagulation", "U&E", "FBC"],
        consider: [],
        conditionals: []
    },
    "Joint Swelling - Septic Arthritis": {
        details: "Sudden onset. Generally Unwell.",
        do: ["Coagulation", "U&E", "FBC", "VBG", "Cannula"],
        consider: [],
        conditionals: []
    },
    "Transient Loss of Consciousness": {
        details: "Syncope / Faint.",
        do: ["U&E", "LFT", "CRP", "FBC", "ECG"],
        consider: [],
        conditionals: []
    },
    "Overdose / Poisoning": {
        details: "Ingestion of toxic substance.",
        do: ["Coagulation", "U&E", "LFT", "CRP", "FBC", "VBG", "ECG", "Pregnancy Test", "Cannula"],
        consider: ["G&S"],
        conditionals: [
            { question: "Is Paracetamol involved?", add: "Paracetamol Level" },
            { question: "Is Aspirin involved?", add: "Salicylate Level" }
        ]
    },
    "Palpitations": {
        details: "Awareness of heartbeat.",
        do: ["U&E", "LFT", "CRP", "Bone profile", "Magnesium", "Phosphate", "TSH", "FBC", "ECG", "Pregnancy Test"],
        consider: ["D-Dimer", "Troponin"],
        conditionals: []
    },
    "Rash": {
        details: "New skin eruption.",
        do: ["U&E", "LFT", "CRP", "FBC"],
        consider: [],
        conditionals: []
    },
    "Seizure - Known Epileptic": {
        details: "History of epilepsy.",
        do: ["U&E", "FBC"],
        consider: ["Cannula"],
        conditionals: []
    },
    "Seizure - First": {
        details: "No previous history.",
        do: ["Coagulation", "U&E", "LFT", "CRP", "Bone profile", "Magnesium", "Phosphate", "FBC", "VBG", "ECG", "Pregnancy Test", "Cannula"],
        consider: ["Blood culture"],
        conditionals: []
    },
    "Septic": {
        details: "Sepsis suspected (NEWS2 >5 or Red Flag).",
        do: ["Coagulation", "U&E", "LFT", "CRP", "FBC", "VBG", "Blood culture", "ECG", "CXR", "Cannula"],
        consider: [],
        conditionals: []
    },
    "Tiredness / General Weakness": {
        details: "Non-specific malaise.",
        do: ["U&E", "TSH", "FBC", "VBG", "ESR"],
        consider: [],
        conditionals: []
    },
    "Tremor": {
        details: "Shaking.",
        do: ["U&E", "LFT", "CRP", "Bone profile", "Magnesium", "Phosphate", "TSH", "FBC"],
        consider: [],
        conditionals: []
    },
    "Vertigo": {
        details: "Dizziness / Room spinning.",
        do: ["Coagulation", "U&E", "FBC"],
        consider: [],
        conditionals: []
    },
    "Weakness - Unilateral": {
        details: "Stroke / TIA symptoms.",
        do: ["Coagulation", "U&E", "LFT", "CRP", "Lipids", "FBC", "VBG", "ECG", "Cannula"],
        consider: [],
        conditionals: []
    },
    "Wheeze": {
        details: "Asthma / COPD / Infection.",
        do: ["U&E", "CRP", "FBC", "VBG", "CXR", "Cannula"],
        consider: [],
        conditionals: []
    }
};
