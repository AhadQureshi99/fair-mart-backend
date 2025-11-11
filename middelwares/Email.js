import { transporter } from "./email.config.middelware.js";

const Verification_Email_Template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Your 24/7 FairMart Account</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #007bff;">Welcome to 24/7 FairMart!</h2>
    <p>Thank you for registering with us. Please use the following One-Time Password (OTP) to verify your email address:</p>
    <h3 style="background: #f8f9fa; padding: 10px; text-align: center; border-radius: 5px;">{verificationCode}</h3>
    <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br>The 24/7 FairMart Team</p>
</body>
</html>
`;

const Forgot_Password_Email_Template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Your 24/7 FairMart Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #007bff;">Password Reset Request</h2>
    <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to reset your password:</p>
    <h3 style="background: #f8f9fa; padding: 10px; text-align: center; border-radius: 5px;">{verificationCode}</h3>
    <p>This OTP is valid for 10 minutes. If you didn't request a password reset, please ignore this email.</p>
    <p>Best regards,<br>The 24/7 FairMart Team</p>
</body>
</html>
`;

export const sendemailverification = async (email, verificationcode) => {
    try {
        // Log the OTP and template for debugging
        console.log("Sending verification email to:", email);
        console.log("Verification OTP:", verificationcode);
        console.log("Verification Template:", Verification_Email_Template.replace('{verificationCode}', verificationcode));

        const response = await transporter.sendMail({
            from: `"24/7 FairMart" <${process.env.USER_SENDER_EMAIL}>`,
            to: email,
            subject: "Verify Your 24/7 FairMart Account",
            text: `Verify your email with OTP: ${verificationcode}`,
            html: Verification_Email_Template.replace('{verificationCode}', verificationcode),
        });
        console.log("Verification email sent successfully:", response);
        return response;
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error(`Failed to send verification email: ${error.message}`);
    }
};

export const sendForgotPasswordEmail = async (email, verificationcode) => {
    try {
        // Log the OTP and template for debugging
        console.log("Sending password reset email to:", email);
        console.log("Password Reset OTP:", verificationcode);
        console.log("Password Reset Template:", Forgot_Password_Email_Template.replace('{verificationCode}', verificationcode));

        const response = await transporter.sendMail({
            from: `"24/7 FairMart" <${process.env.USER_SENDER_EMAIL}>`,
            to: email,
            subject: "Reset Your 24/7 FairMart Password",
            text: `Reset your password with OTP: ${verificationcode}`,
            html: Forgot_Password_Email_Template.replace('{verificationCode}', verificationcode),
        });
        console.log("Password reset OTP email sent successfully:", response);
        return response;
    } catch (error) {
        console.error("Error sending password reset OTP email:", error);
        throw new Error(`Failed to send password reset OTP email: ${error.message}`);
    }
};