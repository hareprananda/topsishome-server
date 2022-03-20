import Database from "src/config/Database";
// import PengajuanSeeder from "./PengajuanSeeder";
import CriteriaPengajuanSeeder from "./CriteriaPengajuanSeeder";
// import CriteriaSeeder from "./CriteriaSeeder";

const RegisterSeeder = {
  // CriteriaSeeder,
  // PengajuanSeeder,
  CriteriaPengajuanSeeder,
};

Database(RegisterSeeder);
