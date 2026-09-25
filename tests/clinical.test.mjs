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
    assert.equal(C.sepsisNG253({ age: 40, infection: 'yes', news: n(5) }).risk, 'Moderate');
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
    assert.equal(d.ibuprofen, 160);
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
