import UserModel, { TUser } from "src/database/models/User.model";
import { AuthTCBRoute } from "src/types/Global";

class UserController {
  get: AuthTCBRoute = async (req, res) => {
    const myId = req.body.auth._id;
    const allUser = await UserModel.find(
      {
        _id: { $ne: myId },
      },
      {
        _id: 1,
        name: 1,
        level: 1,
      }
    );
    return res.json({ data: allUser });
  };

  update: AuthTCBRoute<{ level: TUser["level"] }, {}, { id: string }> = async (
    req,
    res
  ) => {
    const possibleLevel: TUser["level"][] = ["administrator", "guest", "user"];
    const { level } = req.body;
    const { id } = req.params;
    try {
      if (!level || !possibleLevel.includes(level))
        throw { message: "Level not match" };
      const updatedData = await UserModel.findOneAndUpdate(
        { _id: id },
        { level },
        {
          fields: {
            id: 1,
            level: 1,
          },
          new: true,
        }
      );
      if (!updatedData) throw "err";
      return res.json({ data: updatedData });
    } catch ({ message }) {
      return res.status(400).send({ data: message || "User not found" });
    }
  };

  resetPassword: AuthTCBRoute<{}, {}, { id: string }> = async (req, res) => {};
}

export default new UserController();
