import CriteriaModel, { TCriteria } from "../models/Criteria.model";

const CriteriaSeeder = async () => {
  const defaultCriteria: Omit<TCriteria, "_id">[] = [
    {
      name: "Luas Tanah",
      bobot: 4,
      keterangan: "cost",
    },
    {
      name: "Kondisi Rumah",
      bobot: 4,
      keterangan: "cost",
    },
    {
      name: "Menerima Bantuan",
      bobot: 3,
      keterangan: "cost",
    },
    {
      name: "Penghasilan",
      bobot: 5,
      keterangan: "benefit",
    },
  ];
  await CriteriaModel.insertMany(defaultCriteria);
};

export default CriteriaSeeder;
