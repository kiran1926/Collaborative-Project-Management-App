const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../models/user.js");

// ===============================  routes  ===========================================

// sign-up
router.get("/sign-up", (req, res) => {
  res.render("auth/sign-up.ejs");
});

// sign-in page
router.get("/sign-in", (req, res) => {
  res.render("auth/sign-in.ejs");
});

// sign-up post req
router.post("/sign-up", async (req, res) => {
  try {
    const userInDatabase = await User.findOne({ email: req.body.email });
    if (userInDatabase) {
      return res.send("Email already exists!");
    }

    // email is not taken already , check password and confirmPassword match
    if (req.body.password !== req.body.confirmPassword) {
      return res.send("Password and Confirm Password must match");
    }

    // hashing password
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = hashedPassword;

    // creates user
    await User.create(req.body);

    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// sign-in post
router.post("/sign-in", async (req, res) => {
  try {
    const userInDatabase = await User.findOne({ email: req.body.email });
    if (!userInDatabase) {
      res.redirect("/sign-up");
    }

    // password validation
    const validPassword = bcrypt.compareSync(
      req.body.password,
      userInDatabase.password
    );
    if (!validPassword) {
      return res.send("Login failed! Please try again!");
    }
    // session creation for user
    req.session.user = {
      name: userInDatabase.name,
      email: userInDatabase.email,
      _id: userInDatabase._id,
    };
    // changing to asynchronous callback , express-session
    req.session.save(() => {
      res.redirect("/");
    });
  } catch (error) {
    console.log("error");
  }
});

// sign-out
router.get("/sign-out", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
