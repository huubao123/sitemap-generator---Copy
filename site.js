const { join } = require('path');
const { SitemapStream, streamToPromise } = require('sitemap');
const puppeteer = require('puppeteer');
const XMLHttpRequest = require('xhr2');
const request = require('request');

const format = require('xml-formatter');
const { Readable, addAbortSignal } = require('stream');
const fs = require('fs');
const link = 'https://shokz.com';
const name = link.replace('www.', '');
if (!link) {
  console.log('please provide a valid link');
}
if (link) {
  try {
    (async () => {
      const browser = await puppeteer.launch({
        // headless: false,
        // defaultViewport: null,
        // args: ['--start-maximized'],
        // product: 'chrome',
        // devtools: true,
        // executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(link);
      const pageContent = await page.content();
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
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
      resultList.forEach((result) => {
        if (result.indexOf(name) > -1) {
          updatedList.push(result);
        } else if (result !== '/') {
          updatedList.push(link + '/' + result);
        } else {
          updatedList.push(link + result);
        }
      });
      let newarray = new Array();
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
            page.waitForNavigation({ waitUntil: 'load' }),
            page.evaluate(() => history.pushState(null, null, null)),
          ]);
          const getvalue = await page.evaluate(() => {
            let h1 = new Array();
            let h2 = new Array();
            let h11 = document.querySelectorAll('h1');
            if (h11) {
              for (let j = 0; j < h11.length; j++) {
                h1.push({
                  h1: h11[i].innerText ? h11[i].innerHTML : '',
                });
              }
            }
            let h22 = document.querySelectorAll('h2');
            if (h22) {
              for (let j = 0; j < h22.length; j++) {
                h2.push({
                  h2: h22[i].innerText ? h22[i].innerHTML : '',
                });
              }
            }

            let data = {
              title: document.querySelector('title').innerText
                ? document.querySelector('title').innerText
                : '',
              description: document.querySelector('meta[name="description"]')
                ? document.querySelector('meta[name="description"]').content
                : '',
              robots: document.querySelector('meta[name="robots"]')
                ? document.querySelector('meta[name="robots"]').content
                : '',
              canonical: document.querySelector('meta[name="canonical"]')
                ? document.querySelector('meta[name="canonical"]').href
                : '',
              h1: h1 ? h1 : [],
              h2: h2 ? h2 : [],
            };
            return data;
          });
          request(update[i], function (error, response, body) {
            //statusCode:
            let h1 = {};
            for (let i = 0; i < getvalue.h1.length; i++) {
              h1 = {
                ['h1' + i]: getvalue.h1[i] ? getvalue.h1[i] : '',
              };
            }
            console.log(h1);
            newarray.push({
              link: update[i],
              robots: getvalue.robots,
              canonical: getvalue.canonical,
              h1: getvalue.h1,
              h1: getvalue.h1,
              h2: getvalue.h2,
              title: getvalue.title,
              description: getvalue.description,
              statusCode: response.statusCode ? response.statusCode : '',
            });

            //await Object.assign(element, { key3: 'value3' });
            //console.error('error:', error); // Print the error if one occurred
            // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            //console.log('body:', body); // Print the HTML for the Google homepage.
          });

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
                if (node.href.indexOf(name) > -1) {
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
                if (
                  node.href.indexOf(name) > -1 ||
                  node.src.indexOf(name) > -1 ||
                  node.content.indexOf(name) > -1
                ) {
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
            if (result.indexOf(name) > -1) {
              let index = update.indexOf(result);
              if (index < 0) {
                update.push(result);

                try {
                } catch (e) {
                  console.log(e);
                }
              }
            } else if (result !== '/') {
              // await updatedList.push(link + result);
              // newarray.push(link + result);
              let full_link = link + '/' + result;
              if (update.indexOf(full_link) < 0) {
                update.push(full_link);
              }
            } else {
              full_link = link + '/' + result;
              if (update.indexOf(full_link) < 0) {
                update.push(full_link);
              }
            }
          });

          fs.writeFile('item.txt', JSON.stringify(update, null, 2), (err) => {
            if (err) throw err;
          });
          fs.writeFile('item2.txt', JSON.stringify(newarray, null, 2), (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
          });
        } catch (e) {}
      }
      let myArrayWithNoDuplicates = update.reduce(function (accumulator, element) {
        if (accumulator.indexOf(element) === -1) {
          accumulator.push(element);
        }
        return accumulator;
      }, []);
      fs.writeFile('item1.txt', JSON.stringify(myArrayWithNoDuplicates, null, 2), (err) => {
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
