import CriteriaCache from "src/database/cache/CriteriaCache";
import { UploadedFile } from "express-fileupload";
import path from "path";
import fs from "fs";
import { Types } from "mongoose";
import PengajuanModel, { TPengajuan } from "src/database/models/Pengajuan.model";
import PengajuanCriteriaModel, { TPengajuanCriteria } from "src/database/models/PengajuanCriteria.model";
import { AuthTCBRoute } from "src/types/Global";
import readXlsxFile, { readSheetNames } from "read-excel-file/node";
import CriteriaModel, { TCriteria } from "src/database/models/Criteria.model";
import mongoose from "mongoose";
import BanjarModel from "src/database/models/Banjar.model";

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
    year: string;
    name: string;
    value: number;
  }[];
}

interface SingleDataFinal extends Omit<SingleData, "criteria"> {
  criteria: {
    year: string;
    criteria: SingleData["criteria"];
  }[];
}

class PengajuanController {
  private paginationLength = 20;
  get: AuthTCBRoute<{}, { page: string; name: string; banjar?: string; year: string }> = async (req, res) => {
    const yearInteger = parseInt(req.query.year);
    const year = isNaN(yearInteger) ? "" : yearInteger;
    const page = parseInt(req.query.page || "1");
    const name = req.query.name || "";
    const idBanjar = req.query.banjar;
    const banjarFilter = idBanjar ? { idBanjar: new mongoose.Types.ObjectId(idBanjar) } : {};
    const nameRegex = new RegExp(name, "gi");
    const dataLength = await PengajuanModel.find({ nama: nameRegex }).count();
    const numberOfPage = Math.ceil(dataLength / this.paginationLength);
    const data = await PengajuanModel.aggregate([
      {
        $sort: { nama: 1 },
      },
      {
        $match: { nama: nameRegex, ...banjarFilter },
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
            idBanjar: { $first: "$idBanjar" },
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
            idBanjar: "$idBanjar",
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
                  year: "$$criteriaVal.year",
                  name: "$$criteriaVal.name",
                  value: "$$criteriaVal.value",
                },
              },
            },
          },
        },
        {
          $lookup: {
            as: "banjar",
            from: "banjars",
            foreignField: "_id",
            localField: "idBanjar",
          },
        },
        {
          $unwind: "$banjar",
        },
        {
          $project: {
            _id: "$_id",
            alamat: "$alamat",
            idBanjar: "$idBanjar",
            namaBanjar: "$banjar.nama",
            status: "$status",
            jenisKelamin: "$jenisKelamin",
            umur: "$umur",
            pekerjaan: "$pekerjaan",
            nama: "$nama",
            criteria: "$criteria",
          },
        },
      ]);
      const newCriteria = pengajuan.criteria.reduce((acc, cr) => {
        const yearIndex = acc.findIndex((v) => v.year === cr.year);
        if (yearIndex !== -1) {
          acc[yearIndex].criteria.push(cr);
        } else {
          acc.push({ year: cr.year, criteria: [cr] });
        }
        return acc;
      }, [] as SingleDataFinal["criteria"]);
      const newPengajuan = {
        ...pengajuan,
        criteria: newCriteria,
      };
      newPengajuan.criteria.forEach((cr, idx) => {
        newPengajuan.criteria[idx].criteria = allCriteria.map((criteria, idx) => ({
          id: criteria._id,
          name: criteria.name,
          year: cr.year,
          value: cr.criteria.find((cr) => cr.id.toString() == criteria._id.toString())?.value || 0,
        }));
      });
      return { status: 200, data: newPengajuan };
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
  store: AuthTCBRoute<TPengajuan & { criteria: { id: string; value: string; year: string }[] }> = async (req, res) => {
    const { alamat, jenisKelamin, nama, pekerjaan, status, umur, criteria, idBanjar } = req.body;
    const newData: Partial<typeof req.body> = {
      alamat,
      jenisKelamin,
      nama,
      pekerjaan,
      idBanjar: new mongoose.Types.ObjectId(idBanjar),
      status,
      umur,
      criteria,
    };
    const allCriteriaID = CriteriaCache.get().map((cr) => cr._id);
    const newCriteriaID = criteria.map((cr) => cr.id);
    const newlyYear = criteria?.map((cr) => parseInt(cr.year));
    const currentYear = new Date().getFullYear();
    const availYear: number[] = [];
    for (let i = currentYear; i >= currentYear - 4; i--) {
      availYear.push(i);
    }
    const newCriteriaValue = criteria.map((cr) => cr.value);
    try {
      if (
        !Object.values(newData).every((val) => !!val) ||
        !allCriteriaID.every((id) => newCriteriaID.includes(id.toString()))
      )
        throw { message: "Some key properties missing" };
      else if (!newlyYear.every((year) => availYear.includes(year))) throw { message: "Year are not valid" };
      else if (!newCriteriaValue.every((value) => /^\d+$/g.test(value as unknown as string)))
        throw { message: "Criteria value must be a number" };
      delete newData.criteria;
      const newPengajuan = await PengajuanModel.create(newData);
      await PengajuanCriteriaModel.insertMany(
        criteria.map((cr) => ({
          criteriaId: cr.id,
          pengajuanId: newPengajuan._id,
          value: parseInt(cr.value),
          year: parseInt(cr.year),
        }))
      );
      const { data: newStoredData } = await this.getSinglePengajuan(newPengajuan._id.toString());

      return res.json({ data: newStoredData });
    } catch (err: any) {
      return res.status(400).json({ data: err.message });
    }
  };

  delete: AuthTCBRoute<{}, {}, { id: string }> = async (req, res) => {
    const { id } = req.params;
    await PengajuanModel.deleteOne({ _id: id });
    await PengajuanCriteriaModel.deleteMany({ pengajuanId: id });
    return res.json({ data: "Success" });
  };

  update: AuthTCBRoute<TPengajuan & { criteria: { id: string; value: number; year: string }[] }, {}, { id: string }> =
    async (req, res) => {
      const { id } = req.params;
      const { alamat, jenisKelamin, nama, pekerjaan, status, umur, criteria, idBanjar } = req.body;
      const updatedCriteriaID = criteria?.map((cr) => cr.id);
      const updatedValue = criteria?.map((cr) => cr.value);
      const updatedYear = criteria?.map((cr) => parseInt(cr.year));
      const currentYear = new Date().getFullYear();
      const availYear: number[] = [];
      for (let i = currentYear; i >= currentYear - 4; i--) {
        availYear.push(i);
      }
      const allCriteriaID = CriteriaCache.get().map((cr) => cr._id);
      const newData: Partial<typeof req.body> = {
        alamat,
        idBanjar: new mongoose.Types.ObjectId(idBanjar),
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
        else if (!updatedYear.every((year) => availYear.includes(year))) throw { message: "Year are not valid" };
        else if (!updatedValue.every((value) => /^\d+$/g.test(value as unknown as string)))
          throw { message: "Criteria value must be a number" };

        delete newData.criteria;
        await PengajuanModel.findOneAndUpdate({ _id: id }, newData);
        for (const singleCriteria of criteria) {
          await PengajuanCriteriaModel.findOneAndUpdate(
            {
              pengajuanId: new Types.ObjectId(id),
              year: parseInt(singleCriteria.year),
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
    if (!files || !files.alternative) return res.status(400).json({ data: "Alternative file is undefined" });
    const alternative = files.alternative as UploadedFile;
    const extension = alternative.name.match(/(?<=\.)\w+$/g)?.[0];
    if (extension !== "xlsx") return res.status(400).json({ data: "Invalid data extension" });
    const filePath = path.resolve("") + `/file.${extension}`;
    await alternative.mv(filePath);
    const sheetName = await readSheetNames(filePath);
    const allCriteria = await CriteriaModel.find({});
    const banjarRawData = await BanjarModel.find({});
    const banjarObject = banjarRawData.reduce((acc, v) => {
      acc[v.nama.toLowerCase()] = v._id;
      return acc;
    }, {} as Record<string, mongoose.Types.ObjectId>);
    const criteriaName = allCriteria.map((v) => v.name);
    const allBanjarIsExist = sheetName.every((banjar) => !!banjarObject[banjar.toLowerCase()]);
    if (!allBanjarIsExist) return res.status(400).json({ data: "Some banjar not found" });
    let stopMessage = "";
    const additionalTitle = ["Nama", "Tahun", "Jenis kelamin", "Pekerjaan", "Umur", "Status"] as const;
    const penghasilanRange = [500000, 1000000, 2000000, 3000000];
    const luasTanahRange = [100, 300, 500, 800];
    for (const sheet of sheetName) {
      const rows = await readXlsxFile(filePath, { sheet });
      const undefinedTitle = [...criteriaName, ...additionalTitle].reduce((acc, v) => {
        if (!rows[0].includes(v)) acc.push(v);
        return acc;
      }, [] as string[]);
      if (undefinedTitle.length > 0) {
        const concatUndefined = undefinedTitle.reduce((acc, v) => `"${acc}", "${v}"`, "").slice(3);
        stopMessage = `Title incomplete in sheet '${sheet}', without ${concatUndefined} title`;
        break;
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
      Tahun: "Tahun",
      "Jenis kelamin": "Jenis kelamin",
      Pekerjaan: "Pekerjaan",
      Umur: "Umur",
      Status: "Status",
      ...criteriaName.reduce((acc, v) => {
        acc[v] = v;
        return acc;
      }, {} as Record<string, any>),
    } as const;

    for (const sheet of sheetName) {
      const rows = await readXlsxFile<Record<keyof typeof map, string>>(filePath, { sheet, map });
      for (const r of rows.rows) {
        const newPengajuan = await PengajuanModel.create({
          alamat: sheet, //aka banjar
          jenisKelamin: r["Jenis kelamin"] === "Laki-laki" ? "laki" : "perempuan",
          idBanjar: banjarObject[sheet.toLowerCase()],
          nama: r.Nama,
          pekerjaan: r.Pekerjaan,
          status: r.Status,
          umur: r.Umur,
        });
        const newPengajuanCriteria: TPengajuanCriteria[] = allCriteria.map((v) => {
          let value = isNaN(parseInt(r[v.name as keyof typeof map])) ? 0 : parseInt(r[v.name as keyof typeof map]);
          if (v.name === "Luas Tanah") {
            const indexRange = luasTanahRange.findIndex((v) => value <= v);
            value = indexRange !== -1 ? indexRange + 1 : 5;
          } else if (v.name === "Penghasilan") {
            const indexRange = penghasilanRange.findIndex((v) => value <= v);
            value = indexRange !== -1 ? indexRange + 1 : 5;
          }
          return {
            criteriaId: v._id,
            pengajuanId: newPengajuan._id,
            year: parseInt(r.Tahun),
            value,
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
