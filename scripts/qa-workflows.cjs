// Production frontend regression checks. All private data and delivery calls are mocked.
// Only pdfDelivery.generatePdf reaches the local server. No live messages are sent.
// Build first; provide Playwright via PLAYWRIGHT_MODULE or a local playwright installation.
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browserName = process.env.QA_BROWSER || 'chromium';
if (!['chromium', 'firefox', 'webkit'].includes(browserName)) throw new Error('Unsupported QA_BROWSER: ' + browserName);
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { readFile, writeFile, mkdir } = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = process.env.QA_OUTPUT_DIR || path.join(root, '.qa-workflows');
const port = process.env.QA_PORT || '3012';
const origin = `http://localhost:${port}`;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const policy = { id: 7, userId: 11, insuredFullName: 'Saved Person', insuredEmail: 'saved@example.com', insuredPhone: '8642446300', carrierName: 'QA Carrier', policyNumber: 'QA-ONLY-7', eliminationPeriod: '0', dailyMaximum: '$250', lifetimeMaximum: '$100,000', careNeeds: ['NoneADL'], diagnosisCheckboxes: ['Other'], minAdlsRequired: '2', cognitiveImpairmentTrigger: 'yes', waiverOfPremium: 'no', assignmentOfBenefits: 'no' };
const initialStrategy = { id: 31, policyId: 7, userId: 11, strategyContent: '<h2>QA strategy</h2>', strategyHtml: '<h2>QA strategy</h2>', currentStage: 1, stage1Tasks: [{ id: 's1-1', label: 'Call test carrier', category: 'carrier-contact', completed: true }, { id: 's1-2', label: 'Collect test record', category: 'documents', completed: false }], stage2Tasks: [], stage3Tasks: [] };

(async () => {
  await mkdir(output, { recursive: true });
  const server = spawn(process.execPath, ['dist/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, NODE_ENV: 'production', PORT: port, APP_URL: origin, DATABASE_URL: '', ZAPIER_WEBHOOK_URL: '', VITE_ZAPIER_WEBHOOK_URL: '', BUILT_IN_FORGE_API_KEY: '', TWILIO_ACCOUNT_SID: '', TWILIO_AUTH_TOKEN: '' } });
  let browser, activePage;
  const passed = [];
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      try { ready = (await fetch(`${origin}/healthz`)).ok; } catch {}
      if (ready) break;
      await pause(100);
    }
    assert(ready, 'Local production server failed to start');
    browser = await playwright[browserName].launch(browserName === 'chromium' ? { args: ['--no-sandbox'] } : {});
    console.log(JSON.stringify({ browser: browserName, version: browser.version() }));
    async function setup(routeName, options = {}) {
      const page = await browser.newPage({ viewport: { width: options.width || 390, height: 900 } });
      activePage = page;
      await page.context().tracing.start({ screenshots: true, snapshots: true, sources: false });
      page.setDefaultTimeout(8000);
      page.setDefaultNavigationTimeout(30000);
      const state = { profile: { name: 'Saved Profile', email: 'profile@example.com', notificationPreferences: {} }, contacts: [], policy: options.noPolicy ? { id: 0 } : policy, strategy: options.noStrategy ? null : structuredClone(initialStrategy), completions: [], fail: options.fail || '', calls: [], errors: [] };
      page.on('pageerror', error => state.errors.push(error.message));
      await page.addInitScript(({ blocked, wizard }) => {
        localStorage.setItem('ltc_terms_accepted_v1', 'true');
        if (!wizard) localStorage.setItem('ltc_policy_form', JSON.stringify({ insuredFullName: 'Stale local draft', id: 999 }));
        if (blocked) { Storage.prototype.getItem = function (key) { if (key === 'ltc_terms_accepted_v1') return 'true'; throw new Error('Storage blocked'); }; Storage.prototype.setItem = function () { throw new Error('Storage blocked'); }; }
      }, options);
      // A completed HTTP failure keeps external assets unavailable without inspector-aborted media requests hanging WebKit navigation.
      await page.route('https://**/*', route => route.fulfill({ status: 404, contentType: 'text/plain', body: 'External resource unavailable in isolated QA.' }));
      await page.route('**/api/trpc/**', async route => {
        const request = route.request(), url = new URL(request.url());
        const paths = url.pathname.split('/api/trpc/')[1].split(',');
        if (paths.length === 1 && paths[0] === 'pdfDelivery.generatePdf') return route.continue();
        const inputs = request.method() === 'GET' ? JSON.parse(url.searchParams.get('input') || '{}') : request.postDataJSON() || {};
        const responses = [];
        for (let index = 0; index < paths.length; index++) {
          const name = paths[index], input = inputs[index]?.json ?? inputs.json ?? {};
          state.calls.push({ name, input });
          if (name === state.fail) {
            await pause(200);
            responses.push({ error: { json: { message: 'QA service unavailable', code: -32603, data: { code: 'SERVICE_UNAVAILABLE', httpStatus: 503, path: name } } } });
            continue;
          }
          let data = null;
          if (name === 'auth.getProfile') data = state.profile;
          if (name === 'auth.updateProfile') { await pause(100); state.profile = { ...state.profile, ...input }; data = { success: true }; }
          if (name === 'contacts.list') data = state.contacts;
          if (name === 'contacts.add') { state.contacts.push({ ...input, id: 23 }); data = { id: 23 }; }
          if (name === 'contacts.update') { state.contacts = state.contacts.map(contact => contact.id === input.id ? { ...contact, ...input } : contact); data = { success: true }; }
          if (name === 'contacts.delete') { state.contacts = state.contacts.filter(contact => contact.id !== input.id); data = { success: true }; }
          if (name === 'policy.get') data = state.policy;
          if (name === 'policy.save') { state.policy = { ...state.policy, ...input, id: 7 }; data = { id: 7 }; }
          if (name === 'strategy.getByPolicy') data = state.strategy;
          if (name === 'strategy.getTaskCompletions') data = state.completions;
          if (name === 'strategy.generate') { await pause(100); state.strategy = structuredClone(initialStrategy); data = { id: 31 }; }
          if (name === 'strategy.saveTaskCompletion') { await pause(100); state.completions = [...state.completions.filter(task => task.taskId !== input.taskId), input]; data = { success: true }; }
          if (name === 'policyForm.sendComprehensiveToZapier') data = { success: false, message: 'Mock handoff' };
          if (name === 'email.sendContactForm' || name === 'email.sendStrategy' || name === 'pdfDelivery.sendPdfByEmail') { await pause(100); data = { success: true, status: 'accepted', message: 'Accepted for email delivery. Inbox arrival is not yet confirmed.' }; }
          responses.push({ result: { data: { json: data } } });
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(url.searchParams.get('batch') === '1' ? responses : responses[0]) });
      });
      await page.goto(origin + routeName, { waitUntil: "domcontentloaded" });
      return { page, state };
    }
    async function finish(page, state, description) {
      assert.deepEqual(state.errors, [], description);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${description}: no horizontal document overflow`);
      passed.push(description);
      await page.close();
    }
    {
      const { page, state } = await setup('/profile');
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      await page.getByLabel('Display Name').fill('   ');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await page.getByText('Name is required.', { exact: true }).waitFor();
      assert.equal(state.calls.filter(call => call.name === 'auth.updateProfile').length, 0);
      await page.getByLabel('Display Name').fill('New McDonald');
      state.profile = { ...state.profile, name: 'Refreshed Server Name' };
      const queries = state.calls.filter(call => call.name === 'auth.getProfile').length;
      await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); window.dispatchEvent(new Event('visibilitychange')); Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }); window.dispatchEvent(new Event('visibilitychange')); });
      for (let i = 0; i < 30 && state.calls.filter(call => call.name === 'auth.getProfile').length === queries; i++) await pause(100);
      assert(state.calls.filter(call => call.name === 'auth.getProfile').length > queries, 'Profile refetch occurred during editing');
      assert.equal(await page.getByLabel('Display Name').inputValue(), 'New McDonald');
      await page.getByLabel('Email Address', { exact: true }).fill(' new@example.com ');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await page.getByText('Profile updated successfully', { exact: true }).waitFor();
      assert.equal(state.profile.email, 'new@example.com');
      await page.reload({ waitUntil: "domcontentloaded" }); await page.getByText('New McDonald', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Add Contact', exact: true }).click();
      await page.locator('#new-name').fill('Care Partner'); await page.locator('#new-email').fill('partner@example.com'); await page.locator('#new-relationship').fill('Sibling');
      await page.getByRole('button', { name: 'Add Contact', exact: true }).click();
      await page.getByRole('button', { name: 'Edit Care Partner' }).click();
      await page.getByLabel('Relationship (optional)', { exact: true }).fill('');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.getByText('Contact updated', { exact: true }).waitFor(); assert.equal(state.contacts[0].relationship, '');
      await page.getByRole('switch', { name: 'CC preference for Care Partner' }).click();
      await page.waitForFunction(() => document.querySelector('[aria-label="CC preference for Care Partner"]').getAttribute('aria-checked') === 'false');
      state.fail = 'auth.updateProfile';
      await page.getByRole('switch', { name: 'New policy notification preference' }).click();
      await page.getByText('Failed to save notification preference', { exact: true }).waitFor();
      assert.equal(await page.getByRole('switch', { name: 'New policy notification preference' }).getAttribute('aria-checked'), 'true');
      await page.getByRole('button', { name: 'Remove Care Partner' }).click();
      await page.getByText('Contact removed', { exact: true }).waitFor(); assert.equal(state.contacts.length, 0);
      await finish(page, state, 'Profile edits survive refetch; save/reload, contact add/edit/clear/CC/delete and preference rollback');
    }
    {
      const { page, state } = await setup('/profile', { fail: 'auth.getProfile' });
      await page.getByText('Profile could not be loaded.', { exact: false }).waitFor({ timeout: 15000 });
      assert(await page.getByRole('button', { name: 'Edit', exact: true }).isDisabled());
      await finish(page, state, 'Profile load failure is visible and cannot be mistaken for an empty profile');
    }
    {
      const { page, state } = await setup('/contact', { fail: 'email.sendContactForm' });
      await page.getByLabel('Full Name *').fill(' Person '); await page.getByLabel('Email Address *').fill('person@example.com'); await page.getByLabel('Message *').fill('   ');
      await page.getByRole('button', { name: 'Send Message', exact: true }).click(); await page.getByText('Message is required.', { exact: true }).waitFor();
      assert.equal(state.calls.filter(call => call.name === 'email.sendContactForm').length, 0);
      await page.getByLabel('Message *').fill(' Please help with my policy. ');
      await page.getByRole('button', { name: 'Send Message', exact: true }).click();
      assert(await page.getByLabel('Message *').isDisabled());
      await page.getByText('Failed to send message. Please try again.', { exact: true }).waitFor();
      assert.equal(await page.getByLabel('Message *').inputValue(), ' Please help with my policy. ');
      state.fail = ''; await page.getByRole('button', { name: 'Send Message', exact: true }).click();
      await page.getByText("Your message was accepted for delivery. We'll get back to you soon!", { exact: true }).waitFor();
      assert.equal(await page.getByLabel('Message *').inputValue(), '');
      assert.equal(state.calls.filter(call => call.name === 'email.sendContactForm').at(-1).input.message, 'Please help with my policy.');
      assert.equal(await page.getByRole('link', { name: 'Call to Schedule' }).getAttribute('href'), 'tel:+18642446300');
      await finish(page, state, 'Contact rejects blank messages, preserves failed drafts, prevents mid-send edits and shows booking fallback');
    }
    {
      const { page, state } = await setup('/strategy', { noPolicy: true });
      await page.getByRole('heading', { name: 'No Policy Information Found' }).waitFor();
      assert.equal(state.calls.filter(call => call.name === 'strategy.generate').length, 0);
      await finish(page, state, 'A local draft with a forged ID cannot replace a missing saved policy');
    }
    {
      const { page, state } = await setup('/strategy', { noStrategy: true, blocked: true, width: 1440 });
      await page.getByRole('button', { name: 'Generate My Strategy', exact: true }).click();
      await page.getByRole('heading', { name: 'Your Personalized Strategy', exact: true }).waitFor();
      assert.equal(state.calls.find(call => call.name === 'strategy.generate').input.policyId, 7);
      assert(state.calls.filter(call => call.name === 'strategy.getByPolicy').every(call => call.input.policyId === 7));
      await page.getByRole('button', { name: 'Checklist', exact: true }).click();
      const task = page.locator('label').filter({ hasText: 'Call test carrier' }).getByRole('checkbox');
      assert.equal(await task.getAttribute('aria-checked'), 'true');
      await task.click(); await page.waitForFunction(() => [...document.querySelectorAll('label')].find(node => node.textContent.includes('Call test carrier'))?.querySelector('[role="checkbox"]')?.getAttribute('aria-checked') === 'false');
      await page.reload({ waitUntil: "domcontentloaded" }); await page.getByRole('button', { name: 'Checklist', exact: true }).click();
      assert.equal(await task.getAttribute('aria-checked'), 'false');
      state.fail = 'strategy.saveTaskCompletion'; await task.click(); await page.getByText('Failed to update task.', { exact: true }).waitFor(); assert.equal(await task.getAttribute('aria-checked'), 'false');
      state.fail = '';
      await finish(page, state, 'Saved-policy generation with blocked storage; task unchecking persists after reload and failed updates stay unchanged');
    }
    {
      const { page, state } = await setup('/strategy');
      await page.getByRole('button', { name: 'Downloads', exact: true }).click();
      for (const [label, filename] of [['Download as PDF', 'strategy-primary.pdf'], ['Download Your Strategy PDF', 'strategy-panel.pdf']]) {
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: label, exact: label !== 'Download as PDF' }).click();
        const download = await downloadPromise;
        const destination = path.join(output, filename);
        await download.saveAs(destination);
        const bytes = await readFile(destination);
        assert.equal(bytes.subarray(0, 5).toString(), '%PDF-'); assert(bytes.length > 10000);
      }
      await page.getByRole('button', { name: 'Email to Someone', exact: true }).click();
      await page.getByLabel("Recipient's Email Address *").fill('bad'); await page.getByLabel("Recipient's Name *").fill('Recipient');
      await page.getByRole('button', { name: 'Send Strategy PDF by Email', exact: true }).click(); await page.getByText('Please enter a valid recipient email and name', { exact: true }).waitFor();
      assert.equal(state.calls.filter(call => call.name === 'pdfDelivery.sendPdfByEmail').length, 0);
      await page.getByLabel("Recipient's Email Address *").fill('recipient@example.com');
      await page.getByRole('button', { name: 'Send Strategy PDF by Email', exact: true }).click(); await page.getByText('Accepted for email delivery. Inbox arrival is not yet confirmed.', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Send My Plan', exact: true }).click(); await page.getByRole('button', { name: /Email Strategy/ }).click();
      await page.locator('#email-0').fill('person@example.com'); await page.getByRole('button', { name: 'Add Another Recipient' }).click(); await page.locator('#email-1').fill('bad');
      await page.getByRole('button', { name: 'Send Strategy', exact: true }).click(); await page.getByText('Enter a valid address for every recipient (maximum 10).', { exact: true }).waitFor();
      assert.equal(state.calls.filter(call => call.name === 'email.sendStrategy').length, 0);
      await page.locator('#email-1').fill(' PERSON@example.com '); await page.getByRole('button', { name: 'Send Strategy', exact: true }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' }); assert.deepEqual(state.calls.find(call => call.name === 'email.sendStrategy').input.recipients, ['person@example.com']);
      await finish(page, state, 'Both Strategy download controls return actual local-server PDFs; email validation, acceptance and recipient deduplication');
    }
    // Exercise the actual wizard controls in each CI browser, including tablet/mobile.
    for (const width of [1440, 768, 390]) {
      const { page, state } = await setup('/policy-form', { width, wizard: true, noPolicy: true });
      const next = () => page.getByRole('button', { name: 'Next', exact: true }).click();
      const checkStep = async number => {
        await page.getByText(`Step ${number} of 6`, { exact: true }).waitFor();
        assert.equal(await page.getByRole('progressbar', { name: 'Policy form steps' }).getAttribute('aria-valuenow'), String(number));
        assert.equal(await page.getByRole('button', { name: new RegExp(`^Step ${number}:`) }).getAttribute('aria-current'), 'step');
        for (let later=number+1;later<=6;later++) assert(await page.getByRole('button', { name: new RegExp(`^Step ${later}:`) }).isDisabled());
      };
      const invalid = async id => { await page.locator(`#${id}[aria-invalid="true"]`).waitFor(); };
      const reenter = async number => {
        const saved = await page.evaluate(() => localStorage.getItem('ltc_policy_form'));
        await page.getByRole('navigation', { name: 'Your LTC journey' }).getByRole('link', { name: 'Get support' }).click();
        await page.waitForURL('**/contact', { waitUntil: "domcontentloaded" });
        await page.getByRole('navigation', { name: 'Your LTC journey' }).getByRole('link', { name: 'Your policy' }).click();
        await checkStep(number); await page.reload({ waitUntil: "domcontentloaded" }); await checkStep(number);
        assert.equal(await page.evaluate(() => localStorage.getItem('ltc_policy_form')), saved);
      };
      await checkStep(1); await next();
      for (const id of ['insuredFullName','insuredEmail','insuredPhone']) await invalid(id);
      await page.locator('#insuredFullName').fill('Browser QA');
      await page.locator('#insuredEmail').fill('browser@example.com');
      await page.locator('#insuredPhone').fill('5551234567');
      await reenter(1); await next(); await checkStep(2); await next(); await invalid('carrierName');
      await page.locator('#carrierName').fill('Example Carrier');
      await reenter(2); await next(); await checkStep(3); await next(); await invalid('policyNumber');
      await page.locator('#policyNumber').fill('QA-ONLY-123');
      await reenter(3); await next(); await checkStep(4); await next();
      for (const id of ['dailyMaximum','lifetimeMaximum','eliminationPeriod','waiverOfPremium','assignmentOfBenefits','cognitiveImpairmentTrigger']) await invalid(id);
      await page.locator('#dailyMaximum').pressSequentially('250.50');
      await page.locator('#lifetimeMaximum').pressSequentially('100000');
      await page.locator('#eliminationPeriod').fill('0');
      assert.equal(await page.locator('#dailyMaximum').inputValue(), '$250.50');
      for (const id of ['waiverOfPremium','assignmentOfBenefits','cognitiveImpairmentTrigger']) {
        await page.locator('#'+id).click(); await page.getByRole('option', { name: 'No', exact: true }).click();
      }
      await reenter(4); await next(); await checkStep(5); await next();
      await invalid('careNeeds'); await invalid('diagnosisCheckboxes');
      await page.getByRole('group', { name: 'Primary Diagnosis or Condition (required)' }).getByRole('checkbox', { name: 'Other', exact: true }).check();
      await page.getByRole('group', { name: 'Activities of Daily Living (required)' }).getByRole('checkbox', { name: 'None of these ADLs apply', exact: true }).check();
      await reenter(5); await next(); await checkStep(6); await reenter(6);
      await page.locator('#policy-step-heading').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `wizard-review-${width}.png`) });
      await page.getByRole('button', { name: 'Generate Strategy', exact: true }).click();
      await page.waitForURL('**/strategy', { waitUntil: "domcontentloaded" });
      const saves=state.calls.filter(call=>call.name==='policy.save');
      assert(saves[0].input.id==null); assert(saves.slice(1).every(call=>call.input.id===7));
      await finish(page, state, `${width}px wizard: required fields, typed currency, sequential progress, six-step route/reload recovery and final save`);
    }
    console.log(JSON.stringify({ passed: passed.length, results: passed }, null, 2));
  } catch (error) {
    if (activePage && !activePage.isClosed()) {
      await activePage.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
      await writeFile(path.join(output, 'failure-state.json'), JSON.stringify(await Promise.race([activePage.evaluate(() => ({ url: location.href, readyState: document.readyState, heading: document.querySelector('#policy-step-heading')?.textContent, step: localStorage.getItem('ltc_policy_step') })).catch(() => ({})), new Promise(resolve => setTimeout(() => resolve({ diagnostic: 'Page evaluation unavailable' }), 2000))]), null, 2));
      await activePage.context().tracing.stop({ path: path.join(output, 'failure-trace.zip') }).catch(() => {});
    }
    console.error(error); console.log(JSON.stringify({ completed: passed }, null, 2)); process.exitCode = 1;
  } finally { if (browser) await browser.close(); server.kill(); }
})();
