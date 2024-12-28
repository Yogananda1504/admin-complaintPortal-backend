import { verifyToken } from "../utils/tokenUtils.js";
import Router from "express";
const router  =Router();

router.get("/",(req,res)=>{
    const cookie = req.cookies.jwt;
    if(!cookie) return res.status(401).json({error:"Unauthorized"});
    try{
        const decoded = verifyToken(cookie);
        if(!decoded) return res.status(401).json({message:"Failed"});
        res.json({message : "success"});
    }catch(err){
        res.status(500).json({error:"Internal Server Error"});
    }
})

export default router