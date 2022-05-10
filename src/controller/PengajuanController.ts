import CriteriaCache from "src/database/cache/CriteriaCache";
import { UploadedFile } from "express-fileupload";
import path from "path";
import fs from "fs";
import { Types } from "mongoose";
import PengajuanModel, {
  TPengajuan,
} from "src/database/models/Pengajuan.model";
import PengajuanCriteriaModel from "src/database/models/PengajuanCriteria.model";
import { AuthTCBRoute } from "src/types/Global";
import readXlsxFile, { readSheetNames } from "read-excel-file/node";
import CriteriaModel from "src/database/models/Criteria.model";

interface SingleData {
  _id: Types.ObjectId;
  alamat: string;
  status: string;
  jenisKelamin: string;
  umur: number;
  pekerjaan: string;
  nama: string;
  criteria: {
    id: Types.ObjectId;
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

  getSinglePengajuan = async (id: string) => {
    try {
      const allCriteria = CriteriaCache.get();
      const [pengajuan]: SingleData[] = await PengajuanModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id),
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
      ]);
      pengajuan.criteria = allCriteria.map((criteria) => ({
        id: criteria._id,
        name: criteria.name,
        value:
          pengajuan.criteria.find(
            (cr) => cr.id.toString() == criteria._id.toString()
          )?.value || 0,
      }));
      return { status: 200, data: pengajuan };
    } catch (err) {
      console.log(err);
      return { status: 404, data: "Data not found" };
    }
  };

  find: AuthTCBRoute<{}, {}, { id: string }> = async (req, res) => {
    const { id } = req.params;
    const { status, data } = await this.getSinglePengajuan(id);
    return res.status(status).json({ data });
  };
  store: AuthTCBRoute<
    TPengajuan & { criteria: { id: string; value: number }[] }
  > = async (req, res) => {
    const { alamat, jenisKelamin, nama, pekerjaan, status, umur, criteria } =
      req.body;
    const newData: Partial<typeof req.body> = {
      alamat,
      jenisKelamin,
      nama,
      pekerjaan,
      status,
      umur,
      criteria,
    };
    const allCriteriaID = CriteriaCache.get().map((cr) => cr._id);
    const newCriteriaID = criteria.map((cr) => cr.id);
    const newCriteriaValue = criteria.map((cr) => cr.value);
    try {
      if (
        !Object.values(newData).every((val) => !!val) ||
        !allCriteriaID.every((id) => newCriteriaID.includes(id.toString()))
      )
        throw { message: "Some key properties missing" };
      else if (
        !newCriteriaValue.every((value) =>
          /^\d+$/g.test(value as unknown as string)
        )
      )
        throw { message: "Criteria value must be a number" };
      delete newData.criteria;
      const newPengajuan = await PengajuanModel.create(newData);
      await PengajuanCriteriaModel.insertMany(
        criteria.map((cr) => ({
          criteriaId: cr.id,
          pengajuanId: newPengajuan._id,
          value: cr.value,
        }))
      );
      const { data: newStoredData } = await this.getSinglePengajuan(
        newPengajuan._id
      );

      return res.json({ data: newStoredData });
    } catch (err: any) {
      return res.status(400).json({ data: err.message });
    }
  };

  delete: AuthTCBRoute<{}, {}, { id: string }> = async (req, res) => {
    const { id } = req.params;
    await PengajuanModel.deleteOne({ _id: id });
    return res.json({ data: "Success" });
  };

  update: AuthTCBRoute<
    TPengajuan & { criteria: { id: string; value: number }[] },
    {},
    { id: string }
  > = async (req, res) => {
    const { id } = req.params;
    const { alamat, jenisKelamin, nama, pekerjaan, status, umur, criteria } =
      req.body;
    const updatedCriteriaID = criteria?.map((cr) => cr.id);
    const updatedValue = criteria?.map((cr) => cr.value);
    const allCriteriaID = CriteriaCache.get().map((cr) => cr._id);
    const newData: Partial<typeof req.body> = {
      alamat,
      jenisKelamin,
      nama,
      pekerjaan,
      status,
      umur,
      criteria,
    };
    try {
      if (
        !Object.values(newData).every((val) => !!val) ||
        !allCriteriaID.every((id) => updatedCriteriaID.includes(id.toString()))
      )
        throw { message: "Some key properties missing" };
      else if (
        !updatedValue.every((value) =>
          /^\d+$/g.test(value as unknown as string)
        )
      )
        throw { message: "Criteria value must be a number" };

      delete newData.criteria;
      await PengajuanModel.findOneAndUpdate({ _id: id }, newData);
      for (const singleCriteria of criteria) {
        await PengajuanCriteriaModel.findOneAndUpdate(
          {
            pengajuanId: new Types.ObjectId(id),
            criteriaId: new Types.ObjectId(singleCriteria.id),
          },
          {
            value: singleCriteria.value,
          },
          {
            upsert: true,
          }
        );
      }
      const { data: newSingleData } = await this.getSinglePengajuan(id);
      return res.json({ data: newSingleData });
    } catch (err: any) {
      return res.status(400).json({ data: err.message });
    }
  };

  pengajuanChart: AuthTCBRoute = async (req, res) => {
    const [chartData] = await PengajuanModel.aggregate([
      {
        $facet: {
          gender: [{ $sortByCount: "$jenisKelamin" }],
          umur: [{ $sortByCount: "$umur" }],
          status: [{ $sortByCount: "$status" }],
        },
      },
    ]);
    return res.json({ data: chartData });
  };

  uploadFile: AuthTCBRoute = async (req, res) => {
    const { files } = req;
    if (!files || !files.alternative)
      return res.status(400).json({ data: "Alternative file is undefined" });
    const alternative = files.alternative as UploadedFile;
    const extension = alternative.name.match(/(?<=\.)\w+$/g)?.[0];
    if (extension !== "xlsx")
      return res.status(400).json({ data: "Invalid data extension" });
    const filePath = path.resolve("") + `/file.${extension}`;
    await alternative.mv(filePath);
    const sheetName = await readSheetNames(filePath);
    const allCriteria = await CriteriaModel.find({});
    const criteriaName = allCriteria.map((v) => v.name);
    let stopMessage = "";
    for (const sheet of sheetName) {
      const rows = await readXlsxFile(filePath, { sheet });
      const [_, ...restTitle] = rows[0];
      if (restTitle.length !== criteriaName.length) {
        stopMessage = `Title incomplete in sheet '${sheet}'`;
        break;
      }
      for (const rowTitle of restTitle) {
        if (!criteriaName.includes(rowTitle as unknown as string)) {
          stopMessage = `Title '${rowTitle}' in sheet '${sheet}' are not supported`;
          break;
        }
      }
      if (stopMessage) break;
    }
    if (stopMessage) {
      fs.unlink(filePath, (err) => {
        if (err) return console.log("File not deleted");
      });
      return res.status(400).json({ data: stopMessage });
    }

    const map = {
      Nama: "Nama",
      "Luas Tanah": "Luas Tanah",
      "Kondisi Rumah": "Kondisi Rumah",
      "Menerima Bantuan": "Menerima Bantuan",
      Penghasilan: "Penghasilan",
    } as const;
    const jobArr = [
      "Karyawan Swasta",
      "Petani",
      "Wiraswasta",
      "Buruh harian lepas",
    ];
    const ageArr = [
      39, 68, 49, 35, 46, 45, 53, 69, 72, 72, 50, 47, 52, 51, 36, 38, 52, 63,
      92, 55, 57, 39, 66, 46, 80, 62,
    ];

    for (const sheet of sheetName) {
      const rows = await readXlsxFile<Record<keyof typeof map, string>>(
        filePath,
        { sheet, map }
      );
      for (const r of rows.rows) {
        const newPengajuan = await PengajuanModel.create({
          alamat: sheet,
          jenisKelamin: "laki",
          nama: r.Nama,
          pekerjaan: jobArr[Math.floor(Math.random() * jobArr.length)],
          status: "married",
          umur: ageArr[Math.floor(Math.random() * ageArr.length)],
        });
        const newPengajuanCriteria = allCriteria.map((v) => {
          return {
            criteriaId: v._id,
            pengajuanId: newPengajuan._id,
            value: r[v.name as keyof typeof map] || 0,
          };
        });

        await PengajuanCriteriaModel.insertMany(newPengajuanCriteria);
      }
    }
    fs.unlink(filePath, (err) => {
      if (err) return console.log("File not deleted");
    });
    return res.json({ data: "Success" });
  };
}

export default new PengajuanController();
