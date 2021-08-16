const { MongoClient } = require("mongodb");

// Handle script args
const testing = process.argv.includes("--testing");

// Intialize mongodb
const url = "mongodb://localhost:27017/";
const dbName = "campus42";

const client = new MongoClient(url, { useUnifiedTopology: true });
var connected = client.connect();

const mongo = {
  getCampusPoints: async function (campusKey) {
    const col = "points.active";
    return new Promise(async (resolve, reject) => {
      return connected
        .then(async (val) => {
          return val
            .db(dbName)
            .collection(col)
            .findOne({ campus_key: campusKey }, async (err, res) => {
              if (err) reject(err);
              else resolve(res);
            });
        })
        .catch((err) => {
          throw err;
        });
    })
      .then((res) => {
        return res;
      })
      .catch((err) => {
        throw err;
      });
  },
  archiveCampusPoints: async function (campusKey) {
    const col = "points.archive";

    const currentPoints = await mongo
      .getCampusPoints(campusKey)
      .then((res) => {
        console.log(res);
        return { response: res };
      })
      .catch((err) => {
        return { error: err };
      });
    if (currentPoints.error) logger.error(currentPoints.error);
    delete currentPoints.response._id;

    return connected
      .then((val) =>
        val
          .db(dbName)
          .collection(col)
          .insertOne({ ...currentPoints.response, archive_timestamp: Date.now() })
      )
      .then((res) => {
        logger.log({
          msg: `Archived campus points at /${col}`,
          data: { db: dbName, collection: col, id: res.insertedId },
          timestamp: Date.now(),
        });
        return res;
      })
      .catch((err) => {
        throw err;
      });
  },
  updateCampusPoints: async function (campusKey, update) {
    const col = "points.active";

    await mongo.archiveCampusPoints(campusKey);
    return connected.then(async (val) => {
      return val
        .db(dbName)
        .collection(col)
        .updateOne({ campus_key: campusKey }, { $set: update }, { upsert: true })
        .then((res) => {
          console.log(`Updated points for ${campusKey}`);
          logger.log({
            msg: `Updated campus points at /${col}`,
            data: { db: dbName, collection: col, id: res.insertedId },
            timestamp: Date.now(),
          });
          return res;
        })
        .catch((err) => {
          throw err;
        });
    });
  },
  getArchivedUserPointsForDaysBack: async function (daysBack = 0, startOffsetInDays = 0) {
    const startOfDay = new Date();
    const endOfDay = new Date();

    startOfDay.setDate(startOfDay.getDate() - daysBack - startOffsetInDays);
    endOfDay.setDate(endOfDay.getDate() - daysBack);

    startOfDay.setHours(0, 0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getUserPoints(startOfDay.getTime(), endOfDay.getTime());
  },
  getUserPoints: async function (startTime = Date.now(), endTime = Date.now()) {
    const col = "points.archive";

    return new Promise(async (resolve, reject) => {
      return connected.then(async (val) => {
        return val
          .db(dbName)
          .collection(col)
          .find({
            $and: [{ __type: { $eq: "user_point_archive" } }, { timestamp: { $gte: startTime, $lt: endTime } }],
          })
          .toArray(async (err, res) => {
            if (err) reject(err);
            else resolve(res);
          });
      });
    })
      .then((res) => {
        return res;
      })
      .catch((err) => {
        throw err;
      });
  },
};

module.exports = mongo;
