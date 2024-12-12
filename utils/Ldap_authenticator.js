// LDAP_AUTHENTICATOR.JS
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

        // Handle client errors to prevent crashes
        client.on('error', (err) => {
            console.error('LDAP Client Error:', err.message);
            client.unbind();
        });

        const userDN = `cn=${username},${this.baseDN}`;

        return new Promise((resolve, reject) => {
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
    }
}

export default LdapAuthenticator;