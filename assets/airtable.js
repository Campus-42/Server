const Airtable = require("airtable");
const settings = require("../settings.json");
const colors = require("./json/tagColors.json");

const API_KEY = "keyIUNtxniyBauoVn";

const fcm = new Airtable({ apiKey: API_KEY }).base("appOXVfqFCJGee5KS");
const emails = new Airtable({ apiKey: API_KEY }).base("apphtMo2vEtgp6IQg");
const tags = new Airtable({ apiKey: API_KEY }).base("appHe5CWHGqSHbejn");

exports.getFCMTokensForUsers = async function (users = []) {
  var tokens = [];
  console.log("[Info] Getting tokens for", users.length, "users");
  await Promise.all(
    await users.map(
      async (uid) =>
        await fcm("FCM Tokens")
          .select({
            filterByFormula: `{uid} = \"${uid}\"`,
          })
          .all()
          .then(async (res) => {
            res.forEach((elem) => {
              tokens.push(elem.fields.token);
            });
          })
          .catch((err) => {
            console.warn("Could not get uid tokens from airtable", err);

            return [];
          })
    )
  );
  tokens = [...new Set(tokens)]; // Remove duplicates
  console.log("[Info] Received", tokens.length, "tokens");
  return tokens;
};

const getAllTags = async function () {
  return tags("Colors")
    .select()
    .all()
    .then((tags) => {
      return tags.map((elem) => {
        return {
          tag: elem.fields.Tag,
          name: elem.fields.Tag,
          value: elem.fields.Tag,
          color: elem.fields.Color,
        }; // Make key names lowerCase and suitable for enquirer
      });
    })
    .catch((err) => {
      throw err;
    });
};
exports.getAllTags = getAllTags;
exports.createTag = async function (tag) {
  const existingTags = await getAllTags();

  if (existingTags.every((elem) => elem.tag !== tag)) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    tags("Colors")
      .create({
        Tag: tag,
        Color: color,
      })
      .then(() => {
        console.log("[Info] Created tag '" + tag + "'");
        return { tag: tag };
      })
      .catch((err) => {
        settings.debugErrors && console.trace("[Error]", err);
        return { error: err };
      });
  } else console.log("[Info] Tag '" + tag + "' already existss");
};
