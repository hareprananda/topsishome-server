import UserModel, { TUser } from "src/database/models/User.model";
import bcrypt from "bcrypt";
import { AuthTCBRoute, TCBRoute } from "src/types/Global";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { response } from "express";

dotenv.config();

type TLoginBody = {
  id: string;
  password: string;
};

type TRegisterBody = {
  id: string;
  name: string;
  password: string;
  passwordConfirmation: string;
};
class AuthController {
  private bcryptSaltRound = 10;

  login: TCBRoute<TLoginBody> = async (req, res) => {
    const { id, password } = req.body;
    const validate = {
      id,
      password,
    };
    if (!Object.values(validate).every((value) => !!value)) {
      return res.status(422).json({ data: `Missing key properties` });
    }
    try {
      const user = await UserModel.findOne({ _id: id });
      if (!user || !bcrypt.compareSync(password, user.password)) throw "err";
      const userObject = user.toObject() as Partial<TUser>;
      if (userObject.level === "guest")
        throw {
          message:
            "Anda belum memiliki akses ke sistem ini, silahkan hubungi admin untuk memberi anda akses",
          status: 401,
        };
      delete userObject.password;
      const accessToken = jwt.sign(
        userObject,
        process.env.TOKEN_SECRET as string,
        {
          expiresIn: 60 * 60 * 24 * 30, //30 days
        }
      );
      const refreshToken = jwt.sign(
        { id: userObject._id },
        process.env.TOKEN_SECRET as string
      );
      return res.json({
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      });
    } catch (err: any) {
      return res
        .status(err.status || 400)
        .json({ data: err.message || "id or password does not match" });
    }
  };

  register: TCBRoute<TRegisterBody> = async (req, res) => {
    const { name, id, password, passwordConfirmation } = req.body;
    const validate = {
      name,
      id,
      password,
      passwordConfirmation,
    };
    if (!Object.values(validate).every((value) => !!value)) {
      return res.status(422).json({ data: `Missing key properties` });
    }
    if (password !== passwordConfirmation)
      return res.status(422).json({ data: "Password confirmation wrong" });

    await UserModel.create({
      _id: id,
      name,
      level: "guest",
      password: await bcrypt.hash(password, this.bcryptSaltRound),
    })
      .then(() => res.json({ data: "Register Success" }))
      .catch((err) => {
        res.status(400).json({ data: err.message.slice(7).replace(/:.*/, "") });
      });
  };

  me: AuthTCBRoute = (req, res) => {
    return res.json(req.body.auth);
  };
}

export default new AuthController();
