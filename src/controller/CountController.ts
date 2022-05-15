import mongoose from "mongoose";
import CriteriaCache from "src/database/cache/CriteriaCache";
import CriteriaModel, { TCriteria } from "src/database/models/Criteria.model";
import { TPengajuan } from "src/database/models/Pengajuan.model";
import PengajuanCriteriaModel from "src/database/models/PengajuanCriteria.model";
import { AuthTCBRoute, TCBRoute } from "src/types/Global";
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
        const { dMin, dPlus, id, nama, alamat, banjar } = jarak;
        return {
          id,
          alamat,
          nama,
          banjar,
          value: dMin / (dMin + dPlus),
        };
      })
      .sort((a, b) => b.value - a.value);
  };

  getRawData = async (filter: Partial<TPengajuan> = {}) => {
    const rawData: RawData[] = await PengajuanCriteriaModel.aggregate([
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
        $match: Object.keys(filter).reduce((acc, v) => {
          acc[v] = { $eq: filter[v as keyof typeof filter] };
          return acc;
        }, {} as Record<string, any>),
      },
      {
        $group: {
          _id: "$_id",
          nama: { $first: "$nama" },
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

  result: AuthTCBRoute<{}, { banjar?: string }> = async (req, res) => {
    const banjarId = req.query.banjar;
    const filterBanjar = banjarId
      ? { idBanjar: new mongoose.Types.ObjectId(banjarId) }
      : {};
    const rawData = await this.getRawData(filterBanjar);
    const normalisasi = this.normalisasi(rawData);
    const normalisasiTerbobot = this.normalisasiTerbobot(normalisasi);
    this.idealSolution(normalisasiTerbobot);
    const jarakSolusiIdeal = this.idealSolutionDistance(normalisasiTerbobot);
    const finalRanking = this.finalRankingList(jarakSolusiIdeal);

    return res.json({ data: finalRanking });
  };

  resultDetail: AuthTCBRoute<{}, { banjar: string }> = async (req, res) => {
    const banjarId = req.query.banjar;
    const filterBanjar = banjarId
      ? { idBanjar: new mongoose.Types.ObjectId(banjarId) }
      : {};
    const rawData = await this.getRawData(filterBanjar);
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
}

export default new CountController();
