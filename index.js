const puppeteer = require('puppeteer');
const $ = require('cheerio');
const fs = require('fs-extra');
const prettier = require('prettier');
const uncss = require('uncss');
const striptags = require('striptags');

const url = process.argv[2] || 'http://grammarly.com';
const normalizedUrl = url.startsWith('http://') ? url : `http://${url}`;

(async () => {
  console.log(`Scrapping ${normalizedUrl} ...\n`);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let css = '';

  page.on('response', async response => {
    if (response.request().resourceType() === 'stylesheet') {
      css = css + await response.text();
    }
  });

  const goto = await page.goto(normalizedUrl).catch(() => {
    console.log('❌', 'Error: invalid URL');
  });

  if (goto === undefined) {
    await browser.close();
    return
  }

  const content = await page.content();
  const footer = $('footer', content);

  if (footer.length !== 0) {
    console.log('Footer found');
  } else {
    console.log('❌ Error: No footer found!');
    await browser.close();
    return
  }

  const footerClass = footer.attr('class');
  const footerHTML = footer.html();
  const prettyFooterHTML = prettier.format(`<footer class="${footerClass}">${footerHTML}</footer>`, {
    parser: 'html',
    htmlWhitespaceSensitivity: 'strict'
  });

  if (footerHTML) fs.outputFile(
    './output/footer.html',
    prettyFooterHTML,
    (e) => {
      if (e) console.log('❌', e);
      console.log('✅ Footer HTML extracted and saved')
    }
  );

  if (css) {
    console.log('Styles obtained\n');
    uncss(prettyFooterHTML, {
      raw: prettier.format(striptags(css), {
        parser: 'css'
      })
    }, (error, output) => {
      if (error) console.log(error);
      fs.outputFile('./output/footer.css', output, (e) => {
        if (e) console.log('❌', e);
        console.log('✅ Footer CSS extracted and saved')
      });
    });
  } else {
    console.log('❌ Error: No CSS file found!');
  }

  await browser.close();
})();