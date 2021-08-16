const admin = require("firebase-admin");
const serviceKey = require("../campus42-firebase-adminsdk-nda4u-b97f4f6a0d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceKey),
  databaseURL: "https://campus42.firebaseio.com",
});
admin.firestore().settings({ ignoreUndefinedProperties: true });

exports.db = admin.firestore();
exports.messaging = admin.messaging();
exports.auth = admin.auth();
exports.admin = admin;
