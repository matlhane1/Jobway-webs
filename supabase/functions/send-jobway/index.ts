import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const ZEPTO_URL = "https://api.zeptomail.com/v1.1/email"
const APP_URL = "https://jobway.co.za"

function wrapHtml(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="margin:0; background:#f8fafc; font-family:Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e2e8f0;">
    <div style="background:#0F172A; padding:24px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:24px;">JobWay.co.za</h1>
      <p style="color:#94a3b8; margin:4px 0 0; font-size:12px;">Find Your Dream Job</p>
    </div>
    <div style="padding:32px 24px; color:#334155; line-height:1.7; font-size:15px;">
      <h2 style="color:#0F172A; margin-top:0;">${title}</h2>
      ${body}
      <hr style="margin:32px 0 16px; border:none; border-top:1px solid #e2e8f0;" />
      <p style="font-size:11px; color:#94a3b8;">This email was sent by JobWay.co.za<br>2nd Floor, Pretoria<br><a href="${APP_URL}/unsubscribe" style="color:#64748b;">Unsubscribe</a> | <a href="${APP_URL}/privacy" style="color:#64748b;">Privacy Policy</a></p>
    </div>
  </div></body></html>`
}
function otpBox(otp: string) {
  return `<div style="background:#f1f5f9; border:2px dashed #0F172A; padding:20px; text-align:center; margin:24px 0; border-radius:12px;">
    <span style="font-size:36px; font-weight:800; letter-spacing:10px; color:#0F172A;">${otp}</span>
    <p style="margin:8px 0 0; font-size:12px; color:#64748b;">Valid for 10 minutes</p>
  </div>`
}
const TEMPLATES: any = {
  otp_verify_email: (d:any) => ({ subject: `Your JobWay code is ${d.otp}`, html: wrapHtml("Verify Your Email", `<p>Hi ${d.name || 'there'},</p><p>Use this code to verify your email on JobWay:</p>${otpBox(d.otp)}<p>Expires in 10 minutes.</p>`) }),
  otp_password_reset: (d:any) => ({ subject: `Reset code: ${d.otp} - JobWay`, html: wrapHtml("Password Reset Code", `<p>Hi ${d.name},</p><p>We received a request to reset your password:</p>${otpBox(d.otp)}<p>If you didn't request this, secure your account.</p>`) }),
  otp_login: (d:any) => ({ subject: `Login code: ${d.otp} - JobWay`, html: wrapHtml("Your Login Code", `<p>Hi ${d.name},</p><p>Your one-time login code:</p>${otpBox(d.otp)}<p>Valid for 5 minutes. Do NOT share.</p>`) }),
  otp_phone_change: (d:any) => ({ subject: `Phone verification: ${d.otp}`, html: wrapHtml("Verify Phone Number", `<p>Hi ${d.name},</p><p>Your OTP to verify phone ${d.phone || ''}:</p>${otpBox(d.otp)}`) }),
  otp_employer_verify: (d:any) => ({ subject: `Verify your employer account: ${d.otp}`, html: wrapHtml("Employer Verification", `<p>Hi ${d.name},</p><p>Verify employer account for <b>${d.company}</b>:</p>${otpBox(d.otp)}`) }),
  candidate_welcome: (d:any) => ({ subject: `Welcome to JobWay, ${d.name}!`, html: wrapHtml("Welcome!", `<p>Hi ${d.name},</p><p>Your account is ready. Complete your profile and upload CV to get 3x more interviews.</p><p><a href="${APP_URL}/profile" style="background:#0F172A; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block;">Complete Profile</a></p>`) }),
  candidate_verify_link: (d:any) => ({ subject: "Verify your email - JobWay", html: wrapHtml("Verify Email", `<p>Hi ${d.name},</p><p>Click to verify:</p><p><a href="${d.link}" style="background:#0F172A; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px;">Verify Email</a></p>`) }),
  candidate_password_reset_link: (d:any) => ({ subject: "Reset your password - JobWay", html: wrapHtml("Reset Password", `<p>Hi ${d.name},</p><p>Click to reset:</p><p><a href="${d.link}" style="background:#0F172A; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px;">Reset Password</a></p><p>Expires in 1 hour.</p>`) }),
  candidate_application_submitted: (d:any) => ({ subject: `Application sent: ${d.jobTitle}`, html: wrapHtml("Application Received", `<p>Hi ${d.name},</p><p>Your application for <b>${d.jobTitle}</b> at <b>${d.company}</b> submitted.</p><p><a href="${APP_URL}/applications">Track Application</a></p>`) }),
  candidate_status_shortlisted: (d:any) => ({ subject: `Shortlisted for ${d.jobTitle}!`, html: wrapHtml("You Were Shortlisted! 🎉", `<p>Hi ${d.name},</p><p>Congrats! You were shortlisted for <b>${d.jobTitle}</b> at ${d.company}.</p>`) }),
  candidate_status_interview: (d:any) => ({ subject: `Interview: ${d.jobTitle} - ${d.date}`, html: wrapHtml("Interview Invitation", `<p>Hi ${d.name},</p><p>${d.company} wants to interview you for ${d.jobTitle}.</p><p><b>Date:</b> ${d.date}<br><b>Time:</b> ${d.time}<br><b>Location:</b> ${d.location}</p>`) }),
  candidate_status_rejected: (d:any) => ({ subject: `Update: ${d.jobTitle}`, html: wrapHtml("Application Update", `<p>Hi ${d.name},</p><p>Thanks for applying for ${d.jobTitle} at ${d.company}. Not selected this time.</p><p><a href="${APP_URL}/jobs">Browse Jobs</a></p>`) }),
  employer_welcome: (d:any) => ({ subject: "Welcome to JobWay Employer", html: wrapHtml("Welcome Employer!", `<p>Hi ${d.name},</p><p>Account for ${d.company} ready.</p><p><a href="${APP_URL}/employer/post-job" style="background:#0F172A; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block;">Post a Job</a></p>`) }),
  employer_new_application: (d:any) => ({ subject: `New applicant: ${d.candidateName} - ${d.jobTitle}`, html: wrapHtml("New Application", `<p>Hi ${d.name},</p><p>New applicant for <b>${d.jobTitle}</b></p><p>Candidate: ${d.candidateName}</p><p><a href="${APP_URL}/employer/applications/${d.applicationId}">View</a></p>`) }),
  payment_success: (d:any) => ({ subject: `Receipt Order #${d.orderId} - R${d.amount}`, html: wrapHtml("Payment Successful", `<p>Hi ${d.name},</p><p>Payment received: <b>R${d.amount}</b> for ${d.plan || d.jobTitle}</p><p>Order #${d.orderId}</p>`) }),
  security_password_changed: (d:any) => ({ subject: "Password changed - JobWay", html: wrapHtml("Security Alert", `<p>Hi ${d.name},</p><p>Password changed on ${d.date}. If not you, reset now.</p>`) }),
}

serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" }
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  try {
    const apiKey = Deno.env.get("ZEPTOMAIL_API_KEY")
    if (!apiKey) throw new Error("ZEPTOMAIL_API_KEY missing")
    const fromEmail = Deno.env.get("ZEPTOMAIL_FROM_EMAIL") || "no-reply@jobway.co.za"
    const fromName = Deno.env.get("ZEPTOMAIL_FROM_NAME") || "JobWay"
    const { type, to, data } = await req.json()
    if (!type || !to || !TEMPLATES[type]) return new Response(JSON.stringify({ error: `Invalid type: ${type}. Valid: ${Object.keys(TEMPLATES).join(", ")}` }), { status: 400, headers: cors })
    const { subject, html } = TEMPLATES[type](data || {})
    const r = await fetch(ZEPTO_URL, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": apiKey },
      body: JSON.stringify({ from: { address: fromEmail, name: fromName }, to: [{ email_address: { address: to, name: data?.name || "" } }], subject, htmlbody: html })
    })
    const resData = await r.json()
    if (!r.ok) throw new Error(JSON.stringify(resData))
    return new Response(JSON.stringify({ success: true, id: resData.request_id, type }), { headers: cors })
  } catch (err:any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors })
  }
})
