import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function isElementInViewport(page, elementHandle) {
    try {
        const box = await elementHandle.boundingBox();
        if (!box) {
            return false;
        }

        const viewport = await page.viewport();
        if (!viewport) {
            return false;
        }

        return box.x < viewport.width &&
            box.x + box.width > 0 &&
            box.y < viewport.height &&
            box.y + box.height > 0;
    } catch (error) {
        console.log(`[Telegram] Error checking element visibility: ${error.message}`);
        return false;
    }
}

export async function scrollElementIntoView(page, elementHandle, maxAttempts = 1) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await elementHandle.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        await new Promise(resolve => setTimeout(resolve, randomDelay(100, 120)));

        const isVisible = await isElementInViewport(page, elementHandle);
        if (isVisible) {
            return true;
        }

        if (attempt < maxAttempts - 1) {
            console.log(`[Telegram] Element not visible after scrolling, attempt ${attempt + 2}/${maxAttempts}`);
        }
    }

    return false;
}

export async function scrollLeftContentFast(page, durationMs = 30000) {
    try {
        const start = Date.now();
        const totalDuration = durationMs;
        const patternDuration = Math.min(10000, totalDuration * 0.3);

        const leftSideHandle = await page.$('.LeftSearch--content');
        let box = null;
        if (leftSideHandle) {
            box = await leftSideHandle.boundingBox();
        }

        try {
            if (box) {
                const moveX = Math.max(1, Math.floor(box.x + 5));
                const moveY = Math.floor(box.y + box.height / 2);
                await page.mouse.move(moveX, moveY);
            } else {
                const viewport = await page.viewport();
                const moveX = 3;
                const moveY = Math.floor((viewport && viewport.height ? viewport.height : 800) / 2);
                await page.mouse.move(moveX, moveY);
            }
        } catch (e) {
        }

        const patternStart = Date.now();
        for (let pattern = 0; pattern < 2 && Date.now() - start < patternDuration; pattern++) {
            console.log(`[Telegram] Scroll pattern ${pattern + 1}/2: down-up`);

            for (let i = 0; i < 12 && Date.now() - start < patternDuration; i++) {
                try {
                    if (box) {
                        await page.mouse.wheel({ deltaY: 1000 });
                    } else {
                        await page.evaluate(() => {
                            const left = document.querySelector('.LeftSearch--content');
                            if (left) left.scrollBy(0, 1000);
                            else window.scrollBy(0, 1000);
                        });
                    }
                    await new Promise(resolve => setTimeout(resolve, randomDelay(20, 30)));
                } catch (e) { }
            }

            for (let i = 0; i < 4 && Date.now() - start < patternDuration; i++) {
                try {
                    if (box) {
                        await page.mouse.wheel({ deltaY: -400 });
                    } else {
                        await page.evaluate(() => {
                            const left = document.querySelector('.LeftSearch--content');
                            if (left) left.scrollBy(0, -400);
                            else window.scrollBy(0, -400);
                        });
                    }
                    await new Promise(resolve => setTimeout(resolve, randomDelay(20, 30)));
                } catch (e) { }
            }
        }

        console.log('[Telegram] Final fast scroll down...');
        while (Date.now() - start < totalDuration) {
            try {
                if (box) {
                    await page.mouse.wheel({ deltaY: 800 });
                } else {
                    await page.evaluate(() => {
                        const left = document.querySelector('.LeftSearch--content');
                        if (left) left.scrollBy(0, 800);
                        else window.scrollBy(0, 800);
                    });
                }
            } catch (e) {
                await page.evaluate(() => {
                    const left = document.querySelector('.LeftSearch--content');
                    if (left) left.scrollBy(0, 800);
                    else window.scrollBy(0, 800);
                });
            }

            await new Promise(resolve => setTimeout(resolve, randomDelay(30, 60)));
        }

        console.log(`[Telegram] Fast scroll of left panel completed (${Math.round(totalDuration / 1000)}s)`);
    } catch (error) {
        console.log(`[Telegram] Error during fast scroll of left panel: ${error.message}`);
    }
}

export function generateLinksFileName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const fileName = `telegram_links_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.txt`;
    // Files are created in the project root
    return path.join(__dirname, '..', fileName);
}

export async function saveLinkToFile(link, linksFile) {
    try {
        await fs.appendFile(linksFile, link + '\n', 'utf-8');
        console.log(`[Telegram] Link saved to file: ${link}`);
    } catch (error) {
        console.error(`[Telegram] Error saving link: ${error.message}`);
    }
}

export async function getLinkFromClipboard(page) {
    try {
        const link = await page.evaluate(async () => {
            try {
                const permission = await navigator.permissions.query({ name: 'clipboard-read' });
                if (permission.state === 'granted' || permission.state === 'prompt') {
                    const text = await navigator.clipboard.readText();
                    return text;
                }
            } catch (error) {
                const linkElements = document.querySelectorAll('a[href*="t.me"], input[value*="t.me"], div[data-href*="t.me"]');
                for (const el of linkElements) {
                    const href = el.href || el.value || el.getAttribute('data-href');
                    if (href && href.includes('t.me')) {
                        return href;
                    }
                }
            }
            return null;
        });

        return link;
    } catch (error) {
        console.log(`[Telegram] Failed to get link from clipboard: ${error.message}`);
        return null;
    }
}

