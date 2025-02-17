require("dotenv/config");
require("./db");

const cookieParser = require("cookie-parser");
const express = require("express");
const favicon = require("serve-favicon");
const hbs = require("hbs");
// const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");

const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);

const app = express();

// session configuration

const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("./db/index");
const DB_URL = "mongodb://localhost/passport";

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    saveUninitialized: false,
    resave: true,
    store: MongoStore.create({
      mongoUrl: DB_URL,
    }),
  })
);

// Passport

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

// const User = require(".models/User.model");

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, cb) => cb(null, user._id));

passport.deserializeUser((id, cb) => {
  User.findById(id)
    .then((user) => cb(null, user))
    .catch((err) => cb(err));
});

passport.use(
  new LocalStrategy((username, password, cb) => {
    // this logic will be executed when we log in
    User.findOne({ username: username })
      .then((user) => {
        if (user === null) {
          // there is no user with this username
          cb(null, false, { message: "Wrong Credentials" });
        } else if (!bcrypt.compareSync(password, user.password)) {
          // the password does not match
          cb(null, false, { message: "Wrong Credentials" });
        } else {
          // everything correct - user should be logged in
          cb(null, userFromDB);
        }
      })
      .catch((err) => {
        next(err);
      });
  })
);

// require database configuration
require("./configs/db.config");

// Middleware Setup
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Express View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// default value for title local
app.locals.title = "Express - Generated with IronGenerator";

// 👇 Start handling routes here
const index = require("./routes/index.routes");
app.use("/", index);

const auth = require("./routes/auth");
app.use("/", auth);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
// require("./error-handling")(app);

module.exports = app;
