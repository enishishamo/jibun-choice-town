#!/usr/bin/env node
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, '../state/art/map-repair-shots');
const CHROME_EXECUTABLE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5177/jibun-choice-town/';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = {
  steps: [],
  totalErrors: 0,
  screenshots: []
};

let errorCount = 0;
let pageErrors = [];
let consoleErrors = [];

async function captureErrors(page) {
  return {
    pageErrors: [...pageErrors],
    consoleErrors: [...consoleErrors]
  };
}

async function takeScreenshot(page, stepName, stepNumber) {
  try {
    // Emulate mobile viewport (375px width)
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });

    const filename = `mobile-qa-${String(stepNumber).padStart(2, '0')}-${stepName}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);

    // Set mobile user agent
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    );

    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`✓ Screenshot saved: ${filename}`);
    results.screenshots.push(filename);
    return filepath;
  } catch (e) {
    console.error(`✗ Screenshot failed at ${stepName}:`, e.message);
    errorCount++;
    return null;
  }
}

async function run() {
  let browser = null;

  try {
    console.log('\n🚀 Starting mobile map interaction QA...\n');

    // Launch browser
    browser = await puppeteer.launch({
      executablePath: CHROME_EXECUTABLE,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Setup error listeners
    pageErrors = [];
    consoleErrors = [];

    page.on('pageerror', (err) => {
      pageErrors.push(err.toString());
      console.error('❌ Page Error:', err.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.warn('⚠️ Console Error:', msg.text());
      }
    });

    // STEP 1: Open page, clear localStorage, reload
    console.log('\n📍 STEP 1: Opening page and clearing localStorage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Reload
    await page.reload({ waitUntil: 'networkidle2' });

    // Wait 1.5 seconds
    await new Promise(r => setTimeout(r, 1500));

    results.steps.push({
      step: 1,
      name: 'page-open-and-setup',
      success: true,
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length
    });
    console.log(`✓ Step 1 complete. Errors: ${consoleErrors.length} console, ${pageErrors.length} page`);

    // STEP 2: Initial screenshot
    console.log('\n📍 STEP 2: Taking initial screenshot...');
    errorCount = 0;
    pageErrors = [];
    consoleErrors = [];

    await takeScreenshot(page, 'initial', 2);

    results.steps.push({
      step: 2,
      name: 'initial-state',
      success: true,
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length
    });

    // STEP 3: Pan operation in .region-viewport
    console.log('\n📍 STEP 3: Performing pan operation...');
    errorCount = 0;
    pageErrors = [];
    consoleErrors = [];

    // Wait for viewport to be ready
    await page.waitForSelector('.region-viewport', { timeout: 5000 });

    // Get viewport bounds
    const viewportBounds = await page.evaluate(() => {
      const elem = document.querySelector('.region-viewport');
      if (!elem) return null;
      const rect = elem.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });

    if (viewportBounds) {
      // Perform drag from center-left to center-right
      const startX = viewportBounds.x + viewportBounds.width * 0.3;
      const startY = viewportBounds.y + viewportBounds.height * 0.5;
      const endX = viewportBounds.x + viewportBounds.width * 0.7;
      const endY = viewportBounds.y + viewportBounds.height * 0.5;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 5 });
      await page.mouse.up();

      await new Promise(r => setTimeout(r, 500)); // Wait for pan animation
    }

    await takeScreenshot(page, 'after-pan', 3);

    results.steps.push({
      step: 3,
      name: 'pan-operation',
      success: true,
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length
    });

    // STEP 4: Tap on a non-foggy district (find and click first available)
    console.log('\n📍 STEP 4: Tapping on non-foggy district...');
    errorCount = 0;
    pageErrors = [];
    consoleErrors = [];

    // Find non-foggy districts
    const nonFoggyDistrict = await page.evaluate(() => {
      const districts = document.querySelectorAll('.district-node');
      for (let d of districts) {
        if (!d.classList.contains('foggy')) {
          const rect = d.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
      }
      return null;
    });

    if (nonFoggyDistrict) {
      await page.mouse.click(nonFoggyDistrict.x, nonFoggyDistrict.y);
      await new Promise(r => setTimeout(r, 1000)); // Wait for zoom animation
      console.log('✓ District tapped');
    } else {
      console.warn('⚠️ No non-foggy district found');
    }

    await takeScreenshot(page, 'district-selected', 4);

    results.steps.push({
      step: 4,
      name: 'district-tap',
      success: nonFoggyDistrict !== null,
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length
    });

    // STEP 5: Tap on world-marker inside the district
    console.log('\n📍 STEP 5: Tapping on world-marker...');
    errorCount = 0;
    pageErrors = [];
    consoleErrors = [];

    // Find a world-marker
    const markerCoords = await page.evaluate(() => {
      const marker = document.querySelector('.world-marker');
      if (!marker) return null;
      const rect = marker.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });

    if (markerCoords) {
      await page.mouse.click(markerCoords.x, markerCoords.y);

      // Wait 680ms for the auto-transition to area screen
      await new Promise(r => setTimeout(r, 680));

      // Check if URL changed (indicating navigation to area screen)
      const currentUrl = page.url();
      const navigated = currentUrl.includes('/area/') || !currentUrl.includes('jibun-choice-town/');

      console.log(`✓ Marker tapped. Navigation: ${navigated}`);
    } else {
      console.warn('⚠️ No marker found');
    }

    await takeScreenshot(page, 'event-appeared', 5);

    results.steps.push({
      step: 5,
      name: 'marker-tap-and-transition',
      success: markerCoords !== null,
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length
    });

    // STEP 6: Return to home using back button or "もどる" button
    console.log('\n📍 STEP 6: Returning to home...');
    errorCount = 0;
    pageErrors = [];
    consoleErrors = [];

    // Try to find and click back button
    const backButtonFound = await page.evaluate(() => {
      // Try multiple selectors for back button
      let button = document.querySelector('.region-back');
      if (!button) {
        // Try button with text containing "もどる" or "戻る"
        const allButtons = document.querySelectorAll('button');
        for (let b of allButtons) {
          if (b.textContent.includes('もどる') || b.textContent.includes('戻る') || b.textContent.includes('地域全体')) {
            b.click();
            return true;
          }
        }
      } else {
        button.click();
        return true;
      }
      return false;
    });

    if (backButtonFound) {
      await new Promise(r => setTimeout(r, 1000)); // Wait for navigation animation
      console.log('✓ Back button clicked');
    } else {
      console.warn('⚠️ Back button not found, trying page navigation');
      // Fallback to browser back
      await page.goBack({ waitUntil: 'networkidle2' });
    }

    await takeScreenshot(page, 'return-to-home', 6);

    results.steps.push({
      step: 6,
      name: 'return-home',
      success: backButtonFound,
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length
    });

    // STEP 7: Verify visited state
    console.log('\n📍 STEP 7: Verifying visited state...');
    errorCount = 0;
    pageErrors = [];
    consoleErrors = [];

    const visitedMarkerFound = await page.evaluate(() => {
      const markers = document.querySelectorAll('.world-marker');
      for (let m of markers) {
        if (m.classList.contains('st-visited') || m.classList.contains('visited')) {
          return true;
        }
      }
      return false;
    });

    console.log(`✓ Visited state found: ${visitedMarkerFound}`);

    await takeScreenshot(page, 'visited-state', 7);

    results.steps.push({
      step: 7,
      name: 'visited-marker-verify',
      success: visitedMarkerFound,
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length
    });

    // STEP 8: Discover another district
    console.log('\n📍 STEP 8: Discovering another district...');
    errorCount = 0;
    pageErrors = [];
    consoleErrors = [];

    // Find a different non-foggy district
    const anotherDistrict = await page.evaluate(() => {
      const districts = document.querySelectorAll('.district-node');
      let foundCount = 0;
      for (let d of districts) {
        if (!d.classList.contains('foggy')) {
          foundCount++;
          if (foundCount > 1) { // Skip the first one we already clicked
            const rect = d.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          }
        }
      }
      return null;
    });

    if (anotherDistrict) {
      await page.mouse.click(anotherDistrict.x, anotherDistrict.y);
      await new Promise(r => setTimeout(r, 1000)); // Wait for zoom
      console.log('✓ Another district tapped');
    } else {
      console.warn('⚠️ No second non-foggy district found');
    }

    await takeScreenshot(page, 'discover-another-area', 8);

    results.steps.push({
      step: 8,
      name: 'discover-another-district',
      success: anotherDistrict !== null,
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length
    });

    // STEP 9: Tap on foggy district to see teaser toast
    console.log('\n📍 STEP 9: Tapping on foggy district...');
    errorCount = 0;
    pageErrors = [];
    consoleErrors = [];

    // First go back to home if we're zoomed in
    const isZoomedIn = await page.evaluate(() => {
      return document.querySelector('.district-node.foggy') === null;
    });

    if (isZoomedIn) {
      const backButton = await page.evaluate(() => {
        let button = document.querySelector('.region-back');
        if (!button) {
          const allButtons = document.querySelectorAll('button');
          for (let b of allButtons) {
            if (b.textContent.includes('もどる') || b.textContent.includes('戻る') || b.textContent.includes('地域全体')) {
              b.click();
              return true;
            }
          }
        } else {
          button.click();
          return true;
        }
        return false;
      });

      if (backButton) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Find and click foggy district
    const foggyFound = await page.evaluate(() => {
      const foggyDistrict = document.querySelector('.district-node.foggy');
      if (foggyDistrict) {
        const rect = foggyDistrict.getBoundingClientRect();
        // Store the position
        window._foggyPos = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        return true;
      }
      return false;
    });

    if (foggyFound) {
      const pos = await page.evaluate(() => window._foggyPos);
      await page.mouse.click(pos.x, pos.y);
      await new Promise(r => setTimeout(r, 500)); // Wait for toast to appear

      // Check if teaser toast appeared
      const teaserVisible = await page.evaluate(() => {
        return document.querySelector('.fog-teaser') !== null ||
               document.querySelector('[class*="teaser"]') !== null ||
               document.querySelector('[class*="fog"]') !== null;
      });

      console.log(`✓ Foggy tapped. Teaser visible: ${teaserVisible}`);
    } else {
      console.warn('⚠️ No foggy district found');
    }

    await takeScreenshot(page, 'undiscovered-state', 9);

    results.steps.push({
      step: 9,
      name: 'foggy-tap-teaser',
      success: foggyFound,
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length
    });

    // Collect all errors
    results.totalErrors = results.steps.reduce((sum, s) => sum + s.pageErrors + s.consoleErrors, 0);

    console.log('\n' + '='.repeat(60));
    console.log('📊 QA TEST RESULTS');
    console.log('='.repeat(60));

    results.steps.forEach(step => {
      const status = step.success ? '✓' : '✗';
      console.log(`${status} Step ${step.step}: ${step.name} | Errors: ${step.consoleErrors + step.pageErrors}`);
    });

    console.log(`\n📸 Screenshots saved: ${results.screenshots.length}`);
    results.screenshots.forEach((ss, i) => {
      console.log(`  ${i + 1}. ${ss}`);
    });

    console.log(`\n⚠️ Total errors: ${results.totalErrors}`);
    console.log('\n🎯 Evaluation: ');

    const allStepsSuccess = results.steps.every(s => s.success);
    const noErrors = results.totalErrors === 0;

    if (allStepsSuccess && noErrors) {
      console.log('✓✓✓ PASS: 完全な操作フローが成功し、エラーなし。');
      console.log('   これは子ども向けアプリとして十分に操作性が良く、');
      console.log('   マップ探索への興味を引き出す仕様になっている。');
    } else if (allStepsSuccess) {
      console.log(`⚠️ PARTIAL: 操作フロー成功だが、${results.totalErrors}件のエラーあり。`);
      console.log('   構造は良好だが、コンソールエラーの解消が必要。');
    } else {
      console.log('✗ FAIL: 一部の操作フローが失敗。');
      console.log('   UIの配置やイベント処理を確認が必要。');
    }

    // Write JSON report
    const reportPath = path.join(SCREENSHOT_DIR, '../map-repair-qa-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);

  } catch (error) {
    console.error('\n❌ Script error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run().catch(console.error);
