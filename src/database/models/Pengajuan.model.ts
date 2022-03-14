import mongoose from "mongoose";

export interface TPengajuan {
  nama: string;
  alamat: string;
  status: string;
  jenisKelamin: "laki" | "perempuan";
  umur: number;
  kondisiRumah: number;
  menerimaBantuan: number;
  luasTanah: number; //dalam are,
  penghasilan: number; //perbulan
  pekerjaan: string;
}

const schema = new mongoose.Schema<TPengajuan>(
  {
    alamat: { type: String, required: true },
    status: { type: String, required: true },
    jenisKelamin: { type: String, required: true },
    umur: { type: Number, required: true },
    kondisiRumah: { type: Number, required: true },
    luasTanah: { type: Number, required: true },
    penghasilan: { type: Number, required: true },
    pekerjaan: { type: String, required: true },
    nama: { type: String, required: true },
    menerimaBantuan: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<TPengajuan>("pengajuan", schema);
