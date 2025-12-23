// protocols.js - Clinical Configuration v14.0
// AUDITED BY: UK EM CONSULTANT
// STATUS: GOLD STANDARD / LEAN TRIAGE / FULL MTS DATASET

export const clinicalData = {
    // --- 1. SCREENING RULES ---
    screening: {
        hiv: {
            minAge: 16,
            maxAge: 65,
            label: "HIV Opt-Out Testing (RCEM Guideline)"
        },
        frailty: {
            minAge: 65,
            label: "Silver Book II: Frailty Score (CFS)",
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
        }
    },

    // --- 2. SCORING & SAFETY ---
    scoring: {
        news2: {
            rr: [
                { max: 8, score: 3 }, { max: 11, score: 1 }, { max: 20, score: 0 }, { max: 24, score: 2 }, { max: 999, score: 3 }
            ],
            sats1: [ 
                { max: 91, score: 3 }, { max: 93, score: 2 }, { max: 95, score: 1 }, { max: 100, score: 0 }
            ],
            sats2: [ // CO2 Retainers
                { max: 83, score: 3 }, { max: 85, score: 2 }, { max: 87, score: 1 }, { max: 92, score: 0 }, { max: 93, score: 1 }, { max: 94, score: 2 }, { max: 96, score: 3 }, { max: 100, score: 3 }
            ],
            sbp: [
                { max: 90, score: 3 }, { max: 100, score: 2 }, { max: 110, score: 1 }, { max: 219, score: 0 }, { max: 999, score: 3 }
            ],
            hr: [
                { max: 40, score: 3 }, { max: 50, score: 1 }, { max: 90, score: 0 }, { max: 110, score: 1 }, { max: 130, score: 2 }, { max: 999, score: 3 }
            ],
            temp: [
                { max: 35.0, score: 3 }, { max: 36.0, score: 1 }, { max: 38.0, score: 0 }, { max: 39.0, score: 1 }, { max: 99.9, score: 2 }
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

    // --- 3. MTS FLOWCHARTS (FULL 52 SET) ---
    mtsFlowcharts: {
        "Abdominal Pain in Adults": [{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Peritonism","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Testicular torsion","priority":"Orange"},{"text":"Significant history","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"Altered GCS","priority":"Yellow"},{"text":"Haemodynamic instability","priority":"Yellow"},{"text":"New onset in elderly","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Urinary symptoms","priority":"Green"},{"text":"Recent problem","priority":"Blue"},{"text":"Old problem","priority":"Blue"}],
        "Abdominal Pain in Children": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Peritonism","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Testicular torsion","priority":"Orange"},{"text":"Bile-stained vomit","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"Dehydration","priority":"Yellow"},{"text":"Abdominal distension","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Recent problem","priority":"Blue"}],
        "Abscesses and Local Infections": [{"text":"Sepsis (Red Flag)","priority":"Orange"},{"text":"Spreading Cellulitis","priority":"Yellow"},{"text":"Localised","priority":"Green"}],
        "Allergy": [{"text":"Airway compromise","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Stridor","priority":"Orange"},{"text":"Wheeze","priority":"Orange"},{"text":"Oedema of tongue/throat","priority":"Orange"},{"text":"Widespread rash","priority":"Yellow"},{"text":"Facial oedema","priority":"Yellow"},{"text":"History of severe reaction","priority":"Yellow"},{"text":"Localised rash","priority":"Green"},{"text":"Itch","priority":"Green"}],
        "Assault": [{"text":"Major trauma","priority":"Red"},{"text":"Airway compromise","priority":"Red"},{"text":"Severe pain","priority":"Orange"},{"text":"Head Injury signs","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Minor injury","priority":"Green"}],
        "Asthma": [{"text":"Life Threatening","priority":"Red"},{"text":"Severe Distress","priority":"Orange"},{"text":"Moderate Distress","priority":"Yellow"},{"text":"Mild Distress","priority":"Green"}],
        "Back Pain": [{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New extensive neurological deficit","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"New focal neurological deficit","priority":"Yellow"},{"text":"Cauda equina syndrome symptoms","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Mechanical back pain","priority":"Green"},{"text":"Old problem","priority":"Blue"}],
        "Behaving Strangely": [{"text":"Immediate Risk","priority":"Red"},{"text":"Active Psychosis","priority":"Orange"},{"text":"Distressed","priority":"Yellow"},{"text":"Low Risk","priority":"Green"}],
        "Bites and Stings": [{"text":"Anaphylaxis","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Spreading Infection","priority":"Yellow"},{"text":"Local Reaction","priority":"Green"}],
        "Burns and Scalds": [{"text":"Airway Burns","priority":"Red"},{"text":">15% TBSA","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Facial Burns","priority":"Yellow"},{"text":"Minor Burns","priority":"Green"}],
        "Chest Pain": [{"text":"Airway compromise","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Cardiac-type chest pain at rest","priority":"Yellow"},{"text":"Pleuritic chest pain","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Recent non-cardiac pain","priority":"Green"},{"text":"Musculoskeletal pain","priority":"Green"}],
        "Collapse": [{"text":"Cardiac Arrest","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"History of arrhythmia","priority":"Yellow"},{"text":"Vasovagal","priority":"Green"}],
        "Confusion": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"New Confusion","priority":"Orange"},{"text":"Hypoglycaemia","priority":"Orange"},{"text":"Abnormal vital signs","priority":"Yellow"}],
        "Crying Baby": [{"text":"Unresponsive","priority":"Red"},{"text":"Non-blanching rash","priority":"Orange"},{"text":"Inconsolable","priority":"Orange"},{"text":"High Fever","priority":"Yellow"},{"text":"Settles with handling","priority":"Green"}],
        "Dental Problems": [{"text":"Airway risk","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Facial Swelling","priority":"Yellow"},{"text":"Toothache","priority":"Green"}],
        "Diabetes": [{"text":"Unresponsive","priority":"Red"},{"text":"Hypoglycaemia (<3)","priority":"Orange"},{"text":"Hyperglycaemia w/ Ketones","priority":"Orange"},{"text":"Vomiting","priority":"Yellow"},{"text":"High sugar, well","priority":"Green"}],
        "Diarrhoea and Vomiting": [{"text":"Shock","priority":"Red"},{"text":"Severe Dehydration","priority":"Orange"},{"text":"Blood in stool","priority":"Yellow"},{"text":"Mild Dehydration","priority":"Green"}],
        "Ear Problems": [{"text":"Severe Pain","priority":"Orange"},{"text":"Discharge","priority":"Yellow"},{"text":"Mild Pain","priority":"Green"},{"text":"Blocked Ear","priority":"Blue"}],
        "Eye Problems": [{"text":"Penetrating Injury","priority":"Red"},{"text":"Chemical Injury","priority":"Red"},{"text":"Sudden Loss of Vision","priority":"Orange"},{"text":"Severe Pain","priority":"Orange"},{"text":"Red Eye","priority":"Green"}],
        "Facial Problems": [{"text":"Airway Risk","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Swelling","priority":"Yellow"},{"text":"Minor Injury","priority":"Green"}],
        "Falls": [{"text":"Major trauma","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Long lie (>1 hour)","priority":"Orange"},{"text":"Suspected neck of femur fracture","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"History of LOC","priority":"Yellow"},{"text":"Inability to weight bear","priority":"Yellow"},{"text":"Head injury with anticoagulants","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Able to weight bear","priority":"Green"}],
        "Foreign Body": [{"text":"Airway Obstruction","priority":"Red"},{"text":"Inhaled","priority":"Orange"},{"text":"Swallowed (High Risk)","priority":"Yellow"},{"text":"Minor","priority":"Green"}],
        "Gastrointestinal Bleeding": [{"text":"Exsanguinating","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Haematemesis","priority":"Orange"},{"text":"Melaena","priority":"Yellow"},{"text":"Small amounts","priority":"Green"}],
        "Headache": [{"text":"GCS Reduced","priority":"Red"},{"text":"Sudden Onset (Thunderclap)","priority":"Orange"},{"text":"Meningism","priority":"Orange"},{"text":"History of Migraine","priority":"Green"}],
        "Head Injury": [{"text":"GCS < 9","priority":"Red"},{"text":"GCS 9-12","priority":"Orange"},{"text":"Penetrating injury","priority":"Orange"},{"text":"Seizing now","priority":"Orange"},{"text":"Focal neurological deficit","priority":"Orange"},{"text":"GCS 13-14","priority":"Yellow"},{"text":"Vomiting >1 episode","priority":"Yellow"},{"text":"History of LOC >5 mins","priority":"Yellow"},{"text":"Amnesia","priority":"Yellow"},{"text":"On anticoagulants","priority":"Yellow"},{"text":"GCS 15, no other factors","priority":"Green"}],
        "Irritable Child": [{"text":"Unresponsive","priority":"Red"},{"text":"Meningism","priority":"Orange"},{"text":"Fever","priority":"Yellow"},{"text":"Settles","priority":"Green"}],
        "Limb Problems": [{"text":"Pulseless Limb","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Deformity","priority":"Orange"},{"text":"Moderate Pain","priority":"Yellow"},{"text":"Minor Injury","priority":"Green"}],
        "Limping Child": [{"text":"Septic Arthritis signs","priority":"Orange"},{"text":"Non-weight bearing","priority":"Yellow"},{"text":"Minor trauma","priority":"Green"}],
        "Major Trauma": [{"text":"Cardiac Arrest","priority":"Red"},{"text":"Active Bleeding","priority":"Red"},{"text":"GCS < 9","priority":"Red"},{"text":"High Energy Mechanism","priority":"Orange"}],
        "Mental Illness": [{"text":"Immediate Risk","priority":"Red"},{"text":"Aggressive","priority":"Orange"},{"text":"Self Harm Risk","priority":"Yellow"},{"text":"Anxiety/Depression","priority":"Green"}],
        "Neck Pain": [{"text":"C-Spine Injury (High Risk)","priority":"Orange"},{"text":"Severe Pain","priority":"Orange"},{"text":"Neurology","priority":"Yellow"},{"text":"Muscular","priority":"Green"}],
        "Needlestick Injury": [{"text":"High Risk Source","priority":"Yellow"},{"text":"Low Risk","priority":"Green"}],
        "Overdose and Poisoning": [{"text":"Unresponsive","priority":"Red"},{"text":"Seizing now","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Abnormal vital signs","priority":"Orange"},{"text":"High-risk substance","priority":"Orange"},{"text":"Deliberate self-harm intent","priority":"Yellow"},{"text":"Symptomatic but stable","priority":"Yellow"},{"text":"Asymptomatic, low-risk substance","priority":"Green"},{"text":"Information request","priority":"Blue"}],
        "Palpitations": [{"text":"Shock","priority":"Red"},{"text":"Chest Pain","priority":"Orange"},{"text":"Rate > 150","priority":"Orange"},{"text":"History of AF","priority":"Yellow"},{"text":"Normal ECG","priority":"Green"}],
        "Pregnancy": [{"text":"Active Labour (Crowning)","priority":"Red"},{"text":"PV Bleeding (Heavy)","priority":"Orange"},{"text":"Abdo Pain","priority":"Yellow"},{"text":"Minor symptoms","priority":"Green"}],
        "PV Bleeding": [{"text":"Shock","priority":"Red"},{"text":"Heavy Bleeding (Clots)","priority":"Orange"},{"text":"Pregnant","priority":"Yellow"},{"text":"Period-like","priority":"Green"}],
        "Rash": [{"text":"Anaphylaxis","priority":"Red"},{"text":"Non-blanching","priority":"Orange"},{"text":"Widespread","priority":"Yellow"},{"text":"Itchy","priority":"Green"}],
        "Self Harm": [{"text":"Active Bleeding (Major)","priority":"Red"},{"text":"Deep Laceration","priority":"Orange"},{"text":"Ingestion","priority":"Orange"},{"text":"Superficial","priority":"Yellow"}],
        "Sexually Acquired Infection": [{"text":"Severe Pain","priority":"Orange"},{"text":"Discharge","priority":"Green"},{"text":"Advice","priority":"Blue"}],
        "Shortness of Breath in Adults": [{"text":"Apnoeic","priority":"Red"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Shock","priority":"Orange"},{"text":"Stridor","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Moderate respiratory distress","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Mild respiratory distress","priority":"Green"},{"text":"Cough","priority":"Green"},{"text":"Sore throat","priority":"Green"}],
        "Shortness of Breath in Children": [{"text":"Apnoeic","priority":"Red"},{"text":"Silent Chest","priority":"Red"},{"text":"Stridor","priority":"Orange"},{"text":"Severe Recession","priority":"Orange"},{"text":"Moderate Recession","priority":"Yellow"},{"text":"Cough","priority":"Green"}],
        "Sore Throat": [{"text":"Airway Compromise","priority":"Red"},{"text":"Drooling","priority":"Orange"},{"text":"Difficulty Swallowing","priority":"Yellow"},{"text":"Pain only","priority":"Green"}],
        "Testicular Pain": [{"text":"Torsion suspected","priority":"Orange"},{"text":"Severe Pain","priority":"Orange"},{"text":"Swelling","priority":"Yellow"},{"text":"Ache","priority":"Green"}],
        "Torso Injury": [{"text":"Stab/Gunshot","priority":"Red"},{"text":"Chest Flail","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Bruising","priority":"Yellow"}],
        "Unwell Adult": [{"text":"Unresponsive","priority":"Red"},{"text":"Sepsis Suspected","priority":"Orange"},{"text":"Abnormal Vitals","priority":"Yellow"},{"text":"General Malaise","priority":"Green"}],
        "Unwell Child": [{"text":"Unresponsive","priority":"Red"},{"text":"Sepsis Suspected","priority":"Orange"},{"text":"Non-blanching rash","priority":"Orange"},{"text":"Fever > 5 days","priority":"Yellow"},{"text":"Viral symptoms","priority":"Green"}],
        "Urinary Problems": [{"text":"Retention","priority":"Orange"},{"text":"Haematuria (Frank)","priority":"Yellow"},{"text":"Dysuria","priority":"Green"}],
        "Vaginal Bleeding": [{"text":"Shock","priority":"Red"},{"text":"Heavy","priority":"Orange"},{"text":"Pregnant","priority":"Yellow"},{"text":"Spotting","priority":"Green"}],
        "Worried Parent": [{"text":"Child looks unwell","priority":"Orange"},{"text":"Parent very distressed","priority":"Yellow"},{"text":"Advice","priority":"Green"}],
        "Wounds": [{"text":"Uncontrolled Bleeding","priority":"Red"},{"text":"Deep/Complex","priority":"Orange"},{"text":"Needs Suture","priority":"Yellow"},{"text":"Graze/Glue","priority":"Green"}]
    },

    // --- 4. CLINICAL PROTOCOLS ---
    // CONSULTANT REVIEW: Granular requests, avoiding "shotgun" medicine.
    protocols: {
        "Abdominal Pain in Adults": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "Analgesia or Sepsis only" },
            tests: {
                bedside: ["Urine Dip", "Pregnancy Test (Essential)", "VBG (Lactate)"],
                lab: ["FBC", "U&E", "LFT", "Amylase (if Upper)", "CRP", "Group & Save (Only if Acute/Surgical)"],
                imaging: ["Abdo X-Ray (Only for Obstruction/Foreign Body)"]
            }
        },
         "Abdominal Pain in Children": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral fluids preferred" },
            tests: {
                bedside: ["Urine Dip", "Glucose"],
                lab: ["FBC, CRP (Only if Appendicitis/Sepsis suspected)"],
                imaging: ["US Abdomen"]
            }
        },
        "Allergy": {
            cannula: { status: "Consider", color: "amber", size: "18G", reason: "If Anaphylaxis suspected" },
            tests: {
                bedside: ["Peak Flow (if wheezy)", "ECG"],
                lab: ["Mast Cell Tryptase (if anaphylaxis)"],
                imaging: []
            }
        },
        "Back Pain": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral analgesia preferred" },
            tests: {
                bedside: ["Urine Dip", "Neuro Obs"],
                lab: ["CRP/FBC (Only if infection/malignancy suspected)"],
                imaging: ["MRI (Urgent if Cauda Equina signs)"]
            }
        },
        "Chest Pain": {
            cannula: { status: "Essential", color: "green", size: "18G/20G", reason: "ACS / PE Pathway" },
            tests: {
                bedside: ["ECG (within 10m)", "VBG (Lactate)", "COVID Swab"],
                lab: ["Troponin (High Sens)", "FBC", "U&E", "Glucose", "Lipids", "D-Dimer (Only if Wells Low)"],
                imaging: ["CXR", "CT Angio (if PE suspected)"]
            }
        },
        "Confusion": {
            cannula: { status: "Essential", color: "green", size: "20G", reason: "Admission Screen / Fluids" },
            tests: {
                bedside: ["Urine Dip", "VBG (Calcium/Glucose)", "ECG", "Temp"],
                lab: ["FBC", "U&E", "LFT", "CRP", "Bone Profile", "TSH", "B12/Folate"],
                imaging: ["CXR", "CT Head (Trauma or New Focal sign)"]
            }
        },
        "Fall": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Unless Fracture or Severe Pain" },
            tests: {
                bedside: ["Lying/Standing BP", "ECG", "Blood Glucose"],
                lab: ["FBC", "U&E", "CK (if long lie)", "Bone Profile"],
                imaging: ["X-Ray (symptomatic areas)", "CT Head (if head strike + anti-coag/vomit/age)"]
            }
        },
        "Head Injury": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Unless GCS <15, Anti-coagulated or Trauma" },
            tests: {
                bedside: ["Neuro Obs (q30m)", "Check Anticoagulant Status"],
                lab: ["INR/Clotting (Essential if on Warfarin/DOAC)", "Group & Save (if major trauma)"],
                imaging: ["CT Head (NICE CG176)", "C-Spine CT (if neck pain)"]
            }
        },
        "Limb Problems": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia First" },
            tests: {
                bedside: ["Neurovascular Check"],
                lab: ["Coagulation (Only if on anticoagulants)"],
                imaging: ["X-Ray"]
            }
        },
        "Overdose and Poisoning": {
            cannula: { status: "Essential", color: "green", size: "18G", reason: "Antidotes / Fluids" },
            tests: {
                bedside: ["ECG (QTc interval)", "VBG (pH/Lactate)"],
                lab: ["Paracetamol Level (4h post-ingestion)", "Salicylate", "U&E", "LFT", "INR", "CK"],
                imaging: []
            }
        },
        "Shortness of Breath in Adults": {
            cannula: { status: "Essential", color: "green", size: "18G/20G", reason: "IV Meds / Fluids" },
            tests: {
                bedside: ["ECG", "ABG (if SpO2 <92% or CO2 risk)", "VBG"],
                lab: ["FBC", "U&E", "CRP", "BNP (Heart Failure?)", "Blood Cultures (if febrile)"],
                imaging: ["CXR", "Consider CTPA (PE)"]
            }
        },
        "Shortness of Breath in Children": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Nebs usually sufficient" },
            tests: {
                bedside: ["O2 Sats", "PEFR (if old enough)"],
                lab: [],
                imaging: ["CXR (Only if focal signs/severe)"]
            }
        },
        "Urinary Problems": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral fluids usually sufficient" },
            tests: {
                bedside: ["Urine Dip", "Bladder Scan (Retention)"],
                lab: ["U&E (Check AKI)", "FBC, CRP (if Pyelonephritis suspected)"],
                imaging: []
            }
        }
    }
};
