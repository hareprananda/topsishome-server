import { AuthTCBRoute } from "src/types/Global";

const AdminMiddleware =
  (cb: AuthTCBRoute<any, any, any>): AuthTCBRoute =>
  (req, res, next) => {
    if (req.body.auth.level !== "administrator")
      return res.status(401).json({ data: "Forbidden admin only" });
    return cb(req, res, next);
  };

export default AdminMiddleware;
