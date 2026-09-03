export async function onRequestPost(context) {
  const { phone, otp } = await context.request.json();
  
  const PHONE_ID = "1340338765820659";
  const TOKEN = EAAUVcL4HmMoBSXzZBXZCKaAER2rO7GZCnLpPOHBrDOIn4RsxJCG4o7njgka8LWt0uFGSDdWCF7ZCXFvwmUx8ud1ToOII7SV7o8NfBJ6tZAaV5kbGKE81rNI4CFh6ZCaG97bhwMFGcp1VHpvPQ0hdkoYEhYZChZC1h21sXuH74lOONGRZAjxOXFXF6AGZBOu25JF8gjHcD4F4ZBcGISH1dZBePDkxyZB9tutHZBbPeU2xhRZBmyQ2qZAHa8auHZBJBjivKIFdlcFAwEWQZAfzi4ZBfC3TQpfBa659bxhBEUZD get from developers.facebook.com
  
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  const res = await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: "otp_verification",
        language: { code: "en_US" },
        components: [{
          type: "body",
          parameters: [{ type: "text", text: String(otp) }]
        }]
      }
    })
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}
