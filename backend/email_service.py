import os
import smtplib
from email.mime.text import MIMEText


def send_otp_email(to_email: str, otp: str):
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_email:
        raise Exception("SMTP_EMAIL not configured")

    if not smtp_password:
        raise Exception("SMTP_PASSWORD not configured")

    msg = MIMEText(
        f"""
Hello,

Your DracaryX verification code is:

{otp}

This code will expire in 5 minutes.

If you did not request this login, please ignore this email.

Regards,
DracaryX Security Team
"""
    )

    msg["Subject"] = "DracaryX Verification Code"
    msg["From"] = smtp_email
    msg["To"] = to_email

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()

        server.login(
            smtp_email,
            smtp_password
        )

        server.send_message(msg)

        server.quit()

        print(f"OTP email sent to {to_email}")

    except Exception as e:
        print(f"Failed to send OTP email: {e}")
        raise