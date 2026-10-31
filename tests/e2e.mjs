// Browser scenario tests. Run: node tests/e2e.mjs  (needs Playwright + Chromium)
// Serves the repo itself so it works the same locally and in CI.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright'); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const URL = `http://localhost:${server.address().port}/index.html`;

const browser = await playwright.chromium.launch();
const results = [];
const check = (name, cond, detail = '') => results.push({ name, ok: !!cond, detail });

async function fresh(width = 943, opts = {}) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
    await ctx.addInitScript((o) => {
        try {
            if (!sessionStorage.getItem('__init')) {
                localStorage.clear();
                localStorage.setItem('seenVersion', '21.4');
                if (o.shared) localStorage.setItem('sharedComputer', 'on');
                sessionStorage.setItem('initials', o.initials ?? 'JT');
                sessionStorage.setItem('__init', '1');
            }
        } catch { /* ignore */ }
    }, opts);
    const page = await ctx.newPage();
    page.errors = [];
    page.on('pageerror', e => page.errors.push(e.message));
    await page.goto(URL);
    await page.waitForFunction(() => !!window.app);
    return page;
}
const note = (p) => p.inputValue('#epr-note');
const badge = (p) => p.textContent('#priority-display');
const pick = async (p, text) => { await p.fill('#input-complaint', text); await p.press('#input-complaint', 'Enter'); };
const disc = (p, text) => p.locator('.discriminator', { hasText: text }).first().click();
const setObs = async (p, o) => { for (const [k, v] of Object.entries(o)) await p.fill(`#obs-${k}`, String(v)); };
const seg = (p, id, val) => p.click(`#${id} button[data-value="${val}"]`);
const allErrors = [];

// 1. Blank screen: nothing assumed.
let p = await fresh();
check('Blank: NOT YET TRIAGED', (await badge(p)).includes('NOT YET TRIAGED'));
let n = await note(p);
check('Blank note: category not triaged', n.includes('TRIAGE CATEGORY: NOT YET TRIAGED'));
check('Blank note: pain not assessed', n.includes('Pain: Not assessed'));
check('Blank note: NEWS2 not calculated', n.includes('NEWS2: NOT CALCULATED'));
check('Blank note: no emoji / non-ASCII arrows', !/[⚠≥≤₂]/.test(n));
allErrors.push(...p.errors); await p.context().close();

// 2. Complaint search as nurses type.
p = await fresh();
for (const [q, want] of [['cp', 'Chest Pain'], ['sob', 'Shortness of Breath in Adults'], ['fall', 'Falls'], ['od', 'Overdose and Poisoning'], ['dib', 'Shortness of Breath in Adults'], ['head inj', 'Head Injury'], ['abdo', 'Abdominal Pain in Adults']]) {
    await p.fill('#input-complaint', q);
    const first = await p.locator('#complaint-list .combobox-option').first().getAttribute('data-name');
    check(`Search "${q}" -> ${want}`, first === want, first);
}
await p.fill('#input-complaint', 'chest pain');
check('Typing exact name in lower case selects it', await p.locator('.discriminator').count() > 5);
await p.fill('#patient-age', '4');
await p.fill('#input-complaint', 'sob');
check('Child: "sob" offers the children\'s chart first', (await p.locator('#complaint-list .combobox-option').first().getAttribute('data-name')) === 'Shortness of Breath in Children');
check('Child quick chips are paediatric', (await p.locator('#quick-actions-bar [data-chart]').first().getAttribute('data-chart')) === 'Unwell Child');
allErrors.push(...p.errors); await p.context().close();

// 3. Thunderclap headache stays on Headache and is Orange.
p = await fresh();
await p.fill('#patient-age', '45');
await pick(p, 'headache');
await p.click('#yn-assess-headache-sudden button[data-value="yes"]');
check('Thunderclap: still Headache flowchart', (await p.inputValue('#input-complaint')) === 'Headache');
check('Thunderclap: ORANGE', (await badge(p)).startsWith('ORANGE'));
await p.click('#yn-assess-headache-trauma button[data-value="yes"]');
check('Head trauma offers (not forces) switch', await p.locator('[data-action="switch-head-injury"]').count() === 1 && (await p.inputValue('#input-complaint')) === 'Headache');
allErrors.push(...p.errors); await p.context().close();

// 4. Ambulance 84y fall, no obs: never looks "normal".
p = await fresh();
await seg(p, 'seg-arrival', 'Ambulance');
await p.fill('#patient-age', '84');
await pick(p, 'Falls');
await disc(p, 'Able to weight bear');
n = await note(p);
check('Ambulance: mobility defaults to Trolley', (await p.getAttribute('#seg-mobility button.active', 'data-value')) === 'Trolley');
check('Ambulance: assumed Trolley is labelled in the note', n.includes('Mobility: Trolley (assumed from ambulance arrival, not confirmed)'));
await seg(p, 'seg-mobility', 'Trolley');
check('Ambulance: tapping the assumed Trolley confirms it', (await p.getAttribute('#seg-mobility button.active', 'data-value')) === 'Trolley' && !(await note(p)).includes('assumed'));
check('Ambulance fall: stream not Minors', !(await p.textContent('#stream-display')).includes('Minors'), await p.textContent('#stream-display'));
check('No obs: note says NEWS2 not calculated', n.includes('NEWS2: NOT CALCULATED'));
check('No obs: missing list asks for obs', (await p.textContent('#missing-list')).includes('Obs:'));
check('Crew handover card shown', await p.isVisible('#card-handover'));
allErrors.push(...p.errors); await p.context().close();

// 5. Afebrile SVT is not labelled sepsis unless infection is suspected.
p = await fresh();
await p.fill('#patient-age', '30');
await pick(p, 'Palpitations');
await setObs(p, { rr: 18, sats: 98, sbp: 118, hr: 182, temp: 36.8 });
await seg(p, 'seg-o2', 'Air'); await seg(p, 'seg-avpu', 'A');
n = await note(p);
check('SVT: no sepsis risk in note', !/Sepsis \(NICE NG253\): infection suspected/.test(n) && !/RED FLAG SEPSIS/.test(n));
check('SVT: infection question requested', (await p.textContent('#missing-list')).includes('Could this be an infection'));
check('SVT: NEWS2 complete 3 with single red param', n.includes('NEWS2: 3'), n.split('\n').find(l => l.startsWith('NEWS2')));
allErrors.push(...p.errors); await p.context().close();

// 6. Suspected infection + NEWS2 >= 7 = NG253 high risk.
p = await fresh();
await p.fill('#patient-age', '70');
await pick(p, 'Unwell Adult');
await setObs(p, { rr: 26, sats: 93, sbp: 95, hr: 125, temp: 38.9 });
await seg(p, 'seg-o2', 'Air'); await seg(p, 'seg-avpu', 'A');
await p.click('#yn-assess-infection button[data-value="yes"]');
n = await note(p);
check('Sepsis high risk from NEWS2 >= 7', n.includes('High risk') && n.includes('within 1 hour'), n.split('\n').find(l => l.startsWith('Sepsis')));
check('NEWS2 7+ gives RED', (await badge(p)).startsWith('RED'));
check('Next obs: continuous', (await p.textContent('#next-obs-display')) === 'Continuous');
allErrors.push(...p.errors); await p.context().close();

// 7. MTS pain ruler.
p = await fresh();
await p.fill('#patient-age', '30');
await pick(p, 'Limb Problems');
await disc(p, 'Minor Injury');
await p.click('.pain-btn[data-score="4"]');
check('Pain 4 -> stays GREEN', (await badge(p)).startsWith('GREEN'));
await p.click('.pain-btn[data-score="6"]');
check('Pain 6 (moderate) -> YELLOW', (await badge(p)).startsWith('YELLOW'));
await p.click('.pain-btn[data-score="8"]');
check('Pain 8 (severe) -> ORANGE', (await badge(p)).startsWith('ORANGE'));
check('Orange see-by is 10 minutes', (await p.textContent('#seeby')).includes('10-minute target'));
allErrors.push(...p.errors); await p.context().close();

// 8. Febrile toddler: traffic light amber, never auto-Blue.
p = await fresh();
await p.fill('#patient-age', '3');
await setObs(p, { hr: 160, rr: 40, temp: 39.5 });
check('Toddler: NOT YET TRIAGED (not Blue)', (await badge(p)).includes('NOT YET TRIAGED'));
check('Toddler: NICE traffic light AMBER', (await p.textContent('#ng143-result')).includes('AMBER'));
const screens = await p.evaluate(() => [...document.querySelectorAll('.screening-item')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id));
check('Toddler: no HIV / alcohol / veteran screening', !screens.some(s => /hiv|alcohol|veteran|homeless/.test(s)), screens.join(','));
allErrors.push(...p.errors); await p.context().close();

// 9. Paediatric dose guards.
p = await fresh();
await p.fill('#patient-age', '2'); await seg(p, 'seg-age-unit', 'Months');
await p.fill('#patient-weight', '5');
await p.click('#yn-assess-paeds-recentDose button[data-value="no"]');
check('2 months: no dose shown', (await p.textContent('#paeds-doses')).includes('Under 3 months'));
await p.fill('#patient-age', '4'); await p.fill('#patient-weight', '4.5');
check('4 months, 4.5 kg: ibuprofen not suitable', (await p.textContent('#paeds-doses')).includes('Ibuprofen: not suitable'));
await p.fill('#patient-age', '4'); await seg(p, 'seg-age-unit', 'Years'); await p.fill('#patient-weight', '16');
check('4 years 16 kg: paracetamol 240 mg', (await p.textContent('#paeds-doses')).includes('Paracetamol 240 mg'));
allErrors.push(...p.errors); await p.context().close();

// 10. NICE NG232 head injury.
p = await fresh();
await p.fill('#patient-age', '40');
await pick(p, 'Head Injury');
await p.check('input[data-path="assess.ng232.vomit"]');
check('Adult vomiting x2 -> CT within 1 hour', (await p.textContent('#ng232-result')).includes('within 1 hour'));
await p.fill('#patient-age', '8');
await p.check('input[data-path="assess.ng232.drowsy"]');
check('Child 1 risk factor -> observe 4 hours', (await p.textContent('#ng232-result')).includes('4 hours'));
allErrors.push(...p.errors); await p.context().close();

// 11. NEWS2 scale 2 on air.
p = await fresh();
await p.fill('#patient-age', '70');
await setObs(p, { sats: 96 }); await seg(p, 'seg-o2', 'Air'); await p.check('#obs-scale2');
check('Scale 2, 96% on air scores 0', !(await p.textContent('#visual-ews-container')).includes('SpO2 (scale 2) 96'));
await seg(p, 'seg-o2', 'O2');
check('Scale 2, 96% on O2 scores 2', (await p.textContent('#visual-ews-container')).includes('SpO2 (scale 2) 96 (+2)'));
allErrors.push(...p.errors); await p.context().close();

// 12. Keyboard workflow.
p = await fresh();
await p.fill('#patient-age', '50');
await p.focus('#input-complaint');
await p.keyboard.type('cp');
await p.keyboard.press('Enter');
check('Keyboard: Enter picks complaint and focuses discriminators', await p.evaluate(() => document.activeElement.classList.contains('discriminator')));
await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
await p.keyboard.press('Enter');
check('Keyboard: arrow + Enter selects a discriminator', await p.locator('.discriminator[aria-selected="true"]').count() === 1);
await p.focus('#obs-rr'); await p.keyboard.type('18'); await p.keyboard.press('Enter');
check('Keyboard: Enter moves RR -> SpO2', await p.evaluate(() => document.activeElement.id === 'obs-sats'));
await p.focus('#seg-avpu button[data-value="A"]'); await p.keyboard.press('v');
check('Keyboard: "v" sets ACVPU to V', await p.evaluate(() => window.app.state.obs.avpu === 'V'));
await p.focus('.pain-btn[data-score="0"]'); await p.keyboard.press('1'); await p.keyboard.press('0');
check('Keyboard: typing 1 then 0 sets pain 10', await p.evaluate(() => window.app.state.complaint.pain === 10));
await p.keyboard.press('Alt+n');
check('Alt+N starts a new patient', await p.evaluate(() => window.app.state.complaint.name === ''));
await p.locator('.toast button', { hasText: 'Undo' }).click();
check('Undo restores the previous patient', await p.evaluate(() => window.app.state.complaint.name === 'Chest Pain'));
await p.keyboard.press('Alt+c');
await p.waitForTimeout(200);
const clip = await p.evaluate(() => navigator.clipboard.readText());
check('Alt+C copies the note', clip.includes('TRIAGE NOTE'));
allErrors.push(...p.errors); await p.context().close();

// 13. SBAR, allergies, override, bloods, corridor care, chest pain ECG.
p = await fresh();
await p.fill('#patient-age', '72'); await seg(p, 'seg-sex', 'Female');
await pick(p, 'Chest Pain');
await disc(p, 'Cardiac-type chest pain at rest');
await p.fill('#allergies', 'Penicillin'); await p.fill('#allergy-reaction', 'anaphylaxis');
await p.click('#btn-sbar');
check('SBAR includes allergies', (await p.textContent('#sbar-b')).includes('Penicillin (anaphylaxis)'));
await p.click('#btn-close-sbar');
check('Chest pain: ECG due shown', (await p.textContent('#ecg-panel')).includes('Due by'));
await p.click('[data-action="ecg-done"]');
check('ECG done recorded in note', (await note(p)).includes('ECG: done'));
const acs = p.locator('.profile-check', { hasText: 'AE Acute Coronary Syndrome' });
check('Chest pain adult: ACS bundle suggested', (await acs.getAttribute('class')).includes('plan-suggested'));
check('Chest pain: ECG is "Do now" with the 10-minute timing', (await p.locator('#protocol-actions .protocol-check', { hasText: '12-lead ECG' }).getAttribute('class')).includes('plan-now') && (await p.textContent('#protocol-actions')).includes('Within 10 minutes'));
await acs.locator('input').check();
await acs.locator('.status-btn[data-status="Requested"]').click();
check('Bloods profile with status in note', (await note(p)).includes('AE Acute Coronary Syndrome (Requested)'));
await p.click('#btn-override-toggle'); await p.selectOption('#sel-override', 'Orange'); await p.fill('#txt-override', 'Looks unwell');
check('Override applies with reason', (await badge(p)).startsWith('ORANGE') && (await note(p)).includes('OVERRIDE: Looks unwell'));
await p.selectOption('#sel-disposition', 'Held on Ambulance');
check('Corridor care checklist appears', await p.isVisible('#corridor-panel'));
check('Pregnancy test universal check for 12-55 female (not 72)', !(await p.isVisible('#universal-checks-container')));
allErrors.push(...p.errors); await p.context().close();

// 13b. Nursing plan: bundles, triggers, cannula, placement, no imaging, pregnancy test.
p = await fresh();
check('Pregnancy test offered while age and sex are unknown', await p.isVisible('#universal-checks-container') && (await p.textContent('#universal-checks-container')).includes('Pregnancy test'));
await seg(p, 'seg-sex', 'Male');
check('No pregnancy test for a male patient', !(await p.isVisible('#universal-checks-container')));
await p.fill('#patient-age', '82'); await p.fill('#meds', 'Apixaban 5mg BD');
await pick(p, 'Head Injury');
const warf = p.locator('.profile-check', { hasText: 'AE Head Injury on Warfarin' });
check('Head injury on anticoagulant: Warfarin bundle suggested', (await warf.getAttribute('class')).includes('plan-suggested'));
check('Bundle shows its ICE contents', (await warf.textContent()).includes('Clotting Screen (INR)'));
await pick(p, 'Falls');
const nof = p.locator('.profile-check', { hasText: 'AE Fractured Neck of Femur' });
check('Falls: NOF bundle only "consider" before the discriminator', (await nof.getAttribute('class')).includes('plan-consider'));
await disc(p, 'Suspected neck of femur fracture');
check('Falls + suspected #NOF: NOF bundle suggested', (await nof.getAttribute('class')).includes('plan-suggested'));
check('Orange #NOF: cannula recommended with reasons', (await p.textContent('#protocol-actions')).includes('Cannula: Recommended') && (await p.textContent('.cannula-reasons')).includes('Suspected hip fracture'));
check('82-year-old: no urine dip for infection, culture only if suspected', !(await p.textContent('#protocol-actions')).includes('Urine dip') && (await p.textContent('#protocol-actions')).includes('Urine sample for culture'));
check('Note records the cannula decision', (await note(p)).includes('Cannula decision support: Recommended'));
check('Orange adult: Majors suggested', (await p.textContent('#placement-suggest')).includes('Majors cubicle'));
let planText = '';
for (const c of ['Chest Pain', 'Major Trauma', 'Abdominal Pain in Adults', 'Suspected DVT / PE']) { await pick(p, c); planText += await p.textContent('#card-plan'); }
check('Plan section has no imaging', !/x-?ray|\bCT\b|CTPA|FAST scan|ultrasound|MRI/i.test(planText));
await disc(p, 'Shock / haemodynamic collapse');
check('Red: Resus suggested', (await p.textContent('#placement-suggest')).includes('Resus'));
await p.locator('#placement-suggest .place-row', { hasText: 'Resus' }).first().locator('button').click();
check('"Use" sets the placement and the note', (await p.inputValue('#sel-disposition')) === 'Resus' && (await note(p)).includes('Placement: Resus'));
await pick(p, 'Abdominal Pain in Children');
await p.fill('#patient-age', '9'); await p.fill('#obs-bm', '16');
const ket = p.locator('#protocol-actions .protocol-check', { hasText: 'Capillary blood ketones' });
check('Child abdominal pain + high BM: ketones suggested', (await ket.getAttribute('class')).includes('plan-suggested'));
check('Child: cannula not needed now', (await p.textContent('#protocol-actions')).includes('Cannula: Not needed now'));
await p.fill('#obs-ketones', '4.1');
check('Child BM 16 + ketones 4.1: cannula now and gas now', (await p.textContent('#protocol-actions')).includes('Cannula: Insert now') && (await p.locator('#protocol-actions .protocol-check', { hasText: 'Venous blood gas' }).getAttribute('class')).includes('plan-now'));
await p.fill('#obs-ketones', '');
await pick(p, 'Rash');
const psep = p.locator('.profile-check', { hasText: 'AE - Sepsis (Paediatric)' });
check('Child rash: sepsis bloods not suggested for a blanching rash', (await psep.getAttribute('class')).includes('plan-consider'));
await disc(p, 'Non-blanching');
check('Child non-blanching rash: paediatric sepsis bloods suggested', (await psep.getAttribute('class')).includes('plan-suggested'));
allErrors.push(...p.errors); await p.context().close();
p = await fresh();
await p.fill('#patient-age', '60'); await seg(p, 'seg-sex', 'Male');
await pick(p, 'Sore Throat');
await p.click('#yn-assess-infection button[data-value="yes"]');
const sep = p.locator('.profile-check', { hasText: 'AE - Sepsis' });
check('Sore throat, infection yes, normal obs: sepsis bloods only "consider"', (await sep.getAttribute('class')).includes('plan-consider'));
await setObs(p, { rr: 24, sats: 95, sbp: 105, hr: 115, temp: 38.6 }); await seg(p, 'seg-o2', 'Air'); await seg(p, 'seg-avpu', 'A');
check('Sore throat with NEWS2 7 (high risk): sepsis bloods "do now"', (await sep.getAttribute('class')).includes('plan-now'));
check('High risk sepsis: blood cultures do now, with a NICE source link', (await p.locator('#protocol-actions .protocol-check', { hasText: 'Blood cultures' }).getAttribute('class')).includes('plan-now') && await p.locator('#protocol-actions a[href*="nice.org.uk/guidance/ng253"]').count() > 0);
check('High risk sepsis: cannula insert now', (await p.textContent('#protocol-actions')).includes('Cannula: Insert now'));
allErrors.push(...p.errors); await p.context().close();

// 13b2. NICE NG254 for a 9-year-old with suspected infection.
p = await fresh();
await p.fill('#patient-age', '9'); await seg(p, 'seg-sex', 'Female');
await pick(p, 'Unwell Child');
await p.click('#yn-assess-infection button[data-value="yes"]');
check('NG254: sepsis panel for ages 5 to 15', (await p.textContent('#sepsis-screen-container')).includes('NICE NG254, aged 5 to 11'));
await setObs(p, { rr: 20, sats: 98, hr: 95, temp: 37.4, crt: 2 }); await seg(p, 'seg-o2', 'Air'); await seg(p, 'seg-avpu', 'A');
check('NG254: normal obs = low risk', (await p.textContent('#sepsis-result')).startsWith('Low risk'), await p.textContent('#sepsis-result'));
await setObs(p, { rr: 27 });
check('NG254: RR 27 at age 9 = high risk', (await p.textContent('#sepsis-result')).startsWith('High risk'), await p.textContent('#sepsis-result'));
check('NG254 high risk: gas do now', (await p.locator('#protocol-actions .protocol-check', { hasText: 'Venous blood gas' }).getAttribute('class')).includes('plan-now'));
check('NG254 high risk: paediatric sepsis bloods do now with an NG254 link', (await p.locator('.profile-check', { hasText: 'AE - Sepsis (Paediatric)' }).getAttribute('class')).includes('plan-now') && await p.locator('#protocol-actions a[href*="nice.org.uk/guidance/ng254"]').count() > 0);
check('NG254 high risk: in the note', (await note(p)).includes('Sepsis (NICE NG254): infection suspected - High risk'));
allErrors.push(...p.errors); await p.context().close();

// 13b3. NICE NG254 table 1 for a 2-year-old and a 2-month-old with suspected infection.
p = await fresh();
await p.fill('#patient-age', '2'); await seg(p, 'seg-sex', 'Male');
await pick(p, 'Unwell Child');
await p.click('#yn-assess-infection button[data-value="yes"]');
check('NG254 under 5: sepsis panel uses table 1', (await p.textContent('#sepsis-screen-container')).includes('NICE NG254, under 5'));
check('NG254 under 5: table 1 tick boxes shown', (await p.textContent('#sepsis-screen-container')).includes('Grunting'));
await setObs(p, { rr: 30, sats: 98, hr: 120, temp: 37.4, crt: 2 }); await seg(p, 'seg-o2', 'Air'); await seg(p, 'seg-avpu', 'A');
check('NG254 under 5: normal obs = low risk', (await p.textContent('#sepsis-result')).startsWith('Low risk'), await p.textContent('#sepsis-result'));
await setObs(p, { hr: 150 });
check('NG254 under 5: HR 150 at age 2 = high risk', (await p.textContent('#sepsis-result')).startsWith('High risk'), await p.textContent('#sepsis-result'));
check('NG254 under 5: paediatric sepsis bloods do now', (await p.locator('.profile-check', { hasText: 'AE - Sepsis (Paediatric)' }).getAttribute('class')).includes('plan-now'));
check('NG254 under 5: fever traffic light still in the Paediatric card', await p.locator('#ng143-result').count() === 1);
allErrors.push(...p.errors); await p.context().close();

p = await fresh();
await p.fill('#patient-age', '2'); await seg(p, 'seg-age-unit', 'Months');
await pick(p, 'Unwell Child');
await p.click('#yn-assess-infection button[data-value="yes"]');
await setObs(p, { rr: 45, sats: 98, hr: 140, temp: 38.2, crt: 2 }); await seg(p, 'seg-o2', 'Air'); await seg(p, 'seg-avpu', 'A');
check('NG254: 2 months with temp 38.2 = high risk', (await p.textContent('#sepsis-result')).startsWith('High risk'), await p.textContent('#sepsis-result'));
check('NG254: under 3 months antibiotic advice shown', (await p.textContent('#sepsis-actions')).includes('Under 3 months'));
allErrors.push(...p.errors); await p.context().close();

// 13c. Clinical Frailty Scale.
p = await fresh();
await p.fill('#patient-age', '81');
check('CFS: 65+ without a score is flagged as missing', (await p.textContent('#missing-list')).includes('Clinical Frailty Scale') && (await note(p)).includes('Clinical Frailty Scale: NOT RECORDED'));
check('CFS criteria hidden until asked for', !(await p.isVisible('#cfs-guide')));
await p.click('#btn-cfs-guide');
check('CFS criteria expand with all 9 levels', await p.isVisible('#cfs-guide') && (await p.locator('#cfs-guide .cfs-row').count()) === 9);
await p.locator('#cfs-guide .cfs-row[data-cfs="6"]').click();
check('CFS chosen from the criteria list', (await p.textContent('#cfs-readout')).includes('6 - living with moderate frailty') && (await note(p)).includes('Clinical Frailty Scale: 6 - Living with moderate frailty'));
check('CFS shown in the decision panel', (await p.textContent('#status-list')).includes('CFS 6'));
await p.focus('.cfs-btn[data-cfs="6"]'); await p.keyboard.press('4');
check('CFS keyboard entry', await p.evaluate(() => window.app.state.frailty.cfs === 4));
await p.click('.cfs-btn[data-cfs="4"]');
check('CFS cleared by clicking the chosen score again', await p.evaluate(() => window.app.state.frailty.cfs === null));
await p.fill('#patient-age', '8');
check('CFS hidden for children', !(await p.isVisible('#frailty-section')));
allErrors.push(...p.errors); await p.context().close();

// 14. Stroke & MEOWS.
p = await fresh();
await p.fill('#patient-age', '66');
await pick(p, 'Suspected Stroke');
await p.check('input[data-path="assess.stroke.rosier.face"]'); await p.check('input[data-path="assess.stroke.rosier.arm"]');
check('ROSIER 2 = stroke likely', (await p.textContent('#rosier-result')).includes('ROSIER 2'));
allErrors.push(...p.errors); await p.context().close();
p = await fresh();
await p.fill('#patient-age', '28'); await seg(p, 'seg-sex', 'Female'); await p.check('#check-pregnant');
check('Pregnant, blank obs: MEOWS not a false red', (await note(p)).includes('Local MEOWS: NOT CALCULATED') && (await badge(p)).includes('NOT YET TRIAGED'));
await seg(p, 'seg-avpu', 'U');
check('Pregnant, unresponsive: escalates', (await badge(p)).startsWith('ORANGE'));
allErrors.push(...p.errors); await p.context().close();

// 15. Recent patients, local ref, shared-computer mode.
p = await fresh();
await p.fill('#patient-ref', 'C12'); await p.fill('#patient-age', '45'); await seg(p, 'seg-sex', 'Male');
await pick(p, 'Chest Pain');
await p.waitForTimeout(1000);
await p.click('#btn-history');
check('Recent patients labelled by local ref', (await p.textContent('#history-list')).includes('C12'));
allErrors.push(...p.errors); await p.context().close();
p = await fresh(943, { shared: true });
check('Shared computer: Recent button hidden', !(await p.isVisible('#btn-history')));
allErrors.push(...p.errors); await p.context().close();

// 16. Section numbering follows what is on screen.
p = await fresh();
const order = () => p.evaluate(() => [...document.querySelectorAll('.workflow > .card')].filter(c => getComputedStyle(c).display !== 'none').map(c => c.id));
check('Self order', JSON.stringify(await order()) === JSON.stringify(['card-patient', 'card-complaint', 'card-obs', 'card-history', 'card-screening', 'card-plan']), JSON.stringify(await order()));
await seg(p, 'seg-arrival', 'Ambulance');
check('Ambulance adds crew handover as section 2', (await order())[1] === 'card-handover');
allErrors.push(...p.errors); await p.context().close();

// 16b. The decision panel stays on screen when scrolled (side-by-side, full screen, narrow).
for (const w of [943, 1920, 700]) {
    p = await fresh(w);
    await p.evaluate(() => window.scrollTo(0, 1500));
    await p.waitForTimeout(100);
    const top = await p.evaluate(() => document.getElementById('priority-display').getBoundingClientRect().top);
    check(`Category stays visible when scrolled at ${w}px`, top >= 0 && top < 300, `top=${top}`);
    check(`No horizontal scroll at ${w}px`, await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    allErrors.push(...p.errors); await p.context().close();
}

// 16c. Provisional NEWS2 from partial obs: labelled, lists what is not scored, never reassures.
p = await fresh();
await p.fill('#patient-age', '70');
await setObs(p, { rr: 24, sats: 93, hr: 112 });
let ews = await p.textContent('#visual-ews-container');
check('Partial obs: provisional NEWS2 shown with a minimum', ews.includes('Provisional NEWS2 at least 6 (3 of 7 obs)'), ews);
check('Partial obs: risk is "or higher"', ews.includes('Medium risk or higher'), ews);
check('Partial obs: missing obs named, not scored as 0', ews.includes('Systolic BP not scored yet') && ews.includes('not</strong> counted as 0'.replace(/<\/?strong>/g, '')), ews);
check('Partial obs: sticky strip shows provisional NEWS2', (await p.textContent('#ews-mini')).includes('provisional') && await p.isVisible('#ews-mini'));
n = await note(p);
check('Partial obs: note says PROVISIONAL and lists missing', n.includes('NEWS2: PROVISIONAL - at least 6 from 3 of 7 obs') && n.includes('Not yet recorded, not scored: Air/O2, Systolic BP, Consciousness, Temp'), n.split('\n').find(l => l.includes('NEWS2')));
check('Partial obs: note still ASCII only', !/[^\x00-\x7f]/.test(n.split('\n').find(l => l.includes('NEWS2')) || ''));
await p.fill('#obs-hr', '80');
ews = await p.textContent('#visual-ews-container');
check('Low partial score never reassures', ews.includes('Risk not known yet') && !/Low risk/.test(ews), ews);
check('Low partial score: next obs not pushed hours away', (await p.textContent('#next-obs-display')).includes('Finish the obs'), await p.textContent('#next-obs-display'));
await seg(p, 'seg-o2', 'Air'); await p.fill('#obs-sbp', '130'); await seg(p, 'seg-avpu', 'A'); await p.fill('#obs-temp', '37');
ews = await p.textContent('#visual-ews-container');
check('All 7 obs: full NEWS2, no longer provisional', ews.includes('NEWS2 4') && !ews.includes('Provisional'), ews);
allErrors.push(...p.errors); await p.context().close();

// 16d. Fewer taps: one-tap sex and mobility, obs run on without reaching for the next box.
p = await fresh();
await seg(p, 'seg-sex', 'Female'); await seg(p, 'seg-mobility', 'Walking');
n = await note(p);
check('One tap sets sex and mobility', n.includes('Female | Mobility: Walking'), n.split('\n').find(l => l.startsWith('Patient:')));
await seg(p, 'seg-sex', 'Female');
check('Tapping the chosen sex again clears it', (await note(p)).includes('sex not recorded'));
await seg(p, 'seg-o2', 'Air');
check('Choosing Air/O2 moves straight to systolic BP', await p.evaluate(() => document.activeElement && document.activeElement.id === 'obs-sbp'));
await p.click('#obs-rr'); await p.keyboard.type('18'); await p.keyboard.press('Enter'); await p.keyboard.type('97'); await p.keyboard.press('Enter');
await p.keyboard.press('o');
check('Keyboard: "o" on Air/O2 records O2 and moves on', await p.evaluate(() => window.app.state.obs.o2 === 'O2' && document.activeElement.id === 'obs-sbp'));
await p.click('#seg-avpu button[data-value="A"]'); await p.keyboard.press('v');
check('Keyboard: ACVPU key records and moves on', await p.evaluate(() => window.app.state.obs.avpu === 'V' && document.activeElement.id === 'obs-crt'));
check('Obs boxes show a Next key on phones', (await p.getAttribute('#obs-rr', 'enterkeyhint')) === 'next');
allErrors.push(...p.errors); await p.context().close();

// 16e. Phone width: provisional NEWS2 sits in the pinned bar.
p = await fresh(412);
await setObs(p, { rr: 30 });
check('Phone: provisional NEWS2 visible in pinned bar', await p.isVisible('#ews-mini') && (await p.textContent('#ews-mini')).includes('provisional'));
allErrors.push(...p.errors); await p.context().close();

// 17. Missing initials is flagged.
p = await fresh(943, { initials: '' });
check('Missing initials flagged', (await p.textContent('#missing-list')).includes('initials'));
allErrors.push(...p.errors); await p.context().close();

// 25. EPR note formatting (v21.4): plain + formatted copies, sections, settings switch; workflow fixes.
p = await fresh();
await seg(p, 'seg-arrival', 'Ambulance');
await seg(p, 'seg-arrival', 'Self');
check('Back to Self clears an assumed Trolley', await p.evaluate(() => window.app.state.patient.mobility === ''));
await p.fill('#patient-age', '30'); await seg(p, 'seg-sex', 'Female');
await p.check('#check-pregnant');
await seg(p, 'seg-sex', 'Male');
check('Male clears a hidden pregnancy tick (no MEOWS)', await p.evaluate(() => !window.app.state.patient.pregnant && window.app.derived.ews.type === 'NEWS2'));
await pick(p, 'Chest Pain'); await disc(p, 'Pleuritic chest pain');
await p.fill('#allergies', 'Penicillin <test> & co');
n = await note(p);
check('Note: category sits above the complaint', n.indexOf('TRIAGE CATEGORY:') > 0 && n.indexOf('TRIAGE CATEGORY:') < n.indexOf('PRESENTING COMPLAINT'));
check('Note: sections separated by a blank line', n.includes('\n\nPRESENTING COMPLAINT\n') && n.includes('\n\nHISTORY\n'));
await p.click('#btn-copy'); await p.waitForTimeout(200);
const fmt = await p.evaluate(async () => { const o = {}; for (const it of await navigator.clipboard.read()) for (const t of it.types) o[t] = await (await it.getType(t)).text(); return o; });
check('Copy puts plain text and HTML on the clipboard', !!fmt['text/plain'] && !!fmt['text/html'], Object.keys(fmt).join(','));
check('Plain copy matches the note', (fmt['text/plain'] || '').includes('TRIAGE NOTE') && !(fmt['text/plain'] || '').includes('<strong>'));
check('HTML copy has bold headings and labels', /<strong><u>PRESENTING COMPLAINT<\/u><\/strong>/.test(fmt['text/html'] || '') && (fmt['text/html'] || '').includes('<strong>Allergies:</strong>'));
check('HTML copy escapes typed text', (fmt['text/html'] || '').includes('Penicillin &lt;test&gt; &amp; co'));
check('Formatted preview is shown', (await p.innerHTML('#epr-note-formatted')).includes('<strong>'));
await p.click('#btn-settings'); await p.check('#set-plain-copy'); await p.click('#modal-settings [data-close-modal]');
await p.click('#btn-copy'); await p.waitForTimeout(200);
const plainOnly = await p.evaluate(async () => { const o = []; for (const it of await navigator.clipboard.read()) o.push(...it.types); return o; });
check('"Plain text only" copies no HTML', !plainOnly.includes('text/html'), plainOnly.join(','));
await pick(p, 'Shortness of Breath in Adults');
await p.fill('#patient-age', '4');
check('Adult flowchart for a child is flagged', (await p.textContent('#missing-list')).includes('Check the flowchart'));
allErrors.push(...p.errors); await p.context().close();

check('No JavaScript errors in any scenario', allErrors.length === 0, allErrors.join(' | '));

await browser.close();
server.close();
const failed = results.filter(r => !r.ok);
results.forEach(r => console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${!r.ok && r.detail ? `  -> ${r.detail}` : ''}`));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
