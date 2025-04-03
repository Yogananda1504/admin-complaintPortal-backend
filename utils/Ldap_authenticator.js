// LDAP_AUTHENTICATOR.JS
import ldap from "ldapjs";
import dotenv from "dotenv";
dotenv.config();

class LdapAuthenticator {
	constructor(baseDN) {
		this.baseDN = baseDN;
	}

	async authenticate(username, password) {
		const client = ldap.createClient({
			url: process.env.LDAP_URL || "ldap://localhost:389",
			tlsOptions: { rejectUnauthorized: false }, // Only use this if your LDAP uses a self-signed cert in dev
		});

		// Handle client errors to prevent crashes
		client.on("error", (err) => {
			console.error("LDAP Client Error:", err.message);
			client.unbind();
		});

		const userDN = `cn=${username},${this.baseDN}`;
		const status = await new Promise((resolve, reject) => {
			client.bind(userDN, password, (err) => {
				if (err) {
					console.error("Bind error:", err.message);
					client.unbind();
					return resolve(false);
				}

				console.log("Authentication successful");
				client.unbind();
				return resolve(true);
			});
		});

		let role = null;
		const userMap = [
			{ un: process.env.ADMIN_USERNAME, rl: process.env.ADMIN_ROLE },
			{
				un: process.env.ELECTRICADMIN_USERNAME,
				rl: process.env.ELECTRICADMIN_ROLE,
			},
			{
				un: process.env.INTERNETADMIN_USERNAME,
				rl: process.env.INTERNETADMIN_ROLE,
			},
			{
				un: process.env.MEDICALADMIN_USERNAME,
				rl: process.env.MEDICALADMIN_ROLE,
			},
			{ un: process.env.COW_USERNAME, rl: process.env.COW_ROLE },
			{ un: process.env.H1_USERNAME, rl: process.env.H1_ROLE },
			{ un: process.env.H2_USERNAME, rl: process.env.H2_ROLE },
			{ un: process.env.H3_USERNAME, rl: process.env.H3_ROLE },
			{ un: process.env.H4_USERNAME, rl: process.env.H4_ROLE },
			{ un: process.env.H5_USERNAME, rl: process.env.H5_ROLE },
			{ un: process.env.H6_USERNAME, rl: process.env.H6_ROLE },
			{ un: process.env.H7_USERNAME, rl: process.env.H7_ROLE },
			{ un: process.env.H8_USERNAME, rl: process.env.H8_ROLE },
			{ un: process.env.H9_USERNAME, rl: process.env.H9_ROLE },
			{ un: process.env.H10_USERNAME, rl: process.env.H10_ROLE },
			{ un: process.env.H11_USERNAME, rl: process.env.H11_ROLE },
			{ un: process.env.H12_USERNAME, rl: process.env.H12_ROLE },
		];

		for (const u of userMap) {
			if (username === u.un) {
				role = u.rl;
				break;
			}
		}

		return { status, role };
	}
}

export default LdapAuthenticator;
