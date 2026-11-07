const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const isOwner=(request,env)=>Boolean(env.OWNER_EMAIL&&request.headers.get('oai-authenticated-user-id')&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.OWNER_EMAIL.toLowerCase());
export async function api(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/api/letters'&&request.method==='POST'){
  if(request.headers.get('Origin')!==url.origin)return json({error:'Please send your letter from this website.'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Unsupported request.'},415);
  if(Number(request.headers.get('Content-Length'))>18000)return json({error:'Your letter is too long.'},413);
  const raw=await request.text();if(raw.length>16000)return json({error:'Your letter is too long.'},413);
  let data;try{data=JSON.parse(raw);}catch{return json({error:'The letter could not be read.'},400);}
  const name=typeof data.name==='string'?data.name.trim():'';
  const email=typeof data.email==='string'?data.email.trim():'';
  const message=typeof data.message==='string'?data.message.trim():'';
  if(data.website)return json({ok:true});
  if(name.length>120||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||message.length<1||message.length>10000)return json({error:'Please enter a valid email and a letter of up to 10,000 characters.'},400);
  if(!env.BUCKET)return json({error:'The letter box is temporarily unavailable. Please try again shortly.'},503);
  const fingerprint=request.headers.get('CF-Connecting-IP')||request.headers.get('oai-authenticated-user-id')||email;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint+env.OWNER_EMAIL));
  const rateKey='limits/'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const last=await env.BUCKET.get(rateKey);
  if(last&&Date.now()-Number(await last.text())<30000)return json({error:'Please wait 30 seconds before sending another letter.'},429);
  const id=String(9999999999999-Date.now()).padStart(13,'0')+'-'+crypto.randomUUID();
  await env.BUCKET.put('letters/'+id+'.json',JSON.stringify({id,name,email,message,createdAt:new Date().toISOString()}),{httpMetadata:{contentType:'application/json'}});
  await env.BUCKET.put(rateKey,String(Date.now()));
  return json({ok:true},201);
 }
 if(url.pathname==='/api/letters'&&request.method==='GET'){
  if(!isOwner(request,env))return json({error:'Owner access required.'},403);
  if(!env.BUCKET)return json({error:'Inbox temporarily unavailable.'},503);
  const cursor=url.searchParams.get('cursor')||undefined;
  const list=await env.BUCKET.list({prefix:'letters/',limit:100,cursor});
  const letters=await Promise.all(list.objects.map(async item=>{const value=await env.BUCKET.get(item.key);return value?JSON.parse(await value.text()):null;}));
  return json({letters:letters.filter(Boolean),cursor:list.truncated?list.cursor:null});
 }
 if(url.pathname==='/inbox'){
  if(!request.headers.get('oai-authenticated-user-id'))return Response.redirect(url.origin+'/signin-with-chatgpt?return_to=%2Finbox',302);
  if(!isOwner(request,env))return new Response('Owner access required.',{status:403});
  return new Response(INBOX,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; base-uri 'none'; frame-ancestors 'self'"}});
 }
 if(url.pathname.startsWith('/api/'))return json({error:'Not found.'},404);
 return null;
}
const INBOX=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Letters — pltv.ink</title><link rel="stylesheet" href="/styles.css"><style>body{padding:40px 20px}main{max-width:900px;margin:auto}h1{font-size:52px}article{background:#fbfaf6;border-radius:24px;padding:24px;margin:16px 0}article p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5}.sender{color:#6b675f;font-size:14px}</style><main><a href="/">← Back to journal</a><p class="meta">Private correspondence</p><h1 class="hl">Your <i>letters.</i></h1><p id="status" role="status">Loading letters…</p><div id="letters"></div><button id="more" class="cta" hidden>Load more</button></main><script>let cursor='';async function load(){const status=document.querySelector('#status');try{const r=await fetch('/api/letters'+(cursor?'?cursor='+encodeURIComponent(cursor):''));const d=await r.json();if(!r.ok)throw Error(d.error);for(const letter of d.letters){const a=document.createElement('article');const h=document.createElement('h2');h.textContent=letter.name||'A new letter';const from=document.createElement('p');from.className='sender';from.textContent=letter.email+' · '+new Date(letter.createdAt).toLocaleString();const body=document.createElement('p');body.textContent=letter.message;a.append(h,from,body);document.querySelector('#letters').append(a);}cursor=d.cursor;document.querySelector('#more').hidden=!cursor;status.textContent=document.querySelector('#letters').children.length?'':'No letters yet.';}catch(e){status.textContent=e.message;}}document.querySelector('#more').addEventListener('click',load);load();<\/script></html>`;
