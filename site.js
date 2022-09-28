const { join } = require('path');
const { SitemapStream, streamToPromise } = require('sitemap');
const puppeteer = require('puppeteer');
const XMLHttpRequest = require('xhr2');
const request = require('request');
const fastcsv = require('fast-csv');
const fs = require('fs');
const ws = fs.createWriteStream('out.csv');

const link = 'https://shokz.com.vn';
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
        let res = result.replace('#','')
        if (res.indexOf(name) > -1) {
          updatedList.push(res);
        } else if (res !== '/') {
          updatedList.push(link + '/' + res);
        } else {
          updatedList.push(link + res);
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
          await page.goto(update[i].replace('#',''));
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
                  h1: h11[j] ? h11[j].innerText : '',
                });
              }
            }

            let h22 = document.querySelectorAll('h2');
            if (h22) {
              for (let j = 0; j < h22.length; j++) {
                h2.push({
                  h2: h22[j] ? h22[j].innerText : '',
                });
              }
            }

            let data = {
              title: document.querySelector('title')
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
          let h11 = {};
            let h22 = {};
          request(update[i].replace('#',''), function (error, response, body) {
            //statusCode:
            

            let obj = {};
            for(let m = 0; m < getvalue.h1.length; m++) {
              h11 = {...h11,
                ['h1-' + m]: getvalue.h1[m].h1 ? getvalue.h1[m].h1 : '',
              };
            }
            for(let m = 0; m < getvalue.h2.length; m++) {
              h22 = {...h22,
                ['h2-' + m]: getvalue.h2[m].h2 ? getvalue.h2[m].h2 : '',
              };
            }
            obj= {
              id: i,
              link: update[i].replace('#',''),
              robots: getvalue.robots,
              canonical: getvalue.canonical,
              title: getvalue.title,
              description: getvalue.description,  
              statusCode: response.statusCode ? response.statusCode : '',
            };
            let new_obj = {...obj,...h11,...h22};
            newarray.push(new_obj)

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
                node.content
              ) {
                if (node.href.indexOf(name) > -1||node.src.indexOf(name) > -1||node.content.indexOf(name) > -1) {
                  await hrefLinks.push(node);
                }
              }
            });
            document.getElementsByTagName('head')[0].childNodes.forEach(async (node) => {
              if (
                node.href ||
                node.src ||
                node.content
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
            let res = result.replace('#','')
            if (res.indexOf(name) > -1) {
              let index = update.indexOf(res);
              if (index < 0) {
                update.push(res);

                try {
                } catch (e) {
                  console.log(e);
                }
              }
            } else if (res !== '/') {
              // await updatedList.push(link + result);
              // newarray.push(link + result);  
              let full_link = link + '/' + res;
              if (update.indexOf(full_link) < 0) {
                update.push(full_link);
              }
            } else {
              full_link = link + '/' + res;
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
             //fastcsv.write(newarray, { headers: true }).pipe(ws);
        } catch (e) {
          console.log(e)
        }    
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
      fastcsv.write(newarray, { headers: true }).pipe(ws);
      ws.close()
      //fastcsv.write(newarray, { headers: true }).pipe(ws);
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
      // })
    })();
  } catch (e) {
    console.error(e);
  }
}