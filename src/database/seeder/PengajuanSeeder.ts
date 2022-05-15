import PengajuanModel, { TPengajuan } from "../models/Pengajuan.model";
import mongoose from "mongoose";
import faker from "@faker-js/faker";
import BanjarModel from "../models/Banjar.model";

const PengajuanSeeder = async () => {
  // const pengajuanData: Omit<TPengajuan, "_id">[] = [];
  // const statusArray = ["single", "married"];
  // const gender = ["laki", "perempuan"] as const;
  // const ageRange = [20, 21, 22, 23, 24, 25, 26, 27, 28];
  const allBanjar = await BanjarModel.find({});
  const banjarObject = allBanjar.reduce((acc, v) => {
    acc[v.nama.toLowerCase()] = v._id;
    return acc;
  }, {} as Record<string, mongoose.Types.ObjectId>);

  const allPengajuan = await PengajuanModel.find({});

  for (const pengajuan of allPengajuan) {
    await PengajuanModel.findOneAndUpdate(
      { _id: pengajuan._id },
      {
        $set: {
          idBanjar: banjarObject[pengajuan.alamat],
        },
      }
    );
  }

  // for (let i = 0; i < 30; i++) {
  //   pengajuanData.push({
  //     alamat: faker.address.city(),
  //     jenisKelamin: gender[Math.floor(Math.random() * gender.length)],
  //     nama: faker.name.findName(),
  //     idBanjar: new mongoose.Types.ObjectId("1"),
  //     pekerjaan: faker.name.jobTitle(),
  //     status: statusArray[Math.floor(Math.random() * statusArray.length)],
  //     umur: ageRange[Math.floor(Math.random() * ageRange.length)],
  //   });
  // }
  // await PengajuanModel.insertMany(pengajuanData);
};

export default PengajuanSeeder;
