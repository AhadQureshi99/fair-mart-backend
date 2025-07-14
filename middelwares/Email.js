// import { transporter } from "./email.config.middelware.js"; // Fixed the typo in the filename if needed
// import { Verification_Email_Template } from "../libs/email.template.js";

// export const sendemailverification = async (email, verificationcode) => {
//     try {
//         const response = await transporter.sendMail({
//             from: `"Kuick_Tag" <${process.env.USER_SENDER_EMAIL}>`, // Sender address
//             to: email, // List of receivers
//             subject: "Verify Your Email to Use Kuick_Tag App", // Subject line
//             text: "Verify your email", // Plain text body
//             html: Verification_Email_Template.replace('{verificationCode}', verificationcode), // HTML body
//         });
        
//         console.log("Email sent successfully:", response);
//     } catch (error) {
//         console.error("Error sending email:", error);
//     }
// };
