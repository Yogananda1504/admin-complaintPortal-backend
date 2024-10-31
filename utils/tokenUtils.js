import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const generateToken = (payload) => {
    const expiresIn = process.env.JWT_EXPIRES_IN;
    if (!expiresIn || typeof expiresIn !== 'string') {
        throw new Error('Invalid JWT_EXPIRES_IN value');
    }
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
}


export { generateToken, verifyToken };