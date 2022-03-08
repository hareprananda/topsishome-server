import UserModel from "../models/User.model";

const UserSeeder = async () => {
  await UserModel.create({
    level: "admin",
    name: "Wayan kaleran",
    nik: "919191919191",
    password: "this is password",
  });
};

export default UserSeeder;
