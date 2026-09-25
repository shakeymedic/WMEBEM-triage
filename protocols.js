// protocols.js - Clinical configuration (v20.2)
// STATUS: NOT CLINICALLY SIGNED OFF. The flowcharts below are a paraphrase of Manchester Triage
// System presentations, not the licensed MTS content, and must be reviewed line by line against the
// trust's licensed MTS edition by a named clinical lead before live use. Guideline-derived rules
// (NEWS2, NICE NG253 / NG232 / NG143, ROSIER, 4AT) live in clinical.js with unit tests.

// --- Helpers for the nursing plan (section 7). Nursing scope only: no imaging. ---
// `when` is shown as "Consider if ..."; `auto` (see section 7) turns an item into "Suggested" when met.
// An item with no `when` is always suggested.
const cleanWhen = (w) => (w ? w.replace(/^if\s+/i, '') : '');
const bs = (name, why, when, auto) => ({ name, why: why || '', when: cleanWhen(when), auto: auto || (when ? null : 'always') });
const bl = (profile, when, auto) => ({ profile, when: cleanWhen(when), auto: auto || (when ? null : 'always') });
const pw = (to, when, auto) => ({ to, when: cleanWhen(when), auto: auto || null });
const C = {
    essential: (size, reason) => ({ status: 'recommended', size, reason }),
    consider: (size, reason) => ({ status: 'consider', size, reason }),
    avoid: (reason) => ({ status: 'not-routine', size: null, reason })
};
const test = (name, defaultWhy) => (why, when, auto) => bs(name, why || defaultWhy, when, auto);
const BS = {
    urine: bs('Urine dip', 'Infection, blood, glucose, ketones and protein'),
    bm: test('Capillary blood glucose (BM)'),
    ecg: test('12-lead ECG'),
    vbg: test('Venous blood gas (VBG)'),
    ketones: test('Capillary blood ketones'),
    peakflow: test('Peak flow (PEFR)'),
    neuro: test('Neuro obs (GCS and pupils)'),
    bladder: test('Bladder scan'),
    lsbp: test('Lying and standing BP'),
    weight: test('Weight')
};
const P = (plan) => ({ bedside: [], bloods: [], pathways: [], bloodsNote: '', ...plan });

export const clinicalData = {
    // MTS target times (minutes). MTS: Red immediate, Orange 10, Yellow 60, Green 120, Blue 240.
    // Change here only if the department has formally adopted different local targets.
    targetMinutes: { Red: 0, Orange: 10, Yellow: 60, Green: 120, Blue: 240 },

    // Age-appropriate quick-pick complaints and body-map targets (must be flowchart names).
    quickComplaints: {
        adult: ['Chest Pain', 'Shortness of Breath in Adults', 'Abdominal Pain in Adults', 'Falls', 'Head Injury', 'Limb Problems'],
        child: ['Unwell Child', 'Shortness of Breath in Children', 'Abdominal Pain in Children', 'Head Injury', 'Limb Problems', 'Irritable Child']
    },
    bodyMap: {
        adult: [
            { label: 'Head / Face', chart: 'Head Injury' }, { label: 'Neck', chart: 'Neck Pain' }, { label: 'Chest', chart: 'Chest Pain' },
            { label: 'Abdomen', chart: 'Abdominal Pain in Adults' }, { label: 'Back', chart: 'Back Pain' }, { label: 'Arms / Legs', chart: 'Limb Problems' },
            { label: 'Pelvis / GU', chart: 'Urinary Problems' }, { label: 'Skin / Rash', chart: 'Rash' }, { label: 'General / Systemic', chart: 'Unwell Adult' }
        ],
        child: [
            { label: 'Head / Face', chart: 'Head Injury' }, { label: 'Neck', chart: 'Neck Pain' }, { label: 'Breathing', chart: 'Shortness of Breath in Children' },
            { label: 'Abdomen', chart: 'Abdominal Pain in Children' }, { label: 'Back', chart: 'Back Pain' }, { label: 'Arms / Legs', chart: 'Limb Problems' },
            { label: 'Limping', chart: 'Limping Child' }, { label: 'Skin / Rash', chart: 'Rash' }, { label: 'General / Systemic', chart: 'Unwell Child' }
        ]
    },

    // What nurses actually type -> flowchart(s). Matched case-insensitively alongside the chart names.
    complaintSynonyms: {
        'cp': ['Chest Pain'], 'chest': ['Chest Pain'], 'acs': ['Chest Pain'], 'mi': ['Chest Pain'],
        'sob': ['Shortness of Breath in Adults', 'Shortness of Breath in Children'], 'dib': ['Shortness of Breath in Adults', 'Shortness of Breath in Children'],
        'breathless': ['Shortness of Breath in Adults', 'Shortness of Breath in Children'], 'difficulty breathing': ['Shortness of Breath in Adults', 'Shortness of Breath in Children'],
        'wheeze': ['Asthma', 'Shortness of Breath in Children'], 'copd': ['Shortness of Breath in Adults'],
        'abdo': ['Abdominal Pain in Adults', 'Abdominal Pain in Children'], 'abdominal': ['Abdominal Pain in Adults', 'Abdominal Pain in Children'], 'tummy': ['Abdominal Pain in Children', 'Abdominal Pain in Adults'], 'stomach': ['Abdominal Pain in Adults', 'Abdominal Pain in Children'],
        'fall': ['Falls'], 'fell': ['Falls'], 'mechanical fall': ['Falls'], 'long lie': ['Falls', 'Elderly Care / Off Legs'], 'off legs': ['Elderly Care / Off Legs'], 'nof': ['Falls', 'Limb Problems'], 'hip': ['Falls', 'Limb Problems'],
        'hi': ['Head Injury'], 'head': ['Head Injury', 'Headache'], 'loc': ['Collapse', 'Head Injury'],
        'collapse': ['Collapse'], 'syncope': ['Collapse'], 'faint': ['Collapse'],
        'fit': ['Fits and Seizures'], 'seizure': ['Fits and Seizures'], 'epilepsy': ['Fits and Seizures'],
        'od': ['Overdose and Poisoning'], 'overdose': ['Overdose and Poisoning'], 'poisoning': ['Overdose and Poisoning'], 'dsh': ['Self Harm', 'Overdose and Poisoning'], 'self harm': ['Self Harm'], 'cutting': ['Self Harm', 'Wounds'],
        'suicidal': ['Mental Illness'], 'mental health': ['Mental Illness'], 'psych': ['Mental Illness'], 'anxiety': ['Mental Illness'],
        'drunk': ['Apparently Drunk'], 'alcohol': ['Apparently Drunk'], 'etoh': ['Apparently Drunk'],
        'stroke': ['Suspected Stroke'], 'cva': ['Suspected Stroke'], 'weakness': ['Suspected Stroke'], 'tia': ['Suspected TIA'],
        'dvt': ['Suspected DVT / PE'], 'pe': ['Suspected DVT / PE'], 'calf': ['Suspected DVT / PE'],
        'pv bleed': ['PV Bleeding'], 'pv': ['PV Bleeding'], 'miscarriage': ['PV Bleeding', 'Pregnancy'], 'pregnant': ['Pregnancy'],
        'uti': ['Urinary Problems'], 'retention': ['Urinary Problems'], 'haematuria': ['Urinary Problems'], 'catheter': ['Urinary Problems'],
        'gi bleed': ['Gastrointestinal Bleeding'], 'haematemesis': ['Gastrointestinal Bleeding'], 'melaena': ['Gastrointestinal Bleeding'], 'pr bleed': ['Gastrointestinal Bleeding'],
        'd&v': ['Diarrhoea and Vomiting'], 'vomiting': ['Diarrhoea and Vomiting'], 'diarrhoea': ['Diarrhoea and Vomiting'],
        'rash': ['Rash'], 'anaphylaxis': ['Allergy'], 'allergic': ['Allergy'],
        'cut': ['Wounds'], 'laceration': ['Wounds'], 'wound': ['Wounds'], 'burn': ['Burns and Scalds'], 'scald': ['Burns and Scalds'],
        'rtc': ['Major Trauma'], 'trauma': ['Major Trauma', 'Torso Injury'], 'stab': ['Torso Injury', 'Wounds'],
        'arm': ['Limb Problems'], 'leg': ['Limb Problems'], 'ankle': ['Limb Problems'], 'wrist': ['Limb Problems'], 'knee': ['Limb Problems'], 'shoulder': ['Limb Problems'],
        'limp': ['Limping Child'], 'fever': ['Unwell Child', 'Unwell Adult'], 'temperature': ['Unwell Child', 'Unwell Adult'], 'sepsis': ['Unwell Adult', 'Unwell Child'], 'unwell': ['Unwell Adult', 'Unwell Child'],
        'confused': ['Confusion'], 'delirium': ['Confusion'],
        'palps': ['Palpitations'], 'af': ['Palpitations'], 'svt': ['Palpitations'],
        'hypo': ['Diabetes', 'Hypoglycaemia in Neonate / Child'], 'dka': ['Diabetes'], 'sugar': ['Diabetes'],
        'eye': ['Eye Problems'], 'ear': ['Ear Problems'], 'tooth': ['Dental Problems'], 'throat': ['Sore Throat'], 'nosebleed': ['Facial Problems'], 'epistaxis': ['Facial Problems'],
        'testicle': ['Testicular Pain'], 'scrotal': ['Testicular Pain'], 'needlestick': ['Needlestick Injury'],
        'jaundice': ['Jaundice'], 'back': ['Back Pain'], 'neck': ['Neck Pain'], 'crying': ['Crying Baby'], 'baby': ['Crying Baby', 'Unwell Child']
    },

    // Complaint-specific nurse tools (see app.js renderAssessments). Charts listed must exist.
    assessmentTools: {
        headInjury: ['Head Injury'],
        headInjuryOptional: ['Falls', 'Assault', 'Elderly Care / Off Legs', 'Major Trauma', 'Collapse', 'Apparently Drunk'],
        stroke: ['Suspected Stroke', 'Suspected TIA'],
        ecgTimer: ['Chest Pain'],
        delirium: ['Confusion', 'Elderly Care / Off Legs', 'Behaving Strangely', 'Falls'],
        mentalHealth: ['Mental Illness', 'Self Harm', 'Overdose and Poisoning', 'Behaving Strangely', 'Apparently Drunk'],
        nofDiscriminator: 'Suspected neck of femur fracture'
    },

    // Supplementary sepsis considerations recorded alongside the NG253 NEWS2 risk (they do not
    // change the NG253 risk band). Chemotherapy and immunosuppression are in the high-risk groups.
    sepsisConsiderations: [
        { id: 'sepsis_rash', label: 'Non-blanching rash' },
        { id: 'sepsis_mottled', label: 'Mottled, ashen or cyanotic skin' },
        { id: 'sepsis_wound', label: 'Signs of wound / device / skin infection' },
        { id: 'sepsis_procedure', label: 'Surgery, trauma or invasive procedure in the last 6 weeks' }
    ],
    // --- 1. DRUG INDEX (MASSIVE DATABASE - 450+ Common UK BNF Drugs) ---
    drugIndex: [
        "Abacavir", "Aciclovir", "Acitretin", "Adalimumab", "Adapalene", "Adenosine", "Adrenaline", "Alendronic Acid", "Alfuzosin", "Alimemazine", "Allopurinol", "Alogliptin", "Amitriptyline", "Amlodipine", "Amoxicillin", "Anastrozole", "Apixaban", "Apremilast", "Aripiprazole", "Aspirin", "Atazanavir", "Atenolol", "Atomoxetine", "Atorvastatin", "Azathioprine", "Azithromycin",
        "Baclofen", "Beclometasone", "Bendroflumethiazide", "Benzatropine", "Benzydamine", "Betahistine", "Betamethasone", "Betaxolol", "Bezafibrate", "Bicalutamide", "Bisoprolol", "Brimonidine", "Brinzolamide", "Buprenorphine", "Bupropion", "Buscopan", "Budesonide", "Bumetanide",
        "Cabergoline", "Calcipotriol", "Calcium Carbonate", "Candesartan", "Capsaicin", "Carbamazepine", "Carbimazole", "Carmellose", "Carvedilol", "Cefalexin", "Celecoxib", "Celiprolol", "Cetirizine", "Chloramphenicol", "Chlordiazepoxide", "Chlorhexidine", "Chloroquine", "Chlorphenamine", "Chlorpromazine", "Ciclosporin", "Cilostazol", "Cimetidine", "Cinacalcet", "Cinnarizine", "Ciprofibrate", "Ciprofloxacin", "Citalopram", "Clarithromycin", "Clexane", "Clindamycin", "Clobazam", "Clobetasol", "Clobetasone", "Clonazepam", "Clonidine", "Clopidogrel", "Clotrimazole", "Clozapine", "Co-amoxiclav", "Co-beneldopa", "Co-careldopa", "Co-codamol", "Co-cyprindiol", "Co-dydramol", "Codeine", "Colchicine", "Colecalciferol", "Colestyramine", "Cyclizine", "Cyclopenthiazide", "Cyclophosphamide", "Cyproterone",
        "Dabigatran", "Dalteparin", "Dantrolene", "Dapagliflozin", "Dapsone", "Darifenacin", "Darunavir", "Degarelix", "Desloratadine", "Dexamethasone", "Dexamfetamine", "Diazepam", "Diclofenac", "Digoxin", "Dihydrocodeine", "Diltiazem", "Dimethyl Fumarate", "Diphenhydramine", "Dipyridamole", "Disopyramide", "Disulfiram", "Dobutamine", "Docetaxel", "Docusate", "Domperidone", "Donepezil", "Dornase Alfa", "Dorzolamide", "Dosulepin", "Doxazosin", "Doxepin", "Doxycycline", "Duloxetine", "Dutasteride",
        "Edoxaban", "Efavirenz", "Eletriptan", "Emtricitabine", "Enalapril", "Enoxaparin", "Entacapone", "Entecavir", "Eplerenone", "Epoetin", "Erythromycin", "Escitalopram", "Eslicarbazepine", "Esomeprazole", "Estradiol", "Etanercept", "Ethinylestradiol", "Etoricoxib", "Exemestane", "Ezetimibe",
        "Famciclovir", "Famotidine", "Febuxostat", "Felodipine", "Fenofibrate", "Fentanyl", "Ferrous Fumarate", "Ferrous Gluconate", "Ferrous Sulphate", "Fesoterodine", "Fexofenadine", "Finasteride", "Flecainide", "Flucloxacillin", "Fluconazole", "Fludrocortisone", "Fluoxetine", "Flupentixol", "Fluticasone", "Folic Acid", "Follitropin", "Fondaparinux", "Formoterol", "Fosfomycin", "Fosinopril", "Furosemide", "Fusidic Acid",
        "Gabapentin", "Galantamine", "Ganciclovir", "Gaviscon", "Gemfibrozil", "Gentamicin", "Gliclazide", "Glimepiride", "Glipizide", "Glucagon", "Glyceryl Trinitrate", "Goserelin", "Granisetron",
        "Haloperidol", "Heparin", "Hydralazine", "Hydrocortisone", "Hydromorphone", "Hydroxocobalamin", "Hydroxycarbamide", "Hydroxychloroquine", "Hydroxyzine", "Hyoscine",
        "Ibandronic Acid", "Ibuprofen", "Imatinib", "Imipramine", "Imiquimod", "Indapamide", "Indometacin", "Infliximab", "Insulin Actrapid", "Insulin Glargine", "Insulin Humalog", "Insulin Lantus", "Insulin Levemir", "Insulin Novomix", "Insulin Novorapid", "Ipratropium", "Irbesartan", "Isosorbide Mononitrate", "Isotretinoin", "Ispaghula", "Itraconazole", "Ivabradine",
        "Ketamine", "Ketoconazole", "Ketoprofen",
        "Labetalol", "Lacosamide", "Lactulose", "Lamivudine", "Lamotrigine", "Lansoprazole", "Latanoprost", "Leflunomide", "Lenalidomide", "Lercanidipine", "Letrozole", "Leuprorelin", "Levetiracetam", "Levobupivacaine", "Levodopa", "Levofloxacin", "Levonorgestrel", "Levothyroxine", "Lidocaine", "Linagliptin", "Linezolid", "Liothyronine", "Lisinopril", "Lithium", "Lixisenatide", "Lofepramine", "Loperamide", "Loratadine", "Lorazepam", "Losartan", "Lymecycline",
        "Macrogol", "Madopar", "Magnesium", "Maraviroc", "Mebendazole", "Mebeverine", "Medroxyprogesterone", "Mefenamic Acid", "Melatonin", "Memantine", "Mercaptopurine", "Meropenem", "Mesalazine", "Metformin", "Methadone", "Methotrexate", "Methyldopa", "Methylphenidate", "Methylprednisolone", "Metoclopramide", "Metolazone", "Metoprolol", "Metronidazole", "Miconazole", "Midazolam", "Minocycline", "Minoxidil", "Mirabegron", "Mirtazapine", "Misoprostol", "Modafinil", "Mometasone", "Montelukast", "Morphine", "Movicol", "Moxonidine", "Mycophenolate",
        "Nabumetone", "Nadolol", "Naproxen", "Nebivolol", "Neostigmine", "Nevirapine", "Nicorandil", "Nicotine", "Nifedipine", "Nitrofurantoin", "Norethisterone", "Nortriptyline", "Nystatin",
        "Ofloxacin", "Olanzapine", "Olmesartan", "Olopatadine", "Omeprazole", "Ondansetron", "Orlistat", "Oxybutynin", "Oxycodone",
        "Pantoprazole", "Paracetamol", "Paroxetine", "Penicillamine", "Perindopril", "Phenobarbital", "Phenoxymethylpenicillin", "Phenytoin", "Pholcodine", "Pilocarpine", "Pioglitazone", "Pizotifen", "Pramipexole", "Prasugrel", "Pravastatin", "Prednisolone", "Pregabalin", "Primidone", "Prochlorperazine", "Procyclidine", "Progesterone", "Promethazine", "Propafenone", "Propranolol", "Pseudoephedrine", "Pyridostigmine",
        "Quetiapine", "Quinapril", "Quinine",
        "Rabeprazole", "Raloxifene", "Raltegravir", "Ramipril", "Ranitidine", "Ranolazine", "Rasagiline", "Repaglinide", "Rifampicin", "Rifaximin", "Risedronate", "Risperidone", "Ritonavir", "Rituximab", "Rivaroxaban", "Rivastigmine", "Rizatriptan", "Ropinirole", "Rosuvastatin",
        "Salbutamol", "Salmeterol", "Saxagliptin", "Senna", "Sertraline", "Sevelamer", "Sildenafil", "Simvastatin", "Sinemet", "Sitagliptin", "Sodium Valproate", "Solifenacin", "Sotalol", "Spironolactone", "Stalevo", "Sulfasalazine", "Sulpiride", "Sumatriptan",
        "Tacrolimus", "Tadalafil", "Tamoxifen", "Tamsulosin", "Teicoplanin", "Telmisartan", "Temazepam", "Tenofovir", "Terazosin", "Terbinafine", "Terbutaline", "Testosterone", "Tetracycline", "Theophylline", "Thiamine", "Thyroxine", "Ticagrelor", "Timolol", "Tiotropium", "Tizanidine", "Tobramycin", "Tolbutamide", "Tolterodine", "Topiramate", "Tramadol", "Tranexamic Acid", "Trandolapril", "Tranylcypromine", "Travoprost", "Trazodone", "Trimethoprim", "Triptorelin",
        "Ursodeoxycholic Acid",
        "Valaciclovir", "Valganciclovir", "Valproic Acid", "Valsartan", "Vancomycin", "Vardenafil", "Varenicline", "Venlafaxine", "Verapamil", "Vigabatrin", "Vildagliptin", "Vitamin B12", "Vitamin D", "Voriconazole",
        "Warfarin",
        "Xylometazoline",
        "Zidovudine", "Zopiclone", "Zuclopenthixol",
        // --- Common UK brand names (patients/carers often say these, not the generic) ---
        "Eliquis", "Xarelto", "Pradaxa", "Lixiana", "Fragmin", "Innohep",
        "Lantus", "Levemir", "Humalog", "Novorapid", "Novomix", "Tresiba", "Toujeo", "Abasaglar", "Actrapid", "Humulin", "Insulatard", "Fiasp", "Ozempic", "Trulicity", "Victoza", "Byetta",
        "Humira", "Enbrel", "Remicade", "Simponi", "Cimzia", "Cosentyx", "Stelara", "Orencia", "Xeljanz",
        "Keppra", "Epilim", "Tegretol", "Lamictal", "Vimpat", "Fycompa", "Zebinix", "Briviact",
        "Deltacortril", "Sinemet", "Madopar", "Stalevo", "Neupro", "Requip", "Mirapexin",
        "Priadel", "Camcolit", "Zonisamide", "Suboxone", "Subutex", "BuTrans", "MST Continus", "Oxycontin", "Zomorph", "Palladone"
    ],

    // --- 2. HIGH RISK 'MISSED' MEDS MAPPING ---
    highRiskDrugs: {
        // Movement
        "levodopa": "M: Parkinson's (Time Critical - Get Meds)", "co-beneldopa": "M: Parkinson's (Time Critical)", "co-careldopa": "M: Parkinson's (Time Critical)", "madopar": "M: Parkinson's (Time Critical)", "sinemet": "M: Parkinson's (Time Critical)", "stalevo": "M: Parkinson's (Time Critical)", "pramipexole": "M: Parkinson's (Time Critical)", "ropinirole": "M: Parkinson's (Time Critical)", "rotigotine": "M: Parkinson's (Time Critical)", "pyridostigmine": "M: Myasthenia Gravis (Time Critical)", "neostigmine": "M: Myasthenia Gravis (Time Critical)",
        // Immunomodulators/HIV
        "methotrexate": "I: Immunosuppressant (Sepsis Risk)", "azathioprine": "I: Immunosuppressant (Sepsis Risk)", "mycophenolate": "I: Immunosuppressant (Sepsis Risk)", "ciclosporin": "I: Immunosuppressant (Sepsis Risk)", "tacrolimus": "I: Immunosuppressant (Sepsis Risk)", "rituximab": "I: Immunosuppressant (Sepsis Risk)", "tenofovir": "I: HIV Med (Interactions)", "emtricitabine": "I: HIV Med (Interactions)", "abacavir": "I: HIV Med (Interactions)", "ritonavir": "I: HIV Med (Interactions)", "adalimumab": "I: Biologic (Sepsis Risk)", "etanercept": "I: Biologic (Sepsis Risk)", "infliximab": "I: Biologic (Sepsis Risk)",
        // Sugar
        "insulin": "S: Insulin (Hypo/DKA Risk)", "humalog": "S: Insulin (Hypo/DKA Risk)", "novorapid": "S: Insulin (Hypo/DKA Risk)", "lantus": "S: Insulin (Hypo/DKA Risk)", "levemir": "S: Insulin (Hypo/DKA Risk)", "actrapid": "S: Insulin (Hypo/DKA Risk)", "gliclazide": "S: Sulphonylurea (Hypo Risk)", "glimepiride": "S: Sulphonylurea (Hypo Risk)", "dapagliflozin": "S: SGLT2 (Euglycaemic DKA Risk)", "empagliflozin": "S: SGLT2 (Euglycaemic DKA Risk)", "canagliflozin": "S: SGLT2 (Euglycaemic DKA Risk)",
        // Steroids
        "prednisolone": "S: Steroid (Adrenal Crisis Risk)", "hydrocortisone": "S: Steroid (Adrenal Crisis Risk)", "dexamethasone": "S: Steroid (Adrenal Crisis Risk)", "fludrocortisone": "S: Steroid (Addison's Risk)",
        // Epilepsy
        "sodium valproate": "E: Anticonvulsant (Seizure Risk)", "valproic acid": "E: Anticonvulsant (Seizure Risk)", "epilim": "E: Anticonvulsant (Seizure Risk)", "levetiracetam": "E: Anticonvulsant (Seizure Risk)", "keppra": "E: Anticonvulsant (Seizure Risk)", "lamotrigine": "E: Anticonvulsant (Seizure Risk)", "carbamazepine": "E: Anticonvulsant (Seizure Risk)", "phenytoin": "E: Anticonvulsant (Seizure Risk)", "topiramate": "E: Anticonvulsant (Seizure Risk)", "clobazam": "E: Anticonvulsant (Seizure Risk)", "lacosamide": "E: Anticonvulsant (Seizure Risk)",
        // DOACs/Warfarin
        "warfarin": "D: Anticoagulant (Check INR)", "apixaban": "D: DOAC (Bleeding Risk)", "eliquis": "D: DOAC (Bleeding Risk)", "rivaroxaban": "D: DOAC (Bleeding Risk)", "xarelto": "D: DOAC (Bleeding Risk)", "edoxaban": "D: DOAC (Bleeding Risk)", "lixiana": "D: DOAC (Bleeding Risk)", "dabigatran": "D: DOAC (Bleeding Risk)", "pradaxa": "D: DOAC (Bleeding Risk)", "enoxaparin": "D: LMWH (Bleeding Risk)", "dalteparin": "D: LMWH (Bleeding Risk)", "clexane": "D: LMWH (Bleeding Risk)", "fragmin": "D: LMWH (Bleeding Risk)", "innohep": "D: LMWH (Bleeding Risk)", "tinzaparin": "D: LMWH (Bleeding Risk)",
        // Antiplatelets
        "aspirin": "D: Antiplatelet (Bleeding Risk)", "clopidogrel": "D: Antiplatelet (Bleeding Risk)", "ticagrelor": "D: Antiplatelet (Bleeding Risk)", "prasugrel": "D: Antiplatelet (Bleeding Risk)", "dipyridamole": "D: Antiplatelet (Bleeding Risk)",
        // Opioids
        "methadone": "Opioid (Resp Depression Risk)", "suboxone": "Opioid Substitution (Resp Depression Risk)", "subutex": "Opioid Substitution (Resp Depression Risk)", "buprenorphine": "Opioid Substitution (Resp Depression Risk)", "morphine": "Opioid (Resp Depression Risk)", "oxycodone": "Opioid (Resp Depression Risk)", "oxycontin": "Opioid (Resp Depression Risk)", "zomorph": "Opioid (Resp Depression Risk)", "fentanyl": "Opioid (Resp Depression Risk)",
        // Toxicity
        "lithium": "Toxicity Risk (Check Levels)", "priadel": "Toxicity Risk (Check Levels)", "camcolit": "Toxicity Risk (Check Levels)", "digoxin": "Toxicity Risk (Check Levels)", "clozapine": "Agranulocytosis Risk", "carbimazole": "Neutropenia Risk"
    },

    // --- 2b. HIGH RISK MEDICATION TICK-BOX CATEGORIES (spelling/brand-name independent) ---
    // These render as checkboxes so risk capture doesn't depend on free-text spelling accuracy.
    highRiskCategories: [
        { id: "anticoag", label: "Anticoagulant / DOAC", hint: "Warfarin, DOAC, LMWH", warning: "D: Anticoagulant/DOAC (Bleeding Risk - Check INR if Warfarin)" },
        { id: "antiplatelet", label: "Antiplatelet", hint: "Aspirin, Clopidogrel, Ticagrelor", warning: "D: Antiplatelet (Bleeding Risk)" },
        { id: "insulin", label: "Insulin", hint: "Any type/brand", warning: "S: Insulin (Hypo/DKA Risk)" },
        { id: "steroid", label: "Long-term Steroids", hint: "Prednisolone equivalent, >4 weeks, or NHS Steroid Emergency Card", warning: "S: Steroid Dependent (Adrenal Crisis Risk - follow Steroid Emergency Card, consider hydrocortisone)" },
        { id: "immunosuppressant", label: "Immuno&shy;suppressant / Biologic", hint: "Methotrexate, biologics, transplant meds", warning: "I: Immunosuppressant/Biologic (Sepsis Risk - low threshold for cultures)" },
        { id: "parkinsons", label: "Parkinson's Medication", hint: "Levodopa, co-beneldopa, co-careldopa", warning: "M: Parkinson's (TIME CRITICAL - do not omit/delay doses)" },
        { id: "antiepileptic", label: "Anti-epileptic", hint: "Any AED", warning: "E: Anticonvulsant (Seizure Risk if delayed/missed)" },
        { id: "opioid", label: "Opioid / Substitution Rx", hint: "Methadone, buprenorphine, strong opioids", warning: "Opioid (Resp Depression Risk)" },
        { id: "lithium_clozapine", label: "Lithium / Clozapine", hint: "Toxicity/agranulocytosis risk", warning: "Toxicity Risk (Check Lithium Level / FBC if Clozapine)" },
        { id: "chemo", label: "Chemotherapy (last 6 weeks)", hint: "Systemic anti-cancer treatment", warning: "Chemotherapy in last 6 weeks - if unwell or febrile, treat as possible neutropenic sepsis: medical emergency, empiric antibiotics per local pathway (NICE NG151)" },
        { id: "sickle", label: "Sickle cell disease", hint: "Painful crisis", warning: "Sickle cell - painful crisis: analgesia within 30 minutes of arrival (NICE CG143)" },
        { id: "dialysis", label: "Renal dialysis / fistula", hint: "Haemo- or peritoneal dialysis", warning: "Dialysis - no BP cuff, cannula or bloods on the fistula arm; check potassium" },
        { id: "neck_breather", label: "Neck breather", hint: "Laryngectomy or tracheostomy", warning: "Neck breather - give oxygen and manage airway via the stoma" }
    ],

    // --- 2d. PMHx KEYWORD PROMPTS ---
    // Fuzzy-matched against free-text PMH (reusing the same matching as the meds field) to surface a
    // dismissible reminder banner - these are prompts, not safety alerts, so they never enter riskFlags
    // or the note.
    pmhPrompts: {
        "diabetes": "Diabetes noted - consider checking capillary glucose.",
        "diabetic": "Diabetes noted - consider checking capillary glucose.",
        "epilepsy": "Epilepsy noted - consider the Anti-epileptic high-risk med tick-box if applicable.",
        "epileptic": "Epilepsy noted - consider the Anti-epileptic high-risk med tick-box if applicable.",
        "copd": "COPD noted - consider Scale 2 (CO2 retainer) and target sats 88-92%.",
        "sickle": "Sickle cell noted - tick the Sickle cell high-risk group if this is a painful crisis.",
        "chemotherapy": "Chemotherapy noted - tick the Chemotherapy high-risk group if within the last 6 weeks.",
        "dialysis": "Dialysis noted - tick the Renal dialysis high-risk group.",
        "laryngectomy": "Laryngectomy noted - tick Neck breather."
    },

    // --- 3b. SCORE REFERENCES (for ℹ️ info popovers on NEWS2/PEWS/MEOWS) ---
    references: {
        news2: "National Early Warning Score 2 (NEWS2) - Royal College of Physicians, 2017. Adults 16+, not validated in pregnancy. Only a complete set of all 7 parameters gives a valid score.",
        pews: "LOCAL paediatric early warning score built into this app - NOT the national PEWS (NHS England SPOT programme). Use your trust's PEWS chart where it differs.",
        meows: "LOCAL MEOWS trigger chart built into this app - NOT the national Maternity Early Warning Score (MEWS), which NHS England expects every trust to use by March 2026. Use your trust's chart where it differs."
    },

    // --- 4. SCREENING RULES ---
    screening: {
        hiv: { minAge: 16, label: "HIV Opt-Out (NICE/RCEM)", yesNo: true, info: "Opt-out blood-borne virus testing for people having blood taken, where the ED is part of the NHS England opt-out testing programme. Follow local policy on age range; normalise it as a routine part of the blood panel unless the patient declines." },
        frailty: { minAge: 65, label: "Frailty (Silver Book II)", options: [ { val: "1", text: "1. Very Fit" }, { val: "2", text: "2. Well" }, { val: "3", text: "3. Managing Well" }, { val: "4", text: "4. Vulnerable" }, { val: "5", text: "5. Mildly Frail" }, { val: "6", text: "6. Moderately Frail" }, { val: "7", text: "7. Severely Frail" }, { val: "8", text: "8. Very Severely Frail" }, { val: "9", text: "9. Terminally Ill" } ], info: "Clinical Frailty Scale (CFS): 1 Very Fit - robust, active. 2 Well - no active disease symptoms. 3 Managing Well - controlled comorbidities. 4 Vulnerable - symptoms limit activity. 5 Mildly Frail - needs help with some IADLs. 6 Moderately Frail - needs help with all outdoor activities and housework. 7 Severely Frail - completely dependent for personal care. 8 Very Severely Frail - approaching end of life. 9 Terminally Ill - life expectancy <6 months. Score the patient's baseline ~2 weeks before this illness, not how they are today." },
        // Sepsis is now auto-calculated from obs + tick-boxes in the Physiology card (see calcSepsisScreen in app.js) - removed as a manual Yes/No here to avoid duplication.
        alcohol: { minAge: 16, label: "Alcohol AUDIT-C Screen", options: [ { val: "0", text: "0-4 (Low Risk)" }, { val: "5", text: "5-7 (Increasing Risk)" }, { val: "8", text: "8-10 (Higher Risk)" }, { val: "11", text: "11+ (Possible Dependence)" } ], info: "AUDIT-C - 3 questions, each scored 0-4 (max 12): 1) How often do you have a drink containing alcohol? 2) How many units/standard drinks on a typical drinking day? 3) How often do you have 6+ units (female) / 8+ units (male) on one occasion? Sum the three scores against the bands in the dropdown." },
        smoking: { minAge: 12, label: "Current Smoker? (Offer Cessation)", yesNo: true },
        falls: { minAge: 65, label: "Falls History (Last 12m)", yesNo: true },
        mental_health: { label: "Mental Health / Capacity Concern", yesNo: true },
        domestic_violence: { minAge: 16, label: "Domestic Abuse - routine enquiry", yesNo: true, info: "Ask privately, when the patient is alone. A 'Yes' needs the local domestic abuse pathway / IDVA referral." },
        learning_disability: { label: "Learning disability / autism - reasonable adjustments needed", yesNo: true, info: "Ask about a hospital passport, communication needs and whether a carer should stay." },
        homeless: { minAge: 16, label: "No fixed abode / homeless", yesNo: true, info: "Duty to refer to the local housing authority (Homelessness Reduction Act 2017) with consent." },
        veteran: { minAge: 18, label: "Military Veteran?", yesNo: true }
    },

    // --- 5. SCORING ---
    scoring: {
        news2: {
            rr: [ { max: 8, score: 3 }, { max: 11, score: 1 }, { max: 20, score: 0 }, { max: 24, score: 2 }, { max: 999, score: 3 } ],
            sats1: [ { max: 91, score: 3 }, { max: 93, score: 2 }, { max: 95, score: 1 }, { max: 100, score: 0 } ],
            sats2: [ { max: 83, score: 3 }, { max: 85, score: 2 }, { max: 87, score: 1 }, { max: 92, score: 0 }, { max: 93, score: 1 }, { max: 94, score: 2 }, { max: 96, score: 3 }, { max: 100, score: 3 } ],
            sbp: [ { max: 90, score: 3 }, { max: 100, score: 2 }, { max: 110, score: 1 }, { max: 219, score: 0 }, { max: 999, score: 3 } ],
            hr: [ { max: 40, score: 3 }, { max: 50, score: 1 }, { max: 90, score: 0 }, { max: 110, score: 1 }, { max: 130, score: 2 }, { max: 999, score: 3 } ],
            temp: [ { max: 35.0, score: 3 }, { max: 36.0, score: 1 }, { max: 38.0, score: 0 }, { max: 39.0, score: 1 }, { max: 99.9, score: 2 } ]
        },
        
        pews: {
            infant: { // <1 year
                rr: [{max: 20, score:3}, {max: 29, score:1}, {max: 50, score:0}, {max: 60, score:1}, {max: 70, score:2}, {max: 999, score:3}],
                hr: [{max: 90, score:3}, {max: 109, score:1}, {max: 160, score:0}, {max: 179, score:1}, {max: 190, score:2}, {max: 999, score:3}]
            },
            toddler: { // 1-4 years
                rr: [{max: 15, score:3}, {max: 19, score:1}, {max: 40, score:0}, {max: 50, score:1}, {max: 60, score:2}, {max: 999, score:3}],
                hr: [{max: 80, score:3}, {max: 99, score:1}, {max: 140, score:0}, {max: 159, score:1}, {max: 170, score:2}, {max: 999, score:3}]
            },
            child: { // 5-12 years
                rr: [{max: 15, score:3}, {max: 19, score:1}, {max: 30, score:0}, {max: 35, score:1}, {max: 40, score:2}, {max: 999, score:3}],
                hr: [{max: 70, score:3}, {max: 79, score:1}, {max: 120, score:0}, {max: 139, score:1}, {max: 150, score:2}, {max: 999, score:3}]
            },
            teen: { // >12 (Use adult-like ranges or specific teen ranges)
                rr: [{max: 10, score:3}, {max: 14, score:1}, {max: 25, score:0}, {max: 30, score:1}, {max: 35, score:2}, {max: 999, score:3}],
                hr: [{max: 50, score:3}, {max: 59, score:1}, {max: 100, score:0}, {max: 119, score:1}, {max: 130, score:2}, {max: 999, score:3}]
            }
        },
    
        paedsSafety: {
            weightCapKg: 50,
            disclaimer: "GUIDANCE ONLY. CHECK BNFc. Do not use for >50kg.",
            paracetamol: { mgPerKg: 15, maxDoseMg: 1000 },
            ibuprofen: { mgPerKg: 10, maxDoseMg: 400 }
        }
    },

    // --- 6. MTS FLOWCHARTS (FULL 52 SET) ---
    mtsFlowcharts: {
        "Abdominal Pain in Adults": [{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"Peritonism","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Testicular torsion","priority":"Orange"},{"text":"Significant history","priority":"Yellow"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"Altered GCS","priority":"Orange"},{"text":"Haemodynamic instability","priority":"Yellow"},{"text":"New onset in elderly","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Urinary symptoms","priority":"Green"},{"text":"Recent problem","priority":"Blue"},{"text":"Old problem","priority":"Blue"}],
        "Abdominal Pain in Children": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"Peritonism","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Testicular torsion","priority":"Orange"},{"text":"Bile-stained vomit","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Vomiting blood","priority":"Yellow"},{"text":"Dehydration","priority":"Yellow"},{"text":"Abdominal distension","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Vomiting","priority":"Green"},{"text":"Recent problem","priority":"Blue"}],
        "Abscesses and Local Infections": [{"text":"Sepsis (Red Flag)","priority":"Orange"},{"text":"Spreading Cellulitis","priority":"Yellow"},{"text":"Localised","priority":"Green"}],
        "Allergy": [{"text":"Airway compromise","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"Stridor","priority":"Orange"},{"text":"Wheeze","priority":"Orange"},{"text":"Oedema of tongue/throat","priority":"Orange"},{"text":"Widespread rash","priority":"Yellow"},{"text":"Facial oedema","priority":"Yellow"},{"text":"History of severe reaction","priority":"Yellow"},{"text":"Localised rash","priority":"Green"},{"text":"Itch","priority":"Green"}],
        "Assault": [{"text":"Major trauma","priority":"Red"},{"text":"Airway compromise","priority":"Red"},{"text":"Severe pain","priority":"Orange"},{"text":"Head Injury signs","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"Minor injury","priority":"Green"}],
        "Asthma": [{"text":"Life Threatening","priority":"Red"},{"text":"Severe Distress","priority":"Orange"},{"text":"Moderate Distress","priority":"Yellow"},{"text":"Mild Distress","priority":"Green"}],
        "Back Pain": [{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"Severe pain","priority":"Orange"},{"text":"New extensive neurological deficit","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"New focal neurological deficit","priority":"Yellow"},{"text":"Cauda equina syndrome symptoms","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Mechanical back pain","priority":"Green"},{"text":"Old problem","priority":"Blue"}],
        "Behaving Strangely": [{"text":"Immediate Risk","priority":"Red"},{"text":"Active Psychosis","priority":"Orange"},{"text":"Distressed","priority":"Yellow"},{"text":"Low Risk","priority":"Green"}],
        "Bites and Stings": [{"text":"Anaphylaxis","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Spreading Infection","priority":"Yellow"},{"text":"Local Reaction","priority":"Green"}],
        "Burns and Scalds": [{"text":"Airway Burns","priority":"Red"},{"text":">15% TBSA","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Facial Burns","priority":"Yellow"},{"text":"Minor Burns","priority":"Green"}],
        "Chest Pain": [{"text":"Airway compromise","priority":"Red"},{"text":"Catastrophic haemorrhage","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Cardiac-type chest pain at rest","priority":"Yellow"},{"text":"Pleuritic chest pain","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Recent non-cardiac pain","priority":"Green"},{"text":"Musculoskeletal pain","priority":"Green"}],
        "Collapse": [{"text":"Cardiac Arrest","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"History of arrhythmia","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Vasovagal","priority":"Green"}],
        "Confusion": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"New Confusion","priority":"Orange"},{"text":"Hypoglycaemia","priority":"Orange"},{"text":"Abnormal vital signs","priority":"Yellow"}],
        "Crying Baby": [{"text":"Unresponsive","priority":"Red"},{"text":"Non-blanching rash","priority":"Orange"},{"text":"Inconsolable","priority":"Orange"},{"text":"High Fever","priority":"Yellow"},{"text":"Settles with handling","priority":"Green"}],
        "Dental Problems": [{"text":"Airway risk","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Facial Swelling","priority":"Yellow"},{"text":"Toothache","priority":"Green"}],
        "Diabetes": [{"text":"Unresponsive","priority":"Red"},{"text":"Hypoglycaemia (<3)","priority":"Orange"},{"text":"Hyperglycaemia w/ Ketones","priority":"Orange"},{"text":"Vomiting","priority":"Yellow"},{"text":"High sugar, well","priority":"Green"}],
        "Diarrhoea and Vomiting": [{"text":"Shock","priority":"Red"},{"text":"Severe Dehydration","priority":"Orange"},{"text":"Blood in stool","priority":"Yellow"},{"text":"Mild Dehydration","priority":"Green"}],
        "Ear Problems": [{"text":"Severe Pain","priority":"Orange"},{"text":"Discharge","priority":"Yellow"},{"text":"Mild Pain","priority":"Green"},{"text":"Blocked Ear","priority":"Blue"}],
        "Eye Problems": [{"text":"Penetrating Injury","priority":"Red"},{"text":"Chemical Injury","priority":"Red"},{"text":"Sudden Loss of Vision","priority":"Orange"},{"text":"Severe Pain","priority":"Orange"},{"text":"Red Eye","priority":"Green"}],
        "Fits and Seizures": [{"text":"Airway compromise","priority":"Red"},{"text":"Actively seizing now (status epilepticus)","priority":"Red"},{"text":"Seizure just terminated, GCS still reduced","priority":"Orange"},{"text":"First ever seizure","priority":"Orange"},{"text":"Repeated seizures (cluster)","priority":"Orange"},{"text":"Injury sustained during seizure","priority":"Yellow"},{"text":"Post-ictal, known epilepsy, improving","priority":"Yellow"},{"text":"Fully recovered, known epilepsy, at baseline","priority":"Green"},{"text":"Information/advice only","priority":"Blue"}],
        "Facial Problems": [{"text":"Airway Risk","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Swelling","priority":"Yellow"},{"text":"Minor Injury","priority":"Green"}],
        "Falls": [{"text":"Major trauma","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"Altered GCS","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Long lie (>1 hour)","priority":"Orange"},{"text":"Suspected neck of femur fracture","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"History of LOC","priority":"Yellow"},{"text":"Inability to weight bear","priority":"Yellow"},{"text":"Head injury with anticoagulants","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Able to weight bear","priority":"Green"}],
        "Foreign Body": [{"text":"Airway Obstruction","priority":"Red"},{"text":"Inhaled","priority":"Orange"},{"text":"Swallowed (High Risk)","priority":"Yellow"},{"text":"Minor","priority":"Green"}],
        "Gastrointestinal Bleeding": [{"text":"Exsanguinating","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"Haematemesis","priority":"Orange"},{"text":"Melaena","priority":"Yellow"},{"text":"Small amounts","priority":"Green"}],
        "Headache": [{"text":"GCS Reduced","priority":"Red"},{"text":"Sudden Onset (Thunderclap)","priority":"Orange"},{"text":"Meningism","priority":"Orange"},{"text":"History of Migraine","priority":"Green"}],
        "Head Injury": [{"text":"GCS < 9","priority":"Red"},{"text":"GCS 9-12","priority":"Orange"},{"text":"Penetrating injury","priority":"Orange"},{"text":"Seizing now","priority":"Orange"},{"text":"Focal neurological deficit","priority":"Orange"},{"text":"GCS 13-14","priority":"Yellow"},{"text":"Vomiting >1 episode","priority":"Yellow"},{"text":"History of LOC >5 mins","priority":"Yellow"},{"text":"Amnesia","priority":"Yellow"},{"text":"On anticoagulants","priority":"Yellow"},{"text":"GCS 15, no other factors","priority":"Green"}],
        "Irritable Child": [{"text":"Unresponsive","priority":"Red"},{"text":"Meningism","priority":"Orange"},{"text":"Fever","priority":"Yellow"},{"text":"Settles","priority":"Green"}],
        "Limb Problems": [{"text":"Pulseless Limb","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Deformity","priority":"Orange"},{"text":"Moderate Pain","priority":"Yellow"},{"text":"Minor Injury","priority":"Green"}],
        "Limping Child": [{"text":"Septic Arthritis signs","priority":"Orange"},{"text":"Non-weight bearing","priority":"Yellow"},{"text":"Minor trauma","priority":"Green"}],
        "Major Trauma": [{"text":"Cardiac Arrest","priority":"Red"},{"text":"Active Bleeding","priority":"Red"},{"text":"GCS < 9","priority":"Red"},{"text":"High Energy Mechanism","priority":"Orange"}],
        "Mental Illness": [{"text":"Immediate Risk","priority":"Red"},{"text":"Aggressive","priority":"Orange"},{"text":"Self Harm Risk","priority":"Yellow"},{"text":"Anxiety/Depression","priority":"Green"}],
        "Neck Pain": [{"text":"C-Spine Injury (High Risk)","priority":"Orange"},{"text":"Severe Pain","priority":"Orange"},{"text":"Neurology","priority":"Yellow"},{"text":"Muscular","priority":"Green"}],
        "Needlestick Injury": [{"text":"High Risk Source","priority":"Yellow"},{"text":"Low Risk","priority":"Green"}],
        "Overdose and Poisoning": [{"text":"Unresponsive","priority":"Red"},{"text":"Seizing now","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"Altered GCS","priority":"Orange"},{"text":"Abnormal vital signs","priority":"Orange"},{"text":"High-risk substance","priority":"Orange"},{"text":"Deliberate self-harm intent","priority":"Yellow"},{"text":"Symptomatic but stable","priority":"Yellow"},{"text":"Asymptomatic, low-risk substance","priority":"Green"},{"text":"Information request","priority":"Blue"}],
        "Palpitations": [{"text":"Shock","priority":"Red"},{"text":"Chest Pain","priority":"Orange"},{"text":"Rate > 150","priority":"Orange"},{"text":"History of AF","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Normal ECG","priority":"Green"}],
        "Pregnancy": [{"text":"Active Labour (Crowning)","priority":"Red"},{"text":"PV Bleeding (Heavy)","priority":"Orange"},{"text":"Abdo Pain","priority":"Yellow"},{"text":"Minor symptoms","priority":"Green"}],
        "PV Bleeding": [{"text":"Shock","priority":"Red"},{"text":"Heavy bleeding with clots","priority":"Orange"},{"text":"Pregnant with bleeding","priority":"Yellow"},{"text":"Period-like bleeding","priority":"Green"},{"text":"Spotting only","priority":"Blue"}],
        "Apparently Drunk": [{"text":"Airway compromise","priority":"Red"},{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"Hypoglycaemia","priority":"Orange"},{"text":"Head injury/trauma signs","priority":"Orange"},{"text":"Reduced GCS (responds to voice/pain)","priority":"Orange"},{"text":"Vomiting","priority":"Yellow"},{"text":"Aggressive/agitated behaviour","priority":"Yellow"},{"text":"Smells of alcohol, GCS 15, walking/talking normally","priority":"Green"},{"text":"Known chronic use, requesting advice","priority":"Blue"}],
        "Rash": [{"text":"Anaphylaxis","priority":"Red"},{"text":"Non-blanching","priority":"Orange"},{"text":"Widespread","priority":"Yellow"},{"text":"Itchy","priority":"Green"}],
        "Self Harm": [{"text":"Active Bleeding (Major)","priority":"Red"},{"text":"Deep Laceration","priority":"Orange"},{"text":"Ingestion","priority":"Orange"},{"text":"Superficial","priority":"Yellow"}],
        "Sexually Acquired Infection": [{"text":"Severe Pain","priority":"Orange"},{"text":"Discharge","priority":"Green"},{"text":"Advice","priority":"Blue"}],
        "Shortness of Breath in Adults": [{"text":"Apnoeic","priority":"Red"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Shock","priority":"Red"},{"text":"Stridor","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Moderate respiratory distress","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Mild respiratory distress","priority":"Green"},{"text":"Cough","priority":"Green"},{"text":"Sore throat","priority":"Green"}],
        "Shortness of Breath in Children": [{"text":"Apnoeic","priority":"Red"},{"text":"Silent Chest","priority":"Red"},{"text":"Stridor","priority":"Orange"},{"text":"Severe Recession","priority":"Orange"},{"text":"Moderate Recession","priority":"Yellow"},{"text":"Cough","priority":"Green"}],
        "Sore Throat": [{"text":"Airway Compromise","priority":"Red"},{"text":"Drooling","priority":"Orange"},{"text":"Difficulty Swallowing","priority":"Yellow"},{"text":"Pain only","priority":"Green"}],
        "Testicular Pain": [{"text":"Torsion suspected","priority":"Orange"},{"text":"Severe Pain","priority":"Orange"},{"text":"Swelling","priority":"Yellow"},{"text":"Ache","priority":"Green"}],
        "Torso Injury": [{"text":"Stab/Gunshot","priority":"Red"},{"text":"Chest Flail","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Bruising","priority":"Yellow"}],
        "Unwell Adult": [{"text":"Unresponsive","priority":"Red"},{"text":"Sepsis Suspected","priority":"Orange"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"General Malaise","priority":"Green"}],
        "Unwell Child": [{"text":"Unresponsive","priority":"Red"},{"text":"Sepsis Suspected","priority":"Orange"},{"text":"Non-blanching rash","priority":"Orange"},{"text":"Fever > 5 days","priority":"Yellow"},{"text":"Viral symptoms","priority":"Green"}],
        "Urinary Problems": [{"text":"Retention","priority":"Orange"},{"text":"Haematuria (Frank)","priority":"Yellow"},{"text":"Dysuria","priority":"Green"}],
        "Worried Parent": [{"text":"Child looks unwell","priority":"Orange"},{"text":"Parent very distressed","priority":"Yellow"},{"text":"Advice","priority":"Green"}],
        "Wounds": [{"text":"Uncontrolled Bleeding","priority":"Red"},{"text":"Deep/Complex","priority":"Orange"},{"text":"Needs Suture","priority":"Yellow"},{"text":"Graze/Glue","priority":"Green"}],
        "Suspected Stroke": [{"text":"Airway compromise","priority":"Red"},{"text":"Unresponsive / GCS <9","priority":"Red"},{"text":"FAST positive, onset within thrombolysis window","priority":"Orange"},{"text":"Reduced GCS","priority":"Orange"},{"text":"Severe headache with neurological deficit","priority":"Orange"},{"text":"New focal neurological deficit, outside thrombolysis window","priority":"Yellow"},{"text":"Dysphasia / dysarthria","priority":"Yellow"},{"text":"Facial droop, improving","priority":"Yellow"},{"text":"Chronic/old deficit, no acute change","priority":"Blue"}],
        "Suspected TIA": [{"text":"Ongoing/evolving focal deficit (possible stroke, not resolved)","priority":"Orange"},{"text":"Crescendo TIA (recurrent within 24h)","priority":"Orange"},{"text":"Single TIA, resolved, high-risk features","priority":"Yellow"},{"text":"Known AF, not anticoagulated","priority":"Yellow"},{"text":"Single TIA, resolved, low-risk","priority":"Green"},{"text":"Information/advice only","priority":"Blue"}],
        "Suspected DVT / PE": [{"text":"Shock / haemodynamic collapse","priority":"Red"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Pleuritic chest pain with hypoxia","priority":"Orange"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Unilateral leg swelling/pain","priority":"Yellow"},{"text":"Tachycardia, recent immobility/surgery","priority":"Yellow"},{"text":"Mild leg swelling, well, ambulatory","priority":"Green"}],
        "Jaundice": [{"text":"Signs of liver failure/encephalopathy","priority":"Red"},{"text":"Fever with jaundice (cholangitis)","priority":"Orange"},{"text":"Severe abdominal pain with jaundice","priority":"Orange"},{"text":"New onset jaundice","priority":"Yellow"},{"text":"Pale stools / dark urine","priority":"Yellow"},{"text":"Known chronic liver disease, stable","priority":"Green"},{"text":"Mild, longstanding","priority":"Blue"}],
        "Elderly Care / Off Legs": [{"text":"Shock","priority":"Red"},{"text":"Sepsis suspected","priority":"Orange"},{"text":"Acute confusion/delirium","priority":"Orange"},{"text":"Long lie (>1 hour)","priority":"Orange"},{"text":"Unable to weight bear / off legs","priority":"Yellow"},{"text":"Recurrent falls","priority":"Yellow"},{"text":"Failure to cope at home","priority":"Yellow"},{"text":"Social concerns, medically well","priority":"Green"},{"text":"Chronic/longstanding decline","priority":"Blue"}],
        "Hypoglycaemia in Neonate / Child": [{"text":"Unresponsive / seizure","priority":"Red"},{"text":"BM \u22642.6, symptomatic","priority":"Orange"},{"text":"BM low, lethargic, poor feeding","priority":"Yellow"},{"text":"Borderline BM, well, tolerating feeds","priority":"Green"}]
    },

    // --- 7a. NAMED ED BLOOD PROFILES (matches trust ICE ordering system order-sets) ---
    // Ticking a named profile in the UI selects/deselects the WHOLE panel at once (matches ICE),
    // rather than each test being individually tickable. Bedside/urine tests remain individual.
    bloodProfiles: {
        "AE Acute Coronary Syndrome": [{ name: "FBC", why: "Baseline Hb before anticoagulation/antiplatelets" }, { name: "U&E", why: "Renal function, baseline electrolytes" }, { name: "Troponin I (High Sensitivity)", why: "Biomarker for myocardial injury - repeat per local ACS protocol" }, { name: "D-Dimer", why: "Rule out PE if low pre-test probability (Wells score)" }, { name: "CK", why: "Adjunct marker of myocardial/skeletal muscle injury" }, { name: "Lipid Profile", why: "Cardiovascular risk assessment" }, { name: "Glucose", why: "Diabetes screen - relevant cardiac risk factor" }, { name: "CRP", why: "Inflammatory marker if myocarditis/pericarditis considered" }, { name: "LFT & Bone Profile", why: "Baseline before statin/other cardiac medication" }],
        "AE Abdominal Pain": [{ name: "FBC", why: "Look for leukocytosis suggesting infection/inflammation" }, { name: "U&E", why: "Renal function, electrolyte derangement from vomiting/obstruction" }, { name: "LFT", why: "Screen for biliary/hepatic cause" }, { name: "Amylase", why: "Exclude acute pancreatitis" }, { name: "CRP", why: "Inflammatory marker, trend with clinical picture" }, { name: "G&S", why: "In case of surgical bleeding or transfusion need" }],
        "AE Abcess and Cellulitis": [{ name: "FBC", why: "Look for leukocytosis suggesting systemic infection" }, { name: "CRP", why: "Inflammatory marker, trend with clinical picture" }, { name: "U&E", why: "Baseline renal function before antibiotics" }, { name: "Glucose", why: "Diabetes screen - relevant to infection risk/healing" }],
        "AE Anaphylaxis": [{ name: "FBC", why: "Baseline blood count" }, { name: "U&E", why: "Baseline renal function" }, { name: "LFT", why: "Baseline liver function" }, { name: "Mast Cell Tryptase", why: "Timed sample (immediate, then 1-2h) supports diagnosis - repeat at 24h baseline if uncertain" }],
        "AE Back Pain": [{ name: "FBC", why: "Infection/inflammation screen" }, { name: "U&E", why: "Baseline renal function" }, { name: "CRP", why: "Raised in discitis/epidural abscess/vertebral osteomyelitis" }],
        "AE Collapse query cause": [{ name: "FBC", why: "Anaemia as contributing cause" }, { name: "U&E", why: "Electrolyte-driven arrhythmia/collapse" }, { name: "Troponin I", why: "Exclude silent MI as cause of collapse" }, { name: "Glucose", why: "Exclude hypoglycaemia as cause" }, { name: "Bone Profile", why: "Hypercalcaemia/other electrolyte cause" }],
        "AE - Hypoglycaemia - Hyperglycaemia": [{ name: "FBC", why: "Infection screen - common precipitant of hyperglycaemia/DKA" }, { name: "U&E", why: "Renal function, electrolyte derangement (K+ before insulin)" }, { name: "LFT", why: "Baseline liver function" }, { name: "Glucose", why: "Formal lab glucose to confirm bedside BM" }, { name: "Osmolality", why: "Supports HHS diagnosis if very high glucose" }],
        "AE Diarrhoea and Vomiting": [{ name: "FBC", why: "Infection/inflammation screen" }, { name: "U&E", why: "Dehydration, electrolyte derangement from losses" }, { name: "CRP", why: "Inflammatory marker if bacterial/inflammatory cause" }, { name: "LFT", why: "Baseline if systemically unwell/dehydrated" }],
        "AE Epistaxis": [{ name: "FBC", why: "Baseline Hb, especially if bleeding prolonged/recurrent" }, { name: "Clotting Screen", why: "Exclude coagulopathy, essential if on anticoagulants" }, { name: "G&S", why: "In case of significant blood loss" }],
        "AE Fractured Neck of Femur": [{ name: "FBC", why: "Baseline Hb before theatre" }, { name: "U&E", why: "Renal function, baseline electrolytes" }, { name: "LFT", why: "Baseline pre-operative liver function" }, { name: "Bone Profile", why: "Baseline calcium/bone metabolism" }, { name: "Glucose", why: "Baseline pre-operative glucose" }, { name: "G&S", why: "Group and save for likely peri-operative transfusion" }],
        "AE First Fit": [{ name: "FBC", why: "Infection screen as seizure precipitant" }, { name: "U&E", why: "Electrolyte-driven seizure (e.g. hyponatraemia)" }, { name: "Bone Profile", why: "Hypocalcaemia/hypomagnesaemia as seizure cause" }, { name: "Glucose", why: "Exclude hypo/hyperglycaemia as cause" }, { name: "Blood Alcohol Level", why: "Alcohol withdrawal/intoxication as precipitant" }],
        "AE GI Bleed": [{ name: "FBC", why: "Baseline Hb - may be disproportionately normal in acute bleed" }, { name: "U&E", why: "Urea often disproportionately raised in upper GI bleed" }, { name: "LFT", why: "Screen for chronic liver disease/varices risk" }, { name: "Clotting Screen", why: "Coagulopathy - essential before endoscopy/if anticoagulated" }, { name: "Cross Match", why: "Group and crossmatch if haemodynamically unstable/significant bleed" }],
        "AE - Headache - Temporal Arteritis": [{ name: "FBC", why: "Baseline blood count" }, { name: "ESR", why: "Key discriminator for GCA - urgent same-day if suspected" }, { name: "CRP", why: "Inflammatory marker, supports GCA diagnosis" }, { name: "U&E", why: "Baseline renal function" }, { name: "LFT", why: "Baseline before high-dose steroids if GCA confirmed" }],
        "AE - Inflamed - Infected Joint": [{ name: "FBC", why: "Look for leukocytosis suggesting septic arthritis" }, { name: "CRP", why: "Inflammatory marker, trend with clinical picture" }, { name: "U&E", why: "Baseline renal function" }, { name: "Urate", why: "Supports gout diagnosis (interpret with caution acutely)" }],
        "Major Bleed Procedure": [{ name: "FBC", why: "Baseline Hb/platelets" }, { name: "Clotting Screen", why: "Baseline coagulation status" }, { name: "Fibrinogen", why: "Guides massive transfusion protocol/cryoprecipitate need" }, { name: "Group & Crossmatch", why: "Urgent crossmatch for major haemorrhage protocol" }],
        "AE DSH Overdose": [{ name: "FBC", why: "Baseline blood count" }, { name: "U&E", why: "Renal function, baseline electrolytes" }, { name: "LFT", why: "Essential - baseline and trend in paracetamol overdose" }, { name: "Paracetamol Level", why: "Timed level (4h post-ingestion) - guides NAC treatment" }, { name: "Salicylate Level", why: "Exclude/quantify salicylate co-ingestion" }, { name: "Clotting Screen (INR)", why: "Marker of hepatotoxicity in paracetamol overdose" }],
        "AE - PV Bleed - Pregnant": [{ name: "FBC", why: "Baseline Hb" }, { name: "G&S", why: "Group and save - essential, check Rhesus status" }, { name: "Rhesus Group", why: "Anti-D required if Rhesus negative" }],
        "AE - SOB": [{ name: "FBC", why: "Infection/anaemia screen" }, { name: "U&E", why: "Baseline renal function" }, { name: "CRP", why: "Inflammatory/infective marker" }, { name: "BNP", why: "Supports/excludes cardiac failure as cause" }, { name: "D-Dimer", why: "Rule out PE if low pre-test probability (Wells score)" }],
        "AE - Sepsis": [{ name: "FBC", why: "Look for leukocytosis/leukopenia" }, { name: "U&E", why: "Renal function - AKI is a Red Flag Sepsis criterion" }, { name: "LFT", why: "Organ dysfunction screen" }, { name: "CRP", why: "Inflammatory marker, trend with clinical picture" }, { name: "Clotting Screen", why: "Coagulopathy/DIC screen in severe sepsis" }, { name: "Glucose", why: "Hyper/hypoglycaemia common in sepsis" }],
        "AE - Sepsis (Paediatric)": [{ name: "FBC", why: "Look for leukocytosis/leukopenia" }, { name: "CRP", why: "Inflammatory marker, trend with clinical picture" }, { name: "U&E", why: "Renal function, hydration status" }, { name: "Blood Cultures", why: "Essential before antibiotics if septic" }],
        "AE - Renal Colic": [{ name: "FBC", why: "Infection screen" }, { name: "U&E", why: "Renal function - essential if solitary kidney/AKI concern" }, { name: "CRP", why: "Distinguishes infected obstructed stone (surgical emergency)" }, { name: "Bone Profile", why: "Hypercalcaemia as a cause of stone formation" }],
        "AE - Stroke": [{ name: "FBC", why: "Baseline before thrombolysis/antiplatelets, exclude anaemia/polycythaemia as contributing cause" }, { name: "U&E", why: "Baseline renal function - relevant to medication dosing" }, { name: "Glucose", why: "Formal lab glucose - hypoglycaemia is a key stroke mimic" }, { name: "Clotting Screen", why: "Essential before thrombolysis - excludes coagulopathy" }, { name: "Lipid Profile", why: "Vascular risk factor assessment" }],
        "AE - TIA": [{ name: "FBC", why: "Baseline blood count, exclude anaemia/polycythaemia" }, { name: "U&E", why: "Baseline renal function" }, { name: "Glucose", why: "Exclude hypoglycaemia as cause of transient symptoms" }, { name: "Lipid Profile", why: "Vascular risk factor assessment" }],
        "AE DVT and PE": [{ name: "FBC", why: "Baseline Hb/platelets before anticoagulation" }, { name: "U&E", why: "Renal function - guides anticoagulant choice/dosing" }, { name: "Clotting Screen", why: "Baseline coagulation before anticoagulation" }, { name: "D-Dimer", why: "Rule out VTE if low pre-test probability (Wells score)" }],
        "AE - Jaundice": [{ name: "FBC", why: "Baseline blood count, haemolysis screen" }, { name: "LFT", why: "Pattern (obstructive vs hepatocellular) guides further workup" }, { name: "U&E", why: "Baseline renal function - hepatorenal syndrome risk" }, { name: "Clotting Screen (INR)", why: "Synthetic liver function marker, relevant before any procedure" }, { name: "CRP", why: "Raised in cholangitis/infective causes" }],
        "AE Elderly Care": [{ name: "U&E", why: "Renal function, dehydration screen" }, { name: "Bone Profile", why: "Hypercalcaemia as a cause of confusion/off legs" }, { name: "CRP", why: "Infection screen - common cause of acute decline" }, { name: "FBC", why: "Anaemia/infection screen" }],
        "AE - Neonatal and Childhood hypoglycaemia": [{ name: "Glucose (Lab)", why: "Confirm bedside BM with a formal lab glucose" }, { name: "U&E", why: "Electrolyte derangement as a contributing cause" }, { name: "LFT", why: "Liver disease/glycogen storage disorder as a cause of hypoglycaemia" }, { name: "Blood Ketones", why: "Ketotic vs non-ketotic hypoglycaemia narrows the differential" }, { name: "Critical Sample (cortisol/insulin/GH)", why: "Take at the time of hypoglycaemia if safe to do so - essential for metabolic/endocrine workup" }],
        "AE Head Injury on Warfarin": [{ name: "FBC", why: "Baseline Hb/platelets" }, { name: "Clotting Screen (INR)", why: "Guides urgent anticoagulation reversal if intracranial bleed" }, { name: "U&E", why: "Baseline renal function" }, { name: "G&S", why: "In case of associated injury requiring transfusion" }]
    },

    // --- 7b. NURSING PLAN PER PRESENTATION (1:1 with the MTS flowcharts) ---
    // Nursing-scope only: NO imaging. Bloods are ONLY the named ED ICE bundles in bloodProfiles
    // (never individual lab tests). Each bedside test / bundle / pathway is either always suggested,
    // auto-suggested when its condition is met (`auto`), or shown as "Consider if ..." (`when`). Helpers at the top.
    // auto keys: always | adult | child | infection | anticoag | pregnant | age50 | age65 | age5plus
    //            | sepsis | bmLow | bmHigh | disc:<discriminator text>[|<text>...]; join with + for AND
    //            (e.g. 'child+disc:Non-blanching'). `sepsis` = NG253 moderate/high risk, a sepsis discriminator,
    //            or NICE NG143 amber/red in under-5s.
    protocols: {
        "Abdominal Pain in Adults": P({ cannula: C.consider('20G', 'Analgesia / bloods'),
            bedside: [BS.urine, BS.bm('Diabetic ketoacidosis and pancreatitis can present as abdominal pain'), BS.ecg('Epigastric pain can be cardiac - especially if 50 or over', 'if aged 50+ or epigastric pain', 'age50'), BS.vbg('Lactate for ischaemia/sepsis, quick K+ and glucose', 'if unwell, shocked or NEWS2 5+', 'disc:Shock|Haemodynamic instability')],
            bloods: [bl('AE Abdominal Pain'), bl('AE - Renal Colic', 'loin-to-groin pain / suspected renal stone (use instead)'), bl('AE GI Bleed', 'vomiting blood or melaena', 'disc:Vomiting blood'), bl('AE - PV Bleed - Pregnant', 'pregnant, or pregnancy test positive', 'pregnant'), bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis'), bl('Major Bleed Procedure', 'shocked or catastrophic haemorrhage', 'disc:Shock|Catastrophic haemorrhage')],
            pathways: [pw('SAU', 'surgical cause suspected, haemodynamically stable'), pw('EPU', 'pregnant', 'pregnant')] }),
        "Abdominal Pain in Children": P({ cannula: C.avoid('Oral fluids and analgesia first'),
            bedside: [BS.urine, BS.bm('DKA can present as abdominal pain in children'), BS.ketones('DKA screen - check if glucose is raised', 'if BM raised', 'bmHigh')],
            bloods: [bl('AE - Sepsis (Paediatric)', 'sepsis suspected, or NICE fever traffic light amber/red', 'sepsis'), bl('AE - Hypoglycaemia - Hyperglycaemia', 'BM raised (possible DKA - follow the paediatric DKA pathway)', 'bmHigh')],
            pathways: [pw('SAU', 'surgical cause suspected - local paediatric surgical pathway')] }),
        "Abscesses and Local Infections": P({ cannula: C.avoid('Oral antibiotics unless systemically unwell'),
            bedside: [BS.bm('Undiagnosed or poorly controlled diabetes increases infection risk'), bs('Wound swab', 'Guides antibiotic choice if discharging', 'if discharging pus')],
            bloods: [bl('AE Abcess and Cellulitis', 'spreading cellulitis or systemically unwell', 'disc:Spreading Cellulitis|Sepsis (Red Flag)'), bl('AE - Sepsis', 'infection with NEWS2 5+ or sepsis suspected', 'disc:Sepsis (Red Flag)')],
            pathways: [pw('EDAA', 'needs IV antibiotics but ambulatory and well'), pw('Minors', 'localised, well', 'disc:Localised')] }),
        "Allergy": P({ cannula: C.consider('18G', 'Anaphylaxis - IV access'),
            bedside: [BS.peakflow('Objective measure of bronchospasm', 'if wheeze', 'disc:Wheeze'), BS.ecg('Baseline if adrenaline given or cardiac history', 'if adrenaline given')],
            bloods: [bl('AE Anaphylaxis', 'anaphylaxis suspected (airway, breathing or circulation involved) - timed tryptase', 'disc:Airway compromise|Shock|Stridor|Wheeze|Oedema of tongue/throat')],
            pathways: [pw('Resus', 'anaphylaxis', 'disc:Airway compromise|Shock|Stridor')] }),
        "Assault": P({ cannula: C.avoid('Minor injury'),
            bedside: [BS.neuro('Detect deterioration after a head injury', 'if head injury', 'disc:Head Injury signs'), bs('Police reference number', 'For documentation and information sharing (if reported)', 'if reported to police'), bs('Photographs of injuries (with consent)', 'Forensic documentation per local policy', 'if consented and local policy allows')],
            bloods: [bl('AE Head Injury on Warfarin', 'head injury while on an anticoagulant', 'anticoag+disc:Head Injury signs'), bl('Major Bleed Procedure', 'major trauma or significant bleeding', 'disc:Major trauma')],
            pathways: [] }),
        "Asthma": P({ cannula: C.consider('20G', 'IV magnesium / aminophylline if severe'),
            bedside: [BS.peakflow('Compare with best or predicted - grades severity (if 5 or over and able)', 'if aged 5+ and able', 'age5plus'), BS.vbg('Rising or normal CO2 suggests life-threatening asthma', 'severe or life-threatening', 'disc:Life Threatening|Severe Distress')],
            bloods: [bl('AE - SOB', 'severe or life-threatening asthma', 'disc:Life Threatening|Severe Distress')],
            pathways: [pw('Resus', 'life-threatening', 'disc:Life Threatening')] }),
        "Back Pain": P({ cannula: C.avoid('Oral analgesia'),
            bedside: [BS.urine, BS.bladder('Painless retention or a raised post-void residual raises concern for cauda equina', 'if cauda equina symptoms or new urinary symptoms', 'disc:Cauda equina syndrome symptoms'), BS.neuro('Detect evolving cord or cauda equina compromise', 'if new neurological symptoms', 'disc:New extensive neurological deficit|New focal neurological deficit|Cauda equina syndrome symptoms')],
            bloods: [bl('AE Back Pain', 'red flags: fever, cancer history, IV drug use, immunosuppression, or new neurology', 'disc:New extensive neurological deficit|New focal neurological deficit|Cauda equina syndrome symptoms'), bl('AE - Renal Colic', 'loin pain / suspected renal stone (use instead)'), bl('Major Bleed Procedure', 'shocked - consider aortic aneurysm', 'disc:Shock|Catastrophic haemorrhage')],
            pathways: [pw('Minors', 'mechanical back pain, mobile', 'disc:Mechanical back pain')] }),
        "Behaving Strangely": P({ cannula: C.consider('20G', 'If bloods needed'),
            bedside: [BS.bm('Hypoglycaemia is a rapidly reversible cause of altered behaviour'), BS.ecg('Many drugs cause arrhythmia or QT prolongation', 'if substance use suspected')],
            bloods: [bl('AE Elderly Care', 'aged 65+ with new behaviour change (delirium screen)', 'age65'), bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis'), bl('AE DSH Overdose', 'ingestion suspected')],
            pathways: [pw('MH', 'medically well - mental health cause likely')] }),
        "Bites and Stings": P({ cannula: C.avoid('Oral antibiotics'),
            bedside: [],
            bloods: [bl('AE Anaphylaxis', 'systemic allergic reaction', 'disc:Anaphylaxis'), bl('AE Abcess and Cellulitis', 'spreading infection', 'disc:Spreading Infection')],
            pathways: [pw('Resus', 'anaphylaxis', 'disc:Anaphylaxis'), pw('Minors', 'local reaction', 'disc:Local Reaction')] }),
        "Burns and Scalds": P({ cannula: C.consider('16G', 'IV fluids if large burn'),
            bedside: [BS.weight('Needed for fluid and analgesia calculations', 'if a child or a larger burn', 'child'), BS.bm('Baseline', 'if a child or a larger burn')],
            bloods: [], bloodsNote: 'No ED bundle for burns - large burns: bloods as requested by the clinician / burns pathway.',
            pathways: [pw('Resus', 'airway burn or >15% TBSA', 'disc:Airway Burns|>15% TBSA'), pw('Minors', 'minor burn', 'disc:Minor Burns')] }),
        "Chest Pain": P({ cannula: C.essential('18G', 'ACS / PE pathway'),
            bedside: [BS.ecg('Within 10 minutes of arrival - identify STEMI or arrhythmia'), BS.vbg('Quick K+ and lactate if unwell or arrhythmia', 'if unwell or arrhythmia')],
            bloods: [bl('AE Acute Coronary Syndrome', 'cardiac-type or undifferentiated chest pain', 'adult'), bl('AE DVT and PE', 'pleuritic pain, haemoptysis or PE suspected', 'disc:Pleuritic chest pain|Haemoptysis'), bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis')],
            pathways: [pw('Resus', 'STEMI or unstable', 'disc:Shock|Airway compromise|Catastrophic haemorrhage'), pw('EDAA', 'low-risk chest pain, ambulatory - per local chest pain pathway')] }),
        "Collapse": P({ cannula: C.essential('18G', 'Cardiac cause?'),
            bedside: [BS.ecg('Arrhythmia, heart block, long QT or Brugada as the cause'), BS.bm('Exclude hypoglycaemia'), BS.lsbp('Postural hypotension as the cause')],
            bloods: [bl('AE Collapse query cause'), bl('Major Bleed Procedure', 'shocked - possible bleed', 'disc:Shock')],
            pathways: [pw('Resus', 'cardiac arrest or shocked', 'disc:Cardiac Arrest|Shock'), pw('SDEC', 'simple faint, recovered, normal ECG - per local syncope pathway')] }),
        "Confusion": P({ cannula: C.essential('20G', 'Delirium screen bloods'),
            bedside: [BS.bm('Hypoglycaemia is a reversible cause of confusion'), BS.urine, BS.ecg('Baseline in delirium screen', 'if aged 65+', 'age65'), BS.bladder('Retention can cause agitation and delirium', 'if aged 65+', 'age65')],
            bloods: [bl('AE Elderly Care', 'aged 65+ (delirium screen)', 'age65'), bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis'), bl('AE - Hypoglycaemia - Hyperglycaemia', 'BM raised', 'bmHigh'), bl('AE DSH Overdose', 'ingestion suspected')],
            pathways: [pw('FSDEC', 'aged 65+, frail, stable - per local frailty criteria')] }),
        "Crying Baby": P({ cannula: C.avoid('Senior paediatric review first'),
            bedside: [bs('Undress fully and check skin', 'Look for occult injury, hair tourniquet, hernia or rash'), BS.urine, BS.bm('Hypoglycaemia in an unsettled infant')],
            bloods: [bl('AE - Sepsis (Paediatric)', 'sepsis suspected, or NICE fever traffic light amber/red', 'sepsis')],
            pathways: [] }),
        "Dental Problems": P({ cannula: C.avoid('Refer to dentist'),
            bedside: [],
            bloods: [bl('AE Abcess and Cellulitis', 'facial swelling / spreading infection', 'disc:Facial Swelling')],
            pathways: [pw('Resus', 'airway risk', 'disc:Airway risk'), pw('UTC', 'toothache only - dental advice / urgent dental service', 'disc:Toothache')] }),
        "Diabetes": P({ cannula: C.consider('18G', 'If DKA / HHS suspected or IV glucose needed'),
            bedside: [BS.bm('Confirm hypo- or hyperglycaemia'), BS.ketones('Confirms DKA if raised with high glucose'), BS.vbg('pH and bicarbonate to grade DKA', 'if BM or ketones raised', 'bmHigh'), BS.urine, BS.ecg('Potassium derangement in DKA/HHS', 'if BM raised or unwell', 'bmHigh')],
            bloods: [bl('AE - Hypoglycaemia - Hyperglycaemia', 'adult with abnormal BM (children with DKA: paediatric DKA pathway)', 'adult'), bl('AE - Neonatal and Childhood hypoglycaemia', 'child with a low BM', 'child+bmLow'), bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis')],
            pathways: [pw('Resus', 'DKA with reduced consciousness or shock', 'disc:Unresponsive')] }),
        "Diarrhoea and Vomiting": P({ cannula: C.consider('20G', 'IV fluids if dehydrated'),
            bedside: [BS.vbg('Dehydration and electrolyte loss', 'if dehydrated or unwell', 'disc:Shock|Severe Dehydration'), BS.bm('Especially children and people with diabetes'), BS.urine, bs('Stool sample', 'Microscopy and culture', 'if bloody or recent travel', 'disc:Blood in stool')],
            bloods: [bl('AE Diarrhoea and Vomiting', 'dehydrated or unwell', 'disc:Shock|Severe Dehydration|Blood in stool'), bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis')],
            pathways: [pw('Minors', 'mild dehydration, tolerating fluids', 'disc:Mild Dehydration')] }),
        "Ear Problems": P({ cannula: C.avoid('Topical treatment'),
            bedside: [], bloods: [], pathways: [pw('Minors', 'well'), pw('UTC', 'mild pain or blocked ear', 'disc:Mild Pain|Blocked Ear')] }),
        "Eye Problems": P({ cannula: C.avoid('Topical treatment'),
            bedside: [bs('Visual acuity', 'Baseline in every eye complaint - record before any drops'), bs('pH of tear film', 'Chemical injury - irrigate first, repeat until neutral', 'chemical injury', 'disc:Chemical Injury'), bs('Fluorescein staining (if trained)', 'Corneal abrasion or foreign body', 'if trained and no penetrating injury')],
            bloods: [], pathways: [pw('Eye', 'eye casualty / ophthalmology per local pathway')] }),
        "Fits and Seizures": P({ cannula: C.consider('18G', 'If seizing, first fit or not back to baseline'),
            bedside: [BS.bm('Hypoglycaemia is a reversible cause or mimic'), BS.ecg('Cardiac syncope or long QT can mimic a seizure'), bs('Urine dip', 'Protein - eclampsia', 'pregnant or up to 6 weeks after birth', 'pregnant')],
            bloods: [bl('AE First Fit', 'first ever seizure', 'disc:First ever seizure'), bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis'), bl('AE Head Injury on Warfarin', 'injury during the seizure while anticoagulated', 'anticoag+disc:Injury sustained during seizure')],
            pathways: [pw('Resus', 'still seizing or airway compromised', 'disc:Airway compromise|Actively seizing now (status epilepticus)')] }),
        "Facial Problems": P({ cannula: C.avoid('Minor injury'),
            bedside: [BS.neuro('Detect deterioration after a head injury', 'if associated head injury')],
            bloods: [bl('AE Epistaxis', 'nosebleed (especially if prolonged, recurrent or anticoagulated)'), bl('AE Abcess and Cellulitis', 'facial swelling / cellulitis', 'disc:Swelling')],
            pathways: [pw('Resus', 'airway risk', 'disc:Airway Risk'), pw('Minors', 'minor injury', 'disc:Minor Injury')] }),
        "Falls": P({ cannula: C.consider('20G', 'If suspected #NOF, long lie or bloods needed'),
            bedside: [BS.ecg('Arrhythmia as the cause of a fall', 'if aged 65+ or unexplained fall', 'age65'), BS.lsbp('Postural hypotension as the cause', 'if aged 65+ or unexplained fall', 'age65'), BS.bm('Hypoglycaemia as the cause', 'if aged 65+, diabetic or unexplained fall', 'age65'), bs('Urine dip', 'Infection as the cause of a fall', 'if aged 65+ or unwell', 'age65'), bs('Pressure area check', 'Long lie or immobility', 'long lie or aged 65+', 'age65')],
            bloods: [bl('AE Fractured Neck of Femur', 'suspected hip fracture', 'disc:Suspected neck of femur fracture'), bl('AE Elderly Care', 'long lie, or aged 65+ and unwell or unexplained fall', 'disc:Long lie (>1 hour)'), bl('AE Collapse query cause', 'blackout / loss of consciousness before the fall', 'disc:History of LOC'), bl('AE Head Injury on Warfarin', 'head injury while on an anticoagulant', 'disc:Head injury with anticoagulants')],
            pathways: [pw('FSDEC', 'aged 65+, frail, no fracture, stable - per local frailty criteria'), pw('Minors', 'able to weight bear, minor injury', 'disc:Able to weight bear')] }),
        "Foreign Body": P({ cannula: C.avoid('Removal'),
            bedside: [], bloods: [], pathways: [pw('Resus', 'airway obstruction', 'disc:Airway Obstruction'), pw('Minors', 'minor', 'disc:Minor')] }),
        "Gastrointestinal Bleeding": P({ cannula: C.essential('16G x2', 'Major haemorrhage risk'),
            bedside: [BS.vbg('Rapid Hb and lactate while lab bloods are pending'), BS.ecg('Baseline - anaemia and ischaemia', 'if aged 50+ or unwell', 'age50')],
            bloods: [bl('AE GI Bleed'), bl('Major Bleed Procedure', 'exsanguinating or shocked (major haemorrhage protocol)', 'disc:Exsanguinating|Shock')],
            pathways: [pw('Resus', 'shocked', 'disc:Exsanguinating|Shock'), pw('SDEC', 'small amounts, stable - per local low-risk GI bleed (Glasgow-Blatchford) pathway', 'disc:Small amounts')] }),
        "Headache": P({ cannula: C.consider('20G', 'If bloods or IV treatment needed'),
            bedside: [BS.neuro('Detect evolving deficit or falling GCS'), BS.bm('Hypoglycaemia can cause headache and confusion'), bs('Urine dip', 'Protein - pre-eclampsia can present with headache', 'pregnant or up to 6 weeks after birth', 'pregnant')],
            bloods: [bl('AE - Headache - Temporal Arteritis', 'aged 50+ with a new headache, scalp tenderness, jaw pain or visual symptoms'), bl('AE - Sepsis', 'fever / meningism - infection suspected', 'disc:Meningism')],
            pathways: [pw('Resus', 'reduced GCS', 'disc:GCS Reduced')] }),
        "Head Injury": P({ cannula: C.consider('20G', 'If anticoagulated (bloods / reversal) or reduced GCS'),
            bedside: [BS.neuro('Serial GCS and pupils to detect deterioration'), BS.bm('Hypoglycaemia can mimic reduced GCS')],
            bloods: [bl('AE Head Injury on Warfarin', 'on warfarin, a DOAC or other anticoagulant', 'anticoag'), bl('Major Bleed Procedure', 'major trauma or significant bleeding')],
            pathways: [pw('Resus', 'GCS < 9 or seizing', 'disc:GCS < 9|Seizing now'), pw('Minors', 'GCS 15, no other factors', 'disc:GCS 15, no other factors')] }),
        "Irritable Child": P({ cannula: C.avoid('Paediatric review first'),
            bedside: [BS.urine, BS.bm('Hypoglycaemia in an irritable child')],
            bloods: [bl('AE - Sepsis (Paediatric)', 'febrile, unwell or meningism', 'disc:Meningism|Fever')],
            pathways: [] }),
        "Limb Problems": P({ cannula: C.avoid('Oral analgesia unless severe pain or hip fracture'),
            bedside: [bs('Neurovascular check', 'Exclude compartment syndrome and vascular compromise distal to the injury')],
            bloods: [bl('AE - Inflamed - Infected Joint', 'hot, swollen joint (septic arthritis or gout)'), bl('AE Fractured Neck of Femur', 'suspected hip fracture'), bl('AE Abcess and Cellulitis', 'cellulitis of the limb')],
            pathways: [pw('Minors', 'minor injury, mobile', 'disc:Minor Injury'), pw('UTC', 'minor injury - if local UTC takes minor injuries', 'disc:Minor Injury')] }),
        "Limping Child": P({ cannula: C.avoid('Oral analgesia'),
            bedside: [bs('Neurovascular check', 'Distal circulation and sensation')],
            bloods: [bl('AE - Sepsis (Paediatric)', 'febrile, non-weight bearing or septic arthritis suspected', 'disc:Septic Arthritis signs')],
            pathways: [pw('Minors', 'minor trauma', 'disc:Minor trauma')] }),
        "Major Trauma": P({ cannula: C.essential('14G/16G x2', 'Trauma call'),
            bedside: [BS.vbg('Lactate, Hb and base excess to guide resuscitation'), BS.bm('Baseline')],
            bloods: [bl('Major Bleed Procedure')],
            pathways: [pw('Resus', 'major trauma', 'always')] }),
        "Mental Illness": P({ cannula: C.avoid('Agitation risk'),
            bedside: [BS.bm('Exclude hypoglycaemia as an organic cause'), BS.ecg('QT prolongation and arrhythmia risk', 'if on antipsychotics or substance use')],
            bloods: [bl('AE DSH Overdose', 'any possibility of overdose or ingestion')],
            pathways: [pw('MH', 'medically well - mental health liaison')] }),
        "Neck Pain": P({ cannula: C.avoid('Oral analgesia'),
            bedside: [BS.neuro('Detect evolving cord or root compromise', 'if neurological symptoms', 'disc:Neurology')],
            bloods: [], pathways: [pw('Minors', 'muscular, no neurology', 'disc:Muscular')] }),
        "Needlestick Injury": P({ cannula: C.avoid('Not needed for triage'),
            bedside: [bs('Encourage bleeding and wash the wound', 'First aid - do not scrub or suck')],
            bloods: [], bloodsNote: 'No ED bundle - follow the local needlestick / occupational health protocol (baseline and source bloods).',
            pathways: [pw('Minors', 'needlestick pathway')] }),
        "Overdose and Poisoning": P({ cannula: C.essential('18G', 'Antidote / bloods'),
            bedside: [BS.ecg('QRS/QT prolongation guides risk (e.g. tricyclics)'), BS.vbg('Metabolic acidosis (e.g. salicylate, toxic alcohols)'), BS.bm('Hypoglycaemia in overdose')],
            bloods: [bl('AE DSH Overdose')],
            pathways: [pw('Resus', 'unresponsive, seizing or shocked', 'disc:Unresponsive|Seizing now|Shock'), pw('MH', 'medically fit - mental health liaison once cleared')] }),
        "Palpitations": P({ cannula: C.consider('20G', 'Rate control?'),
            bedside: [BS.ecg('Capture the rhythm - essential first test, ideally during symptoms')],
            bloods: [bl('AE Collapse query cause', 'syncope / near-syncope with palpitations'), bl('AE Acute Coronary Syndrome', 'associated chest pain', 'disc:Chest Pain')],
            pathways: [pw('Resus', 'shocked or rate over 150', 'disc:Shock|Rate > 150')] }),
        "Pregnancy": P({ cannula: C.consider('18G', 'Bleeding risk'),
            bedside: [bs('Urine dip', 'Protein (pre-eclampsia), infection, glucose'), BS.bm('Gestational or pre-existing diabetes', 'if diabetic or unwell')],
            bloods: [bl('AE - PV Bleed - Pregnant', 'PV bleeding', 'disc:PV Bleeding (Heavy)')],
            pathways: [pw('EPU', 'early pregnancy unit / maternity triage per local gestation criteria', 'always')] }),
        "PV Bleeding": P({ cannula: C.consider('18G', 'Bleeding risk / anaemia'),
            bedside: [bs('Pad count / estimated loss', 'Quantify bleeding')],
            bloods: [bl('AE - PV Bleed - Pregnant', 'pregnant or pregnancy test positive', 'pregnant'), bl('Major Bleed Procedure', 'shocked or heavy bleeding with clots', 'disc:Shock|Heavy bleeding with clots')],
            bloodsNote: 'There is no ED bundle for non-pregnant PV bleeding - bloods only if the clinician requests them.',
            pathways: [pw('EPU', 'pregnant - early pregnancy unit / gynaecology per local criteria', 'pregnant'), pw('Resus', 'shocked', 'disc:Shock')] }),
        "Apparently Drunk": P({ cannula: C.consider('20G', 'Hypoglycaemia / withdrawal'),
            bedside: [BS.bm('Hypoglycaemia is a common, reversible mimic of intoxication - must exclude'), BS.neuro('Distinguish intoxication from head injury')],
            bloods: [bl('AE - Hypoglycaemia - Hyperglycaemia', 'BM low', 'bmLow'), bl('AE DSH Overdose', 'possible co-ingestion or overdose'), bl('AE Head Injury on Warfarin', 'head injury while on an anticoagulant', 'anticoag+disc:Head injury/trauma signs')],
            pathways: [pw('Resus', 'airway compromise or unresponsive', 'disc:Airway compromise|Unresponsive')] }),
        "Rash": P({ cannula: C.avoid('Observe'),
            bedside: [bs('Glass test', 'Non-blanching rash raises concern for meningococcal sepsis')],
            bloods: [bl('AE - Sepsis', 'non-blanching rash - adult', 'adult+disc:Non-blanching'), bl('AE - Sepsis (Paediatric)', 'non-blanching rash - child', 'child+disc:Non-blanching'), bl('AE Anaphylaxis', 'anaphylaxis', 'disc:Anaphylaxis')],
            pathways: [pw('Resus', 'anaphylaxis', 'disc:Anaphylaxis')] }),
        "Self Harm": P({ cannula: C.consider('20G', 'If overdose or significant bleeding'),
            bedside: [bs('Wound check and neurovascular status', 'Tendon, nerve or vessel damage')],
            bloods: [bl('AE DSH Overdose', 'any ingestion', 'disc:Ingestion'), bl('Major Bleed Procedure', 'major bleeding', 'disc:Active Bleeding (Major)')],
            pathways: [pw('MH', 'medically fit - mental health liaison once cleared')] }),
        "Sexually Acquired Infection": P({ cannula: C.avoid('Refer to sexual health (GUM)'),
            bedside: [bs('Urine sample', 'For STI testing', 'if the local pathway tests in ED')],
            bloods: [], pathways: [] }),
        "Shortness of Breath in Adults": P({ cannula: C.essential('18G', 'IV medicines'),
            bedside: [BS.ecg('Arrhythmia, ischaemia or right heart strain'), BS.vbg('CO2 and lactate - ABG if hypoxic per clinician'), BS.peakflow('Objective severity - compare with best or predicted', 'if asthma / COPD')],
            bloods: [bl('AE - SOB', 'adult', 'adult'), bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis'), bl('AE DVT and PE', 'PE suspected (pleuritic pain, haemoptysis, leg swelling)', 'disc:Haemoptysis'), bl('AE Acute Coronary Syndrome', 'associated chest pain')],
            pathways: [pw('Resus', 'apnoeic or severe distress', 'disc:Apnoeic|Severe respiratory distress|Stridor'), pw('SDEC', 'stable, ambulatory - per local criteria')] }),
        "Shortness of Breath in Children": P({ cannula: C.avoid('Inhalers / nebulisers first'),
            bedside: [BS.peakflow('Objective severity - compare with best or predicted', 'if aged 5+ and able', 'age5plus'), BS.bm('Hypoglycaemia in unwell children', 'if unwell or reduced feeding')],
            bloods: [bl('AE - Sepsis (Paediatric)', 'sepsis suspected, or NICE fever traffic light amber/red', 'sepsis')],
            pathways: [pw('Resus', 'apnoeic or silent chest', 'disc:Apnoeic|Silent Chest')] }),
        "Sore Throat": P({ cannula: C.consider('20G', 'If unable to swallow / quinsy'),
            bedside: [],
            bloods: [bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis')],
            pathways: [pw('Resus', 'airway compromise', 'disc:Airway Compromise'), pw('UTC', 'pain only, swallowing normally', 'disc:Pain only')] }),
        "Testicular Pain": P({ cannula: C.consider('20G', 'If theatre possible'),
            bedside: [BS.urine],
            bloods: [bl('AE Abdominal Pain', 'surgical team want bloods before theatre (includes G&S)')],
            bloodsNote: 'Suspected torsion is time-critical: inform the surgical / urology team immediately - do not delay for bloods.',
            pathways: [pw('SAU', 'urgent surgical / urology review', 'disc:Torsion suspected')] }),
        "Torso Injury": P({ cannula: C.essential('16G', 'Trauma'),
            bedside: [BS.vbg('Lactate and Hb to guide resuscitation', 'if shocked or penetrating injury', 'disc:Stab/Gunshot|Chest Flail'), BS.ecg('Cardiac contusion', 'if blunt chest trauma')],
            bloods: [bl('Major Bleed Procedure', 'penetrating injury, flail chest or shocked', 'disc:Stab/Gunshot|Chest Flail')],
            pathways: [pw('Resus', 'penetrating injury or flail chest', 'disc:Stab/Gunshot|Chest Flail')] }),
        "Unwell Adult": P({ cannula: C.essential('18G', 'Sepsis?'),
            bedside: [bs('Blood cultures (2 sets)', 'Before antibiotics - part of the sepsis pathway', 'moderate or high sepsis risk (NICE NG253)', 'sepsis'), BS.vbg('Lactate - key marker of sepsis severity'), BS.urine, BS.bm('Hyper- or hypoglycaemia'), BS.ecg('Baseline')],
            bloods: [bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis'), bl('AE Collapse query cause', 'no clear infective source')],
            pathways: [pw('SDEC', 'stable, ambulatory - per local criteria'), pw('MAU', 'needs admission, stable - per local criteria')] }),
        "Unwell Child": P({ cannula: C.consider('22G', 'Sepsis?'),
            bedside: [BS.bm('Hypoglycaemia is common and reversible in unwell children'), BS.urine, BS.vbg('Lactate and glucose if sepsis suspected', 'sepsis suspected', 'disc:Sepsis Suspected')],
            bloods: [bl('AE - Sepsis (Paediatric)', 'sepsis suspected, or NICE fever traffic light amber/red', 'sepsis')],
            pathways: [] }),
        "Urinary Problems": P({ cannula: C.avoid('Oral fluids'),
            bedside: [BS.urine, BS.bladder('Confirm and quantify retention', 'if retention suspected or reduced output', 'disc:Retention'), bs('Urine sample for culture', 'Send before any antibiotics', 'if UTI suspected')],
            bloods: [bl('AE - Renal Colic', 'loin pain / suspected renal stone'), bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis')],
            pathways: [pw('Minors', 'dysuria only, well', 'disc:Dysuria')] }),
        "Worried Parent": P({ cannula: C.avoid('Reassurance'),
            bedside: [], bloods: [], pathways: [] }),
        "Wounds": P({ cannula: C.avoid('Suture / glue'),
            bedside: [bs('Neurovascular check', 'Nerve or vessel injury distal to the wound')],
            bloods: [bl('Major Bleed Procedure', 'uncontrolled bleeding', 'disc:Uncontrolled Bleeding'), bl('AE Abcess and Cellulitis', 'wound infection / cellulitis')],
            pathways: [pw('Minors', 'suture or glue', 'disc:Needs Suture|Graze/Glue')] }),
        "Suspected Stroke": P({ cannula: C.essential('18G', 'Thrombolysis pathway'),
            bedside: [BS.bm('Hypoglycaemia is a common, rapidly reversible stroke mimic - check immediately'), BS.ecg('AF as the cause; excludes MI'), BS.neuro('Serial assessment for deterioration')],
            bloods: [bl('AE - Stroke')],
            pathways: [pw('Stroke', 'stroke team / hyperacute stroke pathway', 'always')] }),
        "Suspected TIA": P({ cannula: C.consider('20G', 'If recurrent / high risk'),
            bedside: [BS.bm('Exclude hypoglycaemia'), BS.ecg('AF screen - guides anticoagulation')],
            bloods: [bl('AE - TIA')],
            pathways: [pw('TIA', 'TIA clinic per local pathway (resolved symptoms)'), pw('Stroke', 'ongoing or crescendo symptoms', 'disc:Ongoing/evolving focal deficit (possible stroke, not resolved)|Crescendo TIA (recurrent within 24h)')] }),
        "Suspected DVT / PE": P({ cannula: C.consider('20G', 'Anticoagulation / bloods'),
            bedside: [BS.ecg('Tachycardia or right heart strain'), BS.vbg('Lactate and pH if unwell', 'if breathless or hypoxic', 'disc:Severe respiratory distress|Pleuritic chest pain with hypoxia'), bs('Calf measurement', 'Record both calves 10 cm below the tibial tuberosity', 'if leg swelling', 'disc:Unilateral leg swelling/pain|Mild leg swelling, well, ambulatory')],
            bloods: [bl('AE DVT and PE')],
            pathways: [pw('EDAA', 'ambulatory DVT / low-risk PE pathway per local criteria'), pw('Resus', 'shocked', 'disc:Shock / haemodynamic collapse')] }),
        "Jaundice": P({ cannula: C.consider('20G', 'Fluids / antibiotics if cholangitis'),
            bedside: [BS.urine, BS.bm('Liver failure causes hypoglycaemia')],
            bloods: [bl('AE - Jaundice'), bl('AE - Sepsis', 'fever with jaundice (cholangitis)', 'disc:Fever with jaundice (cholangitis)')],
            pathways: [pw('SAU', 'fever or pain with jaundice (biliary cause)', 'disc:Fever with jaundice (cholangitis)|Severe abdominal pain with jaundice'), pw('SDEC', 'painless jaundice, well - per local pathway', 'disc:New onset jaundice|Pale stools / dark urine')] }),
        "Elderly Care / Off Legs": P({ cannula: C.consider('20G', 'Bloods / IV fluids'),
            bedside: [BS.urine, BS.bm('Hypo- or hyperglycaemia'), BS.lsbp('Postural hypotension'), BS.bladder('Retention can cause agitation and delirium'), BS.ecg('Arrhythmia or electrolyte disturbance'), bs('Pressure area check', 'Long lie or immobility')],
            bloods: [bl('AE Elderly Care'), bl('AE - Sepsis', 'infection with moderate or high sepsis risk (NICE NG253)', 'sepsis')],
            pathways: [pw('FSDEC', 'frail and stable - per local frailty criteria')] }),
        "Hypoglycaemia in Neonate / Child": P({ cannula: C.essential('22G/24G', 'IV dextrose'),
            bedside: [BS.bm('Confirm, then repeat after treatment'), BS.ketones('Ketotic vs non-ketotic hypoglycaemia')],
            bloods: [bl('AE - Neonatal and Childhood hypoglycaemia')],
            pathways: [pw('Resus', 'unresponsive or seizing', 'disc:Unresponsive / seizure')] })
    },

    // Placement / disposition options, grouped as shown in the dropdown (value -> label).
    // Pathway targets in `protocols` must be keys here. Direct-to-unit options depend on local criteria.
    placements: {
        'In the ED': {
            Resus: 'Resus', Majors: 'Majors cubicle', Minors: 'Minors / See & Treat', PaedsED: 'Paediatric ED',
            MH: 'Mental health assessment room', Escalation: 'Escalation area (overcrowding)',
            'Held on Ambulance': 'Held on ambulance (no capacity)', 'Waiting Room': 'Waiting room'
        },
        'Direct to unit / pathway': {
            EDAA: 'EDAA (ED ambulatory area)', SDEC: 'SDEC (same day emergency care)', FSDEC: 'FSDEC (frailty SDEC)',
            MAU: 'MAU (medical assessment unit)', SAU: 'SAU (surgical assessment unit)',
            EPU: 'Early pregnancy unit / maternity triage', Stroke: 'Stroke team / hyperacute stroke pathway',
            TIA: 'TIA clinic', Eye: 'Eye casualty / ophthalmology', UTC: 'Urgent treatment centre / primary care (streamed)'
        }
    }
};
