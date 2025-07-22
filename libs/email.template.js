export const Verification_Email_Template = `
<!DOCTYPE html>
<html>
<head>
    <title>Fair Mart Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f8f8; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .otp { font-size: 24px; font-weight: bold; color: #007bff; text-align: center; }
        .footer { font-size: 12px; color: #777; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to Fair Mart!</h2>
        </div>
        <div class="content">
            <p>Please use the following OTP to complete your ${window.location.pathname.includes("resetpassword") ? "password reset" : "email verification"}:</p>
            <div class="otp">{verificationCode}</div>
            <p>This code is valid for 1 hour.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Thank you,<br>Fair Mart Team</p>
        </div>
    </div>
</body>
</html>
`;