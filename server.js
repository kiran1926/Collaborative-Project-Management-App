// dependencies
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const morgan = require("morgan");
const methodOverride = require("method-override");

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
// TODO : middleware for session


// custom error function 
const handleServerError = (err) => {
    if (err.code === "EADDRINUSE") {
        console.log(`Warning! POrt ${port} is already in taken`);
    } else {
        console.log("Error: ", err);
    }
};

// app to listen for HTTP requests
app.listen(port, () => {
    console.log(`The exress app is ready on port ${port}!`);
}).on("error", handleServerError);

