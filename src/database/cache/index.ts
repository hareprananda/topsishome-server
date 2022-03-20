import CriteriaCache from "./CriteriaCache";

const Cache = async () => {
  await CriteriaCache.refresh();
};

export default Cache;
