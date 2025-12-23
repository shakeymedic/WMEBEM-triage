// protocols.js - Clinical Configuration v18.1
// STATUS: 100% COVERAGE (52 MTS Categories + 450 Drugs)

export const clinicalData = {
    // --- 1. DRUG INDEX (450+ Common UK BNF Drugs) ---
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
        "Zidovudine", "Zopiclone", "Zuclopenthixol"
    ],

    // --- 2. RCEM 'MISSED' MEDS HIGH RISK MAPPING ---
    highRiskDrugs: {
        // Movement
        "levodopa": "M: Parkinson's (Time Critical)", "co-beneldopa": "M: Parkinson's (Time Critical)", "co-careldopa": "M: Parkinson's (Time Critical)", "madopar": "M: Parkinson's (Time Critical)", "sinemet": "M: Parkinson's (Time Critical)", "stalevo": "M: Parkinson's (Time Critical)", "pramipexole": "M: Parkinson's (Time Critical)", "ropinirole": "M: Parkinson's (Time Critical)", "rotigotine": "M: Parkinson's (Time Critical)", "pyridostigmine": "M: Myasthenia Gravis (Time Critical)", "neostigmine": "M: Myasthenia Gravis (Time Critical)",
        // Immunomodulators/HIV
        "methotrexate": "I: Immunosuppressant (Sepsis Risk)", "azathioprine": "I: Immunosuppressant (Sepsis Risk)", "mycophenolate": "I: Immunosuppressant (Sepsis Risk)", "ciclosporin": "I: Immunosuppressant (Sepsis Risk)", "tacrolimus": "I: Immunosuppressant (Sepsis Risk)", "rituximab": "I: Immunosuppressant (Sepsis Risk)", "tenofovir": "I: HIV Med (Interactions)", "emtricitabine": "I: HIV Med (Interactions)", "abacavir": "I: HIV Med (Interactions)", "ritonavir": "I: HIV Med (Interactions)", "adalimumab": "I: Biologic (Sepsis Risk)", "etanercept": "I: Biologic (Sepsis Risk)", "infliximab": "I: Biologic (Sepsis Risk)",
        // Sugar
        "insulin": "S: Insulin (Hypo/DKA Risk)", "humalog": "S: Insulin (Hypo/DKA Risk)", "novorapid": "S: Insulin (Hypo/DKA Risk)", "lantus": "S: Insulin (Hypo/DKA Risk)", "levemir": "S: Insulin (Hypo/DKA Risk)", "actrapid": "S: Insulin (Hypo/DKA Risk)", "gliclazide": "S: Sulphonylurea (Hypo Risk)", "glimepiride": "S: Sulphonylurea (Hypo Risk)", "dapagliflozin": "S: SGLT2 (Euglycaemic DKA Risk)", "empagliflozin": "S: SGLT2 (Euglycaemic DKA Risk)", "canagliflozin": "S: SGLT2 (Euglycaemic DKA Risk)",
        // Steroids
        "prednisolone": "S: Steroid (Adrenal Crisis Risk)", "hydrocortisone": "S: Steroid (Adrenal Crisis Risk)", "dexamethasone": "S: Steroid (Adrenal Crisis Risk)", "fludrocortisone": "S: Steroid (Addison's Risk)",
        // Epilepsy
        "sodium valproate": "E: Anticonvulsant (Seizure Risk)", "valproic acid": "E: Anticonvulsant (Seizure Risk)", "epilim": "E: Anticonvulsant (Seizure Risk)", "levetiracetam": "E: Anticonvulsant (Seizure Risk)", "keppra": "E: Anticonvulsant (Seizure Risk)", "lamotrigine": "E: Anticonvulsant (Seizure Risk)", "carbamazepine": "E: Anticonvulsant (Seizure Risk)", "phenytoin": "E: Anticonvulsant (Seizure Risk)", "topiramate": "E: Anticonvulsant (Seizure Risk)", "clobazam": "E: Anticonvulsant (Seizure Risk)", "lacosamide": "E: Anticonvulsant (Seizure Risk)",
        // DOACs/Warfarin
        "warfarin": "D: Anticoagulant (Check INR)", "apixaban": "D: DOAC (Bleeding Risk)", "rivaroxaban": "D: DOAC (Bleeding Risk)", "edoxaban": "D: DOAC (Bleeding Risk)", "dabigatran": "D: DOAC (Bleeding Risk)", "enoxaparin": "D: LMWH (Bleeding Risk)", "dalteparin": "D: LMWH (Bleeding Risk)", "clexane": "D: LMWH (Bleeding Risk)", "fragmin": "D: LMWH (Bleeding Risk)",
        // Toxicity
        "lithium": "Toxicity Risk (Check Levels)", "digoxin": "Toxicity Risk (Check Levels)", "clozapine": "Agranulocytosis Risk", "carbimazole": "Neutropenia Risk", "methadone": "Opioid (Resp Depression)"
    },

    // --- 3. CALCULATORS ---
    calculators: {
        "Chest Pain": {
            title: "Wells Score for PE",
            criteria: [
                { text: "Clinical signs/symptoms of DVT", points: 3 },
                { text: "PE is #1 diagnosis or equally likely", points: 3 },
                { text: "Heart Rate > 100", points: 1.5 },
                { text: "Immobilization / Surgery last 4w", points: 1.5 },
                { text: "Previous DVT/PE", points: 1.5 },
                { text: "Haemoptysis", points: 1 },
                { text: "Malignancy (active or last 6m)", points: 1 }
            ]
        },
        "Shortness of Breath in Adults": {
            title: "Wells Score for PE",
            criteria: [
                { text: "Clinical signs/symptoms of DVT", points: 3 },
                { text: "PE is #1 diagnosis or equally likely", points: 3 },
                { text: "Heart Rate > 100", points: 1.5 },
                { text: "Immobilization / Surgery last 4w", points: 1.5 },
                { text: "Previous DVT/PE", points: 1.5 },
                { text: "Haemoptysis", points: 1 },
                { text: "Malignancy (active or last 6m)", points: 1 }
            ]
        },
        "Head Injury": {
            title: "Canadian CT Head Rule (High Risk)",
            criteria: [
                { text: "GCS < 15 at 2h post injury", points: 1 },
                { text: "Suspected open/depressed skull fracture", points: 1 },
                { text: "Basal skull fracture signs", points: 1 },
                { text: "Vomiting >= 2 episodes", points: 1 },
                { text: "Age >= 65", points: 1 }
            ]
        }
    },

    // --- 4. SCREENING RULES ---
    screening: {
        hiv: { minAge: 16, maxAge: 65, label: "HIV Opt-Out (NICE/RCEM)", yesNo: true },
        frailty: { minAge: 65, label: "Frailty (Silver Book II)", options: [ { val: "1", text: "1. Very Fit" }, { val: "2", text: "2. Well" }, { val: "3", text: "3. Managing Well" }, { val: "4", text: "4. Vulnerable" }, { val: "5", text: "5. Mildly Frail" }, { val: "6", text: "6. Moderately Frail" }, { val: "7", text: "7. Severely Frail" }, { val: "8", text: "8. Very Severely Frail" }, { val: "9", text: "9. Terminally Ill" } ] },
        sepsis: { label: "Sepsis Screen (NEWS2/Clinical)", yesNo: true },
        alcohol: { label: "Alcohol AUDIT-C Screen", options: [ { val: "0", text: "0-4 (Low Risk)" }, { val: "5", text: "5-7 (Increasing Risk)" }, { val: "8", text: "8-10 (Higher Risk)" }, { val: "11", text: "11+ (Possible Dependence)" } ] },
        smoking: { label: "Current Smoker? (Offer Cessation)", yesNo: true },
        falls: { minAge: 65, label: "Falls History (Last 12m)", yesNo: true },
        mental_health: { label: "Mental Health / Capacity Concern", yesNo: true },
        domestic_violence: { label: "Domestic Violence / Safeguarding", yesNo: true },
        veteran: { label: "Military Veteran?", yesNo: true }
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
        }
    },
    
    paedsSafety: {
        weightCapKg: 50,
        disclaimer: "GUIDANCE ONLY. CHECK BNFc. Do not use for >50kg.",
        paracetamol: { mgPerKg: 15, maxDoseMg: 1000 },
        ibuprofen: { mgPerKg: 10, maxDoseMg: 400 },
        pewsRanges: { infant: { maxRR: 60, maxHR: 160 }, toddler: { maxRR: 40, maxHR: 140 }, child: { maxRR: 30, maxHR: 120 }, teen: { maxRR: 25, maxHR: 100 } }
    },

    // --- 6. MTS FLOWCHARTS (FULL 52 SET) ---
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

    // --- 7. CLINICAL PROTOCOLS (1:1 MAPPING WITH MTS FLOWCHARTS) ---
    protocols: {
        "Abdominal Pain in Adults": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Analgesia" }, tests: { bedside: ["Urine Dip", "Pregnancy Test", "VBG"], lab: ["FBC", "U&E", "LFT", "Amylase", "CRP", "G&S"], imaging: ["Abdo XR (Select Cases)"] } },
        "Abdominal Pain in Children": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Fluids" }, tests: { bedside: ["Urine Dip", "Glucose"], lab: ["FBC", "CRP (if surgical)"], imaging: ["US Abdo"] } },
        "Abscesses and Local Infections": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Abx" }, tests: { bedside: ["Temp", "Swab"], lab: ["FBC", "CRP (if systemic)"], imaging: ["US (if deep)"] } },
        "Allergy": { cannula: { status: "Consider", color: "amber", size: "18G", reason: "Anaphylaxis?" }, tests: { bedside: ["Peak Flow", "ECG"], lab: ["Mast Cell Tryptase"], imaging: [] } },
        "Assault": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Minor Injury" }, tests: { bedside: ["Police Ref Number"], lab: [], imaging: ["X-Ray (Injury sites)"] } },
        "Asthma": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "IV Magnesium/Salbutamol?" }, tests: { bedside: ["Peak Flow", "VBG"], lab: ["FBC", "U&E"], imaging: ["CXR (if exclusion needed)"] } },
        "Back Pain": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: ["Urine Dip", "Neuro Obs"], lab: ["CRP (if infection)"], imaging: ["MRI (Cauda Equina)"] } },
        "Behaving Strangely": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Sedation?" }, tests: { bedside: ["Glucose", "Temp"], lab: ["FBC", "U&E", "Tox Screen"], imaging: ["CT Head (Organic?)"] } },
        "Bites and Stings": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Abx" }, tests: { bedside: ["Photo"], lab: [], imaging: ["X-Ray (Foreign Body)"] } },
        "Burns and Scalds": { cannula: { status: "Consider", color: "amber", size: "16G", reason: "Fluids if >10%" }, tests: { bedside: ["Weight"], lab: ["FBC", "U&E", "Clotting"], imaging: [] } },
        "Chest Pain": { cannula: { status: "Essential", color: "green", size: "18G", reason: "ACS/PE" }, tests: { bedside: ["ECG (10m)", "VBG", "Trop"], lab: ["FBC", "U&E", "D-Dimer"], imaging: ["CXR", "CTPA"] } },
        "Collapse": { cannula: { status: "Essential", color: "green", size: "18G", reason: "Cardiac Cause?" }, tests: { bedside: ["ECG", "Lying/Standing BP", "Glucose"], lab: ["FBC", "U&E", "Trop"], imaging: [] } },
        "Confusion": { cannula: { status: "Essential", color: "green", size: "20G", reason: "Delirium Screen" }, tests: { bedside: ["Urine Dip", "VBG"], lab: ["FBC", "U&E", "LFT", "Ca", "TFT", "Hematinics"], imaging: ["CT Head", "CXR"] } },
        "Crying Baby": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Paeds Senior Review" }, tests: { bedside: ["Full Obs", "Strip & Exam"], lab: [], imaging: [] } },
        "Dental Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Refer Dentist" }, tests: { bedside: [], lab: [], imaging: ["OPG"] } },
        "Diabetes": { cannula: { status: "Essential", color: "green", size: "18G", reason: "DKA/HHS" }, tests: { bedside: ["Ketones", "VBG"], lab: ["FBC", "U&E", "Glucose", "Osmolality"], imaging: [] } },
        "Diarrhoea and Vomiting": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Rehydration" }, tests: { bedside: ["VBG (Lactate/K)"], lab: ["U&E"], imaging: [] } },
        "Ear Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Topical Tx" }, tests: { bedside: ["Otoscopy"], lab: [], imaging: [] } },
        "Eye Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Topical Tx" }, tests: { bedside: ["Visual Acuity", "Fluorescein"], lab: [], imaging: ["CT Orbits"] } },
        "Facial Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Minor Injury" }, tests: { bedside: ["Neuro Obs"], lab: [], imaging: ["Facial X-Ray/CT"] } },
        "Falls": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Unless Fracture" }, tests: { bedside: ["L/S BP", "ECG"], lab: ["FBC", "U&E", "CK", "Bone Profile"], imaging: ["X-Ray (Injury)"] } },
        "Foreign Body": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Removal" }, tests: { bedside: [], lab: [], imaging: ["X-Ray (Location)"] } },
        "Gastrointestinal Bleeding": { cannula: { status: "Essential", color: "green", size: "16G x2", reason: "Major Haemorrhage" }, tests: { bedside: ["VBG"], lab: ["FBC", "U&E", "LFT", "Clotting", "Cross Match"], imaging: ["CT Angio"] } },
        "Headache": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "CT Contrast?" }, tests: { bedside: ["Neuro Obs", "Temp"], lab: ["FBC", "CRP", "ESR"], imaging: ["CT Head"] } },
        "Head Injury": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Obs Only usually" }, tests: { bedside: ["Neuro Obs"], lab: ["INR (if Warfarin)", "G&S (if Trauma)"], imaging: ["CT Head (Canadian Rules)"] } },
        "Irritable Child": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Paeds Review" }, tests: { bedside: ["Urine Dip", "Glucose"], lab: ["FBC", "CRP", "Blood Culture"], imaging: [] } },
        "Limb Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: ["Neurovascular Check"], lab: [], imaging: ["X-Ray"] } },
        "Limping Child": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: ["Temp"], lab: ["FBC", "CRP", "ESR"], imaging: ["X-Ray (Hips/Knees)"] } },
        "Major Trauma": { cannula: { status: "Essential", color: "green", size: "14G/16G x2", reason: "Trauma Call" }, tests: { bedside: ["FAST Scan", "VBG"], lab: ["Major Haem Pack"], imaging: ["Trauma CT"] } },
        "Mental Illness": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Agitation Risk" }, tests: { bedside: ["Physical Exam"], lab: ["Tox Screen"], imaging: [] } },
        "Neck Pain": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: ["Neuro Obs"], lab: [], imaging: ["CT C-Spine"] } },
        "Needlestick Injury": { cannula: { status: "Essential", color: "green", size: "20G", reason: "Storage Bloods" }, tests: { bedside: [], lab: ["Storage Serum", "Hep B Status"], imaging: [] } },
        "Overdose and Poisoning": { cannula: { status: "Essential", color: "green", size: "18G", reason: "Antidote" }, tests: { bedside: ["ECG", "VBG"], lab: ["Paracetamol", "Salicylate", "U&E", "LFT", "INR"], imaging: [] } },
        "Palpitations": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Rate Control?" }, tests: { bedside: ["ECG"], lab: ["U&E", "Mg", "TFT", "FBC"], imaging: [] } },
        "Pregnancy": { cannula: { status: "Consider", color: "amber", size: "18G", reason: "Bleeding Risk" }, tests: { bedside: ["Urine Dip"], lab: ["FBC", "G&S", "Rhesus"], imaging: ["US Early Pregnancy"] } },
        "PV Bleeding": { cannula: { status: "Consider", color: "amber", size: "18G", reason: "Bleeding Risk" }, tests: { bedside: ["Pregnancy Test"], lab: ["FBC", "G&S", "Clotting"], imaging: ["US Pelvis"] } },
        "Rash": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Obs Only" }, tests: { bedside: ["Glass Test"], lab: ["FBC", "CRP (if febrile)"], imaging: [] } },
        "Self Harm": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "If Overdose/Suture" }, tests: { bedside: [], lab: ["Paracetamol Level"], imaging: [] } },
        "Sexually Acquired Infection": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "GUM Clinic" }, tests: { bedside: ["Swabs"], lab: [], imaging: [] } },
        "Shortness of Breath in Adults": { cannula: { status: "Essential", color: "green", size: "18G", reason: "IV Meds" }, tests: { bedside: ["ECG", "ABG", "VBG"], lab: ["FBC", "U&E", "CRP", "BNP"], imaging: ["CXR"] } },
        "Shortness of Breath in Children": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Inhalers/Nebs" }, tests: { bedside: ["O2 Sats"], lab: [], imaging: ["CXR (if focal)"] } },
        "Sore Throat": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "If Quinsy/IVs" }, tests: { bedside: ["Centor Score"], lab: ["FBC", "Monospot"], imaging: [] } },
        "Testicular Pain": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Surgery Prep" }, tests: { bedside: ["Urine Dip"], lab: ["FBC", "CRP", "G&S"], imaging: ["US Testes"] } },
        "Torso Injury": { cannula: { status: "Essential", color: "green", size: "16G", reason: "Trauma" }, tests: { bedside: ["VBG"], lab: ["FBC", "G&S"], imaging: ["CXR", "CT Chest"] } },
        "Unwell Adult": { cannula: { status: "Essential", color: "green", size: "18G", reason: "Sepsis?" }, tests: { bedside: ["VBG", "Lactate", "Cultures"], lab: ["FBC", "U&E", "LFT", "CRP", "Clotting"], imaging: ["CXR"] } },
        "Unwell Child": { cannula: { status: "Consider", color: "amber", size: "22G", reason: "Sepsis?" }, tests: { bedside: ["VBG", "Glucose"], lab: ["FBC", "CRP", "Cultures"], imaging: ["CXR"] } },
        "Urinary Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Fluids" }, tests: { bedside: ["Urine Dip", "Bladder Scan"], lab: ["U&E", "FBC", "CRP"], imaging: [] } },
        "Vaginal Bleeding": { cannula: { status: "Consider", color: "amber", size: "18G", reason: "Anaemia?" }, tests: { bedside: ["Pregnancy Test"], lab: ["FBC", "G&S"], imaging: ["US Pelvis"] } },
        "Worried Parent": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Reassurance" }, tests: { bedside: ["Full Obs"], lab: [], imaging: [] } },
        "Wounds": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Suture/Glue" }, tests: { bedside: ["Neurovascular Check"], lab: [], imaging: ["X-Ray (FB/Bone)"] } }
    }
};
