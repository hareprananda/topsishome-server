import CriteriaModel, { TCriteria } from "../models/Criteria.model";

const CriteriaSeeder = async () => {
  const defaultCriteria: TCriteria[] = [
    {
      _id: 1,
      name: "Luas Tanah",
      bobot: 4,
      keterangan: "cost",
    },
    {
      _id: 2,
      name: "Kondisi Rumah",
      bobot: 4,
      keterangan: "cost",
    },
    {
      _id: 3,
      name: "Menerima Bantuan",
      bobot: 3,
      keterangan: "cost",
    },
    {
      _id: 4,
      name: "Penghasilan",
      bobot: 5,
      keterangan: "benefit",
    },
  ];
  await CriteriaModel.insertMany(defaultCriteria);
};

export default CriteriaSeeder;
