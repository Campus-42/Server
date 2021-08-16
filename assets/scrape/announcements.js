const settings = require("../../settings.json");
const axios = require("axios");
const cheerio = require("cheerio");
const date = require("../date");
const firebaseFuncs = require("../firebase/funcs");

const getBlogType = (tagName) => {
  switch (tagName) {
    case "p":
      return "Text";
    case "h2":
      return "Heading";
    case "h3":
      return "Heading";
    default:
      return false;
  }
};

exports.scrapeAnnouncements = async function (links, campusKey, baseUrl) {
  const announcements = [];
  await Promise.all(
    await links.map(async (link) => {
      const id = link.trim().split("/").slice(-3, -1).join("_");
      var author;

      const blogContent = [];

      const html = await axios(link)
        .then((res) => {
          return { html: res.data };
        })
        .catch((err) => {
          return { error: err };
        });
      if (html.error) settings.debugErrors && console.log("[Error]", html.error);
      const $ = cheerio.load(html.html);

      author = $("div #news").find("p").first().text();

      $("div .news_body").map((i, elem) => {
        const children = $(elem).children();
        children.each((index, child) => {
          if (index == 1)
            $("img")
              .filter((i, e) => {
                const src = $(e).attr("src").split("?")[0];
                return !src.includes("stylesheet/template/logo.png") && !src.includes("/pageassets/news/Vinson-Building-Shoot-152.jpg");
              })
              .slice(0, 1)
              .map((i, e) => {
                var src = $(e).attr("src").split("?")[0];
                src = src.split("../").join("");
                if (src.substring(0, 1) !== "/") src = "/" + src;
                blogContent.push({ type: "Image", value: baseUrl + src });
              });

          const childBody = cheerio.load(child);
          childBody("img").each((i, el) => blogContent.push({ type: "Image", value: baseUrl + childBody(el).attr("src") }));

          const blogType = getBlogType(child.tagName);
          const text = $(child).text();
          const empty = !/[a-zA-Z]/.test(text);
          // const images = hasChildrenImages($, child.children);

          if (!empty) {
            if (["Heading", "Text"].includes(blogType)) {
              blogContent.push({ type: blogType, value: text.trim() });
            }
          }
        });
      });
      const su_title = $("h1").first().text();

      if (blogContent.length && author)
        announcements.push({
          blog_content: blogContent,
          society_name: author,
          society_id: "no_id",
          confirmed: true,
          visible: true,
          start_ms: Date.now(),
          search_index: blogContent
            .filter((e) => ["Heading", "Text"].includes(e.type))
            .map((e) => e.value.toLowerCase())
            .join(" ")
            .split(" ")
            .slice(0, 50),
          members: [],
          permissions: ["all"],
          id,
          su_title,
          su_link: link,
          scraped: true,
          edit_log: [
            {
              action: "create",
              date: new Date(),
              uid: "campus42_terminal",
            },
          ],
        });
    })
  );
  firebaseFuncs.formatAndUploadScrapedAnnouncement(campusKey, announcements);
};
