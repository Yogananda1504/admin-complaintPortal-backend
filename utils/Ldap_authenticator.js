import ldap from 'ldapjs';
import dotenv from 'dotenv';
dotenv.config();

class LdapAuthenticator {
    constructor(baseDN) {
        this.baseDN = baseDN;
    }

    async authenticate(username, password) {
        const client = ldap.createClient({
            url: process.env.LDAP_URL || "ldap://localhost:389",
            tlsOptions: { rejectUnauthorized: false } // Only use this if your LDAP uses a self-signed cert in dev
        });

        // Construct user DN dynamically
        const userDN = `cn=${username},${this.baseDN}`;

        return new Promise((resolve, reject) => {
            client.bind(userDN, password , (err) => {
                if (err) {
                    console.error("Bind error:", err.message);
                    client.unbind(); // Always unbind to clean up
                    return resolve(false); // Authentication failed
                }

                console.log("Authentication successful");
                client.unbind(); // Unbind after authentication
                return resolve(true); // Authentication successful
            });
        });
    }
}

export default LdapAuthenticator;