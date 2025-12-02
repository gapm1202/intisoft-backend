const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || '1234';
const payload = { id: 1, rol: 'administrador' };
const token = jwt.sign(payload, secret, { expiresIn: '7d' });
console.log(token);
