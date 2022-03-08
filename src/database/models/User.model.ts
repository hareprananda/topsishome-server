import mongoose from "mongoose";

export type TUser = {
  name: string;
  nik: string;
  password: string;
  level: "admin" | "user";
};

const schema = new mongoose.Schema<TUser>(
  {
    name: String,
    nik: String,
    password: String,
    level: String,
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model<TUser>("user", schema);
export default UserModel;
