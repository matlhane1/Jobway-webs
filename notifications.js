<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Track Applications | JobWay</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',sans-serif;background:#0F2230;color:white;min-height:100vh}
.header{background:#11283A;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1E3A4A;position:sticky;top:0;z-index:10}
.logo{font-weight:900;color:#01F9C6;font-size:20px}
.btn{border:none;border-radius:12px;padding:10px 16px;font-weight:800;cursor:pointer;font-size:13px}
.btn-dark{background:#2A3F4E;color:white}
.btn-green{background:#01F9C6;color:#08231C}
.container{max-width:600px;margin:0 auto;padding:16px}
.banner{background:linear-gradient(135deg,#01F9C6,#30BA8F);color:#08231C;border-radius:16px;padding:12px;font-weight:900;font-size:12px;text-align:center;margin-bottom:12px}
.banner span{display:block;font-size:16px;margin-top:2px}
.card{background:#1A3341;border:1px solid #25475A;border-radius:20px;padding:18px;margin-bottom:14px}
.status-steps{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.step{padding:6px 10px;border-radius:20px;font-size:11px;font-weight:800;border:1px solid #25475A;color:#8DB0BF}
.step.active{background:#01F9C6;color:#08231C;border-color:#01F9C6;box-shadow:0 0 10px rgba(1,249,198,0.4)}
.step.done{background:#143E4A;color:#01F9C6}
.interview-box{background:#0F2230;border:1px solid #01F9C6;border-radius:16px;padding:14px;margin-top:12px}
.interview-box h4{color:#01F9C6;margin-bottom:8px}
.detail{font-size:13px;margin:4px 0;color:#E6F2F5}
.notif{background:rgba(1,249,198,0.1);border:1px solid rgba(1,249,198,0.2);border-radius:12px;padding:10px;margin-top:8px;font-size:12px}
.auto-badge{background:#01F9C6;color:#08231C;padding:4px 8px;border-radius:8px;font-size:10px;font-weight:900;margin-left:6px}
</style>
</head>
<body>
<div class="header">
<div class="logo">JobWay</div>
<div style="display:flex;gap:8px">
<button class="btn btn-dark" onclick="location.href='jobs.html'">💼 Jobs</button>
<button class="btn btn-green" onclick="location.href='profile.html'">👤 Profile</button>
</div>
</div>
<div class="container">
<div class="banner">📱 Official WhatsApp: <span>079 060 8952</span>AUTOMATIC alerts: Email + WhatsApp on EVERY status change</div>
<div id="list"></div>
</div>

<script>
const STATUSES=["Application Received","Under Review","Shortlisted","Interview Scheduled","Interview Completed","Assessment","Offer Made","Hired","Not Selected"];
const OFFICIAL_NUMBER="079 060 8952";

// ===== AUTOMATIC NOTIFICATION SYSTEM - READY FOR YOUR API =====
async function sendEmailNotification(toEmail, subject, message){
 // TODO: Connect your Email API here (e.g., EmailJS, SendGrid, Firebase)
 console.log(`📧 AUTO EMAIL to ${toEmail}: ${subject} - ${message}`);
 // Example when you have API:
 // await fetch('https://your-email-api.com/send', {method:'POST', body: JSON.stringify({to:toEmail,subject,message})})
 return true;
}

async function sendWhatsAppNotification(toWhatsApp, message){
 // TODO: YOU WILL PASTE YOUR WHATSAPP API DETAILS HERE LATER
 // Example structure ready:
 /*
 await fetch('https://graph.facebook.com/v19.0/YOUR_PHONE_ID/messages', {
   method:'POST',
   headers:{'Authorization':'Bearer YOUR_TOKEN','Content-Type':'application/json'},
   body: JSON.stringify({
     messaging_product:'whatsapp',
     to: toWhatsApp,
     type:'text',
     text:{body: message}
   })
 })
 */
 console.log(`💬 AUTO WHATSAPP from ${OFFICIAL_NUMBER} to ${toWhatsApp}: ${message}`);
 return true;
}

async function sendAutomaticNotifications(app, status){
 let emailSubject=`JobWay: Your application for ${app.job_title} - ${status}`;
 let emailMsg=`Hi ${app.name},\n\nYour application status for ${app.job_title} at ${app.company} is now: ${status}\n\n${app.interviewDate?`Interview: ${app.interviewDate} at ${app.interviewTime} (${app.interviewFormat})\n`:''}\nAll updates come from our official WhatsApp: ${OFFICIAL_NUMBER}\n\n- JobWay Team`;
 let waMsg=`*JobWay Update* 🔔\nHi ${app.name}!\nYour application for *${app.job_title}* is now: *${status}*\n${app.interviewDate?`📅 Interview: ${app.interviewDate} ⏰ ${app.interviewTime} 📍 ${app.interviewFormat}\n`:''}\nOfficial number: ${OFFICIAL_NUMBER}`;

 // SEND BOTH AUTOMATICALLY
 await sendEmailNotification(app.email, emailSubject, emailMsg);
 await sendWhatsAppNotification(app.whatsapp, waMsg);

 // Save log
 let notifs=JSON.parse(localStorage.getItem('jobway_notifications')||'[]');
 notifs.unshift({appId:app.id,text:`${status} - ${app.job_title}`,channel:`AUTO Email + WhatsApp ${OFFICIAL_NUMBER}`,time:Date.now(),auto:true});
 localStorage.setItem('jobway_notifications',JSON.stringify(notifs));
}

// Check for status changes automatically every 2 seconds
let lastStatuses={};
function checkForAutoUpdates(){
 let apps=getApps();
 apps.forEach(app=>{
  let key=app.id;
  if(lastStatuses[key] && lastStatuses[key]!==app.status){
   // Status changed! Send automatic notifications
   sendAutomaticNotifications(app, app.status);
  }
  lastStatuses[key]=app.status;
 });
}

function getApps(){return JSON.parse(localStorage.getItem('jobway_all_applications')||'[]')}

function render(){
 let apps=getApps();
 if(apps.length==0){document.getElementById('list').innerHTML=`<div class="card" style="text-align:center">No applications yet<br><br><button class="btn btn-green" onclick="location.href='jobs.html'">Find Jobs</button></div>`;return;}
 document.getElementById('list').innerHTML=apps.map(a=>{
  let idx=STATUSES.indexOf(a.status||'Application Received');
  let steps=STATUSES.map((s,i)=>`<div class="step ${i==idx?'active':i<idx?'done':''}">${s}</div>`).join('');
  let interview = a.interviewDate? `<div class="interview-box">
   <h4>📅 Interview Details <span class="auto-badge">AUTO SENT</span></h4>
   <div class="detail">📅 Date: ${a.interviewDate}</div>
   <div class="detail">⏰ Time: ${a.interviewTime}</div>
   <div class="detail">📍 Format: ${a.interviewFormat}</div>
   ${a.interviewFormat=='Online'?`<div class="detail">🔗 Link: Sent via Email + WhatsApp from ${OFFICIAL_NUMBER}</div>`:`<div class="detail">🏢 Location: ${a.company||''} Office</div>`}
   <div class="notif">✅ AUTOMATIC: Email + WhatsApp from ${OFFICIAL_NUMBER} sent instantly</div>
  </div>`:'';
  let notifs=JSON.parse(localStorage.getItem('jobway_notifications')||'[]').filter(n=>n.appId==a.id).slice(0,5).map(n=>`<div class="notif">${n.auto?'🤖 AUTO':''} 📧 ${n.text}<br><small>via ${n.channel} at ${new Date(n.time).toLocaleString()}</small></div>`).join('');
  return `<div class="card">
   <div style="display:flex;justify-content:space-between"><b>${a.job_title}</b><span style="color:#01F9C6;font-size:12px;font-weight:800">${a.status||'Under Review'} <span class="auto-badge">AUTO</span></span></div>
   <div style="color:#8DB0BF;font-size:12px;margin:6px 0">${a.company||''} • Applied ${new Date(a.date).toLocaleDateString()}</div>
   <div class="status-steps">${steps}</div>
   ${interview}
   ${notifs}
  </div>`;
 }).join('');
 // Init last statuses
 apps.forEach(app=>{ if(!lastStatuses[app.id]) lastStatuses[app.id]=app.status; });
}

// Auto-refresh and auto-detect changes
render();
setInterval(()=>{ checkForAutoUpdates(); render(); },2000);

// Also listen for storage changes from employer dashboard (automatic across tabs)
window.addEventListener('storage', (e)=>{
 if(e.key==='jobway_all_applications'){
  let apps=JSON.parse(e.newValue||'[]');
  apps.forEach(app=>{
   if(lastStatuses[app.id] && lastStatuses[app.id]!==app.status){
    sendAutomaticNotifications(app, app.status);
   }
  });
  render();
 }
});
</script>
</body>
</html>
