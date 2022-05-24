import { Schema, model } from "mongoose";

export interface TPengajuanCriteria {
  pengajuanId: Schema.Types.ObjectId;
  criteriaId: Schema.Types.ObjectId;
  year: number;
  value: number;
}

const schema = new Schema({
  pengajuanId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "pengajuans",
  },
  year: { type: Number, required: true },
  criteriaId: { type: Schema.Types.ObjectId, required: true, ref: "criterias" },
  value: { type: Number, required: true },
});

export default model<TPengajuanCriteria>("pengajuancriteria", schema);
