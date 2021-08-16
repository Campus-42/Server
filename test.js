// This is is test file to test new functions
console.log("\n[Info] Starting test file...\n");
const mongo = require("./assets/mongo");
const $ = require("./assets/points/formulas");
const Points = require("./assets/points");
const fetch = require("node-fetch");

async function main() {
  const data = {
    canRespond: true,
    member_uids: [
      "b5GJNQy6EnPnjhHTbe9hFLXUw2k1",
      "rtf375Rbo6SfVCQnkGVYMFKsmZ62",
    ],
    admins: ["b5GJNQy6EnPnjhHTbe9hFLXUw2k1"],
    description: "A test channel",
    name: "Test channel",
    campusKey: "campus_test",
    image:
      "https://firebase.google.com/images/brand-guidelines/logo-logomark.png",
    creator: "campus42_terminal",
    admin_info: {},
  };

  fetch(
    "https://us-central1-campus42.cloudfunctions.net/createChannelFromServer",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  )
    .then((response) => response.json())
    .then(console.log)
    .catch(console.warn)
    .finally(process.exit);
}
main();
