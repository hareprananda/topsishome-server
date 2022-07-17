import { Schema, model } from "mongoose";
import { TPengajuanCriteria } from "./PengajuanCriteria.model";

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

export default model<TPengajuanCriteria>("pengajuancriteriasbackup", schema, "pengajuancriteriasbackup");
