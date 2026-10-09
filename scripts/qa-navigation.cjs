// Checks every rendered route and every unique internal link transition at each viewport.
// All private data and chat requests are fixtures. No live messages are sent.
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browserName = process.env.QA_BROWSER || 'chromium';
if (!['chromium', 'firefox', 'webkit'].includes(browserName)) throw new Error('Unsupported QA_BROWSER: ' + browserName);
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = process.env.QA_OUTPUT_DIR || path.join(root, '.qa-navigation');
const origin = `http://localhost:${process.env.QA_PORT || 3014}`;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const mainRoutes = ['/', '/education', '/academy', '/policy-form', '/strategy', '/contact', '/profile', '/resources', '/terms', '/privacy'];
(async () => {
  await fs.mkdir(output, { recursive: true });
  const slugs = [...(await fs.readFile(path.join(root, 'shared/resourceGuides.ts'), 'utf8')).matchAll(/slug: '([^']+)'/g)].map(match => match[1]);
  const routes = [...mainRoutes, ...slugs.map(slug => '/resources/' + slug)];
  const server = spawn(process.execPath, ['dist/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, NODE_ENV: 'production', PORT: new URL(origin).port, APP_URL: origin, DATABASE_URL: '', ZAPIER_WEBHOOK_URL: '', VITE_ZAPIER_WEBHOOK_URL: '', BUILT_IN_FORGE_API_KEY: '', TWILIO_ACCOUNT_SID: '', TWILIO_AUTH_TOKEN: '' } });
  let browser, activePage;
  const result = { routes: [], transitions: [], anchors: [], helperChats: [], externalLinks: [], errors: [] };
  try {
    let ready = false;
    for (let i = 0; i < 50; i++) { try { ready = (await fetch(origin + '/healthz')).ok; } catch {} if (ready) break; await pause(100); }
    assert(ready, 'Server unavailable');
    browser = await playwright[browserName].launch(browserName === 'chromium' ? { args: ['--no-sandbox'] } : {});
    console.log(JSON.stringify({ browser: browserName, version: browser.version() }));
    for (const width of (process.env.QA_WIDTHS || '1440,768,390').split(',').map(Number)) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      activePage = page;
      page.setDefaultTimeout(8000);
      const calls = [];
      page.on('pageerror', error => result.errors.push({ width, route: new URL(page.url()).pathname, message: error.message }));
      await page.addInitScript(() => { localStorage.setItem('ltc_terms_accepted_v1', 'true'); window.__copiedLinks = []; Object.defineProperty(navigator, 'share', { configurable: true, value: undefined }); Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedLinks.push(text); } } }); });
      await page.route('https://**/*', route => route.abort());
      await page.route('**/api/trpc/**', async route => {
        const req = route.request(), url = new URL(req.url());
        const procedures = url.pathname.split('/api/trpc/')[1].split(',');
        const inputs = req.method() === 'GET' ? JSON.parse(url.searchParams.get('input') || '{}') : req.postDataJSON() || {};
        const responses = [];
        for (let index = 0; index < procedures.length; index++) {
          const procedure = procedures[index], input = inputs[index]?.json ?? inputs.json ?? {};
          calls.push({ procedure, input });
          let data = null;
          if (procedure === 'policy.get') data = { id: 0 };
          if (procedure === 'auth.getProfile') data = { name: 'QA Profile', email: 'qa@example.com', notificationPreferences: {} };
          if (procedure === 'contacts.list' || procedure === 'strategy.getTaskCompletions') data = [];
          if (procedure === 'policyForm.sendComprehensiveToZapier') data = { success: false };
          if (procedure === 'chat.send') {
            await pause(150);
            if (input.message === 'QA connection failure') { responses.push({ error: { json: { message: 'QA unavailable', code: -32603, data: { code: 'SERVICE_UNAVAILABLE', httpStatus: 503, path: procedure } } } }); continue; }
            data = { content: 'QA response: ' + input.message, sessionId: input.sessionId };
          }
          responses.push({ result: { data: { json: data } } });
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(url.searchParams.get('batch') === '1' ? responses : responses[0]) });
      });
      for (const source of routes) {
        await page.goto(origin + source, { waitUntil: "domcontentloaded" }); await page.locator('h1').first().waitFor();
        assert(await page.title(), `Missing title: ${source}`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Document overflow ${source} at ${width}`);
        assert(await page.evaluate(() => {
          const row = document.querySelector('header > div');
          const logo = row?.querySelector('a'), nav = row?.querySelector('nav');
          if (!row || !logo || !nav) return false;
          const bounds = row.getBoundingClientRect(), brand = logo.getBoundingClientRect(), links = nav.getBoundingClientRect();
          return brand.top >= bounds.top - 1 && brand.bottom <= bounds.bottom + 1 && (!links.width || brand.right <= links.left + 1);
        }), `Header overlap ${source} at ${width}`);
        const links = await page.locator('a[href]').evaluateAll(elements => elements.map(element => ({ raw: element.getAttribute('href'), url: element.href, label: element.textContent.trim() })));
        for (const link of links) {
          assert(link.raw !== '#', `Placeholder link on ${source}: ${link.label}`);
          if (/^https?:/.test(link.url) && !link.url.startsWith(locationOrigin())) result.externalLinks.push({ source, width, ...link });
        }
        function locationOrigin() { return origin; }
        const targets = [...new Map(links.filter(link => link.url.startsWith(origin) && !link.raw.startsWith('#')).map(link => [link.url, link])).values()];
        for (const target of targets) {
          const destination = new URL(target.url);
          if (destination.pathname === source && !destination.hash) continue; // No page transition.
          await page.goto(origin + source, { waitUntil: "domcontentloaded" }); await page.locator('h1').first().waitFor();
          let link = page.locator(`a[href=${JSON.stringify(target.raw)}]:visible:not([inert] a)`).first();
          if (!await link.count() && width < 1024) {
            await page.getByRole('button', { name: 'Help', exact: true }).click();
            await page.getByRole('dialog', { name: 'Page help' }).getByRole('button', { name: 'Files', exact: true }).click();
            link = page.locator(`a[href=${JSON.stringify(target.raw)}]:visible:not([inert] a)`).first();
          }
          if (!await link.count() && width < 1024) {
            const drawer = page.getByRole('dialog', { name: 'Page help' });
            if (await drawer.count()) await drawer.getByRole('button', { name: 'Close help' }).click();
            await page.getByRole('button', { name: 'Open menu', exact: true }).click();
            link = page.locator(`a[href=${JSON.stringify(target.raw)}]:visible:not([inert] a)`).first();
          }
          assert(await link.count(), `No reachable link: ${source} -> ${target.raw} at ${width}`);
          await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
          await link.click(); await page.waitForURL(url => url.pathname === destination.pathname && url.hash === destination.hash, { waitUntil: "domcontentloaded" });
          await page.locator('h1').first().waitFor(); await pause(70);
          if (!destination.hash && destination.pathname !== '/ltc-insurance-guide.html') assert(await page.evaluate(() => scrollY < 2), `Scroll reset failed: ${source} -> ${target.raw} at ${width}`);
          assert(!await page.getByText('This guide was not found.', { exact: false }).count(), `Missing guide: ${target.raw}`);
          result.transitions.push({ width, source, target: destination.pathname + destination.hash });
        }
        await page.goto(origin + source, { waitUntil: "domcontentloaded" }); await page.locator('h1').first().waitFor();
        await page.evaluate(() => window.scrollTo({ top: 350, behavior: "instant" }));
        const y = await page.evaluate(() => scrollY);
        await page.getByRole('button', { name: 'Open LTC support chat' }).click();
        const chat = page.getByRole('dialog', { name: 'LTC support chat' });
        const message = `QA route ${source} width ${width}`;
        await chat.getByLabel('Your LTC question').fill(message);
        await chat.getByRole('button', { name: 'Send question', exact: true }).click();
        await chat.getByText('QA response: ' + message, { exact: true }).waitFor();
        assert(Math.abs((await page.evaluate(() => scrollY)) - y) < 2, `Chat scrolled the page on ${source} at ${width}: before ${y}, after ${await page.evaluate(() => scrollY)}`);
        await chat.getByRole('button', { name: 'Close chat' }).click();
        result.routes.push({ route: source, width, chat: 'mock response passed', title: await page.title() });
        console.log(`Checked ${source} at ${width}px`);
      }
      // Existing glossary links must open the appropriate definition or section.
      const fragments = ['adl', 'glossary', 'plan-of-care', 'poa', 'aob', 'hipaa', 'claim-form', 'elimination-period', 'care-logs', 'invoicing', 'appeals', 'assessment', 'waiver', 'inflation'];
      for (const fragment of fragments) {
        await page.goto(origin + '/education#' + fragment, { waitUntil: "domcontentloaded" });
        const target = page.locator('#' + fragment); await target.waitFor({ state: 'visible' });
        await page.waitForFunction(id => { const top = document.getElementById(id)?.getBoundingClientRect().top; return top >= 60 && top <= 150; }, fragment, { timeout: 5000 });
        const top = await target.evaluate(element => element.getBoundingClientRect().top);
        assert(top >= 60 && top <= 150, `Anchor hidden or misplaced: ${fragment} at ${width}: ${top}`);
        result.anchors.push({ fragment, width });
      }
      // Same-path fragments and browser history must also reopen definitions.
      await page.goto(origin + '/education', { waitUntil: "domcontentloaded" });
      for (const fragment of ['aob', 'adl', 'elimination-period']) {
        await page.evaluate(fragment => history.pushState(null, '', '/education#' + fragment), fragment);
        const target = page.locator('#' + fragment); await target.waitFor({ state: 'visible' });
        await page.waitForFunction(id => { const top = document.getElementById(id)?.getBoundingClientRect().top; return top >= 60 && top <= 150; }, fragment, { timeout: 5000 });
        const top = await target.evaluate(element => element.getBoundingClientRect().top);
        assert(top >= 60 && top <= 150, `Same-path anchor misplaced: ${fragment} at ${width}: ${top}`);
      }
      await page.goBack({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => { const top = document.getElementById('adl')?.getBoundingClientRect().top; return top >= 60 && top <= 150; }, undefined, { timeout: 5000 });
      assert(new URL(page.url()).hash === '#adl');
      assert(await page.locator('#adl').evaluate(element => element.getBoundingClientRect().top >= 60 && element.getBoundingClientRect().top <= 150));
      await page.goForward({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => { const top = document.getElementById('elimination-period')?.getBoundingClientRect().top; return top >= 60 && top <= 150; }, undefined, { timeout: 5000 });
      assert(new URL(page.url()).hash === '#elimination-period');
      assert(await page.locator('#elimination-period').evaluate(element => element.getBoundingClientRect().top >= 60 && element.getBoundingClientRect().top <= 150));
      result.anchors.push({ width, history: 'Same-path fragment changes and back/forward passed' });
      // Verify the separate helper widget can be typed into without being remounted.
      await page.goto(origin + '/', { waitUntil: "domcontentloaded" }); await page.locator('h1').first().waitFor();
      let helper;
      if (width < 1024) { await page.getByRole('button', { name: 'Help', exact: true }).click(); helper = page.getByRole('dialog', { name: 'Page help' }); }
      else helper = page.getByRole('complementary', { name: 'Page helper' });
      const input = helper.getByLabel('Helper question', { exact: true });
      await input.pressSequentially('QA typed helper question'); assert.equal(await input.inputValue(), 'QA typed helper question');
      const before = calls.filter(call => call.procedure === 'chat.send').length;
      await input.press('Enter'); await input.press('Enter');
      await helper.getByText('QA response: QA typed helper question', { exact: true }).waitFor();
      assert.equal(calls.filter(call => call.procedure === 'chat.send').length, before + 1);
      await input.fill('QA second helper question'); await input.press('Enter');
      await helper.getByText('QA response: QA second helper question', { exact: true }).waitFor();
      const sent = calls.filter(call => call.procedure === 'chat.send').slice(-2);
      assert(sent[0].input.sessionId && sent[0].input.sessionId === sent[1].input.sessionId);
      result.helperChats.push({ width, focus: 'preserved', duplicateSend: 'blocked', session: 'preserved' });
      await page.close();
    }
    assert.deepEqual(result.errors, []);
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ routeChecks: result.routes.length, transitions: result.transitions.length, anchors: result.anchors.length, helperChats: result.helperChats.length, errors: result.errors.length }));
  } catch (error) {
    if (activePage && !activePage.isClosed()) {
      await activePage.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});
      await fs.writeFile(path.join(output,'failure-state.json'),JSON.stringify(await activePage.evaluate(()=>({url:location.href,title:document.title,scrollY,anchors:Array.from(document.querySelectorAll('[id]')).map(el=>({id:el.id,top:el.getBoundingClientRect().top})).filter(el=>['adl','aob','appeals','elimination-period'].includes(el.id))})).catch(()=>({})),null,2));
    }
    await fs.writeFile(path.join(output, 'partial-results.json'), JSON.stringify(result, null, 2)); console.error(error); process.exitCode = 1; }
  finally { if (browser) await browser.close(); server.kill(); }
})();
