const bodyParser = require("body-parser");
const moment = require("moment");
const app = require("express")();
const mongoose = require("mongoose");
const utils = require("./utils.js");

app.use(bodyParser.json());

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const secretSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
  },
  secretText: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
  },
  remainingViews: {
    type: Number,
    required: true,
  },
});
const Secret = mongoose.model("Secret", secretSchema);

app.post("/api/secret", (req, res) => {
  const { secretText, expireAfterViews, expireAfter } = req.body;

  try {
    const hash = utils.getHash(secretText + Math.random())

    const newSecret = new Secret({
      hash,
      secretText: secretText,
      createdAt: moment(),
      expiresAt: expireAfter > 0 ? moment().add(expireAfter, "minutes") : null,
      remainingViews: expireAfterViews,
    });

    newSecret.save(function (err, secret) {
      if (err) return console.error(err);
      console.log("new secret saved!");

      return res.json({ hash })
    });
  } catch (e) {
    console.log(e);
  }
});

app.get("/api/secret/:hash", async (req, res) => {
  const { hash } = req.params;

  // to simulate network latency
  await utils.sleep(1000)

  try {
    const doc = await Secret.findOneAndUpdate(
      { hash: hash },
      { $inc: { remainingViews: -1 } },
      { new: true }
    ).exec();
    const rv = { secret: null, status: -1 };

    if (!doc) {
      rv.status = 0
      return res.json(rv);
    }

    if (doc.remainingViews < 0) {
      rv.status = 1
      return res.json(rv);
    }

    if (doc.expiresAt && moment().isAfter(moment(doc.expiresAt))) {
      rv.status = 2
      return res.json(rv);
    }

    rv.status = 3
    rv.secret = {
      hash: doc.hash,
      secretText: doc.secretText,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
      remainingViews: doc.remainingViews,
    };
    return res.json(rv);
  } catch (e) {
    rv.status = -1;
    return res.json(rv);
  }
});

module.exports = app;
