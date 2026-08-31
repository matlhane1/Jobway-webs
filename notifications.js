// JobWay Notification System - All 7 Events
const supa = supabase.createClient("https://dmxumcjeetphwzvggzzuk.supabase.co","sb_publishable_AU4KIOG0oHh5NLK7hv1iEg_oYIrIM3-");

async function sendNotification(type, toEmail, toWhatsApp, data){
  const templates = {
    'application_received': { subject: `✅ Application Received - ${data.job}`, email: `Hi ${data.name}, your application for ${data.job} at ${data.company} was received. We will review it soon. Track: jobway-webs.pages.dev/applications.html`, whatsapp: `JobWay: ✅ Application for ${data.job} received! Track status in app.` },
    'under_review': { subject: `👀 Under Review - ${data.job}`, email: `Your application for ${data.job} is now under review by employer.`, whatsapp: `JobWay: 👀 Your ${data.job} application is Under Review!` },
    'approved': { subject: `🎉 Approved - ${data.job}`, email: `Congrats ${data.name}! You are shortlisted for ${data.job}. Employer will schedule interview soon.`, whatsapp: `JobWay: 🎉 Approved for ${data.job}! Wait for interview schedule.` },
    'shortlisted': { subject: `⭐ Shortlisted - ${data.job}`, email: `You are shortlisted for ${data.job}!`, whatsapp: `JobWay: ⭐ Shortlisted for ${data.job}!` },
    'rejected': { subject: `Update - ${data.job}`, email: `Thanks for applying for ${data.job}. Unfortunately not selected this time, but keep applying - 95% match jobs waiting.`, whatsapp: `JobWay: Update on ${data.job} application. Check app.` },
    'interview_scheduled': { subject: `📅 Interview Scheduled - ${data.job}`, email: `Interview for ${data.job} scheduled: ${data.date} at ${data.time} - Location: ${data.location}. Reply YES to confirm.`, whatsapp: `JobWay: 📅 INTERVIEW! ${data.job} on ${data.date} at ${data.time}. Location: ${data.location}` },
    'interview_reminder': { subject: `⏰ Reminder: Interview Tomorrow - ${data.job}`, email: `Reminder: Your interview for ${data.job} is tomorrow ${data.date} at ${data.time}. Good luck!`, whatsapp: `JobWay: ⏰ Reminder: Interview tomorrow ${data.date} at ${data.time} for ${data.job}` },
    'job_alert': { subject: `🔥 New 95% Match Job - ${data.job}`, email: `New job matching your skills: ${data.job} at ${data.company} - R${data.salary}. Apply fast!`, whatsapp: `JobWay: 🔥 New job: ${data.job} - ${data.company}. 95% match!` },
    'employer_new_application': { subject: `📩 New Applicant for ${data.job}`, email: `You have new applicant ${data.name} (${data.match}% match) for ${data.job}. Manage: employer-applications.html`, whatsapp: `JobWay Employer: 📩 New applicant ${data.name} for ${data.job}` }
  };

  const msg = templates[type];
  console.log(`[NOTIFY] ${type} to ${toEmail} / ${toWhatsApp}`, msg);

  // 1. Save to Supabase notifications table
  try{
    await supa.from('notifications').insert({user_email:toEmail, type:type, title:msg.subject, message:msg.email, whatsapp:toWhatsApp, job_title:data.job, is_read:false});
    // 2. Update application status
    if(data.appId) await supa.from('applications').update({status:data.status || type}).eq('id', data.appId);
  }catch(e){}

  // 3. Save locally for demo (shows in notifications bell)
  let notifs = JSON.parse(localStorage.getItem('jobway_notifications')||'[]');
  notifs.unshift({type, toEmail, title:msg.subject, message:msg.email, date:new Date().toISOString(), read:false});
  localStorage.setItem('jobway_notifications', JSON.stringify(notifs));

  // 4. REAL INTEGRATION - Uncomment when you have API keys
  // await fetch('https://api.brevo.com/v3/smtp/email', {method:'POST', headers:{'api-key':YOUR_BREVO_KEY}, body:JSON.stringify({to:[{email:toEmail}], subject:msg.subject, htmlContent:msg.email})})
  // await fetch('https://graph.facebook.com/v20.0/YOUR_PHONE_ID/messages', {method:'POST', headers:{Authorization:'Bearer '+WHATSAPP_TOKEN}, body:JSON.stringify({messaging_product:'whatsapp', to:toWhatsApp, text:{body:msg.whatsapp}})})

  return msg;
}
