// dependencies
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const morgan = require("morgan");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const isSignedIn = require("./middleware/is-signed-in.js");
const passUserToView = require("./middleware/pass-user-to-view.js");
const axios = require("axios");
const authController = require("./controllers/auth.js");
const projectsController = require("./controllers/projects.js");
const taskController = require("./controllers/tasks.js");

// intitialize express app
const app = express();

// config settings
dotenv.config();
const port = process.env.PORT || "3000";

// connection to MongoDB
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on("connected", () => {
  console.log(`Connected to MOngoDB ${mongoose.connection.name}`);
});

// Mount middleware
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(morgan("dev"));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
  })
);

// passing user to view middleware
app.use(passUserToView);

// landing page
app.get("/", (req, res) => {
  res.render("index.ejs", { title: "Home Page" });
});

app.use("/auth", authController);
app.use(isSignedIn);

app.use("/users/:userId/projects", projectsController);
app.use("/users/:userId/projects", taskController);

// flash messages
app.use((req, res, next) => {
  if (req.session.message) {
    res.locals.message = req.session.message;
    req.session.message = null;
  }
  next();
});

// custom error function
const handleServerError = (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`Warning! POrt ${port} is already in taken`);
  } else {
    console.log("Error: ", err);
  }
};

// app to listen for HTTP requests
app
  .listen(port, () => {
    console.log(`The exress app is ready on port ${port}!`);
  })
  .on("error", handleServerError);
