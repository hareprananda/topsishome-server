import CriteriaModel from "src/database/models/Criteria.model";
import PengajuanModel from "src/database/models/Pengajuan.model";
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

type PromiseReturnType<T> = T extends () => Promise<infer U> ? U : T;

class CountController {
  private pembagi: Omit<TResult, "_id" | "nama"> = {
    kondisiRumah: 0,
    luasTanah: 0,
    menerimaBantuan: 0,
    penghasilan: 0,
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
  normalisasi = (rawData: TResult[]) => {
    const pembagiKeys = Object.keys(
      this.pembagi
    ) as (keyof typeof this.pembagi)[];
    for (const tickerData of rawData) {
      for (const key of pembagiKeys) {
        this.pembagi[key] += Math.pow(tickerData[key] as number, 2);
      }
    }

    for (const key of pembagiKeys) {
      this.pembagi[key] = Math.sqrt(this.pembagi[key]);
    }

    const normalisasi: TResult[] = rawData.map((tickerData) => {
      let temp = {} as TResult;
      for (const key of pembagiKeys) {
        temp[key] = tickerData[key] / this.pembagi[key];
      }
      return { ...temp, _id: tickerData._id, nama: tickerData.nama };
    });

    return normalisasi;
  };

  //2 matriks keputusan ternormalisasi dan terbobot
  normalisasiTerbobot = (
    normalisasi: TResult[],
    objectKriteria: PromiseReturnType<typeof this.getCriteriaObject>
  ) => {
    const keysWithNumberVal = Object.keys(
      this.pembagi
    ) as (keyof typeof this.pembagi)[];
    const normalisasiTerbobot: TResult[] = normalisasi.map(
      (tickerNormalisasi) => {
        let temp = {} as TResult;
        for (const key of keysWithNumberVal) {
          temp[key] = tickerNormalisasi[key] * objectKriteria[key].bobot;
        }
        return {
          ...temp,
          _id: tickerNormalisasi._id,
          nama: tickerNormalisasi.nama,
        };
      }
    );
    return normalisasiTerbobot;
  };

  //3 Mendapatkan solusi ideal positif dan negatif
  idealSolution = (
    normalisasiTerbobot: TResult[],
    objectKriteria: Record<
      string,
      { bobot: number; keterangan: "cost" | "benefit" }
    >
  ) => {
    const keysWithNumberVal = Object.keys(
      this.pembagi
    ) as (keyof typeof this.pembagi)[];
    const solusiIdeal = {
      positif: {},
      negatif: {},
    } as {
      positif: Omit<TResult, "_id" | "nama">;
      negatif: Omit<TResult, "_id" | "nama">;
    };

    for (const tickerNormalisasi of normalisasiTerbobot) {
      for (const key of keysWithNumberVal) {
        const solusiPositif = solusiIdeal.positif[key];
        const solusiNegatif = solusiIdeal.negatif[key];
        const keterangan = objectKriteria[key].keterangan;
        const currentSolution = tickerNormalisasi[key];

        if (solusiPositif === undefined) {
          solusiIdeal.positif[key] = currentSolution;
          solusiIdeal.negatif[key] = currentSolution;
        } else {
          if (keterangan === "benefit") {
            solusiIdeal.positif[key] =
              solusiPositif > currentSolution ? solusiPositif : currentSolution;
            solusiIdeal.negatif[key] =
              solusiNegatif < currentSolution ? solusiNegatif : currentSolution;
          } else if (keterangan === "cost") {
            solusiIdeal.positif[key] =
              solusiPositif < currentSolution ? solusiPositif : currentSolution;
            solusiIdeal.negatif[key] =
              solusiNegatif > currentSolution ? solusiNegatif : currentSolution;
          }
        }
      }
    }
    return solusiIdeal;
  };

  //4 Jarak solusi ideal positif dan negatif
  idealSolutionDistance = (
    normalisasiTerbobot: TResult[],
    solusiIdeal: {
      positif: Omit<TResult, "_id" | "nama">;
      negatif: Omit<TResult, "_id" | "nama">;
    }
  ) => {
    const jarakSolusiIdeal: Record<
      string,
      { dMin: number; dPlus: number; nama: string }
    > = {};

    for (const dataSingleNormalisasi of normalisasiTerbobot) {
      let tempDPlus: number = 0;
      let tempDMin: number = 0;
      const { _id, nama, ...numberData } = dataSingleNormalisasi;
      for (let keyOfNumberData of Object.keys(numberData)) {
        const kriteriaKey = keyOfNumberData as keyof typeof numberData;
        tempDPlus += Math.pow(
          solusiIdeal.positif[kriteriaKey] - dataSingleNormalisasi[kriteriaKey],
          2
        );
        tempDMin += Math.pow(
          dataSingleNormalisasi[kriteriaKey] - solusiIdeal.negatif[kriteriaKey],
          2
        );
      }
      jarakSolusiIdeal[_id] = {
        dPlus: Math.sqrt(tempDPlus),
        dMin: Math.sqrt(tempDMin),
        nama: dataSingleNormalisasi.nama,
      };
    }
    return jarakSolusiIdeal;
  };

  //5 get final ranking
  finalRankingList = (
    jarakSolusiIdeal: Record<
      string,
      { dMin: number; dPlus: number; nama: string }
    >
  ) => {
    const finalRanking: { ticker: string; nilai: number; nama: string }[] = [];
    for (const ticker of Object.keys(jarakSolusiIdeal)) {
      const { dPlus, dMin } = jarakSolusiIdeal[ticker];
      const temp = {
        ticker,
        nilai: dMin / (dMin + dPlus),
        nama: jarakSolusiIdeal[ticker].nama,
      };
      finalRanking.push(temp);
    }

    finalRanking.sort((a, b) => b.nilai - a.nilai);

    return finalRanking;
  };

  result: AuthTCBRoute = async (req, res) => {
    const rawData: TResult[] = await PengajuanModel.aggregate([
      {
        $project: {
          nama: "$$ROOT.nama",
          luasTanah: "$$ROOT.luasTanah",
          kondisiRumah: "$$ROOT.kondisiRumah",
          menerimaBantuan: "$$ROOT.menerimaBantuan",
          penghasilan: "$$ROOT.penghasilan",
        },
      },
    ]);

    const normalisasi = this.normalisasi(rawData);
    const objectKriteria = await this.getCriteriaObject();
    const normalisasiTerbobot = this.normalisasiTerbobot(
      normalisasi,
      objectKriteria
    );
    const solusiIdeal = this.idealSolution(normalisasiTerbobot, objectKriteria);
    const jarakSolusiIdeal = this.idealSolutionDistance(
      normalisasiTerbobot,
      solusiIdeal
    );
    const finalRanking = this.finalRankingList(jarakSolusiIdeal);

    return res.json({ finalRanking });
  };
}

export default new CountController();
