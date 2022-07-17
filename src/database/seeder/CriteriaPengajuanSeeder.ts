import CriteriaModel, { TCriteria } from "../models/Criteria.model";
import PengajuanModel, { TPengajuan } from "../models/Pengajuan.model";
import PengajuanCriteriaModel, { TPengajuanCriteria } from "../models/PengajuanCriteria.model";
import { Types } from "mongoose";
import mongoose from "mongoose";
import PengajuanCriteriaBackupModel from "../models/PengajuanCriteriaBackup.model";

const CriteriaPengajuanSeeder = async () => {
  // const allCriteria: TCriteria[] = await CriteriaModel.find({});
  // const allPengajuan: TPengajuan[] = await PengajuanModel.find({});

  // const kondisiRumah = [1, 2, 3, 4, 5];
  // //penghasilan
  // Math.floor(Math.random() * Math.pow(10, 2)) * 100000;
  // //menerima bantuan
  // Math.floor(Math.random() * 10);
  // //luas tanah

  // for (let pengajuan of allPengajuan) {
  //   const newData: TPengajuanCriteria[] = [];
  //   for (let criteria of allCriteria) {
  //     let value: number = 0;
  //     if (criteria.name == "Luas Tanah")
  //       value = Math.floor(Math.random() * Math.pow(10, 5));
  //     else if (criteria.name == "Kondisi Rumah")
  //       value = kondisiRumah[Math.floor(Math.random() * kondisiRumah.length)];
  //     else if (criteria.name == "Menerima Bantuan")
  //       value = Math.floor(Math.random() * 10);
  //     else value = Math.floor(Math.random() * Math.pow(10, 2)) * 100000;
  //     newData.push({
  //       criteriaId: criteria._id as any,
  //       pengajuanId: pengajuan._id as any,
  //       value,
  //     });
  //   }
  //   await PengajuanCriteriaModel.insertMany(newData);
  // }
  // const allCriteriaPengajuan = await PengajuanCriteriaModel.find({});
  // for (const data of allCriteriaPengajuan) {
  //   await PengajuanCriteriaModel.findOneAndUpdate(
  //     { _id: data._id },
  //     { $set: { year: 2021 } }
  //   );
  // }

  const pengajuanCriteriaBackup = await PengajuanCriteriaBackupModel.aggregate([
    {
      $lookup: {
        from: "criterias",
        foreignField: "_id",
        localField: "criteriaId",
        as: "criteria",
      },
    },
    {
      $unwind: "$criteria",
    },
  ]);

  // Penghasilan
  const penghasilanRange = [500000, 1000000, 2000000, 3000000];
  const luasTanahRange = [100, 300, 500, 800];

  for (const singleData of pengajuanCriteriaBackup) {
    const { criteriaId, pengajuanId, year, criteria } = singleData;
    let { value } = singleData;
    if (criteria.name === "Luas Tanah") {
      const indexRange = luasTanahRange.findIndex((v) => value <= v);
      value = indexRange !== -1 ? indexRange + 1 : 5;
    } else if (criteria.name === "Penghasilan") {
      const indexRange = penghasilanRange.findIndex((v) => value <= v);
      value = indexRange !== -1 ? indexRange + 1 : 5;
    }
    await PengajuanCriteriaModel.create({ criteriaId, pengajuanId, value, year });
  }
};

export default CriteriaPengajuanSeeder;
