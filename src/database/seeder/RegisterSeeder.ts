import Database from "src/config/Database";
// import PengajuanSeeder from "./PengajuanSeeder";
import CriteriaPengajuanSeeder from "./CriteriaPengajuanSeeder";

const RegisterSeeder = {
  // PengajuanSeeder,
  CriteriaPengajuanSeeder,
};

Database(RegisterSeeder);
