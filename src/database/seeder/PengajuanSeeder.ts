import PengajuanModel, { TPengajuan } from "../models/Pengajuan.model";
import faker from "@faker-js/faker";

const PengajuanSeeder = async () => {
  const pengajuanData: TPengajuan[] = [];
  for (let i = 0; i < 30; i++) {
    pengajuanData.push({
      alamat: faker.address.city(),
      jenisKelamin: "laki",
      kondisiRumah: 3,
      luasTanah: Math.floor(Math.random() * Math.pow(10, 5)),
      nama: faker.name.findName(),
      pekerjaan: faker.name.jobTitle(),
      penghasilan: Math.floor(Math.random() * Math.pow(10, 2)) * 100000,
      status: "married",
      umur: 21,
    });
  }
  await PengajuanModel.insertMany(pengajuanData);
};

export default PengajuanSeeder;
