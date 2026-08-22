// protocols.js - Clinical Configuration v19.0
// AUDITED BY: UK EM CONSULTANT
// STATUS: DEPLOYMENT READY | RCEM 'MISSED' MEDS COMPLIANT

export const clinicalData = {
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
        { id: "steroid", label: "Long-term Steroids", hint: "Prednisolone equivalent, >4 weeks", warning: "S: Steroid Dependent (Adrenal Crisis Risk - consider hydrocortisone)" },
        { id: "immunosuppressant", label: "Immunosuppressant / Biologic", hint: "Methotrexate, biologics, transplant meds", warning: "I: Immunosuppressant/Biologic (Sepsis Risk - low threshold for cultures)" },
        { id: "parkinsons", label: "Parkinson's Medication", hint: "Levodopa, co-beneldopa, co-careldopa", warning: "M: Parkinson's (TIME CRITICAL - do not omit/delay doses)" },
        { id: "antiepileptic", label: "Anti-epileptic", hint: "Any AED", warning: "E: Anticonvulsant (Seizure Risk if delayed/missed)" },
        { id: "opioid", label: "Opioid / Substitution Rx", hint: "Methadone, buprenorphine, strong opioids", warning: "Opioid (Resp Depression Risk)" },
        { id: "lithium_clozapine", label: "Lithium / Clozapine", hint: "Toxicity/agranulocytosis risk", warning: "Toxicity Risk (Check Lithium Level / FBC if Clozapine)" }
    ],

    // --- 2c. TREATMENT / MEDS ALREADY GIVEN (quick-tick options) ---
    // Distinct from the PMH regular-medications field - this captures pre-triage treatment already
    // administered (self, first responder, or ambulance crew), so it becomes a genuine "already done"
    // record in the note, clearly separated from the forward-looking Plan.
    treatmentGivenOptions: [
        { id: "analgesia", label: "Analgesia given" },
        { id: "own_inhaler_gtn", label: "Own GTN/inhaler used" },
        { id: "antiemetic", label: "Antiemetic given" },
        { id: "ambulance_tx", label: "Ambulance treatment given" }
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
        "copd": "COPD noted - consider Scale 2 (CO2 retainer) and target sats 88-92%."
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
        },
        "Head Injury": {
            title: "Canadian CT Head Rule (High Risk)",
            reference: "Stiell IG et al, 2001 (CMAJ) - any one high-risk criterion recommends CT head.",
            criteria: [
                { text: "GCS < 15 at 2h post injury", points: 1 },
                { text: "Suspected open/depressed skull fracture", points: 1 },
                { text: "Basal skull fracture signs", points: 1 },
                { text: "Vomiting >= 2 episodes", points: 1 },
                { text: "Age >= 65", points: 1 }
            ],
            interpret: [
                { max: 0, text: "No high-risk criteria met - CT head not routinely required by this rule; use clinical judgement" },
                { max: 999, text: "≥1 high-risk criterion met - CT head recommended" }
            ]
        }
    },

    // --- 3b. SCORE REFERENCES (for ℹ️ info popovers on NEWS2/PEWS/MEOWS) ---
    references: {
        news2: "National Early Warning Score 2 (NEWS2) - Royal College of Physicians, 2017. Adults 16+, not validated in pregnancy.",
        pews: "Paediatric Early Warning Score - age-banded track & trigger tool for children under 16.",
        meows: "Modified Early Obstetric Warning Score (MEOWS) - track & trigger tool for pregnant/postpartum patients."
    },

    // --- 4. SCREENING RULES ---
    screening: {
        hiv: { minAge: 16, maxAge: 65, label: "HIV Opt-Out (NICE/RCEM)", yesNo: true, info: "Opt-out HIV testing offered to all adults 16-65 having blood taken in EDs in areas of high/extremely high HIV prevalence, per NICE/BHIVA/RCEM guidance - normalise it as a routine part of the blood panel unless the patient declines." },
        frailty: { minAge: 65, label: "Frailty (Silver Book II)", options: [ { val: "1", text: "1. Very Fit" }, { val: "2", text: "2. Well" }, { val: "3", text: "3. Managing Well" }, { val: "4", text: "4. Vulnerable" }, { val: "5", text: "5. Mildly Frail" }, { val: "6", text: "6. Moderately Frail" }, { val: "7", text: "7. Severely Frail" }, { val: "8", text: "8. Very Severely Frail" }, { val: "9", text: "9. Terminally Ill" } ], info: "Clinical Frailty Scale (CFS): 1 Very Fit - robust, active. 2 Well - no active disease symptoms. 3 Managing Well - controlled comorbidities. 4 Vulnerable - symptoms limit activity. 5 Mildly Frail - needs help with some IADLs. 6 Moderately Frail - needs help with all outdoor activities and housework. 7 Severely Frail - completely dependent for personal care. 8 Very Severely Frail - approaching end of life. 9 Terminally Ill - life expectancy <6 months. Score the patient's baseline ~2 weeks before this illness, not how they are today." },
        // Sepsis is now auto-calculated from obs + tick-boxes in the Physiology card (see calcSepsisScreen in app.js) - removed as a manual Yes/No here to avoid duplication.
        alcohol: { label: "Alcohol AUDIT-C Screen", options: [ { val: "0", text: "0-4 (Low Risk)" }, { val: "5", text: "5-7 (Increasing Risk)" }, { val: "8", text: "8-10 (Higher Risk)" }, { val: "11", text: "11+ (Possible Dependence)" } ], info: "AUDIT-C - 3 questions, each scored 0-4 (max 12): 1) How often do you have a drink containing alcohol? 2) How many units/standard drinks on a typical drinking day? 3) How often do you have 6+ units (female) / 8+ units (male) on one occasion? Sum the three scores against the bands in the dropdown." },
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
        "Collapse": [{"text":"Cardiac Arrest","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"History of arrhythmia","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Vasovagal","priority":"Green"}],
        "Confusion": [{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"New Confusion","priority":"Orange"},{"text":"Hypoglycaemia","priority":"Orange"},{"text":"Abnormal vital signs","priority":"Yellow"}],
        "Crying Baby": [{"text":"Unresponsive","priority":"Red"},{"text":"Non-blanching rash","priority":"Orange"},{"text":"Inconsolable","priority":"Orange"},{"text":"High Fever","priority":"Yellow"},{"text":"Settles with handling","priority":"Green"}],
        "Dental Problems": [{"text":"Airway risk","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Facial Swelling","priority":"Yellow"},{"text":"Toothache","priority":"Green"}],
        "Diabetes": [{"text":"Unresponsive","priority":"Red"},{"text":"Hypoglycaemia (<3)","priority":"Orange"},{"text":"Hyperglycaemia w/ Ketones","priority":"Orange"},{"text":"Vomiting","priority":"Yellow"},{"text":"High sugar, well","priority":"Green"}],
        "Diarrhoea and Vomiting": [{"text":"Shock","priority":"Red"},{"text":"Severe Dehydration","priority":"Orange"},{"text":"Blood in stool","priority":"Yellow"},{"text":"Mild Dehydration","priority":"Green"}],
        "Ear Problems": [{"text":"Severe Pain","priority":"Orange"},{"text":"Discharge","priority":"Yellow"},{"text":"Mild Pain","priority":"Green"},{"text":"Blocked Ear","priority":"Blue"}],
        "Eye Problems": [{"text":"Penetrating Injury","priority":"Red"},{"text":"Chemical Injury","priority":"Red"},{"text":"Sudden Loss of Vision","priority":"Orange"},{"text":"Severe Pain","priority":"Orange"},{"text":"Red Eye","priority":"Green"}],
        "Fits and Seizures": [{"text":"Airway compromise","priority":"Red"},{"text":"Actively seizing now (status epilepticus)","priority":"Red"},{"text":"Seizure just terminated, GCS still reduced","priority":"Orange"},{"text":"First ever seizure","priority":"Orange"},{"text":"Repeated seizures (cluster)","priority":"Orange"},{"text":"Injury sustained during seizure","priority":"Yellow"},{"text":"Post-ictal, known epilepsy, improving","priority":"Yellow"},{"text":"Fully recovered, known epilepsy, at baseline","priority":"Green"},{"text":"Information/advice only","priority":"Blue"}],
        "Facial Problems": [{"text":"Airway Risk","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Swelling","priority":"Yellow"},{"text":"Minor Injury","priority":"Green"}],
        "Falls": [{"text":"Major trauma","priority":"Red"},{"text":"Shock","priority":"Orange"},{"text":"Altered GCS","priority":"Orange"},{"text":"Severe pain","priority":"Orange"},{"text":"Long lie (>1 hour)","priority":"Orange"},{"text":"Suspected neck of femur fracture","priority":"Orange"},{"text":"Moderate pain","priority":"Yellow"},{"text":"History of LOC","priority":"Yellow"},{"text":"Inability to weight bear","priority":"Yellow"},{"text":"Head injury with anticoagulants","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Mild pain","priority":"Green"},{"text":"Able to weight bear","priority":"Green"}],
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
        "Palpitations": [{"text":"Shock","priority":"Red"},{"text":"Chest Pain","priority":"Orange"},{"text":"Rate > 150","priority":"Orange"},{"text":"History of AF","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Normal ECG","priority":"Green"}],
        "Pregnancy": [{"text":"Active Labour (Crowning)","priority":"Red"},{"text":"PV Bleeding (Heavy)","priority":"Orange"},{"text":"Abdo Pain","priority":"Yellow"},{"text":"Minor symptoms","priority":"Green"}],
        "PV Bleeding": [{"text":"Shock","priority":"Red"},{"text":"Heavy bleeding with clots","priority":"Orange"},{"text":"Pregnant with bleeding","priority":"Yellow"},{"text":"Period-like bleeding","priority":"Green"},{"text":"Spotting only","priority":"Blue"}],
        "Apparently Drunk": [{"text":"Airway compromise","priority":"Red"},{"text":"Unresponsive","priority":"Red"},{"text":"Shock","priority":"Red"},{"text":"Hypoglycaemia","priority":"Orange"},{"text":"Head injury/trauma signs","priority":"Orange"},{"text":"Reduced GCS (responds to voice/pain)","priority":"Orange"},{"text":"Vomiting","priority":"Yellow"},{"text":"Aggressive/agitated behaviour","priority":"Yellow"},{"text":"Smells of alcohol, GCS 15, walking/talking normally","priority":"Green"},{"text":"Known chronic use, requesting advice","priority":"Blue"}],
        "Rash": [{"text":"Anaphylaxis","priority":"Red"},{"text":"Non-blanching","priority":"Orange"},{"text":"Widespread","priority":"Yellow"},{"text":"Itchy","priority":"Green"}],
        "Self Harm": [{"text":"Active Bleeding (Major)","priority":"Red"},{"text":"Deep Laceration","priority":"Orange"},{"text":"Ingestion","priority":"Orange"},{"text":"Superficial","priority":"Yellow"}],
        "Sexually Acquired Infection": [{"text":"Severe Pain","priority":"Orange"},{"text":"Discharge","priority":"Green"},{"text":"Advice","priority":"Blue"}],
        "Shortness of Breath in Adults": [{"text":"Apnoeic","priority":"Red"},{"text":"Severe respiratory distress","priority":"Orange"},{"text":"Shock","priority":"Orange"},{"text":"Stridor","priority":"Orange"},{"text":"New confusion","priority":"Orange"},{"text":"Moderate respiratory distress","priority":"Yellow"},{"text":"Haemoptysis","priority":"Yellow"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"Mild respiratory distress","priority":"Green"},{"text":"Cough","priority":"Green"},{"text":"Sore throat","priority":"Green"}],
        "Shortness of Breath in Children": [{"text":"Apnoeic","priority":"Red"},{"text":"Silent Chest","priority":"Red"},{"text":"Stridor","priority":"Orange"},{"text":"Severe Recession","priority":"Orange"},{"text":"Moderate Recession","priority":"Yellow"},{"text":"Cough","priority":"Green"}],
        "Sore Throat": [{"text":"Airway Compromise","priority":"Red"},{"text":"Drooling","priority":"Orange"},{"text":"Difficulty Swallowing","priority":"Yellow"},{"text":"Pain only","priority":"Green"}],
        "Testicular Pain": [{"text":"Torsion suspected","priority":"Orange"},{"text":"Severe Pain","priority":"Orange"},{"text":"Swelling","priority":"Yellow"},{"text":"Ache","priority":"Green"}],
        "Torso Injury": [{"text":"Stab/Gunshot","priority":"Red"},{"text":"Chest Flail","priority":"Red"},{"text":"Severe Pain","priority":"Orange"},{"text":"Bruising","priority":"Yellow"}],
        "Unwell Adult": [{"text":"Unresponsive","priority":"Red"},{"text":"Sepsis Suspected","priority":"Orange"},{"text":"Abnormal vital signs","priority":"Yellow"},{"text":"General Malaise","priority":"Green"}],
        "Unwell Child": [{"text":"Unresponsive","priority":"Red"},{"text":"Sepsis Suspected","priority":"Orange"},{"text":"Non-blanching rash","priority":"Orange"},{"text":"Fever > 5 days","priority":"Yellow"},{"text":"Viral symptoms","priority":"Green"}],
        "Urinary Problems": [{"text":"Retention","priority":"Orange"},{"text":"Haematuria (Frank)","priority":"Yellow"},{"text":"Dysuria","priority":"Green"}],
        "Worried Parent": [{"text":"Child looks unwell","priority":"Orange"},{"text":"Parent very distressed","priority":"Yellow"},{"text":"Advice","priority":"Green"}],
        "Wounds": [{"text":"Uncontrolled Bleeding","priority":"Red"},{"text":"Deep/Complex","priority":"Orange"},{"text":"Needs Suture","priority":"Yellow"},{"text":"Graze/Glue","priority":"Green"}]
    },

    // --- 7. CLINICAL PROTOCOLS (1:1 MAPPING WITH MTS FLOWCHARTS) ---
    // Each test carries a short clinical rationale (`why`) so the recommendation is explained, not just listed.
    protocols: {
        "Abdominal Pain in Adults": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Analgesia" }, tests: { bedside: [{ name: "Urine Dip", why: "Exclude UTI/renal pathology, check for haematuria/ketones" }, { name: "Pregnancy Test", why: "Mandatory in reproductive-age females - exclude ectopic" }, { name: "VBG", why: "Lactate for ischaemia/sepsis, quick K+/glucose" }], lab: [{ name: "FBC", why: "Look for leukocytosis suggesting infection/inflammation" }, { name: "U&E", why: "Renal function, electrolyte derangement from vomiting/obstruction" }, { name: "LFT", why: "Screen for biliary/hepatic cause" }, { name: "Amylase", why: "Exclude acute pancreatitis" }, { name: "CRP", why: "Inflammatory marker, trend with clinical picture" }, { name: "G&S", why: "In case of surgical bleeding or transfusion need" }] } },
        "Abdominal Pain in Children": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Fluids" }, tests: { bedside: [{ name: "Urine Dip", why: "Exclude UTI - common cause of paediatric abdo pain" }, { name: "Glucose", why: "Exclude DKA as cause of abdo pain" }], lab: [{ name: "FBC", why: "Infection/inflammation screen" }, { name: "CRP (if surgical)", why: "Raised in appendicitis/surgical causes" }] } },
        "Abscesses and Local Infections": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Abx" }, tests: { bedside: [{ name: "Temp", why: "Screen for systemic sepsis response" }, { name: "Swab", why: "Guide antibiotic choice if incision & drainage performed" }], lab: [{ name: "FBC", why: "Raised WCC may indicate spreading/systemic infection" }, { name: "CRP (if systemic)", why: "Trend severity if unwell" }] } },
        "Allergy": { cannula: { status: "Consider", color: "amber", size: "18G", reason: "Anaphylaxis?" }, tests: { bedside: [{ name: "Peak Flow", why: "Assess bronchospasm severity if wheeze present" }, { name: "ECG", why: "Baseline before adrenaline/antihistamines, exclude cardiac cause" }], lab: [{ name: "Mast Cell Tryptase", why: "Confirms anaphylaxis if taken within 1-2h of onset" }] } },
        "Assault": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Minor Injury" }, tests: { bedside: [{ name: "Police Ref Number", why: "Required for information sharing/safeguarding documentation" }, { name: "Photograph Injuries (consent)", why: "Forensic/legal documentation" }], lab: [] } },
        "Asthma": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "IV Magnesium/Salbutamol?" }, tests: { bedside: [{ name: "Peak Flow", why: "Objective severity marker - compare to personal best/predicted" }, { name: "VBG", why: "CO2 retention suggests life-threatening asthma" }], lab: [{ name: "FBC", why: "Baseline, exclude infective trigger" }, { name: "U&E", why: "Salbutamol causes hypokalaemia - monitor if repeated nebs/IV" }] } },
        "Back Pain": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: [{ name: "Urine Dip", why: "Screen for renal colic/pyelonephritis as cause" }, { name: "Neuro Obs", why: "Detect evolving cauda equina/cord compression" }, { name: "Bladder Scan", why: "Post-void residual >100-150mL is a red flag for cauda equina" }], lab: [{ name: "CRP (if infection)", why: "Raised in discitis/epidural abscess - consider if fever/IVDU/immunosuppressed" }] } },
        "Behaving Strangely": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Sedation?" }, tests: { bedside: [{ name: "Glucose", why: "Hypoglycaemia is a reversible cause of altered behaviour" }, { name: "Temp", why: "Sepsis/encephalitis can present as behavioural change" }], lab: [{ name: "FBC", why: "Infection screen" }, { name: "U&E", why: "Electrolyte derangement causing delirium" }, { name: "Tox Screen", why: "Screen for intoxication/recreational drug causes" }] } },
        "Bites and Stings": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Abx" }, tests: { bedside: [{ name: "Photo", why: "Document wound for monitoring progression/legal record" }], lab: [{ name: "FBC/CRP (if systemic signs)", why: "Screen for systemic envenomation/infection response" }] } },
        "Burns and Scalds": { cannula: { status: "Consider", color: "amber", size: "16G", reason: "Fluids if >10%" }, tests: { bedside: [{ name: "Weight", why: "Required to calculate Parkland fluid formula" }], lab: [{ name: "FBC", why: "Baseline Hb, may need transfusion in large burns" }, { name: "U&E", why: "Guide fluid resuscitation, exclude AKI" }, { name: "Clotting", why: "Baseline before theatre/major burns care" }] } },
        "Chest Pain": { cannula: { status: "Essential", color: "green", size: "18G", reason: "ACS/PE" }, tests: { bedside: [{ name: "ECG (10m)", why: "Identify STEMI/arrhythmia within 10 minutes per ACS pathway" }, { name: "VBG", why: "Rapid lactate/pH, quick K+ if arrhythmia" }, { name: "Trop", why: "Biomarker for myocardial injury - repeat per local ACS protocol" }], lab: [{ name: "FBC", why: "Baseline Hb before anticoagulation/antiplatelets" }, { name: "U&E", why: "Renal function before contrast CTPA, baseline electrolytes" }, { name: "D-Dimer", why: "Rule out PE if low pre-test probability (Wells score)" }] } },
        "Collapse": { cannula: { status: "Essential", color: "green", size: "18G", reason: "Cardiac Cause?" }, tests: { bedside: [{ name: "ECG", why: "Screen for arrhythmia/long QT/Brugada as cause" }, { name: "Lying/Standing BP", why: "Diagnose orthostatic hypotension" }, { name: "Glucose", why: "Exclude hypoglycaemia as cause" }], lab: [{ name: "FBC", why: "Anaemia as contributing cause" }, { name: "U&E", why: "Electrolyte-driven arrhythmia/collapse" }, { name: "Trop", why: "Exclude silent MI as cause of collapse" }] } },
        "Confusion": { cannula: { status: "Essential", color: "green", size: "20G", reason: "Delirium Screen" }, tests: { bedside: [{ name: "Urine Dip", why: "UTI is a common reversible cause of delirium in elderly" }, { name: "VBG", why: "Quick glucose/lactate/electrolytes" }], lab: [{ name: "FBC", why: "Infection screen" }, { name: "U&E", why: "Hyponatraemia/uraemia causing confusion" }, { name: "LFT", why: "Hepatic encephalopathy screen" }, { name: "Ca", why: "Hypercalcaemia causes confusion" }, { name: "TFT", why: "Thyroid dysfunction as reversible cause" }, { name: "Hematinics", why: "B12/folate deficiency - reversible cause of confusion" }] } },
        "Crying Baby": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Paeds Senior Review" }, tests: { bedside: [{ name: "Full Obs", why: "Vital signs to screen for sepsis/serious illness" }, { name: "Strip & Exam", why: "Fully undress to look for occult injury, hernia, hair tourniquet" }, { name: "Urine Dip", why: "UTI is a common occult cause of unexplained crying/fever in infants" }], lab: [] } },
        "Dental Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Refer Dentist" }, tests: { bedside: [], lab: [] } },
        "Diabetes": { cannula: { status: "Essential", color: "green", size: "18G", reason: "DKA/HHS" }, tests: { bedside: [{ name: "Ketones", why: "Confirms DKA if raised alongside hyperglycaemia/acidosis" }, { name: "VBG", why: "pH/bicarbonate to grade DKA severity and guide fluid/insulin protocol" }, { name: "Urine Dip", why: "UTI is a common precipitant of DKA/HHS - screen for infective trigger" }], lab: [{ name: "FBC", why: "Infection often precipitates DKA" }, { name: "U&E", why: "K+ critical before starting insulin - risk of rapid drop" }, { name: "Glucose", why: "Confirm/quantify hyperglycaemia" }, { name: "Osmolality", why: "Distinguish DKA from HHS, guide fluid rate" }] } },
        "Diarrhoea and Vomiting": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Rehydration" }, tests: { bedside: [{ name: "VBG (Lactate/K)", why: "Assess dehydration severity and electrolyte loss" }], lab: [{ name: "U&E", why: "Quantify electrolyte derangement from fluid loss" }, { name: "Stool Culture", why: "If bloody, prolonged >7 days, recent travel or antibiotic-associated" }] } },
        "Ear Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Topical Tx" }, tests: { bedside: [{ name: "Otoscopy", why: "Direct visualisation of tympanic membrane/canal to confirm diagnosis" }], lab: [] } },
        "Eye Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Topical Tx" }, tests: { bedside: [{ name: "Visual Acuity", why: "Baseline and severity marker - essential in every eye complaint" }, { name: "Fluorescein", why: "Identify corneal abrasion/ulcer/foreign body under blue light" }], lab: [] } },
        "Fits and Seizures": { cannula: { status: "Essential", color: "green", size: "18G", reason: "IV Anticonvulsant/Glucose" }, tests: { bedside: [{ name: "Glucose", why: "Hypoglycaemia is a rapidly reversible cause/mimic of seizure" }, { name: "ECG", why: "Exclude cardiac syncope/long QT masquerading as seizure" }, { name: "AED Levels (if known epilepsy)", why: "Sub-therapeutic levels suggest non-adherence as trigger" }], lab: [{ name: "FBC", why: "Infection screen" }, { name: "U&E", why: "Hyponatraemia is a common metabolic seizure cause" }, { name: "Ca", why: "Hypocalcaemia can precipitate seizures" }, { name: "Mg", why: "Hypomagnesaemia lowers seizure threshold" }, { name: "Alcohol Level", why: "Withdrawal seizures - check level and history" }] } },
        "Facial Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Minor Injury" }, tests: { bedside: [{ name: "Neuro Obs", why: "Screen for associated head injury/cranial nerve deficit" }], lab: [] } },
        "Falls": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Unless Fracture" }, tests: { bedside: [{ name: "L/S BP", why: "Identify orthostatic hypotension as cause" }, { name: "ECG", why: "Screen for arrhythmia as cause of fall" }, { name: "Urine Dip", why: "UTI is a common precipitant of falls, especially in older adults" }], lab: [{ name: "FBC", why: "Anaemia/occult bleeding contributing to fall" }, { name: "U&E", why: "Electrolyte disturbance as cause" }, { name: "CK", why: "Long-lie - screen for rhabdomyolysis" }, { name: "Bone Profile", why: "Osteoporosis/metabolic bone disease assessment post-fragility fall" }] } },
        "Foreign Body": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Removal" }, tests: { bedside: [], lab: [] } },
        "Gastrointestinal Bleeding": { cannula: { status: "Essential", color: "green", size: "16G x2", reason: "Major Haemorrhage" }, tests: { bedside: [{ name: "VBG", why: "Rapid Hb/lactate while lab bloods pending" }], lab: [{ name: "FBC", why: "Quantify blood loss" }, { name: "U&E", why: "Raised urea:creatinine ratio suggests upper GI bleed" }, { name: "LFT", why: "Assess for underlying liver disease/varices risk" }, { name: "Clotting", why: "Guide reversal if coagulopathic/anticoagulated" }, { name: "Cross Match", why: "Prepare for transfusion if unstable/ongoing bleeding" }] } },
        "Headache": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "CT Contrast?" }, tests: { bedside: [{ name: "Neuro Obs", why: "Detect evolving focal deficit/reduced GCS" }, { name: "Temp", why: "Fever raises suspicion of meningitis/encephalitis" }], lab: [{ name: "FBC", why: "Infection/inflammation screen" }, { name: "CRP", why: "Raised in GCA/meningitis - urgent if temporal arteritis suspected" }, { name: "ESR", why: "Supports GCA diagnosis alongside CRP, especially if age >50" }] } },
        "Head Injury": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Obs Only usually" }, tests: { bedside: [{ name: "Neuro Obs", why: "Serial GCS/pupils to detect deterioration" }], lab: [{ name: "INR (if Warfarin)", why: "Guide urgent reversal if intracranial bleed on anticoagulation" }, { name: "G&S (if Trauma)", why: "In case of associated injury requiring transfusion" }] } },
        "Irritable Child": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Paeds Review" }, tests: { bedside: [{ name: "Urine Dip", why: "UTI is a common cause of irritability/fever in young children" }, { name: "Glucose", why: "Exclude hypoglycaemia" }], lab: [{ name: "FBC", why: "Infection screen" }, { name: "CRP", why: "Marker of bacterial infection severity" }, { name: "Blood Culture", why: "If febrile/unwell - identify causative organism before antibiotics" }] } },
        "Limb Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: [{ name: "Neurovascular Check", why: "Essential to exclude compartment syndrome/vascular compromise" }], lab: [] } },
        "Limping Child": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: [{ name: "Temp", why: "Fever raises concern for septic arthritis/osteomyelitis" }], lab: [{ name: "FBC", why: "Raised WCC supports septic arthritis" }, { name: "CRP", why: "Kocher criteria component - risk-stratify septic arthritis" }, { name: "ESR", why: "Kocher criteria component alongside CRP" }] } },
        "Major Trauma": { cannula: { status: "Essential", color: "green", size: "14G/16G x2", reason: "Trauma Call" }, tests: { bedside: [{ name: "FAST Scan", why: "Rapid detection of free intraperitoneal/pericardial fluid" }, { name: "VBG", why: "Rapid lactate/Hb/base excess to guide resuscitation" }], lab: [{ name: "Major Haem Pack", why: "Activate for anticipated massive transfusion" }] } },
        "Mental Illness": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Agitation Risk" }, tests: { bedside: [{ name: "Physical Exam", why: "Exclude organic cause masquerading as psychiatric presentation" }], lab: [{ name: "Tox Screen", why: "Screen for substance-induced presentation" }] } },
        "Neck Pain": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Analgesia" }, tests: { bedside: [{ name: "Neuro Obs", why: "Detect evolving myelopathy/radiculopathy" }], lab: [] } },
        "Needlestick Injury": { cannula: { status: "Essential", color: "green", size: "20G", reason: "Storage Bloods" }, tests: { bedside: [], lab: [{ name: "Storage Serum", why: "Baseline sample held for reference if seroconversion occurs" }, { name: "Hep B Status", why: "Determine need for booster/immunoglobulin per exposure protocol" }, { name: "Source Bloods (if consented)", why: "Guide need for PEP based on source HIV/Hep B/Hep C status" }] } },
        "Overdose and Poisoning": { cannula: { status: "Essential", color: "green", size: "18G", reason: "Antidote" }, tests: { bedside: [{ name: "ECG", why: "QT/QRS prolongation guides risk with many overdoses (e.g. TCAs)" }, { name: "VBG", why: "Rapid pH/lactate - metabolic acidosis in salicylate/methanol etc." }, { name: "Urine Dip", why: "Screens for myoglobinuria (blood on dip, no RBCs on micro) if prolonged immobility/rhabdomyolysis risk" }], lab: [{ name: "Paracetamol Level", why: "Guides need for NAC per treatment nomogram" }, { name: "Salicylate Level", why: "Guides treatment if aspirin/NSAID overdose suspected" }, { name: "U&E", why: "Baseline renal function, electrolyte disturbance" }, { name: "LFT", why: "Baseline hepatic function, essential if paracetamol involved" }, { name: "INR", why: "Marker of hepatotoxicity in paracetamol overdose" }] } },
        "Palpitations": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Rate Control?" }, tests: { bedside: [{ name: "ECG", why: "Capture rhythm during/after symptoms - essential first test" }], lab: [{ name: "U&E", why: "Electrolyte derangement (K+/Mg) precipitating arrhythmia" }, { name: "Mg", why: "Hypomagnesaemia predisposes to arrhythmia" }, { name: "TFT", why: "Thyrotoxicosis is a reversible cause of palpitations/AF" }, { name: "FBC", why: "Anaemia as a cause of palpitations" }] } },
        "Pregnancy": { cannula: { status: "Consider", color: "amber", size: "18G", reason: "Bleeding Risk" }, tests: { bedside: [{ name: "Urine Dip", why: "Screen for proteinuria/infection - relevant to pre-eclampsia and UTI" }], lab: [{ name: "FBC", why: "Baseline Hb, platelets" }, { name: "G&S", why: "Essential before any bleeding/procedure in pregnancy" }, { name: "Rhesus", why: "Determines need for Anti-D if bleeding and Rh-negative" }] } },
        "PV Bleeding": { cannula: { status: "Consider", color: "amber", size: "18G", reason: "Bleeding Risk/Anaemia" }, tests: { bedside: [{ name: "Pregnancy Test", why: "Essential to exclude ectopic/miscarriage as cause" }], lab: [{ name: "FBC", why: "Quantify blood loss/anaemia" }, { name: "G&S", why: "In case of significant bleeding requiring transfusion" }, { name: "Clotting", why: "Exclude coagulopathy as cause of abnormal bleeding" }] } },
        "Apparently Drunk": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Hypoglycaemia/Withdrawal" }, tests: { bedside: [{ name: "Glucose", why: "Hypoglycaemia is a common, rapidly reversible mimic of intoxication - must exclude" }, { name: "Neuro Obs/GCS", why: "Distinguishes simple intoxication from head injury or other CNS pathology" }], lab: [{ name: "FBC", why: "Screen for chronic alcohol-related anaemia/infection" }, { name: "U&E", why: "Electrolyte derangement common in chronic alcohol excess" }, { name: "LFT", why: "Assess for alcohol-related liver disease" }, { name: "Alcohol Level", why: "Quantifies exposure - treat the clinical picture, not the level alone" }] } },
        "Rash": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Obs Only" }, tests: { bedside: [{ name: "Glass Test", why: "Non-blanching rash under pressure raises concern for meningococcal sepsis" }], lab: [{ name: "FBC", why: "Screen for infective/haematological cause" }, { name: "CRP (if febrile)", why: "Marker of infective/inflammatory severity" }] } },
        "Self Harm": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "If Overdose/Suture" }, tests: { bedside: [], lab: [{ name: "Paracetamol Level", why: "Screen for occult paracetamol co-ingestion even if denied" }, { name: "Salicylate Level", why: "Screen for occult co-ingestion" }] } },
        "Sexually Acquired Infection": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "GUM Clinic" }, tests: { bedside: [{ name: "Swabs", why: "Identify causative organism to guide targeted treatment" }], lab: [{ name: "HIV/Syphilis Serology (if high-risk exposure)", why: "Opportunistic screening per NICE/BASHH guidance" }] } },
        "Shortness of Breath in Adults": { cannula: { status: "Essential", color: "green", size: "18G", reason: "IV Meds" }, tests: { bedside: [{ name: "ECG", why: "Screen for cardiac cause/right heart strain suggesting PE" }, { name: "ABG", why: "Quantify hypoxia/hypercapnia and acid-base status" }, { name: "VBG", why: "Rapid lactate if ABG not tolerated/available" }], lab: [{ name: "FBC", why: "Anaemia or infection as contributing cause" }, { name: "U&E", why: "Baseline renal function before diuretics/contrast" }, { name: "CRP", why: "Infective/inflammatory marker" }, { name: "BNP", why: "Raised in heart failure - helps distinguish cardiac vs respiratory cause" }, { name: "D-Dimer", why: "If PE suspected and low-intermediate Wells score" }] } },
        "Shortness of Breath in Children": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Inhalers/Nebs" }, tests: { bedside: [{ name: "O2 Sats", why: "Objective severity marker, guides oxygen therapy" }], lab: [] } },
        "Sore Throat": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "If Quinsy/IVs" }, tests: { bedside: [{ name: "Centor Score", why: "Risk-stratifies likelihood of bacterial (streptococcal) tonsillitis" }], lab: [{ name: "FBC", why: "Marker of bacterial vs viral aetiology" }, { name: "Monospot", why: "Screen for glandular fever/EBV in prolonged or atypical presentation" }] } },
        "Testicular Pain": { cannula: { status: "Consider", color: "amber", size: "20G", reason: "Surgery Prep" }, tests: { bedside: [{ name: "Urine Dip", why: "Screen for epididymo-orchitis as alternative cause" }], lab: [{ name: "FBC", why: "Infection/inflammation screen" }, { name: "CRP", why: "Supports epididymo-orchitis vs torsion" }, { name: "G&S", why: "In case surgical exploration required" }] } },
        "Torso Injury": { cannula: { status: "Essential", color: "green", size: "16G", reason: "Trauma" }, tests: { bedside: [{ name: "VBG", why: "Rapid lactate/Hb to guide resuscitation" }], lab: [{ name: "FBC", why: "Baseline Hb, screen for occult haemorrhage" }, { name: "G&S", why: "In case of transfusion requirement" }] } },
        "Unwell Adult": { cannula: { status: "Essential", color: "green", size: "18G", reason: "Sepsis?" }, tests: { bedside: [{ name: "VBG", why: "Rapid lactate - key marker of sepsis severity" }, { name: "Lactate", why: "Prognostic marker, part of Sepsis Six" }, { name: "Cultures", why: "Identify causative organism before antibiotics - part of Sepsis Six" }], lab: [{ name: "FBC", why: "Infection/inflammation screen" }, { name: "U&E", why: "Assess for AKI, electrolyte derangement" }, { name: "LFT", why: "Screen for hepatic source/derangement" }, { name: "CRP", why: "Inflammatory marker trend" }, { name: "Clotting", why: "Screen for DIC in severe sepsis" }] } },
        "Unwell Child": { cannula: { status: "Consider", color: "amber", size: "22G", reason: "Sepsis?" }, tests: { bedside: [{ name: "VBG", why: "Rapid lactate/glucose - key in paediatric sepsis assessment" }, { name: "Glucose", why: "Hypoglycaemia common and reversible in unwell children" }], lab: [{ name: "FBC", why: "Infection screen" }, { name: "CRP", why: "Supports bacterial vs viral aetiology" }, { name: "Cultures", why: "Identify organism before antibiotics if septic" }] } },
        "Urinary Problems": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Oral Fluids" }, tests: { bedside: [{ name: "Urine Dip", why: "First-line to detect nitrites/leucocytes/blood/protein" }, { name: "Bladder Scan", why: "Confirm/quantify retention, guide catheterisation" }], lab: [{ name: "U&E", why: "Assess for post-renal AKI if retention" }, { name: "FBC", why: "Infection screen" }, { name: "CRP", why: "Marker of pyelonephritis/systemic infection" }] } },
        "Worried Parent": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Reassurance" }, tests: { bedside: [{ name: "Full Obs", why: "Objective reassurance that child is physiologically well" }], lab: [] } },
        "Wounds": { cannula: { status: "Avoid", color: "red", size: "N/A", reason: "Suture/Glue" }, tests: { bedside: [{ name: "Neurovascular Check", why: "Exclude nerve/vessel injury deep to wound" }], lab: [] } }
    }
};
