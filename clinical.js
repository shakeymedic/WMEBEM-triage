// clinical.js - pure clinical calculations (no DOM, no state). Every rule here is covered by
// tests/clinical.test.mjs; change a threshold only together with its test and its cited source.

export const has = (v) => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && Number.isNaN(v));

export function toNumber(v) {
    if (!has(v)) return null;
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
}

const band = (val, buckets) => {
    const m = buckets.find(b => val <= b.max);
    return m ? m.score : 3;
};

// ---------------------------------------------------------------------------------------------
// Triage categories (Manchester Triage System colours).
// ---------------------------------------------------------------------------------------------
export const LEVELS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue'];
const rank = (l) => (l ? LEVELS.indexOf(l) : 99);
export const higher = (a, b) => (rank(a) <= rank(b) ? a : b);

// MTS target times in minutes (Red immediate, Orange 10, Yellow 60, Green 120, Blue 240).
export const DEFAULT_TARGET_MINUTES = { Red: 0, Orange: 10, Yellow: 60, Green: 120, Blue: 240 };

export function seeBy(arrival, level, targets = DEFAULT_TARGET_MINUTES) {
    if (!arrival || !level || !(level in targets)) return null;
    return new Date(new Date(arrival).getTime() + targets[level] * 60000);
}

// ---------------------------------------------------------------------------------------------
// NEWS2 (Royal College of Physicians, 2017). Seven parameters; the score is only a valid NEWS2
// when all seven are recorded. A partial score is a MINIMUM - it can escalate, never reassure.
// ---------------------------------------------------------------------------------------------
export const NEWS2_PARAMS = [
    { key: 'rr', label: 'RR' }, { key: 'sats', label: 'SpO2' }, { key: 'o2', label: 'Air/O2' },
    { key: 'sbp', label: 'Systolic BP' }, { key: 'hr', label: 'HR' }, { key: 'avpu', label: 'Consciousness' },
    { key: 'temp', label: 'Temp' }
];

// Scale 2 (target 88-92%, hypercapnic respiratory failure). High saturations only score when the
// patient is on supplemental oxygen: >=93% on air scores 0.
export function spo2Scale2(sats, onOxygen) {
    if (sats <= 83) return 3;
    if (sats <= 85) return 2;
    if (sats <= 87) return 1;
    if (sats <= 92) return 0;
    if (!onOxygen) return 0;
    if (sats <= 94) return 1;
    if (sats <= 96) return 2;
    return 3;
}

export function news2(obs, rules) {
    const params = [];
    const missing = [];
    const add = (key, label, value, points) => params.push({ key, label, value, points });

    if (has(obs.rr)) add('rr', 'RR', obs.rr, band(obs.rr, rules.rr)); else missing.push('RR');
    if (has(obs.sats)) {
        const pts = obs.scale2 ? spo2Scale2(obs.sats, obs.o2 === 'O2') : band(obs.sats, rules.sats1);
        add('sats', obs.scale2 ? 'SpO2 (scale 2)' : 'SpO2', obs.sats, pts);
    } else missing.push('SpO2');
    if (obs.o2 === 'O2' || obs.o2 === 'Air') add('o2', 'O2', obs.o2 === 'O2' ? 'On O2' : 'Air', obs.o2 === 'O2' ? 2 : 0);
    else missing.push('Air/O2');
    if (has(obs.sbp)) add('sbp', 'BP', obs.sbp, band(obs.sbp, rules.sbp)); else missing.push('Systolic BP');
    if (has(obs.hr)) add('hr', 'HR', obs.hr, band(obs.hr, rules.hr)); else missing.push('HR');
    // ACVPU: new confusion (C), voice, pain or unresponsive all score 3.
    if (has(obs.avpu)) add('avpu', 'ACVPU', obs.avpu, obs.avpu === 'A' ? 0 : 3); else missing.push('Consciousness');
    if (has(obs.temp)) add('temp', 'Temp', obs.temp, band(obs.temp, rules.temp)); else missing.push('Temp');

    const score = params.reduce((s, p) => s + p.points, 0);
    return {
        score,
        params,
        missing,
        complete: missing.length === 0,
        redParam: params.some(p => p.points === 3),
        recorded: params.length
    };
}

// RCP NEWS2 clinical risk and minimum monitoring frequency (minutes; 0 = continuous).
export function news2Response(score, redParam) {
    if (score >= 7) return { risk: 'High', monitorMins: 0, monitorText: 'continuous monitoring' };
    if (score >= 5) return { risk: 'Medium', monitorMins: 60, monitorText: 'at least hourly' };
    if (redParam) return { risk: 'Low-medium', monitorMins: 60, monitorText: 'at least hourly' };
    if (score >= 1) return { risk: 'Low', monitorMins: 240, monitorText: 'at least every 4-6 hours' };
    return { risk: 'Low', monitorMins: 720, monitorText: 'at least every 12 hours' };
}

// ---------------------------------------------------------------------------------------------
// Local PEWS (not the national PEWS/SPOT chart - see protocols.js). Unset fields never score.
// ---------------------------------------------------------------------------------------------
export function pewsGroup(age) {
    if (age < 1) return 'infant';
    if (age < 5) return 'toddler';
    if (age < 12) return 'child';
    return 'teen';
}

export function localPews(obs, age, rules) {
    const group = pewsGroup(age);
    const data = rules[group];
    const params = [];
    const missing = [];
    const add = (key, label, value, points) => params.push({ key, label, value, points });
    if (has(obs.rr)) add('rr', 'RR', obs.rr, band(obs.rr, data.rr)); else missing.push('RR');
    if (has(obs.hr)) add('hr', 'HR', obs.hr, band(obs.hr, data.hr)); else missing.push('HR');
    if (has(obs.sats)) add('sats', 'SpO2', obs.sats, obs.sats < 94 ? 3 : 0); else missing.push('SpO2');
    if (obs.o2 === 'O2' || obs.o2 === 'Air') add('o2', 'O2', obs.o2 === 'O2' ? 'On O2' : 'Air', obs.o2 === 'O2' ? 2 : 0); else missing.push('Air/O2');
    if (has(obs.crt)) add('crt', 'CRT', obs.crt, obs.crt > 2 ? 1 : 0); else missing.push('CRT');
    if (has(obs.avpu)) add('avpu', 'ACVPU', obs.avpu, obs.avpu === 'A' ? 0 : 3); else missing.push('Consciousness');
    const score = params.reduce((s, p) => s + p.points, 0);
    return { score, params, missing, complete: missing.length === 0, group, redParam: params.some(p => p.points === 3), recorded: params.length };
}

// ---------------------------------------------------------------------------------------------
// Local MEOWS trigger chart, translated to a score. Unset fields never score. Any altered
// consciousness is treated as a red trigger (conservative - the previous version ignored it).
// ---------------------------------------------------------------------------------------------
export function localMeows(obs) {
    const params = [];
    const missing = [];
    const add = (key, label, value, points, tag) => params.push({ key, label, value, points, tag });
    if (has(obs.rr)) {
        if (obs.rr < 10 || obs.rr > 30) add('rr', 'RR', obs.rr, 3, 'Red');
        else if (obs.rr > 20) add('rr', 'RR', obs.rr, 1, 'Yellow');
        else add('rr', 'RR', obs.rr, 0);
    } else missing.push('RR');
    if (has(obs.hr)) {
        if (obs.hr < 40 || obs.hr > 120) add('hr', 'HR', obs.hr, 3, 'Red');
        else if (obs.hr > 100) add('hr', 'HR', obs.hr, 1, 'Yellow');
        else add('hr', 'HR', obs.hr, 0);
    } else missing.push('HR');
    if (has(obs.sbp)) {
        if (obs.sbp < 90 || obs.sbp > 160) add('sbp', 'SBP', obs.sbp, 3, 'Red');
        else if (obs.sbp > 150) add('sbp', 'SBP', obs.sbp, 1, 'Yellow');
        else add('sbp', 'SBP', obs.sbp, 0);
    } else missing.push('Systolic BP');
    if (has(obs.dbp)) {
        if (obs.dbp > 100) add('dbp', 'DBP', obs.dbp, 3, 'Red');
        else if (obs.dbp >= 90) add('dbp', 'DBP', obs.dbp, 1, 'Yellow');
        else add('dbp', 'DBP', obs.dbp, 0);
    } else missing.push('Diastolic BP');
    if (has(obs.sats)) add('sats', 'SpO2', obs.sats, obs.sats < 95 ? 3 : 0, obs.sats < 95 ? 'Red' : undefined); else missing.push('SpO2');
    if (has(obs.temp)) {
        if (obs.temp > 38 || obs.temp < 35) add('temp', 'Temp', obs.temp, 3, 'Red');
        else if (obs.temp > 37.5 || obs.temp < 36) add('temp', 'Temp', obs.temp, 1, 'Yellow');
        else add('temp', 'Temp', obs.temp, 0);
    } else missing.push('Temp');
    if (has(obs.avpu)) add('avpu', 'ACVPU', obs.avpu, obs.avpu === 'A' ? 0 : 3, obs.avpu === 'A' ? undefined : 'Red');
    else missing.push('Consciousness');
    const score = params.reduce((s, p) => s + p.points, 0);
    return { score, params, missing, complete: missing.length === 0, redParam: params.some(p => p.points === 3), recorded: params.length };
}

// ---------------------------------------------------------------------------------------------
// Suspected sepsis, NICE NG253 (people 16+, not pregnant/recently pregnant) in acute hospital
// settings: risk is stratified by NEWS2, and only once infection is suspected or confirmed.
// ---------------------------------------------------------------------------------------------
export function sepsisNG253({ age, pregnant, infection, news }) {
    if (age === null || age === undefined) return { applicable: false, status: 'no-age', text: 'Record age to use the NG253 sepsis tool.' };
    if (age < 16) return { applicable: false, status: 'paeds', text: 'NG253 covers people 16 or over - use the paediatric sepsis pathway and PEWS/traffic light.' };
    if (pregnant) return { applicable: false, status: 'pregnant', text: 'NG253 excludes pregnant or recently pregnant people - use the maternity sepsis pathway.' };
    if (infection !== 'yes') {
        return infection === 'no'
            ? { applicable: true, status: 'not-suspected', text: 'Infection not suspected - NG253 sepsis risk not applied.' }
            : { applicable: true, status: 'not-asked', text: 'Could this be an infection? Answer to apply the NG253 sepsis risk.' };
    }
    const s = news.score;
    let risk, actions, reassessMins;
    if (s >= 7) {
        risk = 'High';
        actions = 'Senior review. Broad-spectrum IV antibiotics within 1 hour of calculating NEWS2. Re-check NEWS2 every 30 minutes.';
        reassessMins = 30;
    } else if (s >= 5) {
        risk = 'Moderate';
        actions = 'Review by a clinician (FY2 or above). Antibiotics may be deferred for up to 3 hours after the first NEWS2 while the cause is clarified. Re-check NEWS2 hourly.';
        reassessMins = 60;
    } else if (s >= 1) {
        risk = 'Low';
        actions = 'Clinician assessment. If infection is confirmed, infection tests (e.g. 2 sets of blood cultures) and antibiotics within 6 hours. Re-check NEWS2 every 4-6 hours.';
        reassessMins = 240;
    } else {
        risk = 'Very low';
        actions = 'Clinical judgement; routine monitoring.';
        reassessMins = 720;
    }
    const judgement = news.redParam && s >= 3 && s <= 4
        ? 'A single parameter scores 3: if that is caused by the infection, manage as moderate or high risk.'
        : '';
    const incomplete = !news.complete;
    // A partial NEWS2 of 7+ is already high risk; anything lower can only be provisional.
    const provisional = incomplete && risk !== 'High';
    return { applicable: true, status: 'assessed', risk, actions, judgement, reassessMins, provisional, text: `${risk} risk (NEWS2 ${incomplete ? '>=' : ''}${s})` };
}

// ---------------------------------------------------------------------------------------------
// Manchester Triage System pain ruler: 1-4 mild, 5-7 moderate (Yellow), 8-10 severe (Orange).
// ---------------------------------------------------------------------------------------------
export function mtsPain(score) {
    if (!has(score)) return null;
    if (score >= 8) return { band: 'Severe', floor: 'Orange' };
    if (score >= 5) return { band: 'Moderate', floor: 'Yellow' };
    if (score >= 1) return { band: 'Mild', floor: null };
    return { band: 'No pain', floor: null };
}

// ---------------------------------------------------------------------------------------------
// Priority: the nurse's discriminator (or "none apply" = Blue) sets the base; safety floors from
// obs, pain etc. can only raise it. With neither, the patient is NOT YET TRIAGED - never Blue.
// ---------------------------------------------------------------------------------------------
export function triagePriority({ discriminator, noneApply, floors = [], override }) {
    const reasons = [];
    let base = null;
    if (discriminator) { base = discriminator.priority; reasons.push(`MTS: ${discriminator.text}`); }
    else if (noneApply) { base = 'Blue'; reasons.push('MTS: none of the discriminators apply'); }
    let final = base;
    floors.forEach(f => {
        if (!f || !f.level) return;
        if (final === null || rank(f.level) < rank(final)) {
            final = f.level;
            reasons.push(f.reason);
        } else if (f.always) {
            reasons.push(f.reason);
        }
    });
    if (override && override.level && override.reason) {
        final = override.level;
        reasons.push(`OVERRIDE: ${override.reason}`);
    }
    return { base, final, reasons, triaged: base !== null || !!(override && override.level && override.reason), provisional: base === null && final !== null && !(override && override.level) };
}

// ---------------------------------------------------------------------------------------------
// NICE NG143 fever in under 5s - traffic light (obs-derived items; clinical items are ticked).
// ---------------------------------------------------------------------------------------------
export const NG143_ITEMS = {
    red: [
        ['pale_mottled', 'Pale / mottled / ashen / blue (skin, lips or tongue)'],
        ['no_social', 'No response to social cues'],
        ['appears_ill', 'Appears ill to a healthcare professional'],
        ['wont_wake', 'Does not wake, or if roused does not stay awake'],
        ['weak_cry', 'Weak, high-pitched or continuous cry'],
        ['grunting', 'Grunting'],
        ['indrawing', 'Moderate or severe chest indrawing'],
        ['skin_turgor', 'Reduced skin turgor'],
        ['non_blanching', 'Non-blanching rash'],
        ['bulging_fontanelle', 'Bulging fontanelle'],
        ['neck_stiffness', 'Neck stiffness'],
        ['status_epilepticus', 'Status epilepticus'],
        ['focal_neuro', 'Focal neurological signs'],
        ['focal_seizures', 'Focal seizures']
    ],
    amber: [
        ['pallor_reported', 'Pallor reported by parent or carer'],
        ['not_normal_social', 'Not responding normally to social cues / no smile'],
        ['prolonged_stim', 'Wakes only with prolonged stimulation'],
        ['decreased_activity', 'Decreased activity'],
        ['nasal_flaring', 'Nasal flaring'],
        ['crackles', 'Crackles in the chest'],
        ['dry_mucous', 'Dry mucous membranes'],
        ['poor_feeding', 'Poor feeding (infants)'],
        ['reduced_urine', 'Reduced urine output'],
        ['fever_5_days', 'Fever for 5 days or more'],
        ['rigors', 'Rigors'],
        ['limb_swelling', 'Swelling of a limb or joint'],
        ['non_weight_bearing', 'Non-weight bearing / not using an extremity']
    ]
};

export function ng143TrafficLight({ age, obs, ticks = {} }) {
    if (age === null || age === undefined || age >= 5) return { applicable: false };
    const red = [], amber = [];
    const months = age * 12;
    if (has(obs.temp)) {
        if (months < 3 && obs.temp >= 38) red.push(`Age under 3 months with temperature ${obs.temp}°C (>=38°C)`);
        else if (months >= 3 && months < 6 && obs.temp >= 39) amber.push(`Age 3-6 months with temperature ${obs.temp}°C (>=39°C)`);
    }
    if (has(obs.rr)) {
        if (obs.rr > 60) red.push(`RR ${obs.rr} (>60)`);
        else if (months >= 6 && months < 12 && obs.rr > 50) amber.push(`RR ${obs.rr} (>50 at 6-12 months)`);
        else if (months >= 12 && obs.rr > 40) amber.push(`RR ${obs.rr} (>40 over 12 months)`);
    }
    if (has(obs.hr)) {
        if (months < 12 && obs.hr > 160) amber.push(`HR ${obs.hr} (>160 under 12 months)`);
        else if (months >= 12 && months < 24 && obs.hr > 150) amber.push(`HR ${obs.hr} (>150 at 12-24 months)`);
        else if (months >= 24 && obs.hr > 140) amber.push(`HR ${obs.hr} (>140 at 2-5 years)`);
    }
    if (has(obs.sats) && obs.o2 === 'Air' && obs.sats <= 95) amber.push(`SpO2 ${obs.sats}% in air (<=95%)`);
    if (has(obs.crt) && obs.crt >= 3) amber.push(`CRT ${obs.crt}s (>=3s)`);
    NG143_ITEMS.red.forEach(([k, t]) => { if (ticks[k]) red.push(t); });
    NG143_ITEMS.amber.forEach(([k, t]) => { if (ticks[k]) amber.push(t); });
    const obsRecorded = has(obs.temp) && has(obs.rr) && has(obs.hr);
    let level = null;
    if (red.length) level = 'Red';
    else if (amber.length) level = 'Amber';
    else if (obsRecorded) level = 'Green';
    return { applicable: true, level, red, amber, obsRecorded };
}

// ---------------------------------------------------------------------------------------------
// NICE NG232 head injury - CT head criteria (2023).
// ---------------------------------------------------------------------------------------------
export const NG232_ADULT_1H = [
    ['gcs13', 'GCS less than 13 on initial assessment in the ED'],
    ['gcs15_2h', 'GCS less than 15 at 2 hours after the injury'],
    ['open_depressed', 'Suspected open or depressed skull fracture'],
    ['basal', 'Any sign of basal skull fracture (haemotympanum, "panda" eyes, CSF leak from ear or nose, Battle\'s sign)'],
    ['seizure', 'Post-traumatic seizure'],
    ['focal', 'Focal neurological deficit'],
    ['vomit', 'More than 1 episode of vomiting']
];
export const NG232_ADULT_8H = [
    ['bleeding', 'Current bleeding or clotting disorder'],
    ['mechanism', 'Dangerous mechanism of injury'],
    ['retro30', 'More than 30 minutes\' retrograde amnesia of events before the injury']
];
export const NG232_CHILD_1H = [
    ['nai', 'Suspicion of non-accidental injury'],
    ['seizure', 'Post-traumatic seizure'],
    ['gcs_initial', 'Initial ED GCS less than 14 (under 1 year: paediatric GCS less than 15)'],
    ['gcs15_2h', 'GCS less than 15 at 2 hours after the injury'],
    ['open_depressed', 'Suspected open or depressed skull fracture, or tense fontanelle'],
    ['basal', 'Any sign of basal skull fracture'],
    ['focal', 'Focal neurological deficit'],
    ['under1_bruise', 'Under 1 year: bruise, swelling or laceration of more than 5 cm on the head']
];
export const NG232_CHILD_RISK = [
    ['loc5', 'Witnessed loss of consciousness lasting more than 5 minutes'],
    ['drowsy', 'Abnormal drowsiness'],
    ['vomit3', '3 or more discrete episodes of vomiting'],
    ['mechanism', 'Dangerous mechanism of injury'],
    ['amnesia5', 'Amnesia (anterograde or retrograde) lasting more than 5 minutes']
];

export function ng232({ age, answers = {}, anticoagulated = false }) {
    if (age === null || age === undefined) return { applicable: false, text: 'Record age to apply NICE NG232.' };
    const yes = (k) => !!answers[k];
    if (age >= 16) {
        const oneHour = NG232_ADULT_1H.filter(([k]) => yes(k)).map(([, t]) => t);
        if (oneHour.length) return { applicable: true, adult: true, level: '1h', text: 'CT head within 1 hour', because: oneHour };
        const factors = NG232_ADULT_8H.filter(([k]) => yes(k)).map(([, t]) => t);
        if (age >= 65) factors.unshift('Age 65 or over');
        if (yes('loc_amnesia') && factors.length) {
            return { applicable: true, adult: true, level: '8h', text: 'CT head within 8 hours of the injury (within 1 hour if presenting more than 8 hours after it)', because: ['Loss of consciousness or amnesia since the injury', ...factors] };
        }
        if (anticoagulated) {
            return { applicable: true, adult: true, level: 'consider8h', text: 'Consider CT head within 8 hours of the injury (within 1 hour if presenting more than 8 hours after it)', because: ['Anticoagulant, or antiplatelet other than aspirin alone'] };
        }
        return { applicable: true, adult: true, level: 'none', text: 'No NG232 CT indication from the answers so far - clinical judgement still applies', because: [] };
    }
    const oneHour = NG232_CHILD_1H.filter(([k]) => yes(k)).map(([, t]) => t);
    if (oneHour.length) return { applicable: true, adult: false, level: '1h', text: 'CT head within 1 hour', because: oneHour };
    const risks = NG232_CHILD_RISK.filter(([k]) => yes(k)).map(([, t]) => t);
    if (risks.length > 1) return { applicable: true, adult: false, level: '1h', text: 'CT head within 1 hour (more than 1 risk factor)', because: risks };
    if (risks.length === 1) return { applicable: true, adult: false, level: 'observe4h', text: 'Observe in hospital for at least 4 hours (1 risk factor)', because: risks };
    return { applicable: true, adult: false, level: 'none', text: 'No NG232 CT indication from the answers so far - clinical judgement still applies', because: anticoagulated ? ['On anticoagulant - discuss with a senior'] : [] };
}

// ---------------------------------------------------------------------------------------------
// ROSIER stroke recognition score. >0 = stroke likely; <=0 = unlikely but not excluded.
// ---------------------------------------------------------------------------------------------
export const ROSIER_ITEMS = [
    ['loc', 'Loss of consciousness or syncope', -1],
    ['seizure', 'Seizure activity', -1],
    ['face', 'Asymmetric facial weakness', 1],
    ['arm', 'Asymmetric arm weakness', 1],
    ['leg', 'Asymmetric leg weakness', 1],
    ['speech', 'Speech disturbance', 1],
    ['visual', 'Visual field defect', 1]
];

export function rosier(answers = {}) {
    const score = ROSIER_ITEMS.reduce((s, [k, , pts]) => s + (answers[k] ? pts : 0), 0);
    return { score, likely: score > 0, text: score > 0 ? `ROSIER ${score}: stroke likely` : `ROSIER ${score}: stroke unlikely but not excluded` };
}

// ---------------------------------------------------------------------------------------------
// 4AT delirium screen. Items: alertness 0/4, AMT4 0/1/2, attention 0/1/2, acute change 0/4.
// ---------------------------------------------------------------------------------------------
export function fourAT(a = {}) {
    const items = ['alertness', 'amt4', 'attention', 'acute'];
    if (items.some(k => !has(a[k]))) return { complete: false, score: null, text: '4AT incomplete' };
    const score = items.reduce((s, k) => s + Number(a[k]), 0);
    let text = '4AT 0: delirium or severe cognitive impairment unlikely';
    if (score >= 4) text = `4AT ${score}: possible delirium +/- cognitive impairment`;
    else if (score >= 1) text = `4AT ${score}: possible cognitive impairment`;
    return { complete: true, score, text };
}

// ---------------------------------------------------------------------------------------------
// Paediatrics.
// ---------------------------------------------------------------------------------------------
// APLS weight estimate - for reference only, never for drug doses.
export function aplsWeight(age) {
    if (!has(age) || age < 0 || age > 12) return null;
    if (age < 1) return Math.round((0.5 * age * 12 + 4) * 10) / 10;
    if (age <= 5) return Math.round(2 * age + 8);
    return Math.round(3 * age + 7);
}

export function paedsAnalgesia({ age, weight, weightCapKg = 50 }) {
    if (!has(age) || age >= 16) return { applicable: false };
    if (age < 0.25) return { applicable: true, blocked: 'Under 3 months: no triage dose shown - use BNFc and seek senior advice.' };
    if (!has(weight) || weight <= 0) return { applicable: true, blocked: 'Enter the child\'s measured weight to see doses.' };
    const w = Math.min(weight, weightCapKg);
    const paracetamol = Math.min(Math.round(w * 15), 1000);
    const ibuprofen = weight < 5 ? null : Math.min(Math.round(w * 10), 400);
    return {
        applicable: true,
        usedWeight: w,
        paracetamol,
        ibuprofen,
        ibuprofenNote: ibuprofen === null ? 'Ibuprofen not suitable under 5 kg.' : ''
    };
}

// ---------------------------------------------------------------------------------------------
// Pregnancy dating from LMP (Naegele: EDD = LMP + 280 days).
// ---------------------------------------------------------------------------------------------
const localDate = (v) => {
    const m = typeof v === 'string' && v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
};

export function gestationFromLmp(lmp, now = new Date()) {
    if (!lmp) return null;
    const start = localDate(lmp);
    if (Number.isNaN(start.getTime())) return null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((today - start) / 86400000);
    if (days < 0 || days > 45 * 7) return { valid: false };
    const edd = new Date(start.getTime() + 280 * 86400000);
    return { valid: true, weeks: Math.floor(days / 7), days: days % 7, edd };
}

// Nursing plan: is an item's `auto` condition met? (see protocols.js section 7b)
// ctx: { age, pregnant, sepsis, anticoag, bm, discriminator }. Parts joined with + must all be met.
export const PLAN_AUTO_KEYS = ['always', 'adult', 'child', 'sepsis', 'anticoag', 'pregnant', 'age50', 'age65', 'age5plus', 'bmLow', 'bmHigh'];
export function planAutoMet(auto, ctx) {
    if (!auto) return false;
    if (auto.includes('+')) return auto.split('+').every(part => planAutoMet(part, ctx));
    if (auto.startsWith('disc:')) return !!ctx.discriminator && auto.slice(5).split('|').includes(ctx.discriminator);
    const age = has(ctx.age) ? Number(ctx.age) : null, bm = toNumber(ctx.bm);
    switch (auto) {
        case 'always': return true;
        case 'adult': return age !== null && age >= 16;
        case 'child': return age !== null && age < 16;
        case 'sepsis': return !!ctx.sepsis;
        case 'anticoag': return !!ctx.anticoag;
        case 'pregnant': return !!ctx.pregnant;
        case 'age50': return age !== null && age >= 50;
        case 'age65': return age !== null && age >= 65;
        case 'age5plus': return age !== null && age >= 5;
        case 'bmLow': return bm !== null && bm < 4;
        case 'bmHigh': return bm !== null && bm > 11;
        default: return false;
    }
}

// Default placement from the triage category (complaint pathways are added on top by the UI).
export function basePlacement({ level, isPaeds, mobility }) {
    if (!level) return null;
    if (level === 'Red') return { to: 'Resus', why: 'Red category' };
    if (isPaeds) return { to: 'PaedsED', why: 'Under 16' };
    if (level === 'Orange' || level === 'Yellow') return { to: 'Majors', why: `${level} category` };
    if (mobility === 'Walking') return { to: 'Minors', why: `${level} category, walking` };
    return { to: 'Majors', why: mobility ? `${level} category, not walking` : `${level} category - record mobility` };
}

// Clinical Frailty Scale (Rockwood), version 2.0 (2020). Score the person's baseline:
// how they were about 2 weeks before this illness or injury. Validated for age 65 and over.
export const CFS_SOURCE = 'Clinical Frailty Scale ©2005-2020 Rockwood, Version 2.0 (EN). All rights reserved. Geriatric Medicine Research, Dalhousie University, Halifax, Canada (www.geriatricmedicineresearch.ca). Rockwood K et al. CMAJ 2005;173:489-495.';
export const CFS_LEVELS = [
    { score: 1, title: 'Very fit', text: 'People who are robust, active, energetic and motivated. They tend to exercise regularly and are among the fittest for their age.' },
    { score: 2, title: 'Fit', text: 'People who have no active disease symptoms but are less fit than category 1. Often, they exercise or are very active occasionally, e.g. seasonally.' },
    { score: 3, title: 'Managing well', text: 'People whose medical problems are well controlled, even if occasionally symptomatic, but often are not regularly active beyond routine walking.' },
    { score: 4, title: 'Living with very mild frailty', text: 'Previously "vulnerable", this category marks early transition from complete independence. While not dependent on others for daily help, often symptoms limit activities. A common complaint is being "slowed up" and/or being tired during the day.' },
    { score: 5, title: 'Living with mild frailty', text: 'People who often have more evident slowing, and need help with high order instrumental activities of daily living (finances, transportation, heavy housework). Typically, mild frailty progressively impairs shopping and walking outside alone, meal preparation, medications and begins to restrict light housework.' },
    { score: 6, title: 'Living with moderate frailty', text: 'People who need help with all outside activities and with keeping house. Inside, they often have problems with stairs and need help with bathing and might need minimal assistance (cuing, standby) with dressing.' },
    { score: 7, title: 'Living with severe frailty', text: 'Completely dependent for personal care, from whatever cause (physical or cognitive). Even so, they seem stable and not at high risk of dying (within about 6 months).' },
    { score: 8, title: 'Living with very severe frailty', text: 'Completely dependent for personal care and approaching end of life. Typically, they could not recover even from a minor illness.' },
    { score: 9, title: 'Terminally ill', text: 'Approaching the end of life. This category applies to people with a life expectancy under 6 months, who are not otherwise living with severe frailty. (Many terminally ill people can still exercise until very close to death.)' }
];
export const CFS_DEMENTIA = 'The degree of frailty generally corresponds to the degree of dementia. Mild dementia: forgetting the details of a recent event (though still remembering the event itself), repeating the same question or story, social withdrawal. Moderate dementia: recent memory is very impaired, even though they seemingly remember past life events well; they can do personal care with prompting. Severe dementia: cannot do personal care without help. Very severe dementia: often bedfast; many are virtually mute.';
export function cfs(score) {
    const n = toNumber(score);
    const lvl = CFS_LEVELS.find(l => l.score === n);
    return lvl ? { ...lvl, frail: n >= 5, label: `CFS ${n} - ${lvl.title}` } : null;
}
