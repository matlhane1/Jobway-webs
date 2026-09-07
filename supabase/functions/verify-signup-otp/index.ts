import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers":
"authorization, x-client-info, apikey, content-type",
"Access-Control-Allow-Methods":
"POST, OPTIONS",
};

const SUPABASE_URL =
Deno.env.get("SUPABASE_URL")!;

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

const supabaseAdmin =
createClient(
SUPABASE_URL,
SUPABASE_SECRET_KEY
);


/* ---------------------------------------------------------
SHA-256
--------------------------------------------------------- */

async function sha256(
value: string
): Promise<string> {

const data =
new TextEncoder()
.encode(value);

const hash =
await crypto.subtle.digest(
"SHA-256",
data
);

return Array
.from(new Uint8Array(hash))
.map(
byte =>
byte.toString(16).padStart(2,"0")
)
.join("");
}


/* ---------------------------------------------------------
MAIN
--------------------------------------------------------- */

Deno.serve(async (req) => {

if(req.method === "OPTIONS"){

return new Response(
"ok",
{
headers:corsHeaders,
}
);
}


try{

/* -----------------------------------------------------
Check publishable key
----------------------------------------------------- */

const apiKey =
req.headers.get("apikey");


if(
!apiKey ||
apiKey !== SUPABASE_PUBLISHABLE_KEY
){

return new Response(
JSON.stringify({
error:"Unauthorized",
}),
{
status:401,
headers:{
...corsHeaders,
"Content-Type":
"application/json",
},
}
);
}


const body =
await req.json();


const email =
String(body.email || "")
.trim()
.toLowerCase();

const otp =
String(body.otp || "")
.trim();


/* -----------------------------------------------------
Validation
----------------------------------------------------- */

if(
!email ||
!/^\d{6}$`/.test(otp)
){

return new Response(
JSON.stringify({
error:
"Enter the 6-digit verification code.",
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


/* -----------------------------------------------------
Get latest unverified OTP
----------------------------------------------------- */

const {
data:otpRecord,
error:otpLookupError
} =
await supabaseAdmin
.from("email_otps")
.select(id, user_id, email, otp_hash, expires_at, attempts)
.eq("email",email)
.is("verified_at",null)
.order(
"created_at",
{
ascending:false,
}
)
.limit(1)
.maybeSingle();


if(otpLookupError){

throw otpLookupError;
}


if(!otpRecord){

return new Response(
JSON.stringify({
error:
"This verification code is invalid or has expired.",
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


/* -----------------------------------------------------
Expiry
----------------------------------------------------- */

if(
new Date(otpRecord.expires_at)
.getTime()
<= Date.now()
){

return new Response(
JSON.stringify({
error:
"This verification code has expired. Please request a new one.",
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


/* -----------------------------------------------------
Attempt limit
----------------------------------------------------- */

if(
otpRecord.attempts >= 5
){

return new Response(
JSON.stringify({
error:
"Too many incorrect attempts. Please request a new code.",
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


/* -----------------------------------------------------
Hash supplied OTP
----------------------------------------------------- */

const suppliedHash =
await sha256(
``${otpRecord.user_id}:${otp}`
);


/* -----------------------------------------------------
Incorrect OTP
----------------------------------------------------- */

if(
suppliedHash !==
otpRecord.otp_hash
){

await supabaseAdmin
.from("email_otps")
.update({
attempts:
otpRecord.attempts + 1,
})
.eq(
"id",
otpRecord.id
);


return new Response(
JSON.stringify({
error:
"Incorrect verification code.",
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


/* -----------------------------------------------------
CONFIRM SUPABASE USER
----------------------------------------------------- */

const {
data:userData,
error:userError
} =
await supabaseAdmin
.auth.admin.updateUserById(
otpRecord.user_id,
{
email_confirm:true,
}
);


if(userError){

throw userError;
}


if(!userData.user){

throw new Error(
"User could not be confirmed."
);
}


/* -----------------------------------------------------
Mark OTP verified
----------------------------------------------------- */

const { error:verifyError } =
await supabaseAdmin
.from("email_otps")
.update({
verified_at:
new Date().toISOString(),
})
.eq(
"id",
otpRecord.id
);


if(verifyError){

throw verifyError;
}


/* -----------------------------------------------------
Delete older OTP records
----------------------------------------------------- */

await supabaseAdmin
.from("email_otps")
.delete()
.eq(
"user_id",
otpRecord.user_id
)
.neq(
"id",
otpRecord.id
);


/* -----------------------------------------------------
Get role
----------------------------------------------------- */

const role =
userData.user.user_metadata
?.role === "employer"
? "employer"
: "seeker";


return new Response(
JSON.stringify({

success:true,

message:
"Email verified successfully.",

user_id:
userData.user.id,

email:
userData.user.email,

role:role,

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


}catch(error){

console.error(
"verify-signup-otp:",
error
);


return new Response(
JSON.stringify({
error:
"Verification could not be completed. Please try again.",
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

