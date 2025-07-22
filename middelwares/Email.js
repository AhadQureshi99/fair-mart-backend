import { transporter } from "./email.config.middelware.js";
import { Verification_Email_Template } from "../libs/email.template.js";

export const sendemailverification = async (email, verificationcode) => {
  try {
    const response = await transporter.sendMail({
      from: `"Fair Mart" <${process.env.USER_SENDER_EMAIL}>`,
      to: email,
      subject: "Verify Your Email to Use Fair Mart",
      text: `Your Fair Mart verification code is: ${verificationcode}. Enter this code in the app to verify your account.`,
      html: Verification_Email_Template.replace(
        "{verificationCode}",
        verificationcode
      ),
    });

    console.log("Email sent successfully to", email, ":", response);
    return response;
  } catch (error) {
    console.error("Error sending email to", email, ":", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};
