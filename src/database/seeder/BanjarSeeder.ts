import BanjarModel from "../models/Banjar.model";

const BanjarSeeder = async () => {
  const allBanjar = [
    "Dajan Peken",
    "Pasekan",
    "Tauman",
    "Belang",
    "Tegal",
    "Pempatan",
    "Dabin",
    "Ayar",
  ];
  await BanjarModel.insertMany(allBanjar.map((v) => ({ nama: v })));
};

export default BanjarSeeder;
