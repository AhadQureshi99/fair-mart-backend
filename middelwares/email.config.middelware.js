import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_AUTH_EMAIL,
    pass: process.env.USER_AUTH_PASS, // must be App Password, not Gmail password
  },
  logger: true,
  debug: true,
});
