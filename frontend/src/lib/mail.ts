import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer"

type ResetOtpMailArgs = {
  to: string
  otp: string
}

const smtpHost = process.env.SMTP_HOST
const smtpPort = Number(process.env.SMTP_PORT ?? "0")
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpFrom = process.env.SMTP_FROM
const nextAuthUrl = process.env.NEXTAUTH_URL

let transporter: Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error("Missing SMTP configuration. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.")
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    requireTLS: smtpPort !== 465,
  })

  return transporter
}

export async function sendMail(options: SendMailOptions) {
  const tx = getTransporter()
  return tx.sendMail(options)
}

function buildOtpEmailHtml(otp: string) {
  const signInUrl = nextAuthUrl ? `${nextAuthUrl.replace(/\/$/, "")}/auth/signin` : ""
  return `
    <div style="margin:0;background:#f4f6f8;padding:24px 12px;font-family:Arial,sans-serif;color:#0f172a;">
      <table role="presentation" style="max-width:560px;width:100%;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;padding:28px;">
        <tr>
          <td style="padding-bottom:8px;font-size:22px;font-weight:700;color:#0f172a;">Contractual</td>
        </tr>
        <tr>
          <td style="padding-bottom:8px;font-size:20px;font-weight:700;">Password Reset OTP</td>
        </tr>
        <tr>
          <td style="padding-bottom:20px;font-size:14px;line-height:1.5;color:#475569;">
            Use the verification code below to reset your password.
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:20px;">
            <div style="display:inline-block;font-size:34px;letter-spacing:10px;font-weight:800;background:#f1f5f9;border:1px dashed #94a3b8;border-radius:12px;padding:14px 24px;color:#0f172a;">${otp}</div>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:8px;font-size:14px;line-height:1.5;color:#334155;">
            This code expires in <strong>10 minutes</strong>.
          </td>
        </tr>
        ${
          signInUrl
            ? `<tr><td style="padding-bottom:8px;"><a href="${signInUrl}" style="font-size:13px;color:#0f766e;text-decoration:none;">Go to Contractual sign in</a></td></tr>`
            : ""
        }
        <tr>
          <td style="padding-top:12px;font-size:12px;line-height:1.6;color:#64748b;border-top:1px solid #e2e8f0;">
            If you did not request this, you can safely ignore this email.
          </td>
        </tr>
      </table>
    </div>
  `
}

export async function sendPasswordResetOtpMail({ to, otp }: ResetOtpMailArgs) {
  const fromAddress = smtpFrom || smtpUser
  if (!fromAddress) {
    throw new Error("Missing SMTP_FROM or SMTP_USER for sender address.")
  }

  return sendMail({
    from: fromAddress,
    to,
    subject: "Contractual Password Reset OTP",
    html: buildOtpEmailHtml(otp),
    text: `Your Contractual password reset code is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
  })
}
