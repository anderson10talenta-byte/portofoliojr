import { router } from "../server.js";

export default function handler(req, res) {
  return router(req, res);
}
