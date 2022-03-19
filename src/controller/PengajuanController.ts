import PengajuanModel, {
  TPengajuan,
} from "src/database/models/Pengajuan.model";
import { AuthTCBRoute } from "src/types/Global";

class PengajuanController {
  private paginationLength = 20;
  get: AuthTCBRoute<{}, { page: string }> = async (req, res) => {
    const page = parseInt(req.query.page || "1");
    const dataLength = await PengajuanModel.count();
    const numberOfPage = Math.ceil(dataLength / this.paginationLength);
    const data = await PengajuanModel.aggregate([
      {
        $sort: { nama: 1 },
      },
      {
        $skip: (page - 1) * this.paginationLength,
      },
      {
        $limit: this.paginationLength,
      },
      {
        $unset: ["__v", "createdAt", "updatedAt"],
      },
    ]);
    return res.json({
      data: {
        meta: {
          currentPage: page,
          numberOfPage,
          dataPerPage: this.paginationLength,
        },
        data,
      },
    });
  };
  find: AuthTCBRoute<{}, {}, { id: string }> = async (req, res) => {
    const { id } = req.params;
    try {
      const pengajuan = await PengajuanModel.findOne(
        { _id: id },
        { createdAt: 0, updatedAt: 0, __v: 0 }
      );
      return res.json({ data: pengajuan });
    } catch {
      return res.status(404).json({ data: "Data not found" });
    }
  };
  // store: AuthTCBRoute<TPengajuan> = async (req, res) => {
  //   const {
  //     alamat,
  //     jenisKelamin,
  //     kondisiRumah,
  //     luasTanah,
  //     nama,
  //     pekerjaan,
  //     penghasilan,
  //     status,
  //     umur,
  //     menerimaBantuan,
  //   } = req.body;
  //   const newData: TPengajuan = {
  //     alamat,
  //     jenisKelamin,
  //     kondisiRumah,
  //     luasTanah,
  //     nama,
  //     pekerjaan,
  //     penghasilan,
  //     status,
  //     umur,
  //     menerimaBantuan,
  //   };
  //   try {
  //     if (!Object.values(newData).every((val) => !!val))
  //       throw { message: "Some key properties missing" };
  //     const newStoredData = await PengajuanModel.create(newData);

  //     return res.json({ data: newStoredData });
  //   } catch (err: any) {
  //     return res.status(400).json({ data: err.message });
  //   }
  // };
  delete: AuthTCBRoute<{}, {}, { id: string }> = async (req, res) => {
    const { id } = req.params;
    await PengajuanModel.deleteOne({ _id: id });
    return res.json({ data: "Success" });
  };
  // update: AuthTCBRoute<TPengajuan, {}, { id: string }> = async (req, res) => {
  //   const { id } = req.params;
  //   const {
  //     alamat,
  //     jenisKelamin,
  //     kondisiRumah,
  //     luasTanah,
  //     nama,
  //     pekerjaan,
  //     penghasilan,
  //     status,
  //     umur,
  //     menerimaBantuan,
  //   } = req.body;
  //   const newData: TPengajuan = {
  //     alamat,
  //     jenisKelamin,
  //     kondisiRumah,
  //     luasTanah,
  //     nama,
  //     pekerjaan,
  //     penghasilan,
  //     status,
  //     umur,
  //     menerimaBantuan,
  //   };
  //   try {
  //     if (!Object.values(newData).every((val) => !!val))
  //       throw { message: "Some key properties missing" };
  //     const newUpdatedData = await PengajuanModel.findOneAndUpdate(
  //       { _id: id },
  //       newData,
  //       {
  //         new: true,
  //         fields: { createdAt: 0, updatedAt: 0, __v: 0 },
  //       }
  //     );

  //     return res.json({ data: newUpdatedData });
  //   } catch (err: any) {
  //     return res.status(400).json({ data: err.message });
  //   }
  // };
}

export default new PengajuanController();
