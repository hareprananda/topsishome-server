import { TCBRoute } from "src/types/Global";

class CountController {
  testController: TCBRoute = (req, res) => {
    return res.json("ini pengetesan");
  };
}

export default new CountController();
