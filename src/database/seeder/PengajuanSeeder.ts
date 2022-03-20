import PengajuanModel, { TPengajuan } from "../models/Pengajuan.model";
import faker from "@faker-js/faker";

const PengajuanSeeder = async () => {
  const pengajuanData: Omit<TPengajuan, "_id">[] = [];
  const statusArray = ["single", "married"];
  const gender = ["laki", "perempuan"] as const;
  const ageRange = [20, 21, 22, 23, 24, 25, 26, 27, 28];
  for (let i = 0; i < 30; i++) {
    pengajuanData.push({
      alamat: faker.address.city(),
      jenisKelamin: gender[Math.floor(Math.random() * gender.length)],
      nama: faker.name.findName(),
      pekerjaan: faker.name.jobTitle(),
      status: statusArray[Math.floor(Math.random() * statusArray.length)],
      umur: ageRange[Math.floor(Math.random() * ageRange.length)],
    });
  }
  await PengajuanModel.insertMany(pengajuanData);
};

export default PengajuanSeeder;
