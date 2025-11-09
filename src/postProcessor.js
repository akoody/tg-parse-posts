import { randomDelay, scrollElementIntoView, isElementInViewport, scrollLeftContentFast, saveLinkToFile, getLinkFromClipboard } from './utils.js';

export async function processPosts(page, keywords, searchText, linksFile) {
    try {
        console.log('[Telegram] Clicking on search field...');
        await page.waitForSelector('#telegram-search-input', { timeout: 30000 });
        await page.click('#telegram-search-input');
        await new Promise(resolve => setTimeout(resolve, randomDelay(3000, 5000)));

        console.log('[Telegram] Looking for "Posts" section...');
        try {
            const postsSpan = await page.$$('div.LeftSearch div.Tab--interactive');
            if (postsSpan) {
                await postsSpan[3].click();
                console.log('[Telegram] Clicked on "Posts"');
                await new Promise(resolve => setTimeout(resolve, randomDelay(1500, 2500)));
            }
        } catch (error) {
            console.log('[Telegram] Failed to find "Posts" section, continuing...');
        }

        console.log('[Telegram] Entering search text...');
        await page.click('#telegram-search-input');
        await new Promise(resolve => setTimeout(resolve, randomDelay(500, 1000)));

        await page.evaluate(() => {
            const input = document.getElementById('telegram-search-input');
            if (input) {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        await page.type('#telegram-search-input', searchText, { delay: randomDelay(50, 150) });
        await new Promise(resolve => setTimeout(resolve, randomDelay(3000, 5000)));

        try {
            console.log('[Telegram] Looking for search icon...');
            const searchIcons = await page.$$('i.icon-search');
            if (searchIcons.length > 0) {
                const lastIcon = searchIcons[searchIcons.length - 1];
                await lastIcon.click();
                console.log(`[Telegram] Clicked on search icon (${searchIcons.length} found, clicked on the last one)`);
            } else {
                await page.keyboard.press('Enter');
                console.log('[Telegram] Pressed Enter');
            }
        } catch (error) {
        }


        await new Promise(resolve => setTimeout(resolve, randomDelay(1000, 1500)));

        console.log('[Telegram] Waiting for channels list to load...');
        await page.waitForSelector('div.LeftSearch--content div.ripple-container', {
            timeout: 30000,
            visible: true
        });

        try {
            console.log('[Telegram] Moving cursor left and fast scrolling channels list (40s)...');
            await scrollLeftContentFast(page, 30000);

            const initialChannels = await page.$$('div.LeftSearch--content div.ripple-container');
            console.log(`[Telegram] Channels visible after fast scroll: ${initialChannels.length}`);
        } catch (e) {
            console.log(`[Telegram] Error during initial fast scroll: ${e.message}`);
        }

        const keywordsList = keywords.split(' ').filter(word => word.trim().length > 0);
        console.log(`[Telegram] Keywords for search: ${keywordsList.join(', ')}`);

        let channelIndex = 0;
        let allChannels = [];
        let hasMoreChannels = true;
        let totalChannels = 0;

        while (hasMoreChannels) {
            await new Promise(resolve => setTimeout(resolve, randomDelay(130, 140)));
            allChannels = await page.$$('div.LeftSearch--content div.ripple-container');
            totalChannels = allChannels.length;

            console.log(`[Telegram] Found channels: ${totalChannels}, processing channel ${channelIndex + 1}`);

            if (channelIndex >= totalChannels) {
                console.log('[Telegram] Reached end of current channels list, performing fast scroll from left (25s)...');

                await scrollLeftContentFast(page, 30000);
                await new Promise(resolve => setTimeout(resolve, randomDelay(100, 150)));

                const newChannels = await page.$$('div.LeftSearch--content div.ripple-container');
                console.log(`[Telegram] Channels after additional scroll: ${newChannels.length} (previously ${totalChannels})`);

                if (newChannels.length <= totalChannels) {
                    hasMoreChannels = false;
                    console.log('[Telegram] No new channels loaded, finishing processing.');
                    break;
                }

                allChannels = newChannels;
                totalChannels = newChannels.length;
                continue;
            }
            await new Promise(resolve => setTimeout(resolve, randomDelay(60, 90)));

            try {
                const channel = allChannels[channelIndex];

                const isChannelVisible = await scrollElementIntoView(page, channel);
                if (!isChannelVisible) {
                    console.log(`[Telegram] Channel ${channelIndex + 1} not visible after scrolling, skipping`);
                    channelIndex++;
                    continue;
                }

                const stillVisible = await isElementInViewport(page, channel);
                if (!stillVisible) {
                    console.log(`[Telegram] Channel ${channelIndex + 1} not visible before click, skipping`);
                    channelIndex++;
                    continue;
                }

                await new Promise(resolve => setTimeout(resolve, randomDelay(90, 120)));

                await channel.click();
                await new Promise(resolve => setTimeout(resolve, randomDelay(90, 120)));
                await channel.click();

                console.log(`[Telegram] Opened channel ${channelIndex + 1}/${totalChannels}`);
                await new Promise(resolve => setTimeout(resolve, randomDelay(230, 250)));
                await page.waitForSelector('div.message-date-group', { timeout: 30000, visible: true });

                const messageGroups = await page.$$('div.message-date-group');

                if (messageGroups.length > 0) {
                    const lastGroup = messageGroups[messageGroups.length - 1];
                    await lastGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await new Promise(resolve => setTimeout(resolve, randomDelay(55, 60)));

                    const foundKeywords = await page.evaluate((keywordsList, groupElement) => {
                        const results = [];
                        const walker = document.createTreeWalker(
                            groupElement,
                            NodeFilter.SHOW_TEXT,
                            null
                        );

                        let node;
                        let textOffset = 0;
                        const fullText = groupElement.innerText || groupElement.textContent || '';

                        while (node = walker.nextNode()) {
                            const nodeText = node.textContent || '';
                            const nodeStart = fullText.indexOf(nodeText, textOffset);

                            for (const kw of keywordsList) {
                                const lowerKw = kw.toLowerCase();
                                const lowerNodeText = nodeText.toLowerCase();

                                if (lowerNodeText.includes(lowerKw)) {
                                    let searchIndex = 0;
                                    while ((searchIndex = lowerNodeText.indexOf(lowerKw, searchIndex)) !== -1) {
                                        const absolutePosition = nodeStart + searchIndex;

                                        try {
                                            const range = document.createRange();
                                            range.setStart(node, searchIndex);
                                            range.setEnd(node, searchIndex + kw.length);

                                            const rect = range.getBoundingClientRect();

                                            let targetElement = node.parentElement;
                                            while (targetElement && targetElement !== groupElement) {
                                                if (targetElement.tagName && targetElement.tagName !== 'SCRIPT' && targetElement.tagName !== 'STYLE') {
                                                    break;
                                                }
                                                targetElement = targetElement.parentElement;
                                            }

                                            if (targetElement && targetElement !== groupElement) {
                                                const elementId = `kw_${absolutePosition}_${kw}_${Date.now()}_${Math.random()}`;
                                                targetElement.setAttribute('data-temp-id', elementId);

                                                results.push({
                                                    keyword: kw,
                                                    elementId: elementId,
                                                    position: absolutePosition,
                                                    nodeText: nodeText,
                                                    keywordRect: {
                                                        top: rect.top + (window.scrollY || window.pageYOffset),
                                                        left: rect.left + (window.scrollX || window.pageXOffset),
                                                        height: rect.height,
                                                        width: rect.width
                                                    }
                                                });
                                            }
                                        } catch (e) {
                                            const parentElement = node.parentElement;
                                            if (parentElement) {
                                                const elementId = `kw_${absolutePosition}_${kw}_${Date.now()}_${Math.random()}`;
                                                parentElement.setAttribute('data-temp-id', elementId);

                                                results.push({
                                                    keyword: kw,
                                                    elementId: elementId,
                                                    position: absolutePosition,
                                                    nodeText: nodeText
                                                });
                                            }
                                        }

                                        searchIndex += kw.length;
                                    }
                                }
                            }

                            textOffset = nodeStart + nodeText.length;
                        }

                        results.sort((a, b) => b.position - a.position);

                        return results;
                    }, keywords, lastGroup);

                    if (foundKeywords && foundKeywords.length > 0) {
                        const foundItem = foundKeywords[0];
                        const keyword = foundItem.keyword;
                        console.log(`[Telegram] Found ${foundKeywords.length} keyword occurrences, processing only the last one: "${keyword}" (position: ${foundItem.position})`);

                        let shouldProcessElement = true;

                        try {
                            console.log(`[Telegram] Processing last found keyword: "${keyword}"`);

                            const keywordElementHandle = await page.evaluateHandle((elementId) => {
                                return document.querySelector(`[data-temp-id="${elementId}"]`);
                            }, foundItem.elementId);

                            let elementHandle = keywordElementHandle;
                            let element = await keywordElementHandle.jsonValue();

                            if (element) {
                                const isLink = await page.evaluate((el) => {
                                    return el.tagName && el.tagName.toLowerCase() === 'a';
                                }, elementHandle);

                                if (isLink) {
                                    console.log(`[Telegram] Found element is a link, looking for previous div...`);
                                    const previousDivHandle = await page.evaluateHandle((linkElement) => {
                                        let sibling = linkElement.previousElementSibling;
                                        while (sibling) {
                                            if (sibling.tagName && sibling.tagName.toLowerCase() === 'div') {
                                                return sibling;
                                            }
                                            sibling = sibling.previousElementSibling;
                                        }
                                        return null;
                                    }, elementHandle);

                                    const previousDivValue = await previousDivHandle.jsonValue();
                                    if (previousDivValue) {
                                        elementHandle = previousDivHandle;
                                        element = previousDivValue;
                                        console.log(`[Telegram] Found previous div for link, will click on it`);
                                    } else {
                                        console.log(`[Telegram] Failed to find previous div for link, skipping element`);
                                        shouldProcessElement = false;
                                    }
                                }

                                if (shouldProcessElement) {
                                    const finalCheckIsLink = await page.evaluate((el) => {
                                        return el && el.tagName && el.tagName.toLowerCase() === 'a';
                                    }, elementHandle);

                                    if (finalCheckIsLink) {
                                        console.log(`[Telegram] Element is a link, skipping click`);
                                        shouldProcessElement = false;
                                    }
                                }

                                if (shouldProcessElement) {
                                    console.log(`[Telegram] Scrolling to element with keyword "${keyword}"...`);
                                    const isElementVisible = await scrollElementIntoView(page, elementHandle);
                                    if (!isElementVisible) {
                                        console.log(`[Telegram] Element with keyword "${keyword}" not visible after scrolling, skipping`);
                                        shouldProcessElement = false;
                                    }

                                    if (shouldProcessElement) {
                                        const stillVisible = await isElementInViewport(page, elementHandle);
                                        if (!stillVisible) {
                                            console.log(`[Telegram] Element with keyword "${keyword}" not visible before click, skipping`);
                                            shouldProcessElement = false;
                                        }
                                    }
                                }

                                if (shouldProcessElement) {
                                    try {
                                        const box = await elementHandle.boundingBox();
                                        if (!box) {
                                            console.log(`[Telegram] Failed to get boundingBox for element with keyword "${keyword}"`);
                                            shouldProcessElement = false;
                                        } else {
                                            const viewportInfo = await page.evaluate(() => {
                                                return {
                                                    width: window.innerWidth || document.documentElement.clientWidth,
                                                    height: window.innerHeight || document.documentElement.clientHeight
                                                };
                                            });

                                            const centerX = box.x + box.width / 2;
                                            const centerY = box.y + box.height / 2;

                                            if (centerX < 0 || centerX > viewportInfo.width ||
                                                centerY < 0 || centerY > viewportInfo.height) {
                                                console.log(`[Telegram] Element center (${centerX.toFixed(1)}, ${centerY.toFixed(1)}) outside viewport, skipping`);
                                                shouldProcessElement = false;
                                            } else {
                                                console.log(`[Telegram] Moving cursor to element with keyword "${keyword}" (${centerX.toFixed(1)}, ${centerY.toFixed(1)})`);

                                                await page.mouse.move(centerX, centerY);
                                                await new Promise(resolve => setTimeout(resolve, randomDelay(60, 70)));

                                                const elementUnderCursor = await page.evaluate((x, y) => {
                                                    const element = document.elementFromPoint(x, y);
                                                    if (!element) return null;
                                                    let current = element;
                                                    while (current && current !== document.body) {
                                                        if (current.tagName && current.tagName.toLowerCase() === 'a') {
                                                            return true;
                                                        }
                                                        current = current.parentElement;
                                                    }
                                                    return false;
                                                }, centerX, centerY);

                                                if (elementUnderCursor) {
                                                    console.log(`[Telegram] Link under cursor, skipping click`);
                                                    shouldProcessElement = false;
                                                } else {
                                                    const isStillLink = await page.evaluate((el) => {
                                                        return el && el.tagName && el.tagName.toLowerCase() === 'a';
                                                    }, elementHandle);

                                                    if (isStillLink) {
                                                        console.log(`[Telegram] Element is still a link, skipping click`);
                                                        shouldProcessElement = false;
                                                    } else {
                                                        await page.mouse.click(centerX, centerY, { button: 'right' });
                                                        console.log(`[Telegram] Right-clicked on element with keyword "${keyword}"`);

                                                        try {
                                                            let clickedLinkIcon = false;
                                                            const maxAttempts = 3;
                                                            for (let attemptIcon = 0; attemptIcon < maxAttempts && !clickedLinkIcon; attemptIcon++) {
                                                                await new Promise(res => setTimeout(res, randomDelay(120, 220)));
                                                                const linkIcon = await page.$('i.icon-link');
                                                                if (linkIcon) {
                                                                    try {
                                                                        await linkIcon.click();
                                                                        clickedLinkIcon = true;
                                                                        console.log(`[Telegram] Clicked on link icon for word "${keyword}" (attempt ${attemptIcon + 1})`);
                                                                        await new Promise(resolve => setTimeout(resolve, randomDelay(60, 120)));
                                                                    } catch (e) {
                                                                        console.log(`[Telegram] Error clicking on link icon (attempt ${attemptIcon + 1}): ${e.message}`);
                                                                    }
                                                                }
                                                            }

                                                            if (clickedLinkIcon) {
                                                                const link = await getLinkFromClipboard(page);
                                                                if (link) {
                                                                    await saveLinkToFile(link, linksFile);
                                                                } else {
                                                                    const domLink = await page.evaluate((el) => {
                                                                        if (!el) return null;
                                                                        const root = el.closest ? el.closest('.message, .message-wrap, div') : el;
                                                                        function scan(node) {
                                                                            if (!node) return null;
                                                                            const anchors = node.querySelectorAll ? node.querySelectorAll('a[href*="t.me"]') : [];
                                                                            for (const a of anchors) {
                                                                                if (a.href && a.href.includes('t.me')) return a.href;
                                                                            }
                                                                            const dataEls = node.querySelectorAll ? node.querySelectorAll('[data-href*="t.me"]') : [];
                                                                            for (const d of dataEls) {
                                                                                const href = d.getAttribute('data-href') || d.value;
                                                                                if (href && href.includes('t.me')) return href;
                                                                            }
                                                                            const txt = node.innerText || node.textContent || '';
                                                                            const m = txt.match(/https?:\/\/t\.me\/[\w\-\/]+/);
                                                                            if (m) return m[0];
                                                                            return null;
                                                                        }
                                                                        return scan(root || el);
                                                                    }, elementHandle);
                                                                    if (domLink) {
                                                                        await saveLinkToFile(domLink, linksFile);
                                                                    } else {
                                                                        console.log(`[Telegram] Failed to get link from clipboard and DOM for word "${keyword}"`);
                                                                    }
                                                                }
                                                            } else {
                                                                const domLink = await page.evaluate((el) => {
                                                                    if (!el) return null;
                                                                    const root = el.closest ? el.closest('.message, .message-wrap, div') : el;
                                                                    function scan(node) {
                                                                        if (!node) return null;
                                                                        const anchors = node.querySelectorAll ? node.querySelectorAll('a[href*="t.me"]') : [];
                                                                        for (const a of anchors) {
                                                                            if (a.href && a.href.includes('t.me')) return a.href;
                                                                        }
                                                                        const dataEls = node.querySelectorAll ? node.querySelectorAll('[data-href*="t.me"]') : [];
                                                                        for (const d of dataEls) {
                                                                            const href = d.getAttribute('data-href') || d.value;
                                                                            if (href && href.includes('t.me')) return href;
                                                                        }
                                                                        const txt = node.innerText || node.textContent || '';
                                                                        const m = txt.match(/https?:\/\/t\.me\/[\w\-\/]+/);
                                                                        if (m) return m[0];
                                                                        return null;
                                                                    }
                                                                    return scan(root || el);
                                                                }, elementHandle);
                                                                if (domLink) {
                                                                    await saveLinkToFile(domLink, linksFile);
                                                                } else {
                                                                    console.log(`[Telegram] Link icon not found and link not detected in DOM for word "${keyword}"`);
                                                                }
                                                            }
                                                        } catch (error) {
                                                            console.log(`[Telegram] Error trying to get link (icon/DOM): ${error.message}`);
                                                        }
                                                        await new Promise(resolve => setTimeout(resolve, randomDelay(50, 60)));
                                                    }
                                                }
                                            }
                                        }
                                    } catch (error) {
                                        console.log(`[Telegram] Error moving cursor and clicking: ${error.message}`);
                                    }
                                }
                            } else {
                                console.log(`[Telegram] Failed to get element for keyword "${keyword}"`);
                            }
                        } catch (error) {
                            console.log(`[Telegram] Error processing keyword "${keyword}": ${error.message}`);
                        }

                        if (shouldProcessElement) {
                            console.log(`[Telegram] Keyword processing in channel ${channelIndex + 1} completed, moving to next channel`);
                        } else {
                            console.log(`[Telegram] Keyword in channel ${channelIndex + 1} skipped (element is a link or cannot be processed), moving to next channel`);
                        }
                    } else {
                        console.log(`[Telegram] No keywords found in channel ${channelIndex + 1}`);
                    }
                } else {
                    console.log(`[Telegram] No messages in channel ${channelIndex + 1}`);
                }

                channelIndex++;

            } catch (error) {
                console.error(`[Telegram] Error processing channel ${channelIndex + 1}: ${error.message}`);
                channelIndex++;
                continue;
            }
        }

        console.log('[Telegram] All channels processing completed.');

    } catch (error) {
        console.error(`[Telegram] Error processing posts: ${error.message}`);
        throw error;
    }
}

