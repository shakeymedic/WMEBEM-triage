// protocols.js - Clinical Configuration

// 1. STANDARD BLOOD BUNDLES
// Define what tests constitute a "Surgical" or "Cardiac" profile here.
const standardBundles = {
    'Routine': ['FBC', 'U&E', 'CRP', 'LFT', 'Bone Profile'],
    'Surgical': ['FBC', 'U&E', 'CRP', 'LFT', 'Amylase', 'Group & Save', 'Lactate'],
    'Cardiac': ['FBC', 'U&E', 'CRP', 'Lipids', 'HbA1c', 'Troponin (High Sensitivity)'],
    'Trauma': ['FBC', 'U&E', 'Coagulation', 'Group & Save', 'Lactate'],
    'Sepsis': ['FBC', 'U&E', 'CRP', 'LFT', 'Lactate', 'Coagulation', 'Blood Cultures'],
    'Overdose': ['FBC', 'U&E', 'LFT', 'INR', 'Paracetamol Level', 'Salicylate Level']
};

// 2. CLINICAL PROTOCOLS
// Map presenting complaints to specific actions.
const clinicalProtocols = {
    "Abdominal Pain": {
        bloods: "Surgical",
        urine: "Urinalysis + β-HCG (if female <55)",
        cannula: "conditional", // Logic handles this based on pain/acuity
        imaging: [], 
        special: ["NBM until reviewed"]
    },
    "Chest Pain": {
        bloods: "Cardiac",
        urine: null,
        cannula: true,
        bedside: ["12-Lead ECG (Repeat at 60m if 1st normal)"],
        imaging: ["CXR"]
    },
    "Shortness of Breath": {
        bloods: "Routine",
        urine: null,
        cannula: "conditional",
        bedside: ["12-Lead ECG", "ABG/VBG (if sats <94% or CO2 retainer)"],
        imaging: ["CXR"]
    },
    "Head Injury": {
        bloods: "Trauma", 
        urine: null,
        cannula: false, 
        special: ["Check anticoagulation status", "Neuro Obs (Q30m)"]
    },
    "Unwell Adult": {
        bloods: "Routine",
        urine: "Urinalysis",
        cannula: true,
        special: ["Septic Screen consideration"]
    },
    "Urinary Problems": {
        bloods: "Routine",
        urine: "Urinalysis + MST",
        cannula: false
    },
    "Overdose and Poisoning": {
        bloods: "Overdose",
        urine: "Urinalysis (tox screen if indicated)",
        cannula: true,
        bedside: ["12-Lead ECG"]
    }
    // You can add more complaints here easily
};
