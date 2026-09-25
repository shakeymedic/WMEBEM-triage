// protocols.js - Clinical configuration (v20.0)
// STATUS: NOT CLINICALLY SIGNED OFF. The flowcharts below are a paraphrase of Manchester Triage
// System presentations, not the licensed MTS content, and must be reviewed line by line against the
// trust's licensed MTS edition by a named clinical lead before live use. Guideline-derived rules
// (NEWS2, NICE NG253 / NG232 / NG143, ROSIER, 4AT) live in clinical.js with unit tests.

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

    // --- 3. CALCULATORS (DYNAMIC) ---
    // `interpret` gives a plain-language read-out per score band (max-inclusive, first match wins).
    // `reference` is a short citation shown behind the calculator's ℹ️ info popover.
    calculators: {
        "Chest Pain": {
            title: "Wells Score for PE",
            reference: "Wells PS et al, 2000/2001 - two-tier clinical probability score for suspected PE.",
            criteria: [
                { text: "Clinical signs/symptoms of DVT", points: 3 },
                { text: "PE is #1 diagnosis or equally likely", points: 3 },
                { text: "Heart Rate > 100", points: 1.5 },
                { text: "Immobilization / Surgery last 4w", points: 1.5 },
                { text: "Previous DVT/PE", points: 1.5 },
                { text: "Haemoptysis", points: 1 },
                { text: "Malignancy (active or last 6m)", points: 1 }
            ],
            interpret: [
                { max: 4, text: "≤4: PE unlikely - consider D-dimer" },
                { max: 999, text: ">4: PE likely - consider CTPA" }
            ]
        },
        "Shortness of Breath in Adults": {
            title: "Wells Score for PE",
            reference: "Wells PS et al, 2000/2001 - two-tier clinical probability score for suspected PE.",
            criteria: [
                { text: "Clinical signs/symptoms of DVT", points: 3 },
                { text: "PE is #1 diagnosis or equally likely", points: 3 },
                { text: "Heart Rate > 100", points: 1.5 },
                { text: "Immobilization / Surgery last 4w", points: 1.5 },
                { text: "Previous DVT/PE", points: 1.5 },
                { text: "Haemoptysis", points: 1 },
                { text: "Malignancy (active or last 6m)", points: 1 }
            ],
            interpret: [
                { max: 4, text: "≤4: PE unlikely - consider D-dimer" },
                { max: 999, text: ">4: PE likely - consider CTPA" }
            ]
        }
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

    // --- 7. CLINICAL PROTOCOLS (1:1 MAPPING WITH MTS FLOWCHARTS) ---
    // Each test carries a short clinical rationale (`why`) so the recommendation is explained, not just listed.
    // --- 7b. NAMED ED BLOOD PROFILES (matches trust ICE ordering system order-sets) ---
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

    protocols: {
        "Abdominal Pain in Adults": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Analgesia" }, tests: { bedside: [{ name: "Urine Dip", why: "Exclude UTI/renal pathology, check for haematuria/ketones" }, { name: "Pregnancy Test", why: "Mandatory in reproductive-age females - exclude ectopic" }, { name: "VBG", why: "Lactate for ischaemia/sepsis, quick K+/glucose" }], labProfile: "AE Abdominal Pain", labExtra: [{ name: "Troponin I", why: "Consider if epigastric pain with cardiac risk factors" }] } },
        "Abdominal Pain in Children": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Fluids" }, tests: { bedside: [{ name: "Urine Dip", why: "Exclude UTI - common cause of paediatric abdo pain" }, { name: "Glucose", why: "Exclude DKA as cause of abdo pain" }], lab: [{ name: "FBC", why: "Infection/inflammation screen" }, { name: "CRP (if surgical)", why: "Raised in appendicitis/surgical causes" }] } },
        "Abscesses and Local Infections": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Abx" }, tests: { bedside: [{ name: "Temp", why: "Screen for systemic sepsis response" }, { name: "Swab", why: "Guide antibiotic choice if incision & drainage performed" }], labProfile: "AE Abcess and Cellulitis" } },
        "Allergy": { cannula: { status: "Consider", color: "amber", size: "18G", reason: "Anaphylaxis?" }, tests: { bedside: [{ name: "Peak Flow", why: "Assess bronchospasm severity if wheeze present" }, { name: "ECG", why: "Baseline before adrenaline/antihistamines, exclude cardiac cause" }], labProfile: "AE Anaphylaxis" } },
        "Assault": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Minor Injury" }, tests: { bedside: [{ name: "Police Ref Number", why: "Required for information sharing/safeguarding documentation" }, { name: "Photograph Injuries (consent)", why: "Forensic/legal documentation" }], lab: [] } },
        "Asthma": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "IV Magnesium/Salbutamol?" }, tests: { bedside: [{ name: "Peak Flow", why: "Objective severity marker - compare to personal best/predicted" }, { name: "VBG", why: "CO2 retention suggests life-threatening asthma" }], lab: [{ name: "FBC", why: "Baseline, exclude infective trigger" }, { name: "U&E", why: "Salbutamol causes hypokalaemia - monitor if repeated nebs/IV" }] } },
        "Back Pain": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: [{ name: "Urine Dip", why: "Screen for renal colic/pyelonephritis as cause" }, { name: "Neuro Obs", why: "Detect evolving cauda equina/cord compression" }, { name: "Bladder Scan", why: "Post-void residual >100-150mL is a red flag for cauda equina" }], labProfile: "AE Back Pain" } },
        "Behaving Strangely": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Sedation?" }, tests: { bedside: [{ name: "Glucose", why: "Hypoglycaemia is a reversible cause of altered behaviour" }, { name: "Temp", why: "Sepsis/encephalitis can present as behavioural change" }], lab: [{ name: "FBC", why: "Infection screen" }, { name: "U&E", why: "Electrolyte derangement causing delirium" }, { name: "Tox Screen", why: "Screen for intoxication/recreational drug causes" }] } },
        "Bites and Stings": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Abx" }, tests: { bedside: [{ name: "Photo", why: "Document wound for monitoring progression/legal record" }], lab: [{ name: "FBC/CRP (if systemic signs)", why: "Screen for systemic envenomation/infection response" }] } },
        "Burns and Scalds": { cannula: { status: "Consider", color: "amber", size: "16G", reason: "Fluids if >10%" }, tests: { bedside: [{ name: "Weight", why: "Required to calculate Parkland fluid formula" }], lab: [{ name: "FBC", why: "Baseline Hb, may need transfusion in large burns" }, { name: "U&E", why: "Guide fluid resuscitation, exclude AKI" }, { name: "Clotting", why: "Baseline before theatre/major burns care" }] } },
        "Chest Pain": { cannula: { status: "Essential", color: "green", size: "18G", reason: "ACS/PE" }, tests: { bedside: [{ name: "ECG (10m)", why: "Identify STEMI/arrhythmia within 10 minutes per ACS pathway" }, { name: "VBG", why: "Rapid lactate/pH, quick K+ if arrhythmia" }, { name: "Trop", why: "Biomarker for myocardial injury - repeat per local ACS protocol" }], labProfile: "AE Acute Coronary Syndrome", labExtra: [{ name: "Amylase", why: "Exclude pancreatitis if associated abdominal pain" }] } },
        "Collapse": { cannula: { status: "Essential", color: "green", size: "18G", reason: "Cardiac Cause?" }, tests: { bedside: [{ name: "ECG", why: "Screen for arrhythmia/long QT/Brugada as cause" }, { name: "Lying/Standing BP", why: "Diagnose orthostatic hypotension" }, { name: "Glucose", why: "Exclude hypoglycaemia as cause" }], labProfile: "AE Collapse query cause" } },
        "Confusion": { cannula: { status: "Essential", color: "green", size: "20G", reason: "Delirium Screen" }, tests: { bedside: [{ name: "Urine Dip", why: "UTI is a common reversible cause of delirium in elderly" }, { name: "VBG", why: "Quick glucose/lactate/electrolytes" }], lab: [{ name: "FBC", why: "Infection screen" }, { name: "U&E", why: "Hyponatraemia/uraemia causing confusion" }, { name: "LFT", why: "Hepatic encephalopathy screen" }, { name: "Ca", why: "Hypercalcaemia causes confusion" }, { name: "TFT", why: "Thyroid dysfunction as reversible cause" }, { name: "Hematinics", why: "B12/folate deficiency - reversible cause of confusion" }] } },
        "Crying Baby": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Paeds Senior Review" }, tests: { bedside: [{ name: "Full Obs", why: "Vital signs to screen for sepsis/serious illness" }, { name: "Strip & Exam", why: "Fully undress to look for occult injury, hernia, hair tourniquet" }, { name: "Urine Dip", why: "UTI is a common occult cause of unexplained crying/fever in infants" }], lab: [] } },
        "Dental Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Refer Dentist" }, tests: { bedside: [], lab: [] } },
        "Diabetes": { cannula: { status: "Essential", color: "green", size: "18G", reason: "DKA/HHS" }, tests: { bedside: [{ name: "Ketones", why: "Confirms DKA if raised alongside hyperglycaemia/acidosis" }, { name: "VBG", why: "pH/bicarbonate to grade DKA severity and guide fluid/insulin protocol" }, { name: "Urine Dip", why: "UTI is a common precipitant of DKA/HHS - screen for infective trigger" }], labProfile: "AE - Hypoglycaemia - Hyperglycaemia" } },
        "Diarrhoea and Vomiting": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Rehydration" }, tests: { bedside: [{ name: "VBG (Lactate/K)", why: "Assess dehydration severity and electrolyte loss" }], labProfile: "AE Diarrhoea and Vomiting" } },
        "Ear Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Topical Tx" }, tests: { bedside: [{ name: "Otoscopy", why: "Direct visualisation of tympanic membrane/canal to confirm diagnosis" }], lab: [] } },
        "Eye Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Topical Tx" }, tests: { bedside: [{ name: "Visual Acuity", why: "Baseline and severity marker - essential in every eye complaint" }, { name: "Fluorescein", why: "Identify corneal abrasion/ulcer/foreign body under blue light" }], lab: [] } },
        "Fits and Seizures": { cannula: { status: "Essential", color: "green", size: "18G", reason: "IV Anticonvulsant/Glucose" }, tests: { bedside: [{ name: "Glucose", why: "Hypoglycaemia is a rapidly reversible cause/mimic of seizure" }, { name: "ECG", why: "Exclude cardiac syncope/long QT masquerading as seizure" }, { name: "AED Levels (if known epilepsy)", why: "Sub-therapeutic levels suggest non-adherence as trigger" }], labProfile: "AE First Fit" } },
        "Facial Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Minor Injury" }, tests: { bedside: [{ name: "Neuro Obs", why: "Screen for associated head injury/cranial nerve deficit" }], labProfile: "AE Epistaxis" } },
        "Falls": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Unless Fracture" }, tests: { bedside: [{ name: "L/S BP", why: "Identify orthostatic hypotension as cause" }, { name: "ECG", why: "Screen for arrhythmia as cause of fall" }, { name: "Urine Dip", why: "UTI is a common precipitant of falls, especially in older adults" }], labProfile: "AE Fractured Neck of Femur" } },
        "Foreign Body": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Removal" }, tests: { bedside: [], lab: [] } },
        "Gastrointestinal Bleeding": { cannula: { status: "Essential", color: "green", size: "16G x2", reason: "Major Haemorrhage" }, tests: { bedside: [{ name: "VBG", why: "Rapid Hb/lactate while lab bloods pending" }], labProfile: "AE GI Bleed" } },
        "Headache": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "CT Contrast?" }, tests: { bedside: [{ name: "Neuro Obs", why: "Detect evolving focal deficit/reduced GCS" }, { name: "Temp", why: "Fever raises suspicion of meningitis/encephalitis" }], labProfile: "AE - Headache - Temporal Arteritis" } },
        "Head Injury": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Obs Only usually" }, tests: { bedside: [{ name: "Neuro Obs", why: "Serial GCS/pupils to detect deterioration" }], lab: [{ name: "AE Head Injury on Warfarin (if anticoagulated)", why: "Use this ED profile instead of individual tests - includes INR/clotting to guide urgent reversal if intracranial bleed" }, { name: "G&S (if Trauma)", why: "In case of associated injury requiring transfusion" }] } },
        "Irritable Child": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Paeds Review" }, tests: { bedside: [{ name: "Urine Dip", why: "UTI is a common cause of irritability/fever in young children" }, { name: "Glucose", why: "Exclude hypoglycaemia" }], labProfile: "AE - Sepsis (Paediatric)" } },
        "Limb Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: [{ name: "Neurovascular Check", why: "Essential to exclude compartment syndrome/vascular compromise" }], labProfile: "AE - Inflamed - Infected Joint" } },
        "Limping Child": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: [{ name: "Temp", why: "Fever raises concern for septic arthritis/osteomyelitis" }], lab: [{ name: "FBC", why: "Raised WCC supports septic arthritis" }, { name: "CRP", why: "Kocher criteria component - risk-stratify septic arthritis" }, { name: "ESR", why: "Kocher criteria component alongside CRP" }] } },
        "Major Trauma": { cannula: { status: "Essential", color: "green", size: "14G/16G x2", reason: "Trauma Call" }, tests: { bedside: [{ name: "FAST Scan", why: "Rapid detection of free intraperitoneal/pericardial fluid" }, { name: "VBG", why: "Rapid lactate/Hb/base excess to guide resuscitation" }], labProfile: "Major Bleed Procedure" } },
        "Mental Illness": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Agitation Risk" }, tests: { bedside: [{ name: "Physical Exam", why: "Exclude organic cause masquerading as psychiatric presentation" }], lab: [{ name: "Tox Screen", why: "Screen for substance-induced presentation" }] } },
        "Neck Pain": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: [{ name: "Neuro Obs", why: "Detect evolving myelopathy/radiculopathy" }], lab: [] } },
        "Needlestick Injury": { cannula: { status: "Essential", color: "green", size: "20G", reason: "Storage Bloods" }, tests: { bedside: [], lab: [{ name: "Storage Serum", why: "Baseline sample held for reference if seroconversion occurs" }, { name: "Hep B Status", why: "Determine need for booster/immunoglobulin per exposure protocol" }, { name: "Source Bloods (if consented)", why: "Guide need for PEP based on source HIV/Hep B/Hep C status" }] } },
        "Overdose and Poisoning": { cannula: { status: "Essential", color: "green", size: "18G", reason: "Antidote" }, tests: { bedside: [{ name: "ECG", why: "QT/QRS prolongation guides risk with many overdoses (e.g. TCAs)" }, { name: "VBG", why: "Rapid pH/lactate - metabolic acidosis in salicylate/methanol etc." }, { name: "Urine Dip", why: "Screens for myoglobinuria (blood on dip, no RBCs on micro) if prolonged immobility/rhabdomyolysis risk" }], labProfile: "AE DSH Overdose" } },
        "Palpitations": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Rate Control?" }, tests: { bedside: [{ name: "ECG", why: "Capture rhythm during/after symptoms - essential first test" }], lab: [{ name: "U&E", why: "Electrolyte derangement (K+/Mg) precipitating arrhythmia" }, { name: "Mg", why: "Hypomagnesaemia predisposes to arrhythmia" }, { name: "TFT", why: "Thyrotoxicosis is a reversible cause of palpitations/AF" }, { name: "FBC", why: "Anaemia as a cause of palpitations" }] } },
        "Pregnancy": { cannula: { status: "Consider", color: "amber", size: "18G", reason: "Bleeding Risk" }, tests: { bedside: [{ name: "Urine Dip", why: "Screen for proteinuria/infection - relevant to pre-eclampsia and UTI" }], labProfile: "AE - PV Bleed - Pregnant" } },
        "PV Bleeding": { cannula: { status: "Consider", color: "amber", size: "18G", reason: "Bleeding Risk/Anaemia" }, tests: { bedside: [{ name: "Pregnancy Test", why: "Essential to exclude ectopic/miscarriage as cause - if positive, use the AE - PV Bleed - Pregnant profile instead" }], lab: [{ name: "FBC", why: "Baseline Hb" }, { name: "G&S", why: "In case of significant blood loss" }, { name: "Clotting Screen", why: "Exclude coagulopathy if heavy bleeding" }] } },
        "Apparently Drunk": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Hypoglycaemia/Withdrawal" }, tests: { bedside: [{ name: "Glucose", why: "Hypoglycaemia is a common, rapidly reversible mimic of intoxication - must exclude" }, { name: "Neuro Obs/GCS", why: "Distinguishes simple intoxication from head injury or other CNS pathology" }], lab: [{ name: "FBC", why: "Screen for chronic alcohol-related anaemia/infection" }, { name: "U&E", why: "Electrolyte derangement common in chronic alcohol excess" }, { name: "LFT", why: "Assess for alcohol-related liver disease" }, { name: "Alcohol Level", why: "Quantifies exposure - treat the clinical picture, not the level alone" }] } },
        "Rash": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Obs Only" }, tests: { bedside: [{ name: "Glass Test", why: "Non-blanching rash under pressure raises concern for meningococcal sepsis" }], lab: [{ name: "FBC", why: "Screen for infective/haematological cause" }, { name: "CRP (if febrile)", why: "Marker of infective/inflammatory severity" }] } },
        "Self Harm": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "If Overdose/Suture" }, tests: { bedside: [], labProfile: "AE DSH Overdose", labExtra: [{ name: "G&S", why: "Add if bleeding from lacerations/self-injury" }] } },
        "Sexually Acquired Infection": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "GUM Clinic" }, tests: { bedside: [{ name: "Swabs", why: "Identify causative organism to guide targeted treatment" }], lab: [{ name: "HIV/Syphilis Serology (if high-risk exposure)", why: "Opportunistic screening per NICE/BASHH guidance" }] } },
        "Shortness of Breath in Adults": { cannula: { status: "Essential", color: "green", size: "18G", reason: "IV Meds" }, tests: { bedside: [{ name: "ECG", why: "Screen for cardiac cause/right heart strain suggesting PE" }, { name: "ABG", why: "Quantify hypoxia/hypercapnia and acid-base status" }, { name: "VBG", why: "Rapid lactate if ABG not tolerated/available" }], labProfile: "AE - SOB", labExtra: [{ name: "Troponin I", why: "Consider if associated chest pain/cardiac features" }] } },
        "Shortness of Breath in Children": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Inhalers/Nebs" }, tests: { bedside: [{ name: "O2 Sats", why: "Objective severity marker, guides oxygen therapy" }], lab: [] } },
        "Sore Throat": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "If Quinsy/IVs" }, tests: { bedside: [{ name: "Centor Score", why: "Risk-stratifies likelihood of bacterial (streptococcal) tonsillitis" }], lab: [{ name: "FBC", why: "Marker of bacterial vs viral aetiology" }, { name: "Monospot", why: "Screen for glandular fever/EBV in prolonged or atypical presentation" }] } },
        "Testicular Pain": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Surgery Prep" }, tests: { bedside: [{ name: "Urine Dip", why: "Screen for epididymo-orchitis as alternative cause" }], lab: [{ name: "FBC", why: "Infection/inflammation screen" }, { name: "CRP", why: "Supports epididymo-orchitis vs torsion" }, { name: "G&S", why: "In case surgical exploration required" }] } },
        "Torso Injury": { cannula: { status: "Essential", color: "green", size: "16G", reason: "Trauma" }, tests: { bedside: [{ name: "VBG", why: "Rapid lactate/Hb to guide resuscitation" }], lab: [{ name: "FBC", why: "Baseline Hb, screen for occult haemorrhage" }, { name: "G&S", why: "In case of transfusion requirement" }] } },
        "Unwell Adult": { cannula: { status: "Essential", color: "green", size: "18G", reason: "Sepsis?" }, tests: { bedside: [{ name: "VBG", why: "Rapid lactate - key marker of sepsis severity" }, { name: "Lactate", why: "Prognostic marker, part of Sepsis Six" }, { name: "Cultures", why: "Identify causative organism before antibiotics - part of Sepsis Six" }], labProfile: "AE - Sepsis" } },
        "Unwell Child": { cannula: { status: "Consider", color: "amber", size: "22G", reason: "Sepsis?" }, tests: { bedside: [{ name: "VBG", why: "Rapid lactate/glucose - key in paediatric sepsis assessment" }, { name: "Glucose", why: "Hypoglycaemia common and reversible in unwell children" }], labProfile: "AE - Sepsis (Paediatric)" } },
        "Urinary Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Fluids" }, tests: { bedside: [{ name: "Urine Dip", why: "First-line to detect nitrites/leucocytes/blood/protein" }, { name: "Bladder Scan", why: "Confirm/quantify retention, guide catheterisation" }], labProfile: "AE - Renal Colic" } },
        "Worried Parent": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Reassurance" }, tests: { bedside: [{ name: "Full Obs", why: "Objective reassurance that child is physiologically well" }], lab: [] } },
        "Wounds": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Suture/Glue" }, tests: { bedside: [{ name: "Neurovascular Check", why: "Exclude nerve/vessel injury deep to wound" }], lab: [] } },
        "Suspected Stroke": { cannula: { status: "Essential", color: "green", size: "18G", reason: "Thrombolysis Pathway" }, tests: { bedside: [{ name: "Glucose", why: "Hypoglycaemia is a common, rapidly reversible stroke mimic - must exclude immediately" }, { name: "ECG", why: "AF is a common cause of embolic stroke and also excludes MI as a cause of collapse" }, { name: "Neuro Obs/GCS", why: "Serial assessment to detect deterioration/haemorrhagic transformation" }], labProfile: "AE - Stroke" } },
        "Suspected TIA": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "If Recurrent/High Risk" }, tests: { bedside: [{ name: "Glucose", why: "Exclude hypoglycaemia as cause of transient symptoms" }, { name: "ECG", why: "AF screen - guides anticoagulation decision" }], labProfile: "AE - TIA" } },
        "Suspected DVT / PE": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Anticoagulation" }, tests: { bedside: [{ name: "O2 Sats", why: "Hypoxia raises concern for PE" }, { name: "VBG", why: "Rapid lactate/pO2 if breathless or hypoxic" }, { name: "ECG", why: "Sinus tachycardia/right heart strain supports PE" }], labProfile: "AE DVT and PE" } },
        "Jaundice": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Fluids/Antibiotics if Cholangitis" }, tests: { bedside: [{ name: "Urine Dip", why: "Bilirubinuria supports an obstructive cause" }, { name: "Temp", why: "Fever with jaundice raises concern for ascending cholangitis" }], labProfile: "AE - Jaundice" } },
        "Elderly Care / Off Legs": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Bloods/IV Fluids" }, tests: { bedside: [{ name: "Urine Dip", why: "UTI is a common occult cause of off-legs/delirium in older adults" }, { name: "Glucose", why: "Exclude hypo/hyperglycaemia as a contributing cause" }, { name: "Lying/Standing BP", why: "Orthostatic hypotension as a cause of falls/off legs" }, { name: "Bladder Scan", why: "Urinary retention as a cause of agitation/delirium" }], labProfile: "AE Elderly Care" } },
        "Hypoglycaemia in Neonate / Child": { cannula: { status: "Essential", color: "green", size: "22G/24G", reason: "IV Dextrose" }, tests: { bedside: [{ name: "Glucose (Bedside BM)", why: "Confirm hypoglycaemia - repeat after correction" }, { name: "Ketones", why: "Ketotic vs non-ketotic hypoglycaemia narrows the differential" }, { name: "Temp", why: "Sepsis is a common precipitant of neonatal/childhood hypoglycaemia" }], labProfile: "AE - Neonatal and Childhood hypoglycaemia" } }
    }
};
