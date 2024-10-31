// Description: This file contains the logic to authenticate a user using LDAP and generate a JWT token for the user.
import { generateToken } from "../utils/tokenUtils.js";
import dotenv from "dotenv";
import Ldap_authenticator from "../utils/Ldap_authenticator.js";

dotenv.config();

const authenticator = new Ldap_authenticator(
	process.env.LDAP_BASE_DN || "dc=dev,dc=com"
);

const authController = async (req, res, next) => {
	try {
		console.log("Request body:", req.body);
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({
				success: false,
				message: "Username and password are required",
			});
		}

		// Authenticate the user using LDAP
		const status = await authenticator.authenticate(username, password);

		if (!status) {
			return res.status(401).json({
				success: false,
				message: "Invalid Username or Password",
			});
		} else {
			// Create the JWT token for the user
			const token = generateToken({ username });

			// Set the token as a secure, HTTP-only cookie
			res.cookie("jwt", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
			});

			// Send response
			res.status(200).json({
				success: true,
				message: "User authenticated successfully",
			});
		}
	} catch (err) {
		console.log(err);
		return next(new appError("Error in authenticating user", 500));
	}
};

export default authController;