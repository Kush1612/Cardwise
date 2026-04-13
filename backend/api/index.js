require("dotenv").config();

const connectDB = require("../src/config/db");
const app = require("../src/server");

connectDB();

module.exports = app;
