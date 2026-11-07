const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const toggle=document.querySelector('.connect-toggle');
const quick=document.querySelector('#connect');
function setConnect(open){quick.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.querySelector('.dot').textContent=open?'↑':'↓';if(open){quick.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});}else{toggle.focus({preventScroll:true});}}
toggle.addEventListener('click',()=>setConnect(quick.hidden));
document.querySelector('.close-connect').addEventListener('click',()=>setConnect(false));
const detail=document.querySelector('#detail');detail.setAttribute('aria-labelledby','detail-title');
const title=document.querySelector('#detail-title');const copy=document.querySelector('#detail-copy');const meta=document.querySelector('#detail-meta');
document.querySelector('.dialog-close').addEventListener('click',()=>detail.close());
detail.addEventListener('click',e=>{if(e.target===detail){const r=detail.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)detail.close();}});
let projectData={};fetch('projects.json').then(r=>r.json()).then(d=>projectData=d).catch(()=>{});
function showDetail(name,body,label='Project notes'){title.textContent=name;copy.textContent=body;meta.textContent=label;document.querySelector('#letter-preview').hidden=true;document.querySelector('#copy-letter').hidden=true;document.querySelector('#copy-status').textContent='';detail.showModal();}
document.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>{const name=b.dataset.project;showDetail(name,(projectData[name]||'Part of Pavel’s independent work in products, identities, and experiments.')+' More details and the project link are coming soon.');}));
document.querySelectorAll('[data-contact]').forEach(b=>b.addEventListener('click',()=>showDetail(b.dataset.contact,'This contact channel hasn’t been added yet. You can use the letter form to get in touch.','Correspondence')));
const form=document.querySelector('#letter');
form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const b=form.querySelector('[type=submit]');const original=b.innerHTML;b.disabled=true;b.textContent='Sending…';const data=Object.fromEntries(new FormData(form));try{const r=await fetch('/api/letters',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await r.json();if(!r.ok)throw new Error(result.error||'Please try again.');form.reset();showDetail('Letter received.','Thank you for writing. Your letter has been saved privately for Pavel.','Correspondence');}catch(err){showDetail('Your letter is still here.',err.message||'The letter could not be saved. Please try again.','Please try again');}finally{b.disabled=false;b.innerHTML=original;}});
