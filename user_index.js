const mongo = require("./assets/mongo");
const firebaseFuncs = require("./assets/firebase/funcs");
const firebase = require("./assets/firebase");

async function main() {
  const users = await firebase.auth
    .listUsers()
    .then((res) => res.users.map((u) => u.uid))
    .catch((err) => {
      throw err;
    });
  console.log(users);
  
  process.exit();
}
main();
