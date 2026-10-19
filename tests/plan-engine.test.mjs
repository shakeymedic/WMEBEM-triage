// Run with: node --test tests/
// Investigations and cannula engine (plan-engine.js). Each rule is checked against the facts that
// should fire it and against near-misses that should not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePlan, cannulaDecision, SOURCES, T, CANNULA_LEVELS } from '../plan-engine.js';
import { clinicalData as D } from '../protocols.js';

const run = (f) => evaluatePlan({ ...f, protocol: f.complaint ? D.protocols[f.complaint] : null }, D.bloodProfiles);
const item = (r, name, cat) => r.items.find(i => i.name === name && (!cat || i.category === cat));
const status = (r, name, cat) => (item(r, name, cat) || {}).status;
const news = (score, complete = true) => ({ type: 'NEWS2', score, complete, recorded: complete ? 7 : 3, redParam: false });

test('Every source cited by a rule exists, and national sources have a URL', () => {
    const facts = [
        { age: 70, complaint: 'Unwell Adult', sepsisRisk: 'High', infection: 'yes', ews: news(8), level: 'Red' },
        { age: 3, complaint: 'Unwell Child', feverTL: 'Red', level: 'Orange' },
        { age: 25, sex: 'Female', complaint: 'Abdominal Pain in Adults', level: 'Yellow' },
        { age: 50, complaint: 'Allergy', discriminator: 'Shock', level: 'Red' },
        { age: 40, complaint: 'Collapse', flags: { chemo: true }, obs: { temp: 38.5 } },
        { age: 30, sex: 'Female', pregnant: true, complaint: 'Headache', obs: { sbp: 150, dbp: 95 } }
    ];
    for (const f of facts) {
        const r = run(f);
        for (const it of r.items) for (const x of it.reasons) assert.ok(SOURCES[x.source], `${it.name}: unknown source ${x.source}`);
        for (const x of r.cannula.reasons) assert.ok(SOURCES[x.source], `cannula: unknown source ${x.source}`);
    }
    Object.entries(SOURCES).forEach(([k, s]) => { if (k !== 'local') assert.match(s.url, /^https:\/\//, k); });
});

test('The engine never invents a blood bundle and never suggests imaging', () => {
    const complaints = Object.keys(D.protocols);
    const variants = [
        {}, { sepsisRisk: 'High', infection: 'yes', ews: news(9) }, { obs: { sbp: 80 } }, { flags: { anticoag: true, chemo: true }, headInjury: true, ng232: '1h', obs: { temp: 39 } },
        { obs: { bm: 25, ketones: 5 }, diabetes: true }, { feverTL: 'Red' }
    ];
    for (const c of complaints) for (const age of [2, 30, 80]) for (const v of variants) {
        const r = run({ age, complaint: c, level: 'Orange', ...v });
        r.items.filter(i => i.category === 'Bloods').forEach(i => assert.ok(D.bloodProfiles[i.name], `${c}: ${i.name}`));
        r.items.forEach(i => assert.doesNotMatch(`${i.name} ${i.why}`, /x-?ray|\bCT\b|CTPA|ultrasound|MRI/i, `${c}: ${i.name}`));
        assert.ok(CANNULA_LEVELS.includes(r.cannula.decision));
    }
});

test('Chest pain: ECG is "do now" with the 10-minute timing; bloods by venepuncture unless unstable', () => {
    const r = run({ age: 45, sex: 'Male', complaint: 'Chest Pain', discriminator: 'Musculoskeletal pain', level: 'Green' });
    assert.equal(status(r, T.ecg), 'now');
    assert.match(item(r, T.ecg).timing, /10 minutes/);
    assert.equal(r.cannula.decision, 'not-needed');
    const y = run({ age: 45, sex: 'Male', complaint: 'Chest Pain', discriminator: 'Cardiac-type chest pain at rest', level: 'Yellow', ews: news(1) });
    assert.equal(status(y, 'AE Acute Coronary Syndrome', 'Bloods'), 'suggested');
    assert.equal(y.cannula.decision, 'consider');
    assert.equal(y.cannula.venepuncture, true, 'stable cardiac chest pain: troponin by venepuncture, no idle cannula');
    const o = run({ age: 45, sex: 'Male', complaint: 'Chest Pain', discriminator: 'Severe respiratory distress', level: 'Orange' });
    assert.equal(o.cannula.decision, 'recommended');
});

test('NICE NG253 high risk: cultures, gas and sepsis bundle now; cannula now', () => {
    const r = run({ age: 70, sex: 'Male', complaint: 'Head Injury', level: 'Orange', sepsisRisk: 'High', infection: 'yes', ews: news(7) });
    assert.equal(status(r, T.cultures), 'now');
    assert.equal(status(r, T.vbg), 'now');
    assert.equal(status(r, 'AE - Sepsis', 'Bloods'), 'now');
    assert.match(item(r, T.cultures).timing, /never delay antibiotics/);
    assert.equal(r.cannula.decision, 'now');
    assert.ok(r.cannula.reasons.some(x => x.source === 'ng253' && x.level === 'now'));
});

test('NICE NG253 medium risk: cultures, VBG and bloods now, cannula recommended; low risk adds nothing', () => {
    const m = run({ age: 40, sex: 'Male', complaint: 'Sore Throat', level: 'Orange', sepsisRisk: 'Medium', infection: 'yes', ews: news(5) });
    assert.equal(status(m, T.cultures), 'now');
    assert.equal(status(m, T.vbg), 'now');
    assert.equal(status(m, 'AE - Sepsis', 'Bloods'), 'now');
    assert.equal(m.cannula.decision, 'recommended');
    const l = run({ age: 40, sex: 'Male', complaint: 'Sore Throat', discriminator: 'Pain only', level: 'Green', sepsisRisk: 'Low', infection: 'yes', ews: news(2) });
    assert.equal(item(l, T.cultures), undefined);
    assert.equal(status(l, 'AE - Sepsis', 'Bloods'), 'consider');
    assert.equal(l.cannula.decision, 'not-needed'); // Green with only the sore throat default: no IV need expected
});

test('Over 65: no urine dipstick to diagnose UTI - replaced by "culture only if UTI suspected"', () => {
    const r = run({ age: 80, sex: 'Female', complaint: 'Confusion', level: 'Yellow' });
    assert.equal(item(r, T.urine), undefined);
    assert.equal(status(r, T.msu), 'consider');
    assert.ok(r.notes.some(n => n.source === 'ukhsaUti'));
    const y = run({ age: 60, sex: 'Female', complaint: 'Confusion', level: 'Yellow' });
    assert.equal(status(y, T.urine), 'suggested');
});

test('Pregnancy test: universal for anyone who could be pregnant; "do now" where ectopic is possible', () => {
    assert.equal(status(run({ age: 25, sex: 'Female', complaint: 'Abdominal Pain in Adults' }), T.hcg, 'Universal'), 'now');
    assert.equal(status(run({ age: 25, sex: 'Female', complaint: 'Limb Problems' }), T.hcg, 'Universal'), 'suggested');
    assert.equal(status(run({ age: 25, sex: 'Female', complaint: 'Falls', discriminator: 'History of LOC' }), T.hcg, 'Universal'), 'now');
    assert.equal(status(run({ age: null, sex: '', complaint: 'Limb Problems' }), T.hcg, 'Universal'), 'suggested');
    assert.equal(status(run({ age: 25, sex: 'Male', complaint: 'Abdominal Pain in Adults' }), T.hcg, 'Universal'), undefined);
    assert.equal(status(run({ age: 60, sex: 'Female', complaint: 'Abdominal Pain in Adults' }), T.hcg, 'Universal'), undefined);
    assert.equal(status(run({ age: 25, sex: 'Female', pregnant: true, complaint: 'Abdominal Pain in Adults' }), T.hcg, 'Universal'), undefined);
    assert.equal(status(run({ age: 11, sex: 'Female', complaint: 'Abdominal Pain in Children' }), T.hcg, 'Universal'), undefined);
});

test('"Blocked Ear" does not count as loss of consciousness', () => {
    const r = run({ age: 30, sex: 'Female', complaint: 'Ear Problems', discriminator: 'Blocked Ear' });
    assert.equal(item(r, T.ecg), undefined);
    assert.equal(status(r, T.hcg, 'Universal'), 'suggested');
});

test('Cannula: Orange from severe pain alone is only "consider"; Orange from a discriminator is recommended', () => {
    const pain = run({ age: 25, sex: 'Male', complaint: 'Limb Problems', discriminator: 'Severe Pain', level: 'Orange', painOnlyOrange: true, pain: 9 });
    assert.equal(pain.cannula.decision, 'consider');
    const disc = run({ age: 25, sex: 'Male', complaint: 'Abdominal Pain in Adults', discriminator: 'Peritonism', level: 'Orange' });
    assert.equal(disc.cannula.decision, 'recommended');
});

test('Cannula: bleeding and shock need large-bore access now', () => {
    const gi = run({ age: 60, sex: 'Male', complaint: 'Gastrointestinal Bleeding', discriminator: 'Shock', level: 'Red', obs: { sbp: 82 } });
    assert.equal(gi.cannula.decision, 'now');
    assert.match(gi.cannula.size, /x2/);
    assert.equal(status(gi, 'Major Bleed Procedure', 'Bloods'), 'now');
    const sh = run({ age: 60, sex: 'Male', complaint: 'Diarrhoea and Vomiting', level: 'Orange', obs: { sbp: 88 } });
    assert.equal(sh.cannula.decision, 'now');
    assert.equal(status(sh, T.vbg), 'now');
    assert.equal(item(sh, 'Major Bleed Procedure'), undefined, 'D&V shock is not a bleed');
});

test('Cannula: anaphylaxis and status epilepticus say not to delay first-line treatment', () => {
    const a = run({ age: 30, complaint: 'Allergy', discriminator: 'Stridor', level: 'Orange' });
    assert.equal(a.cannula.decision, 'now');
    assert.ok(a.cannula.cautions.some(c => /Do not delay/.test(c)));
    const s = run({ age: 30, complaint: 'Fits and Seizures', discriminator: 'Actively seizing now (status epilepticus)', level: 'Red' });
    assert.equal(s.cannula.decision, 'now');
    assert.equal(status(s, T.bm), 'now');
    assert.ok(s.cannula.reasons.some(x => x.source === 'ng217'));
});

test('Stroke: cannula now within 24 hours of last known well (or unknown); otherwise the complaint default', () => {
    assert.equal(run({ age: 70, complaint: 'Suspected Stroke', lkwHours: 2 }).cannula.decision, 'now');
    assert.equal(run({ age: 70, complaint: 'Suspected Stroke', lkwHours: null }).cannula.decision, 'now');
    const late = run({ age: 70, complaint: 'Suspected Stroke', lkwHours: 40, level: 'Yellow' });
    assert.equal(late.cannula.decision, 'consider');
    assert.ok(late.cannula.cautions.some(c => /unaffected arm/.test(c)));
    assert.equal(status(late, T.bm), 'now');
});

test('Diabetes: ketones when BM above 11; DKA (ketones above 3.0, JBDS) makes gas, ketones and cannula "now"', () => {
    const hi = run({ age: 30, complaint: 'Diarrhoea and Vomiting', level: 'Yellow', diabetes: true, obs: { bm: 18 } });
    assert.equal(status(hi, T.ketones), 'suggested');
    assert.equal(hi.cannula.decision === 'now', false);
    const dka = run({ age: 30, complaint: 'Diarrhoea and Vomiting', level: 'Yellow', diabetes: true, obs: { bm: 18, ketones: 3.4 } });
    assert.equal(status(dka, T.ketones), 'now');
    assert.equal(status(dka, T.vbg), 'now');
    assert.equal(status(dka, 'AE - Hypoglycaemia - Hyperglycaemia', 'Bloods'), 'now');
    assert.equal(dka.cannula.decision, 'now');
    const k29 = run({ age: 30, complaint: 'Diarrhoea and Vomiting', diabetes: true, obs: { bm: 18, ketones: 2.9 } });
    assert.notEqual(k29.cannula.decision, 'now');
    const k30 = run({ age: 30, complaint: 'Diarrhoea and Vomiting', diabetes: true, obs: { bm: 18, ketones: 3.0 } });
    assert.notEqual(k30.cannula.decision, 'now', 'JBDS: ketones must be above 3.0, not equal');
    const bm11 = run({ age: 30, complaint: 'Limb Problems', diabetes: true, obs: { bm: 11 } });
    assert.equal(item(bm11, T.ketones), undefined, 'BM must be above 11.0');
    const noDm = run({ age: 30, complaint: 'Limb Problems', obs: { bm: 12 } });
    assert.equal(item(noDm, T.ketones), undefined, 'adult without diabetes: no ketone prompt from BM alone');
    const child = run({ age: 8, complaint: 'Unwell Child', obs: { bm: 15 } });
    assert.equal(status(child, T.ketones), 'suggested');
    assert.ok(child.items.find(i => i.name === T.ketones).reasons.some(x => x.source === 'bspedDka'));
});

test('SGLT2 inhibitor: ketones even with a normal glucose when unwell or vomiting', () => {
    const r = run({ age: 60, complaint: 'Diarrhoea and Vomiting', flags: { sglt2: true }, obs: { bm: 7 } });
    assert.equal(status(r, T.ketones), 'suggested');
    const well = run({ age: 60, complaint: 'Limb Problems', flags: { sglt2: true }, obs: { bm: 7 } });
    assert.equal(item(well, T.ketones), undefined);
});

test('Hypoglycaemia and reduced consciousness', () => {
    const r = run({ age: 50, complaint: 'Collapse', obs: { bm: 2.8, avpu: 'V' } });
    assert.equal(status(r, T.bm), 'now');
    assert.equal(status(r, T.neuro), 'suggested');
    assert.equal(r.cannula.decision, 'now');
    const alert = run({ age: 50, complaint: 'Limb Problems', obs: { bm: 3.5, avpu: 'A' } });
    assert.equal(status(alert, T.bm), 'now');
    assert.notEqual(alert.cannula.decision, 'now', 'alert hypoglycaemia can be treated orally');
    const gcs = run({ age: 50, complaint: 'Limb Problems', obs: { gcs: 14 } });
    assert.equal(status(gcs, T.bm), 'now');
    assert.match(item(gcs, T.bm).reasons[0].text, /GCS 14/);
    assert.equal(run({ age: 50, complaint: 'Limb Problems', prehospitalBm: 2.1 }).items.find(i => i.name === T.bm).status, 'now');
});

test('Chemotherapy with fever or infection: possible neutropenic sepsis (NICE CG151)', () => {
    const r = run({ age: 55, complaint: 'Unwell Adult', flags: { chemo: true }, obs: { temp: 38.1 } });
    assert.equal(status(r, T.cultures), 'now');
    assert.equal(status(r, 'AE - Sepsis', 'Bloods'), 'now');
    assert.equal(r.cannula.decision, 'now');
    assert.ok(r.cannula.reasons.some(x => x.source === 'cg151'));
    const afebrile = run({ age: 55, complaint: 'Limb Problems', flags: { chemo: true }, obs: { temp: 37.2 } });
    assert.equal(item(afebrile, T.cultures), undefined);
});

test('Children: fever traffic light RED adds cultures, urine and paediatric sepsis bloods; cannula needs a senior', () => {
    const r = run({ age: 2, complaint: 'Unwell Child', discriminator: 'Viral symptoms', level: 'Green', feverTL: 'Red' });
    assert.equal(status(r, T.cultures), 'suggested');
    assert.equal(status(r, T.childUrine), 'suggested');
    assert.equal(status(r, 'AE - Sepsis (Paediatric)', 'Bloods'), 'suggested');
    assert.equal(status(r, T.weight), 'suggested');
    assert.equal(r.cannula.decision, 'recommended');
    assert.ok(r.cannula.cautions.some(c => /senior/.test(c)));
    assert.doesNotMatch(r.cannula.size, /18G|16G|14G/);
    const well = run({ age: 7, complaint: 'Abdominal Pain in Children', discriminator: 'Mild pain', level: 'Green' });
    assert.equal(well.cannula.decision, 'not-needed');
    assert.equal(well.cannula.size, null);
});

test('Head injury on an anticoagulant: bundle, neuro obs with NG232 frequency, cannula recommended', () => {
    const r = run({ age: 78, complaint: 'Falls', discriminator: 'Head injury with anticoagulants', level: 'Yellow', headInjury: true, ng232: 'consider8h', flags: { anticoag: true } });
    assert.equal(status(r, 'AE Head Injury on Warfarin', 'Bloods'), 'suggested');
    assert.match(item(r, T.neuro).timing, /half-hourly/);
    assert.equal(r.cannula.decision, 'recommended');
});

test('Pregnant with raised BP: urine dip for protein is suggested', () => {
    const r = run({ age: 30, sex: 'Female', pregnant: true, complaint: 'Headache', obs: { sbp: 145, dbp: 85 } });
    assert.equal(status(r, T.urine), 'suggested');
    assert.ok(item(r, T.urine).reasons.some(x => x.source === 'ng133'));
    const normal = run({ age: 30, sex: 'Female', pregnant: true, complaint: 'Limb Problems', obs: { sbp: 120, dbp: 70 } });
    assert.equal(item(normal, T.urine), undefined);
});

test('Bloods without IV need: venepuncture advised; dialysis and stroke limb cautions', () => {
    const r = run({ age: 40, complaint: 'Abdominal Pain in Adults', discriminator: 'Moderate pain', level: 'Yellow' });
    assert.equal(r.cannula.decision, 'consider');
    assert.equal(r.cannula.venepuncture, true);
    const g = run({ age: 40, complaint: 'Abdominal Pain in Adults', discriminator: 'Mild pain', level: 'Green' });
    assert.equal(g.cannula.decision, 'not-needed');
    assert.equal(g.cannula.venepuncture, true);
    assert.match(r.cannula.notes[0], /venepuncture/);
    const d = cannulaDecision({ age: 60, complaint: 'Limb Problems', flags: { dialysis: true } });
    assert.ok(d.cautions.some(c => /fistula/.test(c)));
});

test('NEWS2 escalation: 5-6 recommended, 7+ now, partial scores count as a minimum', () => {
    assert.equal(run({ age: 40, complaint: 'Limb Problems', ews: news(5) }).cannula.decision, 'recommended');
    assert.equal(run({ age: 40, complaint: 'Limb Problems', ews: news(7, false) }).cannula.decision, 'now');
    assert.equal(run({ age: 40, complaint: 'Limb Problems', ews: news(4) }).cannula.decision, 'not-needed');
    assert.equal(status(run({ age: 40, complaint: 'Limb Problems', ews: news(5) }), T.vbg), 'suggested');
});

test('Sample timing notes are attached to the bundles that need them', () => {
    const od = run({ age: 20, complaint: 'Overdose and Poisoning' });
    assert.match(item(od, 'AE DSH Overdose').timing, /from 4 hours after ingestion/);
    const ana = run({ age: 20, complaint: 'Allergy', discriminator: 'Wheeze' });
    assert.match(item(ana, 'AE Anaphylaxis').timing, /tryptase/i);
});

test('Three tiers: bloods without a cannula, a cannula, or nothing', () => {
    const bloods = (r) => r.items.some(i => i.category === 'Bloods' && i.status !== 'consider');
    // Bloods by venepuncture, no cannula: stable chest pain, delirium screen, timed paracetamol level, GCA headache, DVT
    for (const f of [
        { age: 55, complaint: 'Chest Pain', discriminator: 'Cardiac-type chest pain at rest', level: 'Yellow', ews: news(1) },
        { age: 82, complaint: 'Confusion', discriminator: 'Abnormal vital signs', level: 'Yellow', ews: news(3) },
        { age: 70, complaint: 'Headache', discriminator: 'History of Migraine', level: 'Green' },
        { age: 60, complaint: 'Suspected DVT / PE', discriminator: 'Unilateral leg swelling/pain', level: 'Yellow', ews: news(0) }
    ]) {
        const r = run(f);
        assert.notEqual(r.cannula.decision, 'now', f.complaint);
        assert.notEqual(r.cannula.decision, 'recommended', `${f.complaint}: ${r.cannula.reasons.map(x => x.text).join('; ')}`);
    }
    const od = run({ age: 30, complaint: 'Overdose and Poisoning', discriminator: 'Symptomatic but stable', level: 'Yellow', ews: news(0) });
    assert.equal(status(od, 'AE DSH Overdose', 'Bloods'), 'suggested');
    assert.equal(od.cannula.decision, 'consider');
    assert.equal(od.cannula.venepuncture, true);
    // Cannula: IV treatment is likely soon
    assert.equal(run({ age: 30, complaint: 'Asthma', discriminator: 'Severe Distress', level: 'Orange' }).cannula.decision, 'recommended');
    assert.equal(run({ age: 70, complaint: 'Shortness of Breath in Adults', discriminator: 'Moderate respiratory distress', level: 'Yellow', obs: { sats: 89 } }).cannula.decision, 'recommended');
    assert.equal(run({ age: 40, complaint: 'Palpitations', discriminator: 'Rate > 150', level: 'Orange', obs: { hr: 170 } }).cannula.decision, 'recommended');
    assert.equal(run({ age: 60, complaint: 'Gastrointestinal Bleeding', discriminator: 'Haematemesis', level: 'Orange' }).cannula.decision, 'recommended');
    assert.equal(run({ age: 30, complaint: 'Overdose and Poisoning', discriminator: 'High-risk substance', level: 'Orange' }).cannula.decision, 'recommended');
    assert.equal(run({ age: 30, complaint: 'Torso Injury', discriminator: 'Stab/Gunshot', level: 'Red' }).cannula.decision, 'now');
    assert.equal(run({ age: 80, complaint: 'Falls', discriminator: 'Suspected neck of femur fracture', level: 'Orange' }).cannula.decision, 'recommended');
    // Nothing: no bloods and no cannula
    for (const f of [
        { age: 30, complaint: 'Wounds', discriminator: 'Graze/Glue', level: 'Green' },
        { age: 25, complaint: 'Sore Throat', discriminator: 'Pain only', level: 'Green', ews: news(0) },
        { age: 40, complaint: 'Back Pain', discriminator: 'Moderate pain', level: 'Yellow' },
        { age: 6, complaint: 'Limping Child', discriminator: 'Minor trauma', level: 'Green' }
    ]) {
        const r = run({ ...f, sex: 'Male' });
        assert.equal(bloods(r), false, `${f.complaint} should have no suggested bloods`);
        assert.ok(['not-needed', 'consider'].includes(r.cannula.decision), f.complaint);
    }
});
