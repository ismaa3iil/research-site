// Optional browser checks. npm install --no-save playwright, then npx playwright install chromium.
// The static app and its numerical tests have no dependency on Playwright.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE||import.meta.url);
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const base=process.env.EXPLORER_URL||'http://127.0.0.1:4173/';
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const reports=[];
const ready=async()=>page.waitForFunction(()=>/^Centers ready · \d+ power samples$/.test(document.getElementById('calculation-status').textContent),{timeout:30000});
try{
  await page.goto(base);await ready();reports.push('Initial triangle and both full curves computed');
  assert.equal(await page.locator('#range-max').textContent(),'21.63');
  await page.locator('[data-power="2"]').click();await page.waitForFunction(()=>document.getElementById('center-distance').textContent==='0');
  assert.equal(await page.locator('#atomic-coordinates').textContent(),await page.locator('#hull-coordinates').textContent());reports.push('p=2 produces matching exact centroids');
  await page.locator('[data-power="8"]').click();await ready();
  const geometry=page.locator('#geometry'),rect=await geometry.boundingBox(),positions=JSON.parse(await geometry.getAttribute('data-vertex-positions'));
  const before=await page.locator('#hull-coordinates').textContent();
  await page.mouse.move(rect.x+positions[2][0],rect.y+positions[2][1]);await page.mouse.down();await page.mouse.move(rect.x+positions[2][0]+60,rect.y+positions[2][1]-32,{steps:10});await page.mouse.up();await ready();
  assert.notEqual(await page.locator('#hull-coordinates').textContent(),before);assert.match(await page.locator('#hull-probe').textContent(),/positive/);reports.push('Triangle vertex drag changes both centers and reports a positive motion probe');
  await geometry.press('ArrowRight');await ready();reports.push('Keyboard vertex motion computes a new probe');
  await page.locator('#focus').click();await page.locator('#fit').click();
  await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/triangle-desktop.png',fullPage:true});
  const dl=page.waitForEvent('download');await page.locator('#export-csv').click();const download=await dl;assert.match(download.suggestedFilename(),/triangle\.csv/);await download.saveAs('test-results/triangle.csv');reports.push('Curve CSV downloads');
  await page.locator('#tetrahedron-mode').click();await ready();assert.equal(await page.locator('#range-max').textContent(),'19.95');
  await page.locator('.vertex-details summary').click();const z=page.getByLabel('Vertex D z',{exact:true});const old=await page.locator('#hull-coordinates').textContent();await z.fill('-.45');await z.press('Tab');await ready();assert.notEqual(await page.locator('#hull-coordinates').textContent(),old);reports.push('Tetrahedron z editing changes its spatial center');
  const rect3=await geometry.boundingBox(),pos3=JSON.parse(await geometry.getAttribute('data-vertex-positions'));
  await page.mouse.move(rect3.x+pos3[1][0],rect3.y+pos3[1][1]);await page.mouse.down();await page.mouse.move(rect3.x+pos3[1][0]+30,rect3.y+pos3[1][1]-25,{steps:8});await page.mouse.up();await ready();reports.push('Tetrahedron vertex is draggable in three dimensions');
  const vertexBefore=await page.getByLabel('Vertex D z',{exact:true}).inputValue();await page.mouse.move(rect3.x+35,rect3.y+90);await page.mouse.down();await page.mouse.move(rect3.x+105,rect3.y+120,{steps:5});await page.mouse.up();assert.equal(await page.getByLabel('Vertex D z',{exact:true}).inputValue(),vertexBefore);reports.push('Orbit changes the view while preserving geometry');
  await page.locator('#chart-axis').selectOption('2');await page.screenshot({path:'test-results/tetrahedron-desktop.png',fullPage:true});
  await page.locator('#share').click();await page.waitForURL(url=>url.hash.length>0);const shared=page.url();const saved=await page.locator('#hull-coordinates').textContent();await page.goto(shared);await ready();assert.equal(await page.locator('#hull-coordinates').textContent(),saved);reports.push('Shared URL restores shape, power and view');
  await page.setViewportSize({width:390,height:844});await page.locator('#triangle-mode').click();await ready();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#toast').evaluate(e=>e.hidden=true);await page.screenshot({path:'test-results/triangle-mobile.png',fullPage:true});reports.push('390-pixel mobile layout has no horizontal overflow');
  await page.locator('#preset').selectOption('2');await ready();assert.equal(await page.locator('#power-number').inputValue(),'21.63');reports.push('Triangle upper-branch preset computes at p=21.63');
  await page.locator('#tetrahedron-mode').click();await page.locator('#preset').selectOption('2');await ready();assert.equal(await page.locator('#power-number').inputValue(),'19.95');reports.push('Tetrahedron upper-branch preset computes at p=19.95');
  assert.deepEqual(errors,[]);reports.push('No browser JavaScript errors');
  await writeFile('test-results/browser-report.json',JSON.stringify({base,passed:true,checks:reports},null,2));console.log(reports.join('\n'));
}finally{await browser.close();}
