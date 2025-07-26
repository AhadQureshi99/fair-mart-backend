import { transporter } from "./email.config.middelware.js";
import { Verification_Email_Template, Forgot_Password_Email_Template } from "../libs/email.template.js";

export const sendemailverification = async (email, verificationcode) => {
    try {
        const response = await transporter.sendMail({
            from: `"24/7 FairMart" <${process.env.USER_SENDER_EMAIL}>`,
            to: email,
            subject: "Verify Your 24/7 FairMart Account",
            text: "Verify your email",
            html: Verification_Email_Template.replace('{verificationCode}', verificationcode),
        });
        console.log("Verification email sent successfully:", response);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw error;
    }
};

export const sendForgotPasswordEmail = async (email, resetToken) => {
    try {
        const response = await transporter.sendMail({
            from: `"24/7 FairMart" <${process.env.USER_SENDER_EMAIL}>`,
            to: email,
            subject: "Reset Your 24/7 FairMart Password",
            text: "Reset your password",
            html: Forgot_Password_Email_Template.replace('{resetToken}', resetToken),
        });
        console.log("Password reset email sent successfully:", response);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    }
};