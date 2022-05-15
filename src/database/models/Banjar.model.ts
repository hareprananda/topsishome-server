import mongoose from "mongoose";

export type TBanjar = {
  _id: mongoose.Types.ObjectId;
  nama: string;
};

const schema = new mongoose.Schema<TBanjar>({
  nama: String,
});

const BanjarModel = mongoose.model<TBanjar>("banjar", schema);
export default BanjarModel;
