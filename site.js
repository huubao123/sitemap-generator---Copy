const { join } = require('path');
const { SitemapStream, streamToPromise } = require('sitemap');
const puppeteer = require('puppeteer');
const format = require('xml-formatter');
const { Readable, addAbortSignal } = require('stream');
const fs = require('fs');
const link = 'https://www.tfsvn.com.vn/';
const name = link.split('/')[2].replace('www.', '');
if (!link) {
  console.log('please provide a valid link');
}
if (link) {
  try {
    (async () => {
      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
        product: 'chrome',
        // devtools: true,
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(link);
      const pageContent = await page.content();
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.evaluate(() => history.pushState(null, null, null)),
      ]);
      const result = await page.evaluateHandle(() => {
        const hrefLink = [];
        document.querySelectorAll('a').forEach((selector) => {
          if (selector.hasAttribute('href')) {
            hrefLink.push(selector);
          }
        });
        let urlString = '';
        hrefLink.forEach((href) => {
          urlString = urlString + ' ' + href.getAttribute('href');
        });
        return urlString;
      });
      let modifiedResult = '';
      await result
        .toString()
        .split(' ')
        .forEach((resultLink) => {
          if (resultLink !== 'undefined') {
            modifiedResult = modifiedResult + ' ' + resultLink;
          }
        });
      let resultList = await modifiedResult.toString().split(' ');
      resultList = resultList.slice(2);
      const updatedList = [];
      resultList.forEach(async (result) => {
        if (result.indexOf('http') > -1 || result.indexOf('https') > -1) {
          await updatedList.push(result);
        } else if (result !== '/') {
          await updatedList.push(link + result);
        }
      });
      const newarray = new Array();
      let update = updatedList.reduce(function (accumulator, element) {
        if (accumulator.indexOf(element) === -1) {
          accumulator.push(element);
        }
        return accumulator;
      }, []);
      for (let i = 0; i < update.length; i++) {
        try {
          await page.goto(update[i]);
          console.log(i);
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.evaluate(() => history.pushState(null, null, null)),
          ]);
          const results = await page.evaluateHandle(() => {
            const hrefLinks = [];
            document.querySelectorAll('a').forEach(async (selector) => {
              if (selector.hasAttribute('href')) {
                await hrefLinks.push(selector);
              }
            });
            document.getElementsByTagName('body')[0].childNodes.forEach(async (node) => {
              if (
                node.href ||
                node.src ||
                node.content.indexOf('http') > -1 ||
                node.content.indexOf('https') > -1
              ) {
                if (node.href.split('/')[2].indexOf(name) > -1) {
                  await hrefLinks.push(node);
                }
              }
            });
            document.getElementsByTagName('head')[0].childNodes.forEach(async (node) => {
              if (
                node.href ||
                node.src ||
                node.content.indexOf('http') > -1 ||
                node.content.indexOf('https') > -1
              ) {
                if (node.href.split('/')[2].indexOf(name) > -1) {
                  await hrefLinks.push(node);
                }
              }
            });

            let urlStrings = '';
            hrefLinks.forEach(async (href) => {
              urlStrings = urlStrings + ' ' + href.getAttribute('href');
            });
            return urlStrings;
          });
          let modifiedResults = '';
          results
            .toString()
            .split(' ')
            .forEach(async (resultLinks) => {
              if (resultLinks !== 'undefined') {
                modifiedResults = modifiedResults + ' ' + resultLinks;
              }
            });
          let resultLists = modifiedResults.toString().split(' ');
          resultLists = resultLists.slice(2);

          resultLists.forEach(async (result) => {
            if ((result.indexOf('http') > -1 || result.indexOf('https') > -1) && result !== '/') {
              newarray.push(result);
              let index = update.indexOf(result);
              if (index < 0 && result.split('/')[2].indexOf(name) > -1) {
                update.push(result);
              }
            } else if (result !== '/') {
              // await updatedList.push(link + result);
              newarray.push(link + result);
              let full_link = link + result;
              if (update.indexOf(full_link) < 0 && full_link.split('/')[2].indexOf(name) > -1) {
                update.push(link + result);
              }
            }
          });
          fs.writeFile('item.txt', JSON.stringify(update, null, 2), (err) => {
            if (err) throw err;
          });
        } catch (e) {}
      }
      console.log(update);
      let myArrayWithNoDuplicates = update.reduce(function (accumulator, element) {
        if (accumulator.indexOf(element) === -1) {
          accumulator.push(element);
        }
        return accumulator;
      }, []);
      fs.writeFile('item.txt', JSON.stringify(myArrayWithNoDuplicates, null, 2), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      });
      //const streamLinks = [];
      // updatedList.forEach((result) => {
      //   const newStream = {
      //     url: result,
      //     changeFreq: 'daily',
      //     priority: 0.8,
      //   };
      //   streamLinks.push(newStream);
      // });
      //const stream = new SitemapStream({ hostname: link });
      // streamToPromise(Readable.from(streamLinks).pipe(stream)).then((data) => {
      //   fs.appendFile('sitemap.xml', format(data.toString()), (err) => {
      //     if (err) throw err;
      //     // file saved
      //     console.log('xml saved!');
      //   });
      // });
    })();
  } catch (e) {
    console.error(e);
  }
}
