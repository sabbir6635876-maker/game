// চাচার দোকানে বাকি — Phaser 3 গেম (UI + গেম লজিক)
const W=960,H=540,KEY='chacha_save_v1',F='"Noto Sans Bengali","Hind Siliguri",Kalpurush,sans-serif';
const G={mute:localStorage.getItem('chacha_mute')==='1'};
// ভবিষ্যৎ অনলাইন লিডারবোর্ডের জন্য: endpoint সেট করলেই স্কোর সার্ভারে যাবে
const Net={endpoint:null,async submitScore(s){localStorage.setItem('chacha_best',Math.max(s,+localStorage.getItem('chacha_best')||0));
 if(!this.endpoint)return;try{await fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({score:s})});}catch(e){}}};
// ---- সাউন্ড (WebAudio, কোনো কপিরাইট ফাইল নেই) ----
let AC;
function snd(t){if(G.mute)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();
 const q={coin:[[880,.08],[1320,.12]],bad:[[220,.15],[150,.25]],boing:[[300,.08],[500,.08],[250,.15]],tap:[[600,.05]]}[t];let at=AC.currentTime;
 q.forEach(([f,d])=>{const o=AC.createOscillator(),g=AC.createGain();o.type=t=='bad'?'sawtooth':'square';o.frequency.value=f;
 g.gain.setValueAtTime(.06,at);g.gain.exponentialRampToValueAtTime(.001,at+d);o.connect(g).connect(AC.destination);o.start(at);o.stop(at+d);at+=d;});}catch(e){}}
// ---- UI হেল্পার ----
function mkBtn(s,x,y,w,h,label,cb,col=0xd35400){
 const r=s.add.rectangle(x,y,w,h,col).setStrokeStyle(3,0xffffff).setInteractive({useHandCursor:true});
 const t=s.add.text(x,y,label,{fontFamily:F,fontSize:Math.min(21,h*.4)+'px',color:'#fff',align:'center',wordWrap:{width:w-8}}).setOrigin(.5);
 r.on('pointerdown',()=>{snd('tap');cb();});
 return{r,t,cb,destroy(){r.destroy();t.destroy();}};}
function panel(s,text,btns){
 const o=[s.add.rectangle(W/2,H/2,W,H,0,.7).setInteractive().setDepth(50),s.add.rectangle(W/2,H/2,720,390,0x34495e).setStrokeStyle(4,0xf1c40f).setDepth(51),
 s.add.text(W/2,H/2-40,text,{fontFamily:F,fontSize:'23px',color:'#fff',align:'center',wordWrap:{width:660},lineSpacing:8}).setOrigin(.5).setDepth(51)];
 btns.forEach(([l,cb,col],i)=>{const b=mkBtn(s,W/2+(i-(btns.length-1)/2)*240,H/2+155,226,52,l,cb,col);b.r.setDepth(52);b.t.setDepth(52);o.push(b);});
 return{close(){o.forEach(x=>x.destroy());}};}
// ---- মেনু ----
class Menu extends Phaser.Scene{
 constructor(){super('Menu');}
 create(){
  this.add.rectangle(W/2,H/2,W,H,0x2c3e50);
  const k=this.add.text(W/2,330,'🫖',{fontSize:'90px'}).setOrigin(.5);this.tweens.add({targets:k,angle:{from:-8,to:8},yoyo:true,repeat:-1,duration:600});
  this.add.text(W/2,80,'চাচার দোকানে বাকি',{fontFamily:F,fontSize:'56px',color:'#f1c40f',stroke:'#000',strokeThickness:6}).setOrigin(.5);
  this.add.text(W/2,140,'চা খাইলে টাকা দিতে হয়—এই নিয়মটা সবাই জানে, মানে না!',{fontFamily:F,fontSize:'22px',color:'#ecf0f1'}).setOrigin(.5);
  this.add.text(W/2,175,'🏆 সেরা স্কোর: '+bn(localStorage.getItem('chacha_best')||0),{fontFamily:F,fontSize:'18px',color:'#bdc3c7'}).setOrigin(.5);
  const has=!!localStorage.getItem(KEY);
  mkBtn(this,200,440,200,56,'নতুন খেলা',()=>{localStorage.removeItem(KEY);this.scene.start('Play');});
  mkBtn(this,420,440,200,56,'চালিয়ে যান',()=>has&&this.scene.start('Play'),has?0x27ae60:0x7f8c8d);
  mkBtn(this,640,440,200,56,'কীভাবে খেলবেন',()=>this.info(),0x2980b9);
  mkBtn(this,860,440,160,56,'সেটিংস',()=>this.settings(),0x8e44ad);
 }
 info(){const p=panel(this,'কীভাবে খেলবেন\n\nকাস্টমার যা চায় সেই আইটেমের বাটনে চাপ দিন (কিবোর্ডে ১-৬)। সে টাকা দেবে অথবা বাকি চাইবে — বাকি দেবেন নাকি টাকা চাইবেন, আপনার সিদ্ধান্ত! পুরোনো বাকিওয়ালা এলে "পুরোনো বাকি চাই" চাপুন। কেউ পালালে "ধর ধর!" চাপুন। সুনাম শূন্য হলে দোকান লাটে!',[['বুঝেছি',()=>p.close()]]);}
 settings(){const p=panel(this,'সেটিংস\n\nশব্দ: '+(G.mute?'বন্ধ':'চালু'),[[G.mute?'শব্দ চালু করুন':'শব্দ বন্ধ করুন',()=>{G.mute=!G.mute;localStorage.setItem('chacha_mute',G.mute?1:0);p.close();this.settings();}],['ফিরে যান',()=>p.close(),0x7f8c8d]]);}
}
// ---- মূল গেম ----
class Play extends Phaser.Scene{
 constructor(){super('Play');}
 create(){
  this.S=JSON.parse(localStorage.getItem(KEY)||'null')||{money:100,baki:0,rep:50,level:1,day:1,score:0,debts:{},prom:{}};
  this.served=0;this.bt=[];this.paused=false;this.state='';
  this.walkers();this.drawShop();
  const st={fontFamily:F,fontSize:'20px',color:'#fff',stroke:'#000',strokeThickness:4};
  this.h1=this.add.text(10,8,'',st).setDepth(10);this.h2=this.add.text(W-10,8,'',{...st,align:'right'}).setOrigin(1,0).setDepth(10);
  this.noteT=this.add.text(W/2,438,'',{...st,color:'#f9e79f',align:'center',wordWrap:{width:880}}).setOrigin(.5).setDepth(10);
  this.bub=this.add.text(700,215,'',{fontFamily:F,fontSize:'20px',color:'#222',backgroundColor:'#fff',padding:{x:10,y:6},wordWrap:{width:320},align:'center'}).setOrigin(.5,1).setDepth(6).setVisible(false);
  const pb=mkBtn(this,W-55,100,100,36,'⏸ বিরতি',()=>this.pause(),0x34495e);pb.r.setDepth(10);pb.t.setDepth(10);
  this.input.keyboard.on('keydown',e=>{if(e.key==='Escape')return this.pause();const n=parseInt(e.key);if(n&&this.bt[n-1]&&!this.paused)this.bt[n-1].cb();});
  this.hud();this.note('দিন '+bn(this.S.day)+' শুরু! কেটলিতে পানি চাপান...');
  this.time.delayedCall(800,()=>this.next());
 }
 update(){if(this.fan&&this.fan.active)this.fan.angle+=7;}
 // রাস্তার চলমান মানুষ ও মেঘ (parallax)
 walkers(){this.add.rectangle(W/2,140,W,280,0x9bd7f0).setDepth(-3);this.add.rectangle(W/2,285,W,60,0x6c6c6c).setDepth(-3);
  [['☁️',50,60,40000],['☁️',60,120,55000],['🚶',280,40,14000],['🛺',270,55,9000],['🚲',290,45,11000],['🚶‍♀️',275,34,17000],['🐕',295,26,12000]].forEach(([e,y,z,d],i)=>{
   const t=this.add.text(-80,y,e,{fontSize:z+'px'}).setDepth(-2);this.tweens.add({targets:t,x:1040,duration:d,repeat:-1,delay:i*1500});});}
 drawShop(){
  const L=this.S.level;if(this.back)this.back.destroy();if(this.front)this.front.destroy();
  const B=this.back=this.add.container(0,0).setDepth(0),Fr=this.front=this.add.container(0,0).setDepth(3);this.fan=null;
  const R=(c,x,y,w,h,col)=>c.add(this.add.rectangle(x,y,w,h,col));
  const T=(c,x,y,s,z,col)=>{const t=this.add.text(x,y,s,{fontFamily:F,fontSize:z+'px',color:col||'#fff',align:'center'}).setOrigin(.5);c.add(t);return t;};
  R(B,W/2,35,600,64,0x1e8449).setStrokeStyle(4,0xf1c40f);T(B,W/2,35,'চাচার চায়ের দোকান',38);
  R(B,100,170,200,230,0xc49a6c);R(B,860,170,200,230,0xc49a6c);
  R(B,115,120,120,80,0xf5e6b3);T(B,115,120,'আজ রাতে\nক্রিকেট!',20,'#c0392b');
  if(L<5){R(B,845,150,130,80,0xf5e6b3);T(B,845,150,'আজ নগদ,\nকাল বাকি!',22,'#c0392b');}
  R(B,820,462,220,22,0x8b5a2b);R(B,730,490,16,40,0x6e4420);R(B,910,490,16,40,0x6e4420);
  R(B,150,350,90,100,0xf5f5f5);T(B,150,285,'👴',96);
  if(L>=4)this.fan=T(B,480,110,'🌀',54);
  if(L>=5){R(B,850,150,130,95,0x222222);R(B,850,150,112,78,0x3498db);T(B,850,150,'📺 খবর',24);}
  if(L>=6){R(B,80,260,76,130,0xecf0f1).setStrokeStyle(3,0x95a5a6);T(B,80,215,'ফ্রিজ',16,'#333');}
  if(L>=7)T(B,830,235,'📶 ফ্রি Wi-Fi',20);
  R(Fr,W/2,392,840,66,L>=8?0xb8860b:0x8b4a1f);R(Fr,W/2,357,860,14,0xb5651d);
  T(Fr,300,320,L>=8?'🫖✨':'🫖',64);T(Fr,200,330,'📒',40);
  if(L>=2)T(Fr,420,325,'🥟',50);
  if(L>=3){R(Fr,540,320,70,64,0xd6eaf8).setAlpha(.6).setStrokeStyle(3,0xffffff);T(Fr,540,322,'🍪',44);}
 }
 hud(){const S=this.S;S.rep=Phaser.Math.Clamp(S.rep,0,100);const h=Math.floor(7+this.served*1.5);
  this.h1.setText('💰 টাকা: ৳'+bn(S.money)+'\n📒 বাকি: ৳'+bn(S.baki));
  this.h2.setText('⭐ সুনাম: '+bn(S.rep)+'\n🏪 লেভেল '+bn(S.level)+'  ⏰ দিন '+bn(S.day)+' · '+bn(h>12?h-12:h)+'টা');
  if(S.rep<=0&&this.state!=='over')this.over();}
 save(){localStorage.setItem(KEY,JSON.stringify(this.S));}
 say(t){this.bub.setText(t||'').setVisible(!!t);}
 note(t){this.noteT.setText(t||'');}
 head(e){if(this.cu&&this.cu.active)this.cu.list[1].setText(e);}
 setBtns(list){this.bt.forEach(b=>b.destroy());const n=list.length;
  this.bt=list.map(([l,cb,col],i)=>{const b=mkBtn(this,10+(i+.5)*(W-20)/n,500,(W-20)/n-8,56,bn(i+1)+'· '+l,cb,col);b.r.setDepth(10);b.t.setDepth(10);return b;});}
 price(i){return Math.round(i.p*(this.S.level>=8?1.2:1));}
 menuBtns(){const l=ITEMS.filter(i=>i.l<=this.S.level).map(i=>[i.n+' ৳'+bn(this.price(i)),()=>this.serve(i)]);
  if(this.S.debts[this.c.n]&&!this.asked)l.push(['📒 পুরোনো বাকি চাই',()=>this.collect(),0x2980b9]);this.setBtns(l);}
 next(){
  if(this.served>=8)return this.endDay();
  const c=this.c=Phaser.Utils.Array.GetRandom(CUST),av=ITEMS.filter(i=>i.l<=this.S.level);this.it=Phaser.Utils.Array.GetRandom(av);this.asked=false;
  const cu=this.cu=this.add.container(1100,0).setDepth(1);
  cu.add([this.add.rectangle(0,350,84,100,c.c),this.add.text(0,290,c.e,{fontSize:'84px'}).setOrigin(.5),
   this.add.text(0,228,c.n,{fontFamily:F,fontSize:'18px',color:'#fff',backgroundColor:'#000a',padding:{x:6,y:2}}).setOrigin(.5)]);
  this.tweens.add({targets:cu,x:700,duration:700,ease:'Back.Out',onComplete:()=>{this.say(c.pre+' একটা '+this.it.n+' দেন!');snd('boing');}});
  this.tweens.add({targets:cu,y:-6,yoyo:true,repeat:-1,duration:400});
  this.note('');this.say('');this.state='order';this.menuBtns();
 }
 serve(i){
  if(this.state!=='order')return;
  if(i!==this.it){this.say('এটা তো চাইনি চাচা! 😤');this.S.rep-=1;snd('bad');this.head('😤');return this.hud();}
  this.state='busy';this.setBtns([]);const S=this.S,c=this.c;this.p=Math.round(this.price(i)*(c.disc?.7:1));
  snd('tap');
  if(Math.random()<.15)return this.runaway();
  if(Math.random()<c.pay+(S.level>=5?.08:0)+(S.rep>70?.05:0)){S.money+=this.p;S.score+=this.p;this.head('😄');this.say(c.ok);snd('coin');this.note('💵 +৳'+bn(this.p));this.finish();}
  else{const n=S.prom[c.n]||0;S.prom[c.n]=n+1;this.head('🥺');this.say(c.bk);if(n)this.note('📢 এই কথাটি গত '+bn(n)+' বারও বলা হয়েছিল।');snd('boing');
   this.state='baki';this.setBtns([['📒 বাকি দিন',()=>this.decide(1),0x27ae60],['💰 না, টাকা দিন!',()=>this.decide(0),0xc0392b]]);}
 }
 decide(y){
  if(this.state!=='baki')return;this.state='busy';this.setBtns([]);const S=this.S,p=this.p,c=this.c;
  if(y){S.baki+=p;S.debts[c.n]=(S.debts[c.n]||0)+p;S.rep+=1;this.head('😍');this.say('ধন্যবাদ চাচা! আপনি মহান!');this.note('📒 খাতায় লেখা হলো: ৳'+bn(p));snd('boing');}
  else if(Math.random()<.55){S.money+=p;S.score+=p;S.rep-=1;this.head('😒');this.say('নিন! এত কিপটা কেন?!');this.note('💵 +৳'+bn(p)+' (সুনাম −১)');snd('coin');}
  else{S.rep-=3;this.head('😡');this.say('হুহ! আর আসব না!');this.note('😡 কাস্টমার রেগে চলে গেল (সুনাম −৩)');snd('bad');}
  this.finish();
 }
 collect(){
  if(this.state!=='order')return;this.asked=true;const S=this.S,c=this.c,d=S.debts[c.n];
  if(Math.random()<c.pay+.25){S.money+=d;S.baki-=d;S.score+=d;delete S.debts[c.n];this.head('😅');this.say('ওহ! আছে আছে, নেন সব বাকি।');this.note('✅ ৳'+bn(d)+' বাকি আদায়!');snd('coin');}
  else{this.head('🤥');this.say(Phaser.Utils.Array.GetRandom(DENY));this.note('🤷 বাকি অস্বীকার! খাতায় আছে, কাস্টমারের মনে নাই');snd('boing');}
  this.hud();this.menuBtns();
 }
 // র‍্যান্ডম ইভেন্ট: টাকা না দিয়ে পালানো
 runaway(){
  this.state='run';this.head('😈');this.say('🏃 দৌড় দিল!');snd('boing');
  this.tweens.killTweensOf(this.cu);this.tweens.add({targets:this.cu,x:1100,duration:1800});
  this.setBtns([['🏃 ধর ধর!',()=>{if(this.state!=='run')return;this.state='busy';this.runT.remove();this.tweens.killTweensOf(this.cu);
   this.S.money+=this.p;this.S.score+=this.p;this.S.rep+=2;this.head('😭');this.say('ধরা খেয়েছি! নিন টাকা!');this.note('🎉 ধরে ফেলেছেন! +৳'+bn(this.p)+' (সুনাম +২)');snd('coin');this.setBtns([]);this.finish();},0xc0392b]]);
  this.runT=this.time.delayedCall(1800,()=>{if(this.state!=='run')return;this.state='busy';this.setBtns([]);this.S.rep-=2;this.note('😭 টাকা না দিয়ে পালাল! (সুনাম −২)');snd('bad');this.finish();});
 }
 finish(){
  this.served++;this.hud();this.save();const cu=this.cu;
  this.time.delayedCall(1300,()=>{this.say('');this.tweens.killTweensOf(cu);this.tweens.add({targets:cu,x:-120,duration:700,onComplete:()=>cu.destroy()});});
  this.time.delayedCall(2000,()=>{if(this.state!=='over'&&this.state!=='paused')this.next();});
 }
 endDay(){
  const S=this.S,L=S.level;this.state='end';this.setBtns([]);this.say('');
  S.rep=Math.min(100,S.rep+(L>=4?3:0)+(L>=7?3:0));this.hud();this.save();Net.submitScore(S.score);
  const cost=150*L,b=[];
  if(L<8)b.push(['⬆ আপগ্রেড ৳'+bn(cost),()=>{if(S.money<cost){this.pn.close();this.note('টাকা কম! ৳'+bn(cost)+' লাগবে');return this.endDay();}
   S.money-=cost;S.level++;this.drawShop();this.hud();this.pn.close();this.endDay();},0x27ae60]);
  b.push(['▶ পরের দিন',()=>{this.pn.close();S.day++;this.served=0;this.hud();this.save();this.note('দিন '+bn(S.day)+' শুরু!');this.time.delayedCall(800,()=>this.next());}]);
  if(this.pn)this.pn.close();
  this.pn=panel(this,'🌙 দিন '+bn(S.day)+' শেষ\n\n💰 টাকা: ৳'+bn(S.money)+'   📒 বাকি: ৳'+bn(S.baki)+'\n⭐ সুনাম: '+bn(S.rep)+'   🏆 স্কোর: '+bn(S.score)+'\n\n'+(L<8?'পরের আপগ্রেড: '+UP[L+1]+' (৳'+bn(cost)+')':'দোকান এখন সর্বোচ্চ লেভেলে! 🎉'),b);
 }
 pause(){if(this.paused||this.state==='over')return;this.paused=true;this.time.paused=true;this.tweens.pauseAll();
  const p=panel(this,'⏸ বিরতি',[['চালিয়ে যান',()=>{p.close();this.paused=false;this.time.paused=false;this.tweens.resumeAll();}],['মেনুতে যান',()=>{this.save();this.time.paused=false;this.tweens.resumeAll();this.scene.start('Menu');},0x7f8c8d]]);}
 over(){this.state='over';this.setBtns([]);Net.submitScore(this.S.score);localStorage.removeItem(KEY);
  panel(this,'😭 দোকান লাটে উঠেছে!\nসুনাম শেষ, কেউ আর বাকি দিতে আসে না।\n\n🏆 স্কোর: '+bn(this.S.score)+'  |  দিন: '+bn(this.S.day),[['আবার শুরু',()=>this.scene.start('Play')],['মেনু',()=>this.scene.start('Menu'),0x7f8c8d]]);}
}
new Phaser.Game({type:Phaser.AUTO,parent:'g',width:W,height:H,backgroundColor:'#1b2631',input:{activePointers:3},
 scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[Menu,Play]});
