"use strict";
const axios = require("axios");
const cheerio = require("cheerio");
const scrapeJSON = require("./assets/json/scrape_links.json");
const settings = require("./settings.json");
const scrape = require("./assets/scrape");
const { Slack } = require("./assets/slack");
const { HTML } = require("./assets/scrape/html");

/**
 *
 * Pass 'true' as the third argument to edit events with no tags
 * e.g. node su_scrape.js true
 */

scrapeJSON.campuses.forEach((campus) => {
  console.log("\nScraping: " + campus.name + "\n");
  // Go through all of the provided urls
  campus.scrape_urls.forEach(async (url) => {
    const html = await HTML.convertToHtml(url.url);

    const $ = cheerio.load(html);
    const links = $("a"); // The raw links
    var scrapedLinks = []; // All accepted links will be placed here

    $(links).each(function (i, href) {
      try {
        const link = $(href).attr("href").toString();
        if (url.accepted.some((acc) => new RegExp(`^${acc}`).test(link))) {
          scrapedLinks.push(campus.base_url + link);
        }
      } catch (err) {}
    });
    scrapedLinks = [...new Set(scrapedLinks)];
    console.log(`Retrieved ${scrapedLinks.length} '${url.type}' for ${url.url.split(".ac.uk")[1]}`);

    await scrape.handleLinks(url.type, scrapedLinks, campus.key, campus.base_url);
  });
});

Slack.serverLog(`Server Side Functions/su_scrape.js ran at ${new Date().toUTCString()}`);
