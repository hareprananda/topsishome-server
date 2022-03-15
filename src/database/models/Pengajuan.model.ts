import mongoose from "mongoose";

export interface TPengajuan {
  _id: number;
  nama: string;
  alamat: string;
  status: string;
  jenisKelamin: "laki" | "perempuan";
  umur: number;
  pekerjaan: string;
}

const schema = new mongoose.Schema<TPengajuan>(
  {
    _id: { type: Number },
    alamat: { type: String, required: true },
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
