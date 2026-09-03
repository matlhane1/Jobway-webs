export async function onRequestPost(context) {
  const { phone, otp } = await context.request.json();
  
  const PHONE_ID = "1340338765820659";
  const TOKEN = EAAUVcL4HmMoBSZAnlxzNuqQAiEBKwQCPy9sOeQNeuLlJQdcInuwrQllDrSu5xfjKCJT9gnNSeERnru2ATBgd7lrzDmyXWLVV0D9pGtdyFpxFfw10xP2YvbU4MZBWvqJxMtfdSGZBwk871qIU9noEZCvKZCZBjEdpc9tTF6ykqdaOtAu0PI7WcruDkPawZBgeXLaqZCtuHjizpjJqOceRErIXhOvHJMAiGPtR1VHAtQ3q5LpCbZCeEoyvhMqryCehdaa66sEbLEYZBSKQTVmxu6wktjD6s1MwZDZD// get from developers.facebook.com
  
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
