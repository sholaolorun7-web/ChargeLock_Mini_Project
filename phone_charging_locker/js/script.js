const STORAGE_KEY = "chargelock_admin_v1";
const initialLockers = Array.from({length:8},(_,i)=>({id:i+1,status:"available",session:null}));
let state = loadState();

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved && Array.isArray(saved.lockers) && saved.lockers.length===8) return saved;
  }catch(e){}
  return {lockers:initialLockers,history:[{id:1,type:"System ready",details:"ChargeLock management system initialized.",status:"Online",time:new Date().toISOString()}],nextId:2};
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function formatDate(value){return new Date(value).toLocaleString([], {month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function elapsed(start){let seconds=Math.max(0,Math.floor((Date.now()-new Date(start).getTime())/1000));let h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
function addHistory(type,details,status="Completed"){state.history.unshift({id:state.nextId++,type,details,status,time:new Date().toISOString()});saveState();}
function counts(){return state.lockers.reduce((a,l)=>(a[l.status]++,a),{available:0,occupied:0,maintenance:0});}
function renderStats(){const c=counts();document.getElementById("totalCount").textContent=state.lockers.length;document.getElementById("availableCount").textContent=c.available;document.getElementById("occupiedCount").textContent=c.occupied;document.getElementById("maintenanceCount").textContent=c.maintenance;}
function lockerMarkup(l){
  const label=`Locker ${String(l.id).padStart(2,"0")}`;
  const action=l.status==="available"?`<button class="tile-action" data-action="start" data-id="${l.id}">＋ Start session</button>`:
    l.status==="occupied"?`<button class="tile-action" data-action="view" data-id="${l.id}">View session</button>`:
    `<button class="tile-action" data-action="restore" data-id="${l.id}">Mark available</button>`;
  return `<article class="locker-tile"><div class="tile-top"><span class="locker-symbol">▣</span><span class="status-text ${l.status}">● ${l.status}</span></div><div class="locker-name">${label}</div><div class="muted">${l.session?`Assigned to ${escapeHTML(l.session.name)}`:l.status==="maintenance"?"Requires attention":"Ready for allocation"}</div>${action}</article>`;
}
function renderLockers(){
  document.getElementById("dashboardLockerGrid").innerHTML=state.lockers.map(lockerMarkup).join("");
  const q=(document.getElementById("lockerSearch").value||"").toLowerCase();
  const f=document.getElementById("lockerFilter").value;
  const filtered=state.lockers.filter(l=>(`locker ${String(l.id).padStart(2,"0")}`).includes(q)&&(f==="all"||l.status===f));
  document.getElementById("allLockerGrid").innerHTML=filtered.length?filtered.map(lockerMarkup).join(""):'<div class="empty-state">No lockers match your search.</div>';
}
function renderActivity(){
  const recent=state.history.slice(0,5);
  document.getElementById("recentActivity").innerHTML=recent.length?recent.map(h=>`<div class="activity-item"><div class="activity-icon">↗</div><div><strong>${escapeHTML(h.type)}</strong><small>${escapeHTML(h.details)}</small></div><span class="activity-time">${new Date(h.time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span></div>`).join(""):'<div class="empty-state">No activity yet.</div>';
}
function renderSessions(){
  const active=state.lockers.filter(l=>l.status==="occupied"&&l.session);
  document.getElementById("sessionsTable").innerHTML=active.map(l=>`<tr><td class="user-cell"><strong>${escapeHTML(l.session.name)}</strong><small>${escapeHTML(l.session.contact)}</small></td><td>Locker ${String(l.id).padStart(2,"0")}</td><td>${escapeHTML(l.session.note||"—")}</td><td>${formatDate(l.session.start)}</td><td class="timer" data-start="${l.session.start}">${elapsed(l.session.start)}</td><td><button class="action-btn" data-action="end" data-id="${l.id}">End session</button></td></tr>`).join("");
  document.getElementById("noSessions").classList.toggle("hidden",active.length>0);
}
function renderHistory(){
  const rows=state.history;
  document.getElementById("historyTable").innerHTML=rows.map(h=>`<tr><td>${formatDate(h.time)}</td><td>${escapeHTML(h.type)}</td><td>${escapeHTML(h.details)}</td><td><span class="status-badge">${escapeHTML(h.status)}</span></td></tr>`).join("");
  document.getElementById("noHistory").classList.toggle("hidden",rows.length>0);
  document.getElementById("recordCount").textContent=`${rows.length} record${rows.length===1?"":"s"}`;
}
function renderAll(){renderStats();renderLockers();renderActivity();renderSessions();renderHistory();}
function showToast(message){const t=document.getElementById("toast");t.textContent=message;t.classList.remove("hidden");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.add("hidden"),2600);}
function openModal(preselected){
  const select=document.getElementById("lockerSelect");
  const available=state.lockers.filter(l=>l.status==="available");
  select.innerHTML=available.map(l=>`<option value="${l.id}" ${Number(preselected)===l.id?"selected":""}>Locker ${String(l.id).padStart(2,"0")}</option>`).join("");
  if(!available.length){showToast("There are no available lockers.");return;}
  document.getElementById("sessionModal").classList.remove("hidden");
  document.getElementById("userName").focus();
}
function closeModal(){document.getElementById("sessionModal").classList.add("hidden");document.getElementById("sessionForm").reset();}
function startSession(form){
  const data=new FormData(form),id=Number(data.get("lockerSelect")),locker=state.lockers.find(l=>l.id===id);
  if(!locker||locker.status!=="available"){showToast("That locker is no longer available.");closeModal();renderAll();return;}
  locker.status="occupied";locker.session={name:String(data.get("userName")).trim(),contact:String(data.get("userContact")).trim(),note:String(data.get("deviceNote")).trim(),start:new Date().toISOString()};
  addHistory("Session started",`${locker.session.name} assigned to Locker ${String(id).padStart(2,"0")}.`,"Active");
  closeModal();renderAll();showToast(`Charging session started in Locker ${String(id).padStart(2,"0")}.`);
}
function endSession(id){
  const l=state.lockers.find(x=>x.id===Number(id));if(!l||!l.session)return;
  const duration=elapsed(l.session.start),name=l.session.name;
  l.session=null;l.status="available";
  addHistory("Session completed",`${name} completed charging in Locker ${String(l.id).padStart(2,"0")}. Duration: ${duration}.`);
  renderAll();showToast("Session ended. Locker is now available.");
}
function restoreLocker(id){
  const l=state.lockers.find(x=>x.id===Number(id));if(!l||l.status!=="maintenance")return;
  l.status="available";addHistory("Locker restored",`Locker ${String(l.id).padStart(2,"0")} marked as available.`);
  renderAll();showToast("Locker marked as available.");
}
function handleLockerAction(action,id){
  const l=state.lockers.find(x=>x.id===Number(id));if(!l)return;
  if(action==="start")openModal(id);
  if(action==="view"){navigate("sessions");showToast(`Showing active session in Locker ${String(id).padStart(2,"0")}.`);}
  if(action==="restore")restoreLocker(id);
}
function navigate(view){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active-page"));
  document.getElementById(`${view}View`).classList.add("active-page");
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const names={dashboard:"Dashboard",lockers:"Locker management",sessions:"Charging sessions",history:"Activity history"};
  document.getElementById("breadcrumbCurrent").textContent=names[view];
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}
function exportCSV(){
  const rows=[["Date and time","Event","Details","Status"],...state.history.map(h=>[formatDate(h.time),h.type,h.details,h.status])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="chargelock-activity-history.csv";a.click();URL.revokeObjectURL(url);showToast("Activity history exported.");
}

document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
document.addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b)return;const action=b.dataset.action,id=b.dataset.id;if(action==="end")endSession(id);else handleLockerAction(action,id);});
["quickStartBtn","newSessionBtn","sessionPageStartBtn"].forEach(id=>document.getElementById(id).addEventListener("click",()=>openModal()));
document.getElementById("sessionForm").addEventListener("submit",e=>{e.preventDefault();startSession(e.currentTarget);});
["closeModal","cancelModal"].forEach(id=>document.getElementById(id).addEventListener("click",closeModal));
document.getElementById("sessionModal").addEventListener("click",e=>{if(e.target.id==="sessionModal")closeModal();});
document.getElementById("lockerSearch").addEventListener("input",renderLockers);
document.getElementById("lockerFilter").addEventListener("change",renderLockers);
document.getElementById("exportBtn").addEventListener("click",exportCSV);
document.getElementById("menuBtn").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
document.getElementById("todayDate").textContent=new Date().toLocaleDateString([], {weekday:"short",day:"numeric",month:"short",year:"numeric"});
document.getElementById("year").textContent=new Date().getFullYear();
renderAll();
setInterval(()=>{document.querySelectorAll(".timer").forEach(el=>el.textContent=elapsed(el.dataset.start));},1000);
