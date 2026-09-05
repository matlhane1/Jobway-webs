import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "npm:resend@3.2.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))
const FROM = "JobWay <no-reply@jobway.co.za>"
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
      <p style="font-size:11px; color:#94a3b8; line-height:1.5;">
        This email was sent by JobWay.co.za<br>
        2nd Floor, Pretoria, South Africa<br>
        You received this because you have an account on JobWay.<br>
        <a href="${APP_URL}/unsubscribe" style="color:#64748b;">Unsubscribe</a> | <a href="${APP_URL}/privacy" style="color:#64748b;">Privacy Policy</a>
      </p>
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
  // ===== OTPs - CRITICAL =====
  otp_verify_email: (d:any) => ({
    subject: `Your JobWay code is ${d.otp}`,
    html: wrapHtml("Verify Your Email", `<p>Hi ${d.name || 'there'},</p><p>Use this code to verify your email on JobWay:</p>${otpBox(d.otp)}<p>Expires in 10 minutes. If you didn't request this, ignore.</p>`)
  }),
  otp_password_reset: (d:any) => ({
    subject: `Reset code: ${d.otp} - JobWay`,
    html: wrapHtml("Password Reset Code", `<p>Hi ${d.name},</p><p>We received a request to reset your password. Use this code:</p>${otpBox(d.otp)}<p>If you didn't request this, secure your account immediately.</p>`)
  }),
  otp_login: (d:any) => ({
    subject: `Login code: ${d.otp} - JobWay`,
    html: wrapHtml("Your Login Code", `<p>Hi ${d.name},</p><p>Your one-time login code:</p>${otpBox(d.otp)}<p>Valid for 5 minutes. Do NOT share this code.</p>`)
  }),
  otp_phone_change: (d:any) => ({
    subject: `Phone verification: ${d.otp}`,
    html: wrapHtml("Verify Phone Number", `<p>Hi ${d.name},</p><p>Your OTP to verify new phone ${d.phone || ''}:</p>${otpBox(d.otp)}`)
  }),
  otp_employer_verify: (d:any) => ({
    subject: `Verify your employer account: ${d.otp}`,
    html: wrapHtml("Employer Verification", `<p>Hi ${d.name},</p><p>Verify your employer account for <b>${d.company}</b>:</p>${otpBox(d.otp)}<p>This confirms you own ${d.email}</p>`)
  }),

  // ===== CANDIDATE =====
  candidate_welcome: (d:any) => ({ subject: `Welcome to JobWay, ${d.name}!`, html: wrapHtml("Welcome!", `<p>Hi ${d.name},</p><p>Your account is ready. Complete your profile and upload CV to get 3x more interviews.</p><p><a href="${APP_URL}/profile" style="background:#0F172A; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block;">Complete Profile</a></p>`) }),
  candidate_verify_link: (d:any) => ({ subject: "Verify your email - JobWay", html: wrapHtml("Verify Email", `<p>Hi ${d.name},</p><p>Click to verify:</p><p><a href="${d.link}" style="background:#0F172A; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px;">Verify Email</a></p>`) }),
  candidate_password_reset_link: (d:any) => ({ subject: "Reset your password - JobWay", html: wrapHtml("Reset Password", `<p>Hi ${d.name},</p><p>Click to reset:</p><p><a href="${d.link}" style="background:#0F172A; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px;">Reset Password</a></p><p>Expires in 1 hour.</p>`) }),
  candidate_profile_incomplete: (d:any) => ({ subject: "Complete profile - Get 3x more jobs", html: wrapHtml("Almost There!", `<p>Hi ${d.name},</p><p>Your profile is ${d.percent}% complete. Add experience & CV.</p><p><a href="${APP_URL}/profile">Complete Now</a></p>`) }),
  candidate_cv_uploaded: (d:any) => ({ subject: "CV uploaded - JobWay", html: wrapHtml("CV Uploaded", `<p>Hi ${d.name},</p><p>Your CV <b>${d.fileName}</b> uploaded successfully and visible to employers.</p>`) }),
  candidate_application_submitted: (d:any) => ({ subject: `Application sent: ${d.jobTitle}`, html: wrapHtml("Application Received", `<p>Hi ${d.name},</p><p>Your application for <b>${d.jobTitle}</b> at <b>${d.company}</b> submitted.</p><p><a href="${APP_URL}/applications">Track Application</a></p>`) }),
  candidate_status_received: (d:any) => ({ subject: `Received: ${d.jobTitle}`, html: wrapHtml("Application Received by Employer", `<p>Hi ${d.name},</p><p>${d.company} received your application for ${d.jobTitle}.</p>`) }),
  candidate_status_shortlisted: (d:any) => ({ subject: `Shortlisted for ${d.jobTitle}!`, html: wrapHtml("You Were Shortlisted! 🎉", `<p>Hi ${d.name},</p><p>Congrats! You were shortlisted for <b>${d.jobTitle}</b> at ${d.company}.</p>`) }),
  candidate_status_interview: (d:any) => ({ subject: `Interview: ${d.jobTitle} - ${d.date}`, html: wrapHtml("Interview Invitation", `<p>Hi ${d.name},</p><p>${d.company} wants to interview you for ${d.jobTitle}.</p><p><b>Date:</b> ${d.date}<br><b>Time:</b> ${d.time}<br><b>Location:</b> ${d.location}</p>`) }),
  candidate_status_rejected: (d:any) => ({ subject: `Update: ${d.jobTitle}`, html: wrapHtml("Application Update", `<p>Hi ${d.name},</p><p>Thanks for applying for ${d.jobTitle} at ${d.company}. Not selected this time. We found more matching jobs.</p><p><a href="${APP_URL}/jobs">Browse Jobs</a></p>`) }),
  candidate_status_hired: (d:any) => ({ subject: `Hired! ${d.jobTitle} 🎉`, html: wrapHtml("You Got Hired!", `<p>Hi ${d.name},</p><p>Congrats! You were hired for <b>${d.jobTitle}</b> at ${d.company}!</p>`) }),
  candidate_interview_scheduled: (d:any) => ({ subject: `Interview Scheduled: ${d.jobTitle}`, html: wrapHtml("Interview Scheduled", `<p>Hi ${d.name},</p><p>Interview for ${d.jobTitle} at ${d.company}</p><p><b>Date:</b> ${d.date}<br><b>Time:</b> ${d.time}<br><b>Link/Location:</b> ${d.location}</p>`) }),
  candidate_interview_reminder: (d:any) => ({ subject: `Reminder: Interview tomorrow ${d.jobTitle}`, html: wrapHtml("Interview Reminder", `<p>Hi ${d.name},</p><p>Reminder: Interview tomorrow for ${d.jobTitle} at ${d.time}</p><p>${d.location}</p>`) }),
  candidate_job_alert: (d:any) => ({ subject: `${d.count} new jobs for you`, html: wrapHtml("New Jobs Matching You", `<p>Hi ${d.name},</p><p>${d.count} new jobs for <b>${d.preferences}</b> in ${d.location}</p><p><a href="${APP_URL}/jobs">View Jobs</a></p>`) }),

  // ===== EMPLOYER =====
  employer_welcome: (d:any) => ({ subject: "Welcome to JobWay Employer", html: wrapHtml("Welcome Employer!", `<p>Hi ${d.name},</p><p>Account for ${d.company} ready. Post first job.</p><p><a href="${APP_URL}/employer/post-job" style="background:#0F172A; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block;">Post a Job</a></p>`) }),
  employer_job_posted: (d:any) => ({ subject: `Live: ${d.jobTitle}`, html: wrapHtml("Job Is Live", `<p>Hi ${d.name},</p><p>Your job <b>${d.jobTitle}</b> is live. Expires ${d.expiry}. Duration ${d.duration}</p><p><a href="${APP_URL}/jobs/${d.jobId}">View Job</a></p>`) }),
  employer_new_application: (d:any) => ({ subject: `New applicant: ${d.candidateName} - ${d.jobTitle}`, html: wrapHtml("New Application", `<p>Hi ${d.name},</p><p>New applicant for <b>${d.jobTitle}</b></p><p>Candidate: ${d.candidateName}</p><p><a href="${APP_URL}/employer/applications/${d.applicationId}">View</a></p>`) }),
  employer_daily_digest: (d:any) => ({ subject: `${d.count} new applications today`, html: wrapHtml("Daily Digest", `<p>Hi ${d.name},</p><p>You have ${d.count} new applications for ${d.jobsList}</p><p><a href="${APP_URL}/employer/applications">View All</a></p>`) }),
  employer_job_expiring: (d:any) => ({ subject: `Expires in ${d.days} days: ${d.jobTitle}`, html: wrapHtml("Job Expiring Soon", `<p>Hi ${d.name},</p><p>Your job <b>${d.jobTitle}</b> expires in ${d.days} days (${d.expiry}).</p><p><a href="${APP_URL}/employer/renew/${d.jobId}">Renew</a></p>`) }),
  employer_job_expired: (d:any) => ({ subject: `Expired: ${d.jobTitle}`, html: wrapHtml("Job Expired", `<p>Hi ${d.name},</p><p>Your job ${d.jobTitle} expired on ${d.expiry}.</p><p><a href="${APP_URL}/employer/repost/${d.jobId}">Repost in 1 Click</a></p>`) }),

  // ===== PAYMENT =====
  payment_success: (d:any) => ({ subject: `Receipt Order #${d.orderId} - R${d.amount}`, html: wrapHtml("Payment Successful", `<p>Hi ${d.name},</p><p>Payment received: <b>R${d.amount}</b> for ${d.plan || d.jobTitle}</p><p>Order #${d.orderId}</p>`) }),
  payment_failed: (d:any) => ({ subject: "Payment failed - Action required", html: wrapHtml("Payment Failed", `<p>Hi ${d.name},</p><p>Payment of R${d.amount} for ${d.plan || d.jobTitle} failed.</p><p><a href="${APP_URL}/employer/billing">Retry</a></p>`) }),
  credits_purchased: (d:any) => ({ subject: `${d.credits} Credits Added`, html: wrapHtml("Credits Purchased", `<p>Hi ${d.name},</p><p>${d.credits} credits added. Balance: ${d.balance}</p>`) }),
  subscription_renewed: (d:any) => ({ subject: "Subscription renewed - JobWay", html: wrapHtml("Subscription Renewed", `<p>Hi ${d.name},</p><p>Your ${d.plan} subscription renewed. Next billing ${d.nextDate}. Amount R${d.amount}</p>`) }),

  // ===== SECURITY =====
  security_password_changed: (d:any) => ({ subject: "Password changed - JobWay", html: wrapHtml("Security Alert", `<p>Hi ${d.name},</p><p>Password changed on ${d.date}. If not you, reset now.</p>`) }),
  security_email_changed: (d:any) => ({ subject: "Email changed - JobWay", html: wrapHtml("Email Changed", `<p>Hi ${d.name},</p><p>Your email changed from ${d.oldEmail} to ${d.newEmail} on ${d.date}.</p>`) }),
  security_new_login: (d:any) => ({ subject: "New login detected - JobWay", html: wrapHtml("New Login", `<p>Hi ${d.name},</p><p>New login:</p><p>Device: ${d.device}<br>Location: ${d.location}<br>Time: ${d.date}</p>`) }),
  security_account_deleted: (d:any) => ({ subject: "Account deleted - JobWay", html: wrapHtml("Account Deleted", `<p>Hi ${d.name},</p><p>Your JobWay account was deleted on ${d.date}. Data will be removed in 30 days.</p>`) }),
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } })
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })
  try {
    const { type, to, data } = await req.json()
    if (!type || !to || !TEMPLATES[type]) {
      return new Response(JSON.stringify({ error: `Invalid type: ${type}. Valid: ${Object.keys(TEMPLATES).join(", ")}` }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } })
    }
    const { subject, html } = TEMPLATES[type](data || {})
    const { data: sent, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) throw error
    return new Response(JSON.stringify({ success: true, id: sent.id, type }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } })
  }
})
