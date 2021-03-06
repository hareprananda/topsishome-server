import CriteriaModel, { TCriteria } from "database/models/Criteria.model";

let Cache: TCriteria[] = [];

const CriteriaCache = () => {
  const get = () => Cache;

  const refresh = async () => {
    const allCriteria = await CriteriaModel.find(
      {},
      { createdAt: 0, updatedAt: 0, __v: 0 }
    );
    Cache = [...allCriteria];
  };

  const set = (newCache: typeof Cache) => {
    Cache = newCache;
  };

  return { get, refresh, set };
};

export default CriteriaCache();
