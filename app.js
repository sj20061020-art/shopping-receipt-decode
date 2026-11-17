const view=document.querySelector('#view');
const exhibit=document.querySelector('#exhibit');
const personalityReceipt=document.querySelector('#personality-receipt');
const layoutLauncher=document.querySelector('.layout-launcher');
const stageHeight=900;
const stageQuery=new URLSearchParams(location.search);
const previewWidth=stageQuery.get('layout')==='1'?Number(stageQuery.get('stage')):0;
function fitStage(){
 const stageWidth=Math.min(1800,Math.max(1320,previewWidth||stageHeight*innerWidth/Math.max(1,innerHeight)));
 document.documentElement.style.setProperty('--stage-width',stageWidth+'px');
 document.documentElement.style.setProperty('--stage-scale',Math.min(innerWidth/stageWidth,innerHeight/stageHeight));
 layoutLauncher.href='layout-editor.html?stage='+Math.round(stageWidth);
 exhibit.querySelector('.cart-stage')?.dispatchEvent(new Event('stage-resize'));
}
fitStage();
window.addEventListener('resize',fitStage);
document.addEventListener('fullscreenchange',fitStage);
const cart=document.querySelector('#cart').innerHTML;
const metrics=[['脂肪','g','fat'],['蛋白质','g','protein'],['总糖','g','sugar'],['钠','mg','sodium']];
const palette=['lemon-yellow','cobalt-blue','soft-pink','deep-pine','hot-magenta','lavender','signal-red','cool-grey','emerald-green','terracotta','midnight-indigo','mulberry']
 .map(color=>'var(--tb-'+color+')');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const display=new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2});
const fmt=x=>x===null?'未记录':display.format(x);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const total=(t,m)=>{const a=t.items.filter(i=>i.food).map(i=>i.values[m]);return a.every(x=>x===null)?null:a.reduce((s,x)=>s+(x??0),0)};
const partial=(t,m)=>t.items.some(i=>i.food&&i.values[m]===null);
const amount=t=>'¥ '+t.amount.toFixed(2);
let page='intro',ticket=null,metric=0,highlight=-1,sort='id',sortDirection='asc',wallId=null;
const colorways={'#23336e':'indigo','#1d73c8':'cobalt','#164c45':'pine','#f4e24a':'lemon','#b96b2d':'ochre','#e52a86':'magenta'};
const chartOffsets={indigo:0,cobalt:3,pine:5,lemon:1,ochre:7,magenta:9};
const chartSwatch=index=>palette[(index+(chartOffsets[exhibit.dataset.colorway]??0))%palette.length];
const baskets=new Map();
const basket=()=>baskets.get(ticket.id);
const ticketPreview=id=>'assets/receipt-previews/ticket-'+id+'.webp';
const image=(i)=>i.image?'<img class="food" src="'+i.image+'" alt="">':'<span class="food placeholder">'+esc(i.name)+'</span>';
function btn(action,label,cls='outline-btn',extra=''){return '<button type="button" class="'+cls+'" data-act="'+action+'" '+extra+'>'+label+'</button>'}
function render(){
 const name={intro:'小票解码首页',wall:'小票档案墙',pick:'购物篮',analysis:'营养数据'}[page];
 exhibit.dataset.page=page;
 exhibit.dataset.ticketId=ticket?.id??'';
 exhibit.dataset.colorway=colorways[ticket?.color?.toLowerCase()]??'indigo';
 exhibit.style.setProperty('--accent',ticket?.color??'#eae5d9');
 if(name)view.setAttribute('aria-label',name);
 else view.removeAttribute('aria-label');
 view.innerHTML=({intro,wall,pick,analysis,types})[page]();
}
function intro(){
 const byId=new Map(TICKETS.map(t=>[t.id,t]));
 // Placement is left, top, width, rotation, then an optional paper color.
 const papers=[
  [-8,-19,42,-13,'cobalt-blue'],[66,-13,43,15,'lavender'],
  [-9,65,46,-13,'deep-pine'],[71,64,38,-9,'soft-pink'],
  [29,67,32,13,'cool-grey'],[45,39,39,-15,'soft-pink'],
  [1,34,18,-17,'lavender'],[20,14,20,14,'cool-grey'],
  [22,45,16,-20,'lemon-yellow'],[44,13,17,-15,'soft-pink'],
  [50,22,17,8,'lavender'],[68,26,17,-11,'lemon-yellow'],
  [78,39,17,23,'cobalt-blue'],[90,54,17,-11,'terracotta'],
  [36,81,17,14,'soft-pink'],[53,78,23,-17,'lavender'],
  [71,75,15,18,'cool-grey'],
 ];
 const receipts=[
  ['04',54,-17,9,-20],['05',-3,51,9,24],['08',35,64,9,9],['18',8,6,9,20],
  ['23',67,22,7.5,-23],['25',45,81,7.3,7],
  ['01',0,-12,9,-13],['06',13,-11,10,13],['20',26,-13,9,-11],
  ['26',37,-14,10,-12],['15',51,-11,10,9],['09',65,-13,10,15],
  ['11',80,-10,9,-13],['28',92,-16,10,14],['03',4,36,8,-15],
  ['21',16,28,10,12],['12',31,26,10,-12],['19',44,22,11,-9],
  ['29',57,27,9,14],['24',72,30,8,-15],['10',87,34,10,13],
  ['07',1,63,9,12],['16',15,70,9,-13],['30',30,65,8,-13],
  ['13',49,62,10,13],['02',63,72,9,-14],['22',79,67,10,11],
  ['27',92,63,10,-14],
 ];
 const portraits=[
  ['01',5,21,12,-9,'lemon-yellow'],['02',23,8,10,12,'soft-pink'],
  ['18',38,5,12,-8,'emerald-green'],['12',54,4,11,10,'cobalt-blue'],
  ['26',71,14,13,8,'soft-pink'],['14',86,25,12,-10,'deep-pine'],
  ['19',10,50,13,10,'lavender'],['29',27,49,11,-9,'paper-white'],
  ['10',41,48,11,12,'cobalt-blue'],['20',57,55,13,-9,'lemon-yellow'],
  ['25',75,53,11,-12,'soft-pink'],['16',84,77,12,11,'cobalt-blue'],
 ];
 const frontReceipts=[['14',51,43,7.2,-13],['17',89,53,6.8,-12]];
 const foods=[
  ['23','新疆法兰西西梅',0,4,8,-12],['21','石柱红干海椒',19,-4,8,-20],
  ['19','高原金银玉米',33,-1,8,13],['04','花生',48,-3,7,-15],
  ['12','爆米花奶油味',63,1,8,-13],['11','攀枝花凯特芒果',81,5,8,13],
  ['14','有机罗马生菜',94,13,8,13],['06','板烧黄油鸡腿汉堡',-1,45,9,-19],
  ['02','农夫山泉电解质水西柚味',17,15,7,-18],['03','泰国秒开椰青',31,16,8,14],
  ['16','永辉黑松露火腿苏打饼干',47,15,7,-20],
  ['09','煎饺',64,20,7,11],['30','红樱桃番茄',76,31,8,15],
  ['05','YH 盐味毛豆',91,47,8,11],['19','紫心蜜薯',2,68,8,-16],
  ['27','永辉定制&佳农香糯蕉',19,43,9,18],['20','手工豆腐',24,32,7,-16],
  ['01','手丝花卷',35,39,10,-12,'soft-pink'],
  ['13','YH香辣海白虾',53,38,8,-14],['17','有机果汁蓝莓干',67,45,8,16],
  ['12','品质永辉100%椰子水',91,68,8,-9],['28','莲藕片',7,83,8,12],
  ['22','粮心优食蛋',21,79,7,-11],['26','有机小洋葱',33,83,8,12],
  ['24','YH德国酸菜牛肉番茄三明治',42,71,9,-13],
  ['29','味全每日C草莓椰子汁',51,84,8,13],['30','高原四季豆/小金豆',66,80,9,-12],
  ['25','蛋黄烧麦',77,77,8,15],['24','榴莲肉',94,88,8,-13],
  ['09','天友家里养头奶牛鲜牛奶',-1,25,6.2,14],['27','烧麦',5,58,6.3,-11],
  ['13','YH奥尔良烤鸡腿大',28,34,6.3,17],['30','手工豆腐',27,3,5.9,-15],
  ['25','玉米粑',14,92,7.3,12],['16','君乐宝0蔗糖风味发酵乳',36,92,6.4,-14],
  ['24','YHBakery丰收的喜悦之五麦杂粮欧包',42,88,6.5,16],
  ['28','【菌菇新语】白蘑菇',59,89,6.4,-12],['19','柠黄串番茄',60,30,6,12],
  ['20','海天土等蚝油',61.5,44,6.4,-25],['21','YHBakery香葱松松卷面包',72,88,6.3,-20],
  ['22','香菜',85,63,7.2,18],['11','鲜鸭',97,55,7.4,-22],
  ['04','YH小酥肉',16,71,6.2,15],
 ];
 const place=([x,y,width,angle,tone])=>'style="--piece-x:'+x+'%;--piece-y:'+y+'%;--piece-width:'+width+'%;--piece-max-width:'+(width*15)+'px;--piece-angle:'+angle+'deg;'
  +(tone?'--piece-paper:var(--tb-'+tone+');':'')+'"';
 const artwork=(kind,id,src,name,placement)=>src?btn('cover-pick','<img '+(kind==='food'?'fetchpriority="high"':'decoding="async"')+' src="'+esc(src)+'" alt="" draggable="false">',
  'cover-piece cover-'+kind+(placement[4]?' is-backed':''),
  place(placement)+' data-id="'+id+'" aria-label="'+esc('查看 '+id+' 号小票'+(name?' · '+name:''))+'"'):'';
 const receiptCards=entries=>entries.map(([id,...placement])=>artwork('receipt',id,ticketPreview(id),'',placement)).join('');
 return '<section class="book-intro"><div class="book-art">'
  +papers.map(placement=>'<div class="cover-piece cover-paper" '+place(placement)+' aria-hidden="true"></div>').join('')
  +foods.map(([id,name,...placement])=>artwork('food',id,byId.get(id)?.items.find(item=>item.name===name)?.image,name,placement)).join('')
  +receiptCards(receipts)
  +portraits.map(([id,...placement])=>artwork('portrait',id,byId.get(id)?.portrait,byId.get(id)?.type,placement)).join('')
  +receiptCards(frontReceipts)
  +'</div></section>';
}
function wall(){
 const nutrient=sort.startsWith('nutrient-')?Number(sort.slice(9)):null;
 const value=t=>nutrient!==null?total(t,nutrient):sort==='amount'?t.amount:Number(t.id);
 const direction=sortDirection==='desc'?-1:1;
 const list=TICKETS.map(t=>({t,val:value(t)})).sort((a,b)=>{
  if(a.val===null||b.val===null){
   if(a.val!==b.val)return a.val===null?1:-1;
  }else if(a.val!==b.val)return direction*(a.val-b.val);
  return a.t.id.localeCompare(b.t.id);
 });
 const criteria=[['id','序号'],['amount','实付金额'],...metrics.map(([label],i)=>['nutrient-'+i,label])];
 const order=[['asc',sort==='id'?'从小到大':'从低到高'],['desc',sort==='id'?'从大到小':'从高到低']];
 const options=(rows,selected)=>rows.map(([key,label])=>'<option value="'+key+'" '+(key===selected?'selected':'')+'>'+label+'</option>').join('');
 const note=nutrient===null?'':'<span class="wall-sort-note hint">缺失置后 · * 为已记录小计</span>';
 return '<div class="wall-tools"><div class="wall-sort-controls">'+note
  +'<label>排列依据 <select id="sort">'+options(criteria,sort)+'</select></label>'
  +'<label>顺序 <select id="sort-direction">'+options(order,sortDirection)+'</select></label></div></div>'
  +'<div class="tickets">'+list.map(({t,val})=>ticketTile(t,nutrient,val)).join('')+'</div>';
}
function ticketTile(t,nutrient,value){
 const names=[...new Set(t.items.map(item=>item.name))];
 const examples=names.slice(0,3).map(name=>'<span>'+esc(name)+'</span>').join('');
 const more=names.length>3?'<span class="hint">另有 '+(names.length-3)+' 种</span>':'';
 const subtotal=nutrient!==null&&value!==null&&partial(t,nutrient);
 const label=nutrient===null?amount(t):fmt(value)+(value===null?'':' '+metrics[nutrient][1]+(subtotal?' *':''));
 const accessibleLabel=nutrient===null?label:metrics[nutrient][0]+' '+label;
 return '<button type="button" class="tile" data-act="open" data-id="'+t.id+'" style="--accent:'+t.color+'" aria-label="'+t.id+' 号小票 '+accessibleLabel+'" aria-describedby="preview-'+t.id+'"><span class="mount"><img src="'+ticketPreview(t.id)+'" alt=""></span><span class="tile-meta"><span class="mono">No. '+t.id+'</span><span>'+label+'</span></span><span class="tile-preview" id="preview-'+t.id+'"><span class="mono">NO. '+t.id+'</span><span class="preview-summary"><strong>'+amount(t)+'</strong><span>'+names.length+' 种商品</span></span><span class="preview-items">'+examples+more+'</span></span></button>';
}
function receipt(isPick){
 const action=isPick?'add':'mark';
 return '<div class="ticket-wrap"><img src="'+ticket.image+'" alt="'+ticket.id+' 号原始票面">'+ticket.items.map((it,i)=>btn(action,'','hot','style="top:'+it.y+'%;height:'+it.h+'%" data-i="'+i+'" aria-label="'+esc(it.name)+'" aria-pressed="'+(isPick?basket().has(i):i===highlight)+'"')).join('')+'</div>';
}
function basketSticker(){
 const art='<img src="assets/basket-labels/'+ticket.id+'.png?v=3" alt="'+ticket.id+' 号纸本小票标签">';
 return '<div class="basket-sticker" hidden>'+art+'</div>';
}
function pick(){
 return '<div class="screen-tools">'+btn('wall','← 回到小票墙','text-btn')+'</div>'
  +'<div class="pick"><section class="receipt-panel"><p class="hint">点票面上的商品，将它放入购物篮。</p>'+receipt(true)+'</section>'
  +'<section class="cart-panel"><span id="count" class="cart-count mono" aria-live="polite"></span>'
  +'<div class="cart-stage">'+cart+'<div class="basket" id="basket"></div>'+basketSticker()+'</div>'
  +'<p class="cart-caption">购物篮 <span class="hint">· 按住左键，左右晃动</span></p>'
  +'<div class="actions">'+btn('all','全部装入')+btn('decode','解码整张小票 ↗','dark-btn')+'</div></section></div>';
}
const flyingItems=new WeakMap();
const shownStickers=new Set();
const basketFoodSize=stage=>parseFloat(getComputedStyle(stage).getPropertyValue('--basket-food-size'));
function revealBasketSticker(contents){
 if(basket().size!==ticket.items.length||flyingItems.get(contents)?.size)return;
 const sticker=contents.nextElementSibling;
 if(!sticker?.hidden)return;
 if(!shownStickers.has(ticket.id)){
  shownStickers.add(ticket.id);
  sticker.classList.add('is-sticking');
 }
 sticker.hidden=false;
}
function updateCart(){
 const set=basket();
 document.querySelector('#count').textContent=set.size+' / '+ticket.items.length;
 const contents=document.querySelector('#basket');
 const items=[...set];
 const many=ticket.items.length>8;
 contents.closest('.cart-stage').classList.toggle('basket-many',many);
 const split=many?Math.ceil(ticket.items.length/2):4;
 const pending=flyingItems.get(contents);
 const foodItem=i=>'<span class="food basket-item" data-i="'+i+'"'+(pending?.has(i)?' data-in-flight':'')+' role="img" aria-label="'+esc(ticket.items[i].name)+'">'+image(ticket.items[i])+'</span>';
 contents.innerHTML='<div class="basket-row basket-row-bottom">'+items.slice(0,split).map(foodItem).join('')+'</div>'
  +'<div class="basket-row basket-row-top">'+items.slice(split).map(foodItem).join('')+'</div>';
 view.querySelectorAll('[data-act=add]').forEach(button=>{
  const added=set.has(+button.dataset.i);
  button.setAttribute('aria-pressed',added);
  button.setAttribute('aria-disabled',added);
 });
 view.querySelector('[data-act=all]').disabled=set.size===ticket.items.length;
 contents.dispatchEvent(new Event('basket-items-changed'));
 revealBasketSticker(contents);
}
function bindBasketMotion(){
 const stage=view.querySelector('.cart-stage');
 const contents=stage.querySelector('.basket');
 const hint=view.querySelector('.cart-caption .hint');
 const artworkEdge=basketFoodSize(stage)*Math.SQRT1_2+7;
 function measureBounds(){
  let left=0,top=0;
  for(let node=stage;node&&node!==exhibit;node=node.offsetParent){
   left+=node.offsetLeft;
   top+=node.offsetTop;
  }
  return {left:-left,right:exhibit.clientWidth-left,top:-top,floor:exhibit.clientHeight-top};
 }
 let bounds=measureBounds(),stageWidth=stage.offsetWidth;
 const clamp=(value,limit)=>Math.max(-limit,Math.min(limit,value));
 const horizontal={position:0,target:0,speed:0};
 const vertical={position:0,target:0,speed:0};
 const bodies=new Map();
 let settling=0,lastToss=-Infinity;
 let press=null,holdTimer,dragging=false,ignoreClick=false,frame=0,lastTime=0;
 let previousPointer=null,hoveredItem=null;

 function advance(axis,step){
  const previousSpeed=axis.speed;
  axis.speed=(axis.speed+(axis.target-axis.position)*.17*step)*.72**step;
  axis.position+=axis.speed*step;
  return axis.speed-previousSpeed;
 }
 function syncBodies(){
  for(const item of contents.querySelectorAll('.basket-item:not([data-in-flight])')){
   const row=item.parentElement;
   const originX=row.offsetLeft+item.offsetLeft+item.offsetWidth/2;
   const originY=row.offsetTop+item.offsetTop+item.offsetHeight/2;
   const body=bodies.get(item.dataset.i)??{x:originX,y:originY,vx:0,vy:0,angle:0,spin:0};
   Object.assign(body,{item,originX,originY});
   bodies.set(item.dataset.i,body);
   paintBody(body);
  }
 }
 function paintBody(body){
  body.item.dataset.motion=body.motion??'inside';
  body.item.style.setProperty('--food-x',(body.x-body.originX)+'px');
  body.item.style.setProperty('--food-y',(body.y-body.originY)+'px');
  body.item.style.setProperty('--food-spin',body.angle+'deg');
 }
 function keepInScene(body,scale){
  if(body.motion==='airborne'){
   const openingLeft=26*scale+artworkEdge*.82;
   const openingRight=934*scale-artworkEdge*.82;
   const rim=(112-18*body.x/(960*scale))*scale;
   if(body.y-artworkEdge<rim)body.clearedRim=true;
   const overOpening=body.x>=openingLeft&&body.x<=openingRight;
   if(body.clearedRim&&!overOpening&&body.y+artworkEdge*.4<rim){
    body.motion='outside';
   }else if(body.vy>=0&&body.y>=rim+artworkEdge){
    body.motion=overOpening?'inside':'outside';
   }
  }
  if(body.motion==='outside'){
   const floor=bounds.floor-artworkEdge-10-vertical.position;
   if(body.y>=floor){
    body.y=floor;
    body.vy=Math.abs(body.vy)>4?-body.vy*.23:0;
    body.vx*=.72;
    body.spin*=.68;
   }
  }
  if(body.motion==='airborne'||body.motion==='outside'){
   const left=bounds.left+artworkEdge+10-horizontal.position;
   const right=bounds.right-artworkEdge-10-horizontal.position;
   const ceiling=bounds.top+artworkEdge+12-vertical.position;
   if(body.x<left||body.x>right){body.x=Math.max(left,Math.min(right,body.x));body.vx*=-.3;}
   if(body.y<ceiling){body.y=ceiling;body.vy=Math.max(0,body.vy);}
   return;
  }
  keepInside(body,scale);
 }
 function keepInside(body,scale){
  // Keep the entire rotating artwork inside the trapezoid, not just its collision circle.
  const padding=artworkEdge;
  const left=(26+64*(body.y+padding-112*scale)/(356*scale))*scale+padding;
  const right=(934-64*(body.y+padding-94*scale)/(360*scale))*scale-padding;
  const top=112*scale+padding;
  const floor=(468-14*(body.x/scale-90)/780)*scale-padding;
  if(body.x<left||body.x>right){
   body.x=Math.max(left,Math.min(right,body.x));
   body.vx*=-.35;
   body.spin*=.65;
  }
  if(body.y<top||body.y>floor){
   body.y=Math.max(top,Math.min(floor,body.y));
   body.vy=Math.abs(body.vy)<1.2?0:body.vy*-.29;
   body.vx*=.88;
   body.spin*=.8;
  }
 }
 function collide(a,b){
  const dx=b.x-a.x,dy=b.y-a.y;
  const distance=Math.hypot(dx,dy);
  const separation=118;
  if(distance>=separation)return;
  const nx=distance?dx/distance:1,ny=distance?dy/distance:0;
  const correction=(separation-distance)*.5;
  a.x-=nx*correction;a.y-=ny*correction;
  b.x+=nx*correction;b.y+=ny*correction;
  const approach=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
  if(approach>=0)return;
  const impulse=-approach*.62;
  a.vx-=nx*impulse;a.vy-=ny*impulse;
  b.vx+=nx*impulse;b.vy+=ny*impulse;
  const turn=clamp(impulse*nx*.27,3);
  a.spin-=turn;
  b.spin+=turn;
 }
 function moveFood(step,ax,ay){
  const items=[...bodies.values()];
  const scale=stage.offsetWidth/960;
  for(const body of items){
   const loose=body.motion==='airborne'||body.motion==='outside';
   const inertia=reduced.matches?1.4:4.1;
   body.vx=clamp((body.vx-(loose?0:ax*inertia))*(loose?.987:.95)**step,loose?40:27);
   body.vy=clamp((body.vy-(loose?0:ay*inertia)+(loose?.91:.62)*step)*(loose?.994:.97)**step,loose?40:27);
   body.x+=body.vx*step;
   body.y+=body.vy*step;
   body.spin=clamp((body.spin+body.vx*.07)*.91**step,5);
   body.angle=clamp(body.angle+body.spin*step,26);
  }
  for(let pass=0;pass<5;pass++){
   for(let i=0;i<items.length;i++){
    for(let j=i+1;j<items.length;j++){
     if((items[i].motion??'inside')===(items[j].motion??'inside'))collide(items[i],items[j]);
    }
    keepInScene(items[i],scale);
   }
  }
  items.forEach(paintBody);
 }
 function draw(time){
  frame=0;
  if(!stage.isConnected)return;
  const step=lastTime?Math.min((time-lastTime)/16.67,1.5):1;
  lastTime=time;
  const ax=advance(horizontal,step),ay=advance(vertical,step);
  moveFood(step,ax,ay);
  if(!dragging&&time>=settling){
   stage.style.removeProperty('--basket-x');
   stage.style.removeProperty('--basket-y');
   stage.style.removeProperty('--basket-angle');
   horizontal.position=horizontal.speed=vertical.position=vertical.speed=0;
   for(const body of bodies.values())body.vx=body.vy=body.spin=0;
   lastTime=0;
   return;
  }
  stage.style.setProperty('--basket-x',horizontal.position+'px');
  stage.style.setProperty('--basket-y',vertical.position+'px');
  stage.style.setProperty('--basket-angle',clamp(horizontal.position*.054+horizontal.speed*.05,reduced.matches?1.5:3.8)+'deg');
  frame=requestAnimationFrame(draw);
 }
 const animate=()=>{if(!frame)frame=requestAnimationFrame(draw);};
 function release(){
  clearTimeout(holdTimer);
  press=null;
  if(!dragging)return;
  dragging=false;
  stage.classList.remove('is-dragging');
  hint.textContent='· 按住左键，左右晃动';
  horizontal.target=0;
  vertical.target=0;
  settling=Math.max(settling,performance.now()+(reduced.matches?550:1350));
  animate();
 }
 function followPointer(){
  const amplitude=reduced.matches?.5:1;
  horizontal.target=clamp(press.baseX+Math.tanh(press.dx/press.scale/90)*76,76)*amplitude;
  vertical.target=clamp(press.baseY+Math.tanh(press.dy/press.scale/65)*48,48)*amplitude;
  if(!bodies.size)syncBodies();
  animate();
 }
 function tossFood(dx,dy,time){
  if(reduced.matches||time-lastToss<230)return;
  const elapsed=Math.max(16,Math.min(55,time-press.lastTime));
  const speedX=dx/press.scale/elapsed,speedY=dy/press.scale/elapsed;
  const power=Math.hypot(speedX,speedY);
  if(power<1.55||Math.hypot(dx,dy)/press.scale<25)return;
  const candidates=[...bodies.values()].filter(body=>!body.motion||body.motion==='inside');
  if(!candidates.length)return;
  const side=Math.abs(speedX)>Math.abs(speedY)*1.35;
  const direction=Math.sign(speedX)||1;
  candidates.sort((a,b)=>side?direction*(a.x-b.x):(a.y-b.y));
  for(const [index,body] of candidates.slice(0,power>3.4?2:1).entries()){
   body.motion='airborne';
   body.clearedRim=false;
   body.vx=side?-direction*(Math.min(30,17+power*2)+index):clamp(-speedX*5,9);
   body.vy=-Math.min(32,21+power*2)-index;
   body.spin=(body.vx<0?-1:1)*3;
  }
  lastToss=time;
  settling=Math.max(settling,performance.now()+2300);
 }
 function dodgeFood(event){
  if(event.pointerType==='touch'||event.buttons||reduced.matches)return;
  const item=event.target.closest('img.food')?.closest('.basket-item');
  const prior=previousPointer;
  previousPointer={x:event.clientX,y:event.clientY};
  const entered=item&&item!==hoveredItem;
  hoveredItem=item;
  if(!entered||item.hasAttribute('data-in-flight'))return;
  const dx=prior?event.clientX-prior.x:0;
  const rect=event.target.getBoundingClientRect();
  let direction=Math.sign(dx)||Math.sign(rect.left+rect.width/2-event.clientX)||1;
  if(!bodies.has(item.dataset.i))syncBodies();
  const body=bodies.get(item.dataset.i);
  if(!body||body.motion==='airborne'||body.motion==='outside'||event.timeStamp-(body.lastDodge??-Infinity)<450)return;
  const width=stage.offsetWidth;
  if(body.x<width*.23&&direction<0)direction=1;
  if(body.x>width*.77&&direction>0)direction=-1;
  body.vx=direction*21;
  body.vy=-7;
  body.spin=direction*2.8;
  body.lastDodge=event.timeStamp;
  settling=Math.max(settling,performance.now()+1000);
  animate();
 }

 stage.addEventListener('pointerdown',event=>{
  if(event.pointerType==='touch'||event.button!==0||press)return;
  ignoreClick=false;
  const id=event.pointerId;
  press={id,x:event.clientX,y:event.clientY,dx:0,dy:0,lastTime:event.timeStamp,scale:view.getBoundingClientRect().width/view.offsetWidth,baseX:horizontal.position,baseY:vertical.position};
  stage.setPointerCapture(id);
  holdTimer=setTimeout(()=>{
   if(!press||!stage.isConnected)return;
   dragging=true;
   ignoreClick=true;
   syncBodies();
   stage.classList.add('is-dragging');
   hint.textContent='· 已抓住，来回拖动';
   if(press.dx||press.dy)followPointer();
  },170);
 });
 stage.addEventListener('pointermove',event=>{
  if(!press){dodgeFood(event);return;}
  if(event.pointerId!==press.id)return;
  if(!(event.buttons&1)){release();return;}
  const dx=event.clientX-press.x,dy=event.clientY-press.y;
  if(dragging)tossFood(dx-press.dx,dy-press.dy,event.timeStamp);
  press.dx=dx;
  press.dy=dy;
  press.lastTime=event.timeStamp;
  if(dragging)followPointer();
 });
 stage.addEventListener('pointerup',release);
 stage.addEventListener('pointercancel',release);
 stage.addEventListener('stage-resize',()=>{
  if(press&&stage.hasPointerCapture(press.id))stage.releasePointerCapture(press.id);
  release();
  bounds=measureBounds();
  const width=stage.offsetWidth;
  const ratio=width/stageWidth;
  stageWidth=width;
  if(!bodies.size||ratio===1)return;
  for(const body of bodies.values()){
   body.x*=ratio;
   body.y*=ratio;
   keepInScene(body,width/960);
  }
  syncBodies();
  settling=Math.max(settling,performance.now()+350);
  animate();
 });
 stage.addEventListener('pointerleave',()=>{previousPointer=null;hoveredItem=null;});
 stage.addEventListener('lostpointercapture',release);
 stage.addEventListener('click',event=>{
  if(!ignoreClick||event.detail===0)return;
  ignoreClick=false;
  event.stopPropagation();
 },true);
 stage.addEventListener('dragstart',event=>event.preventDefault());
 contents.addEventListener('basket-items-changed',()=>{if(bodies.size)syncBodies();});
 contents.addEventListener('basket-item-landed',event=>{
  syncBodies();
  const {index,x,y}=event.detail;
  const body=bodies.get(String(index));
  body.x=x;
  body.y=y;
  body.vx=(Math.random()-.5)*11;
  body.vy=6+Math.random()*4;
  body.angle=(Math.random()-.5)*22;
  body.spin=(Math.random()-.5)*7;
  paintBody(body);
  settling=Math.max(settling,performance.now()+1550);
  animate();
 });
}
function analysisBasket(){
 const split=Math.ceil(ticket.items.length/2);
 const rows=ticket.items.length>4?[ticket.items.slice(0,split),ticket.items.slice(split)]:[ticket.items];
 return '<div class="analysis-basket-stage">'+cart+rows.map((row,r)=>row.map((item,i)=>{
  const x=50+(i-(row.length-1)/2)*(row.length>5?13.5:15);
  const y=(r===0?72:45)+[-3,1,-2,2,0,1][i%6];
  const angle=[-11,8,-6,12,-8][(i+r*2)%5];
  return '<span class="analysis-food" data-i="'+(r===0?i:split+i)+'" role="img" aria-label="'+esc(item.name)+'" style="--food-left:'+x+'%;--food-top:'+y+'%;--food-angle:'+angle+'deg">'+image(item)+'</span>';
 }).join('')).join('')+'</div>';
}
function analysis(){
 return '<div class="screen-tools">'+btn('pick','← 回到购物篮','text-btn')+'</div>'
  +'<div class="analysis"><section class="chart-area"><div id="chart" data-layout-chart="nutrition">'+chart()+'</div>'
  +'<div class="analysis-next">'+btn('profile','↑ 揭晓人格小票','dark-btn','aria-haspopup="dialog" aria-controls="personality-receipt"')+'</div></section>'
  +'<aside class="receipt-panel"><details id="receipt"><summary>收起原小票 · '+ticket.id+'</summary>'+receipt(false)+'</details></aside></div>';
}
function chart(){
 const controls='<div class="nutrient-controls" role="group" aria-label="营养指标">'+metrics.map(([label,,key],i)=>{
  const icon='<img src="assets/nutrition/'+key+'.svg?v=geometry" width="25" height="25" alt="">';
  return btn('metric',icon+'<span>'+(key==='sugar'?'糖':label)+'</span>','nutrient-button nutrient-'+key,
   'data-i="'+i+'" aria-pressed="'+(i===metric)+'"');
 }).join('')+'</div>';
 return controls+'<div class="nutrition-body"><div class="readout" aria-live="polite"><strong id="sum"></strong><span id="unit"></span></div>'
  +'<p class="hint" id="coverage"></p>'
  +'<div class="markers">'+ticket.items.map((x,i)=>x.food?btn('mark',image(x),'','data-i="'+i+'" aria-label="'+esc(x.name)+'"'):'').join('')+'</div>'
  +'<div class="bar" id="bar" aria-label="各商品的营养贡献">'+ticket.items.map((x,i)=>btn('mark','','seg','data-i="'+i+'" style="--swatch:'+chartSwatch(i)+'"')).join('')+'</div>'
  +'<div class="scale"><span>0</span><span id="end"></span></div>'
  +'<div class="chart-caption"><p class="item-insight" id="item-insight"></p>'
  +btn('breakdown','查看完整明细','text-btn','aria-expanded="false" aria-controls="nutrition-breakdown"')+'</div>'
  +'<div class="legend" id="nutrition-breakdown" hidden>'
  +ticket.items.map((x,i)=>btn('mark','<i class="swatch" style="--swatch:'+chartSwatch(i)+'"></i><span>'+esc(x.name)+'</span><span data-value="'+i+'"></span>','','data-i="'+i+'"')).join('')
  +'</div></div>';
}
function updateNutrition(){
 const s=total(ticket,metric),unit=metrics[metric][1];
 document.querySelector('#sum').textContent=fmt(s);
 document.querySelector('#unit').textContent=s===null?'':unit;
 const coverage=s===null?'这张票暂无此项数据':partial(ticket,metric)?'已记录数值合计 · 含缺失项':'整张小票食品合计';
 document.querySelector('#coverage').textContent=coverage+(metric===2?' · 总糖按有据可查的份量折算':'');
 document.querySelector('#end').textContent=s===null?'':fmt(s)+' '+unit;
 ticket.items.forEach((x,i)=>{
  const value=x.values[metric];
  const segment=document.querySelector('.seg[data-i="'+i+'"]');
  segment.style.flexGrow=value??0;
  segment.hidden=!(value>0);
  segment.setAttribute('aria-label',x.name+' '+fmt(value)+' '+unit);
  document.querySelector('[data-value="'+i+'"]').textContent=!x.food?'非人用食品／非食品':value===null?'未记录':fmt(value)+' '+unit+(s>0?' · '+fmt(value/s*100)+'%':'');
 });
 syncMark();
}
function syncMark(){
 view.querySelectorAll('[data-act=mark]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.i===highlight));
 showItem(highlight);
}
function showItem(i){
 const detail=view.querySelector('#item-insight');
 if(!detail)return;
 const it=ticket.items[i],v=it?.values[metric],s=total(ticket,metric);
 const price=it?.unitPrice==null?'':' · 单价 ¥'+it.unitPrice.toFixed(2);
 detail.textContent=it?it.name+' · '+it.portion+price+' · '+(!it.food?'不计入人用营养':v===null?'未记录':fmt(v)+' '+metrics[metric][1]+(s>0?' · '+fmt(v/s*100)+'%':'')):'选择商品可查看营养贡献，点色段可查看对应票面。';
}
function personalityRules(){
 const dimensions=[
  ['J / I','消费金额','实际支付不超过 ¥25 为 J，超过 ¥25 为 I。'],
  ['S / M','商品数量','实际购买 1–3 件为 S，4 件及以上为 M。'],
  ['T / X','味觉倾向','整张小票的食品以甜口为主为 T，以咸香、咸辣为主为 X。'],
  ['V / R','食物气质','以水果、蔬菜、菌菇、谷物等植物性食材为主为 V，以肉类、加工食品、熟食及浓香主食为主为 R。']
 ];
 const cards=dimensions.map(([pair,title,rule])=>'<div class="rule-card"><dt><span class="rule-code">'+pair+'</span>'+title+'</dt><dd>'+rule+'</dd></div>').join('');
 return '<dialog id="rules" aria-labelledby="rules-title"><div class="story-head"><h2 id="rules-title">FPTI 人格规则</h2>'+btn('close-rules','关闭','text-btn','autofocus')+'</div>'
  +'<p class="rules-intro">四个维度各选一个字母，按顺序组成 16 种购物人格。</p><dl class="rule-grid">'+cards+'</dl>'
  +'<p class="rule-example"><strong>01 号小票 · JSXR</strong> 实付 ¥3、购买 1 件手丝花卷。味觉和食物气质采用图鉴对这组商品的判定。</p>'
  +'<p class="hint">计重商品每条计 1 件，计件商品按实际数量。小票上展示的是图鉴表已给出的人格档案，金额和件数以票面为准。FPTI 是趣味分类，不是专业心理测评。</p></dialog>';
}
function openPersonalityReceipt(){
 if(!ticket||personalityReceipt.open)return;
 if(page!=='analysis')go('analysis');
 const t=ticket;
 const portrait=t.portrait?'<div class="personality-portrait"><img src="'+t.portrait+'" alt="FPTI '+esc(t.code)+' 人物肖像">'
  +'<div class="personality-stamp"><span>FPTI</span><strong>'+esc(t.code)+'</strong></div></div>':'';
 const details=t.code?'<details class="personality-details"><summary>展开角色设定</summary><div class="hint">'
  +[t.traits,t.character,t.tip,...t.items.filter(i=>i.texture).map(i=>i.name+' · '+i.texture)]
   .filter(Boolean).map(line=>'<div>'+esc(line)+'</div>').join('')
  +[t.detailEnglish,t.tipEnglish,t.mottoEnglish].filter(Boolean).map(line=>'<div lang="en">'+esc(line)+'</div>').join('')
  +'</div></details>':'';
 personalityReceipt.innerHTML='<article class="personality-paper">'
  +'<header class="personality-head"><span lang="en">SHOPPING！！</span>'
  +btn('close-profile','收起 ↓','text-btn','autofocus')+'</header>'
  +'<div class="personality-meta"><strong>人格档案 / NO. '+t.id+'</strong><span>'+amount(t)+'</span></div>'
  +'<div class="personality-hero">'+portrait
  +'<div class="personality-title-copy"><h2 id="personality-title">'+esc(t.type)+'</h2>'
  +(t.english?'<p class="personality-translation" lang="en">'+esc(t.english)+'</p>':'')
  +'<p class="personality-motto">'
  +esc(t.code?t.motto:'图鉴表里没有匹配这张小票的商品组合。')+'</p></div></div>'
  +'<p class="personality-character">'+esc(t.detail||t.character)+'</p>'
  +details
  +'<footer class="personality-foot"><div class="actions">'
  +btn('wall','回到小票墙','text-btn')+btn('types','浏览 16 型人格图鉴','text-btn')
  +'</div>'+btn('intro','<span aria-hidden="true">←</span><span>返回首页</span>','profile-home-link')+'</footer></article>';
 personalityReceipt.showModal();
}
function types(){
 const rulesButton=btn('rules','人格规则','outline-btn','aria-haspopup="dialog" aria-controls="rules"');
 const actions='<div class="actions">'+rulesButton+btn('profile','← 返回人格小票','text-btn')+'</div>';
 return '<div class="screen-head"><div><div class="screen-caption"><div class="kicker">FPTI / INDEX</div>'
  +'<span class="screen-translation" lang="en">Shopping Personality Atlas</span></div><h1 tabindex="-1">购物人格图鉴</h1></div>'+actions+'</div>'
  +'<div class="types">'+TYPES.map(t=>'<article><img src="'+t.image+'" alt=""><div><div class="mono">'+esc(t.code)+'</div><h2>'+esc(t.name)+'</h2><p>'+esc(t.english)+'</p><p>'+esc(t.shopping)+'</p><p>'+esc(t.taste)+'</p></div></article>').join('')+'</div>'+personalityRules();
}
function go(next,{focus=true,stable=false,handoff=false,coverHandoff=false}={}){
 if(['pick','analysis','profile'].includes(next)&&!ticket)return;
 if(personalityReceipt.open)personalityReceipt.close();
 exhibit.querySelector('.paper-transition')?.remove();
 exhibit.querySelector('.book-transition')?.remove();
 if(!coverHandoff){
  exhibit.querySelector('.cover-reveal')?.remove();
  view.inert=false;
 }
 if(!handoff)exhibit.querySelector('.basket-handoff')?.remove();
 exhibit.querySelector('.site-wordmark').getAnimations().forEach(motion=>motion.cancel());
 const previous=page;
 const turningBook=!coverHandoff&&!reduced.matches&&previous!==next&&[previous,next].includes('intro');
 const bookPage=turningBook?view.cloneNode(true):null;
 const oldPaper=turningBook?getComputedStyle(exhibit).backgroundColor:'';
 const returning=next==='wall'&&page!=='wall'?view.querySelector('.ticket-wrap img'):null;
 const returnBox=returning?.getBoundingClientRect();
 
 page=next;
 render();
 if(next==='pick'){
  updateCart();
  bindBasketMotion();
 }
 if(bookPage)playBookTurn(bookPage,oldPaper,next==='intro');
 else if(previous!==next&&!reduced.matches&&next!=='wall'&&!handoff){view.animate([{opacity:.65},{opacity:1}],{duration:210});}
 if(next==='analysis')updateNutrition();
 if(next==='wall'){
  window.scrollTo(0,0);
  const landing=wallId&&view.querySelector('.tile[data-id="'+wallId+'"] img');
  if(returning&&landing){
   const finish=()=>{if(!landing.isConnected)return;const motion=fly(returning.src,returnBox,landing.getBoundingClientRect(),'ticket-flight');if(motion){landing.style.opacity='0';motion.then(()=>landing.style.opacity='')}};
   if(landing.complete)finish();else landing.addEventListener('load',finish,{once:true});
  }
  if(focus){
   const target=wallId?view.querySelector('[data-id="'+wallId+'"]'):view;
   (target??view).focus({preventScroll:true});
  }
 }else if(!stable){
  window.scrollTo(0,0);
  if(focus)(view.querySelector('h1')??view).focus({preventScroll:true});
 }
}
function bookTransitionLayer(content){
 const shell=document.createElement('div');
 shell.className='book-transition';
 shell.inert=true;
 shell.setAttribute('aria-hidden','true');
 shell.append(content);
 exhibit.append(shell);
 return shell;
}
function prepareBookSnapshot(snapshot,paper){
 snapshot.removeAttribute('id');
 snapshot.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
 snapshot.classList.add('book-snapshot');
 snapshot.style.backgroundColor=paper;
 return snapshot;
}
function playBookTurn(snapshot,oldPaper,reverse){
 const shell=bookTransitionLayer(prepareBookSnapshot(snapshot,oldPaper));
 const ribbon=document.createElement('div');
 ribbon.className='book-turn-ribbon';
 shell.append(ribbon);
 const direction=reverse?1:-1;
 const options={duration:740,easing:'cubic-bezier(.62,.03,.22,1)',fill:'both'};
 snapshot.animate([{translate:'0px 0px'},{translate:direction*exhibit.offsetWidth+'px 0px'}],options)
  .finished.then(()=>shell.remove(),()=>shell.remove());
 ribbon.style[reverse?'right':'left']='-165px';
 ribbon.animate([
  {translate:direction*exhibit.offsetWidth+'px 0px'},
  {translate:'0px 0px',offset:.32},
  {translate:-direction*exhibit.offsetWidth+'px 0px'}
 ],{duration:730,easing:'cubic-bezier(.53,.01,.3,1)',fill:'both'});
 view.querySelector('.book-art')?.animate([
  {translate:-direction*72+'px 0px'},
  {translate:'0px 0px'}
 ],{duration:740,easing:'cubic-bezier(.19,.72,.25,1)'});
}
function coverMotionImage(img,layer){
 const clone=img.cloneNode();
 clone.className='cover-motion-image';
 Object.assign(clone.style,{width:img.offsetWidth+'px',height:img.offsetHeight+'px'});
 layer.append(clone);
 return clone;
}
async function openCoverPiece(button){
 if(page!=='intro'||exhibit.querySelector('.cover-reveal'))return;
 wallId=button.dataset.id;
 const source=button.querySelector('img');
 if(reduced.matches||!source.naturalWidth){
  go('wall',{coverHandoff:true});
  return;
 }
 const cover=button.closest('.book-intro');
 const point=img=>{
  const stage=exhibit.getBoundingClientRect();
  const scale=stage.width/exhibit.offsetWidth;
  const box=img.getBoundingClientRect();
  return [(box.left+box.width/2-stage.left)/scale,(box.top+box.height/2-stage.top)/scale];
 };
 const pose=([x,y],zoom=1,angle=0)=>'translate('+x+'px,'+y+'px) translate(-50%,-50%) rotate('+angle+'deg) scale('+zoom+')';
 const peak=[exhibit.offsetWidth/2,exhibit.offsetHeight*.48];
 const width=source.offsetWidth,height=source.offsetHeight;
 const zoom=Math.min(460/width,600/height);
 const start=pose(point(source),parseFloat(getComputedStyle(source).scale)||1,parseFloat(getComputedStyle(button).rotate)||0);
 const layer=document.createElement('div');
 layer.className='cover-reveal';
 layer.inert=true;
 layer.setAttribute('aria-hidden','true');
 layer.append(cover);
 exhibit.append(layer);
 view.inert=true;
 let destination,arrival,wordmarkMotion;
 try{
  go('wall',{focus:false,coverHandoff:true});
  destination=view.querySelector('.tile[data-id="'+wallId+'"]');
  arrival=destination.querySelector('img');
  // Resolve the landing box before any visible movement.
  if(!arrival.naturalWidth)await arrival.decode().catch(()=>{});
  if(!layer.isConnected||!arrival.naturalWidth)return;
  const target=point(arrival);
  const endScale=Math.min(arrival.offsetWidth/width,arrival.offsetHeight/height);
  const receiptZoom=Math.min(width*zoom/arrival.offsetWidth,height*zoom/arrival.offsetHeight);
  const artwork=coverMotionImage(source,layer);
  const receipt=coverMotionImage(arrival,layer);
  source.style.visibility='hidden';
  arrival.style.visibility='hidden';
  const timing={duration:1320,fill:'both'};
  const growEnd=410/timing.duration;
  const leavePeak='cubic-bezier(.34,.08,.32,1)';
  cover.animate([
   {opacity:1},{opacity:1,offset:growEnd},{opacity:0,offset:.88},{opacity:0}
  ],timing);
  wordmarkMotion=exhibit.querySelector('.site-wordmark').animate([
   {color:'var(--paper)',textShadow:'0 1px 4px #0008'},
   {color:'var(--paper)',textShadow:'0 1px 4px #0008',offset:growEnd},
   {color:'var(--ink)',textShadow:'none',offset:.83},
   {color:'var(--ink)',textShadow:'none'}
  ],timing);
  artwork.animate([
   {transform:start,opacity:1,easing:'cubic-bezier(.22,.54,.32,1)'},
   {transform:pose(peak,zoom),opacity:1,offset:growEnd,easing:leavePeak},
   {opacity:0,offset:.70},
   {transform:pose(target,endScale),opacity:0}
  ],timing);
  await receipt.animate([
   {transform:pose(peak,receiptZoom),opacity:0},
   {transform:pose(peak,receiptZoom),opacity:0,offset:growEnd,easing:leavePeak},
   {opacity:1,offset:.70},
   {transform:pose(target),opacity:1}
  ],timing).finished;
 }finally{
  wordmarkMotion?.cancel();
  source.style.visibility='';
  if(arrival)arrival.style.visibility='';
  if(layer.isConnected){
   layer.remove();
   view.inert=false;
   destination?.focus({preventScroll:true});
  }
 }
}
function select(id,next='pick'){
 const t=TICKETS.find(x=>x.id===id);
 if(!t)return;
 if(page==='wall')wallId=id;
 ticket=t;
 if(!baskets.has(id))baskets.set(id,new Set());
 if(next==='pick'){
  for(const src of new Set(t.items.map(item=>item.image).filter(Boolean))){
   const preload=new Image();
   preload.src=src;
   preload.decode().catch(()=>{});
  }
 }
 metric=0;highlight=-1;
 go(next);
}
function fly(src,from,to,kind,duration=kind==='flight'?510:570,foodIndex){
 if(reduced.matches||!src||!from||!to||!from.width||!to.width)return;
 const clone=document.createElement('img');
 clone.src=src;clone.className=kind;clone.alt='';
 if(foodIndex!==undefined)clone.dataset.i=foodIndex;
 Object.assign(clone.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});
 document.body.append(clone);
 const dx=to.left-from.left,dy=to.top-from.top;
 const last={transform:'translate('+dx+'px,'+dy+'px) scale('+to.width/from.width+','+to.height/from.height+')',opacity:kind==='flight'?.65:1};
 clone.style.transformOrigin='0 0';
 const frames=kind==='flight'?[{transform:'translate(0,0)'},{transform:'translate('+dx*.56+'px,'+(dy*.5-70)+'px) rotate(-12deg)',offset:.54},last]:[{transform:'translate(0,0)'},last];
 const easing=kind==='ticket-flight'&&duration>700?'cubic-bezier(.35,.1,.25,1)':'cubic-bezier(.23,.67,.22,1)';
 const a=clone.animate(frames,{duration,easing});
 a.finished.then(()=>clone.remove(),()=>clone.remove());
 return a.finished;
}
function capturePaperTurn(tile){
 const shell=document.createElement('div');
 shell.className='paper-transition';
 shell.setAttribute('aria-hidden','true');
 shell.inert=true;
 const pageCopy=document.createElement('div');
 pageCopy.className='paper-snapshot';
 const snapshot=view.cloneNode(true);
 snapshot.removeAttribute('id');
 snapshot.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
 const source=snapshot.querySelector('.tile[data-id="'+tile.dataset.id+'"] img');
 if(source)source.style.visibility='hidden';
 pageCopy.append(snapshot);
 return ()=>{
  const edge=document.createElement('div');
  edge.className='paper-edge';
  shell.append(pageCopy,edge);
  exhibit.append(shell);
  const turn={duration:940,easing:'cubic-bezier(.52,.05,.25,1)',fill:'both'};
  const height=exhibit.offsetHeight;
  const seamAngle=Math.atan2(height*.06,exhibit.offsetWidth)*180/Math.PI;
  edge.style.rotate=seamAngle+'deg';
  pageCopy.querySelector('main').animate([
   {translate:'0px 0px'},{translate:'0px -110px'}
  ],turn);
  edge.animate([{translate:'0px '+height+'px'},{translate:'0px '+(-height*.1)+'px'}],turn);
  pageCopy.animate([
   {clipPath:'polygon(0 0,100% 0,100% 106%,0 100%)'},
   {clipPath:'polygon(0 0,100% 0,100% -4%,0 -10%)'}
  ],turn).finished.then(()=>shell.remove(),()=>shell.remove());
 };
}
function openTicket(button,id){
 const onWall=page==='wall';
 const from=onWall?button.querySelector('img')?.getBoundingClientRect():null;
 const reveal=from?.width&&!reduced.matches?capturePaperTurn(button):null;
 select(id);
 if(reveal){
  reveal();
  const parallaxEnd=1800;
  const textOffset=21,textDelay=630;
  const textEasing='cubic-bezier(.2,.68,.2,1)';
  const layers=[
   ['.pick .receipt-panel > .hint',textOffset,textDelay],
   ['.pick .cart-panel',126,510]
  ];
  for(const [selector,offset,delay] of layers){
   const layer=view.querySelector(selector);
   layer?.animate([
    {translate:'0px '+offset+'px',opacity:0},
    {translate:'0px 0',opacity:1}
   ],{delay,duration:parallaxEnd-delay,fill:'backwards',easing:textEasing});
  }
  exhibit.querySelector('.site-wordmark').animate([
   {translate:'0px 0px',easing:'ease-in-out'},
   {translate:'0px '+textOffset+'px',offset:textDelay/parallaxEnd,easing:textEasing},
   {translate:'0px 0px'}
  ],{duration:parallaxEnd});
 }
 const img=view.querySelector('.ticket-wrap img');
 const animate=()=>{
  if(!img?.isConnected||!from)return;
  const motion=fly(img.src,from,img.getBoundingClientRect(),'ticket-flight',reveal?880:570);
  if(motion){img.style.opacity='0';motion.then(()=>img.style.opacity='',()=>img.style.opacity='');}
 };
 if(img?.complete)animate();
 else img?.addEventListener('load',animate,{once:true});
}
function addItem(i,button){
 if(!ticket.items[i]||basket().has(i))return;
 const item=ticket.items[i];
 const contents=view.querySelector('#basket');
 const stage=contents.closest('.cart-stage');
 const pending=flyingItems.get(contents)??new Set();
 if(!reduced.matches)pending.add(i);
 flyingItems.set(contents,pending);
 basket().add(i);
 updateCart();
 if(reduced.matches)return;
 const x=stage.offsetWidth*(.5+(Math.random()-.5)*.25);
 const y=stage.offsetHeight*.43;
 const finish=()=>{
  pending.delete(i);
  if(!contents.isConnected)return;
  contents.querySelector('[data-i="'+i+'"]').removeAttribute('data-in-flight');
  contents.dispatchEvent(new CustomEvent('basket-item-landed',{detail:{index:i,x,y}}));
  revealBasketSticker(contents);
 };
 const source=button.getBoundingClientRect(),frame=stage.getBoundingClientRect();
 const size=basketFoodSize(stage)*view.getBoundingClientRect().width/view.offsetWidth;
 const land={left:frame.left+x/stage.offsetWidth*frame.width-size/2,top:frame.top+y/stage.offsetHeight*frame.height-size/2,width:size,height:size};
 const flight=fly(item.image,{left:source.left+source.width*.48,top:source.top,width:size,height:size},land,'flight',510,i);
 if(flight)flight.then(finish,finish);
 else finish();
}
async function decode(){
 if(page!=='pick'||exhibit.querySelector('.basket-handoff'))return;
 const stage=view.querySelector('.cart-stage');
 ticket.items.forEach((_,i)=>basket().add(i));
 metric=0;highlight=-1;
 if(reduced.matches){go('analysis');return;}

 const frame=exhibit.getBoundingClientRect();
 const scale=frame.width/exhibit.offsetWidth;
 const old=stage.getBoundingClientRect();
 const left=(old.left-frame.left)/scale;
 const flights=[...document.querySelectorAll('body > .flight[data-i]')];
 const sources=ticket.items.map((_,i)=>{
  const flying=flights.find(el=>+el.dataset.i===i);
  const inBasket=stage.querySelector('.basket-item[data-i="'+i+'"]:not([data-in-flight]) > .food');
  const row=view.querySelector('.hot[data-i="'+i+'"]');
  return {rect:(flying??inBasket??row).getBoundingClientRect(),fromReceipt:!flying&&!inBasket};
 });
 const layer=document.createElement('div');
 layer.className='basket-handoff';
 layer.setAttribute('aria-hidden','true');
 layer.innerHTML=analysisBasket();
 const moving=layer.firstElementChild;
 Object.assign(moving.style,{left:left+'px',top:(old.top-frame.top)/scale+'px',width:old.width/scale+'px'});
 exhibit.append(layer);
 stage.style.visibility='hidden';
 for(const clone of [...flights,...document.querySelectorAll('body > .ticket-flight')]){
  clone.getAnimations().forEach(motion=>motion.cancel());
 }
 const recalls=[...moving.querySelectorAll('.analysis-food')].map(el=>{
  const {rect,fromReceipt}=sources[+el.dataset.i];
  const target=el.getBoundingClientRect();
  const x=((rect.left+rect.right)-(target.left+target.right))/2/scale;
  const y=((rect.top+rect.bottom)-(target.top+target.bottom))/2/scale;
  const size=fromReceipt?.35:Math.min(1.25,Math.max(.45,rect.width/target.width));
  return el.animate([
   {transform:'translate('+x+'px,'+y+'px) scale('+size+')',opacity:fromReceipt?.25:1},
   {transform:'translate('+x*.43+'px,'+(y*.43-18)+'px) scale('+(.56+size*.44)+')',opacity:1,offset:.56},
   {transform:'translate(0,0) scale(1)',opacity:1}
  ],{duration:510,easing:'cubic-bezier(.25,.8,.25,1)'}).finished;
 });
 await Promise.allSettled(recalls);
 if(!layer.isConnected)return;
 await moving.animate([
  {transform:'translateX(0) scale(1)'},
  {transform:'translateX('+(exhibit.offsetWidth-left+40)+'px) scale(.52)'}
 ],{duration:350,easing:'cubic-bezier(.45,0,.85,.5)',fill:'forwards'}).finished;
 if(!layer.isConnected)return;

 go('analysis',{handoff:true});
 layer.remove();
 view.querySelector('.chart-area').animate([
  {translate:'-35px 0',opacity:.3},
  {translate:'0px 0',opacity:1}
 ],{duration:470,easing:'cubic-bezier(.2,.7,.25,1)'});
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button[data-act]');
 if(!b)return;
 const {act,id}=b.dataset,i=Number(b.dataset.i);
 if(act==='breakdown'){
  const list=view.querySelector('#nutrition-breakdown');
  list.hidden=!list.hidden;
  b.setAttribute('aria-expanded',!list.hidden);
  b.textContent=list.hidden?'查看完整明细':'收起明细';
 }else if(act==='cover-pick'){openCoverPiece(b)}
 else if(act==='profile'){openPersonalityReceipt()}
 else if(act==='close-profile'){personalityReceipt.close()}
 else if(act==='rules'){view.querySelector('#rules').showModal()}
 else if(act==='close-rules'){view.querySelector('#rules').close()}
 else if(act==='open'){openTicket(b,id)}
 else if(act==='add'){addItem(i,b)}
 else if(act==='all'){ticket.items.forEach((_,j)=>basket().add(j));updateCart()}
 else if(act==='decode'||(act==='analysis'&&page==='pick')){decode()}
 else if(act==='metric'){
  metric=i;
  view.querySelectorAll('[data-act=metric]').forEach(x=>x.setAttribute('aria-pressed',x===b));
  updateNutrition();
 }else if(act==='mark'){
  highlight=i;
  syncMark();
  if(b.matches('.seg, .legend [data-act=mark]')){
   const receipt=view.querySelector('#receipt');
   receipt.open=true;
   receipt.ontoggle=()=>{
    if(receipt.open)return;
    receipt.ontoggle=null;
    if(b.isConnected)b.focus({preventScroll:true});
   };
   receipt.querySelector('summary').focus({preventScroll:true});
  }
 }
 else if(act==='types'){go('types')}
 else if(['intro','wall','pick','analysis'].includes(act)){go(act)}
});
personalityReceipt.addEventListener('click',event=>{
 if(event.target===personalityReceipt)personalityReceipt.close();
});
document.addEventListener('change',e=>{
 const {id,value}=e.target;
 if(id==='sort')sort=value;
 else if(id==='sort-direction')sortDirection=value;
 else return;
 render();
 document.getElementById(id).focus({preventScroll:true});
});
function previewItem(i){
 showItem(i>=0?i:highlight);
 view.querySelectorAll('[data-act=mark]').forEach(mark=>{
  const same=Number(mark.dataset.i)===i;
  mark.classList.toggle('is-preview',same);
  mark.classList.toggle('is-muted',i>=0&&!same);
 });
}
view.addEventListener('pointerover',event=>{
 const mark=event.target.closest('[data-act=mark]');
 if(mark)previewItem(Number(mark.dataset.i));
});
view.addEventListener('pointerout',event=>{
 const mark=event.target.closest('[data-act=mark]');
 if(mark&&!mark.contains(event.relatedTarget))previewItem(-1);
});
view.addEventListener('focusin',event=>{
 const mark=event.target.closest('[data-act=mark]');
 if(mark)previewItem(Number(mark.dataset.i));
});
view.addEventListener('focusout',event=>{
 if(event.target.closest('[data-act=mark]'))previewItem(-1);
});
go('intro',{focus:false});












