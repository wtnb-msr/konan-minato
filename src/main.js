'use strict';

const fs = require('fs');
const puppeteer = require('puppeteer');

const Line = require('./line');
const token = process.env.LINE_TOKEN;
const line = new Line(token);

(async () => {

  const headless = true;
  const slowMo = 10;
  const args = [
    '--window-size=1200,960',
  ];
  const browser = await puppeteer.launch({headless, slowMo, args});
  const page = await browser.newPage();
  await page.setViewport({width: 1200, height: 960});

  // Go to home page
  await Promise.all([
    page.goto('https://web101.rsv.ws-scs.jp/minato/user/view/user/homeIndex.html'),
    page.waitForNavigation({waitUntil: "networkidle2"}),
  ]);

  // Go to search page
  await Promise.all([
    page.click('a[href="../user/rsvNameSearch.html"]'),
    page.waitForNavigation({waitUntil: "networkidle2"}),
  ]);

  // Select area and search
  await Promise.all([
    page.click('input[id="doSearch"]'),
    page.waitForNavigation({waitUntil: "networkidle2"}),
  ]);

  // Select facility
  await Promise.all([
    page.click('input[name="layoutChildBody:childForm:resultItems:28:doSelect"]'),
    page.waitForNavigation({waitUntil: "networkidle2"}),
  ]);

  // Show only tennis
  await page.click('input[value="70300010"]'),
  await Promise.all([
    page.click('input[id="doReload"]'),
    page.waitForNavigation({waitUntil: "networkidle2"}),
  ]);

  // List target
  const targets = [...Array(60).keys()].map(i => {
    const d = new Date();
    d.setUTCHours(d.getUTCHours() + 9);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  }).filter(d => {
    return [
      0, // Saturday
      //1, 2, 3, 4, 5,
      6, // Sunday
    ].includes(d.getUTCDay());
  });

  // For each target
  for (const t of targets) {

    const y = t.getUTCFullYear();
    const m = t.getUTCMonth() + 1;
    const d = t.getUTCDate();
    const w = t.getUTCDay();

    // Go to target date
    await Promise.all([
      page.evaluate(({y, m, d}) => {
        selectCalendarDate(y, m, d);
        //selectCalendarDate(y, m, d);
      }, {y, m, d}),
      page.waitForNavigation({waitUntil: "networkidle2"}),
    ]);

    // Check availability
    const availables = await page.$$('img[id="emptyStateIcon"][src$="lw_rsvok.gif"]');
    if (availables.length === 0) {
      continue;
    }

    // Save screen
    const clip = await page.evaluate(() => {
      const e = document.querySelector('div[class="in-table"]');
      const { width, height, left: x, top: y} = e.getBoundingClientRect();
        return { width, height, x, y };
    })
    const path = 'tmp.png';
    await page.screenshot({ clip, path: path });

    // Post
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][w];
    const message = `Available @ ${y}/${m}/${d}(${dayOfWeek})`;
    line.postImage(message, path)
  }

  // Close browser
  await browser.close();

})();
