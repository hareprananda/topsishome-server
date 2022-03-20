import mongoose from "mongoose";

export type TUser = {
  _id: string;
  name: string;
  password: string;
  level: "administrator" | "user" | "guest";
};

const schema = new mongoose.Schema<TUser>(
  {
    _id: { type: String },
    name: { type: String, required: true },
    password: { type: String, required: true },
    level: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model<TUser>("user", schema);
export default UserModel;
