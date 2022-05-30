import mongoose from "mongoose";
import CriteriaCache from "src/database/cache/CriteriaCache";
import CriteriaModel, { TCriteria } from "src/database/models/Criteria.model";
import { TPengajuan } from "src/database/models/Pengajuan.model";
import PengajuanCriteriaModel, {
  TPengajuanCriteria,
} from "src/database/models/PengajuanCriteria.model";
import { AuthTCBRoute, TCBRoute } from "src/types/Global";
import excel from "exceljs";
import pdf from "html-pdf";
import path from "path";
import fs from "fs";
import DateTime from "src/helper/DateTime";
// luastanah, kondisiRumah, penerima bantuan, penghasilan dibawah umk

interface TResult {
  _id: string;
  nama: string;
  luasTanah: number;
  kondisiRumah: number;
  menerimaBantuan: number;
  penghasilan: number;
}

interface RawData {
  _id: mongoose.Types.ObjectId;
  nama: string;
  year: number;
  alamat: string;
  banjar: string;
  criteria: {
    _id: mongoose.Types.ObjectId;
    name: string;
    keterangan: "cost" | "benefit";
    bobot: number;
    value: number;
  }[];
}

class CountController {
  private pembagi: Record<string, number> = {};
  private allCriteria: TCriteria[] = [];
  private solusiIdeal: {
    positif: Record<string, number>;
    negatif: Record<string, number>;
  } = {
    positif: {},
    negatif: {},
  };
  getCriteriaObject = async () => {
    const allKriteria = await CriteriaModel.find({}, { _id: 0, __v: 0 });
    return allKriteria.reduce((acc, criteria) => {
      return {
        ...acc,
        [criteria.name]: {
          bobot: criteria.bobot,
          keterangan: criteria.keterangan as unknown as "cost" | "benefit",
        },
      };
    }, {} as Record<string, { bobot: number; keterangan: "cost" | "benefit" }>);
  };

  //1 matriks keputusan ternormalisasi
  normalisasi = (rawData: RawData[]) => {
    for (const tickerData of rawData) {
      for (const criteria of this.allCriteria) {
        const value =
          tickerData.criteria.find(
            (val) => val._id.toString() === criteria._id.toString()
          )?.value || 0;
        if (this.pembagi[criteria.name] === undefined)
          this.pembagi[criteria.name] = 0;
        this.pembagi[criteria.name] += Math.pow(value, 2);
      }
    }
    const pembagiKeys = Object.keys(
      this.pembagi
    ) as (keyof typeof this.pembagi)[];
    for (const key of pembagiKeys) {
      this.pembagi[key] = Math.sqrt(this.pembagi[key]);
    }
    const normalisasi = rawData.map((tickerData) => {
      const temp = [] as RawData["criteria"];
      for (const criteria of this.allCriteria) {
        const criteriaIndex = tickerData.criteria.findIndex(
          (val) => val._id.toString() == criteria._id.toString()
        ) as number;
        temp.push({
          ...tickerData.criteria[criteriaIndex],
          value:
            tickerData.criteria[criteriaIndex].value /
              this.pembagi[criteria.name] || 0,
        });
      }
      return { ...tickerData, criteria: temp };
    });

    return normalisasi;
  };

  //2 matriks keputusan ternormalisasi dan terbobot
  normalisasiTerbobot = (normalisasi: RawData[]) => {
    const normalisasiTerbobot: RawData[] = normalisasi.map(
      (tickerNormalisasi) => {
        const temp = [] as RawData["criteria"];
        for (const criteria of this.allCriteria) {
          const criteriaOnTickerIndex = tickerNormalisasi.criteria.findIndex(
            (val) => val._id.toString() == criteria._id.toString()
          ) as number;
          temp.push({
            ...tickerNormalisasi.criteria[criteriaOnTickerIndex],
            value:
              tickerNormalisasi.criteria[criteriaOnTickerIndex].value *
              criteria.bobot,
          });
        }
        return {
          ...tickerNormalisasi,
          criteria: temp,
        };
      }
    );
    return normalisasiTerbobot;
  };

  //3 Mendapatkan solusi ideal positif dan negatif
  idealSolution = (normalisasiTerbobot: RawData[]) => {
    const keysWithNumberVal = Object.keys(
      this.pembagi
    ) as (keyof typeof this.pembagi)[];

    for (const tickerNormalisasi of normalisasiTerbobot) {
      for (const key of keysWithNumberVal) {
        const solusiPositif = this.solusiIdeal.positif[key];
        const solusiNegatif = this.solusiIdeal.negatif[key];
        const currentCriteria = tickerNormalisasi.criteria.find(
          (val) => val.name === key
        ) as RawData["criteria"][number];
        const keterangan = currentCriteria.keterangan;
        const currentSolution = currentCriteria.value;

        if (solusiPositif === undefined) {
          this.solusiIdeal.positif[key] = currentSolution;
          this.solusiIdeal.negatif[key] = currentSolution;
        } else {
          if (keterangan === "benefit") {
            this.solusiIdeal.positif[key] =
              solusiPositif > currentSolution ? solusiPositif : currentSolution;
            this.solusiIdeal.negatif[key] =
              solusiNegatif < currentSolution ? solusiNegatif : currentSolution;
          } else if (keterangan === "cost") {
            this.solusiIdeal.positif[key] =
              solusiPositif < currentSolution ? solusiPositif : currentSolution;
            this.solusiIdeal.negatif[key] =
              solusiNegatif > currentSolution ? solusiNegatif : currentSolution;
          }
        }
      }
    }
  };

  //4 Jarak solusi ideal positif dan negatif
  idealSolutionDistance = (normalisasiTerbobot: RawData[]) => {
    const jarakSolusiIdeal: {
      dMin: number;
      dPlus: number;
      nama: string;
      year: number;
      alamat: string;
      id: RawData["_id"];
      banjar: string;
    }[] = [];

    for (const dataSingleNormalisasi of normalisasiTerbobot) {
      let tempDPlus: number = 0;
      let tempDMin: number = 0;
      for (const singleCriteria of dataSingleNormalisasi.criteria) {
        tempDPlus += Math.pow(
          this.solusiIdeal.positif[singleCriteria.name] - singleCriteria.value,
          2
        );
        tempDMin += Math.pow(
          singleCriteria.value - this.solusiIdeal.negatif[singleCriteria.name],
          2
        );
      }
      jarakSolusiIdeal.push({
        dPlus: Math.sqrt(tempDPlus),
        dMin: Math.sqrt(tempDMin),
        year: dataSingleNormalisasi.year,
        nama: dataSingleNormalisasi.nama,
        alamat: dataSingleNormalisasi.alamat,
        id: dataSingleNormalisasi._id,
        banjar: dataSingleNormalisasi.banjar,
      });
    }
    return jarakSolusiIdeal;
  };

  //5 get final ranking
  finalRankingList = (
    jarakSolusiIdeal: ReturnType<typeof this.idealSolutionDistance>
  ) => {
    // const finalRanking: { ticker: string; nilai: number; nama: string }[] = [];
    return jarakSolusiIdeal
      .map((jarak) => {
        const { dMin, dPlus, id, nama, alamat, banjar, year } = jarak;
        return {
          id,
          alamat,
          year,
          nama,
          banjar,
          value: dMin / (dMin + dPlus),
        };
      })
      .sort((a, b) => b.value - a.value);
  };

  getRawData = async (
    filter: Partial<TPengajuan & TPengajuanCriteria> = {}
  ) => {
    const { year, ...restFilter } = filter;
    let latestYear = new Date().getFullYear();
    if (!year) {
      const allYear = await PengajuanCriteriaModel.distinct("year");
      allYear.sort((a, b) => b - a);
      latestYear = allYear[0];
    }

    const rawData: RawData[] = await PengajuanCriteriaModel.aggregate([
      {
        $match: {
          year: { $eq: year || latestYear },
        },
      },
      {
        $lookup: {
          from: "pengajuans",
          as: "pengajuan",
          foreignField: "_id",
          localField: "pengajuanId",
        },
      },
      {
        $lookup: {
          from: "criterias",
          as: "criteria",
          foreignField: "_id",
          localField: "criteriaId",
        },
      },
      {
        $unwind: "$pengajuan",
      },
      {
        $unwind: "$criteria",
      },
      {
        $project: {
          _id: "$pengajuan._id",
          nama: "$pengajuan.nama",
          alamat: "$pengajuan.alamat",
          year: "$year",
          idBanjar: "$pengajuan.idBanjar",
          criteria: {
            _id: "$criteria._id",
            name: "$criteria.name",
            keterangan: "$criteria.keterangan",
            bobot: "$criteria.bobot",
            value: "$value",
          },
        },
      },
      {
        $match: Object.keys(restFilter).reduce((acc, v) => {
          acc[v] = { $eq: restFilter[v as keyof typeof restFilter] };
          return acc;
        }, {} as Record<string, any>),
      },
      {
        $group: {
          _id: "$_id",
          nama: { $first: "$nama" },
          year: { $first: "$year" },
          idBanjar: { $first: "$idBanjar" },
          alamat: { $first: "$alamat" },
          criteria: { $push: "$criteria" },
        },
      },
      {
        $lookup: {
          from: "banjars",
          as: "banjar",
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
          nama: "$nama",
          year: "$year",
          banjar: "$banjar.nama",
          alamat: "$alamat",
          criteria: "$criteria",
        },
      },
      {
        $sort: {
          nama: 1,
        },
      },
    ]);
    this.allCriteria = CriteriaCache.get();
    return rawData.map((data) => {
      return {
        ...data,
        criteria: this.allCriteria.map((criteria) => {
          //@ts-ignore
          criteria = criteria.toObject();
          const value =
            data.criteria.find(
              (val) => val._id.toString() === criteria._id.toString()
            )?.value || 0;
          return {
            ...criteria,
            value,
          };
        }) as RawData["criteria"],
      };
    });
  };

  async getResult(filter: Record<string, any>) {
    const rawData = await this.getRawData(filter);
    const normalisasi = this.normalisasi(rawData);
    const normalisasiTerbobot = this.normalisasiTerbobot(normalisasi);
    this.idealSolution(normalisasiTerbobot);
    const jarakSolusiIdeal = this.idealSolutionDistance(normalisasiTerbobot);
    const finalRanking = this.finalRankingList(jarakSolusiIdeal);
    return finalRanking;
  }

  result: AuthTCBRoute<{}, { banjar: string; year: string }> = async (
    req,
    res
  ) => {
    let filter: Record<string, any> = {
      idBanjar: req.query.banjar
        ? new mongoose.Types.ObjectId(req.query.banjar)
        : "",
      year: isNaN(parseInt(req.query.year)) ? "" : parseInt(req.query.year),
    };
    filter = (Object.keys(filter) as (keyof typeof filter)[]).reduce(
      (acc, v) => {
        if (!filter[v]) return acc;
        acc[v] = filter[v];
        return acc;
      },
      {} as typeof filter
    );
    const finalRanking = await this.getResult(filter);

    return res.json({ data: finalRanking });
  };

  resultDetail: AuthTCBRoute<{}, { banjar: string; year: string }> = async (
    req,
    res
  ) => {
    let filter: Record<string, any> = {
      idBanjar: req.query.banjar
        ? new mongoose.Types.ObjectId(req.query.banjar)
        : "",
      year: isNaN(parseInt(req.query.year)) ? "" : parseInt(req.query.year),
    };
    filter = (Object.keys(filter) as (keyof typeof filter)[]).reduce(
      (acc, v) => {
        if (!filter[v]) return acc;
        acc[v] = filter[v];
        return acc;
      },
      {} as typeof filter
    );
    const rawData = await this.getRawData(filter);
    const normalisasi = this.normalisasi(rawData);
    const normalisasiTerbobot = this.normalisasiTerbobot(normalisasi);
    this.idealSolution(normalisasiTerbobot);
    const jarakSolusiIdeal = this.idealSolutionDistance(normalisasiTerbobot);
    const finalRanking = this.finalRankingList(jarakSolusiIdeal).slice(0, 10);

    const topPengajuanID = finalRanking.map((rank) => rank.id);

    return res.json({
      data: {
        rawData: rawData.filter((raw) => topPengajuanID.includes(raw._id)),
        normalisasi: normalisasi.filter((normalisasi) =>
          topPengajuanID.includes(normalisasi._id)
        ),
        normalisasiTerbobot: normalisasiTerbobot.filter((normalisasi) =>
          topPengajuanID.includes(normalisasi._id)
        ),
        idealSolution: this.solusiIdeal,
        idealSolutionDistance: jarakSolusiIdeal.filter((distance) =>
          topPengajuanID.includes(distance.id)
        ),
        finalRanking,
      },
    });
  };

  downloadReport: AuthTCBRoute<{}, { banjar: string; year: string }> = async (
    req,
    res
  ) => {
    let filter: Record<string, any> = {
      idBanjar: req.query.banjar
        ? new mongoose.Types.ObjectId(req.query.banjar)
        : "",
      year: isNaN(parseInt(req.query.year)) ? "" : parseInt(req.query.year),
    };
    filter = (Object.keys(filter) as (keyof typeof filter)[]).reduce(
      (acc, v) => {
        if (!filter[v]) return acc;
        acc[v] = filter[v];
        return acc;
      },
      {} as typeof filter
    );
    const finalRanking = await this.getResult(filter);
    if (finalRanking.length === 0)
      return res.status(400).json({ data: "Bad request" });
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet(
      req.query.banjar
        ? `10 besar ${finalRanking[0].banjar}`
        : "Penerima Bantuan"
    );
    worksheet.columns = [
      { header: "Peringkat", key: "rank", width: 10 },
      { header: "Nama", key: "nama", width: 40 },
      { header: "Banjar", key: "banjar", width: 20 },
      { header: "Tahun", key: "year", width: 10 },
      { header: "Nilai", key: "value", width: 10 },
    ];
    worksheet.addRows(
      finalRanking.slice(0, 10).map((v, k) => ({ rank: k + 1, ...v }))
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "tutorials.xlsx"
    );
    return workbook.xlsx.write(res).then(function () {
      res.status(200).end();
    });
  };

  downloadPDF: AuthTCBRoute = async (req, res) => {
    const protocol = req.protocol;
    const domain = `${protocol}://${req.get("host")}`;
    const currentDate = new Date();
    const dateTime = `${currentDate.getDate()} ${DateTime.month(
      currentDate.getMonth()
    )} ${currentDate.getFullYear()}`;
    const fileName = "SuratPenerima.pdf";
    const pathFinal = path.resolve(`src/pdf/${fileName}`);
    let HTMLContent = fs.readFileSync(
      path.resolve("src/pdf/Laporan.html"),
      "utf8"
    );
    const data = await this.getResult({});
    const tableElement = data.slice(0, 10).reduce(
      (acc, v, idx) =>
        (acc += `<tr>
      <td>${idx + 1}</td>
      <td>${v.nama}</td>
      <td>${v.alamat}</td>
    </tr>`),
      ""
    );
    HTMLContent = HTMLContent.replace(
      /{{\s*penerimabantuan\s*}}/gi,
      tableElement
    );
    HTMLContent = HTMLContent.replace(/{{\s*baseUrl\s*}}/g, domain);
    HTMLContent = HTMLContent.replace(/{{\s*dateTime\s*}}/g, dateTime);

    pdf
      .create(HTMLContent, {
        format: "A4",
        orientation: "landscape",
      })
      .toFile(pathFinal, function (err, fileRes) {
        if (err) return console.log(err);
        res.status(200).download(fileRes.filename, (err) => {
          if (err)
            res.status(400).json({ data: "Oops something bad happened" });
        });
        // console.log(res); // { filename: '/app/businesscard.pdf' }
      });
  };
}

export default new CountController();
