import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "24.7FairMartWeb@gmail.com", // Gmail address
    pass: "hnrtkosiwknrxfrf", // Gmail App Password
  },
  logger: true,
  debug: true,
});
