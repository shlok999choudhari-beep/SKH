/**
 * PlaceIQ Resend Email Service
 * Production-ready email delivery for Login Security OTPs and Device Alerts.
 */

interface SendOtpEmailParams {
  email: string
  otp: string
  device?: string
  location?: string
  expiryMinutes?: number
}

interface SendLoginAlertParams {
  email: string
  device: string
  location: string
  loginTime: string
}

/**
 * Sends a 6-digit Login Security Verification OTP via Resend API
 */
export async function sendLoginOtpEmail({
  email,
  otp,
  device = 'Chrome on Windows',
  location = 'Pune, Maharashtra',
  expiryMinutes = 5
}: SendOtpEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  if (!apiKey) {
    console.error('[Resend Email] Missing RESEND_API_KEY environment variable.')
    return { success: false, error: 'Email service configuration missing.' }
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PlaceIQ Security Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0714; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0714; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; background: #130e24; border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%); border-bottom: 1px solid rgba(139, 92, 246, 0.2); text-align: center;">
              <div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Place<span style="color: #a78bfa;">IQ</span>
              </div>
              <div style="font-size: 12px; color: #c4b5fd; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                🛡 Intelligent Login Shield
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0;">
                Security Verification Code
              </h2>
              <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0;">
                We detected a sign-in attempt to your PlaceIQ account from an unverified or new device. Use the verification code below to complete authentication:
              </p>

              <!-- OTP Code Display -->
              <div style="background: rgba(139, 92, 246, 0.12); border: 2px dashed #8b5cf6; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #ffffff; display: inline-block;">
                  ${otp}
                </span>
                <div style="font-size: 12px; color: #c4b5fd; margin-top: 8px; font-weight: 500;">
                  ⏱ Expires in <strong>${expiryMinutes} minutes</strong>
                </div>
              </div>

              <!-- Login Metadata -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px 18px; margin: 0 0 24px 0;">
                <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px; color: #cbd5e1;">
                  <tr>
                    <td style="color: #64748b; width: 35%;">Device:</td>
                    <td style="font-weight: 600; color: #f1f5f9;">${device}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">Approx. Location:</td>
                    <td style="font-weight: 600; color: #f1f5f9;">${location}</td>
                  </tr>
                </table>
              </div>

              <!-- Security Notice -->
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
                <strong>Didn't try to sign in?</strong> If this was not you, someone may be attempting to access your account. Reset your password immediately and review your Security Activity.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; font-size: 11px; color: #475569;">
              © ${new Date().getFullYear()} PlaceIQ Security Services. All rights reserved. • Automated security message.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `PlaceIQ Security <${fromEmail}>`,
        to: [email],
        subject: `🔐 PlaceIQ Verification Code: ${otp}`,
        html: htmlContent
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Resend Email Error]', data)
      return { success: false, error: data?.message || 'Failed to deliver email through Resend.' }
    }

    return { success: true, messageId: data.id }
  } catch (err: any) {
    console.error('[Resend Email Network Error]', err?.message || err)
    return { success: false, error: 'Network error connecting to email provider.' }
  }
}

/**
 * Sends a security notification email upon successful new login
 */
export async function sendNewLoginAlertEmail({
  email,
  device,
  location,
  loginTime
}: SendLoginAlertParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  if (!apiKey) {
    return { success: false, error: 'Email service configuration missing.' }
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Login Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0714; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0714; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; background: #130e24; border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 24px 32px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%); border-bottom: 1px solid rgba(16, 185, 129, 0.2); text-align: center;">
              <div style="font-size: 22px; font-weight: 800; color: #ffffff;">Place<span style="color: #34d399;">IQ</span></div>
              <div style="font-size: 11px; color: #6ee7b7; margin-top: 4px; font-weight: 600; text-transform: uppercase;">🛡 New Login Verified</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 32px;">
              <h3 style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0;">New PlaceIQ Sign-in Detected</h3>
              <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px 0;">
                Your account was successfully accessed from a new device or location:
              </p>
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px 18px; margin: 0 0 20px 0;">
                <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px; color: #cbd5e1;">
                  <tr><td style="color: #64748b; width: 35%;">Device:</td><td style="font-weight: 600; color: #f1f5f9;">${device}</td></tr>
                  <tr><td style="color: #64748b;">Location:</td><td style="font-weight: 600; color: #f1f5f9;">${location}</td></tr>
                  <tr><td style="color: #64748b;">Time:</td><td style="font-weight: 600; color: #f1f5f9;">${loginTime}</td></tr>
                </table>
              </div>
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
                If this was you, no action is needed. If you did not perform this login, open <strong>Security Activity</strong> from your profile and click <strong>Secure Account</strong> immediately.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `PlaceIQ Security <${fromEmail}>`,
        to: [email],
        subject: `🔔 New Sign-in to PlaceIQ from ${device}`,
        html: htmlContent
      })
    })

    const data = await response.json()
    return { success: response.ok, messageId: data?.id }
  } catch (err: any) {
    console.error('[Resend Alert Email Error]', err?.message || err)
    return { success: false, error: 'Alert email delivery failed.' }
  }
}
