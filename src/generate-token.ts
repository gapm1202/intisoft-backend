import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.JWT_SECRET || "secretkey";

const token = jwt.sign({ id: 1, rol: "administrador" }, secret, { expiresIn: '1h' });
console.log(token);
