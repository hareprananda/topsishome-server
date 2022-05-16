import mongoose from "mongoose";
import BanjarModel from "src/database/models/Banjar.model";
import PengajuanModel from "src/database/models/Pengajuan.model";
import PengajuanCriteriaModel from "src/database/models/PengajuanCriteria.model";
import { TCBRoute } from "src/types/Global";

class BanjarController {
  get: TCBRoute = async (req, res) => {
    const banjarData = await BanjarModel.find({}, { __v: 0 });
    return res.json({ data: banjarData });
  };

  update: TCBRoute<{ nama: string }, {}, { id: string }> = async (req, res) => {
    const { id } = req.params;
    const { nama } = req.body;
    const updated = await BanjarModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { nama } },
      { new: true }
    );
    return res.json({ data: updated });
  };

  store: TCBRoute<{ nama: string }> = async (req, res) => {
    const newData = await BanjarModel.create(req.body);
    return res.json({ data: newData });
  };

  remove: TCBRoute<{}, {}, { id: string }> = async (req, res) => {
    const { id } = req.params;
    const idBanjar = new mongoose.Types.ObjectId(id);
    await BanjarModel.deleteMany({ _id: idBanjar });
    const pengajuanIds = await PengajuanModel.distinct("_id", {
      idBanjar,
    });
    await PengajuanModel.deleteMany({ idBanjar });
    await PengajuanCriteriaModel.deleteMany({
      pengajuanId: { $in: pengajuanIds },
    });
    return res.json({ data: "Delete success" });
  };
}

export default new BanjarController();
