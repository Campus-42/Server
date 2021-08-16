const settings = require("../../settings.json");
const axios = require("axios");
const cheerio = require("cheerio");
const date = require("../date");
const firebaseFuncs = require("../firebase/funcs");

exports.scrapeEvent = async function (links, campusKey, baseUrl) {
  const events = [];
  await Promise.all(
    await links.map(async (link) => {
      try {
        const id = link.trim().split("/").slice(-3, -1).join("_");
        const html = await axios(link)
          .then((res) => {
            return { html: res.data };
          })
          .catch((err) => {
            return { error: err };
          });
        if (html.error)
          settings.debugErrors && console.trace("[Error]", html.error);
        else {
          const $ = cheerio.load(html.html);

          // Get titles
          // Right now only one h1 is returned, which is the title
          const titles = [];
          $("h1").map((i, elem) => titles.push($(elem).text()));

          // Get the event details
          // date, time, and venue (in that order)
          const details = [];
          $("div .col-md-12").map(
            (i, elem) =>
              $(elem).text().replace(/\s/g, "").length &&
              details.push($(elem).text().trim().replace("\n"))
          );
          const eventDate = await date.getDateFromSUEvent(
            details[0],
            details[1]
          );

          //Get the images
          const images = [];
          $("img").map(
            (i, elem) =>
              !$(elem)
                .attr("src")
                .startsWith("/stylesheet/template/logo.png") &&
              images.push(baseUrl + $(elem).attr("src"))
          );

          // Get the description
          const texts = [];
          $("div .e-details-txt").map((i, elem) => {
            const children = $(elem).children();
            children.each(
              (index, child) =>
                $(child).text().replace(/\s/g, "").length &&
                texts.push("\n" + $(child).text())
            );
          });

          const prices = [];
          $("div .event_ticket").map((i, elem) => {
            const children = $(elem).children();
            children.each((index, child) => {
              const match = $(child)
                .text()
                .match(/\d+(?:\.\d+)?/g);
              child.tagName == "span" &&
                match !== null &&
                prices.push(match[0]);
            });
          });
          if (eventDate.error)
            settings.debugErrors && console.trace("[Error]", eventDate.error);
          else {
            events.push({
              id: id,
              title: titles[0],
              date: {
                start: eventDate.start,
                end: eventDate.end,
              },
              end_ms: eventDate.end.getTime(),
              start_ms: eventDate.start.getTime(),
              images: {
                background: images[0] || false,
                preview:
                  images[0] ||
                  "https://firebasestorage.googleapis.com/v0/b/campus42.appspot.com/o/campuses%2Funiversity_of_buckingham%2Fsu_buckingham.png?alt=media&token=74b51ac2-5c08-4870-b81b-b9f1db904b50",
              },
              description: texts.join("\n"),
              location: {
                show: false,
                // address: details[2],
              },
              link: {
                show: true,
                url: link,
              },
              su_link: link,
              participants: [],
              number_of_participants: 0,
              pricing: {
                show: false,
                currency: "£",
                price: "0",
                ...(prices.length !== 0
                  ? { show: true, price: prices[0], currency: "£" }
                  : {}),
              },
              president: "VJtZYMTE4LhjmDy7zO6gcPxqYtt2",
              join_link: {
                show: false,
                ...(prices.length !== 0
                  ? {
                      show: true,
                      url: link,
                    }
                  : {}),
              },
            });
          }
        }
      } catch {}
    })
  );
  firebaseFuncs.formatAndUploadScrapedEvent(campusKey, events);
};
