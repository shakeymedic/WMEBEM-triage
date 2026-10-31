// plan-engine.js - the triage investigations and cannula engine (pure: no DOM, no state).
//
// Input: a "facts" object built by the app from what the nurse has recorded (see FACT_DEFAULTS).
// Output: { cannula, items, notes } where every suggestion carries the reasons that fired it and
// the source each reason comes from. Three layers are combined:
//   1. the complaint's nursing plan in protocols.js (section 7b) - the presentation-specific defaults;
//   2. cross-cutting rules below that fire on physiology, history or answers whatever the complaint;
//   3. safety rewrites (e.g. no urine dipstick to diagnose UTI in people over 65).
// Rules only ever ADD or RAISE a suggestion; nothing here removes a test the complaint plan offers,
// except the UTI dipstick rewrite, which replaces it with the correct action.
//
// Nursing scope only: no imaging. Every rule is unit-tested in tests/plan-engine.test.mjs; change a
// rule only together with its test and its source. Rules marked source 'local' are this app's
// defaults, not national rules - the department must adopt or change them.

import { has, toNumber, planAutoMet } from './clinical.js';

// ------------------------------------------------------------------------------------------------
// Sources. Only national documents that were checked on their live pages are cited (October 2026).
// ------------------------------------------------------------------------------------------------
export const SOURCES = {
    ng253: { label: 'NICE NG253 Suspected sepsis in people aged 16 or over (1.8)', url: 'https://www.nice.org.uk/guidance/ng253/chapter/Managing-suspected-sepsis' },
    ng254: { label: 'NICE NG254 Suspected sepsis in under 16s (1.5 grading risk, 1.7 managing suspected sepsis)', url: 'https://www.nice.org.uk/guidance/ng254/chapter/Managing-suspected-sepsis' },
    cg151: { label: 'NICE CG151 Neutropenic sepsis (1.4.1.1)', url: 'https://www.nice.org.uk/guidance/cg151/chapter/Recommendations' },
    cg95: { label: 'NICE CG95 Recent-onset chest pain of suspected cardiac origin (1.2.2.1)', url: 'https://www.nice.org.uk/guidance/cg95/chapter/Recommendations' },
    ng258: { label: 'NICE NG258 Anaphylaxis: assessment and referral (timing of blood samples)', url: 'https://www.nice.org.uk/guidance/ng258/chapter/Timing-of-blood-samples' },
    mhraParacetamol: { label: 'MHRA Drug Safety Update: treating paracetamol overdose with IV acetylcysteine (2012)', url: 'https://www.gov.uk/drug-safety-update/treating-paracetamol-overdose-with-intravenous-acetylcysteine-new-guidance' },
    qs61: { label: 'NICE QS61 Infection prevention and control (statement 5: vascular access devices)', url: 'https://www.nice.org.uk/guidance/qs61/chapter/Quality-statement-5-Vascular-access-devices' },
    ng143: { label: 'NICE NG143 Fever in under 5s (1.5)', url: 'https://www.nice.org.uk/guidance/ng143/chapter/Recommendations' },
    ng232: { label: 'NICE NG232 Head injury (1.9.11 observations)', url: 'https://www.nice.org.uk/guidance/ng232/chapter/Recommendations' },
    ng128: { label: 'NICE NG128 Stroke and TIA in over 16s', url: 'https://www.nice.org.uk/guidance/ng128/chapter/Recommendations' },
    cg109: { label: 'NICE CG109 Transient loss of consciousness in over 16s (1.1.2.2)', url: 'https://www.nice.org.uk/guidance/cg109/chapter/Recommendations' },
    ng126: { label: 'NICE NG126 Ectopic pregnancy and miscarriage (1.4.3, 1.4.5)', url: 'https://www.nice.org.uk/guidance/ng126/chapter/Symptoms-and-signs-of-ectopic-pregnancy-and-initial-assessment' },
    mhraSglt2: { label: 'MHRA Drug Safety Update: SGLT2 inhibitors and diabetic ketoacidosis (2016)', url: 'https://www.gov.uk/drug-safety-update/sglt2-inhibitors-updated-advice-on-the-risk-of-diabetic-ketoacidosis' },
    ng133: { label: 'NICE NG133 Hypertension in pregnancy (1.2)', url: 'https://www.nice.org.uk/guidance/ng133/chapter/Recommendations' },
    cg143: { label: 'NICE CG143 Sickle cell disease: acute painful episodes', url: 'https://www.nice.org.uk/guidance/cg143/chapter/Recommendations' },
    ng217: { label: 'NICE NG217 Epilepsies (7.1 status epilepticus)', url: 'https://www.nice.org.uk/guidance/ng217/chapter/7-Treating-status-epilepticus-repeated-or-cluster-seizures-and-prolonged-seizures' },
    ukhsaUti: { label: 'UKHSA Diagnosis of urinary tract infections: quick reference tools (updated July 2025)', url: 'https://www.gov.uk/government/publications/urinary-tract-infection-diagnosis/diagnosis-of-urinary-tract-infections-quick-reference-tools-for-primary-care' },
    jbdsDka: { label: 'JBDS-IP 02 Management of diabetic ketoacidosis in adults (March 2023)', url: 'https://abcd.care/resource/current/jbds-02-management-diabetic-ketoacidosis-adults' },
    bspedDka: { label: 'BSPED Paediatric DKA guideline', url: 'https://www.bsped.org.uk/clinical-resources/bsped-dka-guidelines/' },
    pregnancyEnquiry: { label: 'Society of Radiographers: inclusive pregnancy status guidelines for ionising radiation (ages 12-55, local ranges vary)', url: 'https://sor.org/getmedia/82ab6464-552e-456e-83cf-89a0663c90e2/Inclusive-Pregnancy-Status-Guidelines-for-Ionising-Radiation_LLv4' },
    rcukAnaphylaxis: { label: 'Resuscitation Council UK Emergency treatment of anaphylaxis (2021)', url: 'https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis/emergency-treatment' },
    sign158: { label: 'SIGN 158 British guideline on the management of asthma (acute asthma: IV magnesium sulphate in acute severe / life-threatening asthma)', url: 'https://www.sign.ac.uk/sign-158-british-guideline-on-the-management-of-asthma' },
    epic3: { label: 'epic3 national evidence-based guidelines for preventing healthcare-associated infections (2014), IVAD28', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7114876/' },
    local: { label: 'App default - not a national rule: adopt or change locally', url: '' }
};

// ------------------------------------------------------------------------------------------------
// Facts the engine understands. The app builds these; tests pass partial objects.
// ------------------------------------------------------------------------------------------------
export const FACT_DEFAULTS = {
    age: null, sex: '', pregnant: false,
    complaint: '', discriminator: null, level: null, painOnlyOrange: false,
    ews: { type: 'NEWS2', score: 0, complete: false, recorded: 0, redParam: false },
    obs: { rr: null, sats: null, o2: null, scale2: false, sbp: null, dbp: null, hr: null, temp: null, avpu: null, gcs: null, bm: null, ketones: null },
    prehospitalBm: null,
    sepsisRisk: null,          // 'High' | 'Medium' | 'Low' | 'Very low' | null (not assessed); NG254 is mapped onto these bands
    sepsisGuideline: null,     // 'NG253' (16 and over) | 'NG254' (under 16)
    sepsisLabel: '',           // the guideline's own wording, e.g. 'Moderate to high risk (2 criteria)'
    infection: null,           // 'yes' | 'no' | null
    feverTL: null,             // NG143 under 5s, only when fever is relevant: 'Red' | 'Amber' | 'Green' | null
    ng232: null,               // NG232 level: '1h' | '8h' | 'consider8h' | 'observe4h' | 'none' | null
    headInjury: false,         // the NG232 tool is in use
    rosierLikely: false, lkwHours: null,
    flags: {},                 // anticoag, antiplatelet, insulin, sulphonylurea, sglt2, steroid, immunosuppressant, chemo, sickle, dialysis, lithium, digoxin
    diabetes: false,
    cardiacHistory: '',        // the significant cardiac history found in PMH (see cardiacHistoryFrom)
    pain: null,
    protocol: null             // the complaint's entry in clinicalData.protocols
};

export function normaliseFacts(f = {}) {
    return {
        ...FACT_DEFAULTS, ...f,
        ews: { ...FACT_DEFAULTS.ews, ...(f.ews || {}) },
        obs: { ...FACT_DEFAULTS.obs, ...(f.obs || {}) },
        flags: { ...(f.flags || {}) }
    };
}

// Names shared with protocols.js so the complaint plan and the rules merge into one line each.
export const T = {
    bm: 'Capillary blood glucose (BM)',
    ketones: 'Capillary blood ketones',
    ecg: '12-lead ECG',
    vbg: 'Venous blood gas (VBG)',
    cultures: 'Blood cultures (2 sets)',
    urine: 'Urine dip',
    msu: 'Urine sample for culture',
    childUrine: 'Urine sample (clean catch)',
    hcg: 'Pregnancy test (urine hCG)',
    neuro: 'Neuro obs (GCS and pupils)',
    lsbp: 'Lying and standing BP',
    weight: 'Weight',
    peakflow: 'Peak flow (PEFR)'
};

export const ITEM_STATUSES = ['now', 'suggested', 'consider'];
export const CANNULA_LEVELS = ['now', 'recommended', 'consider', 'not-needed'];
export const CANNULA_LABELS = { now: 'Insert now', recommended: 'Recommended', consider: 'Consider', 'not-needed': 'Not needed now' };

const better = (list, a, b) => (list.indexOf(a) <= list.indexOf(b) ? a : b);

// ------------------------------------------------------------------------------------------------
// Derived clinical states used by several rules. Each returns a reason string or ''.
// ------------------------------------------------------------------------------------------------
const age = (f) => (has(f.age) ? Number(f.age) : null);
const isChild = (f) => age(f) !== null && age(f) < 16;
const isAdult = (f) => age(f) !== null && age(f) >= 16;
const disc = (f, re) => !!f.discriminator && re.test(f.discriminator);
const complaint = (f, re) => !!f.complaint && re.test(f.complaint);
const LOC_RE = /\bLOC\b|loss of consciousness|syncope|faint/i;
const bmValue = (f) => (has(f.obs.bm) ? toNumber(f.obs.bm) : toNumber(f.prehospitalBm));

export function reducedConsciousness(f) {
    if (has(f.obs.avpu) && f.obs.avpu !== 'A') return f.obs.avpu === 'C' ? 'New confusion (ACVPU C)' : `Responds to ${({ V: 'voice', P: 'pain', U: 'nothing - unresponsive' })[f.obs.avpu] || f.obs.avpu} (ACVPU)`;
    if (has(f.obs.gcs) && Number(f.obs.gcs) < 15) return `GCS ${f.obs.gcs}`;
    return '';
}

export function shocked(f) {
    if (disc(f, /shock|exsanguinat|catastrophic haemorrhage|haemodynamic collapse|cardiac arrest/i)) return f.discriminator;
    if (isAdult(f) && has(f.obs.sbp) && Number(f.obs.sbp) <= 90) return `Systolic BP ${f.obs.sbp} (90 or less)`;
    return '';
}

export function majorBleed(f) {
    if (disc(f, /exsanguinat|catastrophic haemorrhage|uncontrolled bleeding|active bleeding|stab\/gunshot|stab or gunshot|uncontrollable major haemorrhage/i)) return f.discriminator;
    if (complaint(f, /^Major Trauma$/)) return 'Major trauma';
    if (shocked(f) && complaint(f, /Gastrointestinal Bleeding|PV Bleeding|Torso Injury|Wounds|Self Harm|Assault|Falls/)) return `Shocked with a possible bleed (${shocked(f)})`;
    return '';
}

// Fever is 38C or more measured, or a sepsis/fever discriminator. Chemotherapy in the last 6 weeks
// with fever or suspected infection is treated as possible neutropenic sepsis (NICE CG151).
export function neutropenicSepsis(f) {
    if (!f.flags.chemo) return '';
    const fever = has(f.obs.temp) && Number(f.obs.temp) >= 38;
    if (fever) return `Chemotherapy in the last 6 weeks with temperature ${f.obs.temp}°C`;
    if (f.infection === 'yes') return 'Chemotherapy in the last 6 weeks with suspected infection';
    if (disc(f, /sepsis|fever/i)) return `Chemotherapy in the last 6 weeks with "${f.discriminator}"`;
    return '';
}

export function possibleDiabetes(f) {
    if (f.diabetes) return 'Known diabetes';
    if (f.flags.insulin) return 'On insulin';
    if (f.flags.sulphonylurea) return 'On a sulphonylurea';
    if (f.flags.sglt2) return 'On an SGLT2 inhibitor';
    return '';
}

// Hyperglycaemia that needs a ketone check: BM above 11 in someone with diabetes or any child.
export function ketoneCheckNeeded(f) {
    const bm = bmValue(f);
    if (bm !== null && bm > 11 && (possibleDiabetes(f) || isChild(f))) return `BM ${bm} mmol/L (above 11)${isChild(f) ? ' in a child' : ` - ${possibleDiabetes(f).toLowerCase()}`}`;
    // Euglycaemic DKA: SGLT2 inhibitors can cause DKA with a normal glucose.
    if (f.flags.sglt2 && (f.ews.score >= 3 || complaint(f, /Abdominal|Diarrhoea and Vomiting|Diabetes|Unwell/) || disc(f, /vomit/i))) return 'On an SGLT2 inhibitor and unwell, vomiting or abdominal pain - DKA can occur with a normal glucose';
    return '';
}

// DKA is likely when ketones are above 3.0 with BM above 11.0 (or known diabetes) - JBDS-IP 2023 / BSPED.
// Acidosis (pH < 7.3 or bicarbonate < 15) confirms it; that needs the blood gas.
export function dkaLikely(f) {
    const k = toNumber(f.obs.ketones), bm = bmValue(f);
    if (k === null || k <= 3) return '';
    if ((bm !== null && bm > 11) || possibleDiabetes(f)) return `Ketones ${k} mmol/L${bm !== null ? ` with BM ${bm}` : ''}`;
    return '';
}

export function hypoglycaemia(f) {
    const bm = bmValue(f);
    return bm !== null && bm < 4 ? `BM ${bm} mmol/L (below 4)` : '';
}

export function couldBePregnant(f) {
    if (f.sex === 'Male' || f.pregnant) return false;
    const a = age(f);
    return a === null || (a >= 12 && a <= 55);
}

const sepsisHigh = (f) => f.sepsisRisk === 'High';
const sepsisMedium = (f) => f.sepsisRisk === 'Medium';
const sepsisSource = (f) => (f.sepsisGuideline === 'NG254' ? 'ng254' : 'ng253');
const sepsisName = (f) => `${f.sepsisGuideline || 'NG253'} ${(f.sepsisLabel || `${f.sepsisRisk} risk`).toLowerCase()} sepsis`;

// Significant cardiac history in free-text PMH. Word boundaries keep short terms (MI, AF, VT) from
// matching inside other words; a bare "stent" is left out because it is often ureteric or biliary.
const CARDIAC_RE = /\b(ihd|ischa?emic heart|coronary|angina|mi|n?stemi|acs|heart attack|myocardial infarction|cabg|pci|heart failure|ccf|lvsd|hfref|hfpef|cardiomyopathy|af|atrial fibrillation|atrial flutter|svt|vt|ventricular tachycardia|arrhythmia|pacemaker|ppm|icd|heart valve|valve replacement|aortic stenosis|mitral|tavi|congenital heart|long qt|brugada|wpw|wolff)\b/i;
export function cardiacHistoryFrom(pmh) {
    const m = String(pmh || '').match(CARDIAC_RE);
    return m ? m[0] : '';
}

// Needs oxygen now: already on oxygen, or SpO2 in air below the target (94%, or 88% on scale 2).
export function oxygenNeed(f) {
    if (f.obs.o2 === 'O2') return 'On oxygen at triage';
    if (has(f.obs.sats) && f.obs.o2 === 'Air') {
        const target = f.obs.scale2 ? 88 : 94;
        if (Number(f.obs.sats) < target) return `SpO2 ${f.obs.sats}% in air (below ${target}%)`;
    }
    return '';
}

// Presentations where a significant cardiac history alone does not need an ECG.
const MINOR_RE = /^(Limb Problems|Wounds|Burns and Scalds|Eye Problems|Ear Problems|Dental Problems|Facial Problems|Foreign Body|Needlestick Injury|Bites and Stings|Sexually Acquired Infection|Abscesses and Local Infections|Sore Throat|Rash|Back Pain|Neck Pain)$/;
const news = (f) => (f.ews.type === 'NEWS2' ? f.ews.score : null);
const ewsLabel = (f) => f.ews.type === 'NEWS2'
    ? (f.ews.complete ? `NEWS2 ${f.ews.score}` : `provisional NEWS2 at least ${f.ews.score}`)
    : `${f.ews.complete ? '' : 'partial '}local ${f.ews.type} ${f.ews.score}`;

// What the complaint plan's `auto` conditions (protocols.js section 7b) are evaluated against.
export function autoContext(input) {
    const f = normaliseFacts(input);
    return {
        age: f.age, pregnant: f.pregnant, bm: bmValue(f), discriminator: f.discriminator, anticoag: !!f.flags.anticoag,
        sepsis: sepsisHigh(f) || sepsisMedium(f) || f.feverTL === 'Red' || f.feverTL === 'Amber' || /sepsis/i.test(f.discriminator || '') || !!neutropenicSepsis(f)
    };
}

// ------------------------------------------------------------------------------------------------
// The engine
// ------------------------------------------------------------------------------------------------
export function evaluatePlan(input, bloodProfiles = {}) {
    const f = normaliseFacts(input);
    const items = new Map();
    const notes = [];

    const add = (name, category, status, text, source = 'local', extra = {}) => {
        const key = `${category}|${name}`;
        const cur = items.get(key);
        if (!cur) {
            items.set(key, { name, category, status, why: extra.why || '', when: extra.when || '', timing: extra.timing || '', caution: extra.caution || '', fromComplaint: !!extra.fromComplaint, reasons: text ? [{ text, source }] : [] });
            return;
        }
        cur.status = better(ITEM_STATUSES, status, cur.status);
        if (text && !cur.reasons.some(r => r.text === text)) cur.reasons.push({ text, source });
        ['why', 'when', 'timing', 'caution'].forEach(k => { if (!cur[k] && extra[k]) cur[k] = extra[k]; });
        if (extra.fromComplaint) cur.fromComplaint = true;
    };
    const bed = (name, status, text, source, extra) => add(name, 'Bedside', status, text, source, extra);
    const blood = (profile, status, text, source, extra = {}) => {
        if (!bloodProfiles[profile] && Object.keys(bloodProfiles).length) return; // never invent a bundle
        add(profile, 'Bloods', status, text, source, extra);
    };

    // ---- 1. Complaint plan (protocols.js) ----
    const proto = f.protocol;
    const autoCtx = autoContext(f);
    if (proto) {
        const fromList = (list, cat) => list.forEach(it => {
            const name = cat === 'Bloods' ? it.profile : it.name;
            if (planAutoMet(it.auto, autoCtx)) {
                add(name, cat, 'suggested', it.auto === 'always' ? `${f.complaint} presentation` : `${it.when.charAt(0).toUpperCase()}${it.when.slice(1)}`, 'local', { why: it.why, when: it.when, fromComplaint: true });
            } else add(name, cat, 'consider', '', 'local', { why: it.why, when: it.when, fromComplaint: true });
        });
        fromList(proto.bedside, 'Bedside');
        fromList(proto.bloods, 'Bloods');
        // Standing BP needs a patient who can safely stand: not with a suspected hip fracture,
        // inability to weight bear, major trauma or shock.
        if (disc(f, /neck of femur|inability to weight bear|unable to weight bear|major trauma|shock|catastrophic/i)) items.delete(`Bedside|${T.lsbp}`);
        if (has(f.weight)) items.delete(`Bedside|${T.weight}`); // already measured
    }

    // ---- 2. Cross-cutting rules ----
    const rc = reducedConsciousness(f), shock = shocked(f), bleed = majorBleed(f), neut = neutropenicSepsis(f);
    const hypo = hypoglycaemia(f), dka = dkaLikely(f), ketoNeed = ketoneCheckNeeded(f), diab = possibleDiabetes(f);
    const n2 = news(f);

    // Capillary glucose
    if (rc) bed(T.bm, 'now', `${rc} - exclude hypoglycaemia`, 'local');
    if (complaint(f, /Fits and Seizures/) || disc(f, /seiz|fitting now/i)) bed(T.bm, 'now', 'Seizure - hypoglycaemia is a possible underlying cause', 'ng217');
    if (complaint(f, /Suspected Stroke|Suspected TIA/) || f.rosierLikely) bed(T.bm, 'now', 'Sudden neurological symptoms - exclude hypoglycaemia', 'ng128');
    if (diab) bed(T.bm, 'suggested', diab, 'local');
    if (sepsisHigh(f) || sepsisMedium(f)) bed(T.bm, 'suggested', `${sepsisName(f)} - glucose is part of the blood tests`, sepsisSource(f));
    if (hypo) bed(T.bm, 'now', `${hypo} - treat per hypoglycaemia protocol and recheck`, 'local', { timing: 'Recheck 10-15 minutes after treatment' });

    // Ketones
    if (ketoNeed) bed(T.ketones, 'suggested', ketoNeed, /SGLT2/.test(ketoNeed) ? 'mhraSglt2' : (isChild(f) ? 'bspedDka' : 'jbdsDka'));
    if (dka) bed(T.ketones, 'now', `${dka} - possible DKA`, isChild(f) ? 'bspedDka' : 'jbdsDka');

    // ECG
    if (complaint(f, /^Chest Pain$/)) bed(T.ecg, 'now', 'Chest pain - resting 12-lead ECG as soon as possible to look for STEMI', 'cg95', { timing: 'Within 10 minutes of arrival (ESC standard; NICE CG95 says as soon as possible)' });
    if (complaint(f, /^Collapse$/) || disc(f, LOC_RE)) bed(T.ecg, 'suggested', 'Transient loss of consciousness - 12-lead ECG for everyone', isAdult(f) ? 'cg109' : 'local');
    if (complaint(f, /^Palpitations$/)) bed(T.ecg, 'now', 'Palpitations - capture the rhythm, ideally while symptomatic', 'local');
    // NEWS2 heart rate bands are for adults only; a fast heart rate is normal-ish in young children.
    if (isAdult(f) && has(f.obs.hr) && (Number(f.obs.hr) <= 40 || Number(f.obs.hr) >= 131)) bed(T.ecg, 'suggested', `Heart rate ${f.obs.hr} (NEWS2 3 points)`, 'local');
    if (shock) bed(T.ecg, 'suggested', `Shocked (${shock})`, 'local');
    if (f.flags.dialysis && (f.ews.score >= 1 || f.infection === 'yes' || disc(f, /weak|vomit|palpit/i))) bed(T.ecg, 'suggested', 'Dialysis patient who is unwell - potassium risk', 'local');
    if ((f.flags.digoxin || f.flags.lithium) && (f.ews.score >= 3 || complaint(f, /Overdose|Confusion|Diarrhoea and Vomiting|Collapse|Palpitations/))) bed(T.ecg, 'suggested', `On ${f.flags.digoxin ? 'digoxin' : 'lithium'} and unwell - toxicity can cause arrhythmia`, 'local');
    if (dka) bed(T.ecg, 'suggested', 'Possible DKA - potassium can be very abnormal', 'local');
    // Department ECG triggers (agreed 23 October 2026). Breathlessness, oxygen and cardiac history are
    // for adults: in children these are usually respiratory and an ECG is not routine.
    if (!complaint(f, /^Chest Pain$/) && disc(f, /chest pain/i)) bed(T.ecg, 'now', `Chest pain ("${f.discriminator}") - 12-lead ECG`, 'local');
    if (isAdult(f) && (complaint(f, /^Shortness of Breath in Adults$|^Suspected DVT \/ PE$/) || disc(f, /respiratory distress|breath/i))) bed(T.ecg, 'suggested', 'Shortness of breath', 'local');
    const o2 = oxygenNeed(f);
    if (isAdult(f) && o2) bed(T.ecg, 'suggested', `New oxygen requirement (${o2})`, 'local');
    if (isAdult(f) && f.cardiacHistory && (!complaint(f, MINOR_RE) || f.ews.score >= 3)) bed(T.ecg, 'suggested', `Significant cardiac history (${f.cardiacHistory} in PMH)`, 'local');

    // Blood gas (lactate, glucose, potassium, sodium, pH, CO2). Low threshold (agreed 23 October 2026):
    // suggest it wherever any of these would help, because it comes from the same venous sample.
    if (sepsisHigh(f)) bed(T.vbg, 'now', `${sepsisName(f)} - blood gas including glucose and lactate`, sepsisSource(f));
    else if (sepsisMedium(f)) bed(T.vbg, 'now', `${sepsisName(f)} - blood gas including glucose and lactate (lactate reviewed within 1 hour)`, sepsisSource(f));
    if (n2 !== null && (n2 >= 3 || f.ews.redParam) && !sepsisHigh(f) && !sepsisMedium(f)) bed(T.vbg, 'suggested', `${ewsLabel(f)}${n2 >= 3 ? ' (3 or more)' : ' with a single red score'} - lactate and gas for the clinician`, 'local');
    if (f.ews.type === 'PEWS' && f.ews.score >= 5 && !sepsisHigh(f) && !sepsisMedium(f)) bed(T.vbg, 'suggested', `${ewsLabel(f)} - lactate and gas for the clinician`, 'local');
    if (shock) bed(T.vbg, 'now', `Shocked (${shock}) - lactate`, 'local');
    if (rc) bed(T.vbg, 'suggested', `${rc} - glucose, sodium, CO2 and lactate`, 'local');
    if (complaint(f, /^Abdominal Pain in Adults$/)) bed(T.vbg, 'suggested', 'Abdominal pain - lactate (bowel ischaemia, sepsis), glucose and potassium', 'local');
    if (complaint(f, /^Overdose and Poisoning$/) || (complaint(f, /^Self Harm$/) && disc(f, /overdose|poison|ingest/i))) bed(T.vbg, 'suggested', 'Overdose or poisoning - pH, lactate, glucose and potassium (many poisons cause acidosis)', 'local');
    if (disc(f, /smoke|carbon monoxide|inhalation injury/i)) bed(T.vbg, 'suggested', 'Smoke or carbon monoxide exposure - carboxyhaemoglobin on the gas', 'local');
    if (complaint(f, /^Diarrhoea and Vomiting$/) && (isAdult(f) || disc(f, /dehydrat/i))) bed(T.vbg, 'suggested', 'Diarrhoea and vomiting - potassium, sodium, bicarbonate and lactate', 'local');
    if (isChild(f) && disc(f, /dehydrat|bile-stained/i) && !complaint(f, /^Diarrhoea and Vomiting$/)) bed(T.vbg, 'suggested', `${f.discriminator} - electrolytes, glucose and lactate`, 'local');
    if (isAdult(f) && complaint(f, /^(Collapse|Unwell Adult|Confusion|Elderly Care \/ Off Legs|Shortness of Breath in Adults|Gastrointestinal Bleeding|Diabetes)$/)) bed(T.vbg, 'suggested', `${f.complaint} - lactate, potassium, glucose and haemoglobin in minutes`, 'local');
    if (isAdult(f) && o2) bed(T.vbg, 'suggested', `New oxygen requirement (${o2}) - pH and CO2`, 'local');
    if (has(f.obs.temp) && (Number(f.obs.temp) < 35 || Number(f.obs.temp) >= 40)) bed(T.vbg, 'suggested', `Temperature ${f.obs.temp}°C - lactate, glucose and potassium`, 'local');
    if (isAdult(f) && has(f.obs.hr) && (Number(f.obs.hr) <= 40 || Number(f.obs.hr) >= 131)) bed(T.vbg, 'suggested', `Heart rate ${f.obs.hr} - potassium`, 'local');
    if (f.flags.dialysis && (f.ews.score >= 1 || f.infection === 'yes' || disc(f, /weak|vomit|palpit/i))) bed(T.vbg, 'suggested', 'Dialysis patient who is unwell - potassium in minutes', 'local');
    if (dka) bed(T.vbg, 'now', `${dka} - pH and bicarbonate grade DKA`, isChild(f) ? 'bspedDka' : 'jbdsDka');
    else if (ketoNeed && toNumber(f.obs.ketones) === null) bed(T.vbg, 'consider', '', 'local', { when: 'ketones are above 3.0 (DKA - pH and bicarbonate)' });
    if (neut) bed(T.vbg, 'suggested', `${neut} - possible neutropenic sepsis`, 'cg151');

    // Blood cultures
    const cultureTiming = 'Take before antibiotics - but never delay antibiotics to get them';
    if (sepsisHigh(f) || sepsisMedium(f)) bed(T.cultures, 'now', sepsisName(f), sepsisSource(f), { timing: cultureTiming });
    if (neut) bed(T.cultures, 'now', `${neut} - possible neutropenic sepsis`, 'cg151', { timing: cultureTiming });
    if (f.feverTL === 'Red') bed(T.cultures, 'suggested', 'NICE fever traffic light RED (under 5) - for the clinician', 'ng143', { timing: cultureTiming });

    // Urine
    const a = age(f);
    if (isChild(f) && a < 5 && f.feverTL) bed(T.childUrine, 'suggested', 'Fever in a child under 5 - urine sample to look for UTI', 'ng143');
    if (f.pregnant && ((has(f.obs.sbp) && Number(f.obs.sbp) >= 140) || (has(f.obs.dbp) && Number(f.obs.dbp) >= 90))) {
        bed(T.urine, 'suggested', `Pregnant with BP ${f.obs.sbp ?? '?'}/${f.obs.dbp ?? '?'} (140/90 or more) - test for proteinuria`, 'ng133');
    }

    // Pregnancy test: whatever the complaint for anyone who could be pregnant; urgent where ectopic is possible.
    if (couldBePregnant(f)) {
        const why = f.sex === 'Female' && a !== null ? 'Could be pregnant (aged 12-55) - exclude pregnancy before imaging or medicines' : 'Age or sex not recorded yet - offer if the patient could be pregnant';
        add(T.hcg, 'Universal', 'suggested', why, 'pregnancyEnquiry');
        if (complaint(f, /Abdominal Pain|PV Bleeding|Collapse|Urinary Problems|Diarrhoea and Vomiting/) || disc(f, LOC_RE) || disc(f, /shoulder tip/i)) {
            add(T.hcg, 'Universal', 'now', `${f.complaint || 'Symptoms'} in someone who could be pregnant - ectopic pregnancy must be excluded`, 'ng126');
        }
    }

    // Neuro obs
    if (rc) bed(T.neuro, 'suggested', `${rc} - detect deterioration`, 'local');
    if (f.headInjury && f.ng232 && f.ng232 !== 'none') bed(T.neuro, 'suggested', 'Head injury meeting NICE criteria', 'ng232', { timing: 'NICE NG232: half-hourly until GCS 15, then half-hourly for 2 hours, hourly for 4 hours, then 2-hourly' });

    // Weight for children (doses and fluids)
    if (isChild(f) && !has(f.weight)) bed(T.weight, 'suggested', 'Child - measured weight for doses and fluids', 'local');

    // Pregnant with abdominal pain (any flowchart): both bundles and a blood gas (Jake, 31 October 2026).
    const pregAbdo = f.pregnant && (complaint(f, /Abdominal Pain/) || disc(f, /abdo(minal)? pain/i));
    if (pregAbdo) bed(T.vbg, 'suggested', 'Pregnant with abdominal pain - lactate, Hb and glucose', 'local');

    // ---- 3. Bloods: cross-cutting bundles ----
    if (pregAbdo) {
        blood('AE Abdominal Pain', 'suggested', 'Pregnant with abdominal pain - abdominal pain bundle', 'local');
        blood('AE - PV Bleed - Pregnant', 'suggested', 'Pregnant with abdominal pain - also the pregnancy bundle (Hb, group and save, Rhesus)', 'local');
    }
    if (isAdult(f) && (sepsisHigh(f) || sepsisMedium(f))) blood('AE - Sepsis', 'now', `${sepsisName(f)} - NICE also lists LFTs and "consider procalcitonin"`, 'ng253');
    if (isChild(f) && (sepsisHigh(f) || sepsisMedium(f))) blood('AE - Sepsis (Paediatric)', 'now', `${sepsisName(f)} - NICE lists FBC, CRP, U&E, creatinine, LFTs and clotting`, 'ng254');
    if (isAdult(f) && neut) blood('AE - Sepsis', 'now', `${neut} - possible neutropenic sepsis (add FBC differential per local pathway)`, 'cg151');
    if (isChild(f) && (f.feverTL === 'Red' || neut)) blood('AE - Sepsis (Paediatric)', 'suggested', f.feverTL === 'Red' ? 'NICE fever traffic light RED (under 5)' : `${neut} - possible neutropenic sepsis`, f.feverTL === 'Red' ? 'ng143' : 'cg151');
    if (bleed) blood('Major Bleed Procedure', 'now', bleed, 'local', { timing: 'Major haemorrhage: follow the local major haemorrhage protocol' });
    if (f.headInjury && f.flags.anticoag) blood('AE Head Injury on Warfarin', 'suggested', 'Head injury while on an anticoagulant (any, not only warfarin)', 'local');
    if (dka || (ketoNeed && isAdult(f))) blood('AE - Hypoglycaemia - Hyperglycaemia', dka ? 'now' : 'suggested', dka ? `${dka} - possible DKA` : ketoNeed, dka ? (isChild(f) ? 'bspedDka' : 'jbdsDka') : (/SGLT2/.test(ketoNeed) ? 'mhraSglt2' : 'jbdsDka'));

    // Sample timing notes for bundles the complaint plan may already offer.
    const timingFor = {
        'AE DSH Overdose': 'Paracetamol level from 4 hours after ingestion (the treatment nomogram starts at 4 hours). Staggered or unknown-time overdose: tell the clinician now - acetylcysteine is given without waiting for a level (MHRA)',
        'AE Anaphylaxis': 'Mast cell tryptase (NICE NG258): first sample as soon as possible after emergency treatment starts, second ideally within 1-2 hours (no later than 4 hours) of symptom onset. Under 16s: only consider (venom, drug or unknown cause)',
        'AE Acute Coronary Syndrome': 'Troponin: repeat per the local high-sensitivity troponin pathway'
    };
    items.forEach(it => { if (it.category === 'Bloods' && timingFor[it.name] && !it.timing) it.timing = timingFor[it.name]; });

    // ---- 4. Safety rewrites ----
    // UKHSA: do not use urine dipsticks to diagnose UTI in people over 65 - send a sample for culture only
    // if there are urinary symptoms or signs of infection.
    if (a !== null && a > 65) {
        const dip = items.get(`Bedside|${T.urine}`);
        if (dip && !f.pregnant) {
            items.delete(`Bedside|${T.urine}`);
            bed(T.msu, 'consider', '', 'ukhsaUti', {
                when: 'new urinary symptoms or signs of infection',
                why: 'Over 65: urine dipsticks are not reliable for diagnosing UTI - send a sample for culture only if UTI is clinically suspected',
                caution: 'Dipstick not used to diagnose UTI in people over 65 (UKHSA)'
            });
            notes.push({ text: 'Over 65: no urine dipstick to look for infection - a positive dip is common without infection (UKHSA). Send a urine culture only if there are urinary symptoms or signs of infection.', source: 'ukhsaUti' });
        }
    }
    if (proto && proto.bloodsNote) notes.push({ text: proto.bloodsNote, source: 'local' });

    // Items with nothing that fired stay "consider"; anything suggested by a rule loses its "consider if" hint.
    const list = [...items.values()].map(it => ({ ...it, when: it.status === 'consider' ? it.when : '' }));
    const order = (x) => ITEM_STATUSES.indexOf(x.status);
    list.sort((x, y) => order(x) - order(y));

    const cannula = cannulaDecision(f, { shock, bleed, neut, hypo, dka, rc, bloodsSuggested: list.some(i => i.category === 'Bloods' && i.status !== 'consider') });
    return { cannula, items: list, notes, facts: f };
}

// ------------------------------------------------------------------------------------------------
// Cannula: separate "does this patient need IV access?" from "do they need bloods?". Bloods alone
// can be taken by venepuncture; an idle cannula is an infection risk with no benefit.
// ------------------------------------------------------------------------------------------------
const gaugeOf = (size) => { const m = String(size || '').match(/(\d{2})G/); return m ? Number(m[1]) : 99; };
const countOf = (size) => (/x\s*2/i.test(String(size || '')) ? 2 : 1);
const biggerSize = (a, b) => {
    if (!a) return b; if (!b) return a;
    if (countOf(a) !== countOf(b)) return countOf(a) > countOf(b) ? a : b;
    return gaugeOf(a) <= gaugeOf(b) ? a : b;
};

export function cannulaDecision(input, pre = null) {
    const f = normaliseFacts(input);
    const p = pre || { shock: shocked(f), bleed: majorBleed(f), neut: neutropenicSepsis(f), hypo: hypoglycaemia(f), dka: dkaLikely(f), rc: reducedConsciousness(f), bloodsSuggested: false };
    const child = isChild(f);
    const reasons = [];
    let decision = 'not-needed', size = null;
    const fire = (level, text, source = 'local', sz = null) => {
        reasons.push({ level, text, source });
        decision = better(CANNULA_LEVELS, level, decision);
        if (sz) size = biggerSize(size, sz);
    };

    // Complaint default (protocols.js): recommended / consider / not routine.
    const pc = f.protocol && f.protocol.cannula;
    if (pc) {
        const lvl = pc.status === 'recommended' ? 'recommended' : (pc.status === 'consider' ? 'consider' : null);
        if (lvl) fire(lvl, `${f.complaint}: ${pc.reason}`, 'local', pc.size);
        size = size || pc.size;
    }

    const big = child ? null : '18G';
    // Insert now
    if (f.level === 'Red') fire('now', 'Red category', 'local', big);
    if (p.bleed) fire('now', `${p.bleed} - large-bore access`, 'local', child ? null : '14G/16G x2');
    else if (p.shock) fire('now', `Shocked (${p.shock})`, 'local', child ? null : '16G/18G x2');
    if (news(f) !== null && news(f) >= 7) fire('now', `${ewsLabel(f)} (7 or more) - emergency response`, 'local', big);
    if (f.ews.type === 'PEWS' && f.ews.score >= 7) fire('now', `${ewsLabel(f)} (high)`, 'local');
    if (sepsisHigh(f)) fire('now', `${sepsisName(f)} - antibiotics within 1 hour`, sepsisSource(f), big);
    if (p.neut) fire('now', `${p.neut} - possible neutropenic sepsis: empiric antibiotics immediately (medical emergency)`, 'cg151', big);
    if (f.feverTL === 'Red' && child) fire('recommended', 'NICE fever traffic light RED (under 5) - senior review; IV access likely', 'ng143');
    if (disc(f, /actively seizing|status epilepticus|fitting now/i)) fire('now', 'Actively seizing - IV lorazepam if access is immediately available; otherwise do not delay buccal midazolam or rectal diazepam to get it', 'ng217', big);
    if (complaint(f, /Suspected Stroke/) && (f.lkwHours === null || f.lkwHours <= 24)) fire('now', f.lkwHours === null ? 'Suspected stroke - time last known well not yet recorded' : `Suspected stroke, last known well ${Math.round(f.lkwHours * 10) / 10} h ago - possible thrombolysis or thrombectomy (the stroke team needs IV access)`, 'ng128', '18G');
    if (complaint(f, /^(Allergy|Bites and Stings|Rash)$/) && disc(f, /airway compromise|shock|stridor|anaphylaxis/i)) fire('now', 'Anaphylaxis - give IM adrenaline first; do not delay it for IV access', 'rcukAnaphylaxis', big);
    if (p.dka) fire('now', `${p.dka} - possible DKA: IV fluids and insulin`, child ? 'bspedDka' : 'jbdsDka', big);
    if (p.hypo && p.rc) fire('now', `${p.hypo} with reduced consciousness - cannot take oral glucose`, 'local', child ? null : '20G');

    // Recommended
    if (news(f) !== null && news(f) >= 5 && news(f) < 7) fire('recommended', `${ewsLabel(f)} (5-6) - urgent response`, 'local', big);
    if (f.ews.type === 'PEWS' && f.ews.score >= 5 && f.ews.score < 7) fire('recommended', `${ewsLabel(f)}`, 'local');
    if (f.ews.type === 'MEOWS' && f.ews.score >= 3) fire('recommended', `${ewsLabel(f)} - maternity review`, 'local');
    if (sepsisMedium(f)) fire('recommended', f.sepsisGuideline === 'NG254' ? `${sepsisName(f)} - lactate reviewed within 1 hour; over 2 means treat as high risk` : 'NG253 medium risk sepsis - antibiotics may be deferred for up to 3 hours, but may be needed sooner', sepsisSource(f), big);
    if (disc(f, /neck of femur/i)) fire('recommended', 'Suspected hip fracture - fluids and bloods', 'local', '18G');
    if (f.headInjury && f.flags.anticoag && f.ng232 && f.ng232 !== 'none') fire('recommended', 'Anticoagulated head injury meeting NICE CT criteria - reversal may be needed', 'local', '18G');
    if (disc(f, /severe dehydration/i)) fire('recommended', 'Severe dehydration - IV fluids likely', 'local');
    if (disc(f, /^signs of dehydration$/i)) fire('consider', 'Signs of dehydration - IV fluids only if oral or NG rehydration is not possible or fails', 'local');
    if (complaint(f, /^Asthma$/) && disc(f, /life threatening|severe distress/i)) fire('recommended', 'Acute severe or life-threatening asthma - IV magnesium sulphate (and IV steroid if unable to swallow) may follow nebulisers', 'sign158', big);
    if (complaint(f, /Shortness of Breath in Adults/) && (disc(f, /severe respiratory distress|moderate respiratory distress|stridor|new confusion/i) || (has(f.obs.sats) && Number(f.obs.sats) < 92))) fire('recommended', 'Hypoxic or in respiratory distress - IV treatment (diuretic, antibiotics, magnesium) is likely', 'local', big);
    if (complaint(f, /^Palpitations$/) && (disc(f, /rate\s*>\s*150/i) || (has(f.obs.hr) && Number(f.obs.hr) > 150))) fire('recommended', 'Tachyarrhythmia over 150 - IV adenosine or rate control is likely once the ECG is seen', 'local', big);
    if (complaint(f, /Overdose and Poisoning|Self Harm/) && disc(f, /high-risk substance|altered gcs|abnormal vital signs/i)) fire('recommended', 'Overdose with a high-risk substance or physiological effect - antidote or IV treatment is likely', 'local', big);
    if (complaint(f, /Gastrointestinal Bleeding/) && disc(f, /haematemesis|melaena/i)) fire('recommended', 'Active upper GI bleeding - can decompensate quickly; access while the veins are easy', 'local', big);
    if (complaint(f, /Torso Injury/) && disc(f, /stab|gunshot|flail/i)) fire('now', 'Penetrating torso injury or flail chest - trauma team, blood products possible', 'local', child ? null : '16G x2');

    // Consider
    // Orange on its own does not need a cannula (Jake, 31 October 2026): like Yellow it is only "consider".
    if (f.level === 'Orange' && !f.painOnlyOrange) fire('consider', 'Orange category - only if IV treatment is likely soon', 'local');
    if (f.level === 'Yellow') fire('consider', 'Yellow category', 'local');
    if (f.painOnlyOrange || (has(f.pain) && Number(f.pain) >= 8)) fire('consider', `Severe pain${has(f.pain) ? ` ${f.pain}/10` : ''} - only if IV analgesia is likely (offer oral, inhaled or intranasal first)`, 'local');
    if (f.flags.sickle && (has(f.pain) ? Number(f.pain) >= 1 : true)) fire('consider', 'Sickle cell painful episode - analgesia within 30 minutes of presentation; route per the patient\'s care plan', 'cg143');

    // A complaint default is only a default: a Green or Blue patient with nothing else firing does
    // not need IV access yet. "Recommended" drops to "consider"; "consider" drops to "not needed now".
    const onlyDefault = reasons.every(r => r.text.startsWith(`${f.complaint}:`));
    if ((f.level === 'Green' || f.level === 'Blue') && onlyDefault && reasons.length) {
        if (decision === 'recommended') {
            decision = 'consider';
            reasons.push({ level: 'consider', text: `${f.level} category with no other trigger - the ${f.complaint.toLowerCase()} default is lowered to "consider"`, source: 'local' });
        } else if (decision === 'consider') {
            decision = 'not-needed';
            reasons.push({ level: 'not-needed', text: `${f.level} category with no other trigger - no IV need is expected; bloods (if any) by venepuncture`, source: 'local' });
        }
    }

    // Sizes for children: the complaint default (smaller) wins over adult sizes.
    if (child) size = (pc && pc.size && gaugeOf(pc.size) >= 22 ? pc.size : '22G or smaller (to fit the vein)');

    const cautions = [];
    if (f.flags.dialysis) cautions.push('Dialysis: no cannula, bloods or BP cuff on the fistula arm');
    if (complaint(f, /Suspected Stroke/)) cautions.push('Use the unaffected arm where possible');
    if (complaint(f, /Limb Problems|Burns and Scalds|Wounds|Self Harm/)) cautions.push('Avoid the injured or burnt limb');
    if (child && decision !== 'not-needed') cautions.push('Child: topical anaesthetic and distraction if time allows; a senior should decide unless the child is critically ill');
    if (decision === 'now' && /anaphylaxis|seizing/i.test(reasons.map(r => r.text).join(' '))) cautions.push('Do not delay first-line IM or buccal treatment to get IV access');

    const venepuncture = decision !== 'now' && decision !== 'recommended' && p.bloodsSuggested;
    const notes = ['App default: cannulate only when IV treatment, IV contrast or another IV need is likely soon. National guidance: remove a cannula as soon as it is no longer needed (epic3, NICE QS61).'];
    if (venepuncture) notes.unshift('Bloods are suggested but IV access is not yet needed: take them by venepuncture.');

    return { decision, label: CANNULA_LABELS[decision], size: decision === 'not-needed' ? null : size, reasons, cautions, venepuncture, notes, notesSources: ['epic3', 'qs61'] };
}
