import CriteriaModel, { TCriteria } from "../models/Criteria.model";
import PengajuanModel, { TPengajuan } from "../models/Pengajuan.model";
import PengajuanCriteriaModel, {
  TPengajuanCriteria,
} from "../models/PengajuanCriteria.model";
import { Types } from "mongoose";
import mongoose from "mongoose";

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
  const allCriteriaPengajuan = await PengajuanCriteriaModel.find({});
  for (const data of allCriteriaPengajuan) {
    await PengajuanCriteriaModel.findOneAndUpdate(
      { _id: data._id },
      { $set: { year: 2021 } }
    );
  }
};

export default CriteriaPengajuanSeeder;
