import CriteriaModel, { TCriteria } from "src/database/models/Criteria.model";
import { AuthTCBRoute } from "src/types/Global";

class CriteriaController {
  get: AuthTCBRoute = async (req, res) => {
    try {
      const allCriteria = await CriteriaModel.find(
        {},
        { createdAt: 0, updatedAt: 0, __v: 0 }
      );
      return res.json({ data: allCriteria });
    } catch (_) {
      return res.status(500).send({ data: "Oops something gone wrong" });
    }
  };

  store: AuthTCBRoute<Partial<TCriteria>> = async (req, res) => {
    const { bobot, keterangan, name } = req.body;
    const newData = {
      bobot,
      keterangan,
      name,
    };
    try {
      if (!Object.values(newData).every((value) => !!value))
        throw { message: "Missing properties" };
      const { _id, bobot, keterangan, name } = await CriteriaModel.create(
        newData
      );
      return res.json({ data: { _id, bobot, keterangan, name } });
    } catch (err: any) {
      return res.status(400).json({ data: err.message });
    }
  };

  delete: AuthTCBRoute<{}, {}, { id: string }> = async (req, res) => {
    const { id } = req.params;
    await CriteriaModel.deleteOne({ _id: id });
    return res.json({ data: "Success" });
  };

  update: AuthTCBRoute<Partial<TCriteria>, {}, { id: string }> = async (
    req,
    res
  ) => {
    const { id } = req.params;
    const { bobot, keterangan, name } = req.body;
    try {
      const updatedCriteria = {
        bobot: bobot ? parseInt(bobot as unknown as string) : bobot,
        keterangan,
        name,
      };
      if (!Object.values(updatedCriteria).every((value) => !!value))
        throw { message: "Updated value aren't complete" };
      const newData = await CriteriaModel.findOneAndUpdate(
        { _id: id },
        updatedCriteria,
        { new: true, fields: { createdAt: 0, updatedAt: 0, __v: 0 } }
      );
      res.json({ status: "Success", data: newData });
    } catch (err: any) {
      res.status(400).json({ data: err.message });
    }
  };
}
export default new CriteriaController();
