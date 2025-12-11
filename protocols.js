// protocols.js - Clinical Configuration v4.3
// COMPLETE DATABASE: Standard Bundles, Dosing, Pain, Clinical Protocols, & FULL MTS FLOWCHARTS.

// --- 1. STANDARD INVESTIGATION BUNDLES ---
const standardBundles = {
    'Routine': ['FBC', 'U&E', 'CRP', 'LFT', 'Bone Profile'],
    'Surgical': ['FBC', 'U&E', 'CRP', 'LFT', 'Amylase', 'Group & Save', 'Lactate'],
    'Cardiac': ['FBC', 'U&E', 'CRP', 'Lipids', 'HbA1c', 'Troponin (High Sensitivity)', 'Coagulation'],
    'Trauma': ['FBC', 'U&E', 'Coagulation', 'Group & Save', 'Lactate', 'Bone Profile'],
    'Sepsis': ['FBC', 'U&E', 'CRP', 'LFT', 'Lactate', 'Coagulation', 'Blood Cultures', 'Glucose'],
    'Confused': ['FBC', 'U&E', 'CRP', 'LFT', 'Bone Profile', 'B12/Folate', 'TSH', 'Glucose'],
    'Overdose': ['FBC', 'U&E', 'LFT', 'INR', 'Paracetamol Level', 'Salicylate Level', 'Glucose'],
    'Resp': ['FBC', 'U&E', 'CRP', 'Bone Profile'],
    'Stroke': ['FBC', 'U&E', 'CRP', 'Glucose', 'Lipids', 'Coagulation', 'ESR'],
    'Vasculitis': ['FBC', 'U&E', 'CRP', 'LFT', 'Bone Profile', 'ESR', 'Urinalysis'],
    'Coag': ['FBC', 'U&E', 'LFT', 'Coagulation', 'Group & Save']
};

// --- 2. SAFETY GOVERNANCE RULES ---
const paediatricSafety = {
    paracetamol: { mgPerKg: 15, maxDoseMg: 1000, warning: "Max 1g per dose" },
    ibuprofen: { mgPerKg: 10, maxDoseMg: 400, warning: "Max 400mg per dose" },
    fluidBolus: { mlPerKg: 20, maxVolMl: 500, warning: "Review if >500ml required" }
};

const painProtocols = {
    severeThreshold: 7, // Pain score >= 7 triggers orange priority
    action: "Analgesia: Administer strong analgesia within 20 mins"
};

// --- 3. FULL MANCHESTER TRIAGE SYSTEM (MTS) DATA ---
const mtsFlowcharts = {
    "Abdominal Pain": [{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Peritonism","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Testicular torsion","priority":"Orange"},{"text":"Significant history","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"Altered GCS","priority":"Yellow"},{"text":"Haemodynamic instability","priority":"Yellow"},{"text":"New onset in elderly","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Urinary symptoms","priority":"Green"},{"text":"Recent problem","priority":"Blue"},{"text":"Old problem","priority":"Blue"}],
    "Abdominal Pain in Children": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Peritonism","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Testicular torsion","priority":"Orange"},{"text":"Bile-stained vomit","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"Dehydration","priority":"Yellow"},{"text":"Abdominal distension","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Recent problem","priority":"Blue"}],
    "Allergies": [{"text":"Airway compromise","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Stridor","priority":"Orange"},{"text":"Wheeze","priority":"Orange"},{"text":"Oedema of tongue/throat","priority":"Orange"},{"text":"Widespread rash","priority":"Yellow"},{"text":"Facial oedema","priority":"Yellow"},{"text":"History of severe reaction","priority":"Yellow"},{"text":"Localised rash","priority":"Green"},{"text":"Itch","priority":"Green"}],
    "Assault": [{"text":"Airway compromise","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Penetrating injury to head, neck, torso","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Large haematoma","priority":"Yellow"},{"text":"History of LOC","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Small laceration","priority":"Green"},{"text":"Recent problem","priority":"Blue"}],
    "Back Pain": [{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New extensive neurological deficit","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"New focal neurological deficit","priority":"Yellow"},{"text":"Cauda equina syndrome symptoms","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Mechanical back pain","priority":"Green"},{"text":"Old problem","priority":"Blue"}],
    "Breathing Problems": [{"text":"Apnoeic","priority":"Red"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Shock","priority":"Orange"},{"text":"Stridor","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Moderate respiratory distress","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Mild respiratory distress","priority":"Green"},{"text":"Cough","priority":"Green"},{"text":"Sore throat","priority":"Green"}],
    "Burns and Scalds": [{"text":"Major burn (>15% adult, >10% child)","priority":"Red"},{"text":"Airway compromise","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Inhalational injury","priority":"Orange"},{"text":"Circumferential burn","priority":"Orange"},{"text":"Chemical/electrical burn","priority":"Orange"},{"text":"Moderate burn (5-15% adult, 5-10% child)","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Burn to face, hands, feet, perineum","priority":"Yellow"},{"text":"Minor burn (<5%)","priority":"Green"},{"text":"Mild pain","priority":"Green"},{"text":"Sunburn","priority":"Blue"}],
    "Chest Pain": [{"text":"Airway compromise","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Cardiac-type chest pain at rest","priority":"Yellow"},{"text":"Pleuritic chest pain","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Recent non-cardiac pain","priority":"Green"},{"text":"Musculoskeletal pain","priority":"Green"}],
    "Collapse": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"New GCS < 15","priority":"Orange"},{"text":"Seizing now","priority":"Orange"},{"text":"Significant injury","priority":"Orange"},{"text":"Post-ictal","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Cardiac history","priority":"Yellow"},{"text":"Simple faint, now recovered","priority":"Green"},{"text":"Normal vital signs","priority":"Green"}],
    "Crying Baby": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Seizing now","priority":"Orange"},{"text":"Non-blanching rash","priority":"Orange"},{"text":"High-pitched/inconsolable cry","priority":"Orange"},{"text":"Grunting/severe respiratory distress","priority":"Orange"},{"text":"Looks unwell","priority":"Yellow"},{"text":"Dehydration","priority":"Yellow"},{"text":"Fever","priority":"Yellow"},{"text":"Parental concern","priority":"Yellow"},{"text":"Seems well","priority":"Green"}],
    "Dental Problems": [{"text":"Airway compromise","priority":"Red"},{"text":"Uncontrolled bleeding","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Facial swelling with systemic signs","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Facial swelling","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Lost filling","priority":"Blue"}],
    "Diarrhoea and Vomiting": [{"text":"Shock","priority":"Red"},{"text":"Severe dehydration","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Moderate dehydration","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"High fever","priority":"Yellow"},{"text":"Mild dehydration","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Diarrhoea","priority":"Green"}],
    "Ear Problems": [{"text":"Severe pain","priority":"Orange"},{"text":"Sudden onset deafness","priority":"Orange"},{"text":"Mastoid tenderness","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Discharge","priority":"Yellow"},{"text":"Foreign body","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Wax","priority":"Blue"}],
    "Eye Problems": [{"text":"Sudden loss of vision","priority":"Red"},{"text":"Chemical eye injury","priority":"Red"},{"text":"Penetrating eye injury","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Reduced visual acuity","priority":"Yellow"},{"text":"Foreign body sensation","priority":"Yellow"},{"text":"Painful red eye","priority":"Yellow"},{"text":"Flash burns","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Conjunctivitis","priority":"Green"}],
    "Falls": [{"text":"Major trauma","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Long lie (>1 hour)","priority":"Orange"},{"text":"Suspected neck of femur fracture","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"History of LOC","priority":"Yellow"},{"text":"Inability to weight bear","priority":"Yellow"},{"text":"Head injury with anticoagulants","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Able to weight bear","priority":"Green"}],
    "Fits": [{"text":"Seizing now","priority":"Red"},{"text":"Post-ictal, not recovering","priority":"Orange"},{"text":"New focal neurology","priority":"Orange"},{"text":"Suspected head injury","priority":"Orange"},{"text":"Post-ictal, recovering","priority":"Yellow"},{"text":"First fit","priority":"Yellow"},{"text":"Fever","priority":"Yellow"},{"text":"Known epileptic, recovered","priority":"Green"}],
    "Head Injury": [{"text":"GCS < 9","priority":"Red"},{"text":"GCS 9-12","priority":"Orange"},{"text":"Penetrating injury","priority":"Orange"},{"text":"Seizing now","priority":"Orange"},{"text":"Focal neurological deficit","priority":"Orange"},{"text":"GCS 13-14","priority":"Yellow"},{"text":"Vomiting >1 episode","priority":"Yellow"},{"text":"History of LOC >5 mins","priority":"Yellow"},{"text":"Amnesia","priority":"Yellow"},{"text":"On anticoagulants","priority":"Yellow"},{"text":"GCS 15, no other factors","priority":"Green"}],
    "Headache": [{"text":"Reduced level of consciousness (GCS < 13)","priority":"Red"},{"text":"Sudden onset severe headache ('thunderclap')","priority":"Orange"},{"text":"New neurological deficit","priority":"Orange"},{"text":"Meningism (fever, neck stiffness, photophobia)","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New onset headache >50 years","priority":"Yellow"},{"text":"Headache with visual disturbance","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Chronic headache, unchanged","priority":"Blue"}],
    "Limb Problem (Injury)": [{"text":"Major trauma","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Neurovascular compromise","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Obvious deformity/dislocation","priority":"Orange"},{"text":"Suspected neck of femur fracture","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Inability to weight bear","priority":"Yellow"},{"text":"Large wound","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Able to weight bear","priority":"Green"},{"text":"Minor injury","priority":"Blue"}],
    "Limb Problem (Non-Injury)": [{"text":"Neurovascular compromise","priority":"Red"},{"text":"Severe pain","priority":"Orange"},{"text":"Hot, swollen, tender joint","priority":"Orange"},{"text":"Suspected DVT","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Cellulitis","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Chronic pain","priority":"Blue"}],
    "Mental Health Problem": [{"text":"Immediate risk to self or others","priority":"Red"},{"text":"Violent or aggressive","priority":"Red"},{"text":"Severe distress or agitation","priority":"Orange"},{"text":"Acute psychosis","priority":"Orange"},{"text":"Overdose (conscious)","priority":"Orange"},{"text":"Suicidal ideation with plan","priority":"Yellow"},{"text":"Distressed","priority":"Yellow"},{"text":"Self-harm (minor)","priority":"Yellow"},{"text":"Low mood, no immediate risk","priority":"Green"},{"text":"Request for medication","priority":"Blue"}],
    "Overdose and Poisoning": [{"text":"Unresponsive","priority":"Red"},{"text":"Seizing now","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Abnormal vital signs","priority":"Orange"},{"text":"High-risk substance (e.g., TCA, Paracetamol > guideline)","priority":"Orange"},{"text":"Deliberate self-harm intent","priority":"Yellow"},{"text":"Symptomatic but stable","priority":"Yellow"},{"text":"Asymptomatic, low-risk substance","priority":"Green"},{"text":"Information request","priority":"Blue"}],
    "Pregnancy": [{"text":"Imminent delivery","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Heavy vaginal bleeding","priority":"Orange"},{"text":"Seizing (eclampsia)","priority":"Orange"},{"text":"Reduced fetal movements","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Minor vaginal bleeding","priority":"Yellow"},{"text":"Ruptured membranes","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"}],
    "Rash": [{"text":"Shock","priority":"Red"},{"text":"Non-blanching rash with fever/lethargy","priority":"Orange"},{"text":"Stridor or wheeze","priority":"Orange"},{"text":"Widespread, blistering rash","priority":"Orange"},{"text":"Non-blanching rash, patient well","priority":"Yellow"},{"text":"Widespread rash with fever","priority":"Yellow"},{"text":"Localised blistering rash","priority":"Yellow"},{"text":"Itchy rash","priority":"Green"},{"text":"Localised rash, patient well","priority":"Green"}],
    "Shortness of Breath in Children": [{"text":"Apnoeic or exhausted","priority":"Red"},{"text":"Severe respiratory distress (e.g., grunting, marked recession, cyanosis)","priority":"Orange"},{"text":"Stridor at rest","priority":"Orange"},{"text":"Altered level of consciousness","priority":"Orange"},{"text":"Moderate respiratory distress (e.g., some recession, nasal flaring)","priority":"Yellow"},{"text":"Audible wheeze","priority":"Yellow"},{"text":"History of apnoea","priority":"Yellow"},{"text":"Mild increased work of breathing","priority":"Green"},{"text":"Cough/coryza, no distress","priority":"Green"}],
    "Unwell Adult": [{"text":"Unresponsive or airway compromise","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"New GCS < 15","priority":"Orange"},{"text":"High risk of sepsis (meets criteria)","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Looks very unwell","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Significant history","priority":"Yellow"},{"text":"Looks well, normal vital signs","priority":"Green"},{"text":"Symptom enquiry only","priority":"Blue"}],
    "Urinary Problems": [{"text":"Shock (septic)","priority":"Red"},{"text":"Severe pain (renal colic/retention)","priority":"Orange"},{"text":"Systemically unwell with fever","priority":"Orange"},{"text":"Acute urinary retention","priority":"Yellow"},{"text":"Visible haematuria","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Symptoms of UTI","priority":"Green"},{"text":"Catheter problem","priority":"Green"}],
    "Worried Parent": [{"text":"Parent states 'child is dying'","priority":"Red"},{"text":"Parent states 'child is very ill'","priority":"Orange"},{"text":"Parent states 'child is ill'","priority":"Yellow"},{"text":"Parent is worried","priority":"Green"}]
};

const contextQuestions = {
    'Chest Pain': [
        { id: 'cp-onset', label: 'Onset (sudden/gradual)?' },
        { id: 'cp-character', label: 'Character (sharp/dull)?' },
        { id: 'cp-radiation', label: 'Radiation?' },
        { id: 'cp-exertion', label: 'Worse on exertion?' },
        { id: 'cp-pleuritic', label: 'Pleuritic (worse on inspiration)?' }
    ],
    'Abdominal Pain': [
        { id: 'ap-location', label: 'Location of pain (e.g., RUQ, central)?' },
        { id: 'ap-bowels', label: 'Change in bowel habit?' },
        { id: 'ap-urinary', label: 'Urinary symptoms?' },
        { id: 'ap-vomiting', label: 'Vomiting?' }
    ]
};

const differentialDiagnoses = {
    'Chest Pain': {
        'default': ['ACS', 'PE', 'Aortic Dissection', 'Pericarditis', 'Pneumothorax', 'Musculoskeletal Pain', 'GORD'],
        'pleuritic': ['PE', 'Pneumothorax', 'Pericarditis', 'Pneumonia', 'Musculoskeletal Pain']
    },
    'Abdominal Pain': {
        'default': ['Appendicitis', 'Bowel Obstruction', 'Pancreatitis', 'Cholecystitis', 'Diverticulitis', 'AAA', 'Gastritis']
    },
    'Overdose and Poisoning': {
        'default': ['Paracetamol Overdose', 'Salicylate Overdose', 'Opioid Overdose', 'TCA Overdose', 'Serotonin Syndrome']
    }
};

// --- 4. CLINICAL PROTOCOLS ---
// Maps Presenting Complaints to Investigations & Actions
const clinicalProtocols = {
    "Abdominal Pain": {
        bloods: "Surgical",
        urine: "Urinalysis + β-HCG (female <55)",
        cannula: "conditional",
        special: ["NBM", "Pain Score Reassessment"]
    },
    "Abdominal Pain - Lower": {
        bloods: "Surgical",
        urine: "Urinalysis + β-HCG (Mandatory)",
        cannula: "conditional",
        special: ["Consider Ectopic (if female)", "Consider Appendicitis/Diverticulitis"]
    },
    "Abdominal Pain - Upper": {
        bloods: "Surgical",
        urine: "Urinalysis + β-HCG",
        cannula: "conditional",
        bedside: ["12-Lead ECG (Inferior MI?)", "VBG (Lactate)"],
        special: ["Gastritis/Gallstones/Pancreatitis differential"]
    },
    "Abdominal Pain in Children": {
        bloods: "FBC, U&E, CRP, Group & Save, Amylase",
        urine: "Urinalysis",
        cannula: "conditional",
        special: ["Surgical Review", "Testicular Exam (if male)"]
    },
    "Diarrhoea and Vomiting": {
        bloods: "FBC, U&E, CRP, VBG (Lactate)",
        urine: "Urinalysis (Exclude DKA)",
        cannula: "conditional",
        special: ["Stool Sample (if travel/abx/bloody)", "Side Room Isolation"]
    },
    "GI Bleed": {
        bloods: "Trauma",
        urine: null,
        cannula: true,
        bedside: ["VBG (Lactate & Hb)"],
        special: ["Glasgow-Blatchford Score", "NBM", "Activate Major Haemorrhage if unstable"]
    },
    "Jaundice": {
        bloods: "Surgical",
        urine: "Urinalysis (Bilirubin)",
        cannula: true,
        special: ["Septic Screen if febrile (Cholangitis risk)", "Viral Hepatitis Screen"]
    },
    "Ascites": {
        bloods: "Surgical",
        urine: "Urinalysis",
        cannula: "conditional",
        special: ["Coagulation Screen", "Diagnostic Paracentesis consideration"]
    },
    "Chest Pain": {
        bloods: "Cardiac",
        urine: null,
        cannula: true,
        bedside: ["12-Lead ECG (Repeat @ 60m if normal)"],
        imaging: ["CXR"],
        special: ["HEART Score", "Aspirin 300mg (if cardiac & not allergic)"]
    },
    "Chest Pain - Pleuritic": {
        bloods: "FBC, U&E, CRP, Coagulation",
        urine: "β-HCG",
        cannula: true,
        bedside: ["12-Lead ECG", "Well's Score Assessment"],
        imaging: ["CXR"],
        special: ["D-Dimer (only if Wells score low)"]
    },
    "Palpitations": {
        bloods: "Routine",
        urine: "β-HCG",
        cannula: true,
        bedside: ["12-Lead ECG", "Lie/Stand BP"],
        special: ["Add Magnesium, Phosphate, TSH", "Cardiac Monitor"]
    },
    "Shortness of Breath": {
        bloods: "Resp",
        urine: null,
        cannula: "conditional",
        bedside: ["12-Lead ECG", "ABG (if Sats <92% or CO2 retainer risk)"],
        imaging: ["CXR"],
        special: ["Nebulisers if indicated", "Review for Pneumonia (CURB-65)"]
    },
    "Asthma": {
        bloods: "FBC, U&E, CRP",
        urine: null,
        cannula: "conditional",
        bedside: ["VBG (if severe)", "Peak Flow Measurement (Essential)"],
        imaging: ["CXR (only if consolidation/pneumothorax suspected)"],
        special: ["Back-to-back nebs if severe", "Steroids (Prednisolone/Hydrocortisone)"]
    },
    "COPD": {
        bloods: "Resp",
        urine: null,
        cannula: "conditional",
        bedside: ["ABG (Essential if Sats <92%)", "ECG"],
        imaging: ["CXR"],
        special: ["Controlled Oxygen (88-92% target)", "Nebulisers", "Steroids"]
    },
    "Headache": {
        bloods: "Routine",
        urine: "β-HCG",
        cannula: "conditional",
        special: ["Full Neuro Exam", "Fundoscopy"]
    },
    "Headache - Sudden Onset": {
        bloods: "FBC, U&E, CRP, Coagulation, Group & Save",
        urine: "β-HCG",
        cannula: true,
        special: ["CT Head URGENT (<1hr)", "LP if CT negative >12hrs"]
    },
    "Headache - Meningitic": {
        bloods: "Sepsis",
        urine: null,
        cannula: true,
        bedside: ["Blood Cultures", "Throat Swab"],
        special: ["Urgent Antibiotics (Ceftriaxone)", "LP consideration"]
    },
    "Headache - Temporal Arteritis": {
        bloods: "FBC, U&E, CRP, LFT, Bone Profile",
        urine: null,
        cannula: false,
        special: ["Add ESR (Essential)", "Ophthalmology Referral if visual symptoms", "Start Steroids if high suspicion"]
    },
    "Head Injury": {
        bloods: "Trauma",
        urine: null,
        cannula: false,
        imaging: ["CT Head (Review NICE CG176 Criteria)"],
        special: ["Neuro Obs (Q30m)", "Check Anticoagulant Status"]
    },
    "Stroke": {
        bloods: "Stroke",
        urine: null,
        cannula: true,
        bedside: ["Blood Glucose (Mandatory)", "ECG"],
        imaging: ["CT Head URGENT"],
        special: ["FAST Positive? -> Stroke Call", "NBM until Swallow Screen"]
    },
    "Seizure": {
        bloods: "Routine",
        urine: "β-HCG",
        cannula: "conditional",
        bedside: ["Blood Glucose", "ECG"],
        special: ["Add Calcium, Magnesium", "CT Head if first seizure"]
    },
    "Confusion": {
        bloods: "Confused",
        urine: "Urinalysis (Essential)",
        cannula: "conditional",
        bedside: ["Blood Glucose", "VBG"],
        imaging: ["CXR", "Consider CT Head"],
        special: ["4AT Delirium Screen", "Review medications (Anticholinergic burden)"]
    },
    "Syncope / Collapse": {
        bloods: "FBC, U&E, CRP, Glucose",
        urine: "β-HCG",
        cannula: false,
        bedside: ["12-Lead ECG", "Lie/Stand BP (Essential)"],
        special: ["EGSYS Score", "Driving Advice", "Review drug chart"]
    },
    "Vertigo": {
        bloods: "FBC, U&E",
        urine: null,
        cannula: false,
        bedside: ["ECG", "HINTS Exam (if continuous vertigo)"],
        special: ["Dix-Hallpike Test (if positional)", "Neuro Exam"]
    },
    "Falls": {
        bloods: "Routine",
        urine: "Urinalysis",
        cannula: false,
        bedside: ["Lie/Stand BP", "ECG"],
        imaging: ["X-Ray relevant area", "CT Head if criteria met"],
        special: ["Add CK if long lie (>1hr)", "Frailty Assessment"]
    },
    "Back Pain": {
        bloods: "FBC, U&E, CRP, LFT, Bone Profile",
        urine: "Urinalysis",
        cannula: false,
        bedside: ["Post-void Bladder Scan (Cauda Equina exclusion)"],
        special: ["Neuro Exam (Perineal sensation/Anal tone)", "Add ESR if >50y (Myeloma screen)"]
    },
    "Limb Problem (Injury)": {
        bloods: null,
        urine: null,
        cannula: false,
        imaging: ["X-Ray as per Ottawa Rules"],
        special: ["Analgesia", "Neurovascular Status Check"]
    },
    "Limb Swelling (DVT)": {
        bloods: "FBC, U&E, Coagulation",
        urine: "β-HCG",
        cannula: false,
        special: ["Wells Score (DVT)", "D-Dimer (only if Wells Low/Mod)"]
    },
    "Joint Swelling - Septic": {
        bloods: "Sepsis",
        urine: null,
        cannula: true,
        special: ["Orthopaedic Review", "Joint Aspiration", "NBM"]
    },
    "Joint Swelling - Other": {
        bloods: "FBC, U&E, CRP, Urate",
        urine: null,
        cannula: false,
        imaging: ["X-Ray"],
        special: ["Analgesia", "Rule out septic arthritis"]
    },
    "Burns and Scalds": {
        bloods: "FBC, U&E, CRP, Glucose, Coagulation, Group & Save",
        urine: null,
        cannula: true,
        special: ["Lund & Browder Chart (TBSA)", "Fluid Resus (Parkland)", "Check Tetanus", "ECG (if electrical)"]
    },
    "Assault": {
        bloods: "Trauma",
        urine: "β-HCG",
        cannula: "conditional",
        imaging: ["X-Ray/CT as indicated"],
        special: ["Police involvement?", "Forensic documentation", "Safeguarding"]
    },
    "Wounds": {
        bloods: null,
        urine: null,
        cannula: false,
        imaging: ["X-Ray (check for foreign body/glass)"],
        special: ["Tetanus Check", "Irrigation", "Closure"]
    },
    "Bites and Stings": {
        bloods: "FBC, U&E, CRP",
        urine: null,
        cannula: "conditional",
        special: ["Tetanus Check", "Antibiotic prophylaxis?", "X-Ray if teeth retained"]
    },
    "Eye Problems": {
        bloods: null,
        urine: null,
        cannula: false,
        special: ["Visual Acuity (Essential)", "Fluorescein Stain", "Evert Lids", "Ophth Referral if visual loss"]
    },
    "Ear Problems": {
        bloods: null,
        urine: null,
        cannula: false,
        special: ["Otoscopy", "Antibiotics if systemically unwell"]
    },
    "Sore Throat": {
        bloods: "FBC, U&E, CRP, LFT (Glandular fever screen)",
        urine: null,
        cannula: "conditional",
        special: ["Centor/FeverPAIN Score", "Throat Swab?", "Rule out Quinsy (Trismus?)"]
    },
    "Dental Problems": {
        bloods: null,
        urine: null,
        cannula: false,
        special: ["Analgesia", "Dental Nerve Block?", "Refer to Dentist/MaxFax"]
    },
    "Fever": {
        bloods: "Sepsis",
        urine: "Urinalysis",
        cannula: true,
        bedside: ["VBG (Lactate)", "Blood Cultures x2"],
        imaging: ["CXR"],
        special: ["Sepsis Six Pathway", "Source Isolation"]
    },
    "Neutropenic Sepsis": {
        bloods: "Sepsis",
        urine: "Urinalysis + Culture",
        cannula: true,
        bedside: ["VBG (Lactate)", "Peripheral Blood Culture", "Line Blood Culture"],
        special: ["Urgent Antibiotics (<1hr)", "Protective Isolation", "MASCC Score"]
    },
    "Overdose and Poisoning": {
        bloods: "Overdose",
        urine: "Urinalysis (Toxicology if indicated)",
        cannula: true,
        bedside: ["12-Lead ECG (Essential for TCA/cardiotoxins)"],
        special: ["Psych Liaison Referral", "Toxbase Check", "Paracetamol Level @ 4hrs"]
    },
    "Allergies": {
        bloods: "Mast Cell Tryptase (if Anaphylaxis)",
        urine: null,
        cannula: "conditional",
        special: ["Chlorphenamine/Hydrocortisone", "Observe 4-6hrs (Biphasic reaction)"]
    },
    "Rash": {
        bloods: "FBC, U&E, CRP, LFT, Coagulation",
        urine: "Urinalysis",
        cannula: "conditional",
        special: ["Glass Test (blanching?)", "Photographs"]
    },
    "Cellulitis": {
        bloods: "FBC, U&E, CRP",
        urine: null,
        cannula: "conditional",
        special: ["Mark erythema line", "Wound swab (only if broken skin)"]
    },
    "Unwell Adult": {
        bloods: "Routine",
        urine: "Urinalysis",
        cannula: true,
        bedside: ["VBG", "ECG"],
        special: ["Review NEWS2 Triggers"]
    },
    "Hyponatraemia": {
        bloods: "FBC, U&E, LFT, TSH, Cortisol, Glucose, Lipids",
        urine: "Urinalysis",
        cannula: "conditional",
        special: ["Paired Serum/Urine Osmolality", "Paired Serum/Urine Sodium", "Fluid Status Assess"]
    },
    "Diabetes": {
        bloods: "FBC, U&E, CRP, Glucose, VBG (pH/Bicarb/Ketones)",
        urine: "Urinalysis (Ketones)",
        cannula: true,
        special: ["Blood Ketones", "DKA Pathway"]
    },
    "Urinary Problems": {
        bloods: "FBC, U&E, CRP",
        urine: "Urinalysis + Culture",
        cannula: false,
        bedside: ["Bladder Scan (if retention)"],
        special: ["Prostate Exam (male retention)", "Catheterisation?"]
    },
    "Testicular Pain": {
        bloods: "FBC, U&E, CRP",
        urine: "Urinalysis + STI Screen",
        cannula: "conditional",
        special: ["Urgent Surgical Review (Exclude Torsion)", "NBM"]
    },
    "Pregnancy": {
        bloods: "FBC, U&E, LFT, Coagulation, Group & Save, Urate",
        urine: "Urinalysis (Protein)",
        cannula: "conditional",
        special: ["Refer to Maternity Triage", "BP Check (Pre-eclampsia)"]
    },
    "PV Bleeding": {
        bloods: "FBC, Group & Save (essential)",
        urine: "Pregnancy Test (Mandatory)",
        cannula: "conditional",
        special: ["Speculum Exam", "Refer Early Pregnancy Unit / Gynae", "Anti-D required?"]
    },
    "Sexual Health": {
        bloods: "HIV, Syphilis Serology",
        urine: "NAAT (Chlamydia/Gonorrhoea)",
        cannula: false,
        special: ["Refer to GUM clinic", "Partner notification"]
    },
    "Mental Health": {
        bloods: "Routine, Paracetamol/Salicylate, Alcohol Level",
        urine: "Urinalysis (Drug Screen)",
        cannula: false,
        special: ["Risk Assessment (Self/Others)", "Organic exclusion", "Psych Liaison"]
    },
    "Self Harm": {
        bloods: "Routine, Coagulation, Paracetamol/Salicylate",
        urine: "Urinalysis",
        cannula: "conditional",
        special: ["Wound care", "Psych Liaison Referral", "Tetanus"]
    }
};
