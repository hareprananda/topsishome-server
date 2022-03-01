import express from "express";
import config from "config/index";

const app = express();

config(app);

const PORT = 5000 || process.env.PORT;

app.listen(PORT, () => console.log("Server started at port " + PORT));
