const { createTag } = require("./assets/airtable")
const { Input } = require("enquirer");

new Input({
  message: "What is the new tag?",
})
  .run()
  .then((tag) => {
    const formattedTag = tag.trim().split(" ").slice(0, 2).join(" ");
    createTag(formattedTag);
  });
