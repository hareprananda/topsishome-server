import mongoose from "mongoose";

export type TCandidate = {
  _id: string;
  name: string;
  address: string;
  status: string;
  gender: string;
  age: string;
  houseCondition: string;
  landArea: number; //in are
  income: number; //per month
  job: string;
};

const schema = new mongoose.Schema<TCandidate>(
  {
    name: String,
    address: String,
    status: String,
    gender: String,
    age: String,
    houseCondition: String,
    landArea: Number, //in are
    income: Number, //per month
    job: String,
  },
  {
    timestamps: true,
  }
);

const CandidateModel = mongoose.model<TCandidate>("candidate", schema);
export default CandidateModel;
