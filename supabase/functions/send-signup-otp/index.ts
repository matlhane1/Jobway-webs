import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers":
"authorization, x-client-info, apikey, content-type",
"Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

const secretKeys = JSON.parse(
Deno.env.get("SUPABASE_SECRET_KEYS")!
);

const publishableKeys = JSON.parse(
Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")!
);

const SUPABASE_SECRET_KEY =
secretKeys["default"];

const SUPABASE_PUBLISHABLE_KEY =
publishableKeys["default"];

const ZEPTOMAIL_TOKEN =
Deno.env.get("ZEPTOMAIL_SEND_API_KEY");

const FROM_EMAIL =
Deno.env.get("JOBWAY_FROM_EMAIL") ||
"no-reply@jobway.co.za";

const FROM_NAME =
Deno.env.get("JOBWAY_FROM_NAME") ||
"JobWay";

const supabaseAdmin = createClient(
SUPABASE_URL,
SUPABASE_SECRET_KEY
);


/* ---------------------------------------------------------
SHA-256
--------------------------------------------------------- */

async function sha256(value: string): Promise<string> {

const data =
new TextEncoder().encode(value);

const hash =
await crypto.subtle.digest(
"SHA-256",
data
);

return Array
.from(new Uint8Array(hash))
.map(
byte =>
byte.toString(16).padStart(2, "0")
)
.join("");
}


/* ---------------------------------------------------------
RANDOM OTP
--------------------------------------------------------- */

function generateOTP(): string {

const array =
new Uint32Array(1);

crypto.getRandomValues(array);

return String(
100000 +
(array[0] % 900000)
);
}


/* ---------------------------------------------------------
HTML ESCAPE
--------------------------------------------------------- */

function escapeHtml(value: string): string {

return value
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");
}


/* ---------------------------------------------------------
ZEPTOMAIL
--------------------------------------------------------- */

async function sendZeptoMail(
email: string,
name: string,
otp: string
) {

if (!ZEPTOMAIL_TOKEN) {
throw new Error(
"ZeptoMail API key is not configured."
);
}


const safeName =
escapeHtml(name);


const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="
margin:0;
padding:0;
background:#0A1F2E;
font-family:Arial,Helvetica,sans-serif;
">

<div style="
max-width:600px;
margin:30px auto;
padding:20px;
">

<div style="
background:#11283A;
border-radius:18px;
padding:35px 25px;
text-align:center;
color:white;
">

<div style="
font-size:28px;
font-weight:800;
margin-bottom:20px;
">
Job<span style="color:#01F9C6;">Way</span>
</div>

<h1 style="
font-size:24px;
margin:0 0 12px;
color:white;
">
Verify your email
</h1>

<p style="
color:#A8C8D0;
font-size:15px;
line-height:1.6;
">
Hi $`{safeName},
</p>

<p style="
color:#A8C8D0;
font-size:15px;
line-height:1.6;
">
Use the verification code below to complete
your JobWay account registration.
</p>

<div style="
margin:25px auto;
padding:20px;
background:#0F2332;
border:1px solid rgba(1,249,198,.3);
border-radius:14px;
max-width:260px;
">

<div style="
color:#01F9C6;
font-size:34px;
font-weight:800;
letter-spacing:8px;
">
`${otp}
</div>

</div>

<p style="
color:#8FB3C1;
font-size:13px;
line-height:1.6;
">
This code expires in 10 minutes.
</p>

<p style="
color:#8FB3C1;
font-size:12px;
margin-top:25px;
">
If you did not create a JobWay account,
you can safely ignore this email.
</p>

</div>

<div style="
text-align:center;
color:#6EA3AF;
font-size:11px;
padding:20px;
">
JobWay.co.za — your job, your way
</div>

</div>

</body>
</html>
`;


const response =
await fetch(
"https://api.zeptomail.com/v1.1/email",
{
method: "POST",

headers: {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization":
"Zoho-enczapikey " +
ZEPTOMAIL_TOKEN,
},

body: JSON.stringify({

from: {
address: FROM_EMAIL,
name: FROM_NAME,
},

to: [
{
email_address: {
address: email,
name: name,
},
},
 ],

subject:
"Your JobWay verification code",

htmlbody: html,

track_clicks: false,
track_opens: false,

}),
}
);


const text =
await response.text();


if (!response.ok) {

console.error(
"ZeptoMail error:",
text
);

throw new Error(
"ZeptoMail could not send the email."
);
}


return true;
}


/* ---------------------------------------------------------
MAIN
--------------------------------------------------------- */

Deno.serve(async (req) => {

if (req.method === "OPTIONS") {

return new Response(
"ok",
{
headers: corsHeaders,
}
);
}


try {

/* -----------------------------------------------------
Check publishable key
----------------------------------------------------- */

const apiKey =
req.headers.get("apikey");


if (
!apiKey ||
apiKey !== SUPABASE_PUBLISHABLE_KEY
) {

return new Response(
JSON.stringify({
error: "Unauthorized",
}),
{
status: 401,
headers: {
...corsHeaders,
"Content-Type":
"application/json",
},
}
);
}


const body =
await req.json();


const full_name =
String(body.full_name || "")
.trim();

const email =
String(body.email || "")
.trim()
.toLowerCase();

const password =
body.password
? String(body.password)
: null;

const role =
body.role === "employer"
? "employer"
: "seeker";

const wantsWhatsApp =
body.wantsWhatsApp === true;

const waNumber =
wantsWhatsApp
? String(body.waNumber || "").trim()
: null;

const resend =
body.resend === true;


/* -----------------------------------------------------
Validation
----------------------------------------------------- */

if (!email) {

return new Response(
JSON.stringify({
error:
"Email address is required.",
}),
{
status:400,
headers:{
...corsHeaders,
"Content-Type":
"application/json",
},
}
);
}


if (!resend) {

if (!full_name) {

return new Response(
JSON.stringify({
error:
"Full name is required.",
}),
{
status:400,
headers:{
...corsHeaders,
"Content-Type":
"application/json",
},
}
);
}


if (!password || password.length < 6) {

return new Response(
JSON.stringify({
error:
"Password must contain at least 6 characters.",
}),
{
status:400,
headers:{
...corsHeaders,
"Content-Type":
"application/json",
},
}
);
}
}


/* -----------------------------------------------------
RESEND
----------------------------------------------------- */

let userId: string;
let userName: string;


if (resend) {

const { data, error } =
await supabaseAdmin
.from("email_otps")
.select(
"user_id,email"
)
.eq("email", email)
.is("verified_at", null)
.order(
"created_at",
{
ascending:false,
}
)
.limit(1)
.maybeSingle();


if (error || !data) {

return new Response(
JSON.stringify({
error:
"Signup session not found. Please start signup again.",
}),
{
status:404,
headers:{
...corsHeaders,
"Content-Type":
"application/json",
},
}
);
}


userId =
data.user_id;


const { data:userData } =
await supabaseAdmin
.auth.admin.getUserById(
userId
);


userName =
userData?.user?.user_metadata
?.full_name ||
"JobWay User";


} else {

/* ---------------------------------------------------
Check whether email already belongs to a user
--------------------------------------------------- */

const { data:existingUsers } =
await supabaseAdmin
.auth.admin.listUsers({
page:1,
perPage:1000,
});


const existing =
existingUsers?.users?.find(
u =>
u.email?.toLowerCase() === email
);


if (existing) {

if (existing.email_confirmed_at) {

return new Response(
JSON.stringify({
error:
"An account with this email already exists. Please log in.",
}),
{
status:409,
headers:{
...corsHeaders,
"Content-Type":
"application/json",
},
}
);
}


userId =
existing.id;


userName =
full_name ||
existing.user_metadata
?.full_name ||
"JobWay User";


const { error:updateError } =
await supabaseAdmin
.auth.admin.updateUserById(
userId,
{
password:password!,
user_metadata:{
...existing.user_metadata,
full_name:userName,
role:role,
wants_whatsapp:
wantsWhatsApp,
whatsapp_number:
waNumber,
},
}
);


if (updateError) {

throw updateError;
}


} else {

/* -------------------------------------------------
CREATE UNCONFIRMED SUPABASE ACCOUNT
------------------------------------------------- */

const { data, error } =
await supabaseAdmin
.auth.admin.createUser({

email:email,

password:password!,

email_confirm:false,

user_metadata:{
full_name:full_name,
role:role,
wants_whatsapp:
wantsWhatsApp,
whatsapp_number:
waNumber,
},

});


if (error) {

throw error;
}


if (!data.user) {

throw new Error(
"Unable to create user."
);
}


userId =
data.user.id;

userName =
full_name;

}

}


/* -----------------------------------------------------
RATE LIMIT RESEND
----------------------------------------------------- */

const { data:lastOTP } =
await supabaseAdmin
.from("email_otps")
.select("last_sent_at")
.eq("user_id", userId)
.is("verified_at", null)
.order(
"created_at",
{
ascending:false,
}
)
.limit(1)
.maybeSingle();


if (lastOTP?.last_sent_at) {

const seconds =
Math.floor(
(
Date.now() -
new Date(
lastOTP.last_sent_at
).getTime()
) / 1000
);


if (seconds < 30) {

return new Response(
JSON.stringify({
error:
"Please wait 30 seconds before requesting another code.",
}),
{
status:429,
headers:{
...corsHeaders,
"Content-Type":
"application/json",
},
}
);
}
}


/* -----------------------------------------------------
GENERATE OTP
----------------------------------------------------- */

const otp =
generateOTP();

const otpHash =
await sha256(
${userId}:${otp}
);

const expiresAt =
new Date(
Date.now() +
10 * 60 * 1000
).toISOString();


/* -----------------------------------------------------
Invalidate previous codes
----------------------------------------------------- */

await supabaseAdmin
.from("email_otps")
.update({
expires_at:
new Date().toISOString(),
})
.eq("user_id", userId)
.is("verified_at", null);


/* -----------------------------------------------------
Store new hashed OTP
----------------------------------------------------- */

const { error:otpError } =
await supabaseAdmin
.from("email_otps")
.insert({

user_id:userId,

email:email,

otp_hash:otpHash,

expires_at:expiresAt,

attempts:0,

last_sent_at:
new Date().toISOString(),

});


if (otpError) {

throw otpError;
}


/* -----------------------------------------------------
SEND EMAIL
----------------------------------------------------- */

await sendZeptoMail(
email,
userName,
otp
);


return new Response(
JSON.stringify({
success:true,
message:
"Verification code sent.",
}),
{
status:200,
headers:{
...corsHeaders,
"Content-Type":
"application/json",
},
}
);


} catch (error) {

console.error(
"send-signup-otp:",
error
);


return new Response(
JSON.stringify({
error:
"Unable to send verification code. Please try again.",
}),
{
status:500,
headers:{
...corsHeaders,
"Content-Type":
"application/json",
},
}
);

}

});
