// protocols.js - Complete Clinical Configuration
// Version: 4.0 (The "Mega-Expansion")
// Covers: 50+ Presentations, RCEM/NICE Guidelines, and Local Matrices.

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

// --- 2. CLINICAL PROTOCOLS ---
// Maps Presenting Complaints to Investigations & Actions
const clinicalProtocols = {

    // === ABDOMINAL & GASTROINTESTINAL ===
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
    "GI Bleed": { // Haematemesis / Melaena
        bloods: "Trauma", // Cross match essential
        urine: null,
        cannula: true, // Large bore x2
        bedside: ["VBG (Lactate & Hb)"],
        special: ["Glasgow-Blatchford Score", "NBM", "Activate Major Haemorrhage if unstable"]
    },
    "Jaundice": {
        bloods: "Surgical", // Add Coag + Split Bili
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

    // === CARDIAC & RESPIRATORY ===
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

    // === NEUROLOGICAL & HEAD ===
    "Headache": {
        bloods: "Routine",
        urine: "β-HCG",
        cannula: "conditional",
        special: ["Full Neuro Exam", "Fundoscopy"]
    },
    "Headache - Sudden Onset": { // Thunderclap
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
    "Headache - Temporal Arteritis": { // New >50y
        bloods: "FBC, U&E, CRP, LFT, Bone Profile",
        urine: null,
        cannula: false,
        special: ["Add ESR (Essential)", "Ophthalmology Referral if visual symptoms", "Start Steroids if high suspicion"]
    },
    "Head Injury": {
        bloods: "Trauma", // Coag/G&S check
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

    // === INJURY, ORTHO & TRAUMA ===
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
        cannula: true, // If >10% TBSA
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

    // === EENT & DENTAL ===
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

    // === SYSTEMIC, METABOLIC & INFECTION ===
    "Fever": { // Sepsis Screen
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
    "Diabetes": { // DKA / HHS / Hypo
        bloods: "FBC, U&E, CRP, Glucose, VBG (pH/Bicarb/Ketones)",
        urine: "Urinalysis (Ketones)",
        cannula: true,
        special: ["Blood Ketones", "DKA Pathway"]
    },

    // === UROLOGY, GYNAE & SEXUAL HEALTH ===
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
    "Pregnancy": { // >20 weeks
        bloods: "FBC, U&E, LFT, Coagulation, Group & Save, Urate",
        urine: "Urinalysis (Protein)",
        cannula: "conditional",
        special: ["Refer to Maternity Triage", "BP Check (Pre-eclampsia)"]
    },
    "PV Bleeding": { // Early Pregnancy / Gynae
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

    // === MENTAL HEALTH ===
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
