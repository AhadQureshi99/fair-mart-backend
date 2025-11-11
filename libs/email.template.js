export const Verification_Email_Template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your 24/7 FairMart Account</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e0e0;
        }
        .header {
            background: linear-gradient(135deg, #ff6f00 0%, #ff8f00 100%);
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
            line-height: 1.6;
        }
        .verification-code {
            display: block;
            margin: 20px 0;
            font-size: 24px;
            color: #ff6f00;
            background: #fff3e0;
            border: 2px solid #ff6f00;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
            font-weight: bold;
            letter-spacing: 3px;
        }
        .footer {
            background-color: #fafafa;
            padding: 15px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        p {
            margin: 0 0 15px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #ff6f00;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin: 15px 0;
        }
        .button:hover {
            background-color: #e55f00;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Welcome to 24/7 FairMart</div>
        <div class="content">
            <p>Hello,</p>
            <p>Thank you for joining 24/7 FairMart! To complete your registration, please verify your email address using the code below:</p>
            <span class="verification-code">{verificationCode}</span>
            <p>This code is valid for the next 10 minutes. If you didn’t request this, please ignore this email or contact our support team at support@247fairmart.com.</p>
            <a href="https://247fairmart.com/verify" class="button">Verify Now</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} 24/7 FairMart. All rights reserved.</p>
            <p>24/7 FairMart | 123 Shopping Street, Commerce City | support@247fairmart.com</p>
        </div>
    </div>
</body>
</html>
`;

export const Forgot_Password_Email_Template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your 24/7 FairMart Password</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e0e0;
        }
        .header {
            background: linear-gradient(135deg, #ff6f00 0%, #ff8f00 100%);
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
            line-height: 1.6;
        }
        .reset-code {
            display: block;
            margin: 20px 0;
            font-size: 24px;
            color: #ff6f00;
            background: #fff3e0;
            border: 2px solid #ff6f00;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
            font-weight: bold;
            letter-spacing: 3px;
        }
        .footer {
            background-color: #fafafa;
            padding: 15px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        p {
            margin: 0 0 15px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #ff6f00;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin: 15px 0;
        }
        .button:hover {
            background-color: #e55f00;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Reset Your Password</div>
        <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your 24/7 FairMart account password. Please use the code below to reset your password:</p>
            <span class="reset-code">{resetToken}</span>
            <p>This code is valid for the next 1 hour. If you didn’t request a password reset, please ignore this email or contact our support team at support@247fairmart.com.</p>
            <a href="https://247fairmart.com/reset-password" class="button">Reset Password</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} 24/7 FairMart. All rights reserved.</p>
            <p>24/7 FairMart | 123 Shopping Street, Commerce City | support@247fairmart.com</p>
        </div>
    </div>
</body>
</html>
`;
