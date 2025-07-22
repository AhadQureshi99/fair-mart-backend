export const Verification_Email_Template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Fair Mart Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; padding: 20px; background-color: #f8f8f8; border-radius: 8px;">
        <h1 style="color: #007bff;">Welcome to Fair Mart</h1>
        <p style="font-size: 16px;">Thank you for registering with Fair Mart! To complete your registration, please verify your email address using the OTP below:</p>
        <h2 style="color: #28a745; font-size: 24px; margin: 20px 0;">{verificationCode}</h2>
        <p style="font-size: 14px;">Enter this code in the Fair Mart app to verify your account. This OTP is valid for 10 minutes.</p>
        <p style="font-size: 14px; color: #666;">If you did not request this, please ignore this email or contact our support team at <a href="mailto:support@24sevenfairmart.com">support@24sevenfairmart.com</a>.</p>
        <p style="font-size: 14px; margin-top: 20px;">Happy Shopping!<br>The Fair Mart Team</p>
    </div>
</body>
</html>
`;
