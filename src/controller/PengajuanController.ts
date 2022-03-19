import CriteriaModel from "src/database/models/Criteria.model";
import PengajuanModel, {
  TPengajuan,
} from "src/database/models/Pengajuan.model";
import { AuthTCBRoute } from "src/types/Global";

interface SingleData {
  _id: number;
  alamat: string;
  status: string;
  jenisKelamin: string;
  umur: number;
  pekerjaan: string;
  nama: string;
  criteria: {
    id: number;
    name: string;
    value: number;
  }[];
}

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
      const allCriteria = await CriteriaModel.find({});
      const pengajuan: SingleData = (
        await PengajuanModel.aggregate([
          {
            $match: {
              _id: parseInt(id),
            },
          },
          {
            $lookup: {
              from: "pengajuancriterias",
              as: "pengajuancriteria",
              foreignField: "pengajuanId",
              localField: "_id",
            },
          },
          {
            $unwind: "$pengajuancriteria",
          },
          {
            $lookup: {
              from: "criterias",
              as: "criteria",
              foreignField: "_id",
              localField: "pengajuancriteria.criteriaId",
            },
          },
          {
            $unwind: "$criteria",
          },
          {
            $group: {
              _id: "$_id",
              alamat: { $first: "$alamat" },
              status: { $first: "$status" },
              jenisKelamin: { $first: "$jenisKelamin" },
              umur: { $first: "$umur" },
              pekerjaan: { $first: "$pekerjaan" },
              nama: { $first: "$nama" },
              criteria: {
                $push: { $mergeObjects: ["$criteria", "$pengajuancriteria"] },
              },
            },
          },
          {
            $project: {
              _id: "$_id",
              alamat: "$alamat",
              status: "$status",
              jenisKelamin: "$jenisKelamin",
              umur: "$umur",
              pekerjaan: "$pekerjaan",
              nama: "$nama",
              criteria: {
                $map: {
                  input: "$criteria",
                  as: "criteriaVal",
                  in: {
                    id: "$$criteriaVal.criteriaId",
                    name: "$$criteriaVal.name",
                    value: "$$criteriaVal.value",
                  },
                },
              },
            },
          },
        ])
      )[0];
      pengajuan.criteria = allCriteria.map((criteria) => ({
        id: criteria._id,
        name: criteria.name,
        value:
          pengajuan.criteria.find((cr) => cr.id === criteria._id)?.value || 0,
      }));
      return res.json({ data: pengajuan });
    } catch (err) {
      console.log(err);
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
