import { Schema, model } from "mongoose";
import { TCriteria } from "./Criteria.model";
import { TPengajuan } from "./Pengajuan.model";

export interface TPengajuanCriteria {
  _id: number;
  pengajuanId: TPengajuan["_id"];
  criteriaId: TCriteria["_id"];
  value: number;
}

const schema = new Schema({
  _id: { type: Number },
  pengajuanId: { type: Number, required: true },
  criteriaId: { type: Number, required: true },
  value: { type: Number, required: true },
});

export default model<TPengajuanCriteria>("pengajuancriteria", schema);
