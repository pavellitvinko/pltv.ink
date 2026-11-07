import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
const base=path.resolve(import.meta.dirname,'..');
const files={};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.vcf':'text/vcard; charset=utf-8'};
async function walk(dir){for(const file of await readdir(dir,{withFileTypes:true})){if(file.name==='server'||file.name==='.openai')continue;const full=path.join(dir,file.name);if(file.isDirectory())await walk(full);else{const key='/'+path.relative(path.join(base,'dist'),full);files[key]=[types[path.extname(file.name)]||'application/octet-stream',(await readFile(full)).toString('base64')];}}}
await walk(path.join(base,'dist'));
let api=await readFile(path.join(base,'worker/api.js'),'utf8');api=api.replace('export async function api','async function api');
const worker=api+'\nconst FILES='+JSON.stringify(files)+';\n'+`export default {async fetch(request,env){try{const handled=await api(request,env);if(handled)return handled;let p=new URL(request.url).pathname;if(p==='/')p='/index.html';const file=FILES[p];if(!file)return new Response('Not found',{status:404});if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});const bytes=Uint8Array.from(atob(file[1]),c=>c.charCodeAt(0));return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':file[0],'Cache-Control':p.startsWith('/assets/')?'public,max-age=31536000,immutable':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});}catch{return json({error:'The letter box is temporarily unavailable. Please try again.'},500);}}};\n`;
await mkdir(path.join(base,'dist/server'),{recursive:true});await mkdir(path.join(base,'dist/.openai'),{recursive:true});
const manifest=JSON.parse(await readFile(path.join(base,'.openai/hosting.json'),'utf8'));delete manifest.static;
await writeFile(path.join(base,'.openai/hosting.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(path.join(base,'dist/.openai/hosting.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(path.join(base,'dist/server/index.js'),worker);console.log('Built Worker with '+Object.keys(files).length+' assets.');
