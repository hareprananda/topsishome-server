import CriteriaModel from "../models/Criteria.model";

const CriteriaSeeder = async () => {
  const defaultCriteria = [
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
      name: "Belum Pernah menerima bantuan",
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
