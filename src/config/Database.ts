import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export default (seederList?: Record<string, () => Promise<void>>) => {
  const mongoDBUrl = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.9wouu.mongodb.net/${process.env.DB_DATABASE}?retryWrites=true&w=majority`;

  mongoose
    .connect(mongoDBUrl)
    .then(async () => {
      if (seederList) {
        for (const seeder of Object.keys(seederList)) {
          console.log(`Seeding ${seeder}...`);
          await seederList[seeder]();
          console.log(`Seeding ${seeder} success`);
        }
        console.log("=====Seeding Success=====");
        process.exit();
      }
      console.log("Database connection established");
    })
    .catch((err) => console.log(err));
};
