const puppeteer = require('puppeteer');
const $ = require('cheerio');
const fs = require('fs-extra');
const prettier = require('prettier');
const uncss = require('uncss');

const url = 'http://grammarly.com';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let css;

    page.on('response', async response => {
      if (response.request().resourceType() === 'stylesheet') {
        css = await response.text();
        return
      }
    });

    await page.goto(url);

    const content = await page.content();

    if (content) {
      console.log('HTML obtained');
    } else {
      console.log('❌ Error: No HTML found!');
      return
    }

    const footer = $('footer', content);

    if (content) {
      console.log('Footer found');
    } else {
      console.log('❌ Error: No footer found!');
      return
    }

    const footerClass = footer.attr('class');
    const footerHTML = footer.html();
    const prettyFooterHTML = prettier.format(`<footer class="${footerClass}">${footerHTML}</footer>`, {
      parser: 'html',
      htmlWhitespaceSensitivity: 'strict'
    });

    fs.outputFile(
      './output/footer.html',
      prettyFooterHTML,
      (e) => {
        if (e) console.log('❌', e);
        console.log('✅ Footer HTML extracted and saved')
      }
    );

    if (css) {
      console.log('Styles obtained');
      uncss(prettyFooterHTML, {
        raw: prettier.format(css, {
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
      return
    }

    await browser.close();
  } catch (e) {
    console.log('❌', e);
    return
  }
})();