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

		let authResult;
		if (username === "test" && password === "test@143") {
			// Demo user: bypass LDAP authentication
			authResult = { status: true, role: "admin" };
		} else {
			authResult = await authenticator.authenticate(username, password);
		}
		const { status, role } = authResult;

		if (!status) {
			return res.status(401).json({
				success: false,
				message: "Invalid Username or Password",
			});
		} else {
			// Create the JWT token for the user
			const token = generateToken({ username });
			const role_token = generateToken({ role });

			// Set the token as a secure, HTTP-only cookie
			res.cookie("jwt", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
			});

			res.cookie("role", role_token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
			});

			// Send response
			res.status(200).json({
				success: true,
				role: role,
				message: "User authenticated successfully",
			});
		}
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export default authController;
