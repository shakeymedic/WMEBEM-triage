// Run with: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../clinical.js';
import { clinicalData } from '../protocols.js';

const R = clinicalData.scoring.news2;
const full = (o = {}) => ({ rr: 16, sats: 97, o2: 'Air', sbp: 125, hr: 72, avpu: 'A', temp: 37.0, scale2: false, ...o });

test('toNumber / has treat blank and NaN as not recorded, and keep 0', () => {
    assert.equal(C.toNumber(''), null);
    assert.equal(C.toNumber('abc'), null);
    assert.equal(C.toNumber('0'), 0);
    assert.equal(C.has(NaN), false);
    assert.equal(C.has(0), true);
});

test('NEWS2 scale 1 bands (RCP 2017)', () => {
    assert.equal(C.news2(full(), R).score, 0);
    const cases = [
        [{ rr: 8 }, 3], [{ rr: 9 }, 1], [{ rr: 11 }, 1], [{ rr: 12 }, 0], [{ rr: 20 }, 0], [{ rr: 21 }, 2], [{ rr: 24 }, 2], [{ rr: 25 }, 3],
        [{ sats: 91 }, 3], [{ sats: 92 }, 2], [{ sats: 93 }, 2], [{ sats: 94 }, 1], [{ sats: 95 }, 1], [{ sats: 96 }, 0],
        [{ o2: 'O2' }, 2],
        [{ sbp: 90 }, 3], [{ sbp: 91 }, 2], [{ sbp: 100 }, 2], [{ sbp: 101 }, 1], [{ sbp: 110 }, 1], [{ sbp: 111 }, 0], [{ sbp: 219 }, 0], [{ sbp: 220 }, 3],
        [{ hr: 40 }, 3], [{ hr: 41 }, 1], [{ hr: 50 }, 1], [{ hr: 51 }, 0], [{ hr: 90 }, 0], [{ hr: 91 }, 1], [{ hr: 110 }, 1], [{ hr: 111 }, 2], [{ hr: 130 }, 2], [{ hr: 131 }, 3],
        [{ avpu: 'C' }, 3], [{ avpu: 'V' }, 3], [{ avpu: 'U' }, 3],
        [{ temp: 35.0 }, 3], [{ temp: 35.1 }, 1], [{ temp: 36.0 }, 1], [{ temp: 36.1 }, 0], [{ temp: 38.0 }, 0], [{ temp: 38.1 }, 1], [{ temp: 39.0 }, 1], [{ temp: 39.1 }, 2]
    ];
    for (const [o, expected] of cases) assert.equal(C.news2(full(o), R).score, expected, JSON.stringify(o));
});

test('NEWS2 scale 2: >=93% on air scores 0; high sats only score on oxygen', () => {
    const s2 = (sats, o2) => C.news2(full({ scale2: true, sats, o2 }), R).params.find(p => p.key === 'sats').points;
    assert.equal(s2(83, 'Air'), 3);
    assert.equal(s2(84, 'Air'), 2);
    assert.equal(s2(86, 'Air'), 1);
    assert.equal(s2(88, 'Air'), 0);
    assert.equal(s2(92, 'Air'), 0);
    assert.equal(s2(93, 'Air'), 0);
    assert.equal(s2(99, 'Air'), 0);
    assert.equal(s2(93, 'O2'), 1);
    assert.equal(s2(94, 'O2'), 1);
    assert.equal(s2(95, 'O2'), 2);
    assert.equal(s2(96, 'O2'), 2);
    assert.equal(s2(97, 'O2'), 3);
});

test('NEWS2 completeness: nothing recorded is incomplete, never "0 = normal"', () => {
    const n = C.news2({ rr: null, sats: null, o2: null, sbp: null, hr: null, avpu: null, temp: null }, R);
    assert.equal(n.complete, false);
    assert.equal(n.recorded, 0);
    assert.equal(n.missing.length, 7);
    const partial = C.news2({ rr: 30, sats: null, o2: null, sbp: null, hr: null, avpu: null, temp: null }, R);
    assert.equal(partial.score, 3);
    assert.equal(partial.redParam, true);
    assert.equal(partial.complete, false);
});

test('Provisional NEWS2: a minimum that escalates but never reassures', () => {
    const blank = { rr: null, sats: null, o2: null, sbp: null, hr: null, avpu: null, temp: null };
    const sum = (o) => C.news2Summary(C.news2({ ...blank, ...o }, R));
    assert.equal(sum({}).status, 'none');
    const low = sum({ rr: 16, hr: 80 });
    assert.equal(low.status, 'provisional');
    assert.match(low.text, /^Provisional NEWS2 at least 0 \(2 of 7 obs\)$/);
    assert.equal(low.monitorMins, null, 'a low partial score must not set a 12-hour obs interval');
    assert.doesNotMatch(low.riskText, /^Low risk/);
    assert.deepEqual(low.missing, ['SpO2', 'Air/O2', 'Systolic BP', 'Consciousness', 'Temp']);
    const red = sum({ rr: 30 });
    assert.equal(red.monitorMins, 60);
    assert.match(red.riskText, /Low-medium risk or higher/);
    const med = sum({ rr: 24, sats: 93, hr: 112 });
    assert.equal(med.score, 6);
    assert.equal(med.riskText, 'Medium risk or higher');
    assert.equal(sum({ rr: 30, sats: 90, avpu: 'V' }).monitorMins, 0);
    const full = sum({ rr: 16, sats: 97, o2: 'Air', sbp: 125, hr: 75, avpu: 'A', temp: 37 });
    assert.equal(full.status, 'complete');
    assert.equal(full.text, 'NEWS2 0');
    assert.equal(full.monitorMins, 720);
});

test('NEWS2 response frequency (RCP)', () => {
    assert.equal(C.news2Response(0, false).monitorMins, 720);
    assert.equal(C.news2Response(3, false).monitorMins, 240);
    assert.equal(C.news2Response(3, true).monitorMins, 60);
    assert.equal(C.news2Response(5, false).monitorMins, 60);
    assert.equal(C.news2Response(7, false).monitorMins, 0);
});

test('Local MEOWS: blank obs score 0 and are incomplete; altered consciousness is red', () => {
    const blank = C.localMeows({});
    assert.equal(blank.score, 0);
    assert.equal(blank.complete, false);
    assert.equal(C.localMeows({ avpu: 'U' }).score, 3);
});

test('Local PEWS: blank obs never score; RR 0 does', () => {
    assert.equal(C.localPews({}, 3, clinicalData.scoring.pews).score, 0);
    assert.equal(C.localPews({ rr: 0 }, 3, clinicalData.scoring.pews).score, 3);
});

test('NG253 sepsis: only with suspected infection, 16+, not pregnant; NEWS2 bands', () => {
    const n = (score, extra = {}) => ({ score, complete: true, redParam: false, ...extra });
    assert.equal(C.sepsisNG253({ age: 40, infection: null, news: n(9) }).status, 'not-asked');
    assert.equal(C.sepsisNG253({ age: 40, infection: 'no', news: n(9) }).status, 'not-suspected');
    assert.equal(C.sepsisNG253({ age: 10, infection: 'yes', news: n(9) }).applicable, false);
    assert.equal(C.sepsisNG253({ age: 30, pregnant: true, infection: 'yes', news: n(9) }).applicable, false);
    assert.equal(C.sepsisNG253({ age: 40, infection: 'yes', news: n(7) }).risk, 'High');
    assert.equal(C.sepsisNG253({ age: 40, infection: 'yes', news: n(5) }).risk, 'Medium');
    assert.equal(C.sepsisNG253({ age: 40, infection: 'yes', news: n(1) }).risk, 'Low');
    assert.equal(C.sepsisNG253({ age: 40, infection: 'yes', news: n(0) }).risk, 'Very low');
    assert.match(C.sepsisNG253({ age: 40, infection: 'yes', news: n(3, { redParam: true }) }).judgement, /single parameter/);
    assert.equal(C.sepsisNG253({ age: 40, infection: 'yes', news: n(2, { complete: false }) }).provisional, true);
    assert.equal(C.sepsisNG253({ age: 40, infection: 'yes', news: n(8, { complete: false }) }).provisional, false);
});

test('MTS pain ruler: 1-4 mild, 5-7 moderate (Yellow), 8-10 severe (Orange)', () => {
    assert.equal(C.mtsPain(null), null);
    assert.equal(C.mtsPain(4).floor, null);
    assert.equal(C.mtsPain(5).floor, 'Yellow');
    assert.equal(C.mtsPain(7).floor, 'Yellow');
    assert.equal(C.mtsPain(8).floor, 'Orange');
    assert.equal(C.mtsPain(10).floor, 'Orange');
});

test('Priority: not triaged until a discriminator or "none apply"; floors only raise', () => {
    assert.equal(C.triagePriority({}).final, null);
    assert.equal(C.triagePriority({}).triaged, false);
    assert.equal(C.triagePriority({ noneApply: true }).final, 'Blue');
    const withFloor = C.triagePriority({ floors: [{ level: 'Orange', reason: 'x' }] });
    assert.equal(withFloor.final, 'Orange');
    assert.equal(withFloor.provisional, true);
    assert.equal(C.triagePriority({ discriminator: { text: 'Shock', priority: 'Red' }, floors: [{ level: 'Yellow', reason: 'y' }] }).final, 'Red');
    assert.equal(C.triagePriority({ discriminator: { text: 'Minor', priority: 'Green' }, override: { level: 'Orange', reason: 'concern' } }).final, 'Orange');
});

test('See-by time uses MTS targets (Orange 10 minutes)', () => {
    const t = new Date('2026-01-01T10:00:00');
    assert.equal(C.seeBy(t, 'Orange').getTime() - t.getTime(), 10 * 60000);
    assert.equal(C.seeBy(t, 'Blue').getTime() - t.getTime(), 240 * 60000);
});

test('NG143 traffic light thresholds', () => {
    const o = (x) => ({ rr: 30, hr: 120, temp: 38.5, sats: 98, o2: 'Air', crt: 1, ...x });
    assert.equal(C.ng143TrafficLight({ age: 6, obs: o() }).applicable, false);
    assert.equal(C.ng143TrafficLight({ age: 2 / 12, obs: o({ temp: 38 }) }).level, 'Red');
    assert.equal(C.ng143TrafficLight({ age: 4 / 12, obs: o({ temp: 39 }) }).level, 'Amber');
    assert.equal(C.ng143TrafficLight({ age: 3, obs: o({ rr: 61 }) }).level, 'Red');
    assert.equal(C.ng143TrafficLight({ age: 8 / 12, obs: o({ rr: 51 }) }).level, 'Amber');
    assert.equal(C.ng143TrafficLight({ age: 3, obs: o({ rr: 41 }) }).level, 'Amber');
    assert.equal(C.ng143TrafficLight({ age: 6 / 12, obs: o({ hr: 161 }) }).level, 'Amber');
    assert.equal(C.ng143TrafficLight({ age: 18 / 12, obs: o({ hr: 151 }) }).level, 'Amber');
    assert.equal(C.ng143TrafficLight({ age: 3, obs: o({ hr: 141 }) }).level, 'Amber');
    assert.equal(C.ng143TrafficLight({ age: 3, obs: o({ hr: 140 }) }).level, 'Green');
    assert.equal(C.ng143TrafficLight({ age: 3, obs: o({ sats: 95 }) }).level, 'Amber');
    assert.equal(C.ng143TrafficLight({ age: 3, obs: o({ crt: 3 }) }).level, 'Amber');
    assert.equal(C.ng143TrafficLight({ age: 3, obs: o(), ticks: { grunting: true } }).level, 'Red');
    assert.equal(C.ng143TrafficLight({ age: 3, obs: { temp: 38.5 } }).level, null);
    // The febrile toddler from the review scenario
    assert.equal(C.ng143TrafficLight({ age: 3, obs: { hr: 160, rr: 40, temp: 39.5 } }).level, 'Amber');
});

test('NG232 adults', () => {
    assert.equal(C.ng232({ age: 40, answers: { vomit: true } }).level, '1h');
    assert.equal(C.ng232({ age: 70, answers: { loc_amnesia: true } }).level, '8h');
    assert.equal(C.ng232({ age: 70, answers: {} }).level, 'none');
    assert.equal(C.ng232({ age: 40, answers: { loc_amnesia: true, mechanism: true } }).level, '8h');
    assert.equal(C.ng232({ age: 40, answers: {}, anticoagulated: true }).level, 'consider8h');
});

test('NG232 children: >1 risk factor = CT 1h, exactly 1 = observe 4h', () => {
    assert.equal(C.ng232({ age: 8, answers: { nai: true } }).level, '1h');
    assert.equal(C.ng232({ age: 8, answers: { drowsy: true, vomit3: true } }).level, '1h');
    assert.equal(C.ng232({ age: 8, answers: { drowsy: true } }).level, 'observe4h');
    assert.equal(C.ng232({ age: 8, answers: {} }).level, 'none');
});

test('ROSIER', () => {
    assert.equal(C.rosier({}).score, 0);
    assert.equal(C.rosier({ face: true, arm: true }).likely, true);
    assert.equal(C.rosier({ face: true, loc: true }).likely, false);
});

test('4AT', () => {
    assert.equal(C.fourAT({ alertness: 0, amt4: 0, attention: 0 }).complete, false);
    assert.equal(C.fourAT({ alertness: 0, amt4: 0, attention: 0, acute: 0 }).score, 0);
    assert.match(C.fourAT({ alertness: 0, amt4: 1, attention: 1, acute: 0 }).text, /cognitive impairment/);
    assert.match(C.fourAT({ alertness: 0, amt4: 0, attention: 0, acute: 4 }).text, /delirium/);
});

test('APLS weight estimate', () => {
    assert.equal(C.aplsWeight(6 / 12), 7);
    assert.equal(C.aplsWeight(3), 14);
    assert.equal(C.aplsWeight(8), 31);
    assert.equal(C.aplsWeight(14), null);
});

test('Paediatric analgesia guards', () => {
    assert.match(C.paedsAnalgesia({ age: 2 / 12, weight: 5 }).blocked, /Under 3 months/);
    assert.match(C.paedsAnalgesia({ age: 3, weight: null }).blocked, /weight/);
    const d = C.paedsAnalgesia({ age: 4, weight: 16 });
    assert.equal(d.paracetamol, 240);
    assert.equal(d.ibuprofen, 100, '4 years but 16 kg: the lower (weight) band, 100 mg');
    assert.equal(C.paedsAnalgesia({ age: 2, weight: 12 }).ibuprofen, 100, 'SmPC 1-3 years: 100 mg');
    assert.equal(C.paedsAnalgesia({ age: 8 / 12, weight: 8 }).ibuprofen, 50);
    assert.equal(C.paedsAnalgesia({ age: 5, weight: 18 }).ibuprofen, 150);
    assert.equal(C.paedsAnalgesia({ age: 14, weight: 50 }).ibuprofen, 400);
    assert.equal(C.paedsAnalgesia({ age: 5 / 12, weight: 4.5 }).ibuprofen, null);
    assert.equal(C.paedsAnalgesia({ age: 15, weight: 80 }).paracetamol, 750);
});

test('Gestation from LMP', () => {
    const g = C.gestationFromLmp('2026-01-01', new Date(2026, 2, 12, 23, 30));
    assert.equal(g.weeks, 10);
    assert.equal(g.days, 0);
    assert.equal(C.gestationFromLmp('2030-01-01', new Date(2026, 0, 1)).valid, false);
});

test('MTS general discriminators are consistent across every flowchart', () => {
    const expected = { 'shock': 'Red', 'airway compromise': 'Red', 'catastrophic haemorrhage': 'Red', 'severe pain': 'Orange', 'moderate pain': 'Yellow', 'altered gcs': 'Orange' };
    for (const [chart, discs] of Object.entries(clinicalData.mtsFlowcharts)) {
        for (const d of discs) {
            const want = expected[d.text.toLowerCase()];
            if (want) assert.equal(d.priority, want, `${chart}: "${d.text}"`);
        }
    }
});

test('Every quick chip, body-map zone and synonym points at a real flowchart', () => {
    const charts = clinicalData.mtsFlowcharts;
    const targets = [
        ...clinicalData.quickComplaints.adult, ...clinicalData.quickComplaints.child,
        ...clinicalData.bodyMap.adult.map(z => z.chart), ...clinicalData.bodyMap.child.map(z => z.chart),
        ...Object.values(clinicalData.complaintSynonyms).flat()
    ];
    for (const t of targets) assert.ok(charts[t], `missing flowchart "${t}"`);
});

test('Nursing plan: one plan per flowchart, bundles real, triggers match real discriminators', () => {
    const { protocols, mtsFlowcharts, bloodProfiles, placements } = clinicalData;
    const places = Object.assign({}, ...Object.values(placements));
    assert.deepEqual(Object.keys(protocols).sort(), Object.keys(mtsFlowcharts).sort());
    for (const [name, p] of Object.entries(protocols)) {
        const discs = mtsFlowcharts[name].map(d => d.text);
        const items = [...p.bedside, ...p.bloods, ...p.pathways];
        for (const b of p.bloods) assert.ok(bloodProfiles[b.profile], `${name}: unknown ICE bundle "${b.profile}"`);
        for (const w of p.pathways) assert.ok(places[w.to], `${name}: unknown placement "${w.to}"`);
        for (const it of items) {
            if (!it.auto) {
                assert.ok(it.when, `${name}: item with neither auto nor when`);
                assert.ok(!/^disc:/.test(it.when) && !C.PLAN_AUTO_KEYS.includes(it.when), `${name}: "${it.when}" looks like an auto key passed as "when"`);
                continue;
            }
            assert.ok(!/^(if|when) /i.test(it.why || ''), `${name}: rationale "${it.why}" reads like a condition - pass it as "when"`);
            for (const part of it.auto.split('+')) {
                if (part.startsWith('disc:')) {
                    for (const t of part.slice(5).split('|')) assert.ok(discs.includes(t), `${name}: "${t}" is not a discriminator on this flowchart`);
                } else assert.ok(C.PLAN_AUTO_KEYS.includes(part), `${name}: unknown auto key "${part}"`);
            }
        }
        assert.ok(['recommended', 'consider', 'not-routine'].includes(p.cannula.status), `${name}: cannula status`);
    }
});

test('Nursing plan has no imaging and no stand-alone pregnancy test', () => {
    const text = JSON.stringify(clinicalData.protocols).replace(/Bladder scan/g, '');
    for (const w of [/x-?ray/i, /\bCT\b/, /CTPA/, /\bFAST\b/, /ultrasound/i, /\bMRI\b/, /\bscan\b/i, /imaging/i]) {
        assert.ok(!w.test(text), `imaging word ${w} found in protocols`);
    }
    // The pregnancy test is offered once, by the universal check, not per complaint.
    for (const p of Object.values(clinicalData.protocols)) assert.ok(!p.bedside.some(b => /pregnancy test/i.test(b.name)));
    assert.equal(clinicalData.calculators, undefined);
});

test('Plan auto conditions and base placement', () => {
    const ctx = { age: 70, pregnant: false, sepsis: false, anticoag: true, bm: '12.5', discriminator: 'Shock' };
    assert.equal(C.planAutoMet('always', ctx), true);
    assert.equal(C.planAutoMet(null, ctx), false);
    assert.equal(C.planAutoMet('age65', ctx), true);
    assert.equal(C.planAutoMet('age65', { ...ctx, age: null }), false);
    assert.equal(C.planAutoMet('child', { ...ctx, age: null }), false);
    assert.equal(C.planAutoMet('anticoag', ctx), true);
    assert.equal(C.planAutoMet('bmHigh', ctx), true);
    assert.equal(C.planAutoMet('bmLow', { ...ctx, bm: '' }), false);
    assert.equal(C.planAutoMet('disc:Catastrophic haemorrhage|Shock', ctx), true);
    assert.equal(C.planAutoMet('disc:Shock or something', ctx), false);
    assert.equal(C.planAutoMet('anticoag+disc:Shock', ctx), true);
    assert.equal(C.planAutoMet('child+disc:Shock', ctx), false);
    assert.equal(C.planAutoMet('sepsis', ctx), false);
    assert.equal(C.planAutoMet('sepsis', { ...ctx, sepsis: true }), true);
    assert.equal(C.basePlacement({ level: null }), null);
    assert.equal(C.basePlacement({ level: 'Red', isPaeds: true }).to, 'Resus');
    assert.equal(C.basePlacement({ level: 'Green', isPaeds: true }).to, 'PaedsED');
    assert.equal(C.basePlacement({ level: 'Yellow', mobility: 'Walking' }).to, 'Majors');
    assert.equal(C.basePlacement({ level: 'Green', mobility: 'Walking' }).to, 'Minors');
    assert.equal(C.basePlacement({ level: 'Blue', mobility: 'Stretcher' }).to, 'Majors');
});

test('Clinical Frailty Scale levels', () => {
    assert.deepEqual(C.CFS_LEVELS.map(l => l.score), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.equal(C.cfs(null), null);
    assert.equal(C.cfs(10), null);
    assert.equal(C.cfs(4).frail, false);
    assert.equal(C.cfs('5').label, 'CFS 5 - Living with mild frailty');
});

test('NG254 sepsis (ages 5 to 15): only with suspected infection; tables 2 and 3 thresholds', () => {
    const obs = (o) => ({ rr: 20, hr: 90, sats: 98, o2: 'Air', temp: 37, crt: 2, sbp: 115, avpu: 'A', ...o });
    assert.equal(C.sepsisNG254({ age: 16, infection: 'yes', obs: obs() }).applicable, false, '16+ is NG253');
    assert.equal(C.sepsisNG254({ age: 10, infection: null, obs: obs() }).status, 'not-asked');
    assert.equal(C.sepsisNG254({ age: 10, infection: 'no', obs: obs() }).status, 'not-suspected');
    assert.equal(C.sepsisNG254({ age: 10, pregnant: true, infection: 'yes', obs: obs() }).applicable, false);
    // Table 2, age 5: RR 29+ high, 24-28 moderate; HR 130+ high, 120-129 moderate
    assert.equal(C.sepsisNG254({ age: 5, infection: 'yes', obs: obs({ rr: 29 }) }).band, 'High');
    assert.equal(C.sepsisNG254({ age: 5, infection: 'yes', obs: obs({ rr: 24 }) }).band, 'Low');
    assert.equal(C.sepsisNG254({ age: 5, infection: 'yes', obs: obs({ rr: 23 }) }).band, 'Very low');
    assert.equal(C.sepsisNG254({ age: 5, infection: 'yes', obs: obs({ hr: 130 }) }).band, 'High');
    // Age 6-7: RR 27+ high; HR 110-119 moderate. Age 8-11: RR 25+ high, 22-24 moderate; HR 115+ high
    assert.equal(C.sepsisNG254({ age: 7, infection: 'yes', obs: obs({ rr: 27 }) }).band, 'High');
    assert.equal(C.sepsisNG254({ age: 7, infection: 'yes', obs: obs({ hr: 110, rr: 24 }) }).band, 'Medium', 'two moderate criteria');
    assert.equal(C.sepsisNG254({ age: 11, infection: 'yes', obs: obs({ rr: 25 }) }).band, 'High');
    assert.equal(C.sepsisNG254({ age: 11, infection: 'yes', obs: obs({ hr: 115 }) }).band, 'High');
    assert.equal(C.sepsisNG254({ age: 11, infection: 'yes', obs: obs({ hr: 105 }) }).band, 'Low');
    assert.equal(C.sepsisNG254({ age: 9, infection: 'yes', obs: obs({ hr: 55 }) }).band, 'High', 'HR under 60');
    assert.equal(C.sepsisNG254({ age: 9, infection: 'yes', obs: obs({ sats: 89 }) }).band, 'High');
    assert.equal(C.sepsisNG254({ age: 9, infection: 'yes', obs: obs({ sats: 91 }) }).band, 'Low');
    assert.equal(C.sepsisNG254({ age: 9, infection: 'yes', obs: obs({ sats: 89, o2: 'O2' }) }).band, 'Very low', 'sats thresholds are in air');
    assert.equal(C.sepsisNG254({ age: 9, infection: 'yes', obs: obs({ crt: 3, temp: 35.8 }) }).band, 'Medium');
    assert.equal(C.sepsisNG254({ age: 9, infection: 'yes', obs: obs({ avpu: 'V' }) }).band, 'High');
    assert.equal(C.sepsisNG254({ age: 9, infection: 'yes', obs: obs(), ticks: { rash: true } }).band, 'High');
    assert.equal(C.sepsisNG254({ age: 9, infection: 'yes', obs: obs(), ticks: { leg_pain: true, cold_peripheries: true } }).band, 'Medium');
    // Table 3 (12-15): RR 25+ high, 21-24 moderate; HR >130 high, 91-130 moderate; SBP <=90 high, 91-100 bloods
    assert.equal(C.sepsisNG254({ age: 13, infection: 'yes', obs: obs({ rr: 25 }) }).band, 'High');
    assert.equal(C.sepsisNG254({ age: 13, infection: 'yes', obs: obs({ rr: 21 }) }).band, 'Low');
    assert.equal(C.sepsisNG254({ age: 13, infection: 'yes', obs: obs({ hr: 131 }) }).band, 'High');
    assert.equal(C.sepsisNG254({ age: 13, infection: 'yes', obs: obs({ hr: 130 }) }).band, 'Low');
    assert.equal(C.sepsisNG254({ age: 13, infection: 'yes', obs: obs({ sbp: 90 }) }).band, 'High');
    assert.equal(C.sepsisNG254({ age: 13, infection: 'yes', obs: obs({ sbp: 100 }) }).band, 'Medium', 'NG254 1.7.15: SBP 91-100 alone needs the bloods');
    assert.equal(C.sepsisNG254({ age: 13, infection: 'yes', obs: obs({ hr: 95 }), immunosuppressed: true }).band, 'Medium');
    assert.equal(C.sepsisNG254({ age: 13, infection: 'yes', obs: obs({ rr: 18 }) }).band, 'Very low');
    assert.equal(C.sepsisNG254({ age: 13, infection: 'yes', obs: { rr: 18 } }).provisional, true, 'missing obs make a non-high result provisional');
    assert.match(C.sepsisNG254({ age: 13, infection: 'yes', obs: obs({ rr: 26 }) }).actions, /within 1 hour/);
});

test('NG254 sepsis table 1 (under 5s): age-band RR/HR, sats, CRT, temperature and ticks', () => {
    const obs = (o) => ({ rr: 30, hr: 110, sats: 98, o2: 'Air', temp: 37, crt: 2, avpu: 'A', ...o });
    const r = (age, o, extra = {}) => C.sepsisNG254({ age, infection: 'yes', obs: obs(o), ...extra });
    assert.equal(r(3, {}).applicable, true);
    assert.equal(r(3, {}).ageText, 'under 5');
    assert.equal(r(3, {}).band, 'Very low');
    // Under 1 year: RR 60+ high, 50-59 moderate; HR 160+ high, 150-159 moderate
    assert.equal(r(0.5, { rr: 60 }).band, 'High');
    assert.equal(r(0.5, { rr: 59 }).band, 'Low');
    assert.equal(r(0.5, { rr: 49 }).band, 'Very low');
    assert.equal(r(0.5, { hr: 160 }).band, 'High');
    assert.equal(r(0.5, { hr: 150 }).band, 'Low');
    assert.equal(r(0.5, { hr: 150, rr: 50 }).band, 'Medium', 'two moderate criteria');
    // 1 to 2 years (up to the 3rd birthday): RR 50+ high, 40-49 moderate; HR 150+ high, 140-149 moderate
    assert.equal(r(1, { rr: 50 }).band, 'High');
    assert.equal(r(2.9, { rr: 40 }).band, 'Low', 'age 2.9 is still the 1 to 2 band');
    assert.equal(r(2.9, { hr: 150 }).band, 'High');
    assert.equal(r(2, { hr: 140 }).band, 'Low');
    // 3 to 4 years: RR 40+ high, 35-39 moderate; HR 140+ high, 130-139 moderate
    assert.equal(r(3, { rr: 40 }).band, 'High');
    assert.equal(r(4.9, { rr: 35 }).band, 'Low');
    assert.equal(r(4, { hr: 140 }).band, 'High');
    assert.equal(r(4, { hr: 130 }).band, 'Low');
    assert.equal(r(4, { hr: 129 }).band, 'Very low');
    assert.equal(r(2, { hr: 55 }).band, 'High', 'bradycardia under 60 at any age');
    // SpO2 in air: under 90 high, under 92 moderate; CRT 3+ moderate
    assert.equal(r(2, { sats: 89 }).band, 'High');
    assert.equal(r(2, { sats: 91 }).band, 'Low');
    assert.equal(r(2, { sats: 89, o2: 'O2' }).band, 'Very low', 'sats thresholds are in air');
    assert.equal(r(2, { crt: 3 }).band, 'Low');
    // Temperature: under 36 is HIGH risk under 5 (moderate at 5-11); 38+ under 3 months high; 39+ at 3-6 months moderate
    assert.equal(r(2, { temp: 35.9 }).band, 'High');
    assert.equal(C.sepsisNG254({ age: 9, infection: 'yes', obs: { rr: 20, hr: 90, sats: 98, o2: 'Air', temp: 35.9, crt: 2, avpu: 'A' } }).band, 'Low', 'still moderate at 5 to 11');
    assert.equal(r(2 / 12, { temp: 38 }).band, 'High');
    assert.equal(r(4 / 12, { temp: 38.5 }).band, 'Very low');
    assert.equal(r(4 / 12, { temp: 39 }).band, 'Low');
    assert.equal(r(0.5, { temp: 39.2 }).band, 'Low', '6 months counted in the 3 to 6 months band');
    assert.equal(r(1, { temp: 39.5 }).band, 'Very low', 'fever alone is not a criterion over 6 months');
    // ACVPU: P/U = does not wake (high); V is left to the ticks
    assert.equal(r(2, { avpu: 'P' }).band, 'High');
    assert.equal(r(2, { avpu: 'V' }).band, 'Very low');
    // Ticks
    assert.equal(r(2, {}, { ticks: { grunting: true } }).band, 'High');
    assert.equal(r(2, {}, { ticks: { weak_cry: true } }).band, 'High');
    assert.equal(r(2, {}, { ticks: { no_smile: true, pallor: true } }).band, 'Medium');
    assert.equal(r(2, {}, { ticks: { nasal_flaring: true } }).band, 'Low');
    // Missing obs and the under-3-months antibiotic note (1.7.4)
    assert.equal(C.sepsisNG254({ age: 2, infection: 'yes', obs: { rr: 30 } }).provisional, true);
    assert.deepEqual(C.sepsisNG254({ age: 2, infection: 'yes', obs: { rr: 30 } }).missing, ['HR', 'Temp', 'CRT']);
    assert.match(r(1 / 12, {}).actions, /Under 3 months/);
    assert.doesNotMatch(r(1, {}).actions, /Under 3 months/);
    assert.equal(C.sepsisNG253({ age: 3, infection: 'yes', news: { score: 0, complete: true } }).applicable, false);
});

test('v21.5: EDD is LMP + 280 calendar days across the clock change', () => {
    const g = C.gestationFromLmp('2026-04-04', new Date(2026, 9, 31));
    assert.equal(g.edd.getFullYear(), 2027); assert.equal(g.edd.getMonth(), 0); assert.equal(g.edd.getDate(), 9);
    const g2 = C.gestationFromLmp('2026-01-31', new Date(2026, 5, 1));
    assert.equal(g2.edd.getMonth(), 10); assert.equal(g2.edd.getDate(), 7);
});

test('v21.5: ROSIER is "not done" until marked complete', () => {
    assert.equal(C.rosier({}, false).text, 'ROSIER not done');
    assert.equal(C.rosier({ face: true }, false).text, 'ROSIER incomplete (score so far 1)');
    assert.equal(C.rosier({}, true).text, 'ROSIER 0: stroke unlikely but not excluded');
});
