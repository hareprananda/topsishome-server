import mongoose from "mongoose";

export type TCriteria = {
  name: string;
  keterangan: string;
  bobot: number;
};

const schema = new mongoose.Schema<TCriteria>(
  {
    name: String,
    keterangan: String,
    bobot: Number,
  },
  {
    timestamps: true,
  }
);

const CriteriaModel = mongoose.model<TCriteria>("criteria", schema);
export default CriteriaModel;
