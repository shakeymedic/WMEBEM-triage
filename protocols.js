// protocols.js - Clinical Configuration v12.2
// COMPLETE DATA SET - PRECISION DIAGNOSTICS EDITION

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

    // --- 3. MTS FLOWCHARTS ---
    mtsFlowcharts: {
        "Abdominal Pain": [{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Peritonism","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Testicular torsion","priority":"Orange"},{"text":"Significant history","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"Altered GCS","priority":"Yellow"},{"text":"Haemodynamic instability","priority":"Yellow"},{"text":"New onset in elderly","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Urinary symptoms","priority":"Green"},{"text":"Recent problem","priority":"Blue"},{"text":"Old problem","priority":"Blue"}],
        "Abdominal Pain - Lower": [{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"PV Bleeding (Pregnant)","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Mild pain","priority":"Green"}],
        "Abdominal Pain - Upper": [{"text":"Shock","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Haematemesis","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Mild pain","priority":"Green"}],
        "Allergy": [{"text":"Airway compromise","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Stridor","priority":"Orange"},{"text":"Wheeze","priority":"Orange"},{"text":"Oedema of tongue/throat","priority":"Orange"},{"text":"Widespread rash","priority":"Yellow"},{"text":"Facial oedema","priority":"Yellow"},{"text":"History of severe reaction","priority":"Yellow"},{"text":"Localised rash","priority":"Green"},{"text":"Itch","priority":"Green"}],
        "Chest Pain": [{"text":"Airway compromise","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Cardiac-type chest pain at rest","priority":"Yellow"},{"text":"Pleuritic chest pain","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Recent non-cardiac pain","priority":"Green"},{"text":"Musculoskeletal pain","priority":"Green"}],
        "Fall": [{"text":"Major trauma","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Long lie (>1 hour)","priority":"Orange"},{"text":"Suspected neck of femur fracture","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"History of LOC","priority":"Yellow"},{"text":"Inability to weight bear","priority":"Yellow"},{"text":"Head injury with anticoagulants","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Able to weight bear","priority":"Green"}],
        "Head Injury": [{"text":"GCS < 9","priority":"Red"},{"text":"GCS 9-12","priority":"Orange"},{"text":"Penetrating injury","priority":"Orange"},{"text":"Seizing now","priority":"Orange"},{"text":"Focal neurological deficit","priority":"Orange"},{"text":"GCS 13-14","priority":"Yellow"},{"text":"Vomiting >1 episode","priority":"Yellow"},{"text":"History of LOC >5 mins","priority":"Yellow"},{"text":"Amnesia","priority":"Yellow"},{"text":"On anticoagulants","priority":"Yellow"},{"text":"GCS 15, no other factors","priority":"Green"}],
        "Shortness of Breath": [{"text":"Apnoeic","priority":"Red"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Shock","priority":"Orange"},{"text":"Stridor","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Moderate respiratory distress","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Mild respiratory distress","priority":"Green"},{"text":"Cough","priority":"Green"},{"text":"Sore throat","priority":"Green"}],
        "Overdose": [{"text":"Unresponsive","priority":"Red"},{"text":"Seizing now","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Abnormal vital signs","priority":"Orange"},{"text":"High-risk substance","priority":"Orange"},{"text":"Deliberate self-harm intent","priority":"Yellow"},{"text":"Symptomatic but stable","priority":"Yellow"},{"text":"Asymptomatic, low-risk substance","priority":"Green"},{"text":"Information request","priority":"Blue"}]
    },

    // --- 4. CLINICAL PROTOCOLS ---
    // Updated for accuracy and comprehensive coverage
    protocols: {
        "Abdominal Pain": {
            cannula: { status: "Consider", color: "amber", size: "20G/22G", reason: "Only if vomiting or severe pain" },
            tests: {
                bedside: ["Urine Dip", "Pregnancy Test (Female)", "VBG (Lactate)"],
                lab: ["FBC", "U&E", "LFT", "Amylase/Lipase", "CRP", "Group & Save (if bleed risk)"],
                imaging: ["Abdo X-Ray (only if obstruction)", "Erect CXR (Perforation?)"]
            }
        },
        "Abdominal Pain - Lower": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "Analgesia / Surgical" },
            tests: {
                bedside: ["Urine Dip", "Pregnancy Test (Essential)"],
                lab: ["FBC", "U&E", "CRP", "Group & Save", "Clotting"],
                imaging: ["Ultrasound Pelvis/Appendix"]
            }
        },
        "Abdominal Pain - Upper": {
            cannula: { status: "Essential", color: "green", size: "18G", reason: "Sepsis / Pancreatitis Risk" },
            tests: {
                bedside: ["VBG (Lactate)", "ECG (Inferior MI exclusion)"],
                lab: ["FBC", "U&E", "LFT", "Amylase/Lipase", "CRP", "Clotting", "Calcium"],
                imaging: ["CXR (Erect)", "US Biliary"]
            }
        },
        "Chest Pain": {
            cannula: { status: "Essential", color: "green", size: "18G/20G", reason: "ACS / PE Pathway" },
            tests: {
                bedside: ["ECG (within 10m)", "VBG (Lactate)", "COVID Swab"],
                lab: ["Troponin (High Sens)", "FBC", "U&E", "D-Dimer (if Wells Low)", "Glucose", "Lipids"],
                imaging: ["CXR (Portable if Unstable)"]
            }
        },
        "Head Injury": {
            cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Unless GCS <15 or Anticoagulated" },
            tests: {
                bedside: ["Neuro Obs (q30m)", "Check Anticoagulant Status"],
                lab: ["Clotting/INR (Essential if on Warfarin)", "FBC", "Group & Save (if major trauma)"],
                imaging: ["CT Head (within 1h if risk factors)", "C-Spine CT (if neck pain)"]
            }
        },
        "Shortness of Breath": {
            cannula: { status: "Essential", color: "green", size: "18G/20G", reason: "IV Meds / Fluids" },
            tests: {
                bedside: ["ECG", "ABG (if SpO2 <92% or CO2 risk)", "VBG"],
                lab: ["FBC", "U&E", "CRP", "BNP (Heart Failure?)", "Blood Cultures (if febrile)"],
                imaging: ["CXR", "Consider CTPA (PE)"]
            }
        },
        "Fall": {
            cannula: { status: "Consider", color: "amber", size: "20G", reason: "If IV analgesia needed" },
            tests: {
                bedside: ["Lying/Standing BP", "ECG", "Blood Glucose"],
                lab: ["FBC", "U&E", "CK (if long lie)", "Bone Profile", "B12/Folate (mechanical fall)"],
                imaging: ["X-Ray (symptomatic areas)", "CT Head (if head strike/anticoagulated)"]
            }
        },
        "Overdose": {
            cannula: { status: "Essential", color: "green", size: "18G", reason: "Antidotes / Fluids" },
            tests: {
                bedside: ["ECG (QTc interval)", "VBG (pH/Lactate)", "Temp"],
                lab: ["Paracetamol Level (4h post-ingestion)", "Salicylate", "U&E", "LFT", "Clotting", "CK"],
                imaging: []
            }
        },
         "Allergy": {
            cannula: { status: "Consider", color: "amber", size: "18G", reason: "If Anaphylaxis suspected" },
            tests: {
                bedside: ["Peak Flow (if wheezy)", "ECG"],
                lab: ["Mast Cell Tryptase (if anaphylaxis)", "FBC", "U&E"],
                imaging: []
            }
        }
    }
};
