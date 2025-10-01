import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.USER_AUTH_EMAIL,
        pass: process.env.USER_AUTH_PASS,
    },
    pool: true,
    maxConnections: 5,
    tls: {
        rejectUnauthorized: false // Helpful for testing in development
    },
    logger: true, // Enable logging for debugging
    debug: true // Show detailed SMTP logs
});