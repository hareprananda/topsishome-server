import PengajuanModel, { TPengajuan } from "../models/Pengajuan.model";
import faker from "@faker-js/faker";

const PengajuanSeeder = async () => {
  const pengajuanData: TPengajuan[] = [];
  const statusArray = ["single", "married"];
  const gender = ["laki", "perempuan"] as const;
  const kondisiRumah = [1, 2, 3, 4, 5];
  for (let i = 0; i < 30; i++) {
    pengajuanData.push({
      alamat: faker.address.city(),
      jenisKelamin: gender[Math.floor(Math.random() * gender.length)],
      kondisiRumah:
        kondisiRumah[Math.floor(Math.random() * kondisiRumah.length)],
      luasTanah: Math.floor(Math.random() * Math.pow(10, 5)),
      nama: faker.name.findName(),
      pekerjaan: faker.name.jobTitle(),
      penghasilan: Math.floor(Math.random() * Math.pow(10, 2)) * 100000,
      status: statusArray[Math.floor(Math.random() * statusArray.length)],
      umur: 21,
      menerimaBantuan: Math.floor(Math.random() * 10),
    });
  }
  await PengajuanModel.insertMany(pengajuanData);
};

export default PengajuanSeeder;
