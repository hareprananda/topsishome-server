import mongoose from "mongoose";

export interface TPengajuan {
  _id: string;
  nama: string;
  alamat: string;
  status: string;
  jenisKelamin: "laki" | "perempuan";
  idBanjar: mongoose.Types.ObjectId;
  umur: number;
  pekerjaan: string;
}

const schema = new mongoose.Schema<TPengajuan>(
  {
    alamat: { type: String, required: true },
    idBanjar: { type: mongoose.Schema.Types.ObjectId, require: true },
    status: { type: String, required: true },
    jenisKelamin: { type: String, required: true },
    umur: { type: Number, required: true },
    pekerjaan: { type: String, required: true },
    nama: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<TPengajuan>("pengajuan", schema);
