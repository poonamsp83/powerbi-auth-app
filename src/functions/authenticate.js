require('dotenv').config();
const sql = require('mssql');
const jwt = require('jsonwebtoken');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Required for Azure SQL
        trustServerCertificate: false
    }
};

module.exports = async function (context, req) {
    const email = req.body && req.body.email;

    if (!email) {
        context.res = {
            status: 400,
            body: "Email is required"
        };
        return;
    }

    try {
        // Connect to SQL Server
        await sql.connect(config);
        const result = await sql.query`SELECT Role FROM Users WHERE Email = ${email}`;

        if (result.recordset.length === 0) {
            context.res = {
                status: 401,
                body: { error: "Unauthorized" }
            };
            return;
        }

        const userRole = result.recordset[0].Role;

        // Generate JWT Token
        const token = jwt.sign({ email, role: userRole }, process.env.JWT_SECRET, { expiresIn: '1h' });

        context.res = {
            status: 200,
            body: { token }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: { error: "Internal Server Error", details: error.message }
        };
    } finally {
        sql.close();
    }
};
