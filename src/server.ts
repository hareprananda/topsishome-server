import express from "express";
import config from "config/index";

const app = express();

config(app);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log("Server started at port " + PORT));
