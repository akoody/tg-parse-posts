import { plugin } from 'puppeteer-with-fingerprints';
import fs from 'fs/promises';
import { keywords, searchText, FINGERPRINT_PATH, PROFILE_DIR, BROWSER_DATA_DIR } from './config.js';
import { generateLinksFileName } from './utils.js';
import { processPosts } from './postProcessor.js';

async function main() {
    let browser;

    try {
        console.log('[Telegram] Starting Telegram Web parser...');

        await fs.mkdir(PROFILE_DIR, { recursive: true });
        await fs.mkdir(BROWSER_DATA_DIR, { recursive: true });

        const LINKS_FILE = generateLinksFileName();
        await fs.writeFile(LINKS_FILE, '', 'utf-8');
        console.log(`[Telegram] Links file created: ${LINKS_FILE}`);

        await plugin.setWorkingFolder(BROWSER_DATA_DIR);

        let fingerprint;

        try {
            const fingerprintExists = await fs
                .access(FINGERPRINT_PATH)
                .then(() => true)
                .catch(() => false);

            if (fingerprintExists) {
                const fingerprintData = await fs.readFile(FINGERPRINT_PATH, 'utf-8');
                fingerprint = JSON.parse(fingerprintData);
                console.log(`[Telegram] Loaded existing fingerprint from: ${FINGERPRINT_PATH}`);
            } else {
                console.log('[Telegram] Fingerprint not found, requesting new one...');
                fingerprint = await plugin.fetch('', {
                    tags: ['Microsoft Windows', 'Chrome'],
                });
                await fs.writeFile(FINGERPRINT_PATH, JSON.stringify(fingerprint, null, 2));
                console.log(`[Telegram] New fingerprint saved to: ${FINGERPRINT_PATH}`);
            }
        } catch (error) {
            console.error(`[Telegram] Error working with fingerprint: ${error.message}`);
            throw new Error(`Failed to load or save fingerprint: ${error.message}`);
        }

        plugin.useFingerprint(fingerprint.fingerprint);

        console.log('[Telegram] Launching browser...');
        browser = await plugin.launch({
            headless: false,
            userDataDir: PROFILE_DIR,
            timeout: 180000,
            args: [
                '--start-maximized',
                '--window-size=1430,870'
            ],
            defaultViewport: {
                width: 1430,
                height: 870
            }
        });

        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();
        await page.setDefaultNavigationTimeout(180000);

        await page.setViewport({
            width: 1430,
            height: 870
        });

        console.log('[Telegram] Navigating to https://web.telegram.org/a/...');
        await page.goto('https://web.telegram.org/a/', {
            waitUntil: 'load',
            timeout: 180000
        });

        console.log('[Telegram] Waiting for authorization...');
        console.log('[Telegram] You have 360 seconds (6 minutes) for manual authorization...');

        await new Promise(resolve => setTimeout(resolve, 6000));

        try {
            await page.waitForSelector('#telegram-search-input', {
                timeout: 360000,
                visible: true
            });
            console.log('[Telegram] ✓ Authorization successful! Selector #telegram-search-input found.');

            console.log('[Telegram] Starting posts processing...');
            await processPosts(page, keywords, searchText, LINKS_FILE);

        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.log('[Telegram] ⚠ Timeout expired. Selector #telegram-search-input was not found within 6 minutes.');
            } else {
                console.error(`[Telegram] Error waiting for selector: ${error.message}`);
            }
        }

        console.log('[Telegram] Parser finished work.');
        console.log('[Telegram] Browser profile saved to:', PROFILE_DIR);
        console.log('[Telegram] Fingerprint saved to:', FINGERPRINT_PATH);

    } catch (error) {
        console.error('[Telegram] Critical error:', error.message);
        console.error(error.stack);
    } finally {
        if (browser) {
            console.log('[Telegram] Closing browser...');
            await browser.close();
        }
        console.log('[Telegram] Work completed.');
    }
}

main().catch((error) => {
    console.error('[Telegram] Unhandled error:', error);
    process.exit(1);
});

