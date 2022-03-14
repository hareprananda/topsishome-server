import CriteriaModel from "../models/Criteria.model";

const CriteriaSeeder = async () => {
  const defaultCriteria = [
    {
      name: "luasTanah",
      bobot: 4,
      keterangan: "cost",
    },
    {
      name: "kondisiRumah",
      bobot: 4,
      keterangan: "cost",
    },
    {
      name: "menerimaBantuan",
      bobot: 3,
      keterangan: "cost",
    },
    {
      name: "penghasilan",
      bobot: 5,
      keterangan: "benefit",
    },
  ];
  await CriteriaModel.insertMany(defaultCriteria);
};

export default CriteriaSeeder;
