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
                localStorage.setItem('seenVersion', '20.0');
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
check('Ambulance: mobility defaults to Trolley', (await p.inputValue('#patient-mobility')) === 'Trolley');
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
await p.fill('#patient-age', '72'); await p.selectOption('#patient-sex', 'Female');
await pick(p, 'Chest Pain');
await disc(p, 'Cardiac-type chest pain at rest');
await p.fill('#allergies', 'Penicillin'); await p.fill('#allergy-reaction', 'anaphylaxis');
await p.click('#btn-sbar');
check('SBAR includes allergies', (await p.textContent('#sbar-b')).includes('Penicillin (anaphylaxis)'));
await p.click('#btn-close-sbar');
check('Chest pain: ECG due shown', (await p.textContent('#ecg-panel')).includes('Due by'));
await p.click('[data-action="ecg-done"]');
check('ECG done recorded in note', (await note(p)).includes('ECG: done'));
await p.locator('.profile-check input').check();
await p.locator('.profile-check .status-btn[data-status="Requested"]').click();
check('Bloods profile with status in note', (await note(p)).includes('AE Acute Coronary Syndrome (Requested)'));
await p.click('#btn-override-toggle'); await p.selectOption('#sel-override', 'Orange'); await p.fill('#txt-override', 'Looks unwell');
check('Override applies with reason', (await badge(p)).startsWith('ORANGE') && (await note(p)).includes('OVERRIDE: Looks unwell'));
await p.selectOption('#sel-disposition', 'Held on Ambulance');
check('Corridor care checklist appears', await p.isVisible('#corridor-panel'));
check('Pregnancy test universal check for 12-55 female (not 72)', !(await p.isVisible('#universal-checks-container')));
allErrors.push(...p.errors); await p.context().close();

// 14. Stroke & MEOWS.
p = await fresh();
await p.fill('#patient-age', '66');
await pick(p, 'Suspected Stroke');
await p.check('input[data-path="assess.stroke.rosier.face"]'); await p.check('input[data-path="assess.stroke.rosier.arm"]');
check('ROSIER 2 = stroke likely', (await p.textContent('#rosier-result')).includes('ROSIER 2'));
allErrors.push(...p.errors); await p.context().close();
p = await fresh();
await p.fill('#patient-age', '28'); await p.selectOption('#patient-sex', 'Female'); await p.check('#check-pregnant');
check('Pregnant, blank obs: MEOWS not a false red', (await note(p)).includes('Local MEOWS: NOT CALCULATED') && (await badge(p)).includes('NOT YET TRIAGED'));
await seg(p, 'seg-avpu', 'U');
check('Pregnant, unresponsive: escalates', (await badge(p)).startsWith('ORANGE'));
allErrors.push(...p.errors); await p.context().close();

// 15. Recent patients, local ref, shared-computer mode.
p = await fresh();
await p.fill('#patient-ref', 'C12'); await p.fill('#patient-age', '45'); await p.selectOption('#patient-sex', 'Male');
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

// 17. Missing initials is flagged.
p = await fresh(943, { initials: '' });
check('Missing initials flagged', (await p.textContent('#missing-list')).includes('initials'));
allErrors.push(...p.errors); await p.context().close();

check('No JavaScript errors in any scenario', allErrors.length === 0, allErrors.join(' | '));

await browser.close();
server.close();
const failed = results.filter(r => !r.ok);
results.forEach(r => console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${!r.ok && r.detail ? `  -> ${r.detail}` : ''}`));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
