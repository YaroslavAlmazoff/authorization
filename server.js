const express = require("express");
const cors = require("cors");
const config = require("config");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: config.get("CLIENT_URL"),
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ extended: true }));
app.use("/api", require("./routers/auth.router"));

app.listen(config.get("PORT"), () => {
  try {
    mongoose.connect(config.get("DATABASE_CONNECTION_URL"), {
      useNewUrlParser: true,
    });
    console.log("SERVER WORKS...");
  } catch (e) {
    console.log(e);
  }
});
