/* Local-only Payments tab for My Personal Diary. No network calls. */
(()=>{"use strict";if(window.__paymentsTabLoaded)return;window.__paymentsTabLoaded=true;
const DB="myDiaryPaymentsDB_v1",STORE="payments",cats=["Credit card","Electricity","Water","Gas","Mobile/Internet","Insurance","Loan/EMI","Rent/Maintenance","Subscription","School/Education","Tax/Government","Medical","Other"];
const $=id=>document.getElementById(id),today=()=>{let d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")},uid=()=>crypto.randomUUID?crypto.randomUUID():"p"+Date.now()+Math.random().toString(36).slice(2),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}),pd=s=>s?new Date(s+"T12:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
let db,editing=null,filter="all",search="";
function openDB(){return new Promise((ok,no)=>{let r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:"id"});r.onsuccess=()=>{db=r.result;ok()};r.onerror=()=>no(r.error)})}
function all(){return new Promise((ok,no)=>{let r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>ok(r.result||[]);r.onerror=()=>no(r.error)})}
function put(x){return new Promise((ok,no)=>{let r=db.transaction(STORE,"readwrite").objectStore(STORE).put(x);r.onsuccess=()=>ok(x);r.onerror=()=>no(r.error)})}
function del(id){return new Promise((ok,no)=>{let r=db.transaction(STORE,"readwrite").objectStore(STORE).delete(id);r.onsuccess=ok;r.onerror=()=>no(r.error)})}
function addMonths(s,n){let [y,m,d]=s.split("-").map(Number),dt=new Date(y,m-1+n,1);dt.setDate(Math.min(d,new Date(dt.getFullYear(),dt.getMonth()+1,0).getDate()));return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0")}
function nextDate(r){if(r.repeat==="weekly"){let d=new Date(r.due+"T12:00:00");d.setDate(d.getDate()+7);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}return addMonths(r.due,({"monthly":1,"quarterly":3,"half-yearly":6,"yearly":12}[r.repeat]||0))}
function reset(){editing=null;$("pForm").reset();$("pDue").value=today();$("pStatus").value="scheduled";$("pRepeat").value="none";$("pFormTitle").textContent="Add a payment";$("pCancel").hidden=true}
async function save(e){e.preventDefault();let old=editing?(await all()).find(x=>x.id===editing):null,st=$("pStatus").value;
let r={...(old||{}),id:editing||uid(),name:$("pName").value.trim(),category:$("pCat").value,amount:Number($("pAmount").value),due:$("pDue").value,status:st,paidDate:st==="paid"?($("pPaid").value||today()):"",repeat:$("pRepeat").value,end:$("pEnd").value,reference:$("pRef").value.trim(),notes:$("pNotes").value.trim(),created:old?.created||new Date().toISOString(),nextCreated:old?.nextCreated||false};
if(!r.name||!r.due||!Number.isFinite(r.amount)||r.amount<0){alert("Enter a name, due date and valid amount.");return}await put(r);reset();await render()}
async function markPaid(r){r.status="paid";r.paidDate=r.paidDate||today();await put(r);if(r.repeat!=="none"&&!r.nextCreated){let due=nextDate(r);if(!r.end||due<=r.end){await put({...r,id:uid(),due,status:"scheduled",paidDate:"",reference:"",nextCreated:false,created:new Date().toISOString()});r.nextCreated=true;await put(r)}}await render()}
async function render(){let rows=(await all()).sort((a,b)=>a.due.localeCompare(b.due)),active=rows.filter(x=>x.status!=="paid"),over=active.filter(x=>x.due<today()),up=active.filter(x=>x.due>=today()),mo=today().slice(0,7),paid=rows.filter(x=>x.status==="paid"&&(x.paidDate||"").startsWith(mo));
$("pPaidTotal").textContent=money(paid.reduce((s,x)=>s+x.amount,0));$("pUpCount").textContent=up.length;$("pUpTotal").textContent=money(up.reduce((s,x)=>s+x.amount,0));$("pOverCount").textContent=over.length;$("pOverTotal").textContent=money(over.reduce((s,x)=>s+x.amount,0));
let shown=rows.filter(r=>{let st=r.status==="paid"?"paid":r.due<today()?"overdue":r.due===today()?"today":"scheduled";return(filter==="all"||(filter==="paid"&&st==="paid")||(filter==="overdue"&&st==="overdue")||(filter==="upcoming"&&st!=="paid"&&st!=="overdue"))&&[r.name,r.category,r.reference,r.notes].join(" ").toLowerCase().includes(search.toLowerCase())});
$("pRows").innerHTML=shown.length?shown.map(r=>{let st=r.status==="paid"?"paid":r.due<today()?"overdue":r.due===today()?"today":"scheduled",label={paid:"Paid",overdue:"Overdue",today:"Due today",scheduled:"Scheduled"}[st];return `<tr><td><b>${esc(r.name)}</b><small>${esc(r.category)}${r.repeat!=="none"?" · "+esc(r.repeat):""}</small>${r.notes?`<small>${esc(r.notes)}</small>`:""}</td><td><b>${money(r.amount)}</b></td><td>${pd(r.due)}${r.paidDate?`<small>Paid ${pd(r.paidDate)}</small>`:""}</td><td><span class="pst ${st}">${label}</span></td><td class="pacts">${st!=="paid"?`<button data-a="paid" data-id="${esc(r.id)}">✓ Paid</button>`:""}<button data-a="edit" data-id="${esc(r.id)}">Edit</button><button data-a="del" data-id="${esc(r.id)}">Delete</button></td></tr>`}).join(""):`<tr><td colspan="5" class="pempty">No matching payments. Add a payment above.</td></tr>`}
function exportBackup(){all().then(rows=>{let a=document.createElement("a"),u=URL.createObjectURL(new Blob([JSON.stringify({format:"diary-payments-v1",payments:rows},null,2)],{type:"application/json"}));a.href=u;a.download="diary-payments-"+today()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)})}
async function importBackup(file){if(!file)return;try{let x=JSON.parse(await file.text()),rows=Array.isArray(x)?x:x.payments;if(!Array.isArray(rows))throw Error("Invalid payment backup");if(confirm("Import "+rows.length+" records? Matching IDs will be updated.")){for(let r of rows)if(r.name&&r.due)await put({...r,id:r.id||uid(),amount:Number(r.amount||0)});await render();alert("Import complete.")}}catch(e){alert("Import failed: "+e.message)}$("pFile").value=""}
function initUI(){let st=document.createElement("style");st.textContent=`
#pModal[hidden]{display:none!important}
.topbuttons #paymentsTabButton,.topbuttons button[onclick="openHouseholdRegister()"]{background:rgba(192,235,205,.16);border-color:rgba(190,231,200,.58);color:#fff;font-weight:750}
.topbuttons #paymentsTabButton:hover,.topbuttons button[onclick="openHouseholdRegister()"]:hover{background:rgba(192,235,205,.27);border-color:rgba(218,245,224,.85)}
#pModal{position:fixed;inset:0;z-index:65000;overflow:auto;background:rgba(13,31,24,.72);backdrop-filter:blur(5px);padding:14px;font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#23382d}
#pModal *{box-sizing:border-box}
#pModal .pshell{max-width:1120px;margin:8px auto;background:#f6f9f6;border:1px solid #dce7de;border-radius:20px;overflow:hidden;box-shadow:0 28px 80px rgba(0,0,0,.3)}
#pModal .phead{display:flex;align-items:center;gap:14px;padding:23px 26px;background:linear-gradient(120deg,#173e31 0%,#28684f 65%,#3d8061 100%);color:#fff}
#pModal .phead-copy{min-width:0;flex:1}
#pModal .peyebrow{margin-bottom:5px;color:#c9e8d4;font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase}
#pModal .phead h2{margin:0;color:#fff;font-size:clamp(22px,3vw,29px);line-height:1.2;letter-spacing:-.5px}
#pModal .pintro{margin:6px 0 0;color:#e1f0e6;font-size:13px;line-height:1.5}
#pModal button{padding:9px 12px;border:1px solid #d5e0d6;border-radius:9px;background:#fff;color:#3a5143;font:inherit;font-weight:650;cursor:pointer;transition:transform .12s,background .12s,border-color .12s}
#pModal button:hover{background:#f0f7f1;border-color:#9fc5aa}
#pModal button:active{transform:scale(.98)}
#pModal .phead button{flex:none;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25);color:#fff}
#pModal .phead button:hover{background:rgba(255,255,255,.2)}
#pModal .pbody{padding:22px 25px 24px}
#pModal .pstats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:20px}
#pModal .pstat{position:relative;min-width:0;padding:15px 15px 14px;border:1px solid #e0e9e1;border-radius:14px;background:#fff;box-shadow:0 3px 10px rgba(27,67,45,.035);overflow:hidden}
#pModal .pstat:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#4b9369}
#pModal .pstat:nth-child(2):before{background:#d4a34a}
#pModal .pstat:nth-child(3):before{background:#d36d63}
#pModal .pstat:nth-child(4):before{background:#7f9aaf}
#pModal .pstat small{display:block;color:#6c7c70;font-size:11px;font-weight:650;line-height:1.4}
#pModal .pstat strong{display:block;margin-top:7px;color:#203d2e;font-size:clamp(17px,2.3vw,23px);font-weight:800;letter-spacing:-.35px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
#pModal .pstat small + small{margin-top:4px;color:#526c59}
#pModal .pform{margin-bottom:17px;padding:19px;border:1px solid #dce7dd;border-radius:15px;background:#fff;box-shadow:0 4px 14px rgba(27,67,45,.035)}
#pModal .pform h3{display:flex;align-items:center;gap:9px;margin:0 0 15px;color:#234733;font-size:17px;letter-spacing:-.2px}
#pModal .pform h3:before{content:"+";display:inline-grid;place-items:center;width:29px;height:29px;border-radius:9px;background:#e4f1e7;color:#286648;font-size:20px;font-weight:500}
#pModal .pfields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px 14px}
#pModal label{display:block;min-width:0;color:#485d4e;font-size:12px;font-weight:750}
#pModal input,#pModal select,#pModal textarea{width:100%;min-width:0;margin-top:6px;padding:10px 11px;border:1px solid #d6e0d7;border-radius:9px;background:#fbfdfb;color:#263a2d;font:14px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;outline:none;transition:border-color .15s,box-shadow .15s}
#pModal input:focus,#pModal select:focus,#pModal textarea:focus{border-color:#3d8a61;box-shadow:0 0 0 3px rgba(61,138,97,.12);background:#fff}
#pModal textarea{min-height:72px;resize:vertical}
#pModal .wide{grid-column:1/-1}
#pModal .pbtns,#pModal .ptools{display:flex;gap:9px;flex-wrap:wrap;margin-top:15px;align-items:center}
#pModal .pbtns .primary{padding:10px 17px;border-color:#236447;background:linear-gradient(135deg,#236447,#347a55);color:#fff;box-shadow:0 4px 10px rgba(35,100,71,.15)}
#pModal .pbtns .primary:hover{background:#194e36}
#pModal .ptools{margin:0 0 12px;padding:12px;border:1px solid #e0e9e1;border-radius:12px;background:#eef4ef}
#pModal .ptools select{width:auto;min-width:155px;margin:0;background:#fff}
#pModal .ptools input{width:auto;flex:1;min-width:140px;max-width:280px;margin:0;background:#fff}
#pModal .ptools button{padding:9px 11px;font-size:12px}
#pModal .ptable{overflow:auto;border:1px solid #dce6dd;border-radius:12px;background:#fff}
#pModal table{border-collapse:separate;border-spacing:0;width:100%;min-width:700px;background:#fff;font-size:13px}
#pModal th,#pModal td{padding:12px 12px;border-bottom:1px solid #edf1ed;text-align:left;vertical-align:top}
#pModal th{background:#eaf2eb;color:#486050;font-size:10px;text-transform:uppercase;letter-spacing:.7px;white-space:nowrap}
#pModal tbody tr:last-child td{border-bottom:0}
#pModal tbody tr:hover{background:#f8fbf8}
#pModal td b{color:#263e2f}
#pModal td small{display:block;margin-top:4px;color:#78867c;font-size:11px;line-height:1.45}
#pModal .pst{display:inline-flex;align-items:center;white-space:nowrap;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800;background:#e8eff7;color:#3c5f83}
#pModal .pst.paid{background:#e1f3e5!important;color:#21683b!important}
#pModal .pst.overdue{background:#ffebe8!important;color:#a33c31!important}
#pModal .pst.today{background:#fff2d7!important;color:#8a5a09!important}
#pModal .pst.scheduled{background:#eaf0fc!important;color:#415fa0!important}
#pModal .pacts{min-width:142px;white-space:nowrap}
#pModal .pacts button{padding:5px 8px;margin:2px;font-size:11px}
#pModal .pacts button[data-a="paid"]{border-color:#b9ddc2;background:#eff9f1;color:#287042}
#pModal .pacts button[data-a="del"]{border-color:#ead3d0;background:#fff7f6;color:#a23d35}
#pModal .pempty{text-align:center;padding:28px 18px;color:#728176}
#pModal .pnote{margin:14px 2px 0;padding:11px 13px;border-left:3px solid #91bba0;border-radius:0 8px 8px 0;background:#eef5ef;color:#5e7163;font-size:11px;line-height:1.6}
@media(max-width:760px){#pModal{padding:6px}#pModal .phead{padding:18px 16px;gap:10px}#pModal .pbody{padding:14px}#pModal .pstats{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}#pModal .pstat{padding:13px 12px}#pModal .pform{padding:15px}#pModal .pfields{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}}
@media(max-width:430px){#pModal .phead{align-items:flex-start;padding:16px 13px}#pModal .phead h2{font-size:21px}#pModal .pintro{font-size:12px}#pModal .phead button{padding:7px 8px;font-size:12px}#pModal .pbody{padding:10px}#pModal .pstats{gap:7px}#pModal .pstat strong{font-size:18px}#pModal .pfields{grid-template-columns:1fr}#pModal .wide{grid-column:auto}#pModal .ptools{padding:9px}#pModal .ptools select,#pModal .ptools input{width:100%;max-width:none;flex:1 1 100%}#pModal .pbtns>*{flex:1}#pModal .pacts{white-space:normal}}
`;document.head.appendChild(st);

let m=document.createElement("div");m.id="pModal";m.hidden=true;m.innerHTML=`<section class="pshell" role="dialog" aria-modal="true"><header class="phead"><div class="phead-copy"><div class="peyebrow">BILLS • DUE DATES • PAYMENT TRACKER</div><h2>Payments Register</h2><p class="pintro">Keep bills organised, track what is due, and record payments in one place.</p></div><button id="pClose" type="button">✕ Close</button></header><div class="pbody"><div class="pstats"><div class="pstat"><small>✓ PAID THIS MONTH</small><strong id="pPaidTotal">₹0.00</strong><small>Total recorded as paid</small></div><div class="pstat"><small>◷ UPCOMING PAYMENTS</small><strong id="pUpCount">0</strong><small id="pUpTotal">₹0.00</small></div><div class="pstat"><small>! OVERDUE PAYMENTS</small><strong id="pOverCount">0</strong><small id="pOverTotal">₹0.00</small></div><div class="pstat"><small>▣ STORAGE</small><strong>On this device</strong><small>Export a backup regularly</small></div></div><form id="pForm" class="pform"><h3 id="pFormTitle">Add a payment</h3><div class="pfields"><label>Payment / bill name *<input id="pName" required maxlength="120" placeholder="e.g. HDFC credit card"></label><label>Category<select id="pCat">${cats.map(x=>`<option>${esc(x)}</option>`).join("")}</select></label><label>Amount (₹) *<input id="pAmount" type="number" min="0" step=".01" required></label><label>Due date *<input id="pDue" type="date" required></label><label>Status<select id="pStatus"><option value="scheduled">Scheduled / unpaid</option><option value="paid">Paid</option></select></label><label>Paid date<input id="pPaid" type="date"></label><label>Repeat<select id="pRepeat"><option value="none">No repeat</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="half-yearly">Half-yearly</option><option value="yearly">Yearly</option></select></label><label>Repeat until (optional)<input id="pEnd" type="date"></label><label>Receipt / transaction reference<input id="pRef" maxlength="160"></label><label class="wide">Notes<textarea id="pNotes" maxlength="1500" placeholder="Bill period or helpful details; never enter passwords, PINs or full card details."></textarea></label></div><div class="pbtns"><button class="primary" type="submit">Save payment</button><button id="pCancel" type="button" hidden>Cancel edit</button><button id="pReset" type="button">Clear form</button></div></form><div class="ptools"><select id="pFilter" aria-label="Filter"><option value="all">All records</option><option value="upcoming">Upcoming / due</option><option value="overdue">Overdue</option><option value="paid">Paid</option></select><input id="pSearch" type="search" placeholder="Search payments"><button id="pExport" type="button">Export backup</button><button id="pImport" type="button">Import backup</button><input id="pFile" type="file" accept=".json,application/json" hidden></div><div class="ptable"><table><thead><tr><th>Payment</th><th>Amount</th><th>Due / paid date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="pRows"></tbody></table></div><p class="pnote">Payments are stored locally in this browser, separately from diary entries. They are not sent to a server. Export a backup regularly, especially before changing devices or clearing browser data. This tool records and schedules bills; it does not pay them automatically. Browser reminders are not guaranteed when Chrome is closed.</p></div></section>`;document.body.appendChild(m);
$("pClose").onclick=()=>$("pModal").hidden=true;m.onclick=e=>{if(e.target===m)m.hidden=true};$("pForm").onsubmit=e=>save(e).catch(x=>alert("Save failed: "+x.message));$("pCancel").onclick=reset;$("pReset").onclick=reset;$("pFilter").onchange=e=>{filter=e.target.value;render()};$("pSearch").oninput=e=>{search=e.target.value;render()};$("pExport").onclick=exportBackup;$("pImport").onclick=()=>$("pFile").click();$("pFile").onchange=e=>importBackup(e.target.files[0]);$("pRows").onclick=async e=>{let b=e.target.closest("button[data-a]");if(!b)return;let r=(await all()).find(x=>x.id===b.dataset.id);if(!r)return;if(b.dataset.a==="edit"){editing=r.id;$("pName").value=r.name;$("pCat").value=r.category;$("pAmount").value=r.amount;$("pDue").value=r.due;$("pStatus").value=r.status;$("pPaid").value=r.paidDate||"";$("pRepeat").value=r.repeat||"none";$("pEnd").value=r.end||"";$("pRef").value=r.reference||"";$("pNotes").value=r.notes||"";$("pFormTitle").textContent="Edit payment";$("pCancel").hidden=false;$("pName").focus()}else if(b.dataset.a==="del"){if(confirm(`Delete "${r.name}" from this device?`)){await del(r.id);await render()}}else if(b.dataset.a==="paid"&&confirm(`Mark "${r.name}" as paid?`))await markPaid(r)};reset()}
async function init(){initUI();await openDB();await render();window.renderPayments=render}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>init().catch(e=>console.error("Payments tab failed",e)));else init().catch(e=>console.error("Payments tab failed",e));
})();
