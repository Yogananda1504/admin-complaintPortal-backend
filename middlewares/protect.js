import { verifyToken } from "../utils/tokenUtils.js";
import appError from "../utils/appError.js";
import dotenv from "dotenv";
dotenv.config();

const protect = async (req, res, next) => {
	try {
		// Extract the token from the req
		const token = req.cookies.jwt;
		console.log("Token:", token);
		if (!token) {
			res.clearCookie('jwt')
			return res.status(401).json({
				success: false,
				logout:true,
				message: "Unauthorized access,Please Login",
			});
		}

		const decoded = verifyToken(token);
		console.log("Decoded:", decoded);
		if (!decoded) {
			res.clearCookie('jwt');
			return res.status(401).json({
				success: false,
				logout:true,
				message: "Uhh-Ohh ! Invalid Token or Token Expired",
			});
		}

		next();
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			logout:true,
			message: "Internal Server Error",
		});
	}
};

export default protect;
