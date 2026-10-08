import webpush from "npm:web-push@3.6.7";
const SITE="https://raafiuuk-design.github.io/lendas-do-bomba-petch/";
const ORIGIN="https://raafiuuk-design.github.io";
const APIKEY="sb_publishable_Dlgj0c5D_PVKP0h7x6GZ4w_BssxbIoj";
const cors={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"content-type,apikey","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Content-Type":"application/json"};
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
async function db(path:string,method="GET",body?:unknown){
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const r=await fetch(Deno.env.get("SUPABASE_URL")+"/rest/v1/"+path,{method,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"return=representation"},body:body===undefined?undefined:JSON.stringify(body)});
 if(!r.ok)throw new Error("Database request failed: "+r.status);
 return r.status===204?null:await r.json();
}
function validSubscription(s:any){
 try{
 const u=new URL(s.endpoint);
 const hosts=["fcm.googleapis.com","updates.push.services.mozilla.com","web.push.apple.com"];
 const hostOK=hosts.includes(u.hostname)||u.hostname.endsWith(".push.services.mozilla.com")||u.hostname.endsWith(".notify.windows.com");
 return u.protocol==="https:"&&u.port===""&&!u.username&&!u.password&&hostOK&&s.endpoint.length<2048&&/^[A-Za-z0-9_-]{87}$/.test(s.keys?.p256dh)&&/^[A-Za-z0-9_-]{22}$/.test(s.keys?.auth);
 }catch{return false;}
}
async function liveHash(){
 const r=await fetch(SITE+"?push-check="+Date.now(),{signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new Error("Site unavailable");
 const html=await r.text();
 const assets=[...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css|webmanifest)(?:\?[^"']*)?)["']/g)].map(m=>new URL(m[1],SITE).href);
 const contents=await Promise.all([...new Set(assets)].filter(u=>u.startsWith(SITE)).sort().map(async u=>{
 const a=await fetch(u,{signal:AbortSignal.timeout(15000)});if(!a.ok)throw new Error("Asset unavailable");return u+"\n"+await a.text();
 }));
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(html+"\n"+contents.join("\n")));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 try{
 const action=new URL(req.url).searchParams.get("action")||"config";
 const config=(await db("bomba_push_config?id=eq.1&select=*"))[0];
 if(action==="check"){
 if(req.method!=="POST"||req.headers.get("x-bomba-token")!==config.send_token)return respond({error:"Unauthorized"},401);
 const hash=await liveHash();
 if(!config.live_hash){await db("bomba_push_config?id=eq.1","PATCH",{live_hash:hash,checked_at:new Date().toISOString()});return respond({initialized:true});}
 if(hash===config.live_hash){await db("bomba_push_config?id=eq.1","PATCH",{checked_at:new Date().toISOString()});return respond({changed:false});}
 webpush.setVapidDetails(SITE,config.public_key,config.private_key);
 const rows=await db("bomba_push_subscriptions?select=*&limit=1000");
 let sent=0,failed=0;
 for(const row of rows){
 if(row.last_hash===hash)continue;
 try{
 const details=webpush.generateRequestDetails(row.subscription,JSON.stringify({title:"⚽ Bomba Patch atualizado!",body:"Tem novidade na liga! Toque para conferir.",url:SITE,tag:"bomba-update-"+hash.slice(0,12)}),{TTL:86400,contentEncoding:"aes128gcm",urgency:"normal",topic:"bomba-update"});
 const push=await fetch(details.endpoint,{method:details.method,headers:details.headers,body:details.body,redirect:"error",signal:AbortSignal.timeout(10000)});
 if(push.status===404||push.status===410){await db("bomba_push_subscriptions?endpoint=eq."+encodeURIComponent(row.endpoint),"DELETE");continue;}
 if(!push.ok)throw new Error("Push rejected "+push.status);
 await db("bomba_push_subscriptions?endpoint=eq."+encodeURIComponent(row.endpoint),"PATCH",{last_hash:hash});sent++;
 }catch{failed++;}
 }
 await db("bomba_push_config?id=eq.1","PATCH",{...(failed===0?{live_hash:hash}:{}),checked_at:new Date().toISOString(),...(sent?{last_sent_at:new Date().toISOString()}: {})});
 return respond({changed:true,sent,failed});
 }
 if(req.headers.get("origin")!==ORIGIN||req.headers.get("apikey")!==APIKEY)return respond({error:"Unauthorized"},401);
 if(action==="config"&&req.method==="GET")return respond({publicKey:config.public_key});
 if(req.method!=="POST")return respond({error:"Method not allowed"},405);
 const raw=await req.text();if(raw.length>8192)return respond({error:"Too large"},413);
 const data=JSON.parse(raw);
 if(!/^[0-9a-f-]{36}$/i.test(data.capability||""))return respond({error:"Invalid registration"},400);
 if(action==="subscribe"){
 if(!validSubscription(data.subscription))return respond({error:"Invalid subscription"},400);
 const endpoint=data.subscription.endpoint;
 const rows=await db("bomba_push_subscriptions?endpoint=eq."+encodeURIComponent(endpoint)+"&select=capability");
 if(rows.length&&rows[0].capability!==data.capability)return respond({error:"Registration conflict"},409);
 if(rows.length)await db("bomba_push_subscriptions?endpoint=eq."+encodeURIComponent(endpoint),"PATCH",{subscription:data.subscription});
 else await db("bomba_push_subscriptions","POST",{endpoint,subscription:data.subscription,capability:data.capability,last_hash:config.live_hash});
 return respond({subscribed:true});
 }
 if(action==="unsubscribe"){
 if(typeof data.endpoint!=="string")return respond({error:"Invalid endpoint"},400);
 await db("bomba_push_subscriptions?endpoint=eq."+encodeURIComponent(data.endpoint)+"&capability=eq."+encodeURIComponent(data.capability),"DELETE");
 return respond({subscribed:false});
 }
 return respond({error:"Unknown action"},400);
 }catch(e){console.error("Push operation failed",e instanceof Error?e.message:"unknown");return respond({error:"Unable to complete operation"},500);}
});