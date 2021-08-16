const { scrapeEvent } = require("./events");
const { scrapeAnnouncements } = require("./announcements");
const settings = require("../../settings.json");

exports.handleLinks = async function (type, links, campusKey, baseUrl) {
  try {
    switch (type) {
      case "events": {
        scrapeEvent(links, campusKey, baseUrl);
        break;
      }
      case "announcements": {
        scrapeAnnouncements(links, campusKey, baseUrl);
        break;
      }
      default: {
        settings.debugErrors && console.log("[Error]", "Could not find any matching scrape handlers for type: " + type);
      }
    }
  } catch (err) {
    settings.debugErrors && console.trace("[Error]", err);
  }
};
