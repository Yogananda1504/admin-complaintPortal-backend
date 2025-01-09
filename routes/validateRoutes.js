import { verifyToken } from "../utils/tokenUtils.js";
import Router from "express";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const token = req.cookies.jwt;
    console.log("Validation token :  ", token );
    if(!token){
      return res.status(401).json({
        status: "error",
        logout:true,
        statusCode: 401,
        message: "Token not found"
      });
    }
    const user =  verifyToken(token);
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "success",
      data: user
    });
  } catch (error) {
    console.log("Validation token error :  ", error );
    return res.status(401).json({
      status: "error",
      logout:true,
      statusCode: 401,
      message: "User is not authenticated"
    });
  }
})

export default router;