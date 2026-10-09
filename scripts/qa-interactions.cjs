const { clickControl } = require('./qa-browser-helpers.cjs');
// Focused regressions for existing chat, sharing, menu and video controls.
// Private data, model responses and browser media APIs are fixtures; no messages leave this process.
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browserName = process.env.QA_BROWSER || 'chromium';
if (!['chromium', 'firefox', 'webkit'].includes(browserName)) throw new Error('Unsupported QA_BROWSER: ' + browserName);
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = process.env.QA_OUTPUT_DIR || path.join(root, '.qa-interactions');
const origin = `http://localhost:${process.env.QA_PORT || 3015}`;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  await fs.mkdir(output, { recursive: true });
  const server = spawn(process.execPath, ['dist/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, NODE_ENV: 'production', PORT: new URL(origin).port, APP_URL: origin, DATABASE_URL: '', ZAPIER_WEBHOOK_URL: '', VITE_ZAPIER_WEBHOOK_URL: '', BUILT_IN_FORGE_API_KEY: '', TWILIO_ACCOUNT_SID: '', TWILIO_AUTH_TOKEN: '' } });
  let browser;
  const checks = [], errors = [], messages = [];
  try {
    let ready = false;
    for (let i = 0; i < 50; i++) { try { ready = (await fetch(origin + '/healthz')).ok; } catch {} if (ready) break; await pause(100); }
    assert(ready, 'Server unavailable');
    browser = await playwright[browserName].launch(browserName === 'chromium' ? { args: ['--no-sandbox'] } : {});
    console.log(JSON.stringify({ browser: browserName, version: browser.version() }));
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(8000);
      page.setDefaultNavigationTimeout(30000);
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('ltc_terms_accepted_v1', 'true');
      window.__copies = []; window.__shareMode = 'copy'; window.__shares = [];
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { if (window.__shareMode === 'blocked') throw new DOMException('Denied', 'NotAllowedError'); window.__copies.push(text); } } });
      HTMLMediaElement.prototype.play = async function () { if (window.__videoMode !== 'success') throw new DOMException('Unsupported media', 'NotSupportedError'); this.dispatchEvent(new Event('play')); };
      HTMLMediaElement.prototype.pause = function () { this.dispatchEvent(new Event('pause')); };
    });
    // A completed HTTP failure keeps external assets unavailable without inspector-aborted media requests hanging WebKit navigation.
      await page.route('https://**/*', route => route.fulfill({ status: 404, contentType: 'text/plain', body: 'External resource unavailable in isolated QA.' }));
    await page.route('**/api/trpc/**', async route => {
      const req = route.request(), url = new URL(req.url());
      const procedures = url.pathname.split('/api/trpc/')[1].split(',');
      const inputs = req.method() === 'GET' ? JSON.parse(url.searchParams.get('input') || '{}') : req.postDataJSON() || {};
      const responses = [];
      for (let i = 0; i < procedures.length; i++) {
        const procedure = procedures[i], input = inputs[i]?.json ?? inputs.json ?? {};
        let data = procedure === 'policy.get' ? { id: 0 } : null;
        if (procedure === 'chat.send') {
          messages.push(input); await pause(100);
          if (input.message === 'QA failure') { responses.push({ error: { json: { message: 'QA unavailable', code: -32603, data: { code: 'SERVICE_UNAVAILABLE', httpStatus: 503, path: procedure } } } }); continue; }
          data = { content: 'QA response: ' + input.message, sessionId: input.sessionId };
        }
        responses.push({ result: { data: { json: data } } });
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(url.searchParams.get('batch') === '1' ? responses : responses[0]) });
    });
    const prompts = ['What is an elimination period?', 'How do I file an LTC claim?', 'What ADLs qualify for benefits?', 'What documents do I need?', 'What is Assignment of Benefits?', 'How long does approval take?'];
    for (const prompt of prompts) {
      await page.goto(origin, { waitUntil: "domcontentloaded" }); await clickControl(page.getByRole('button', { name: 'Open LTC support chat' }));
      const chat = page.getByRole('dialog', { name: 'LTC support chat' });
      const before = messages.length;
      await clickControl(chat.getByRole('button', { name: prompt, exact: true }));
      await chat.getByText('QA response: ' + prompt, { exact: true }).waitFor();
      assert.equal(messages.length, before + 1); assert.equal(messages.at(-1).message, prompt);
      checks.push('Suggested prompt: ' + prompt);
    }
    const chat = page.getByRole('dialog', { name: 'LTC support chat' });
    const input = chat.getByLabel('Your LTC question');
    await input.fill('QA failure'); await input.press('Enter');
    await chat.getByText("I'm having trouble connecting right now.", { exact: false }).waitFor();
    await input.fill('QA retry'); const before = messages.length;
    await input.press('Enter'); await input.press('Enter');
    await chat.getByText('QA response: QA retry', { exact: true }).waitFor();
    assert.equal(messages.length, before + 1);
    await input.press('Escape'); assert.equal(await chat.count(), 0);
    checks.push('Chat provider failure, retry, duplicate-send guard and Escape');

    for (const [route, label, expected] of [['/', 'Share This Free Resource', origin + '/'], ['/academy', 'Share Academy', origin + '/academy'], ['/education', 'Share This Resource', origin + '/']]) {
      await page.goto(origin + route, { waitUntil: "domcontentloaded" });
      await clickControl(page.getByRole('button', { name: label, exact: true }));
      await page.waitForFunction(() => window.__copies.length === 1);
      assert.deepEqual((await page.evaluate(() => window.__copies)).map(value => new URL(value).href), [expected]);
      await page.evaluate(() => { window.__shareMode = 'blocked'; });
      await clickControl(page.getByRole('button', { name: label, exact: true }));
      await page.getByText('Unable to share automatically. Copy the page address from your browser to share it.', { exact: true }).waitFor();
      checks.push('Clipboard success and denial: ' + label);
    }
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => { Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.__shares.push(data); throw new DOMException('Cancelled', 'AbortError'); } }); });
    await clickControl(page.getByRole('button', { name: 'Share This Free Resource', exact: true }));
    await page.waitForFunction(() => window.__shares.length === 1);
    assert.equal(await page.locator('[data-sonner-toast]').count(), 0);
    assert.equal((await page.evaluate(() => window.__shares)).length, 1);
    checks.push('Native share cancellation is quiet');

    const video = page.locator('main video').first();
    const title = await video.getAttribute('aria-label'); assert(title);
    await clickControl(page.getByRole('button', { name: 'Play ' + title, exact: true }));
    await page.getByText('Video could not be played. Please try again later.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Pause ' + title, exact: true }).count(), 0);
    await page.evaluate(() => { window.__videoMode = 'success'; });
    await video.evaluate(element => { Object.defineProperty(element, 'duration', { configurable: true, value: 100 }); });
    await clickControl(page.getByRole('button', { name: 'Play ' + title, exact: true }));
    await page.getByRole('button', { name: 'Pause ' + title, exact: true }).waitFor();
    const seek = page.getByRole('slider', { name: 'Seek ' + title });
    await seek.press('ArrowRight'); assert.equal(await video.evaluate(element => element.currentTime), 5);
    await seek.press('End'); assert.equal(await video.evaluate(element => element.currentTime), 100);
    await seek.press('Home'); assert.equal(await video.evaluate(element => element.currentTime), 0);
    await clickControl(page.getByRole('button', { name: 'Mute ' + title, exact: true }));
    await page.getByRole('button', { name: 'Unmute ' + title, exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector('main video')?.muted === true);
    assert.equal(await video.evaluate(element => element.muted), true);
    await clickControl(page.getByRole('button', { name: 'Pause ' + title, exact: true }));
    await page.getByRole('button', { name: 'Play ' + title, exact: true }).waitFor();
    await video.dispatchEvent('error'); await page.getByText('Video is unavailable. Please try again later.', { exact: true }).waitFor();
    checks.push('Video rejection, play/pause, keyboard seeking, mute and media-error controls (media mocked)');

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    const menu = page.locator('#mobile-navigation');
    assert.equal(await menu.getAttribute('inert'), '');
    const menuLinks = await menu.locator('a[href^="/"]').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
    for (const href of menuLinks) {
      await clickControl(page.getByRole('button', { name: 'Open menu', exact: true }));
      await clickControl(menu.locator(`a[href=${JSON.stringify(href)}]`));
      await page.waitForURL(url => url.pathname === href, { waitUntil: "domcontentloaded" });
      assert.equal(await page.getByRole('button', { name: 'Open menu', exact: true }).getAttribute('aria-expanded'), 'false');
    }
    checks.push('All ' + menuLinks.length + ' mobile menu destinations and close-on-navigation');
    await clickControl(page.getByRole('button', { name: 'Help', exact: true }));
    const helper = page.getByRole('dialog', { name: 'Page help' });
    await helper.getByLabel('Helper question', { exact: true }).press('Escape'); assert.equal(await helper.count(), 0);
    checks.push('Mobile helper Escape');
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ checks: checks.length, errors: errors.length }));
  } catch (error) { await fs.writeFile(path.join(output, 'partial-results.json'), JSON.stringify({ checks, errors }, null, 2)); console.error(error); process.exitCode = 1; }
  finally { if (browser) await browser.close(); server.kill(); }
})();
