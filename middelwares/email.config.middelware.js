import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "codesvistaaitzaz@gmail.com",   // Gmail address
    pass: "yvmuiqssgzycyppe",            // Gmail App Password
  },
  logger: true,
  debug: true,
});