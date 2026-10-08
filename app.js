const userAuth={status:'unauthenticated',user:null,expiresAt:null};
function setAuthSession(data){
 userAuth.status=data&&data.accessToken?'authenticated':'unauthenticated';
 userAuth.user=data&&data.user||null;
 userAuth.expiresAt=data&&data.expiresAt||null;
 try{localStorage.setItem('tecnopreco-auth-state',JSON.stringify({status:userAuth.status,user:userAuth.user,expiresAt:userAuth.expiresAt}))}catch(e){}
}
function authHeaders(){
 const token=window.tecnoprecoAccessToken||'';
 return token?{'Authorization':'Bearer '+token}:{};
}
async function accountRequest(path,body){
 if(!backendRuntime.enabled||!backendRuntime.baseUrl)throw new Error('Backend ainda não configurado');
 const headers={'Content-Type':'application/json',...authHeaders()};
 const r=await fetch(backendRuntime.baseUrl.replace(/\/$/,'')+path,{method:'POST',headers,body:JSON.stringify(body||{})});
 if(r.status===401){setAuthSession({});throw new Error('Sessão expirada');}
 if(!r.ok)throw new Error('Backend respondeu HTTP '+r.status);
 return r.json();
}
async function registerUser(email,password,name){return accountRequest('/api/v1/auth/register',{email,password,name});}
async function loginUser(email,password){const data=await accountRequest('/api/v1/auth/login',{email,password});if(!data||!data.accessToken)throw new Error('Resposta de login inválida');window.tecnoprecoAccessToken=data.accessToken;setAuthSession(data);return data;}
async function logoutUser(){try{await accountRequest('/api/v1/auth/logout',{})}catch(e){}delete window.tecnoprecoAccessToken;setAuthSession({});}
const integrationConfig={
 version:'1.1',
 backendContract:{version:'1.0',request:{method:'POST',path:'/api/v1/prices/sync',body:['sourceId','requestedAt','products']},response:{ok:true,sourceId:'string',syncedAt:'ISO-8601',offers:'array',accepted:'number',rejected:'number',error:'string|null'},statuses:['prepared','connecting','connected','error','stale']},
 mode:'authorized-feeds',
 note:'Os preços reais só devem ser importados através de APIs, feeds ou acordos autorizados pelas respectivas fontes.',
 refreshIntervalMinutes:60,
 sources:{
  pcdiga:{type:'retailer',status:'prepared',method:'authorized-feed-or-api'},
  worten:{type:'retailer',status:'prepared',method:'authorized-feed-or-api'},
  'worten-marketplace':{type:'marketplace',status:'prepared',method:'authorized-feed-or-api'},
  fnac:{type:'retailer',status:'prepared',method:'authorized-feed-or-api'},
  globaldata:{type:'retailer',status:'prepared',method:'authorized-feed-or-api'},
  auchan:{type:'retailer',status:'prepared',method:'authorized-feed-or-api'},
  amazon:{type:'marketplace',status:'prepared',method:'authorized-feed-or-api'},
  fnacmarket:{type:'marketplace',status:'prepared',method:'authorized-feed-or-api'},
  pcdigamarket:{type:'marketplace',status:'prepared',method:'authorized-feed-or-api'}
 }
};
function offerData(o){return {store:o.store,price:Number(o.price)||0,stock:!!o.stock,delivery:o.delivery||'',url:o.url||'',source:o.source||o.store,sourceType:o.sourceType||'demo',verifiedAt:o.verifiedAt||null,confidence:o.confidence||'demo'};}
function offerFreshness(o){if(!o.verifiedAt)return 'Dados de demonstração';const age=Date.now()-new Date(o.verifiedAt).getTime();if(!Number.isFinite(age))return 'Data de verificação inválida';const mins=Math.round(age/60000);return mins<60?'Verificado há '+mins+' min':mins<1440?'Verificado há '+Math.round(mins/60)+' h':'Verificado há '+Math.round(mins/1440)+' d';}
function validateOffer(o){const n=offerData(o);return n.price>0&&n.store&&n.source&&(!n.verifiedAt||!Number.isNaN(new Date(n.verifiedAt).getTime())?n:true);}
function storeLogo(name){const n=String(name||'').toLowerCase();let cls='market',label='MK';if(n.includes('worten')){cls='worten';label='W'}else if(n.includes('fnac')){cls='fnac';label='FNAC'}else if(n.includes('pcdiga')){cls='pcdiga';label='P'}else if(n.includes('globaldata')){cls='globaldata';label='GD'}else if(n.includes('auchan')){cls='auchan';label='A'}else if(n.includes('amazon')){cls='amazon';label='a'}return `<span class="store-logo ${cls}" title="${name}">${label}</span>`}

const mediaLibrary={
 'Telemóveis':['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=85'],
 'Portáteis':['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=85'],
 'Smartwatches':['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1546868871-7041f2a55e7e?auto=format&fit=crop&w=900&q=85'],
 'Áudio':['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=85'],
 'Consolas':['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=900&q=85'],
 'Televisões':['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=900&q=85'],
 'Tablets':['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=900&q=85']
};
function productMedia(p){return (p.gallery&&p.gallery.length?p.gallery:mediaLibrary[p.category]||[]).slice(0,4)}
function mediaImg(url,cls=''){return `<img class="product-real-image ${cls}" src="${url}" alt="Imagem de ${String(window.currentProductName||'produto').replace(/"/g,'&quot;')}" loading="lazy" onerror="this.classList.add('media-failed');this.style.display='none';this.nextElementSibling?.classList.remove('media-fallback-hidden')"><span class="media-fallback media-fallback-hidden">${window.currentProductIcon||'📦'}</span>`}
function selectProductImage(i){document.querySelectorAll('.gallery-thumb').forEach((x,n)=>x.classList.toggle('active',n===i));const main=document.getElementById('galleryMain');const p=window.currentProduct;if(!main||!p)return;const urls=productMedia(p);main.innerHTML=mediaImg(urls[i]||urls[0]);}
const stores=[
{id:'pcdiga',name:'PCDIGA',type:'retailer',affiliate:false},
{id:'worten',name:'Worten',type:'retailer',affiliate:false},
{id:'worten-marketplace',name:'Worten Marketplace',type:'marketplace',affiliate:false},
{id:'fnac',name:'FNAC',type:'retailer',affiliate:false},
{id:'globaldata',name:'Globaldata',type:'retailer',affiliate:false},
{id:'auchan',name:'Auchan',type:'retailer',affiliate:false},
{id:'amazon',name:'Amazon.es',type:'marketplace',affiliate:false},{id:'fnacmarket',name:'FNAC Marketplace',type:'marketplace',affiliate:false},{id:'pcdigamarket',name:'PCDIGA Marketplace',type:'marketplace',affiliate:false}
];
let products=[
{id:1,name:'Samsung Galaxy A56 5G 128 GB',category:'Telemóveis',icon:'📱',spec:['6,7″ Super AMOLED','8 GB','128 GB','5G','50 MP + 12 MP + 5 MP','5 000 mAh'],rating:'4,5',offers:[
 {store:'Worten Marketplace',price:328.00,stock:true,delivery:'Disponível',url:'https://www.worten.pt/produtos/smartphone-samsung-galaxy-a56-5g-6-7-8-gb-128-gb-preto-8368753'},
 {store:'Worten Marketplace',price:330.88,stock:true,delivery:'Disponível',url:'https://www.worten.pt/produtos/smartphone-samsung-galaxy-a56-5g-6-7-dual-sim-8gb-128gb-preto-mrkean-8806095982878'}]},
{id:2,name:'Samsung Galaxy A36 5G 128 GB',category:'Telemóveis',icon:'📱',spec:['6,5″ FHD+','6 GB','128 GB','5G','50 MP + 8 MP + 5 MP','5 000 mAh'],rating:'4,4',offers:[
 {store:'Worten Marketplace',price:299.99,stock:true,delivery:'Disponível',url:'https://www.worten.pt/produtos/galaxy-a36-5g-6gb-128gb-branco-dual-sim-sm-a366-samsung-awesome-white-mrkean-8806095984261'},
 {store:'Worten Marketplace',price:308.52,stock:true,delivery:'Disponível',url:'https://www.worten.pt/produtos/galaxy-a36-5g-6gb-128gb-preto-dual-sim-sm-a366-samsung-awesome-black-mrkean-8806095984087'}]},
{id:3,name:'Samsung Galaxy S24 FE 256 GB',category:'Telemóveis',icon:'📱',spec:['6,7″ Dynamic AMOLED','8 GB','256 GB','5G','50 MP + 12 MP + 8 MP','4 700 mAh'],rating:'4,6',offers:[
 {store:'Worten',price:555.77,stock:true,delivery:'Disponível',url:'https://www.worten.pt/produtos/smartphone-samsung-galaxy-s24-fe-6-7-8-gb-256-gb-grafite-8164354'},
 {store:'Worten Marketplace',price:552.47,stock:true,delivery:'Disponível',url:'https://www.worten.pt/produtos/smartphone-samsung-galaxy-s24-fe-outlet-caixa-aberta-6-7-8-gb-256-gb-grafite-8204796'}]},
{id:4,name:'Samsung Galaxy S24 FE 128 GB',category:'Telemóveis',icon:'📱',spec:['6,7″ Dynamic AMOLED','8 GB','128 GB','5G','50 MP + 12 MP + 8 MP','4 700 mAh'],rating:'4,6',offers:[
 {store:'Worten Marketplace',price:812.97,stock:true,delivery:'Disponível',url:'https://www.worten.pt/produtos/smartphone-samsung-galaxy-s24-fe-6-7-8-gb-128-gb-grafite-8166466'}]},
{id:5,name:'Lenovo IdeaPad Slim 3',category:'Portáteis',icon:'💻',spec:['15,6″ Full HD','16 GB','512 GB SSD','Ryzen 5','Radeon Graphics','47 Wh'],rating:'4,4',offers:[
 {store:'PCDIGA',price:479.90,stock:true,delivery:'1–2 dias',type:'retailer'},{store:'Globaldata',price:489.90,stock:true,delivery:'2–4 dias',type:'retailer'},{store:'FNAC',price:499.99,stock:true,delivery:'2–4 dias',type:'retailer'}]},
{id:6,name:'Xiaomi Watch 2',category:'Smartwatches',icon:'⌚',spec:['1,43″ AMOLED','2 GB','32 GB','GPS','Wear OS','495 mAh'],rating:'4,5',offers:[
 {store:'Globaldata',price:169.90,stock:true,delivery:'2–4 dias',type:'retailer'},{store:'Worten',price:179.90,stock:true,delivery:'2–3 dias',type:'retailer'},{store:'FNAC',price:184.99,stock:true,delivery:'2–4 dias',type:'retailer'}]},
{id:7,name:'Sony WH-1000XM5',category:'Áudio',icon:'🎧',spec:['ANC','30 h','Bluetooth 5.2','Microfones','USB-C','Multiponto'],rating:'4,7',offers:[
 {store:'Worten',price:289.00,stock:true,delivery:'2–3 dias',type:'retailer'},{store:'FNAC',price:299.90,stock:true,delivery:'2–4 dias',type:'retailer'},{store:'PCDIGA',price:294.90,stock:true,delivery:'1–2 dias',type:'retailer'}]},
{id:8,name:'PlayStation 5 Slim',category:'Consolas',icon:'🎮',spec:['4K','1 TB','SSD','120 Hz','Ray Tracing','Wi‑Fi'],rating:'4,8',offers:[
 {store:'Auchan',price:499.99,stock:true,delivery:'2–4 dias',type:'retailer'},{store:'Worten',price:509.99,stock:true,delivery:'2–3 dias',type:'retailer'},{store:'FNAC',price:519.99,stock:true,delivery:'2–4 dias',type:'retailer'}]},
{id:9,name:'Xiaomi Redmi Note 14 5G 6/128 GB',category:'Telemóveis',icon:'📱',spec:['6,67″ AMOLED 120 Hz','6 GB','128 GB','5G','108 MP + 8 MP + 2 MP','5 110 mAh'],rating:'4,5',offers:[
 {store:'Globaldata',price:208.90,stock:true,delivery:'3–5 dias úteis',type:'retailer',url:'https://www.globaldata.pt/smartphone-xiaomi-redmi-note-14-5g-6.67-6-128gb-120hz-roxo/MZB0IO3EU.html'}]},
{id:10,name:'Xiaomi Redmi Note 14 Pro 5G 8/256 GB',category:'Telemóveis',icon:'📱',spec:['6,67″ AMOLED 120 Hz','8 GB','256 GB','5G','200 MP + 8 MP + 2 MP','5 110 mAh'],rating:'4,6',offers:[
 {store:'Globaldata',price:286.90,stock:true,delivery:'3–5 dias úteis',type:'retailer',url:'https://www.globaldata.pt/smartphone-xiaomi-redmi-note-14-pro-5g-6.67-8-256gb-120hz-verde/MZB0IMOEU.html'},
 {store:'Worten Marketplace',price:369.99,stock:true,delivery:'Disponível',type:'marketplace',url:'https://www.worten.pt/produtos/smartphone-xiaomi-redmi-note-14-pro-5g-6-67-8-gb-256-gb-preto-8252255'}]},
{id:11,name:'Xiaomi POCO X7 Pro 5G 12/512 GB',category:'Telemóveis',icon:'📱',spec:['6,67″ AMOLED 120 Hz','12 GB','512 GB','5G','50 MP + 8 MP','6 000 mAh'],rating:'4,6',offers:[
 {store:'Globaldata',price:379.90,stock:true,delivery:'3–5 dias úteis',type:'retailer',url:'https://www.globaldata.pt/MZB0J2DEU.html'}]},


{"id":12,"name":"Xiaomi Redmi Note 14 4G 8/256 GB","category":"Telemóveis","icon":"📱","spec":["6,67″ AMOLED 120 Hz","8 GB","256 GB","4G","108 MP","5 500 mAh"],"rating":"4,5","popularity":72,"offers":[{"store":"Worten","price":159.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":165.59,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":169.59,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":13,"name":"Xiaomi Redmi Note 14 5G 8/256 GB","category":"Telemóveis","icon":"📱","spec":["6,67″ AMOLED 120 Hz","8 GB","256 GB","5G","108 MP","5 110 mAh"],"rating":"4,5","popularity":86,"offers":[{"store":"Worten","price":219.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":227.69,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":233.19,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":14,"name":"Xiaomi Redmi Note 14 Pro 4G 8/256 GB","category":"Telemóveis","icon":"📱","spec":["6,67″ AMOLED 120 Hz","8 GB","256 GB","4G","200 MP","5 500 mAh"],"rating":"4,5","popularity":78,"offers":[{"store":"Worten","price":239.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":248.39,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":254.39,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":15,"name":"Xiaomi Redmi Note 14 Pro+ 5G 8/256 GB","category":"Telemóveis","icon":"📱","spec":["6,67″ AMOLED 120 Hz","8 GB","256 GB","5G","200 MP","5 110 mAh"],"rating":"4,5","popularity":91,"offers":[{"store":"Worten","price":329.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":341.54,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":349.79,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":16,"name":"Xiaomi Redmi Note 14 Pro+ 5G 12/512 GB","category":"Telemóveis","icon":"📱","spec":["6,67″ AMOLED 120 Hz","12 GB","512 GB","5G","200 MP","5 110 mAh"],"rating":"4,5","popularity":83,"offers":[{"store":"Worten","price":379.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":393.29,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":402.79,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":17,"name":"Xiaomi POCO X7 5G 8/256 GB","category":"Telemóveis","icon":"📱","spec":["6,67″ AMOLED 120 Hz","8 GB","256 GB","5G","50 MP","5 110 mAh"],"rating":"4,5","popularity":89,"offers":[{"store":"Worten","price":279.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":289.79,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":296.79,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":18,"name":"Xiaomi POCO X7 Pro 5G 8/256 GB","category":"Telemóveis","icon":"📱","spec":["6,67″ AMOLED 120 Hz","8 GB","256 GB","5G","50 MP","6 000 mAh"],"rating":"4,5","popularity":95,"offers":[{"store":"Worten","price":329.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":341.54,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":349.79,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":19,"name":"Xiaomi POCO F6 5G 12/512 GB","category":"Telemóveis","icon":"📱","spec":["6,67″ AMOLED 120 Hz","12 GB","512 GB","5G","50 MP","5 000 mAh"],"rating":"4,5","popularity":88,"offers":[{"store":"Worten","price":389.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":403.64,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":413.39,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":20,"name":"Xiaomi 14T 5G 12/256 GB","category":"Telemóveis","icon":"📱","spec":["6,67″ AMOLED 144 Hz","12 GB","256 GB","5G","50 MP Leica","5 000 mAh"],"rating":"4,5","popularity":80,"offers":[{"store":"Worten","price":449.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":465.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":476.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":21,"name":"Xiaomi 14T Pro 5G 12/512 GB","category":"Telemóveis","icon":"📱","spec":["6,67″ AMOLED 144 Hz","12 GB","512 GB","5G","50 MP Leica","5 000 mAh"],"rating":"4,5","popularity":76,"offers":[{"store":"Worten","price":599.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":620.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":635.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":22,"name":"Xiaomi 15 5G 12/256 GB","category":"Telemóveis","icon":"📱","spec":["6,36″ AMOLED 120 Hz","12 GB","256 GB","5G","50 MP Leica","5 240 mAh"],"rating":"4,5","popularity":70,"offers":[{"store":"Worten","price":799.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":827.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":847.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":23,"name":"Xiaomi 15 Ultra 5G 16/512 GB","category":"Telemóveis","icon":"📱","spec":["6,73″ AMOLED 120 Hz","16 GB","512 GB","5G","200 MP Leica","5 410 mAh"],"rating":"4,5","popularity":62,"offers":[{"store":"Worten","price":1199.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":1241.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1271.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":24,"name":"Samsung Galaxy A16 5G 4/128 GB","category":"Telemóveis","icon":"📱","spec":["6,7″ Super AMOLED","4 GB","128 GB","5G","50 MP","5 000 mAh"],"rating":"4,5","popularity":82,"offers":[{"store":"Worten","price":149.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":155.24,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":158.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":25,"name":"Samsung Galaxy A26 5G 6/128 GB","category":"Telemóveis","icon":"📱","spec":["6,7″ Super AMOLED 120 Hz","6 GB","128 GB","5G","50 MP OIS","5 000 mAh"],"rating":"4,5","popularity":90,"offers":[{"store":"Worten","price":249.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":258.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":264.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":26,"name":"Samsung Galaxy A36 5G 8/256 GB","category":"Telemóveis","icon":"📱","spec":["6,7″ Super AMOLED 120 Hz","8 GB","256 GB","5G","50 MP OIS","5 000 mAh"],"rating":"4,5","popularity":94,"offers":[{"store":"Worten","price":329.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":341.54,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":349.79,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":27,"name":"Samsung Galaxy A56 5G 8/256 GB","category":"Telemóveis","icon":"📱","spec":["6,7″ Super AMOLED 120 Hz","8 GB","256 GB","5G","50 MP OIS","5 000 mAh"],"rating":"4,5","popularity":97,"offers":[{"store":"Worten","price":399.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":413.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":423.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":28,"name":"Samsung Galaxy S24 5G 8/256 GB","category":"Telemóveis","icon":"📱","spec":["6,2″ Dynamic AMOLED 120 Hz","8 GB","256 GB","5G","50 MP","4 000 mAh"],"rating":"4,5","popularity":92,"offers":[{"store":"Worten","price":549.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":569.24,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":582.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":29,"name":"Samsung Galaxy S24 Ultra 5G 12/512 GB","category":"Telemóveis","icon":"📱","spec":["6,8″ Dynamic AMOLED 120 Hz","12 GB","512 GB","5G","200 MP","5 000 mAh"],"rating":"4,5","popularity":96,"offers":[{"store":"Worten","price":949.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":983.24,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1006.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":30,"name":"Samsung Galaxy S25 5G 12/256 GB","category":"Telemóveis","icon":"📱","spec":["6,2″ Dynamic AMOLED 120 Hz","12 GB","256 GB","5G","50 MP","4 000 mAh"],"rating":"4,5","popularity":93,"offers":[{"store":"Worten","price":799.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":827.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":847.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":31,"name":"Samsung Galaxy S25 Ultra 5G 12/512 GB","category":"Telemóveis","icon":"📱","spec":["6,9″ Dynamic AMOLED 120 Hz","12 GB","512 GB","5G","200 MP","5 000 mAh"],"rating":"4,5","popularity":99,"offers":[{"store":"Worten","price":1199.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":1241.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1271.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":32,"name":"Apple iPhone 13 128 GB","category":"Telemóveis","icon":"📱","spec":["6,1″ OLED","4 GB","128 GB","5G","12 MP + 12 MP","3 227 mAh"],"rating":"4,5","popularity":84,"offers":[{"store":"Worten","price":429.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":445.04,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":455.79,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":33,"name":"Apple iPhone 14 128 GB","category":"Telemóveis","icon":"📱","spec":["6,1″ OLED","6 GB","128 GB","5G","12 MP + 12 MP","3 279 mAh"],"rating":"4,5","popularity":86,"offers":[{"store":"Worten","price":499.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":517.49,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":529.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":34,"name":"Apple iPhone 15 128 GB","category":"Telemóveis","icon":"📱","spec":["6,1″ OLED","6 GB","128 GB","5G","48 MP + 12 MP","3 349 mAh"],"rating":"4,5","popularity":96,"offers":[{"store":"Worten","price":649.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":672.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":688.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":35,"name":"Apple iPhone 15 Pro 256 GB","category":"Telemóveis","icon":"📱","spec":["6,1″ OLED 120 Hz","8 GB","256 GB","5G","48 MP + 12 MP + 12 MP","3 274 mAh"],"rating":"4,5","popularity":90,"offers":[{"store":"Worten","price":899.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":931.49,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":953.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":36,"name":"Apple iPhone 16 128 GB","category":"Telemóveis","icon":"📱","spec":["6,1″ OLED","8 GB","128 GB","5G","48 MP + 12 MP","3 561 mAh"],"rating":"4,5","popularity":98,"offers":[{"store":"Worten","price":749.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":776.24,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":794.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":37,"name":"Apple iPhone 16 Pro 256 GB","category":"Telemóveis","icon":"📱","spec":["6,3″ OLED 120 Hz","8 GB","256 GB","5G","48 MP + 48 MP + 12 MP","3 582 mAh"],"rating":"4,5","popularity":94,"offers":[{"store":"Worten","price":999.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":1034.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1059.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":38,"name":"Apple iPhone 16 Pro Max 256 GB","category":"Telemóveis","icon":"📱","spec":["6,9″ OLED 120 Hz","8 GB","256 GB","5G","48 MP + 48 MP + 12 MP","4 685 mAh"],"rating":"4,5","popularity":97,"offers":[{"store":"Worten","price":1199.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":1241.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1271.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":39,"name":"Xiaomi Redmi Pad SE 8/256 GB","category":"Tablets","icon":"📱","spec":["11″ 90 Hz","8 GB","256 GB","Wi‑Fi","8 MP","8 000 mAh"],"rating":"4,5","popularity":82,"offers":[{"store":"Worten","price":199.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":206.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":211.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":40,"name":"Xiaomi Pad 7 8/256 GB","category":"Tablets","icon":"📱","spec":["11,2″ 144 Hz","8 GB","256 GB","Wi‑Fi","13 MP","8 850 mAh"],"rating":"4,5","popularity":88,"offers":[{"store":"Worten","price":399.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":413.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":423.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":41,"name":"Samsung Galaxy Tab A9+ 8/128 GB","category":"Tablets","icon":"📱","spec":["11″ 90 Hz","8 GB","128 GB","Wi‑Fi","8 MP","7 040 mAh"],"rating":"4,5","popularity":90,"offers":[{"store":"Worten","price":229.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":238.04,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":243.79,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":42,"name":"Samsung Galaxy Tab S9 FE 6/128 GB","category":"Tablets","icon":"📱","spec":["10,9″ 90 Hz","6 GB","128 GB","Wi‑Fi","8 MP","8 000 mAh"],"rating":"4,5","popularity":84,"offers":[{"store":"Worten","price":449.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":465.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":476.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":43,"name":"Samsung Galaxy Tab S10 FE 8/128 GB","category":"Tablets","icon":"📱","spec":["10,9″ 90 Hz","8 GB","128 GB","Wi‑Fi","13 MP","8 000 mAh"],"rating":"4,5","popularity":79,"offers":[{"store":"Worten","price":549.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":569.24,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":582.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":44,"name":"Apple iPad 10.9 64 GB","category":"Tablets","icon":"📱","spec":["10,9″ Liquid Retina","4 GB","64 GB","Wi‑Fi","12 MP","28,6 Wh"],"rating":"4,5","popularity":95,"offers":[{"store":"Worten","price":349.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":362.24,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":370.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":45,"name":"Apple iPad Air 11 128 GB","category":"Tablets","icon":"📱","spec":["11″ Liquid Retina","8 GB","128 GB","Wi‑Fi","12 MP","28,9 Wh"],"rating":"4,5","popularity":91,"offers":[{"store":"Worten","price":599.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":620.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":635.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":46,"name":"Apple iPad Pro 11 256 GB","category":"Tablets","icon":"📱","spec":["11″ Ultra Retina XDR 120 Hz","8 GB","256 GB","Wi‑Fi","12 MP","31,3 Wh"],"rating":"4,5","popularity":78,"offers":[{"store":"Worten","price":999.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":1034.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1059.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":47,"name":"Lenovo IdeaPad 1 Ryzen 5 16/512 GB","category":"Portáteis","icon":"💻","spec":["15,6″ Full HD","16 GB","512 GB SSD","Ryzen 5","Radeon Graphics","47 Wh"],"rating":"4,5","popularity":83,"offers":[{"store":"Worten","price":449.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":465.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":476.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":48,"name":"Lenovo IdeaPad Slim 3 Ryzen 7 16/512 GB","category":"Portáteis","icon":"💻","spec":["15,6″ Full HD","16 GB","512 GB SSD","Ryzen 7","Radeon Graphics","47 Wh"],"rating":"4,5","popularity":89,"offers":[{"store":"Worten","price":579.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":600.29,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":614.79,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":49,"name":"Lenovo LOQ 15 RTX 4050 16/512 GB","category":"Portáteis","icon":"💻","spec":["15,6″ FHD 144 Hz","16 GB","512 GB SSD","Core i5","RTX 4050","60 Wh"],"rating":"4,5","popularity":92,"offers":[{"store":"Worten","price":849.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":879.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":900.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":50,"name":"ASUS Vivobook 15 Ryzen 7 16/512 GB","category":"Portáteis","icon":"💻","spec":["15,6″ Full HD","16 GB","512 GB SSD","Ryzen 7","Radeon Graphics","42 Wh"],"rating":"4,5","popularity":88,"offers":[{"store":"Worten","price":599.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":620.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":635.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":51,"name":"ASUS TUF Gaming A15 RTX 4060 16/512 GB","category":"Portáteis","icon":"💻","spec":["15,6″ FHD 144 Hz","16 GB","512 GB SSD","Ryzen 7","RTX 4060","90 Wh"],"rating":"4,5","popularity":94,"offers":[{"store":"Worten","price":999.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":1034.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1059.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":52,"name":"Acer Aspire 5 i5 16/512 GB","category":"Portáteis","icon":"💻","spec":["15,6″ Full HD","16 GB","512 GB SSD","Core i5","Iris Xe","50 Wh"],"rating":"4,5","popularity":86,"offers":[{"store":"Worten","price":549.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":569.24,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":582.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":53,"name":"Acer Nitro V 15 RTX 4050 16/512 GB","category":"Portáteis","icon":"💻","spec":["15,6″ FHD 144 Hz","16 GB","512 GB SSD","Core i5","RTX 4050","57 Wh"],"rating":"4,5","popularity":90,"offers":[{"store":"Worten","price":799.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":827.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":847.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":54,"name":"HP 15 Ryzen 5 16/512 GB","category":"Portáteis","icon":"💻","spec":["15,6″ Full HD","16 GB","512 GB SSD","Ryzen 5","Radeon Graphics","41 Wh"],"rating":"4,5","popularity":87,"offers":[{"store":"Worten","price":499.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":517.49,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":529.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":55,"name":"HP Victus 15 RTX 4060 16/512 GB","category":"Portáteis","icon":"💻","spec":["15,6″ FHD 144 Hz","16 GB","512 GB SSD","Ryzen 7","RTX 4060","70 Wh"],"rating":"4,5","popularity":91,"offers":[{"store":"Worten","price":949.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":983.24,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1006.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":56,"name":"Apple MacBook Air 13 M3 16/256 GB","category":"Portáteis","icon":"💻","spec":["13,6″ Liquid Retina","16 GB","256 GB SSD","Apple M3","10-core GPU","52,6 Wh"],"rating":"4,5","popularity":96,"offers":[{"store":"Worten","price":949.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":983.24,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1006.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":57,"name":"Apple MacBook Air 15 M3 16/512 GB","category":"Portáteis","icon":"💻","spec":["15,3″ Liquid Retina","16 GB","512 GB SSD","Apple M3","10-core GPU","66,5 Wh"],"rating":"4,5","popularity":90,"offers":[{"store":"Worten","price":1199.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":1241.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1271.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":58,"name":"Apple MacBook Pro 14 M4 16/512 GB","category":"Portáteis","icon":"💻","spec":["14,2″ Liquid Retina XDR","16 GB","512 GB SSD","Apple M4","10-core GPU","72,4 Wh"],"rating":"4,5","popularity":88,"offers":[{"store":"Worten","price":1699.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":1759.49,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1801.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":59,"name":"Samsung 55″ QLED 4K Q70","category":"Televisões","icon":"📺","spec":["55″ QLED 4K","120 Hz","HDR10+","Tizen","HDMI 2.1","Smart TV"],"rating":"4,5","popularity":91,"offers":[{"store":"Worten","price":699.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":724.49,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":741.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":60,"name":"Samsung 65″ QLED 4K Q80","category":"Televisões","icon":"📺","spec":["65″ QLED 4K","120 Hz","HDR10+","Tizen","HDMI 2.1","Smart TV"],"rating":"4,5","popularity":88,"offers":[{"store":"Worten","price":999.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":1034.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1059.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":61,"name":"LG 55″ OLED C4 4K","category":"Televisões","icon":"📺","spec":["55″ OLED 4K","144 Hz","Dolby Vision","webOS","HDMI 2.1","Smart TV"],"rating":"4,5","popularity":95,"offers":[{"store":"Worten","price":1099.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":1138.49,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1165.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":62,"name":"LG 65″ OLED C4 4K","category":"Televisões","icon":"📺","spec":["65″ OLED 4K","144 Hz","Dolby Vision","webOS","HDMI 2.1","Smart TV"],"rating":"4,5","popularity":87,"offers":[{"store":"Worten","price":1499.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":1552.49,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":1589.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":63,"name":"TCL 55″ Mini LED C6K","category":"Televisões","icon":"📺","spec":["55″ Mini LED 4K","144 Hz","HDR10+","Google TV","HDMI 2.1","Smart TV"],"rating":"4,5","popularity":86,"offers":[{"store":"Worten","price":699.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":724.49,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":741.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":64,"name":"Hisense 55″ Mini LED U7N","category":"Televisões","icon":"📺","spec":["55″ Mini LED 4K","144 Hz","Dolby Vision","VIDAA","HDMI 2.1","Smart TV"],"rating":"4,5","popularity":82,"offers":[{"store":"Worten","price":649.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":672.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":688.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":65,"name":"PlayStation 5 Slim Digital","category":"Consolas","icon":"🎮","spec":["4K","1 TB","SSD","120 Hz","Ray Tracing","Wi‑Fi"],"rating":"4,5","popularity":98,"offers":[{"store":"Worten","price":449.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":465.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":476.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":66,"name":"PlayStation 5 Pro 2 TB","category":"Consolas","icon":"🎮","spec":["8K","2 TB","SSD","120 Hz","Ray Tracing avançado","Wi‑Fi 7"],"rating":"4,5","popularity":92,"offers":[{"store":"Worten","price":799.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":827.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":847.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":67,"name":"Xbox Series X 1 TB","category":"Consolas","icon":"🎮","spec":["4K","1 TB","SSD","120 Hz","Ray Tracing","Wi‑Fi 5"],"rating":"4,5","popularity":91,"offers":[{"store":"Worten","price":549.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":569.24,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":582.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":68,"name":"Nintendo Switch OLED 64 GB","category":"Consolas","icon":"🎮","spec":["7″ OLED","64 GB","Dock TV","Joy-Con","720p portátil","Wi‑Fi"],"rating":"4,5","popularity":96,"offers":[{"store":"Worten","price":349.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":362.24,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":370.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":69,"name":"Xiaomi Watch S4","category":"Smartwatches","icon":"⌚","spec":["1,43″ AMOLED","2 GB","32 GB","GPS","HyperOS","486 mAh"],"rating":"4,5","popularity":89,"offers":[{"store":"Worten","price":159.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":165.59,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":169.59,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":70,"name":"Samsung Galaxy Watch7 44 mm","category":"Smartwatches","icon":"⌚","spec":["1,5″ AMOLED","2 GB","32 GB","GPS","Wear OS","425 mAh"],"rating":"4,5","popularity":93,"offers":[{"store":"Worten","price":249.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":258.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":264.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":71,"name":"Samsung Galaxy Watch Ultra","category":"Smartwatches","icon":"⌚","spec":["1,5″ AMOLED","2 GB","32 GB","GPS","Wear OS","590 mAh"],"rating":"4,5","popularity":84,"offers":[{"store":"Worten","price":449.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":465.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":476.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":72,"name":"Apple Watch SE 2 GPS 44 mm","category":"Smartwatches","icon":"⌚","spec":["1,78″ OLED","32 GB","GPS","watchOS","Retina","296 mAh"],"rating":"4,5","popularity":95,"offers":[{"store":"Worten","price":249.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":258.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":264.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":73,"name":"Apple Watch Series 10 46 mm","category":"Smartwatches","icon":"⌚","spec":["1,96″ OLED","64 GB","GPS","watchOS","Always-On","327 mAh"],"rating":"4,5","popularity":92,"offers":[{"store":"Worten","price":449.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":465.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":476.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":74,"name":"Sony WH-1000XM6","category":"Áudio","icon":"🎧","spec":["ANC","30 h","Bluetooth","Microfones","USB-C","Multiponto"],"rating":"4,5","popularity":94,"offers":[{"store":"Worten","price":399.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":413.99,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":423.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":75,"name":"Apple AirPods Pro 2 USB-C","category":"Áudio","icon":"🎧","spec":["ANC","6 h","Bluetooth","Microfones","USB-C","MagSafe"],"rating":"4,5","popularity":97,"offers":[{"store":"Worten","price":249.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":258.74,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":264.99,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
{"id":76,"name":"Samsung Galaxy Buds3 Pro","category":"Áudio","icon":"🎧","spec":["ANC","7 h","Bluetooth","Microfones","USB-C","Hi-Fi"],"rating":"4,5","popularity":90,"offers":[{"store":"Worten","price":229.99,"stock":true,"delivery":"1–2 dias","type":"retailer"},{"store":"FNAC","price":238.04,"stock":true,"delivery":"2–3 dias","type":"retailer"},{"store":"PCDIGA","price":243.79,"stock":true,"delivery":"2–4 dias","type":"retailer"}]},
];
let stockOnly=true, preferredOnly=false, favs=[];
try{favs=JSON.parse(localStorage.getItem('tecnopreco-favs')||'[]')||[]}catch(e){favs=[]}
let priceHistory={};
let priceAlerts={};
try{priceAlerts=JSON.parse(localStorage.getItem('tecnopreco-alerts')||'{}')||{}}catch(e){priceAlerts={}}
try{priceHistory=JSON.parse(localStorage.getItem('tecnopreco-history')||'{}')||{}}catch(e){priceHistory={}}
products.forEach(p=>{p.offers=p.offers.map(o=>offerData(o));});

function saveHistory(id){const p=products.find(x=>x.id===id);if(!p)return;const o=bestOffer(p);const d=new Date().toISOString().slice(0,10);if(!priceHistory[id])priceHistory[id]=[];const arr=priceHistory[id];const last=arr[arr.length-1];if(!last||last.date!==d){arr.push({date:d,price:o.price,store:o.store})}else{last.price=o.price;last.store=o.store}try{localStorage.setItem('tecnopreco-history',JSON.stringify(priceHistory))}catch(e){}showProduct(id);toast('Preço guardado no histórico')}
function historyHtml(id){const h=priceHistory[id]||[];let graph='';if(h.length>1){const vals=h.map(x=>x.price),mn=Math.min(...vals),mx=Math.max(...vals),range=mx-mn||1;graph='<div class="price-chart">'+h.map(x=>{const ht=28+((x.price-mn)/range)*72;return `<div class="price-bar" style="height:${ht}%"><span>${euro(x.price)}</span></div>`}).join('')+'</div><div class="price-chart-label">Evolução dos preços guardados</div>'}if(!h.length)return '<div class="history"><b>📈 Histórico de preço</b><p>Ainda não há registos guardados. Guarda o preço de hoje para começares a acompanhar a evolução.</p></div>';const rows=h.slice().reverse().map(x=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid #edf0f4"><span>${new Date(x.date+'T12:00:00').toLocaleDateString('pt-PT')}</span><strong>${euro(x.price)}</strong><small>${x.store}</small></div>`).join('');return `<div class="history"><b>📈 Histórico de preço</b><div style="margin-top:7px">${rows}</div>${graph}<p>Histórico guardado neste dispositivo.</p></div>`} 
function alertHtml(id){const a=priceAlerts[id],cur=bestOffer(products.find(p=>p.id===id)).price;const reached=a&&cur<=a;return `<div class="alert-box"><b>🔔 Alerta de preço</b><div style="font-size:10px;color:#718096;margin-top:3px">Define o preço que queres atingir. O TecnoPreço guarda o alerta neste dispositivo.</div><div class="alert-row"><input id="alert-${id}" type="number" min="1" step="0.01" placeholder="Preço-alvo (€)" value="${a||''}"><button onclick="setAlert(${id})">${a?'Alterar alerta':'Criar alerta'}</button></div>${a?`<div style="font-size:10px;color:${reached?'#16803a':'#1877f2'};margin-top:7px">${reached?'🎯 Preço-alvo atingido: '+euro(cur):'🔔 Alerta activo para '+euro(a)} · <button style="border:0;background:none;color:#d33;cursor:pointer;padding:0" onclick="removeAlert(${id})">remover</button></div>`:''}</div>`}
function setAlert(id){const v=parseFloat(document.getElementById('alert-'+id).value);if(!v||v<=0)return toast('Indica um preço válido');priceAlerts[id]=v;try{localStorage.setItem('tecnopreco-alerts',JSON.stringify(priceAlerts))}catch(e){}showProduct(id);toast('Alerta de preço criado')}
function quickAlert(id){const p=products.find(x=>x.id===id);if(!p)return;const cur=bestOffer(p).price;const v=prompt('Preço-alvo para '+p.name+' (€):',String(cur.toFixed(2)));if(v===null)return;const n=parseFloat(String(v).replace(',','.'));if(!n||n<=0)return toast('Indica um preço válido');priceAlerts[id]=n;try{localStorage.setItem('tecnopreco-alerts',JSON.stringify(priceAlerts))}catch(e){};toast('🔔 Alerta criado para '+euro(n));renderUserPanel();} function removeAlert(id){delete priceAlerts[id];try{localStorage.setItem('tecnopreco-alerts',JSON.stringify(priceAlerts))}catch(e){}showProduct(id);toast('Alerta removido')}

function showData(){
 const favs=Array.isArray(favorites)?favorites:[];
 const cmp=Array.isArray(compareSelected)?compareSelected:[];
 const data={version:3,date:new Date().toISOString(),favorites:favs,compare:cmp,alerts:priceAlerts,recentSearches:(()=>{try{return JSON.parse(localStorage.getItem('tecnopreco-searches')||'[]')}catch(e){return[]}})(),recentProducts:(()=>{try{return JSON.parse(localStorage.getItem('tecnopreco-recent')||'[]')}catch(e){return[]}})(),history:priceHistory};
 document.getElementById('detail').innerHTML=`<div class="compare-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>💾 Os teus dados</h2></div><p class="compare-note">Podes guardar favoritos, alertas, comparação, pesquisas recentes e histórico de preços neste dispositivo.</p><div style="display:grid;gap:10px;margin-top:14px"><button class="primary" onclick="exportData()">⬇️ Exportar os meus dados</button><label class="shop-link" style="text-align:center;cursor:pointer">⬆️ Importar dados <input type="file" accept="application/json,.json" onchange="importData(event)" style="display:none"></label></div><div class="notice" style="margin-top:14px"><div><b>${favs.length}</b>Favoritos</div><div><b>${Object.keys(priceAlerts||{}).length}</b>Alertas</div><div><b>${cmp.length}</b>Em comparação</div></div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
function showShortcuts(){document.getElementById('detail').innerHTML=`<div class="empty" style="text-align:left"><h3 style="margin-top:0">⌨️ Atalhos do TecnoPreço</h3><div class="source-row"><span><strong>/</strong><small>Abrir a pesquisa</small></span><b>Pesquisa</b></div><div class="source-row"><span><strong>Enter</strong><small>Executar a pesquisa</small></span><b>Pesquisar</b></div><div class="source-row"><span><strong>Esc</strong><small>Limpar pesquisa ou fechar menus</small></span><b>Limpar</b></div><div class="source-row"><span><strong>☰</strong><small>Abrir o menu principal</small></span><b>Menu</b></div></div>`;window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});}
function exportData(){
 const favs=Array.isArray(favorites)?favorites:[],cmp=Array.isArray(compareSelected)?compareSelected:[];
 const data={app:'TecnoPreço',version:3,appRelease:APP_RELEASE,dataVersion:APP_DATA_VERSION,environment:runtimeEnvironment,date:new Date().toISOString(),favorites:favs,compare:cmp,alerts:priceAlerts,priceHistory:priceHistory,recentSearches:(()=>{try{return JSON.parse(localStorage.getItem('tecnopreco-searches')||'[]')}catch(e){return[]}})(),recentProducts:(()=>{try{return JSON.parse(localStorage.getItem('tecnopreco-recent')||'[]')}catch(e){return[]}})()};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tecnopreco-dados.json';a.click();URL.revokeObjectURL(url);toast('Dados exportados com sucesso');
}
function importData(ev){
 const file=ev.target.files&&ev.target.files[0];if(!file)return;
 const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);if(!d||d.app!=='TecnoPreço')throw new Error('ficheiro inválido');
  if(Array.isArray(d.favorites)){favorites=d.favorites.filter(id=>products.some(p=>p.id===id));try{localStorage.setItem('tecnopreco-favs',JSON.stringify(favorites))}catch(e){}}
  if(Array.isArray(d.compare)){compareSelected=d.compare.filter(id=>products.some(p=>p.id===id)).slice(0,3);saveCompare()}
  if(d.alerts&&typeof d.alerts==='object'){priceAlerts=Object.fromEntries(Object.entries(d.alerts).filter(([id,v])=>products.some(p=>p.id===Number(id))&&Number(v)>0));localStorage.setItem('tecnopreco-alerts',JSON.stringify(priceAlerts))}
  if(d.priceHistory&&typeof d.priceHistory==='object'){priceHistory=d.priceHistory;localStorage.setItem('tecnopreco-history',JSON.stringify(priceHistory))}
  if(Array.isArray(d.recentSearches))localStorage.setItem('tecnopreco-searches',JSON.stringify(d.recentSearches.slice(0,6)));
  if(Array.isArray(d.recentProducts))localStorage.setItem('tecnopreco-recent',JSON.stringify(d.recentProducts.slice(0,6)));
  updateCompareBar();showData();toast('Dados importados com sucesso');
 }catch(e){toast('Ficheiro de dados inválido')};};rd.readAsText(file);ev.target.value='';
}

function profileData(){try{return JSON.parse(localStorage.getItem('tecnopreco-profile')||'{}')||{}}catch(e){return {}}}
function showProfile(){
 const p=profileData();
 document.getElementById('detail').innerHTML=`<div class="profile-card"><button class="back" onclick="goHome()">← Voltar</button><h2>👤 A minha conta</h2><p>Personaliza o TecnoPreço neste dispositivo. Não é necessário criar uma conta online.</p><div class="profile-grid"><label>Nome<input id="profileName" maxlength="60" value="${p.name||''}" placeholder="O teu nome"></label><label>Email (opcional)<input id="profileEmail" type="email" maxlength="120" value="${p.email||''}" placeholder="teuemail@exemplo.pt"></label><label>Categoria preferida<select id="profileCat"><option value="">Escolher...</option>${['Telemóveis','Portáteis','Áudio','Gaming','Smartwatches'].map(x=>`<option ${p.category===x?'selected':''}>${x}</option>`).join('')}</select></label></div><div class="profile-actions"><button class="profile-primary" onclick="saveProfile()">💾 Guardar perfil</button><button class="profile-secondary" onclick="clearProfile()">Limpar dados</button></div><div class="profile-note">Os dados do perfil ficam guardados apenas neste dispositivo através do armazenamento do navegador.</div></div>`;window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});}
function saveProfile(){const name=(document.getElementById('profileName').value||'').trim(),email=(document.getElementById('profileEmail').value||'').trim(),category=document.getElementById('profileCat').value;try{localStorage.setItem('tecnopreco-profile',JSON.stringify({name,email,category}))}catch(e){}renderUserPanel();toast('Perfil guardado');}
function clearProfile(){try{localStorage.removeItem('tecnopreco-profile')}catch(e){}showProfile();toast('Dados do perfil apagados')}

function showAlerts(){
 const entries=Object.keys(priceAlerts).map(id=>({id:Number(id),target:Number(priceAlerts[id])})).filter(x=>products.some(p=>p.id===x.id));
 if(!entries.length){document.getElementById('detail').innerHTML='<div class="empty">🔔 Ainda não tens alertas de preço activos.<br><small>Abre um produto e define o preço que queres atingir.</small></div>';window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});return;}
 const rows=entries.map(x=>{const p=products.find(y=>y.id===x.id),cur=bestOffer(p).price,reached=cur<=x.target;return `<div class="shop ${reached?'offer-best':''}"><span><strong>${p.icon} ${p.name}</strong><small>${p.category}</small></span><span><strong>${euro(cur)}</strong><small>${reached?'🎯 Atingido':'Alvo: '+euro(x.target)}</small></span><button class="shop-link" onclick="showProduct(${p.id})">Ver produto</button></div>`}).join('');
 document.getElementById('detail').innerHTML=`<div class="compare-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🔔 Alertas de preço</h2><span class="compare-count">${entries.length} activo${entries.length===1?'':'s'}</span></div><p class="compare-note">Os alertas são guardados neste dispositivo e são avaliados com base nos preços actualmente guardados no TecnoPreço.</p><div class="shops">${rows}</div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
const euro=n=>n.toLocaleString('pt-PT',{style:'currency',currency:'EUR'});
function offersFor(p){return p.offers.slice().sort((a,b)=>a.price-b.price)}
function priceChange(id){
 const h=priceHistory[id]||[];
 if(h.length<2)return null;
 const p=products.find(x=>x.id===id), prev=h[h.length-2].price, cur=bestOffer(p).price, diff=cur-prev;
 return {prev,cur,diff,pct:prev?Math.abs(diff/prev*100):0};
}
function priceChangeHtml(id){
 const c=priceChange(id);
 if(!c)return '';
 if(c.diff<0)return `<div class="price-down">⬇️ Baixou ${euro(Math.abs(c.diff))} (${c.pct.toFixed(1)}%) desde o último registo</div>`;
 if(c.diff>0)return `<div class="price-up">⬆️ Subiu ${euro(c.diff)} (${c.pct.toFixed(1)}%) desde o último registo</div>`;
 return '<div class="price-same">➡️ Preço igual ao último registo</div>';
}
function bestOffer(p){return offersFor(p)[0]}
function priceChangeHtml(id){const h=priceHistory[id]||[];if(h.length<2)return '';const a=h[h.length-2].price,b=h[h.length-1].price,d=a-b;if(!d)return '<span class="price-change price-same">→ Preço sem alteração</span>';const pct=Math.abs(d/a*100);return d>0?`<span class="price-change price-down">⬇️ Baixou ${euro(d)} (${pct.toFixed(1)}%)</span>`:`<span class="price-change price-up">⬆️ Subiu ${euro(-d)} (${pct.toFixed(1)}%)</span>`}
function dealHtml(id){const h=priceHistory[id]||[];if(h.length<2)return '';const prices=h.map(x=>x.price);const min=Math.min(...prices),cur=prices[prices.length-1];if(cur<=min&&cur<prices[0])return '<span class="deal-badge">🔥 Menor preço registado</span>';return ''}
function parseSearch(raw){
 const q=raw.toLowerCase().replace(/€/g,'').replace(/euros?/g,'').replace(/\s+/g,' ').trim();
 let max=null,min=null;
 let m=q.match(/(?:até|ate|máximo|max)\s*(\d+(?:[.,]\d+)?)/);
 if(m) max=parseFloat(m[1].replace(',','.'));
 m=q.match(/(?:a partir de|desde|mínimo|min)\s*(\d+(?:[.,]\d+)?)/);
 if(m) min=parseFloat(m[1].replace(',','.'));
 m=q.match(/(?:entre)\s*(\d+(?:[.,]\d+)?)\s*(?:e|a|-)\s*(\d+(?:[.,]\d+)?)/);
 if(m){min=parseFloat(m[1].replace(',','.'));max=parseFloat(m[2].replace(',','.'));}
 const terms=q.replace(/(?:até|ate|máximo|max|a partir de|desde|mínimo|min|entre)\s*\d+(?:[.,]\d+)?(?:\s*(?:e|a|-)\s*\d+(?:[.,]\d+)?)?/g,'').replace(/\b\d+\s*gb\s*(?:de\s*)?(?:ram|mem[óo]ria|armazenamento|storage)?\b/g,'').replace(/\b\d+\s*tb\s*(?:de\s*)?(?:armazenamento|storage)?\b/g,'').replace(/\b(com|de)\s+(?=(?:5g|4g|wifi|wi-fi|nfc|oled|amoled|ips|ssd|hdd)\b)/g,'').replace(/\b(preço|precos|preços|euros?)\b/g,'').trim();
 let ram=null,storage=null;
 m=q.match(/(?:com|de|mínimo|min)\s*(\d+)\s*gb\s*(?:de\s*)?(?:ram|mem[óo]ria)?/);
 if(m && /ram|mem[óo]ria/.test(q)) ram=parseInt(m[1],10);
 m=q.match(/(\d+)\s*(?:gb|tb)\s*(?:de\s*)?(?:armazenamento|mem[óo]ria|storage)/);
 if(m) storage=parseInt(m[1],10)*(q.includes('tb')?1024:1);
 return {terms,min,max,ram,storage};
}

/* Fase 132 — Recomendações e personalização avançada */
function recommendationProfile(){
 const profile=profileData();
 let searches=[]; try{searches=JSON.parse(localStorage.getItem('tecnopreco-recent-searches')||'[]')}catch(e){}
 const weights={category:{},brand:{},terms:{}};
 const add=(map,key,n)=>{if(!key)return;map[key]=(map[key]||0)+n};
 favs.forEach(id=>{const p=products.find(x=>x.id===id);if(p){add(weights.category,p.category,5);add(weights.brand,p.brand,4)}});
 Object.keys(priceAlerts||{}).forEach(id=>{const p=products.find(x=>x.id===Number(id));if(p){add(weights.category,p.category,4);add(weights.brand,p.brand,3)}});
 searches.forEach(q=>String(q).toLowerCase().split(/\s+/).filter(x=>x.length>2).forEach(t=>add(weights.terms,t,2)));
 if(profile.category)add(weights.category,profile.category,3);
 return weights;
}
function recommendationScore(p,w){
 let score=0;
 score+=(w.category[p.category]||0)*3;
 score+=(w.brand[p.brand]||0)*2;
 const text=(p.name+' '+(p.brand||'')+' '+p.category).toLowerCase();
 Object.entries(w.terms).forEach(([t,v])=>{if(text.includes(t))score+=v});
 if(favs.includes(p.id))score+=8;
 if(priceAlerts[p.id])score+=6;
 const h=priceHistory[p.id]||[]; if(h.length>1&&bestOffer(p).price<h[0].price)score+=3;
 score+=Math.min(3,Number(p.rating)||0)*.25;
 return score;
}
function recommendationReason(p,w){
 if(favs.includes(p.id))return '♥ Semelhante aos teus favoritos';
 if(priceAlerts[p.id])return '🔔 Está nos teus alertas';
 if((w.category[p.category]||0)>0)return '🎯 Baseado nas categorias que acompanhas';
 if((w.brand[p.brand]||0)>0)return '✨ Baseado nas marcas que acompanhas';
 const h=priceHistory[p.id]||[]; if(h.length>1&&bestOffer(p).price<h[0].price)return '📉 Preço em queda';
 return '⭐ Bem avaliado e relevante para explorar';
}
function advancedRecommendations(limit=6){
 const w=recommendationProfile();
 return products.slice().sort((a,b)=>recommendationScore(b,w)-recommendationScore(a,w)||Number(b.rating||0)-Number(a.rating||0)||bestOffer(a).price-bestOffer(b).price).slice(0,limit).map(p=>({p,reason:recommendationReason(p,w),score:recommendationScore(p,w)}));
}
function showRecommendations(){
 const recs=advancedRecommendations(12);
 const cards=recs.map(x=>`<button class="home-card rec-card" onclick="showProduct(${x.p.id})"><span class="hc-icon">${x.p.icon||'📦'}</span><strong>${escapeSecurity(x.p.name)}</strong><small>${x.reason}</small><div class="hc-price">${euro(bestOffer(x.p).price)}</div></button>`).join('');
 const profile=profileData();
 document.getElementById('detail').innerHTML=`<div class="compare-panel rec-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🎯 Recomendações para ti</h2><span class="compare-count">IA LOCAL</span></div><p class="compare-note">O TecnoPreço aprende apenas com sinais guardados neste dispositivo — favoritos, alertas, pesquisas e preferências. Não envia estes dados para terceiros.</p><div class="rec-kpis"><div><b>${recs.length}</b><small>Recomendações</small></div><div><b>${favs.length}</b><small>Favoritos usados</small></div><div><b>${Object.keys(priceAlerts||{}).length}</b><small>Alertas usados</small></div><div><b>${profile.category||'Automática'}</b><small>Preferência</small></div></div><div class="home-grid rec-grid">${cards}</div><div class="rec-note">💡 Quanto mais produtos guardares, pesquisares ou marcares com alerta, mais relevantes ficam estas sugestões.</div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}

function homeCard(p,label){
 const o=bestOffer(p),h=priceHistory[p.id]||[];
 let reason=label;
 if(h.length>1&&o.price<h[0].price){const pct=((h[0].price-o.price)/h[0].price*100);reason=label+' · ↓ '+pct.toFixed(0)+'%'}
 else if(preferredOffer(p))reason=label+' · ★ Loja preferida';
 else if(favs.includes(p.id))reason=label+' · ♥ Favorito';
 return `<button class="home-card" onclick="showProduct(${p.id})"><span class="hc-icon">${p.icon}</span><strong>${p.name}</strong><small>${reason}</small><div class="hc-price">${euro(o.price)}</div></button>`
}
document.addEventListener('DOMContentLoaded',setupQuickSearch);
function renderHome(){
 const valid=products.slice().sort((a,b)=>bestOffer(a).price-bestOffer(b).price);
 const deals=products.filter(p=>(priceHistory[p.id]||[]).length>1).filter(p=>priceChangeHtml(p.id).includes('price-down')).slice(0,3);
 const top=valid.slice(0,3);
 const newest=products.slice(-3).reverse();
 const personalized=products.filter(p=>preferredOffer(p)||favs.includes(p.id)||priceAlerts[p.id]).sort((a,b)=>{
   const score=p=>{let v=0;if(favs.includes(p.id))v+=3;if(priceAlerts[p.id])v+=2;if(preferredOffer(p))v+=1;const h=priceHistory[p.id]||[];if(h.length>1&&bestOffer(p).price<h[0].price)v+=2;return v};
   return score(b)-score(a)||bestOffer(a).price-bestOffer(b).price;
 }).slice(0,3);
 const html=`<div class="quick-actions"><button onclick="showPriceAlerts()">🔔 Alertas</button><button onclick="showRadar()">🔥 Radar</button><button onclick="showStores()">🏪 Lojas preferidas</button><button onclick="showBundles()">📦 Packs</button><button onclick="showCompare()">⚖️ Comparar</button><button onclick="showRecommendations()">🎯 Para ti</button></div><div class="home-head"><b>🎯 Oportunidades para ti</b><span>${personalized.length?'Baseado no que acompanhas':'Personaliza o teu TecnoPreço'}</span></div><div class="home-grid">${(personalized.length?personalized:top).map(p=>homeCard(p,personalized.length?'Recomendado para ti':'Começa por explorar')).join('')}</div><div class="home-head" style="margin-top:12px"><b>🔥 Melhores oportunidades</b><span>Preço mais baixo</span></div><div class="home-grid">${top.map(p=>homeCard(p,'Melhor preço disponível')).join('')}</div><div class="home-head" style="margin-top:12px"><b>📉 Preços que baixaram</b><span>${deals.length?'Detectados no histórico':'Aguardamos histórico'}</span></div><div class="home-grid">${(deals.length?deals:newest).map(p=>homeCard(p,deals.length?'Preço em queda':'Produto em destaque')).join('')}</div><div class="home-head" style="margin-top:12px"><b>⭐ Produtos em destaque</b><span>Explorar</span></div><div class="home-grid">${newest.map(p=>homeCard(p,'Ver ofertas e comparar')).join('')}</div>`;document.getElementById('homeHighlights').innerHTML=html;renderUserPanel();
}

function showPriceAlerts(){
 const ids=Object.keys(priceAlerts||{}).filter(id=>products.some(p=>p.id===Number(id)));
 const rows=ids.map(id=>{const p=products.find(x=>x.id===Number(id));const cur=bestOffer(p).price;const target=Number(priceAlerts[id]);const reached=cur<=target;return `<button class="shop" style="width:100%;text-align:left;cursor:pointer" onclick="showProduct(${p.id})"><span><strong>${p.icon} ${p.name}</strong><small>${reached?'🎯 Preço-alvo atingido':'🔔 Alerta activo'} · alvo ${euro(target)}</small></span><span><strong>${euro(cur)}</strong><small>${reached?'Já atingiu o alvo':'Preço actual'}</small></span></button>`}).join('');
 document.getElementById('detail').innerHTML=`<div class="compare-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🔔 Os meus alertas</h2><span class="compare-count">${ids.length}</span></div><p class="compare-note">Acompanha aqui os preços-alvo que definiste.</p>${rows||'<div class="empty" style="margin-top:12px"><strong>Ainda não tens alertas.</strong><small style="display:block;margin-top:5px">Abre um produto e define um preço-alvo para começares.</small></div>'}</div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}



/* Fase 126 — Segurança e privacidade */
function securityStoreKey(){return 'tecnopreco-privacy-settings'}
function privacySettings(){try{return JSON.parse(localStorage.getItem(securityStoreKey())||'{}')||{}}catch(e){return {}}}
function savePrivacySettings(v){try{localStorage.setItem(securityStoreKey(),JSON.stringify(v||{}));return true}catch(e){return false}}
function escapeSecurity(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function maskEmail(v){const x=String(v||'');const i=x.indexOf('@');if(i<2)return x?'••••':'Não definida';return x.slice(0,2)+'••••'+x.slice(i)}
function showPrivacyCenter(){
 const p=privacySettings(), auth=userAuth?.user||{}, email=auth.email||profileData().email||'';
 document.getElementById('detail').innerHTML=`<div class="compare-panel security-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🛡️ Segurança e privacidade</h2><span class="compare-count">126</span></div><p class="compare-note">Controla os dados guardados neste dispositivo. O TecnoPreço não coloca palavras-passe, tokens ou segredos no catálogo.</p>
 <div class="security-grid">
 <div class="security-card"><strong>🔐 Sessão</strong><span>${userAuth.status==='authenticated'?'Sessão iniciada':'Sem sessão iniciada'}</span><small>${email?escapeSecurity(maskEmail(email)):'Nenhuma conta identificada'}</small></div>
 <div class="security-card"><strong>💾 Dados locais</strong><span>Favoritos, alertas e histórico</span><small>Guardados localmente neste dispositivo.</small></div>
 <div class="security-card"><strong>🔌 Backend</strong><span>${backendRuntime.enabled?'Ligação configurada':'Não configurado'}</span><small>Credenciais devem permanecer no servidor.</small></div></div>
 <div class="security-options"><label><input type="checkbox" ${p.analytics?'checked':''} onchange="togglePrivacy('analytics',this.checked)"> Permitir métricas anónimas</label><label><input type="checkbox" ${p.personalised?'checked':''} onchange="togglePrivacy('personalised',this.checked)"> Recomendações personalizadas</label></div>
 <div class="security-actions"><button class="secondary" onclick="exportPrivacyData()">📦 Exportar os meus dados</button><button class="secondary" onclick="clearLocalPrivacyData()">🧹 Limpar dados locais</button><button class="secondary" onclick="logoutUser();showPrivacyCenter()">🚪 Terminar sessão</button></div>
 <div class="notice" style="margin-top:14px"><b>Boas práticas</b><small style="display:block;margin-top:6px">Usa HTTPS em produção, mantém segredos fora do HTML e aceita preços apenas de fontes autorizadas.</small></div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
function togglePrivacy(key,value){const p=privacySettings();p[key]=!!value;p.updatedAt=new Date().toISOString();savePrivacySettings(p);toast('Preferência de privacidade guardada')}
function exportPrivacyData(){
 const safe={app:'TecnoPreço',version:APP_RELEASE,exportedAt:new Date().toISOString(),privacy:privacySettings(),favorites:Array.isArray(favs)?favs:[],compare:Array.isArray(compareSelected)?compareSelected:[],alerts:priceAlerts||{},recentSearches:JSON.parse(localStorage.getItem('tecnopreco-recent-searches')||'[]')};
 const blob=new Blob([JSON.stringify(safe,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tecnopreco-dados-pessoais.json';a.click();URL.revokeObjectURL(url);toast('Dados exportados')
}
function clearLocalPrivacyData(){if(!confirm('Apagar favoritos, alertas, comparações e histórico deste dispositivo?'))return;['tecnopreco-favs','tecnopreco-favorites','tecnopreco-alerts','tecnopreco-compare','tecnopreco-searches','tecnopreco-recent-searches','tecnopreco-recent','tecnopreco-price-history','tecnopreco-stores','tecnopreco-account'].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});location.reload()}

function renderUserPanel(){
 const favCount=favs.length;
 let alertCount=0; try{alertCount=Object.keys(priceAlerts||{}).filter(id=>products.some(p=>p.id===Number(id))).length}catch(e){}
 let recentCount=0; try{recentCount=JSON.parse(localStorage.getItem('tecnopreco-recent-products')||'[]').length}catch(e){}
 const panel=document.getElementById('userPanel');
 const profile=profileData(); const greeting=profile.name?`Olá, <strong>${profile.name.replace(/[<>]/g,'')}</strong> 👋`:'👤 A tua área TecnoPreço'; if(panel) panel.innerHTML=`<div><h3>${greeting}</h3><p>Um resumo rápido do que estás a acompanhar neste dispositivo.</p><div class="user-stats"><button class="user-stat" onclick="showFavs()"><b>${favCount}</b><span>Favoritos</span></button><button class="user-stat alert" onclick="showAlerts()"><b>${alertCount}</b><span>Alertas</span></button><button class="user-stat" onclick="showCompare()"><b>${compareSelected.length}</b><span>Comparação</span></button></div></div>`;
 const badge=document.getElementById('menuAlertCount');
 if(badge) badge.textContent=alertCount?`(${alertCount})`:'';
}
function setupQuickSearch(){const el=document.getElementById('search');if(!el||el.dataset.quickReady)return;el.dataset.quickReady='1';el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();apply()}else if(e.key==='Escape'){e.preventDefault();clearSearch()}})}
function setupKeyboardShortcuts(){if(window._tecnoKeys)return;window._tecnoKeys=1;document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();const q=document.getElementById('search');if(q){q.focus();q.select()}}if(e.key==='Escape'){const m=document.getElementById('menuOverlay');if(m&&m.classList.contains('open'))toggleMenu()}})}
function clearSearch(){const el=document.getElementById('search');if(el){el.value='';el.focus()}const max=document.getElementById('maxPrice');if(max)max.value='9999';const sf=document.getElementById('storeFilter');if(sf)sf.value='all';stockOnly=false;preferredOnly=false;const sb=document.getElementById('stockBtn');if(sb)sb.classList.remove('active');const pb=document.getElementById('preferredBtn');if(pb)pb.classList.remove('active');apply();toast('Pesquisa e filtros limpos')}
function saveRecentSearch(raw){
 const q=(raw||'').trim(); if(!q)return;
 let arr=[]; try{arr=JSON.parse(localStorage.getItem('tecnopreco-recent-searches')||'[]')}catch(e){}
 arr=[q,...arr.filter(x=>x.toLowerCase()!==q.toLowerCase())].slice(0,6);
 try{localStorage.setItem('tecnopreco-recent-searches',JSON.stringify(arr))}catch(e){}
 renderRecentSearches();
}
function renderRecentSearches(){
 const block=document.getElementById('recentSearches'),list=document.getElementById('recentSearchList'); if(!block||!list)return;
 let arr=[]; try{arr=JSON.parse(localStorage.getItem('tecnopreco-recent-searches')||'[]')}catch(e){}
 if(!arr.length){block.style.display='none';return;}
 block.style.display='block';
 list.innerHTML=arr.map(q=>`<button class="brand-chip" onclick="useRecentSearch(${JSON.stringify(q).replace(/</g,'&lt;')})">🔎 ${q}</button>`).join('');
}
function useRecentSearch(q){document.getElementById('search').value=q;apply();window.scrollTo({top:0,behavior:'smooth'});}
function clearRecentSearches(){try{localStorage.removeItem('tecnopreco-recent-searches')}catch(e){}renderRecentSearches();toast('Pesquisas recentes limpas')}

function compatibilityRules(a,b){
 const ca=(a?.category||'').toLowerCase(), cb=(b?.category||'').toLowerCase();
 const sa=(a?.spec||[]).join(' ').toLowerCase(), sb=(b?.spec||[]).join(' ').toLowerCase();
 const brandA=(a?.brand||'').toLowerCase(), brandB=(b?.brand||'').toLowerCase();
 const out=[];
 const add=(type,msg)=>out.push({type,msg});
 const has=(x,k)=>x.includes(k);
 if(ca==='telemóveis' && cb==='smartwatches' || cb==='telemóveis' && ca==='smartwatches'){
   const phone=ca==='telemóveis'?a:b, watch=ca==='smartwatches'?a:b;
   const wp=(watch.specifications||{}).Sistema||watch.spec?.join(' ')||'';
   const ptxt=(phone.spec||[]).join(' ').toLowerCase();
   const wtxt=String(wp).toLowerCase();
   if(has(ptxt,'iphone')||phone.brand?.toLowerCase()==='apple') add('good','Ecossistema Apple: boa combinação quando o relógio é compatível com iPhone.');
   else if(has(wtxt,'wear os')||has(wtxt,'wearos')) add('good','Wear OS: compatibilidade ampla com Android; confirma requisitos da versão do sistema.');
   else add('warn','Compatibilidade depende do sistema operativo e da aplicação do smartwatch.');
 } else if((ca==='telemóveis'&&cb==='áudio')||(cb==='telemóveis'&&ca==='áudio')){
   add('good',has(sa,'bluetooth')||has(sb,'bluetooth')?'Bluetooth disponível: ligação sem fios provável.':'Confirma o tipo de ligação antes da compra.');
 } else if((ca==='consolas'&&cb==='áudio')||(cb==='consolas'&&ca==='áudio')){
   add('good','Auscultadores podem funcionar por Bluetooth, USB ou ligação ao comando, conforme o modelo.');
 } else if((ca==='portáteis'&&cb==='monitores')||(cb==='portáteis'&&ca==='monitores')){
   add('good','Combinação natural para produtividade/gaming; confirma HDMI, DisplayPort ou USB-C e resolução suportada.');
 } else if((ca==='televisões'&&cb==='consolas')||(cb==='televisões'&&ca==='consolas')){
   const hz=has(sa,'120')||has(sb,'120'); add('good',hz?'Potencial para 120 Hz e gaming de nova geração.':'Boa combinação para gaming; confirma resolução, HDR e taxa de actualização.');
 } else if(ca===cb){
   add('neutral','Produtos da mesma categoria: a comparação serve sobretudo para escolher melhor especificação/preço.');
 } else {
   add('neutral','Compatibilidade geral não pode ser garantida apenas pela categoria. O TecnoPreço vai sinalizar os requisitos conhecidos.');
 }
 if(brandA==='apple' && brandB==='apple') add('good','Mesma marca/ecossistema: integração tende a ser mais simples.');
 return out;
}
function compatibilityBadge(type){return type==='good'?'✓ Compatível provável':type==='warn'?'⚠️ Confirmar compatibilidade':'ℹ️ Compatibilidade a confirmar'}
function showCompatibility(ids){
 const chosen=(ids||compareSelected||[]).map(Number).map(id=>products.find(p=>p.id===id)).filter(Boolean).slice(0,3);
 if(chosen.length<2){toast('Selecciona pelo menos 2 produtos para verificar compatibilidade');return;}
 const pairs=[]; for(let i=0;i<chosen.length;i++)for(let j=i+1;j<chosen.length;j++)pairs.push({a:chosen[i],b:chosen[j],rules:compatibilityRules(chosen[i],chosen[j])});
 const cards=pairs.map(pair=>`<div class="tp-compat-card"><div class="tp-compat-head"><span>${pair.a.icon}</span><strong>${pair.a.name}</strong><b>↔</b><span>${pair.b.icon}</span><strong>${pair.b.name}</strong></div>${pair.rules.map(r=>`<div class="tp-compat-rule ${r.type}"><b>${compatibilityBadge(r.type)}</b><span>${r.msg}</span></div>`).join('')}</div>`).join('');
 document.getElementById('detail').innerHTML=`<div class="compare-panel tp-compat-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🔗 Compatibilidade inteligente</h2><span class="compare-count">${chosen.length} produtos</span></div><p class="compare-note">Análise automática baseada na categoria, especificações e ecossistema. Quando faltarem dados técnicos, o TecnoPreço indica claramente que é necessário confirmar.</p><div class="tp-compat-summary"><span>🧠 Análise automática</span><span>🔌 Ligações e ecossistemas</span><span>⚠️ Sem garantias quando faltam dados</span></div><div class="tp-compat-grid">${cards}</div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}

function shareComparison(){
 const ps=compareSelected.map(id=>products.find(p=>p.id===id)).filter(Boolean);
 if(!ps.length){toast('Selecciona produtos para comparar');return;}
 const ids=ps.map(p=>p.id).join('-');
 const url=location.href.split('#')[0]+'#comparacao-'+ids;
 const text='TecnoPreço — comparação: '+ps.map(p=>p.name).join(', ');
 if(navigator.share) navigator.share({title:'TecnoPreço — Comparação',text,url}).catch(()=>{});
 else if(navigator.clipboard) navigator.clipboard.writeText(url).then(()=>toast('Ligação da comparação copiada')).catch(()=>toast('Não foi possível copiar'));
 else toast('Partilha não disponível neste dispositivo');
}

function saveRecentProduct(id){
 const p=products.find(x=>x.id===id); if(!p)return;
 let arr=[]; try{arr=JSON.parse(localStorage.getItem('tecnopreco-recent-products')||'[]')}catch(e){}
 arr=[id,...arr.filter(x=>x!==id)].slice(0,6);
 try{localStorage.setItem('tecnopreco-recent-products',JSON.stringify(arr))}catch(e){}
 renderRecentProducts();
}
function renderRecentProducts(){
 const block=document.getElementById('recentProducts'),list=document.getElementById('recentProductList'); if(!block||!list)return;
 let arr=[]; try{arr=JSON.parse(localStorage.getItem('tecnopreco-recent-products')||'[]')}catch(e){}
 arr=arr.map(id=>products.find(p=>p.id===id)).filter(Boolean);
 if(!arr.length){block.style.display='none';return;}
 block.style.display='block';
 list.innerHTML=arr.map(p=>`<button class="brand-chip" onclick="showProduct(${p.id});window.scrollTo({top:0,behavior:'smooth'})">${p.icon} ${p.name}</button>`).join('');
}
function clearRecentProducts(){try{localStorage.removeItem('tecnopreco-recent-products')}catch(e){}renderRecentProducts();toast('Produtos vistos recentemente limpos')}

function compareByShare(id){
 const p=products.find(x=>x.id===id); if(!p)return;
 const url=location.href.split('#')[0]+'#comparar-'+id;
 if(navigator.share) navigator.share({title:'TecnoPreço — Comparar',text:'Comparar '+p.name,url}).catch(()=>{});
 else if(navigator.clipboard) navigator.clipboard.writeText(url).then(()=>toast('Ligação de comparação copiada')).catch(()=>{});
}
function populateCatalogFilters(){
 const cf=document.getElementById('categoryFilter'),bf=document.getElementById('brandFilter');
 if(!cf||!bf)return;
 const cats=[...new Set(products.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt'));
 const brands=[...new Set(products.map(p=>p.brand||'').filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt'));
 const oldC=cf.value,oldB=bf.value;
 cf.innerHTML='<option value="all">Todas as categorias</option>'+cats.map(x=>`<option value="${x.replace(/"/g,'&quot;')}">${x}</option>`).join('');
 bf.innerHTML='<option value="all">Todas as marcas</option>'+brands.map(x=>`<option value="${x.replace(/"/g,'&quot;')}">${x}</option>`).join('');
 if(cats.includes(oldC))cf.value=oldC;if(brands.includes(oldB))bf.value=oldB;
}


/* FASE 140 — Desempenho e optimização */
const TP140_PERF={version:'140',startedAt:performance.now(),cache:new Map(),lastRenderMs:0,slowRenders:0};
function tp140Invalidate(){TP140_PERF.cache.clear();}
function tp140IndexProduct(p){
 const id=Number(p.id); const key=String(id)+'|'+(p.name||'')+'|'+(p.brand||'')+'|'+(p.category||'')+'|'+(p.spec||[]).join('|');
 let x=TP140_PERF.cache.get(key); if(x)return x;
 const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const hay=normalize((p.name||'')+' '+(p.category||'')+' '+(p.brand||'')+' '+(p.spec||[]).join(' '));
 x={id,hay}; TP140_PERF.cache.set(key,x); return x;
}
function tp140Best(p){
 const os=Array.isArray(p.offers)?p.offers:[]; if(!os.length)return null;
 let best=os[0]; for(let i=1;i<os.length;i++)if(Number(os[i].price)<Number(best.price))best=os[i]; return best;
}
function tp140PerformanceReport(){
 return {version:'140',catalogProducts:products.length,cacheEntries:TP140_PERF.cache.size,lastRenderMs:Number(TP140_PERF.lastRenderMs.toFixed(2)),slowRenders:TP140_PERF.slowRenders,uptimeMs:Math.round(performance.now()-TP140_PERF.startedAt),accessibility:'v141'};
}
function showPerformance(){
 const r=tp140PerformanceReport();
 document.getElementById('detail').innerHTML=`<div class="compare-panel tp140-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>⚡ Desempenho e optimização</h2><span class="compare-count">FASE 140</span></div><p class="compare-note">Diagnóstico local do desempenho da interface. O TecnoPreço optimiza pesquisa, ordenação, actualização do catálogo e utilização de memória sem alterar a experiência futurista.</p><div class="tp140-kpis"><div><b>${r.catalogProducts}</b><small>produtos em memória</small></div><div><b>${r.cacheEntries}</b><small>entradas de índice</small></div><div><b>${r.lastRenderMs} ms</b><small>último render</small></div><div><b>${r.slowRenders}</b><small>renders lentos</small></div></div><div class="tp140-list"><div>⚡ Pesquisa com índice local e normalização reutilizável</div><div>🖼️ Imagens com <code>loading="lazy"</code> e fallback</div><div>📦 Catálogo carregado uma vez e reutilizado em memória</div><div>💾 Actualizações locais agrupadas e sem chamadas externas desnecessárias</div><div>📱 CSS responsivo e componentes leves para telemóvel</div><div>🌐 Backend preparado para sincronização autorizada sem bloquear a interface</div></div><div class="admin-actions"><button class="secondary" onclick="showPerformance()">↻ Actualizar diagnóstico</button><button class="secondary" onclick="tp140Invalidate();apply();toast('⚡ Cache de pesquisa optimizada')">🧹 Limpar cache</button></div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}

function tp143ApplyCore(){
 const raw=document.getElementById('search').value, parsed=parseSearch(raw);
 const maxControl=+document.getElementById('maxPrice').value;
 let max=parsed.max==null?maxControl:parsed.max, min=parsed.min==null?0:parsed.min;
 const q=parsed.terms, sort=document.getElementById('sort').value;
 if(raw.trim())saveRecentSearch(raw);
 const featureMatch=p=>{
   const specs=(p.spec||[]).join(' ').toLowerCase();
   const ramOk=parsed.ram==null || new RegExp('\\b'+parsed.ram+'\\s*gb\\b').test(specs);
   const storageOk=parsed.storage==null || new RegExp('\\b'+parsed.storage+'\\s*gb\\b').test(specs);
   return ramOk&&storageOk;
 };
 const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const aliases={
   'ecra':['ecrã','display','screen'],'display':['ecrã','display','screen'],
   '5g':['5g'],'4g':['4g'],'amoled':['amoled','dynamic amoled'],'oled':['oled','amoled'],
   'ips':['ips'],'ssd':['ssd'],'hdd':['hdd'],'4k':['4k'],'120hz':['120 hz','120hz'],
   '90hz':['90 hz','90hz'],'camera':['mp','câmara','camera'],'camara':['mp','câmara','camera'],
   'bateria':['mah','bateria','battery'],'anc':['anc'],'bluetooth':['bluetooth'],
   'wifi':['wi-fi','wifi'],'nfc':['nfc'],'gps':['gps'],'ray':['ray tracing'],'tracing':['ray tracing']
 };
 const words=q.split(/[^a-z0-9à-ÿ]+/).filter(Boolean);
 let list=products.filter(p=>{
   const specs=(p.spec||[]).join(' ');
   const hay=tp140IndexProduct(p).hay;
   const matches=!words.length||words.every(w=>{
     const nw=normalize(w);
     if(aliases[nw]) return aliases[nw].some(a=>hay.includes(normalize(a)));
     if(/^\d+$/.test(nw)) return hay.includes(nw);
     return hay.includes(nw);
   });
   const sf=document.getElementById('storeFilter').value;
   const cf=document.getElementById('categoryFilter')?.value||'all';
   const bf=document.getElementById('brandFilter')?.value||'all';
   const categoryMatch=cf==='all'||p.category===cf;
   const brandMatch=bf==='all'||(p.brand||'')===bf;
   const scopedOffers=sf==='all'?p.offers:p.offers.filter(x=>x.store.toLowerCase()===sf.toLowerCase());
   if(!scopedOffers.length)return false;
   const o=scopedOffers.slice().sort((a,b)=>a.price-b.price)[0];
   const stockMatch=!stockOnly||scopedOffers.some(x=>x.stock);
   const pref=!!preferredOffer(p);
   const prefMatch=!preferredOnly||pref;
   return matches&&categoryMatch&&brandMatch&&featureMatch(p)&&o.price>=min&&o.price<=max&&stockMatch&&prefMatch;
 });
 if(sort==='price')list.sort((a,b)=>{const pa=preferredOffer(a)?0:1,pb=preferredOffer(b)?0:1;return pa-pb||bestOffer(a).price-bestOffer(b).price});else if(sort==='high')list.sort((a,b)=>bestOffer(b).price-bestOffer(a).price);else if(sort==='popular')list.sort((a,b)=>(Number(b.popularity)||0)-(Number(a.popularity)||0)||bestOffer(a).price-bestOffer(b).price);else if(sort==='deal')list.sort((a,b)=>{const score=p=>{const h=priceHistory[p.id]||[];if(h.length<2)return 0;const first=h[0].price,cur=bestOffer(p).price;return first>0?(first-cur)/first:0};return score(b)-score(a)||bestOffer(a).price-bestOffer(b).price});else list.sort((a,b)=>{const pa=preferredOffer(a)?0:1,pb=preferredOffer(b)?0:1;return pa-pb||a.name.localeCompare(b.name)});
 render(list);
const criteria=[];
if(parsed.ram)criteria.push('RAM '+parsed.ram+' GB');
if(parsed.storage)criteria.push('armazenamento '+(parsed.storage>=1024?(parsed.storage/1024)+' TB':parsed.storage+' GB'));
if(parsed.min!=null)criteria.push('mín. '+euro(parsed.min));
if(parsed.max!=null)criteria.push('máx. '+euro(parsed.max));
document.getElementById('sourceStatus').textContent=raw.trim()?(criteria.length?'Pesquisa: '+raw.trim()+' · '+criteria.join(' · '):'Pesquisa: '+raw.trim()):'Todos os produtos';
}
function render(list){
 const t0=performance.now();
 tp143RenderCore(list);
 tp143Perf.lastRenderMs=Math.round((performance.now()-t0)*100)/100;
}
function apply(){
 const t0=performance.now();
 tp143ApplyCore();
 tp143Perf.lastSearchMs=Math.round((performance.now()-t0)*100)/100;
}
let compareSelected=[];
try{compareSelected=JSON.parse(localStorage.getItem('tecnopreco-compare')||'[]').filter(id=>products.some(p=>p.id===id)).slice(0,3)}catch(e){compareSelected=[]}
function priceOpportunityScore(p){
 const h=(priceHistory[p.id]||[]).map(x=>Number(x.price)).filter(Number.isFinite);
 const cur=bestOffer(p)?.price||Infinity;
 if(!Number.isFinite(cur)) return {score:0,cur,dropPct:0,vsMin:0,vsAvg:0};
 const avg=h.length?h.reduce((a,b)=>a+b,0)/h.length:cur;
 const min=h.length?Math.min(...h):cur;
 const max=h.length?Math.max(...h):cur;
 const previous=h.length>1?h[h.length-2]:cur;
 const dropPct=previous>0?Math.max(0,(previous-cur)/previous*100):0;
 const vsAvg=avg>0?Math.max(0,(avg-cur)/avg*100):0;
 const vsMin=min>0?Math.max(0,(cur-min)/min*100):0;
 const range=max>min?Math.max(0,Math.min(100,(max-cur)/(max-min)*100)):0;
 const stock=offersFor(p).some(o=>o.stock)?5:0;
 const rating=Number(p.rating)||0;
 const score=Math.min(100,dropPct*7+vsAvg*3+range*.35+stock+rating*.6);
 return {score,cur,dropPct,vsAvg,vsMin,min,avg,max};
}
function showPriceEngine(){
 const rows=products.map(p=>({p,m:priceOpportunityScore(p)})).filter(x=>x.m.score>0).sort((a,b)=>b.m.score-a.m.score).slice(0,12);
 const html=rows.map(x=>`<div class="price-op-row"><div class="price-op-main"><span>${x.p.icon||'🏷️'}</span><div><strong>${escapeSecurity(x.p.name)}</strong><small>${euro(x.m.cur)} · média ${euro(x.m.avg)} · mínimo ${euro(x.m.min)}</small></div></div><div class="price-op-metrics"><b>${x.m.score.toFixed(0)}/100</b><small>${x.m.dropPct>=1?'↓ '+x.m.dropPct.toFixed(1)+'%':'Boa posição'}</small></div><button class="shop-link" onclick="showProduct(${x.p.id})">Ver</button></div>`).join('');
 const avgScore=rows.length?rows.reduce((a,x)=>a+x.m.score,0)/rows.length:0;
 document.getElementById('detail').innerHTML=`<div class="compare-panel price-engine-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>💰 Motor de oportunidades</h2><span class="compare-count">${rows.length} oportunidades</span></div><div class="price-engine-kpis"><div><b>${avgScore.toFixed(0)}</b><small>score médio</small></div><div><b>${rows.filter(x=>x.m.dropPct>=5).length}</b><small>quedas ≥ 5%</small></div><div><b>${rows.filter(x=>x.m.vsMin<3).length}</b><small>perto do mínimo</small></div></div><p class="compare-note">O score é calculado localmente a partir do histórico disponível, preço actual, média histórica, mínimo histórico, stock e avaliação. É indicativo e não representa dados de mercado em tempo real.</p><div class="price-op-list">${html||'<div class="empty">Ainda não há histórico suficiente para calcular oportunidades.</div>'}</div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
function radarDeals(){showPriceEngine()}

function saveCompare(){try{localStorage.setItem('tecnopreco-compare',JSON.stringify(compareSelected))}catch(e){}}
function updateCompareBar(){
 const bar=document.getElementById('compareBar');
 if(!bar)return;
 const n=compareSelected.length;
 bar.innerHTML=`<span>⚖️ <b>Comparação</b> — ${n?`<b>${n}/3</b> produto${n===1?'':'s'} seleccionado${n===1?'':'s'}.`:'selecciona até 3 produtos nos resultados.'}</span><button onclick="showCompare()">${n?'Comparar agora':'Comparar'}</button>`;
}
function toggleCompare(id){
 const p=products.find(x=>x.id===id); if(!p)return;
 const i=compareSelected.indexOf(id);
 if(i>=0){compareSelected.splice(i,1);toast('Produto removido da comparação')}
 else if(compareSelected.length>=3){toast('Podes comparar no máximo 3 produtos')}
 else{compareSelected.push(id);toast('Produto adicionado à comparação')}
 saveCompare();
 updateCompareBar();
 renderUserPanel();
 const btn=document.getElementById('compare-'+id);
 if(btn)btn.textContent=compareSelected.includes(id)?'✓ Na comparação':'+ Comparar';
}
function showCompare(){
 if(!compareSelected.length)return toast('Selecciona pelo menos um produto');
 const items=compareSelected.map(id=>products.find(x=>x.id===id)).filter(Boolean);
 const labels=['Preço mais baixo','Loja','Ofertas','Ecrã','RAM','Armazenamento','Rede','Câmara','Bateria'];
 const prices=items.map(p=>bestOffer(p).price);
 const minPrice=Math.min(...prices);
 const cells=items.map(p=>{const o=bestOffer(p),sp=p.spec||[];const vals=[euro(o.price),o.store,p.offers.length,sp[0]||'—',sp[1]||'—',sp[2]||'—',sp[3]||'—',sp[4]||'—',sp[5]||'—'];return {p,vals,best:o.price===minPrice}});
 const head=cells.map(x=>`<th>${x.p.icon} ${x.p.name}<br><span class="compare-count">${x.p.category||''}</span></th>`).join('');
 const rows=labels.map((label,i)=>`<tr><td>${label}</td>${cells.map(x=>`<td class="${i===0&&x.best?'best-value':''}">${x.vals[i]}</td>`).join('')}</tr>`).join('');
 const actions=cells.map(x=>`<button onclick="showProduct(${x.p.id})">Ver ${x.p.name.split(' ').slice(0,3).join(' ')}</button>`).join('');
 const maxPrice=Math.max(...prices),diff=maxPrice-minPrice;
 const summary=`<div class="compare-summary"><b>💶 Diferença de preço: ${euro(diff)}</b><span>Entre o produto mais barato e o mais caro desta comparação.</span></div>`;
 document.getElementById('detail').innerHTML=`<div class="compare-panel"><button class="back" onclick="document.getElementById('detail').innerHTML='<div class=\'empty\'>Selecciona um produto para veres os detalhes.</div>'">← Voltar</button><div class="compare-head"><h2>⚖️ Comparar produtos</h2><span class="compare-count">${items.length}/3 seleccionados</span></div><p class="compare-note">Os valores apresentados correspondem às ofertas actualmente guardadas no TecnoPreço. O preço a verde é o mais baixo entre os produtos seleccionados.</p>${summary}<div style="overflow-x:auto"><table class="compare-table"><thead><tr><th>Característica</th>${head}</tr></thead><tbody>${rows}</tbody></table></div><div class="compare-actions-top">${actions}<button onclick="window.print()">🖨️ Imprimir</button><button class="secondary" onclick="tp145ShareComparison()">🔗 Partilhar</button><button class="primary" onclick="compareSelected=[];saveCompare();updateCompareBar();showCompare()">Limpar comparação</button></div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}

function preferredStoreIds(){try{return JSON.parse(localStorage.getItem('tecnopreco-stores')||'[]')}catch(e){return []}}
function preferredOffer(p){const ids=preferredStoreIds();return p.offers.filter(o=>{const st=stores.find(s=>s.name===o.store);return st&&ids.includes(st.id)}).sort((a,b)=>a.price-b.price)[0]||null}
function tp143RenderCore(list){
 const __tp140Start=performance.now();
 let offers=list.reduce((n,p)=>n+p.offers.length,0);
 document.getElementById('count').textContent=list.length+' resultado'+(list.length===1?'':'s');
 document.getElementById('offerCount').textContent=offers;
 document.getElementById('results').innerHTML=list.length?list.map(p=>{let o=bestOffer(p), selected=compareSelected.includes(p.id), po=preferredOffer(p); let alertTarget=null; try{alertTarget=priceAlerts[p.id]||null}catch(e){}; let alertReached=alertTarget&&o.price<=Number(alertTarget);let prefStores=[];try{prefStores=JSON.parse(localStorage.getItem('tecnopreco-stores')||'[]')}catch(e){};let pref=prefStores.some(s=>p.offers.some(of=>String(of.store).toLowerCase().replace(/\s+/g,'-')===s||of.store.toLowerCase()===stores.find(st=>st.id===s)?.name.toLowerCase()));return `<button class="product ${pref?'preferred-store-product':''}" onclick="showProduct(${p.id})"><span class="pic">${mediaImg(productMedia(p)[0]||'')}</span><span><span class="name">${p.name}</span><span class="price">${euro(o.price)}<br>${priceChangeHtml(p.id)}${dealHtml(p.id)}</span><span class="store">desde ${storeLogo(o.store)}${o.store} · ${p.offers.length} ofertas</span>${po?`<span class="badge" style="background:#fff4d6;color:#8a6100">⭐ ${po.store} é preferida · ${euro(po.price)}</span>`:''}${alertTarget?`<span class="badge" style="background:${alertReached?'#e8f7ed':'#eef4ff'};color:${alertReached?'#18733a':'#2457a6'}">🔔 ${alertReached?'Preço-alvo atingido':'Alvo '+euro(Number(alertTarget))}</span>`:''}${pref?'<span class="preferred-store-badge">★ Loja preferida</span>':''}${o.stock?'<span class="badge">✓ MELHOR PREÇO</span>':'<span class="badge" style="background:#fff1d9;color:#9a6500">Disponibilidade limitada</span>'}<span class="compare-mini" onclick="event.stopPropagation();toggleCompare(${p.id})">${selected?'✓ Na comparação':'+ Comparar'}</span><span class="compare-mini" onclick="event.stopPropagation();quickAlert(${p.id})">🔔 Alertar</span></span><span class="heart ${favs.includes(p.id)?'on':''}" onclick="event.stopPropagation();fav(${p.id})">${favs.includes(p.id)?'♥':'♡'}</span></button>`}).join(''):'<div class="empty">Não encontrei produtos com estes critérios.</div>';
 updateCompareBar();
 TP140_PERF.lastRenderMs=performance.now()-__tp140Start; if(TP140_PERF.lastRenderMs>100)TP140_PERF.slowRenders++;
}
function savingsHtml(p){
 const os=offersFor(p);
 if(os.length<2)return '';
 const best=os[0].price, last=os[os.length-1].price, save=last-best;
 if(save<=0)return '';
 const pct=last?(save/last*100):0;
 return `<div class=\"savings\"><b>💶 Poupança possível: ${euro(save)}</b><span>Diferença entre a oferta mais barata e a mais cara (${pct.toFixed(1)}%).</span></div>`;
}
function productBreadcrumb(p){return `<div class="breadcrumb">Início › ${p.category} › ${p.name}</div>`}
function productTrust(p){return `<div class="trust-row"><span>✓ Preços comparados</span><span>🔒 Navegação segura</span><span>↗ Links para lojas</span></div>`}
function priceHistoryCard(id){
 const h=Array.isArray(priceHistory[id])?priceHistory[id].slice(-8):[];
 if(!h.length)return '<div class="empty" style="margin-top:12px"><strong>📈 Histórico de preços</strong><small style="display:block;margin-top:5px">Ainda não existem registos suficientes para este produto.</small></div>';
 const vals=h.map(x=>Number(x.price)||0).filter(v=>v>0), min=Math.min(...vals), max=Math.max(...vals), last=vals[vals.length-1];
 const range=Math.max(max-min,1), bars=h.map(x=>{const v=Number(x.price)||0;const pct=30+((v-min)/range)*70;const d=x.date?new Date(x.date).toLocaleDateString('pt-PT',{day:'2-digit',month:'2-digit'}):'—';return `<div title="${d} · ${euro(v)}" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:96px;flex:1;min-width:20px"><small style="font-size:9px;color:#718096">${euro(v)}</small><div style="width:72%;height:${pct}%;min-height:8px;border-radius:6px 6px 3px 3px;background:var(--accent,#1877f2)"></div><small style="font-size:9px;color:#718096;margin-top:4px">${d}</small></div>`}).join('');
 return `<div class="compare-panel" style="margin-top:14px"><div class="compare-head"><h3 style="margin:0">📈 Histórico de preços</h3><span class="compare-count">${h.length} registos</span></div><div style="display:flex;gap:4px;align-items:flex-end;margin-top:10px">${bars}</div><div class="notice" style="margin-top:10px"><div><b>Mínimo</b>${euro(min)}</div><div><b>Máximo</b>${euro(max)}</div><div><b>Actual</b>${euro(last)}</div></div></div>`;
}
function priceTrendSummary(id){
 const h=Array.isArray(priceHistory[id])?priceHistory[id]:[];
 if(h.length<2)return '';
 const vals=h.map(x=>Number(x.price)||0).filter(v=>v>0);
 if(vals.length<2)return '';
 const first=vals[0],cur=vals[vals.length-1],min=Math.min(...vals),max=Math.max(...vals);
 const diff=cur-first,pct=first?(diff/first*100):0;
 const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
 const cls=diff<0?'price-down':diff>0?'price-up':'price-same';
 const label=diff<0?'⬇️ Descida desde o primeiro registo':diff>0?'⬆️ Subida desde o primeiro registo':'➡️ Sem alteração desde o primeiro registo';
 return `<div class="compare-panel" style="margin-top:12px"><div class="compare-head"><h3 style="margin:0">📊 Resumo da evolução</h3><span class="compare-count">${vals.length} registos</span></div><div class="notice" style="margin-top:10px"><div><b>Inicial</b>${euro(first)}</div><div><b>Actual</b>${euro(cur)}</div><div><b>Média</b>${euro(avg)}</div><div><b>Mínimo</b>${euro(min)}</div></div><div class="${cls}" style="margin-top:9px">${label}: ${euro(Math.abs(diff))} (${Math.abs(pct).toFixed(1)}%) · máximo histórico ${euro(max)}</div></div>`;
}

function specLabelsForCategory(category){
 const maps={
  'Telemóveis':['Ecrã','RAM','Armazenamento','Rede','Câmara','Bateria'],
  'Portáteis':['Ecrã','RAM','Armazenamento','Processador','Gráficos','Bateria'],
  'Smartwatches':['Ecrã','RAM','Armazenamento','GPS','Sistema','Bateria'],
  'Tablets':['Ecrã','RAM','Armazenamento','Rede','Câmaras','Bateria'],
  'Consolas':['Resolução','Armazenamento','Armazenamento','Taxa de actualização','Gráficos','Conectividade'],
  'Televisões':['Painel','Resolução','HDR','Sistema','HDMI','Smart TV'],
  'Áudio':['Tecnologia','Autonomia','Bluetooth','Microfones','Ligação','Multiponto'],
  'Câmaras':['Sensor','Vídeo','Fotografia','Estabilização','Conectividade','Formato'],
  'Monitores':['Painel','Resolução','Taxa de actualização','Tempo de resposta','Conectividade','HDR'],
  'Componentes':['Tipo','Capacidade','Interface','Velocidade','Formato','Compatibilidade'],
  'Acessórios':['Tipo','Compatibilidade','Ligação','Autonomia','Material','Funções']
 };
 return maps[category]||['Característica 1','Característica 2','Característica 3','Característica 4','Característica 5','Característica 6'];
}

function showProduct(id){
 saveRecentProduct(id);
 window.currentProduct=products.find(x=>x.id===id); window.currentProductName=window.currentProduct?.name||'produto'; window.currentProductIcon=window.currentProduct?.icon||'📦';
 let p=products.find(x=>x.id===id), os=offersFor(p).slice().sort((a,b)=>a.price-b.price);
 const best=os[0]?.price||0;
 const bestStock=os.filter(o=>o.stock).sort((a,b)=>a.price-b.price)[0]||os[0];
 const pref=preferredOffer(p);
 if(pref){ os.sort((a,b)=>{const ap=a.store===pref.store?0:1,bp=b.store===pref.store?0:1;return ap-bp||a.price-b.price;}); }
 document.getElementById('detail').innerHTML=`${productBreadcrumb(p)}${productTrust(p)}<div class="market-note">Worten e Worten Marketplace são apresentados como ofertas distintas.</div><button class="back" onclick="document.getElementById('detail').innerHTML='<div class=\'empty\'>Selecciona um produto para veres os detalhes.</div>'">← Voltar</button>
 <div class="hero"><div class="product-gallery"><div id="galleryMain" class="gallery-main">${mediaImg(productMedia(p)[0]||'')}</div><div class="gallery-thumbs">${productMedia(p).map((u,i)=>`<button class="gallery-thumb ${i===0?'active':''}" onclick="selectProductImage(${i});event.stopPropagation()"><img src="${u}" alt="Vista ${i+1}" onerror="this.style.display='none'"/><span>${p.icon}</span></button>`).join('')}</div></div><h2>${p.name}</h2><div class="rating"><span class="stars">★★★★★</span> ${p.rating}</div><span class="badge">✓ ${bestStock?.store||'—'} tem a melhor oferta disponível</span><div>${priceChangeHtml(p.id)} ${dealHtml(p.id)}</div></div>${priceHistoryCard(p.id)}${priceTrendSummary(p.id)}
 <h3>Especificações</h3><div class="specs">${p.spec.map((x,i)=>`<div class="spec">${specLabelsForCategory(p.category)[i]||'Característica '+(i+1)}<strong>${x}</strong></div>`).join('')}</div>
 <h3>Comparar preços · ${os.length} ofertas</h3><div class="shops">${os.map((o,i)=>{const saving=o.price-best;return `<div class="shop ${i===0?'offer-best':''}"><span><div class="offer-head">${storeLogo(o.store)}<strong>${o.store}</strong>${o.store===pref?.store?'<span class="offer-rank" style="background:#fff4d6;color:#8a6100">⭐ LOJA PREFERIDA</span>':''}${o.price===best?'<span class="offer-rank">MELHOR OFERTA</span>':''}</div><small>${o.stock?'✓ Em stock':'Por encomenda'}</small>${i===0?'<span class="offer-tag">Menor preço encontrado</span>':''}</span><span><strong>${euro(o.price)}</strong>${saving>0?`<br><span class="offer-saving">+${euro(saving)} vs. melhor preço</span>`:''}</span><span><span class="offer-delivery">${o.delivery}</span><br>${o.url?`<a class="shop-link" href="${o.url}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Ver loja ↗</a>`:`<button onclick="buy('${o.store}','${p.name}')">Ver loja ↗</button>`}</span></div>`}).join('')}</div>
 <div class="notice"><div>📦<b>${os.length}</b>Ofertas</div><div>💶<b>${euro(best)}</b>Preço mais baixo</div><div>🚚<b>${euro(bestStock?.price||best)}</b>Melhor em stock</div></div>${savingsHtml(p)}${priceChangeHtml(p.id)}<div class="product-actions"><button class="secondary" onclick="saveHistory(${p.id})">📌 Guardar preço de hoje</button><button class="secondary" onclick="fav(${p.id})">${favs.includes(p.id)?'♥ Remover favorito':'♡ Adicionar aos favoritos'}</button><button class="secondary" onclick="tp145ShareProduct(${p.id})">↗️ Partilhar</button><button class="secondary" onclick="quickAlert(${p.id})">🔔 Definir alerta</button><button class="secondary" onclick="showCompatibility([${p.id}].concat(compareSelected.filter(x=>x!==${p.id}).slice(0,2)))">🔗 Ver compatibilidade</button></div>${historyHtml(p.id)}${alertHtml(p.id)}${reviewsSummaryHtml(p)}`
}


function productReviews(id){try{const all=JSON.parse(localStorage.getItem('tecnopreco-reviews')||'{}');return Array.isArray(all[id])?all[id]:[]}catch(e){return []}}
function saveProductReview(id,r){try{const all=JSON.parse(localStorage.getItem('tecnopreco-reviews')||'{}');all[id]=Array.isArray(all[id])?all[id]:[];all[id].unshift(r);localStorage.setItem('tecnopreco-reviews',JSON.stringify(all));return true}catch(e){return false}}
function reviewsSummaryHtml(p){const rs=productReviews(p.id);const avg=rs.length?(rs.reduce((n,r)=>n+Number(r.rating||0),0)/rs.length).toFixed(1):p.rating||'—';return `<div class="reviews-card"><div class="reviews-head"><div><h3>⭐ Avaliações da comunidade</h3><small>${rs.length?rs.length+' avaliações locais':'Ainda sem avaliações locais'}</small></div><strong>${avg} ★</strong></div><div class="reviews-actions"><button class="secondary" onclick="showReviews(${p.id})">${rs.length?'Ver avaliações':'Escrever avaliação'}</button></div></div>`}
function showReviews(id){const p=products.find(x=>x.id===id);if(!p)return;const rs=productReviews(id);const avg=rs.length?(rs.reduce((n,r)=>n+Number(r.rating||0),0)/rs.length).toFixed(1):p.rating||'—';const rows=rs.map(r=>`<div class="review-row"><div><strong>${escapeHtml(r.name||'Utilizador')}</strong><span>${'★'.repeat(Number(r.rating)||0)}${'☆'.repeat(5-(Number(r.rating)||0))}</span><small>${escapeHtml(r.date||'')}</small></div><p>${escapeHtml(r.text||'')}</p></div>`).join('');document.getElementById('detail').innerHTML=`<div class="compare-panel reviews-panel"><button class="back" onclick="showProduct(${id})">← Voltar ao produto</button><div class="compare-head"><h2>⭐ Avaliações · ${escapeHtml(p.name)}</h2><span class="compare-count">${avg} ★</span></div><p class="compare-note">As avaliações criadas aqui são guardadas localmente neste dispositivo. Ainda não representam avaliações verificadas de lojas externas.</p><div class="review-form"><label>Nome<input id="reviewName" maxlength="40" placeholder="O teu nome"></label><label>Classificação<select id="reviewRating"><option value="5">★★★★★ 5</option><option value="4">★★★★☆ 4</option><option value="3">★★★☆☆ 3</option><option value="2">★★☆☆☆ 2</option><option value="1">★☆☆☆☆ 1</option></select></label><label>Comentário<textarea id="reviewText" maxlength="500" placeholder="O que achaste do produto?"></textarea></label><button class="primary" onclick="submitReview(${id})">⭐ Publicar avaliação</button></div><div class="reviews-list">${rows||'<div class="empty">Ainda não existem avaliações locais. Sê o primeiro a avaliar.</div>'}</div></div>`;window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'})}
function submitReview(id){const name=(document.getElementById('reviewName')?.value||'Utilizador').trim()||'Utilizador';const text=(document.getElementById('reviewText')?.value||'').trim();const rating=Number(document.getElementById('reviewRating')?.value||5);if(text.length<3)return toast('Escreve pelo menos algumas palavras');if(saveProductReview(id,{name,text,rating,date:new Date().toLocaleDateString('pt-PT')})){toast('Avaliação guardada neste dispositivo');showReviews(id)}else toast('Não foi possível guardar a avaliação')}

let voiceRecognition=null;
function startVoiceSearch(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){toast('A pesquisa por voz não é suportada neste navegador');return;}
 const btn=document.getElementById('voiceBtn');
 try{
  if(voiceRecognition){voiceRecognition.stop();return;}
  voiceRecognition=new SR(); voiceRecognition.lang='pt-PT'; voiceRecognition.interimResults=false; voiceRecognition.maxAlternatives=1;
  btn.classList.add('listening'); btn.textContent='⏺️'; toast('Estou a ouvir…');
  voiceRecognition.onresult=e=>{const text=e.results[0][0].transcript.trim();document.getElementById('search').value=text;updateSuggestions();apply();toast('Pesquisa: '+text)};
  voiceRecognition.onerror=e=>toast(e.error==='not-allowed'?'Permissão do microfone recusada':'Não consegui perceber a pesquisa');
  voiceRecognition.onend=()=>{btn.classList.remove('listening');btn.textContent='🎙️';voiceRecognition=null;};
  voiceRecognition.start();
 }catch(e){btn.classList.remove('listening');btn.textContent='🎙️';voiceRecognition=null;toast('Não foi possível iniciar o microfone');}
}

function searchRelevance(p,q){
 const text=(p.name+' '+(p.brand||'')+' '+(p.category||'')+' '+(p.description||'')).toLowerCase();
 const terms=q.split(/\s+/).filter(Boolean); let score=0;
 terms.forEach(t=>{if((p.name||'').toLowerCase().includes(t))score+=8;if((p.brand||'').toLowerCase()===t)score+=7;if((p.category||'').toLowerCase().includes(t))score+=5;if(text.includes(t))score+=2});
 try{const r=JSON.parse(localStorage.getItem('tecnopreco-recent-searches')||'[]');if(r.some(x=>String(x).toLowerCase()===q))score+=1}catch(e){}
 try{const f=JSON.parse(localStorage.getItem('tecnopreco-favs')||'[]');if(f.includes(p.id))score+=2}catch(e){}
 const price=bestOffer(p)?.price||99999; if(price<500)score+=Math.max(0,3-price/250);
 return score;
}
function advancedSearchSuggestions(raw){
 const q=raw.toLowerCase().trim();
 if(!q)return [];
 return products.map(p=>({p,score:searchRelevance(p,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>x.p);
}
function updateSuggestions(){
 const box=document.getElementById('suggestions'), raw=document.getElementById('search').value.trim();
 if(!raw){box.style.display='none';return}
 const matches=advancedSearchSuggestions(raw);
 if(!matches.length){box.innerHTML='<div class="suggestion-empty">Sem resultados directos. Experimenta com marca, categoria ou nome do produto.</div>';box.style.display='block';return}
 box.innerHTML='<div class="suggestion-head">Pesquisa inteligente · melhores correspondências</div>'+matches.map(p=>`<div class="suggestion" onclick="chooseSuggestion(${p.id})"><span class="suggestion-icon">${p.icon}</span><span><b>${p.name}</b><small>${p.brand||p.category} · a partir de ${euro(bestOffer(p).price)} · correspondência inteligente</small></span></div>`).join('');
 box.style.display='block';
}
function showSearchDiscovery(){
 const recent=(()=>{try{return JSON.parse(localStorage.getItem('tecnopreco-recent-searches')||'[]')}catch(e){return[]}})();
 const popular=['Samsung','iPhone','portáteis gaming','PlayStation','smartwatch','televisões 4K'];
 const cats=[...new Set(products.map(p=>p.category).filter(Boolean))].slice(0,8);
 const chips=[...new Set([...recent,...popular,...cats])].slice(0,12);
 const detail=document.getElementById('detail');
 detail.innerHTML=`<div class="compare-panel discovery-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🔎 Descoberta inteligente</h2><span class="compare-count">Pesquisa avançada</span></div><p class="compare-note">Sugestões baseadas no catálogo, histórico local e relevância. Os dados de popularidade são demonstrativos.</p><div class="discovery-grid"><div><h3>🔥 Pesquisas populares</h3><div class="discovery-chips">${chips.map(x=>`<button class="filter" onclick="document.getElementById('search').value='${String(x).replace(/'/g,"\'")}';apply()">${x}</button>`).join('')}</div></div><div><h3>⚡ Dicas de pesquisa</h3><ul><li>Usa marca + modelo</li><li>Combina categoria e preço</li><li>Experimenta “gaming”, “4K”, “5G”, etc.</li></ul></div></div></div>`;
 detail.scrollIntoView({behavior:'smooth',block:'start'});
}
function chooseSuggestion(id){const p=products.find(x=>x.id===id);if(!p)return;document.getElementById('search').value=p.name;document.getElementById('suggestions').style.display='none';apply();showProduct(id)}
function buy(store,product){toast('A abrir '+store+' para: '+product)}
function shareSearch(){
 const q=(document.getElementById('search')?.value||'').trim();
 if(!q)return toast('Escreve uma pesquisa para partilhar');
 const url=location.href.split('#')[0]+'#pesquisa='+encodeURIComponent(q);
 const text='TecnoPreço — pesquisa: '+q;
 if(navigator.share) navigator.share({title:'TecnoPreço — Pesquisa',text,url}).catch(()=>{});
 else if(navigator.clipboard) navigator.clipboard.writeText(url).then(()=>toast('Ligação da pesquisa copiada')).catch(()=>toast('Não foi possível copiar'));
 else toast('Partilha não disponível neste dispositivo');
}

function shareProduct(id){const p=products.find(x=>x.id===id);if(!p)return;const text='TecnoPreço — '+p.name+' · desde '+euro(bestOffer(p).price);const url=location.href.split('#')[0]+'#produto-'+id;if(navigator.share){navigator.share({title:'TecnoPreço — '+p.name,text,url}).catch(()=>{})}else if(navigator.clipboard){navigator.clipboard.writeText(url).then(()=>toast('Ligação copiada')).catch(()=>toast('Não foi possível copiar a ligação'))}else{toast('Partilha não disponível neste dispositivo')}}
function openProductFromHash(){
 const h=location.hash;
 let m=h.match(/^#produto-(\d+)$/);
 if(m){const id=Number(m[1]);if(products.some(p=>p.id===id)){showProduct(id);setTimeout(()=>document.getElementById('detail')?.scrollIntoView({behavior:'smooth',block:'start'}),60)}return}
 m=h.match(/^#pesquisa=(.+)$/);
 if(m){try{const q=decodeURIComponent(m[1]);const s=document.getElementById('search');if(s){s.value=q;apply();setTimeout(()=>document.getElementById('results')?.scrollIntoView({behavior:'smooth',block:'start'}),60)}}catch(e){}return}
 m=h.match(/^#comparacao-([\d-]+)$/);
 if(m){const ids=m[1].split('-').map(Number).filter(id=>products.some(p=>p.id===id)).slice(0,3);if(ids.length){compareSelected=ids;saveCompare();updateCompareBar();showCompare();setTimeout(()=>document.getElementById('detail')?.scrollIntoView({behavior:'smooth',block:'start'}),60)}}
}
window.addEventListener('hashchange',openProductFromHash);
function fav(id){favs=favs.includes(id)?favs.filter(x=>x!==id):[...favs,id];try{localStorage.setItem('tecnopreco-favs',JSON.stringify(favs))}catch(e){}apply();renderUserPanel();toast(favs.includes(id)?'Adicionado aos favoritos':'Removido dos favoritos')}
function showFavs(){let list=products.filter(p=>favs.includes(p.id));document.getElementById('search').value='';stockOnly=false;document.getElementById('stockBtn').classList.remove('active');render(list);toast(list.length?'A mostrar favoritos':'Ainda não tens favoritos')}
function toggleStock(){stockOnly=!stockOnly;document.getElementById('stockBtn').classList.toggle('active',stockOnly);apply()}
function category(c){document.getElementById('search').value=c;apply()}
function brand(b){document.getElementById('search').value=b;apply();toast('A mostrar '+b)}
function togglePreferredOnly(){
 preferredOnly=!preferredOnly;
 const b=document.getElementById('preferredBtn');
 if(b)b.classList.toggle('preferred-active',preferredOnly);
 apply();
 toast(preferredOnly?'A mostrar apenas produtos com lojas preferidas':'A mostrar todas as lojas');
}
function clearFilters(){document.getElementById('search').value='';document.getElementById('maxPrice').value='400';document.getElementById('sort').value='price';document.getElementById('storeFilter').value='all';if(document.getElementById('categoryFilter'))document.getElementById('categoryFilter').value='all';if(document.getElementById('brandFilter'))document.getElementById('brandFilter').value='all';stockOnly=true;preferredOnly=false;document.getElementById('stockBtn').classList.add('active');document.getElementById('preferredBtn').classList.remove('preferred-active');apply()}

function toggleMenu(){const m=document.getElementById('menuOverlay');if(m)m.classList.toggle('open')}
function goHome(){document.getElementById('search').value='';stockOnly=true;document.getElementById('stockBtn').classList.add('active');renderHome();apply();window.scrollTo({top:0,behavior:'smooth'});toast('Página inicial')}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=document.getElementById('menuOverlay');if(m)m.classList.remove('open')}});
function toggleTheme(){document.body.classList.toggle('dark-mode');try{localStorage.setItem('tecnopreco-theme',document.body.classList.contains('dark-mode')?'dark':'light')}catch(e){}}
try{if(localStorage.getItem('tecnopreco-theme')==='dark')document.body.classList.add('dark-mode')}catch(e){}
function offerFreshness(o){
 const t=o&&o.verifiedAt?new Date(o.verifiedAt).getTime():0;
 if(!t)return {label:'Sem verificação',cls:'source-stale'};
 const h=(Date.now()-t)/3600000;
 if(h<=6)return {label:'Verificado há pouco',cls:'source-fresh'};
 if(h<=24)return {label:'Verificado hoje',cls:'source-fresh'};
 if(h<=72)return {label:'Verificado há '+Math.round(h/24)+' dias',cls:'source-warn'};
 return {label:'Verificação antiga',cls:'source-stale'};
}
function offerSourceHtml(o){
 if(!o)return '';
 const f=offerFreshness(o);
 const source=o.source||'TecnoPreço';
 return `<small class="offer-source ${f.cls}">● ${source} · ${f.label}</small>`;
}
function markDemoOffers(){
 const now=new Date().toISOString();
 products.forEach(p=>p.offers.forEach(o=>{
   if(!o.source)o.source='Dados de demonstração';
   if(!o.sourceType)o.sourceType='demo';
   if(!o.verifiedAt)o.verifiedAt=now;
 }));
}
async function loadCatalogDatabase(){
 try{
  const response=await fetch('data/products.json',{cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const catalog=await response.json();
  const rows=Array.isArray(catalog)?catalog:catalog.products;
  if(!Array.isArray(rows)||!rows.length)throw new Error('Catálogo vazio');
  products.splice(0,products.length,...rows);
  tp140Invalidate();
  populateCatalogFilters();
  window.__TECNOPRECO_CATALOG__={schemaVersion:catalog.schemaVersion||'legacy',catalogVersion:catalog.catalogVersion||'legacy',count:products.length};
  markDemoOffers();
  return true;
 }catch(e){
  window.__TECNOPRECO_CATALOG__={schemaVersion:'fallback',catalogVersion:'embedded',count:products.length,error:String(e&&e.message||e)};
  markDemoOffers();
  return false;
 }
}
markDemoOffers();
populateCatalogFilters();
// Modo demonstração autónomo: permite testar o HTML sem backend.
const DEMO_MODE=!configuredBackendUrl;
const DEMO_API_RELEASE='1.0';
const demoApiState={requests:0,last:null};
function demoApiInfo(){return {mode:'demo',release:DEMO_API_RELEASE,requests:demoApiState.requests,last:demoApiState.last}}

if(DEMO_MODE){
 try{
  window.__TECNOPRECO_DEMO__=true;
  runtimeConfig.allowDemoData=true;
  if(!runtimeConfig.backendUrl){ backendRuntime.enabled=false; backendRuntime.baseUrl=''; }
 }catch(e){}
}


const productApiContract={version:'1.0',searchPath:'/api/v1/products/search',detailPath:'/api/v1/products/'};
function normalizeBackendProduct(row){
 if(!row||row.id==null||!row.name)return null;
 const base=products.find(x=>x.id===Number(row.id));
 return {
  ...(base||{}),
  ...row,
  id:Number(row.id),
  offers:Array.isArray(row.offers)?row.offers.map(offerData):(base?base.offers:[])
 };
}
function validateBackendProduct(row){
 const p=normalizeBackendProduct(row);
 return !!(p&&p.id&&p.name&&Array.isArray(p.offers)&&p.offers.every(validateOffer));
}
async function searchProductsFromBackend(query,extra={}){
 demoApiState.requests++; demoApiState.last=new Date().toISOString();
 if(demoBackendAllowed()){
  const data=await demoSearchProducts(query,extra);
  if(!data.ok||!Array.isArray(data.products))throw new Error('Resposta de demonstração inválida');
  return data.products.filter(validateBackendProduct).map(normalizeBackendProduct);
 }
 if(!backendRuntime.enabled||!backendRuntime.baseUrl)throw new Error('Backend ainda não configurado');
 const url=new URL(backendRuntime.baseUrl.replace(/\/$/,'')+productApiContract.searchPath,location.href);
 if(query)url.searchParams.set('q',query);
 Object.keys(extra||{}).forEach(k=>{if(extra[k]!==undefined&&extra[k]!==null&&extra[k]!=='')url.searchParams.set(k,String(extra[k]))});
 const response=await fetch(url.toString(),{headers:{Accept:'application/json'}});
 if(!response.ok)throw new Error('Backend respondeu HTTP '+response.status);
 const data=await response.json();
 if(!data||data.ok!==true||!Array.isArray(data.products))throw new Error('Resposta de pesquisa inválida');
 return data.products.filter(validateBackendProduct).map(normalizeBackendProduct);
}
async function loadProductFromBackend(id){
 demoApiState.requests++; demoApiState.last=new Date().toISOString();
 if(demoBackendAllowed()){
  const data=await demoLoadProduct(id);
  const row=data&&data.product;
  if(!data.ok||!validateBackendProduct(row))throw new Error('Produto de demonstração inválido');
  const fresh=normalizeBackendProduct(row),i=products.findIndex(x=>x.id===fresh.id);
  if(i>=0)products[i]=fresh;else products.push(fresh);
  return fresh;
 }
 if(!backendRuntime.enabled||!backendRuntime.baseUrl)throw new Error('Backend ainda não configurado');
 const url=backendRuntime.baseUrl.replace(/\/$/,'')+productApiContract.detailPath+encodeURIComponent(id);
 const response=await fetch(url,{headers:{Accept:'application/json'}});
 if(!response.ok)throw new Error('Backend respondeu HTTP '+response.status);
 const data=await response.json();
 const row=data&&data.product?data.product:data;
 if(!validateBackendProduct(row))throw new Error('Produto recebido do backend é inválido');
 const fresh=normalizeBackendProduct(row),i=products.findIndex(x=>x.id===fresh.id);
 if(i>=0)products[i]=fresh;else products.push(fresh);
 return fresh;
}
async function refreshProductFromBackend(id){
 try{return await loadProductFromBackend(id)}catch(e){return products.find(x=>x.id===Number(id))||null}
}

function buildBackendSyncRequest(sourceId){return {contractVersion:integrationConfig.backendContract.version,sourceId,requestedAt:new Date().toISOString(),products:products.map(p=>({productId:p.id,name:p.name}))};}
function validateBackendSyncResponse(data){if(!data||data.ok!==true||!data.sourceId||!Array.isArray(data.offers)||!data.syncedAt)return false;return data.offers.every(row=>validateOffer(row));}
function applyBackendSyncResponse(data){if(!validateBackendSyncResponse(data))throw new Error('Resposta do backend inválida');return syncAuthorizedSource(data.sourceId,data.offers);}
const APP_RELEASE='3.0.62';
const APP_DATA_VERSION=4;
const ENVIRONMENTS={
 development:{label:'Desenvolvimento',backendUrl:'',allowDemoData:true,debug:true},
 test:{label:'Testes',backendUrl:'',allowDemoData:true,debug:true},
 production:{label:'Produção',backendUrl:'',allowDemoData:false,debug:false}
};
function resolveEnvironment(){
 const requested=(window.__TECNOPRECO_ENV__||document.documentElement.dataset.environment||'development').toLowerCase();
 return ENVIRONMENTS[requested]?requested:'development';
}
const runtimeEnvironment=resolveEnvironment();
const runtimeConfig=ENVIRONMENTS[runtimeEnvironment];
// Passo 65 — ligação explícita ao backend real através de configuração externa.
// O endereço nunca é inventado: só é usado quando fornecido pelo servidor/site.
const configuredBackendUrl=(window.__TECNOPRECO_BACKEND_URL__||'').trim();
if(configuredBackendUrl)runtimeConfig.backendUrl=configuredBackendUrl;
function environmentInfo(){return {name:runtimeEnvironment,label:runtimeConfig.label,release:APP_RELEASE,dataVersion:APP_DATA_VERSION,backendConfigured:!!runtimeConfig.backendUrl};}
function backendConnectionInfo(){return {configured:!!backendRuntime.baseUrl,baseUrl:backendRuntime.baseUrl||'',environment:runtimeEnvironment,release:APP_RELEASE};}
function apiArchitecture(){return {version:'1.0',environment:runtimeEnvironment,mode:backendRuntime.enabled?'remote-api':'demo-local',baseUrl:backendRuntime.baseUrl||null,contracts:{products:productApiContract,auth:['/api/v1/auth/register','/api/v1/auth/login','/api/v1/auth/logout'],prices:integrationConfig.backendContract.path},security:{credentials:'server-side-only',transport:'HTTPS recommended',demoData:!backendRuntime.enabled}};}
async function checkBackendHealth(){if(!backendRuntime.enabled||!backendRuntime.baseUrl)return {ok:true,mode:'demo',message:'Backend remoto não configurado; a aplicação está em modo demonstrativo.'};const base=backendRuntime.baseUrl.replace(/\/$/,'');try{const r=await fetch(base+'/api/health',{headers:{Accept:'application/json'}});if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json().catch(()=>({}));return {ok:true,mode:'remote',message:'Backend acessível',details:d};}catch(e){return {ok:false,mode:'remote',message:'Backend indisponível: '+(e.message||'erro de ligação')};}}
function exportApiContract(){const payload={generatedAt:new Date().toISOString(),productApi:productApiContract,priceSync:integrationConfig.backendContract,architecture:apiArchitecture(),note:'Credenciais e chaves nunca devem ser colocadas neste ficheiro; usar servidor/variáveis de ambiente.'};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='tecnopreco-api-contract.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
async function showApiCenter(){const info=apiArchitecture();const health=await checkBackendHealth();document.getElementById('detail').innerHTML=`<div class="compare-panel api-panel"><button class="back" onclick="showAdmin()">← Backoffice</button><div class="compare-head"><h2>🔌 Arquitectura de APIs</h2><span class="compare-count">V1.0</span></div><p class="compare-note">Camada preparada para receber dados reais apenas através de APIs, feeds ou acordos autorizados. Nesta versão, nenhum preço real é inventado ou recolhido sem uma fonte configurada.</p><div class="partner-kpis"><div><b>${info.mode==='remote'?'REMOTA':'DEMO'}</b><small>Modo</small></div><div><b>${health.ok?'ONLINE':'OFFLINE'}</b><small>Estado</small></div><div><b>${productApiContract.version}</b><small>Contrato produtos</small></div><div><b>${integrationConfig.refreshIntervalMinutes} min</b><small>Intervalo previsto</small></div></div><div class="api-grid"><div class="api-card"><strong>🧩 Produtos</strong><span>${productApiContract.searchPath}</span><small>${productApiContract.detailPath}:id</small></div><div class="api-card"><strong>💶 Preços</strong><span>${integrationConfig.backendContract.request.path}</span><small>Resposta validada antes de actualizar ofertas.</small></div><div class="api-card"><strong>🔐 Segurança</strong><span>Credenciais no servidor</span><small>Não guardar chaves/API secrets no JavaScript público.</small></div><div class="api-card"><strong>🛡️ Estado</strong><span>${health.message}</span><small>${escapeHtml(info.baseUrl||'Sem URL configurada')}</small></div></div><div class="admin-actions"><button class="primary" onclick="showApiCenter()">↻ Testar ligação</button><button class="secondary" onclick="exportApiContract()">⬇️ Exportar contrato</button></div><div class="catalog-note"><b>⚠️ Importante</b><span>A integração real depende de credenciais, limites, termos e autorização das respectivas fontes. A aplicação continua a usar dados demonstrativos enquanto não existir uma ligação válida.</span></div></div>`;window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});}

function protectLocalDataBeforeUpdate(){
 try{
  const current=Number(localStorage.getItem('tecnopreco-data-version')||'3');
  if(current>=APP_DATA_VERSION)return;
  const keys=['tecnopreco-favorites','tecnopreco-alerts','tecnopreco-compare','tecnopreco-searches','tecnopreco-recent','tecnopreco-price-history','tecnopreco-stores','tecnopreco-account','tecnopreco-sync-scheduler'];
  const snapshot={version:current,createdAt:new Date().toISOString(),data:{}};
  keys.forEach(k=>{const v=localStorage.getItem(k);if(v!==null)snapshot.data[k]=v});
  localStorage.setItem('tecnopreco-update-backup-'+Date.now(),JSON.stringify(snapshot));
  localStorage.setItem('tecnopreco-data-version',String(APP_DATA_VERSION));
 }catch(e){}
}
function applyRuntimeConfiguration(){
 backendRuntime.baseUrl=runtimeConfig.backendUrl;
 backendRuntime.enabled=!!runtimeConfig.backendUrl;
 if(runtimeEnvironment==='production'&&!backendRuntime.enabled){
  const status=document.getElementById('sourceStatus');
  if(status)status.textContent='Produção · backend ainda não configurado';
 }else if(runtimeEnvironment!=='development'){
  const status=document.getElementById('sourceStatus');
  if(status)status.textContent=runtimeConfig.label+' · configuração isolada';
 }
 try{localStorage.setItem('tecnopreco-runtime',JSON.stringify(environmentInfo()))}catch(e){}
}
protectLocalDataBeforeUpdate();
const backendRuntime={enabled:false,baseUrl:'',timeoutMs:20000};
// Backend local de demonstração: permite testar a integração directamente no HTML.
const demoBackend={enabled:true,latencyMs:180};
function demoBackendAllowed(){return demoBackend.enabled&&(runtimeEnvironment==='development'||runtimeEnvironment==='test')&&!runtimeConfig.backendUrl;}
function demoBackendProducts(query=''){
 const q=String(query||'').trim().toLowerCase();
 const rows=products.map(p=>({id:p.id,name:p.name,brand:p.brand,category:p.category,image:p.image,price:p.price,specs:p.specs,offers:p.offers.map(offerData)}));
 return q?rows.filter(p=>(p.name+' '+(p.brand||'')+' '+(p.category||'')).toLowerCase().includes(q)):rows;
}
function demoBackendResponse(data){return new Promise(resolve=>setTimeout(()=>resolve(data),demoBackend.latencyMs));}
async function demoSearchProducts(query,extra={}){
 let rows=demoBackendProducts(query);
 if(extra.brand)rows=rows.filter(p=>String(p.brand||'').toLowerCase()===String(extra.brand).toLowerCase());
 if(extra.category)rows=rows.filter(p=>String(p.category||'').toLowerCase()===String(extra.category).toLowerCase());
 if(extra.maxPrice)rows=rows.filter(p=>p.offers.some(o=>Number(o.price)<=Number(extra.maxPrice)));
 return demoBackendResponse({ok:true,products:rows,source:'demo-html-backend',queriedAt:new Date().toISOString()});
}
async function demoLoadProduct(id){
 const p=demoBackendProducts('').find(x=>x.id===Number(id));
 return demoBackendResponse({ok:!!p,product:p||null,source:'demo-html-backend'});
}

function backendSyncUrl(){return backendRuntime.baseUrl.replace(/\/$/,'')+integrationConfig.backendContract.request.path}
const backendSession={status:'unauthenticated',token:'',expiresAt:null};
function setBackendSession(token,expiresAt){backendSession.token=token||'';backendSession.expiresAt=expiresAt||null;backendSession.status=backendSession.token?(backendSession.expiresAt&&Date.now()>=new Date(backendSession.expiresAt).getTime()?'expired':'authenticated'):'unauthenticated';return backendSession.status}
function clearBackendSession(){backendSession.token='';backendSession.expiresAt=null;backendSession.status='unauthenticated'}
function backendAuthHeaders(){const h={'Content-Type':'application/json'};if(backendSession.status==='authenticated')h.Authorization='Bearer '+backendSession.token;return h}
async function syncFromBackend(sourceId){
 if(demoBackendAllowed()){
  const cfg=integrationConfig.sources[sourceId]; if(!cfg)throw new Error('Fonte desconhecida');
  cfg.status='connecting';
  const payload=buildAuthorizedFeedPayload().filter(x=>x.source===sourceId||x.store===sourceId);
  await demoBackendResponse(null);
  const accepted=syncAuthorizedSource(sourceId,payload);
  return {accepted,elapsedMs:demoBackend.latencyMs,demo:true};
 }
 if(!backendRuntime.enabled||!backendRuntime.baseUrl)throw new Error('Backend ainda não configurado');
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),backendRuntime.timeoutMs);
 const started=Date.now();
 try{
  const cfg=integrationConfig.sources[sourceId]; if(!cfg)throw new Error('Fonte desconhecida');
  cfg.status='connecting';
  const response=await fetch(backendSyncUrl(),{method:'POST',headers:backendAuthHeaders(),body:JSON.stringify(buildBackendSyncRequest(sourceId)),signal:controller.signal});
  if(!response.ok)throw new Error('Backend respondeu HTTP '+response.status);
  const data=await response.json();
  const accepted=applyBackendSyncResponse(data);
  recordSourceSync(sourceId,'ok',accepted);
  try{localStorage.setItem('tecnopreco-last-backend-sync',new Date().toISOString())}catch(e){}
  return {accepted,elapsedMs:Date.now()-started};
 }catch(e){
  const cfg=integrationConfig.sources[sourceId]; if(cfg)cfg.status='error';
  recordSourceSync(sourceId,'error',0,e.name==='AbortError'?'Tempo limite excedido':e.message);
  throw e;
 }finally{clearTimeout(timer)}
}
function schedulerState(){try{return JSON.parse(localStorage.getItem('tecnopreco-sync-scheduler')||'{}')||{}}catch(e){return {}}}
function scheduleNextSync(){const next=new Date(Date.now()+integrationConfig.refreshIntervalMinutes*60000).toISOString();try{localStorage.setItem('tecnopreco-sync-scheduler',JSON.stringify({nextAt:next,intervalMinutes:integrationConfig.refreshIntervalMinutes}))}catch(e){}return next}
function schedulerDue(){const st=schedulerState();return !!st.nextAt&&Date.now()>=new Date(st.nextAt).getTime()}
function runScheduledSyncCheck(){if(!backendRuntime.enabled)return false;if(!schedulerDue())return false;const ids=Object.keys(integrationConfig.sources);ids.forEach(id=>syncFromBackend(id).catch(()=>{}));scheduleNextSync();return true}
function startFrontendScheduler(){scheduleNextSync();setInterval(()=>{if(document.visibilityState==='visible')runScheduledSyncCheck()},60000)}

function buildAuthorizedFeedPayload(){return products.flatMap(p=>p.offers.map(o=>({productId:p.id,productName:p.name,...offerData(o)})));}
function applyAuthorizedOffers(payload){if(!Array.isArray(payload))throw new Error('Feed inválido');let accepted=0;payload.forEach(row=>{const p=products.find(x=>x.id===Number(row.productId));if(!p)return;const o=offerData(row);o.sourceType='authorized-feed';o.confidence='verified';o.verifiedAt=o.verifiedAt||new Date().toISOString();if(!validateOffer(o))return;const i=p.offers.findIndex(x=>x.store===o.store);if(i>=0)p.offers[i]=o;else p.offers.push(o);accepted++;});return accepted;}
function sourceSyncState(){try{return JSON.parse(localStorage.getItem('tecnopreco-source-sync')||'{}')||{}}catch(e){return {}}}
function recordSourceSync(storeId,status,accepted,error){const st=sourceSyncState();st[storeId]={status,accepted:Number(accepted)||0,error:error||'',at:new Date().toISOString()};try{localStorage.setItem('tecnopreco-source-sync',JSON.stringify(st))}catch(e){}}
function sourceSyncSummary(storeId){const st=sourceSyncState()[storeId];if(!st)return 'Ainda não sincronizada';const d=new Date(st.at);return (st.status==='ok'?'Última sincronização':'Última tentativa')+' · '+d.toLocaleString('pt-PT',{dateStyle:'short',timeStyle:'short'})+' · '+st.accepted+' ofertas';}
function syncAuthorizedSource(storeId,payload){const cfg=integrationConfig.sources[storeId];if(!cfg)throw new Error('Fonte desconhecida');try{const accepted=applyAuthorizedOffers(payload);cfg.status='connected';recordSourceSync(storeId,'ok',accepted);return accepted}catch(e){cfg.status='error';recordSourceSync(storeId,'error',0,e.message);throw e;}}

function refreshPrices(){
 const b=document.querySelector('#updateBar button');
 if(b){b.disabled=true;b.textContent='A actualizar…'}
 setTimeout(()=>{
  const now=new Date();
  const txt='Última actualização: '+now.toLocaleString('pt-PT',{dateStyle:'short',timeStyle:'short'});
  const el=document.getElementById('lastUpdate'); if(el)el.textContent=txt+' · dados do protótipo';
  try{localStorage.setItem('tecnopreco-last-update',now.toISOString())}catch(e){}
  if(b){b.disabled=false;b.textContent='Actualizar'}
  toast('Preços actualizados no protótipo');
 },500);
}
function showStores(){
 const prefs=JSON.parse(localStorage.getItem('tecnopreco-stores')||'[]');
 const rows=stores.map(st=>{const on=prefs.includes(st.id);return `<div class="source-row"><span>${storeLogo(st.name)}<strong>${st.name}</strong><small>${st.type==='marketplace'?'Marketplace':'Loja'}</small></span><button class="secondary" onclick="toggleStorePref('${st.id}')">${on?'✓ Preferida':'☆ Preferir'}</button></div>`}).join('');
 document.getElementById('detail').innerHTML=`<div class="compare-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🏪 As minhas lojas</h2><span class="compare-count">${prefs.length} preferida${prefs.length===1?'':'s'}</span></div><p class="compare-note">Escolhe as lojas que preferes para as teres identificadas no TecnoPreço. Esta preferência fica guardada neste dispositivo.</p><div class="shops">${rows}</div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}

const storeMapPoints=[
 {id:'worten-colombo',storeId:'worten',name:'Worten Colombo',city:'Lisboa',lat:38.7537,lon:-9.1894,area:'Colombo',note:'Ponto demonstrativo'},
 {id:'fnac-colombo',storeId:'fnac',name:'FNAC Colombo',city:'Lisboa',lat:38.7534,lon:-9.1898,area:'Colombo',note:'Ponto demonstrativo'},
 {id:'pcdiga-benfica',storeId:'pcdiga',name:'PCDIGA Benfica',city:'Lisboa',lat:38.7446,lon:-9.1856,area:'Benfica',note:'Ponto demonstrativo'},
 {id:'globaldata-alfragide',storeId:'globaldata',name:'Globaldata Alfragide',city:'Amadora',lat:38.7347,lon:-9.2130,area:'Alfragide',note:'Ponto demonstrativo'},
 {id:'auchan-amadora',storeId:'auchan',name:'Auchan Amadora',city:'Amadora',lat:38.7528,lon:-9.2265,area:'Amadora',note:'Ponto demonstrativo'},
 {id:'worten-norte',storeId:'worten',name:'Worten NorteShopping',city:'Matosinhos',lat:41.1800,lon:-8.6520,area:'Matosinhos',note:'Ponto demonstrativo'},
 {id:'fnac-norte',storeId:'fnac',name:'FNAC NorteShopping',city:'Matosinhos',lat:41.1804,lon:-8.6510,area:'Matosinhos',note:'Ponto demonstrativo'}
];
function mapDistanceKm(a,b){const R=6371,rad=x=>x*Math.PI/180;const dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon);const q=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));}
function mapDemoOrigin(){return {lat:38.7440,lon:-9.1850,city:'Lisboa',label:'Zona de referência'};}
function mapOfferMatches(point){
 const store=stores.find(x=>x.id===point.storeId); if(!store)return [];
 const names=new Set(products.filter(p=>p.offers?.some(o=>o.store===store.name)).map(p=>p.id));
 return products.filter(p=>names.has(p.id)).map(p=>{const o=p.offers.filter(x=>x.store===store.name).sort((a,b)=>a.price-b.price)[0];return {p,o};}).filter(x=>x.o).sort((a,b)=>a.o.price-b.o.price).slice(0,3);
}
function mapMarkerPosition(point){
 const xs=storeMapPoints.map(x=>x.lon),ys=storeMapPoints.map(x=>x.lat),minX=Math.min(...xs)-.012,maxX=Math.max(...xs)+.012,minY=Math.min(...ys)-.008,maxY=Math.max(...ys)+.008;
 const left=8+((point.lon-minX)/(maxX-minX))*84, top=10+(1-(point.lat-minY)/(maxY-minY))*80; return {left,top};
}

/* Fase 124 — Packs e Bundles inteligentes */
function bundleBestOffer(p){return bestOffer(p)}
function bundleKey(a,b){return [a.id,b.id].sort((x,y)=>x-y).join('-')}
function bundleCandidates(){
 const phones=products.filter(p=>p.category==='Telemóveis').slice().sort((a,b)=>bundleBestOffer(a).price-bundleBestOffer(b).price);
 const watches=products.filter(p=>p.category==='Smartwatches').slice().sort((a,b)=>bundleBestOffer(a).price-bundleBestOffer(b).price);
 const laptops=products.filter(p=>p.category==='Portáteis').slice().sort((a,b)=>bundleBestOffer(a).price-bundleBestOffer(b).price);
 const tablets=products.filter(p=>p.category==='Tablets').slice().sort((a,b)=>bundleBestOffer(a).price-bundleBestOffer(b).price);
 const tvs=products.filter(p=>p.category==='Televisões').slice().sort((a,b)=>bundleBestOffer(a).price-bundleBestOffer(b).price);
 const audio=products.filter(p=>p.category==='Áudio').slice().sort((a,b)=>bundleBestOffer(a).price-bundleBestOffer(b).price);
 const consoles=products.filter(p=>p.category==='Consolas').slice().sort((a,b)=>bundleBestOffer(a).price-bundleBestOffer(b).price);
 const out=[];
 const add=(title,icon,items,note)=>{if(items.every(Boolean))out.push({id:'b'+(out.length+1),title,icon,items,note})};
 if(phones[0]&&watches[0])add('Ecossistema móvel','📱',[phones[0],watches[0]],'Telemóvel + smartwatch para um conjunto equilibrado.');
 if(laptops[0]&&tablets[0])add('Produtividade móvel','💻',[laptops[0],tablets[0]],'Portátil + tablet para trabalho, estudo e mobilidade.');
 if(tvs[0]&&audio[0])add('Cinema em casa','📺',[tvs[0],audio[0]],'TV + áudio para uma experiência de entretenimento mais completa.');
 if(consoles[0]&&audio[0])add('Gaming imersivo','🎮',[consoles[0],audio[0]],'Consola + áudio para jogar com mais imersão.');
 if(phones[1]&&audio[0])add('Móvel + áudio','🎧',[phones[1],audio[0]],'Smartphone + áudio para música e chamadas.');
 if(phones[2]&&watches[1])add('Premium móvel','✨',[phones[2],watches[1]],'Combinação premium seleccionada pelo motor de ofertas.');
 return out;
}
function bundleTotal(items){return items.reduce((sum,p)=>sum+Number(bundleBestOffer(p)?.price||0),0)}
function bundleStoreTotal(items){
 const storesByCount={};
 items.forEach(p=>{(p.offers||[]).forEach(o=>{storesByCount[o.store]=(storesByCount[o.store]||0)+1})});
 let best=null;
 Object.keys(storesByCount).forEach(store=>{if(storesByCount[store]!==items.length)return;const total=items.reduce((sum,p)=>{const o=(p.offers||[]).filter(x=>x.store===store).sort((a,b)=>a.price-b.price)[0];return sum+(o?Number(o.price):1e9)},0);if(!best||total<best.total)best={store,total}});
 return best;
}
function bundleCard(b){
 const total=bundleTotal(b.items),same=bundleStoreTotal(b.items),suggested=Math.max(0,total*0.95),save=Math.max(0,total-suggested);
 return `<div class="tp-bundle-card"><div class="tp-bundle-head"><span class="tp-bundle-icon">${b.icon}</span><div><strong>${b.title}</strong><small>${b.note}</small></div><span class="tp-bundle-badge">PACK</span></div><div class="tp-bundle-items">${b.items.map(p=>{const o=bundleBestOffer(p);return `<button onclick="showProduct(${p.id})"><span>${p.icon||'▣'}</span><div><strong>${p.name}</strong><small>${euro(o.price)} · ${o.store}</small></div></button>`}).join('')}</div><div class="tp-bundle-total"><span><small>Melhor combinação</small><strong>${euro(total)}</strong></span><span><small>Estimativa com pack -5%</small><strong>${euro(suggested)}</strong></span></div>${same?`<div class="tp-bundle-same">🏪 Tudo na mesma loja: <b>${same.store}</b> · ${euro(same.total)}</div>`:''}<div class="tp-bundle-actions"><button class="primary" onclick="saveBundle('${b.id}')">💾 Guardar pack</button><button class="secondary" onclick="compareBundle('${b.id}')">⚖️ Comparar</button></div><small class="tp-bundle-note">A poupança de pack é uma simulação do TecnoPreço e não representa um desconto real da loja.</small></div>`;
}
function showBundles(){
 const bundles=bundleCandidates();
 document.getElementById('detail').innerHTML=`<div class="compare-panel tp-bundles-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>📦 Packs inteligentes</h2><span class="compare-count">${bundles.length} combinações</span></div><p class="compare-note">O TecnoPreço combina produtos de categorias diferentes para criar conjuntos úteis, compara os melhores preços e mostra quando os artigos podem ser encontrados na mesma loja.</p><div class="tp-bundle-grid">${bundles.map(bundleCard).join('')}</div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
function saveBundle(id){let a=[];try{a=JSON.parse(localStorage.getItem('tecnopreco-bundles')||'[]')}catch(e){};if(!a.includes(id))a.push(id);try{localStorage.setItem('tecnopreco-bundles',JSON.stringify(a))}catch(e){};toast('📦 Pack guardado nos teus favoritos')}
function compareBundle(id){const b=bundleCandidates().find(x=>x.id===id);if(!b)return;compareSelected=b.items.map(x=>x.id).slice(0,3);saveCompare();updateCompareBar();toast('⚖️ Pack enviado para comparação');showCompare();}

function showStoreMap(){
 const origin=mapDemoOrigin();
 const radius=Number(localStorage.getItem('tecnopreco-map-radius')||25);
 const nearby=storeMapPoints.map(p=>({...p,distance:mapDistanceKm(origin,p)})).filter(p=>p.distance<=radius).sort((a,b)=>a.distance-b.distance);
 const pins=nearby.map(p=>{const pos=mapMarkerPosition(p),st=stores.find(x=>x.id===p.storeId),best=mapOfferMatches(p)[0];return `<button class="tp-map-pin" style="left:${pos.left}%;top:${pos.top}%" onclick="focusMapStore('${p.id}')" title="${p.name}"><span>${storeLogo(st?.name||'Loja')}</span><small>${best?euro(best.o.price):'—'}</small></button>`}).join('');
 const rows=nearby.map(p=>{const st=stores.find(x=>x.id===p.storeId),offers=mapOfferMatches(p),best=offers[0];return `<div class="tp-map-store" id="map-store-${p.id}"><div class="tp-map-store-head"><span>${storeLogo(st?.name||'Loja')}</span><div><strong>${p.name}</strong><small>${p.city} · ${p.area} · ${p.distance.toFixed(1)} km</small></div><b>${best?euro(best.o.price):'—'}</b></div><div class="tp-map-offers">${offers.length?offers.map(x=>`<span>${x.p.name} · <strong>${euro(x.o.price)}</strong></span>`).join(''):'<span>Sem ofertas demonstrativas nesta loja</span>'}</div><small class="tp-map-demo">${p.note} · localização preparada para integração com mapas reais</small></div>`}).join('');
 document.getElementById('detail').innerHTML=`<div class="compare-panel tp-map-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🗺️ Mapa de lojas e ofertas</h2><span class="compare-count">${nearby.length} lojas</span></div><p class="compare-note">Encontra lojas próximas e vê rapidamente onde existe uma oferta. Nesta versão, as localizações são demonstrativas e estão preparadas para receber coordenadas reais através de uma fonte autorizada.</p><div class="tp-map-toolbar"><label>📍 Zona <select id="tpMapZone" onchange="showStoreMap()"><option value="lisboa">Lisboa / Grande Lisboa</option><option value="porto">Porto / Matosinhos</option></select></label><label>📏 Raio <select id="tpMapRadius" onchange="localStorage.setItem('tecnopreco-map-radius',this.value);showStoreMap()"><option value="10" ${radius===10?'selected':''}>10 km</option><option value="25" ${radius===25?'selected':''}>25 km</option><option value="50" ${radius===50?'selected':''}>50 km</option></select></label></div><div class="tp-map-canvas"><div class="tp-map-grid"></div><span class="tp-map-label tp-map-label-a">Lojas & ofertas</span><span class="tp-map-label tp-map-label-b">Zona de referência</span><div class="tp-map-origin" title="Zona de referência">●</div>${pins}</div><div class="tp-map-legend"><span>● Loja</span><span>€ Melhor oferta</span><span>📍 Distância aproximada</span></div><div class="tp-map-list">${rows||'<div class="empty">Não existem lojas demonstrativas dentro deste raio.</div>'}</div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
function focusMapStore(id){const el=document.getElementById('map-store-'+id);if(el){document.querySelectorAll('.tp-map-store').forEach(x=>x.classList.remove('is-focus'));el.classList.add('is-focus');el.scrollIntoView({behavior:'smooth',block:'center'});}}

function toggleStorePref(id){let a=[];try{a=JSON.parse(localStorage.getItem('tecnopreco-stores')||'[]')}catch(e){};a=a.includes(id)?a.filter(x=>x!==id):[...a,id];try{localStorage.setItem('tecnopreco-stores',JSON.stringify(a))}catch(e){};showStores();toast(a.includes(id)?'Loja adicionada às preferidas':'Loja removida das preferidas')}
function showStats(){const fav=Array.isArray(favorites)?favorites.length:0;const cmp=Array.isArray(compareSelected)?compareSelected.length:0;const alerts=Object.keys(priceAlerts||{}).length;let recent=0;try{recent=JSON.parse(localStorage.getItem('tecnopreco-recent')||'[]').length}catch(e){}document.getElementById('detail').innerHTML=`<div class="compare-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>📊 A minha actividade</h2><span class="compare-count">TecnoPreço</span></div><p class="compare-note">Um resumo da utilização guardado neste dispositivo.</p><div class="shops"><div class="source-row"><span><strong>♡ Favoritos</strong><small>Produtos guardados</small></span><strong>${fav}</strong></div><div class="source-row"><span><strong>⚖️ Comparação</strong><small>Produtos seleccionados</small></span><strong>${cmp}/3</strong></div><div class="source-row"><span><strong>🔔 Alertas</strong><small>Alertas de preço activos</small></span><strong>${alerts}</strong></div><div class="source-row"><span><strong>👁️ Vistos recentemente</strong><small>Últimos produtos consultados</small></span><strong>${recent}</strong></div></div></div>`;window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});}
function offerBadge(p,o){if(!o)return '';const pref=preferredStoreIds().some(id=>{const st=stores.find(x=>x.id===id);return st&&st.name===o.store});return pref?'⭐ Loja preferida':''}
function recommendationHtml(p){const os=offersFor(p).slice().sort((a,b)=>a.price-b.price);if(!os.length)return '';const best=os[0],pref=preferredOffer(p);let label='💶 Melhor preço';let chosen=best;if(pref&&pref.price<=best.price+10){chosen=pref;label=pref.price===best.price?'⭐ Melhor preço na loja preferida':'⭐ Boa opção na loja preferida'}return `<div class="recommend-box"><b>✨ Oferta em destaque</b><span>${label}</span><strong>${euro(chosen.price)}</strong><small>${chosen.store} · ${chosen.stock?'Stock disponível':'Disponibilidade limitada'}</small>${offerSourceHtml(chosen)}</div>`}
function tp128Download(name,text,mime='application/json'){
 const blob=new Blob([text],{type:mime});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
}
function exportCatalogJSON(){
 const payload={version:'1.0',exportedAt:new Date().toISOString(),source:'TecnoPreço local',products};
 tp128Download('tecnopreco-catalogo-backup.json',JSON.stringify(payload,null,2));toast('💾 Catálogo exportado em JSON');
}
function exportCatalogCSV(){
 const rows=[['id','nome','categoria','rating','melhor_preco','lojas','ofertas']];
 products.forEach(p=>{const os=(p.offers||[]).slice().sort((a,b)=>Number(a.price)-Number(b.price));rows.push([p.id,p.name,p.category,p.rating||'',os[0]?.price??'',os.map(o=>o.store).join(' | '),os.length])});
 const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n');tp128Download('tecnopreco-catalogo.csv','\ufeff'+csv,'text/csv;charset=utf-8');toast('📄 Catálogo exportado em CSV');
}
function validateImportedCatalog(data){
 const arr=Array.isArray(data)?data:(data&&Array.isArray(data.products)?data.products:null);if(!arr)return {ok:false,error:'O ficheiro não contém uma lista de produtos válida.'};
 const clean=arr.filter(p=>p&&p.name&&p.category).map((p,i)=>({...p,id:p.id??Date.now()+i,offers:Array.isArray(p.offers)?p.offers:[]}));
 if(!clean.length)return {ok:false,error:'Não foram encontrados produtos válidos.'};
 return {ok:true,products:clean};
}
function importCatalogFile(input){
 const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);const result=validateImportedCatalog(data);if(!result.ok){toast('⚠️ '+result.error);return}products=result.products;try{localStorage.setItem('tecnopreco-catalog-override',JSON.stringify(products))}catch(e){};populateFilters();apply();toast('✅ Catálogo importado: '+products.length+' produtos')}catch(e){toast('⚠️ JSON inválido')}};reader.readAsText(file);input.value='';
}
function restoreDemoCatalog(){
 try{localStorage.removeItem('tecnopreco-catalog-override');location.reload()}catch(e){location.reload()}
}
function showCatalogManager(){
 document.getElementById('detail').innerHTML=`<div class="compare-panel catalog-panel"><button class="back" onclick="showAdmin()">← Backoffice</button><div class="compare-head"><h2>🗃️ Gestão do catálogo</h2><span class="compare-count">V128</span></div><p class="compare-note">Importa, exporta e faz cópias de segurança do catálogo. A importação é local neste dispositivo e não substitui uma futura base de dados central.</p><div class="catalog-kpis"><div><b>${products.length}</b><small>Produtos carregados</small></div><div><b>${new Set(products.map(p=>p.category)).size}</b><small>Categorias</small></div><div><b>${new Set(products.map(p=>(p.name||'').split(' ')[0])).size}</b><small>Marcas detectadas</small></div></div><div class="catalog-actions"><button class="primary" onclick="exportCatalogJSON()">⬇️ Exportar JSON</button><button class="secondary" onclick="exportCatalogCSV()">⬇️ Exportar CSV</button><label class="secondary catalog-upload">⬆️ Importar JSON<input type="file" accept="application/json,.json" onchange="importCatalogFile(this)" hidden></label><button class="secondary" onclick="restoreDemoCatalog()">↩️ Restaurar catálogo demo</button></div><div class="catalog-note"><b>🔐 Segurança</b><span>Os ficheiros são tratados localmente. Antes de importar um catálogo, confirma a origem dos dados e evita ficheiros de fontes desconhecidas.</span></div><div class="catalog-preview"><b>Pré-visualização</b>${products.slice(0,8).map(p=>`<div><span>${p.icon||'📦'}</span><strong>${p.name}</strong><small>${p.category} · ${euro(bestOffer(p)?.price||0)}</small></div>`).join('')}</div></div>`;window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}

function showAdmin(){
 const offers=products.reduce((n,p)=>n+(p.offers||[]).length,0);
 const cats=[...new Set(products.map(p=>p.category))];
 const brands=[...new Set(products.map(p=>(p.name||'').split(' ')[0]).filter(Boolean))];
 const users=(()=>{try{return JSON.parse(localStorage.getItem('tecnopreco-users')||'[]').length}catch(e){return 0}})();
 const alerts=Object.keys(priceAlerts||{}).length;
 const fav=Array.isArray(favorites)?favorites.length:0;
 const views=(()=>{try{return JSON.parse(localStorage.getItem('tecnopreco-recent')||'[]').length}catch(e){return 0}})();
 const history=Object.values(priceHistory||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0);
 const storesCount=stores.length;
 const avgRating=(products.reduce((n,p)=>n+(Number(p.rating)||0),0)/(products.length||1)).toFixed(1);
 const low=products.map(p=>bestOffer(p)?.price||Infinity).filter(Number.isFinite).sort((a,b)=>a-b).slice(0,5);
 const top=products.slice().sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0)).slice(0,5);
 const catRows=cats.map(c=>{const n=products.filter(p=>p.category===c).length;return `<div class="admin-row"><span><strong>${c}</strong><small>${n} produtos</small></span><b>${n}</b></div>`}).join('');
 const topRows=top.map(p=>`<div class="admin-row"><span><strong>${p.icon||'▣'} ${p.name}</strong><small>${p.category} · ${p.rating||'—'} ★</small></span><b>${euro(bestOffer(p)?.price||0)}</b></div>`).join('');
 const trend=low.map((v,i)=>`<span class="admin-bar" style="height:${Math.max(18,70-(i*9))}%" title="${euro(v)}"></span>`).join('');
 document.getElementById('detail').innerHTML=`<div class="compare-panel admin-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>📊 Backoffice & estatísticas</h2><span class="compare-count">DADOS DEMONSTRATIVOS</span></div><p class="compare-note">Painel administrativo separado da área pública. Os números abaixo são calculados localmente a partir do catálogo e dos dados deste dispositivo; não representam utilizadores ou vendas reais.</p>
 <div class="admin-kpis"><div class="admin-kpi"><span>📦</span><strong>${products.length}</strong><small>Produtos</small></div><div class="admin-kpi"><span>🏪</span><strong>${storesCount}</strong><small>Lojas/fontes</small></div><div class="admin-kpi"><span>🏷️</span><strong>${offers}</strong><small>Ofertas</small></div><div class="admin-kpi"><span>⭐</span><strong>${avgRating}</strong><small>Avaliação média</small></div><div class="admin-kpi"><span>🔔</span><strong>${alerts}</strong><small>Alertas activos</small></div><div class="admin-kpi"><span>❤️</span><strong>${fav}</strong><small>Favoritos</small></div></div>
 <div class="admin-grid"><div class="admin-card"><div class="admin-card-head"><b>📦 Catálogo por categoria</b><small>${cats.length} categorias</small></div>${catRows}</div><div class="admin-card"><div class="admin-card-head"><b>🔥 Produtos em destaque</b><small>por avaliação</small></div>${topRows}</div></div>
 <div class="admin-grid"><div class="admin-card"><div class="admin-card-head"><b>📈 Indicadores do sistema</b><small>estado local</small></div><div class="admin-metrics"><div><b>${views}</b><small>Vistos recentes</small></div><div><b>${history}</b><small>Registos de preços</small></div><div><b>${users}</b><small>Contas locais</small></div><div><b>${brands.length}</b><small>Marcas detectadas</small></div></div></div><div class="admin-card"><div class="admin-card-head"><b>💶 Faixa dos melhores preços</b><small>5 menores ofertas</small></div><div class="admin-chart">${trend}</div><div class="admin-price-list">${low.map(v=>`<span>${euro(v)}</span>`).join('')}</div></div></div>
 <div class="admin-card"><div class="admin-card-head"><b>🛰️ Estado das fontes</b><small>${integrationConfig.refreshIntervalMinutes} min · sincronização prevista</small></div><div class="admin-source-grid">${stores.map(st=>{const c=integrationConfig.sources[st.id]||{};return `<div><span>${storeLogo(st.name)}</span><strong>${st.name}</strong><small>● ${c.status==='connected'?'Ligada':'Preparada'} · ${st.type==='marketplace'?'Marketplace':'Loja'}</small></div>`}).join('')}</div></div>
 <div class="admin-actions"><button class="primary" onclick="showSources()">🔗 Gerir fontes</button><button class="secondary" onclick="showAdmin()">↻ Actualizar métricas</button><button class="secondary" onclick="showCatalogManager()">🗃️ Gerir catálogo</button><button class="secondary" onclick="showApiCenter()">🔌 APIs e dados reais</button><button class="secondary" onclick="showReviewManager()">⭐ Avaliações</button><button class="secondary" onclick="showShareCenter()">🔗 Partilha inteligente</button><button class="secondary" onclick="toast('Área protegida: autenticação de administrador necessária no backend')">🔐 Acesso administrativo</button></div>
 <small class="admin-footnote">TecnoPreço · Backoffice V127 · preparado para ligação futura a base de dados, autenticação por função, analytics e APIs autorizadas.</small></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}

function showReviewManager(){const all=(()=>{try{return JSON.parse(localStorage.getItem('tecnopreco-reviews')||'{}')}catch(e){return {}}})();const entries=Object.entries(all).flatMap(([id,rs])=>(Array.isArray(rs)?rs:[]).map(r=>({id:Number(id),...r})));const avg=entries.length?(entries.reduce((n,r)=>n+Number(r.rating||0),0)/entries.length).toFixed(1):'—';const rows=entries.slice(0,30).map(r=>{const p=products.find(x=>x.id===r.id);return `<div class="review-row"><div><strong>${escapeHtml(p?.name||'Produto #'+r.id)}</strong><span>${'★'.repeat(Number(r.rating)||0)}${'☆'.repeat(5-(Number(r.rating)||0))}</span><small>${escapeHtml(r.name||'Utilizador')} · ${escapeHtml(r.date||'')}</small></div><p>${escapeHtml(r.text||'')}</p></div>`}).join('');document.getElementById('detail').innerHTML=`<div class="compare-panel reviews-panel"><button class="back" onclick="showAdmin()">← Backoffice</button><div class="compare-head"><h2>⭐ Gestão de avaliações</h2><span class="compare-count">LOCAL</span></div><p class="compare-note">Painel de reputação preparado para futura moderação e avaliações verificadas. Os dados actuais são apenas locais/demonstrativos.</p><div class="partner-kpis"><div><b>${entries.length}</b><small>Avaliações</small></div><div><b>${avg}</b><small>Média</small></div><div><b>${new Set(entries.map(r=>r.id)).size}</b><small>Produtos avaliados</small></div><div><b>${entries.filter(r=>Number(r.rating)>=4).length}</b><small>4–5 estrelas</small></div></div><div class="reviews-list">${rows||'<div class="empty">Ainda não existem avaliações locais.</div>'}</div><div class="admin-actions"><button class="secondary" onclick="exportReviews()">⬇️ Exportar avaliações</button><button class="secondary" onclick="clearReviews()">🗑️ Limpar avaliações locais</button></div></div>`;window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'})}
function exportReviews(){const data=localStorage.getItem('tecnopreco-reviews')||'{}';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download='tecnopreco-avaliacoes.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function clearReviews(){if(!confirm('Apagar todas as avaliações locais?'))return;localStorage.removeItem('tecnopreco-reviews');showReviewManager();toast('Avaliações locais apagadas')}
function showAbout(){document.getElementById('detail').innerHTML=`<div class="compare-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>ℹ️ Sobre o TecnoPreço</h2><span class="compare-count">V3</span></div><p class="compare-note">O TecnoPreço é um protótipo de comparação de preços de tecnologia. Os preços apresentados nesta versão são dados de demonstração e podem não representar preços actuais das lojas.</p><div class="shops"><div class="source-row"><span><strong>🔎 Comparação</strong><small>Pesquisa, filtros e comparação de ofertas</small></span></div><div class="source-row"><span><strong>🔔 Alertas</strong><small>Alertas e histórico guardados neste dispositivo</small></span></div><div class="source-row"><span><strong>🔗 Fontes</strong><small>Preparado para integrações autorizadas</small></span></div></div></div>`;window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});}
function partnerSettings(){try{return JSON.parse(localStorage.getItem('tecnopreco-partners')||'{}')}catch(e){return {}}}
function savePartnerSettings(v){try{localStorage.setItem('tecnopreco-partners',JSON.stringify(v))}catch(e){}}
function partnerState(id){const all=partnerSettings();return all[id]||{enabled:true,priority:'normal',refresh:60}}
function setPartnerState(id,key,value){const all=partnerSettings();all[id]={...partnerState(id),[key]:value};savePartnerSettings(all);showSources()}
function partnerStatus(id){const c=integrationConfig.sources[id]||{};const st=partnerState(id);if(!st.enabled)return ['Desactivada','off'];if(c.status==='connected')return ['Ligada','on'];if(c.status==='error')return ['Erro','error'];return ['Preparada','ready']}
function showSources(){
 const enabled=stores.filter(s=>partnerState(s.id).enabled).length;
 const rows=stores.map(s=>{const c=integrationConfig.sources[s.id]||{}, st=partnerState(s.id), ps=partnerStatus(s.id);return `<div class="partner-row"><div class="partner-main"><span>${storeLogo(s.name)}</span><div><strong>${s.name}</strong><small>${s.type==='marketplace'?'Marketplace':'Loja'} · ${c.method||'feed/API'} · actualização prevista ${st.refresh} min</small></div></div><span class="partner-pill ${ps[1]}">● ${ps[0]}</span><label class="partner-toggle"><input type="checkbox" ${st.enabled?'checked':''} onchange="setPartnerState('${s.id}','enabled',this.checked)"><span>Activa</span></label><select onchange="setPartnerState('${s.id}','priority',this.value)"><option value="low" ${st.priority==='low'?'selected':''}>Baixa</option><option value="normal" ${st.priority==='normal'?'selected':''}>Normal</option><option value="high" ${st.priority==='high'?'selected':''}>Alta</option></select></div>`}).join('');
 document.getElementById('detail').innerHTML=`<div class="compare-panel partner-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🏪 Lojas e parceiros</h2><span class="compare-count">${enabled}/${stores.length} activas</span></div><p class="compare-note">Centro de gestão dos parceiros do TecnoPreço. Cada loja tem um conector independente e pode ter prioridade e frequência próprias. Os preços reais só entram através de APIs, feeds ou acordos autorizados.</p><div class="partner-kpis"><div><b>${stores.length}</b><small>Parceiros configurados</small></div><div><b>${enabled}</b><small>Fontes activas</small></div><div><b>${stores.filter(s=>s.type==='marketplace').length}</b><small>Marketplaces</small></div><div><b>${stores.filter(s=>(integrationConfig.sources[s.id]||{}).status==='connected').length}</b><small>Ligadas agora</small></div></div><div class="partner-toolbar"><button class="primary" onclick="partnerBroadcast()">📡 Verificar ligações</button><button class="secondary" onclick="partnerReset()">↩️ Repor configuração</button><button class="secondary" onclick="partnerExport()">⬇️ Exportar configuração</button></div><div class="notice"><div><b>🛡️ Dados</b>Somente fontes autorizadas</div><div><b>⏱️ Sincronização</b>${integrationConfig.refreshIntervalMinutes} min por defeito</div><div><b>🔎 Qualidade</b>Fonte + preço + data</div></div><div class="partner-list">${rows}</div><div class="partner-note"><b>⚠️ Estado actual</b> “Preparada” significa que a arquitectura está pronta para receber uma integração real. Não significa que o TecnoPreço esteja actualmente ligado à loja.</div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
function partnerBroadcast(){toast('Verificação concluída: conectores prontos; nenhuma fonte real foi consultada.');}
function partnerReset(){savePartnerSettings({});showSources();toast('Configuração dos parceiros reposta');}
function partnerExport(){const blob=new Blob([JSON.stringify(partnerSettings(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='tecnopreco-parceiros.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}

try{const lu=localStorage.getItem('tecnopreco-last-update');if(lu){const el=document.getElementById('lastUpdate');if(el)el.textContent='Última actualização: '+new Date(lu).toLocaleString('pt-PT',{dateStyle:'short',timeStyle:'short'})+' · dados do protótipo'}}catch(e){}
function showPriceTrend(id){
 const p=products.find(x=>x.id===id); if(!p)return;
 const h=(priceHistory[id]||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
 if(h.length<2){toast('Ainda não existem registos suficientes para a evolução do preço');return;}
 const vals=h.map(x=>Number(x.price)||0), min=Math.min(...vals), max=Math.max(...vals), last=vals[vals.length-1], first=vals[0];
 const change=first?((last-first)/first*100):0;
 const rows=h.slice(-8).map(x=>`<div class="source-row"><span><strong>${x.date}</strong><small>${x.store||'—'}</small></span><strong>${euro(x.price)}</strong></div>`).join('');
 document.getElementById('detail').innerHTML=`<div class="compare-panel"><button class="back" onclick="showProduct(${id})">← Voltar ao produto</button><div class="compare-head"><h2>📈 Evolução do preço</h2><span class="compare-count">${h.length} registos</span></div><div class="notice"><div><b>Inicial</b>${euro(first)}</div><div><b>Actual</b>${euro(last)}</div><div><b>Mínimo</b>${euro(min)}</div><div><b>Máximo</b>${euro(max)}</div></div><p class="compare-note">${change<0?'📉 O preço desceu ':change>0?'📈 O preço subiu ':'↔️ O preço não mudou '}${Math.abs(change).toFixed(1)}% desde o primeiro registo.</p><div class="shops">${rows}</div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}

function notificationStore(){try{return JSON.parse(localStorage.getItem('tecnopreco-notifications')||'[]')||[]}catch(e){return[]}}
function saveNotifications(a){try{localStorage.setItem('tecnopreco-notifications',JSON.stringify(a.slice(0,60)))}catch(e){}}
function seedNotifications(){let a=notificationStore();if(!a.length){a=[{id:Date.now(),type:'info',title:'Bem-vindo ao Centro de Notificações',text:'Aqui vais encontrar alertas de preços, novidades e actividade da tua conta.',date:new Date().toISOString(),read:false},{id:Date.now()-1,type:'price',title:'Alertas de preço activos',text:'Quando um preço-alvo for atingido, a ocorrência ficará disponível aqui.',date:new Date().toISOString(),read:false}];saveNotifications(a)}}
function notificationBadge(){const n=notificationStore().filter(x=>!x.read).length;const b=document.getElementById('notificationBadge');if(b){b.textContent=n?String(n):'';b.style.display=n?'inline-flex':'none'}}
function pushNotification(type,title,text){const a=notificationStore();a.unshift({id:Date.now(),type,title,text,date:new Date().toISOString(),read:false});saveNotifications(a);notificationBadge();toast('🔔 '+title)}
function showNotifications(){seedNotifications();const a=notificationStore();const rows=a.map(n=>`<button class="notification-item ${n.read?'read':''}" onclick="readNotification(${n.id})"><span class="notification-icon">${n.type==='price'?'📉':n.type==='deal'?'🏷️':n.type==='system'?'⚙️':'🔔'}</span><span><strong>${escapeSecurity(n.title)}</strong><small>${escapeSecurity(n.text)}</small><em>${new Date(n.date).toLocaleString('pt-PT',{dateStyle:'short',timeStyle:'short'})}</em></span>${n.read?'':'<b class="notification-dot">●</b>'}</button>`).join('');document.getElementById('detail').innerHTML=`<div class="compare-panel notifications-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🔔 Centro de notificações</h2><span class="compare-count">${a.filter(x=>!x.read).length} novas</span></div><div class="notification-actions"><button class="filter" onclick="markAllNotificationsRead()">✓ Marcar todas como lidas</button><button class="filter" onclick="clearNotifications()">🗑️ Limpar</button></div><p class="compare-note">Alertas e actividade ficam guardados localmente neste dispositivo. Dados demonstrativos são identificados como tal.</p><div class="notifications-list">${rows||'<div class="empty">Não tens notificações.</div>'}</div></div>`;window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'})}
function readNotification(id){const a=notificationStore();const n=a.find(x=>x.id===id);if(n)n.read=true;saveNotifications(a);notificationBadge();showNotifications()}
function markAllNotificationsRead(){const a=notificationStore().map(x=>({...x,read:true}));saveNotifications(a);notificationBadge();showNotifications();toast('Notificações marcadas como lidas')}
function clearNotifications(){if(!confirm('Apagar todas as notificações deste dispositivo?'))return;saveNotifications([]);notificationBadge();showNotifications();toast('Notificações apagadas')}
function checkPriceNotifications(){try{Object.entries(priceAlerts||{}).forEach(([id,target])=>{const p=products.find(x=>x.id===Number(id));if(!p)return;const cur=bestOffer(p).price;if(cur<=Number(target)){const key='tp-notified-'+id+'-'+Number(target);if(localStorage.getItem(key)!=='1'){pushNotification('price','Preço-alvo atingido',p.name+' está a '+euro(cur)+' (alvo '+euro(Number(target))+').');localStorage.setItem(key,'1')}}})}catch(e){}}



/* FASE 141 — Acessibilidade, PWA e experiência resiliente */
const TP141_PREF_KEY='tecnopreco-accessibility-v141';
function tp141Prefs(){try{return JSON.parse(localStorage.getItem(TP141_PREF_KEY)||'{}')}catch(e){return {}}}
function tp141SavePrefs(v){try{localStorage.setItem(TP141_PREF_KEY,JSON.stringify(v))}catch(e){}}
function tp141ApplyPrefs(){
 const p=tp141Prefs(), root=document.documentElement;
 root.classList.toggle('tp141-large-text',!!p.largeText);
 root.classList.toggle('tp141-high-contrast',!!p.highContrast);
 root.classList.toggle('tp141-reduced-motion',!!p.reducedMotion);
 root.classList.toggle('tp141-focus',p.focusMode!==false);
}
function tp141SetPref(key,value){const p={...tp141Prefs(),[key]:!!value};tp141SavePrefs(p);tp141ApplyPrefs();showAccessibility();}
function showAccessibility(){
 const p=tp141Prefs(), online=navigator.onLine!==false;
 document.getElementById('detail').innerHTML=`<div class="compare-panel tp141-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>♿ Acessibilidade e experiência</h2><span class="compare-count">FASE 141</span></div><p class="compare-note">Preferências guardadas neste dispositivo. O TecnoPreço mantém o mesmo visual futurista, mas adapta leitura, movimento e navegação.</p><div class="tp141-status-grid"><div><b>${online?'🟢 Online':'🟠 Offline'}</b><small>estado da ligação</small></div><div><b>📱 PWA</b><small>estrutura instalada</small></div><div><b>⌨️ Teclado</b><small>atalhos e foco</small></div></div><div class="tp141-options"><label><input type="checkbox" ${p.largeText?'checked':''} onchange="tp141SetPref('largeText',this.checked)"> Texto maior</label><label><input type="checkbox" ${p.highContrast?'checked':''} onchange="tp141SetPref('highContrast',this.checked)"> Contraste reforçado</label><label><input type="checkbox" ${p.reducedMotion?'checked':''} onchange="tp141SetPref('reducedMotion',this.checked)"> Reduzir animações</label><label><input type="checkbox" ${p.focusMode!==false?'checked':''} onchange="tp141SetPref('focusMode',this.checked)"> Realçar foco do teclado</label></div><div class="tp141-help"><b>⌨️ Atalhos</b><span><kbd>/</kbd> pesquisa</span><span><kbd>Esc</kbd> fecha menus</span><span><kbd>Enter</kbd> executa pesquisa</span></div><div class="admin-actions"><button class="secondary" onclick="tp141SavePrefs({});tp141ApplyPrefs();showAccessibility();toast('Preferências repostas')">↩️ Repor preferências</button></div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
function tp141NetworkStatus(){
 const el=document.getElementById('tp141Status'); if(!el)return;
 const online=navigator.onLine!==false; el.textContent=online?'':'⚠️ Estás offline — o TecnoPreço continua disponível com os dados guardados neste dispositivo.'; el.classList.toggle('visible',!online);
}
tp141ApplyPrefs();
window.addEventListener('online',tp141NetworkStatus);window.addEventListener('offline',tp141NetworkStatus);
setTimeout(tp141NetworkStatus,0);

function toast(t){let x=document.getElementById('toast');x.textContent=t;x.style.display='block';clearTimeout(window.tt);window.tt=setTimeout(()=>x.style.display='none',1800)}
document.getElementById('search').addEventListener('keydown',e=>{if(e.key==='Enter')apply()});
document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==document.getElementById('search')){e.preventDefault();document.getElementById('search').focus()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const ov=document.getElementById('menuOverlay');if(ov?.classList.contains('open'))toggleMenu();const sg=document.getElementById('suggestions');if(sg)sg.style.display='none'}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();document.getElementById('search').focus()}});
let tp140SearchTimer=null;
document.getElementById('search').addEventListener('input',()=>{clearTimeout(tp140SearchTimer);updateSuggestions();tp140SearchTimer=setTimeout(()=>apply(),180)});
document.getElementById('search').addEventListener('focus',updateSuggestions);
seedNotifications();
notificationBadge();
renderRecentSearches();
renderRecentProducts();
document.addEventListener('click',e=>{if(!e.target.closest('.search')){const box=document.getElementById('suggestions');if(box)box.style.display='none'}});
applyRuntimeConfiguration();
document.getElementById('sourceStatus').textContent=runtimeEnvironment==='production'&&!backendRuntime.enabled?'Produção · backend ainda não configurado':(runtimeEnvironment==='development'?'Dados de demonstração · estrutura real pronta':runtimeConfig.label+' · estrutura real pronta');
renderHome();
apply();
loadCatalogDatabase().then(ok=>{
 if(ok){
  renderHome();
  apply();
  updateCompareBar();
  renderUserPanel();
  const el=document.getElementById('sourceStatus');
  if(el)el.textContent=(runtimeEnvironment==='development'?'Base de dados modular · ':'')+'Catálogo '+(window.__TECNOPRECO_CATALOG__?.catalogVersion||'103')+' · '+products.length+' produtos';
 }
}).catch(()=>{});
openProductFromHash();
setupKeyboardShortcuts();
try{startFrontendScheduler()}catch(e){}
try{checkPriceNotifications()}catch(e){}



/* TECNOPRECO_V138 — Qualidade e monitorização de dados */
function dataQualityCenter(){
 const ps=Array.isArray(products)?products:[];
 const cats=new Set(ps.map(p=>p.category).filter(Boolean)).size;
 const brands=new Set(ps.map(p=>p.brand).filter(Boolean)).size;
 const missing=ps.filter(p=>!p.name||!p.brand||!p.category||!Array.isArray(p.offers)||!p.offers.length).length;
 const prices=ps.flatMap(p=>(p.offers||[]).map(o=>Number(o.price))).filter(Number.isFinite);
 const invalid=ps.filter(p=>(p.offers||[]).some(o=>!Number.isFinite(Number(o.price))||Number(o.price)<=0)).length;
 const completeness=ps.length?Math.max(0,Math.round(((ps.length-missing)/ps.length)*100)):100;
 const freshnessKey='tecnopreco_data_quality_v138';
 let state={lastCheck:null,checks:0}; try{state=JSON.parse(localStorage.getItem(freshnessKey)||'null')||state}catch(e){}
 const avg=prices.length?prices.reduce((a,b)=>a+b,0)/prices.length:0;
 return `<section class="api-panel quality-panel"><div class="api-head"><div><span class="eyebrow">FASE 138</span><h2>🧪 Qualidade e Saúde dos Dados</h2><p>Monitorização local da consistência do catálogo antes de aceitar preços e stock.</p></div><button class="btn" onclick="runDataQualityCheck()">🔍 Verificar agora</button></div><div class="quality-score"><div><strong>${completeness}%</strong><span>completude do catálogo</span></div><div><strong>${ps.length}</strong><span>produtos</span></div><div><strong>${cats}</strong><span>categorias</span></div><div><strong>${brands}</strong><span>marcas</span></div></div><div class="api-grid"><article class="api-card"><strong>📋 Campos essenciais</strong><p>${missing?missing+' produtos precisam de revisão.':'Todos os produtos têm os campos essenciais.'}</p><span class="api-status ${missing?'demo':'ok'}">${missing?'REVISÃO':'OK'}</span></article><article class="api-card"><strong>💶 Preços</strong><p>${prices.length} preços analisados · média ${prices.length?euro(avg):'—'}</p><span class="api-status ${invalid?'demo':'ok'}">${invalid?'ERROS':'OK'}</span></article><article class="api-card"><strong>🩺 Estado do catálogo</strong><p>Última verificação: ${state.lastCheck?new Date(state.lastCheck).toLocaleString('pt-PT'):'ainda não executada'}</p><span class="api-status ${state.lastCheck?'ok':'demo'}">${state.lastCheck?'MONITORIZADO':'PENDENTE'}</span></article></div><div class="api-note">ℹ️ Esta verificação é local e demonstrativa. Não substitui validações do servidor nem garante a actualidade de preços externos.</div></section>`;
}
function runDataQualityCheck(){
 const key='tecnopreco_data_quality_v138';let s={lastCheck:null,checks:0};try{s=JSON.parse(localStorage.getItem(key)||'null')||s}catch(e){};s.lastCheck=new Date().toISOString();s.checks=(s.checks||0)+1;localStorage.setItem(key,JSON.stringify(s));toast('🧪 Verificação de dados concluída');showDataQuality();}
function showDataQuality(){document.getElementById('detail').innerHTML='<div class="compare-panel">'+dataQualityCenter()+'</div>';window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});}

/* TECNOPRECO_V137 */
function partnerFeedCenter(){
  const key='tecnopreco_partner_feeds_v137';
  let feeds=[]; try{feeds=JSON.parse(localStorage.getItem(key)||'null')||[]}catch(e){}
  if(!feeds.length) feeds=[
    {name:'Feed demonstrativo — Loja A',type:'JSON',status:'demo',lastSync:'—',products:0},
    {name:'Feed demonstrativo — Loja B',type:'CSV',status:'demo',lastSync:'—',products:0}
  ];
  const html=`<section class="api-panel"><div class="api-head"><div><span class="eyebrow">FASE 137</span><h2>🌐 Centro de Integração de Feeds</h2><p>Preparação para receber catálogos, preços e stock de parceiros através de feeds autorizados.</p></div><button class="btn" onclick="addPartnerFeed()">＋ Adicionar feed</button></div><div class="api-grid">${feeds.map((f,i)=>`<article class="api-card"><div class="api-card-top"><strong>${escapeSecurity(f.name)}</strong><span class="api-status ${f.status==='ok'?'ok':'demo'}">${f.status==='ok'?'ATIVO':'DEMO'}</span></div><div class="api-meta"><span>${escapeSecurity(f.type)}</span><span>${f.products||0} produtos</span><span>Última sync: ${escapeSecurity(f.lastSync)}</span></div><div class="api-actions"><button class="btn ghost" onclick="testPartnerFeed(${i})">Testar</button><button class="btn ghost" onclick="removePartnerFeed(${i})">Remover</button></div></article>`).join('')}</div><div class="api-note">ℹ️ Os feeds apresentados são demonstrativos. Nenhuma loja externa é consultada sem uma integração/autorização real.</div></section>`;
  return html;
}
function addPartnerFeed(){
  const name=prompt('Nome do parceiro/feed:'); if(!name)return;
  const type=prompt('Formato (JSON, CSV ou XML):','JSON')||'JSON';
  const key='tecnopreco_partner_feeds_v137'; let feeds=[]; try{feeds=JSON.parse(localStorage.getItem(key)||'[]')}catch(e){}
  feeds.push({name,type:type.toUpperCase(),status:'demo',lastSync:'—',products:0}); localStorage.setItem(key,JSON.stringify(feeds)); location.reload();
}
function testPartnerFeed(i){alert('Teste preparado. A ligação real só será executada quando existir um endpoint/feed autorizado.');}
function removePartnerFeed(i){const key='tecnopreco_partner_feeds_v137';let feeds=JSON.parse(localStorage.getItem(key)||'[]');feeds.splice(i,1);localStorage.setItem(key,JSON.stringify(feeds));location.reload();}


// FASE 139 - Testes e estabilidade

// FASE 139 - Testes e estabilidade
function runStabilityTests(){
 const tests=[];
 const add=(name,ok,detail)=>tests.push({name,ok:!!ok,detail:String(detail||'')});
 try{add('Catálogo carregado',Array.isArray(products)&&products.length>0,Array.isArray(products)?products.length+' produtos':'catálogo indisponível')}catch(e){add('Catálogo carregado',false,e.message)}
 try{const ids=products.map(p=>p.id);add('IDs únicos',new Set(ids).size===ids.length,'IDs: '+ids.length)}catch(e){add('IDs únicos',false,e.message)}
 try{const bad=products.filter(p=>!p.name||!p.category||typeof p.price!=='number'||p.price<0);add('Campos e preços válidos',bad.length===0,bad.length+' produtos com problemas')}catch(e){add('Campos e preços válidos',false,e.message)}
 try{const cats=new Set(products.map(p=>p.category));const bad=products.filter(p=>!cats.has(p.category));add('Categorias consistentes',bad.length===0,'Categorias: '+cats.size)}catch(e){add('Categorias consistentes',false,e.message)}
 try{const raw=localStorage.getItem('tecnopreco-favorites');JSON.parse(raw||'[]');add('Favoritos persistentes',true,'armazenamento legível')}catch(e){add('Favoritos persistentes',false,e.message)}
 try{const raw=localStorage.getItem('tecnopreco-notifications');JSON.parse(raw||'[]');add('Notificações persistentes',true,'armazenamento legível')}catch(e){add('Notificações persistentes',false,e.message)}
 try{const raw=localStorage.getItem('tecnopreco-recent-searches');const x=JSON.parse(raw||'[]');add('Histórico de pesquisa',Array.isArray(x),'estrutura '+(Array.isArray(x)?'válida':'inválida'))}catch(e){add('Histórico de pesquisa',false,e.message)}
 try{const api=apiArchitecture();add('Contrato API',!!api&&!!api.version,api.mode||'indefinido')}catch(e){add('Contrato API',false,e.message)}
 const passed=tests.filter(t=>t.ok).length, failed=tests.length-passed, score=Math.round(passed/tests.length*100);
 const state={runAt:new Date().toISOString(),passed,failed,score,tests};
 try{localStorage.setItem('tecnopreco-stability-report',JSON.stringify(state))}catch(e){}
 return state;
}
function showStabilityCenter(){
 const r=runStabilityTests();
 const rows=r.tests.map(t=>`<div class="stability-row ${t.ok?'ok':'fail'}"><span>${t.ok?'✓':'⚠️'}</span><strong>${escapeSecurity(t.name)}</strong><small>${escapeSecurity(t.detail)}</small></div>`).join('');
 document.getElementById('detail').innerHTML=`<div class="compare-panel stability-panel"><button class="back" onclick="showAdmin()">← Backoffice</button><div class="compare-head"><h2>🧪 Testes e estabilidade</h2><span class="compare-count">${r.score}%</span></div><p class="compare-note">Diagnóstico local dos principais fluxos e estruturas da aplicação. Estes testes não substituem testes de servidor, carga ou segurança de produção.</p><div class="partner-kpis"><div><b>${r.score}%</b><small>Saúde</small></div><div><b>${r.passed}</b><small>Testes OK</small></div><div><b>${r.failed}</b><small>Avisos</small></div><div><b>${new Date(r.runAt).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})}</b><small>Última execução</small></div></div><div class="stability-list">${rows}</div><div class="admin-actions"><button class="primary" onclick="showStabilityCenter()">↻ Executar novamente</button><button class="secondary" onclick="exportStabilityReport()">⬇️ Exportar relatório</button></div><div class="catalog-note"><b>⚠️ Limite do diagnóstico</b><span>O estado apresentado é local/demonstrativo. Integrações reais, APIs, autenticação e disponibilidade de lojas exigem testes no ambiente de produção.</span></div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
function exportStabilityReport(){const r=JSON.parse(localStorage.getItem('tecnopreco-stability-report')||'{}');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.download='tecnopreco-stability-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}

/* TECNOPRECO_V142 — Resiliência, recuperação e controlo de dados locais */
function tp142StorageReport(){
 const keys=[]; for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k)keys.push(k)}
 let bytes=0; keys.forEach(k=>{try{bytes+=(k.length+(localStorage.getItem(k)||'').length)*2}catch(e){}});
 return {keys,bytes,estimatedKB:Math.round(bytes/1024),catalogOverride:!!localStorage.getItem('tecnopreco-catalog-override'),preferences:!!localStorage.getItem('tecnopreco-a11y-v141')};
}
function tp142Download(filename,text,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),700)}
function tp142ExportBackup(){const r=tp142StorageReport();const data={format:'tecnopreco-local-backup',version:'142',createdAt:new Date().toISOString(),catalog:products,localStorage:Object.fromEntries(r.keys.map(k=>[k,localStorage.getItem(k)]))};tp142Download('tecnopreco-backup-v142.json',JSON.stringify(data,null,2));toast('💾 Backup local exportado')}
function tp142RestoreCatalog(){try{const raw=localStorage.getItem('tecnopreco-catalog-override');if(!raw){toast('ℹ️ Não existe catálogo local para recuperar');return}const data=JSON.parse(raw);if(!Array.isArray(data)||!data.length)throw new Error('Catálogo inválido');products=data;populateCatalogFilters();tp140Invalidate();renderHome();apply();toast('♻️ Catálogo local recuperado')}catch(e){toast('⚠️ Não foi possível recuperar o catálogo')}}
function tp142ClearCache(){if(window.caches){caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>{toast('🧹 Cache PWA limpo');setTimeout(()=>location.reload(),350)}).catch(()=>toast('⚠️ Não foi possível limpar o cache'))}else toast('ℹ️ Cache PWA não disponível')}
function tp142ResetLocal(){if(!confirm('Apagar preferências e dados locais do TecnoPreço neste dispositivo? O catálogo demonstrativo será mantido.'))return;const keep=['tecnopreco-catalog-override'];const all=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&!keep.includes(k))all.push(k)}all.forEach(k=>localStorage.removeItem(k));toast('♻️ Dados locais repostos');setTimeout(()=>location.reload(),500)}
function showRecoveryCenter(){
 const r=tp142StorageReport();
 document.getElementById('detail').innerHTML=`<div class="compare-panel tp142-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🛡️ Recuperação e dados locais</h2><span class="compare-count">FASE 142</span></div><p class="compare-note">Controla o armazenamento local, cria uma cópia de segurança e recupera o catálogo guardado neste dispositivo. Nada é enviado para servidores.</p><div class="tp142-kpis"><div><b>${r.keys.length}</b><small>registos locais</small></div><div><b>${r.estimatedKB} KB</b><small>estimativa utilizada</small></div><div><b>${r.catalogOverride?'SIM':'NÃO'}</b><small>catálogo local</small></div><div><b>${navigator.onLine!==false?'ONLINE':'OFFLINE'}</b><small>ligação</small></div></div><div class="tp142-actions"><button class="primary" onclick="tp142ExportBackup()">⬇️ Exportar backup</button><button class="secondary" onclick="tp142RestoreCatalog()">♻️ Recuperar catálogo</button><button class="secondary" onclick="tp142ClearCache()">🧹 Limpar cache PWA</button><button class="secondary danger" onclick="tp142ResetLocal()">⚠️ Repor dados locais</button></div><div class="tp142-list"><div>🔐 Os dados permanecem neste dispositivo até escolheres exportá-los.</div><div>📦 O backup inclui o catálogo e as preferências/estado local disponíveis.</div><div>📴 A recuperação funciona também quando estás offline, desde que os dados já estejam guardados.</div><div>🌐 Não substitui backups ou bases de dados do servidor em produção.</div></div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
function tp142CheckUpdate(){if(navigator.serviceWorker?.controller)toast('🔄 A aplicação está a usar o service worker activo');else toast('ℹ️ O modo PWA fica disponível em HTTPS ou localhost')}

/* TECNOPRECO_V143 — Monitorização de desempenho e diagnóstico operacional */
const tp143Perf={startedAt:performance.now(),longTasks:[],resourceCount:0,resourceBytes:0,lastSearchMs:0,lastRenderMs:0};
function tp143ObservePerformance(){
 try{
  if('PerformanceObserver' in window){
   try{const o=new PerformanceObserver(list=>{list.getEntries().forEach(e=>tp143Perf.longTasks.push(Math.round(e.duration)))});o.observe({type:'longtask',buffered:true});}catch(e){}
  }
 }catch(e){}
}
function tp143MeasureResources(){
 try{const rs=performance.getEntriesByType('resource')||[];tp143Perf.resourceCount=rs.length;tp143Perf.resourceBytes=rs.reduce((n,r)=>n+(Number(r.transferSize)||0),0)}catch(e){}
 return {count:tp143Perf.resourceCount,bytes:tp143Perf.resourceBytes};
}
function tp143Timing(){
 try{
  const n=performance.getEntriesByType('navigation')[0];
  return {dom:Number(n?.domContentLoadedEventEnd)||0,load:Number(n?.loadEventEnd)||0,ttfb:Number(n?.responseStart)||0};
 }catch(e){return {dom:0,load:0,ttfb:0}}
}
function tp143FormatMs(v){return v>0?Math.round(v)+' ms':'—'}
function tp143FormatKB(v){return v>0?(v/1024).toFixed(1)+' KB':'—'}
function tp143Score(){
 const t=tp143Timing(), r=tp143MeasureResources(), long=tp143Perf.longTasks.filter(v=>v>50).length;
 let score=100;
 if(t.load>2500)score-=20;else if(t.load>1500)score-=10;
 if(t.dom>1800)score-=15;else if(t.dom>1000)score-=8;
 if(long>3)score-=15;else if(long>0)score-=7;
 if(r.count>80)score-=10;else if(r.count>40)score-=5;
 return Math.max(0,score);
}
function tp143PerfReport(){const t=tp143Timing(),r=tp143MeasureResources(),s=tp143StorageReport();return {version:'143',createdAt:new Date().toISOString(),score:tp143Score(),navigation:t,resources:r,longTasks:tp143Perf.longTasks.slice(-30),lastSearchMs:tp143Perf.lastSearchMs,lastRenderMs:tp143Perf.lastRenderMs,storage:{keys:s.keys.length,estimatedKB:s.estimatedKB}}}
function tp143Download(name,data){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),700)}
function tp143OpenDiagnostics(){
 const r=tp143PerfReport(),t=r.navigation,score=r.score;
 const status=score>=85?'Excelente':score>=70?'Bom':'A optimizar';
 document.getElementById('detail').innerHTML=`<div class="compare-panel tp143-panel"><button class="back" onclick="showAdmin()">← Backoffice</button><div class="compare-head"><h2>⚡ Desempenho e diagnóstico</h2><span class="compare-count">${score}% · ${status}</span></div><p class="compare-note">Monitorização local do carregamento, operações demoradas, recursos e armazenamento. Não envia métricas para servidores.</p><div class="tp143-kpis"><div><b>${score}%</b><small>Índice local</small></div><div><b>${tp143FormatMs(t.load)}</b><small>Carregamento</small></div><div><b>${tp143FormatMs(t.dom)}</b><small>DOM pronto</small></div><div><b>${r.longTasks.filter(v=>v>50).length}</b><small>Operações lentas</small></div><div><b>${r.resources.count}</b><small>Recursos</small></div><div><b>${tp143FormatKB(r.resources.bytes)}</b><small>Transferência</small></div></div><div class="tp143-grid"><div class="tp143-card"><b>🔎 Operações do TecnoPreço</b><div><span>Pesquisa</span><strong>${tp143FormatMs(r.lastSearchMs)}</strong></div><div><span>Renderização</span><strong>${tp143FormatMs(r.lastRenderMs)}</strong></div><div><span>Armazenamento</span><strong>${r.storage.keys} registos · ${r.storage.estimatedKB} KB</strong></div></div><div class="tp143-card"><b>🩺 Leitura rápida</b><p>${score>=85?'O desempenho local está dentro de uma faixa confortável.':score>=70?'Existem alguns pontos que podem ser optimizados em dispositivos mais lentos.':'Foram detectados sinais de carga/execução que merecem optimização.'}</p><small>Os valores variam consoante dispositivo, navegador, cache e catálogo.</small></div></div><div class="admin-actions"><button class="primary" onclick="tp143OpenDiagnostics()">↻ Medir novamente</button><button class="secondary" onclick="tp143Download('tecnopreco-desempenho-v143.json',tp143PerfReport())">⬇️ Exportar diagnóstico</button></div><div class="catalog-note"><b>🔐 Privacidade</b><span>As métricas desta fase são calculadas e guardadas apenas durante a sessão local; não são enviadas para lojas, parceiros ou servidores.</span></div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
tp143ObservePerformance();
window.addEventListener('load',()=>{try{tp143MeasureResources()}catch(e){}});


/* TECNOPRECO_V144 — Integridade, migração e recuperação controlada do estado local */
const TP144_SCHEMA='1.0.0';
const TP144_KEYS=['tecnopreco-favorites','tecnopreco-recent','tecnopreco-price-alerts','tecnopreco-users','tecnopreco-reviews','tecnopreco-catalog-override','tecnopreco-a11y-v141'];
function tp144Read(key,fallback){try{const v=localStorage.getItem(key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}}
function tp144ValidProducts(list){return Array.isArray(list)&&list.every(p=>p&&Number.isFinite(Number(p.id))&&typeof p.name==='string')}
function tp144Snapshot(){const state={};TP144_KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v!==null)state[k]=v});return {schema:TP144_SCHEMA,createdAt:new Date().toISOString(),state}}
function tp144Validate(){
 const issues=[]; const checks=[];
 const cat=tp144Read('tecnopreco-catalog-override',null);
 checks.push({name:'Catálogo local',ok:cat===null||tp144ValidProducts(cat),detail:cat===null?'não definido':'estrutura válida'});
 const fav=tp144Read('tecnopreco-favorites',[]); checks.push({name:'Favoritos',ok:Array.isArray(fav),detail:Array.isArray(fav)?fav.length+' itens':'formato inválido'});
 const recent=tp144Read('tecnopreco-recent',[]); checks.push({name:'Histórico recente',ok:Array.isArray(recent),detail:Array.isArray(recent)?recent.length+' itens':'formato inválido'});
 const alerts=tp144Read('tecnopreco-price-alerts',{}); checks.push({name:'Alertas de preço',ok:alerts&&typeof alerts==='object'&&!Array.isArray(alerts),detail:alerts&&typeof alerts==='object'&&!Array.isArray(alerts)?Object.keys(alerts).length+' alertas':'formato inválido'});
 const reviews=tp144Read('tecnopreco-reviews',{}); checks.push({name:'Avaliações',ok:reviews&&typeof reviews==='object'&&!Array.isArray(reviews),detail:reviews&&typeof reviews==='object'&&!Array.isArray(reviews)?'estrutura válida':'formato inválido'});
 checks.forEach(c=>{if(!c.ok)issues.push(c.name)});
 return {schema:TP144_SCHEMA,valid:issues.length===0,issues,checks,checkedAt:new Date().toISOString()}
}
function tp144Repair(){
 const repairs=[];
 const fixArray=(k)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');if(v!==null&&!Array.isArray(v)){localStorage.setItem(k,'[]');repairs.push(k)}}catch(e){localStorage.setItem(k,'[]');repairs.push(k)}};
 const fixObject=(k)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');if(v!==null&&(typeof v!=='object'||Array.isArray(v))){localStorage.setItem(k,'{}');repairs.push(k)}}catch(e){localStorage.setItem(k,'{}');repairs.push(k)}};
 fixArray('tecnopreco-favorites');fixArray('tecnopreco-recent');fixObject('tecnopreco-price-alerts');fixObject('tecnopreco-reviews');
 const r=tp144Validate();localStorage.setItem('tecnopreco-v144-last-repair',JSON.stringify({at:new Date().toISOString(),repairs}));return {repairs,report:r}
}
function tp144ExportSnapshot(){tp142Download('tecnopreco-estado-v144.json',JSON.stringify(tp144Snapshot(),null,2));toast('💾 Estado local exportado')}
function tp144ExportReport(){tp142Download('tecnopreco-integridade-v144.json',JSON.stringify({version:'144',report:tp144Validate(),repair:tp144Read('tecnopreco-v144-last-repair',null)},null,2));toast('📄 Relatório de integridade exportado')}
function showIntegrityCenter(){
 const r=tp144Validate(), last=tp144Read('tecnopreco-v144-last-repair',null);
 const rows=r.checks.map(c=>`<div class="source-row"><span><strong>${c.ok?'✅':'⚠️'} ${escapeHtml(c.name)}</strong><small>${escapeHtml(c.detail)}</small></span><b>${c.ok?'OK':'REVER'}</b></div>`).join('');
 document.getElementById('detail').innerHTML=`<div class="compare-panel"><button class="back" onclick="showAdmin()">← Backoffice</button><div class="compare-head"><h2>🧬 Integridade e migração</h2><span class="compare-count">V144 · ${r.valid?'ÍNTEGRO':'A REVER'}</span></div><p class="compare-note">Valida e repara, quando possível, estruturas locais sem apagar o catálogo demonstrativo. Esta fase cria um formato de estado versionado para facilitar futuras actualizações.</p><div class="partner-kpis"><div><b>${r.valid?'100%':'ATENÇÃO'}</b><small>Estado</small></div><div><b>${r.checks.length}</b><small>Verificações</small></div><div><b>${r.issues.length}</b><small>Problemas</small></div><div><b>${TP144_SCHEMA}</b><small>Schema</small></div></div><div class="shops">${rows}</div><div class="admin-actions"><button class="primary" onclick="showIntegrityCenter()">↻ Validar novamente</button><button class="secondary" onclick="tp144Repair();showIntegrityCenter()">🛠️ Reparar estruturas</button><button class="secondary" onclick="tp144ExportSnapshot()">⬇️ Exportar estado</button><button class="secondary" onclick="tp144ExportReport()">📄 Exportar relatório</button></div><div class="catalog-note"><b>🔐 Segurança</b><span>A reparação só normaliza estruturas locais claramente inválidas; não envia dados, não altera preços e não substitui uma base de dados de produção.</span></div>${last?`<div class="catalog-note"><b>Última reparação</b><span>${escapeHtml(last.at||'—')} · ${Array.isArray(last.repairs)?last.repairs.length:0} alterações</span></div>`:''}</div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}


/* TECNOPRECO_V145 — Partilha inteligente e navegação directa */
const TP145_VERSION='145';
function tp145BaseUrl(){return location.href.split('#')[0]}
function tp145Link(type,value){return tp145BaseUrl()+'#tp145-'+type+'-'+encodeURIComponent(String(value))}
function tp145Copy(url,ok='Ligação copiada'){try{if(navigator.clipboard?.writeText){navigator.clipboard.writeText(url).then(()=>toast('🔗 '+ok)).catch(()=>toast('⚠️ Não foi possível copiar a ligação'));return true}}catch(e){}return false}
async function tp145Share(type,value,title,text){const url=tp145Link(type,value);if(navigator.share){try{await navigator.share({title,text,url});return true}catch(e){if(e?.name==='AbortError')return false}}return tp145Copy(url)}
function tp145ShareProduct(id){const p=products.find(x=>x.id===Number(id));if(!p)return;tp145Share('produto',p.id,'TecnoPreço — '+p.name,'Ver '+p.name+' no TecnoPreço')}
function tp145ShareComparison(){const ids=compareSelected.filter(id=>products.some(p=>p.id===id)).slice(0,3);if(!ids.length)return toast('Selecciona pelo menos um produto');tp145Share('comparar',ids.join(','),'TecnoPreço — comparação','Ver esta comparação no TecnoPreço')}
function tp145HandleRoute(){
 const hash=decodeURIComponent(location.hash||'');
 let m=hash.match(/^#tp145-produto-(\d+)$/i);
 if(m){const id=Number(m[1]);if(products.some(p=>p.id===id)){showProduct(id);toast('🔗 Produto aberto através de uma ligação partilhada');return true}}
 m=hash.match(/^#tp145-comparar-([\d,]+)$/i);
 if(m){const ids=m[1].split(',').map(Number).filter(id=>products.some(p=>p.id===id)).slice(0,3);if(ids.length){compareSelected=ids;saveCompare();updateCompareBar();showCompare();toast('⚖️ Comparação partilhada carregada');return true}}
 return false;
}
function showShareCenter(){
 const ids=compareSelected.filter(id=>products.some(p=>p.id===id)).slice(0,3);
 const rows=ids.map(id=>{const p=products.find(x=>x.id===id);return `<div class="tp145-share-row"><span>${p.icon||'📦'} <strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.category||'')}</small></span><button class="secondary" onclick="tp145ShareProduct(${p.id})">↗️ Partilhar</button></div>`}).join('');
 document.getElementById('detail').innerHTML=`<div class="compare-panel tp145-panel"><button class="back" onclick="goHome()">← Voltar</button><div class="compare-head"><h2>🔗 Partilha inteligente</h2><span class="compare-count">V145</span></div><p class="compare-note">Cria ligações directas para produtos e comparações. As ligações não contêm palavras-passe, dados pessoais, preços introduzidos por ti ou credenciais.</p><div class="partner-kpis"><div><b>${ids.length}/3</b><small>Produtos em comparação</small></div><div><b>URL</b><small>Partilha local</small></div><div><b>1 clique</b><small>Abrir produto</small></div><div><b>0</b><small>Dados pessoais</small></div></div><div class="tp145-share-list">${rows||'<div class="empty">Ainda não tens produtos na comparação.</div>'}</div><div class="admin-actions"><button class="primary" onclick="tp145ShareComparison()">⚖️ Partilhar comparação</button><button class="secondary" onclick="tp145ShareProduct(${ids[0]||0})" ${ids.length?'':'disabled'}>↗️ Partilhar primeiro produto</button></div><div class="catalog-note"><b>🔐 Privacidade</b><span>A ligação contém apenas identificadores públicos do catálogo. Os teus favoritos, alertas, perfil e histórico ficam no dispositivo.</span></div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
window.addEventListener('hashchange',()=>{try{tp145HandleRoute()}catch(e){}});
window.addEventListener('load',()=>{setTimeout(()=>{try{tp145HandleRoute()}catch(e){}},0)});

/* TECNOPRECO_V146 — Backend real e base de dados SQLite */
const TP146_VERSION='146';
async function tp146BackendSummary(){
 try{
  if(!backendRuntime.enabled||!backendRuntime.baseUrl) return {ok:false,mode:'demo',message:'Backend não configurado'};
  const r=await fetch(backendRuntime.baseUrl.replace(/\/$/,'')+'/api/health',{headers:{Accept:'application/json'}});
  const d=await r.json().catch(()=>({}));
  return r.ok?{ok:true,...d}:{ok:false,message:'HTTP '+r.status};
 }catch(e){return {ok:false,message:e.message||'Falha de ligação'};}
}
async function showBackendCenter(){
 const h=await tp146BackendSummary();
 document.getElementById('detail').innerHTML=`<div class="compare-panel tp146-panel"><button class="back" onclick="showAdmin()">← Backoffice</button><div class="compare-head"><h2>🗄️ Backend e base de dados</h2><span class="compare-count">V146</span></div><p class="compare-note">Camada de servidor integrada para produtos, ofertas, contas e sincronização. A base de dados é SQLite e é criada no servidor; o catálogo continua demonstrativo até existirem fontes autorizadas.</p><div class="partner-kpis"><div><b>${h.ok?'ONLINE':'OFFLINE'}</b><small>Backend</small></div><div><b>${h.database||'—'}</b><small>Base de dados</small></div><div><b>API 1.0</b><small>Contrato</small></div><div><b>V146</b><small>Release</small></div></div><div class="api-grid"><div class="api-card"><strong>🧩 Produtos</strong><span>/api/v1/products/search</span><small>Pesquisa e detalhe com dados persistentes.</small></div><div class="api-card"><strong>👤 Contas</strong><span>Registo + login</span><small>Palavras-passe com hash no servidor e sessões com token.</small></div><div class="api-card"><strong>💶 Ofertas</strong><span>/api/v1/prices/sync</span><small>Sincronização autenticada para fontes autorizadas.</small></div><div class="api-card"><strong>🩺 Saúde</strong><span>${escapeHtml(h.message||'Backend não acessível')}</span><small>${escapeHtml(backendRuntime.baseUrl||'Sem URL')}</small></div></div><div class="admin-actions"><button class="primary" onclick="showBackendCenter()">↻ Testar backend</button><button class="secondary" onclick="showApiCenter()">🔌 Ver contratos API</button></div><div class="catalog-note"><b>🔐 Segurança</b><span>As credenciais e o segredo de assinatura ficam no servidor. Não são colocados no JavaScript público.</span></div></div>`;
 window.scrollTo({top:document.getElementById('detail').offsetTop-10,behavior:'smooth'});
}
