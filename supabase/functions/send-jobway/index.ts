import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const ZEPTO_URL = "https://api.zeptomail.com/v1.1/email"
const FROM = "JobWay <no-reply@jobway.co.za>"
const APP_URL = "https://jobway.co.za"

// KEEP YOUR wrapHtml, otpBox, TEMPLATES EXACTLY SAME AS YOU HAVE
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
      <p style="font-size:11px; color:#94a3b8;">This email was sent by JobWay.co.za<br><a href="${APP_URL}/unsubscribe">Unsubscribe</a></p>
    </div>
  </div></body></html>`
}
function otpBox(otp: string) {
  return `<div style="background:#f1f5f9; border:2px dashed #0F172A; padding:20px; text-align:center; margin:24px 0; border-radius:12px;">
    <span style="font-size:36px; font-weight:800; letter-spacing:10px; color:#0F172A;">${otp}</span>
    <p style="margin:8px 0 0; font-size:12px; color:#64748b;">Valid for 10 minutes</p>
  </div>`
}
// PASTE YOUR WHOLE TEMPLATES OBJECT HERE - SAME AS BEFORE
const TEMPLATES: any = {
  otp_verify_email: (d:any) => ({ subject: `Your JobWay code is ${d.otp}`, html: wrapHtml("Verify Your Email", `<p>Hi ${d.name || 'there'},</p><p>Use this code to verify your email on JobWay:</p>${otpBox(d.otp)}`) }),
  otp_password_reset: (d:any) => ({ subject: `Reset code: ${d.otp} - JobWay`, html: wrapHtml("Password Reset Code", `<p>Hi ${d.name},</p><p>Use this code:</p>${otpBox(d.otp)}`) }),
  candidate_welcome: (d:any) => ({ subject: `Welcome to JobWay, ${d.name}!`, html: wrapHtml("Welcome!", `<p>Hi ${d.name},</p><p>Your account is ready.</p>`) }),
  candidate_status_shortlisted: (d:any) => ({ subject: `Shortlisted for ${d.jobTitle}!`, html: wrapHtml("You Were Shortlisted! 🎉", `<p>Hi ${d.name},</p><p>Congrats! You were shortlisted for <b>${d.jobTitle}</b> at ${d.company}.</p>`) }),
  // ADD ALL YOUR OTHER TEMPLATES HERE - copy from old file
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } })
  try {
    const apiKey = Deno.env.get("ZEPTOMAIL_API_KEY")!
    const fromEmail = Deno.env.get("ZEPTOMAIL_FROM_EMAIL") || "no-reply@jobway.co.za"
    const fromName = Deno.env.get("ZEPTOMAIL_FROM_NAME") || "JobWay"

    const { type, to, data } = await req.json()
    if (!type ||!to ||!TEMPLATES[type]) return new Response(JSON.stringify({error:`Invalid type: ${type}`}), {status:400, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})

    const { subject, html } = TEMPLATES[type](data || {})

    const zRes = await fetch(ZEPTO_URL, {
      method:"POST",
      headers:{ "Accept":"application/json","Content-Type":"application/json","Authorization":apiKey },
      body: JSON.stringify({
        from:{address:fromEmail,name:fromName},
        to:[{email_address:{address:to,name:data?.name||""}}],
        subject, htmlbody:html
      })
    })
    const zData = await zRes.json()
    if (!zRes.ok) throw new Error(JSON.stringify(zData))

    return new Response(JSON.stringify({success:true, type, data:zData}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})
  } catch (err:any) {
    return new Response(JSON.stringify({error:err.message}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})
  }
})
