// protocols.js - Clinical Configuration v10.0
// ES Module Format

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
            // Simplified Safety Ranges (Source: NICE NG51 / APLS)
            infant: { maxRR: 60, maxHR: 160 }, // <1y
            toddler: { maxRR: 40, maxHR: 140 }, // 1-4y
            child: { maxRR: 30, maxHR: 120 }, // 5-11y
            teen: { maxRR: 25, maxHR: 100 } // 12+
        }
    },

    // --- 3. MTS FLOWCHARTS (Truncated for Example) ---
    mtsFlowcharts: {
        "Abdominal Pain": [{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Peritonism","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Testicular torsion","priority":"Orange"},{"text":"Significant history","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"Altered GCS","priority":"Yellow"},{"text":"Haemodynamic instability","priority":"Yellow"},{"text":"New onset in elderly","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Urinary symptoms","priority":"Green"},{"text":"Recent problem","priority":"Blue"},{"text":"Old problem","priority":"Blue"}],
        "Chest Pain": [{"text":"Airway compromise","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Cardiac-type chest pain at rest","priority":"Yellow"},{"text":"Pleuritic chest pain","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Recent non-cardiac pain","priority":"Green"},{"text":"Musculoskeletal pain","priority":"Green"}],
        "Head Injury": [{"text":"GCS < 9","priority":"Red"},{"text":"GCS 9-12","priority":"Orange"},{"text":"Penetrating injury","priority":"Orange"},{"text":"Seizing now","priority":"Orange"},{"text":"Focal neurological deficit","priority":"Orange"},{"text":"GCS 13-14","priority":"Yellow"},{"text":"Vomiting >1 episode","priority":"Yellow"},{"text":"History of LOC >5 mins","priority":"Yellow"},{"text":"Amnesia","priority":"Yellow"},{"text":"On anticoagulants","priority":"Yellow"},{"text":"GCS 15, no other factors","priority":"Green"}],
        "Headache": [{"text":"Reduced level of consciousness (GCS < 13)","priority":"Red"},{"text":"Sudden onset severe headache ('thunderclap')","priority":"Orange"},{"text":"New neurological deficit","priority":"Orange"},{"text":"Meningism (fever, neck stiffness, photophobia)","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New onset headache >50 years","priority":"Yellow"},{"text":"Headache with visual disturbance","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Chronic headache, unchanged","priority":"Blue"}],
        "Shortness of Breath": [{"text":"Apnoeic","priority":"Red"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Shock","priority":"Orange"},{"text":"Stridor","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Moderate respiratory distress","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Mild respiratory distress","priority":"Green"},{"text":"Cough","priority":"Green"},{"text":"Sore throat","priority":"Green"}],
        "Fall": [{"text":"Major trauma","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Long lie (>1 hour)","priority":"Orange"},{"text":"Suspected neck of femur fracture","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"History of LOC","priority":"Yellow"},{"text":"Inability to weight bear","priority":"Yellow"},{"text":"Head injury with anticoagulants","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Able to weight bear","priority":"Green"}],
        "Unwell Adult": [{"text":"Unresponsive or airway compromise","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"New GCS < 15","priority":"Orange"},{"text":"High risk of sepsis (meets criteria)","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Looks very unwell","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Significant history","priority":"Yellow"},{"text":"Looks well, normal vital signs","priority":"Green"},{"text":"Symptom enquiry only","priority":"Blue"}]
        // ... (Include other flowcharts from original file here)
    },

    // --- 4. CLINICAL PROTOCOLS ---
    protocols: {
        "Chest Pain": {
            details: "Cardiac / Resp / Muscular",
            do: ["ECG", "Troponin", "CXR", "U&E", "FBC", "Cannula"],
            consider: ["D-Dimer", "ABG/VBG"],
            conditionals: []
        },
        "Head Injury": {
            details: "NICE CG176",
            do: ["CT Head (if criteria met)", "Neuro Obs"],
            consider: ["C-Spine Imaging"],
            conditionals: []
        },
        "Sepsis": {
            details: "Sepsis 6 Protocol",
            do: ["Blood Cultures", "Lactate", "IV Antibiotics", "IV Fluids", "Oxygen", "Urine Output"],
            consider: ["Critical Care Review"],
            conditionals: []
        }
        // ... (Include other protocols from original file here)
    }
};
