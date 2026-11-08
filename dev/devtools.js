/* ============================================================
   Corner Books — developer panel (dev build only)
   Built into dev.html by dev/build.sh; never loaded by index.html.
   It runs after the game's own script, so it reaches the game's globals
   (S, GEO, paint, hud, autosave, …) directly and changes nothing about how
   the game itself plays.
   ============================================================ */
(function(){
  window.DEV_SPEED=1;                       // read by the game loop in the dev build only

  const css=`
  #devBtn{position:fixed;left:10px;bottom:10px;z-index:99999;background:#c0392b;color:#fff;
    font:700 12px/1 system-ui,sans-serif;letter-spacing:.08em;border:2px solid #fff;border-radius:6px;
    padding:8px 10px;box-shadow:0 2px 6px rgba(0,0,0,.4);cursor:pointer}
  #devPanel{position:fixed;left:10px;bottom:52px;z-index:99999;width:min(340px,calc(100vw - 20px));
    max-height:calc(100vh - 70px);overflow:auto;background:#1e1f24;color:#eee;border:2px solid #c0392b;
    border-radius:8px;padding:10px 12px;font:13px/1.35 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.5);display:none}
  #devPanel.on{display:block}
  #devPanel h3{margin:10px 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#f5a99f}
  #devPanel h3:first-of-type{margin-top:4px}
  #devPanel .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0}
  #devPanel input{width:80px;padding:5px 6px;border-radius:4px;border:1px solid #555;background:#2b2d33;color:#fff;font:inherit}
  #devPanel button{padding:5px 8px;border-radius:4px;border:1px solid #666;background:#3a3d45;color:#fff;font:inherit;cursor:pointer}
  #devPanel button:hover{background:#4a4e58}
  #devPanel button.on{background:#c0392b;border-color:#e67e73}
  #devPanel button:disabled{opacity:.4;cursor:default}
  #devPanel .st{background:#2b2d33;border-radius:4px;padding:6px 8px;font:12px/1.4 ui-monospace,monospace;white-space:pre-wrap}
  #devPanel .msg{min-height:1.2em;color:#9fe0a8;font-size:12px;margin-top:6px}
  #devPanel .msg.bad{color:#f5a99f}
  #devPanel .hint{color:#aaa;font-size:11px}
  #devTag{position:fixed;top:0;right:0;z-index:99998;background:#c0392b;color:#fff;font:700 10px/1 system-ui,sans-serif;
    padding:3px 6px;border-bottom-left-radius:4px;letter-spacing:.08em;pointer-events:none}`;
  const style=document.createElement("style"); style.textContent=css; document.head.appendChild(style);

  const tag=document.createElement("div"); tag.id="devTag"; tag.textContent="DEV COPY"; document.body.appendChild(tag);
  const btn=document.createElement("button"); btn.id="devBtn"; btn.textContent="DEV"; document.body.appendChild(btn);
  const P=document.createElement("div"); P.id="devPanel"; document.body.appendChild(P);
  // typing in the panel must not reach the game's own keyboard handlers (Esc opens the menu)
  ["keydown","keyup","keypress"].forEach(t=>P.addEventListener(t,e=>e.stopPropagation()));
  ["pointerdown","click"].forEach(t=>P.addEventListener(t,e=>e.stopPropagation()));

  const h=(tagName,attrs,kids)=>{ const e=document.createElement(tagName);
    Object.assign(e,attrs||{}); (kids||[]).forEach(k=>e.appendChild(typeof k==="string"?document.createTextNode(k):k)); return e; };
  let msgEl, statEl;
  function say(t,bad){ if(!msgEl){ (bad?console.warn:console.log)("[dev] "+t); return; } msgEl.textContent=t; msgEl.className="msg"+(bad?" bad":""); }
  function ready(){
    if(titleOn()){ say("Start or continue a shop first (title screen is up).",true); return false; }
    return true;
  }
  function refresh(){ try{ hud(); paint(); }catch(e){} status(); }
  function commit(t){ refresh(); autosave(); if(t) say(t); }
  function num(inp,fallback){ const v=parseFloat(inp.value); return Number.isFinite(v)?v:fallback; }

  // Drop anything that only exists inside a trading day, as a save load does.
  function clearTradingDay(){
    S.customers=[]; S.spawnQueue=[]; S.talking=null; S.placing=null; S.tick=0;
    georgeReset(); closeModal(); paused=false;
    if(typeof keeperHome==="function") keeperHome();   // back behind the till, if this build has the Coffee Corner walk
    if(typeof STK!=="undefined" && STK.open) closeStockTake();
  }

  /* ---------- actions ---------- */
  const A={
    jump(n){
      if(!ready()) return;
      n=Math.max(1,Math.round(n));
      clearTradingDay();
      S.day=n; S.phase="morning"; S.stats.spent=0; S.tab="stock"; S.sales=[];
      const got=deliverIncoming();               // orders due on or before this morning
      if(n>=2) rollVan(); else S.offers=[];
      commit("Jumped to day "+n+", morning."+(got.length?" "+got.length+" order(s) delivered.":"")+
        (n===1&&!S.events.george?" George will visit around noon.":""));
    },
    day1George(){
      if(!ready()) return;
      delete S.events.george; A.jump(1);
    },
    cash(v){ if(!ready()) return; S.cash=Math.round(v*100)/100; commit("Bank balance set to "+rm(S.cash)+"."); },
    addCash(v){ if(!ready()) return; S.cash=Math.round((S.cash+v)*100)/100; commit("Bank balance now "+rm(S.cash)+"."); },
    rep(v){ if(!ready()) return; S.rep=clamp(v,0,100); commit("Reputation set to "+Math.round(S.rep)+" (level "+level()+")."); },
    expand(){
      if(!ready()) return;
      const nt=nextTier(); if(!nt){ say("Already at the largest floor.",true); return; }
      if(S.phase==="open"){ say("Expand in the morning or evening, not while trading.",true); return; }
      const c=S.cash, r=S.rep, sp=S.stats.spent;
      S.cash=Math.max(S.cash,nt.cost); S.rep=Math.max(S.rep,nt.rep);
      upgradeSpace();
      S.cash=c; S.rep=r; S.stats.spent=sp;       // free: put the money and reputation back
      commit("Floor expanded free to "+SIZE_TIERS[S.tier].name+" (rent "+rm(rent())+"/day).");
    },
    replayGeorge(){
      if(!ready()) return;
      delete S.events.george; georgeReset();
      commit("George's visit reset. He comes in around noon on day 1 — use 'Day 1, George replays', or 'George now' while open.");
    },
    georgeNow(){
      if(!ready()) return;
      if(S.phase!=="open"){ say("Open the shop first.",true); return; }
      if(GEO.p){ say("George is already in.",true); return; }
      closeModal(); georgeEnter(); say("George is coming in.");
    },
    resetMags(){ if(!ready()) return; S.mags=[]; commit("Magazine rack reset: this week's title goes up next time you open the rack."); },
    clearStamps(){ if(!ready()) return; S.stamps=[]; commit("Stamps cleared. Any milestone already reached is stamped again at the next check (a sale, an expansion, or opening the counter)."); },
    beans(n){ if(!ready()) return; if(!cafeTile()){ say("No Coffee Corner built.",true); return; } S.coffee.beans=Math.max(0,Math.round(n)); commit("Beans for "+S.coffee.beans+" cups."); },
    takings(v){ if(!ready()) return; S.totalRev=Math.max(0,Math.round(v*100)/100); commit("Lifetime takings set to "+rm(S.totalRev)+"."); },
    resetEvents(){ if(!ready()) return; S.events={}; georgeReset(); S.mags=[]; S.stamps=[]; commit("All one-off events, magazines and stamps reset."); },
    fillStock(n){
      if(!ready()) return;
      Object.keys(S.stock).forEach(id=>addCopies(+id,n)); restockShelves();
      commit("+"+n+" copies of every title in stock.");
    },
    customer(){
      if(!ready()) return;
      if(S.phase!=="open"){ say("Open the shop first.",true); return; }
      spawnCustomer(); say("A customer walks in.");
    },
    skipToClose(){
      if(!ready()) return;
      if(S.phase!=="open"){ say("The shop isn't open.",true); return; }
      S.spawnQueue=[]; S.tick=Math.max(S.tick,S.dayLen); say("Clock at closing time; the last customers are leaving.");
    },
    closeNow(){
      if(!ready()) return;
      if(S.phase!=="open"){ say("The shop isn't open.",true); return; }
      if(GEO.p && !S.events.george && S.day===1) S.events.george=true;  // he'd have been and gone
      clearTradingDay(); S.tick=S.dayLen; endDay(); status(); say("Shop closed instantly.");
    },
    speed(v){ window.DEV_SPEED=v; build(); say("Game speed "+v+"×."); },
    // the artifact viewer blocks confirm(), so the button asks for a second tap instead
    wipe(b){
      if(!b || b.dataset.armed!=="1"){
        if(b){ b.dataset.armed="1"; b.textContent="Tap again to wipe"; b.classList.add("on");
          setTimeout(()=>{ b.dataset.armed=""; b.textContent="Wipe dev save & reload"; b.classList.remove("on"); },4000); }
        say("Tap again within 4 seconds to wipe the dev save (your real game is not affected).",true); return;
      }
      clearSave(); location.reload();
    },
  };

  function status(){
    if(!statEl) return;
    if(titleOn()){ statEl.textContent="Title screen"; return; }
    const nt=nextTier();
    statEl.textContent=
      "Day "+S.day+" · "+S.phase+(S.phase==="open"?" · tick "+S.tick+"/"+S.dayLen:"")+"\n"+
      "Cash "+rm(S.cash)+" · Rep "+S.rep.toFixed(1)+" (lvl "+level()+")\n"+
      "Floor "+SIZE_TIERS[S.tier].name+(nt?" · next needs rep "+nt.rep+" + "+rm(nt.cost):"")+"\n"+
      "Events "+JSON.stringify(S.events)+" · mags "+S.mags.length+" · stamps "+(S.stamps||[]).join(",")+" · beans "+(S.coffee?S.coffee.beans:"-")+" · cup "+(S.coffee?rm(S.coffee.price):"-")+" · taken "+rm(S.totalRev||0);
  }

  function build(){
    P.innerHTML="";
    const B=(label,fn,cls)=>{ const b=h("button",{textContent:label}); if(cls) b.className=cls; b.onclick=fn; return b; };
    const I=(val)=>h("input",{type:"number",value:val});
    statEl=h("div",{className:"st"});
    P.appendChild(h("h3",{textContent:"State"})); P.appendChild(statEl);

    P.appendChild(h("h3",{textContent:"Day"}));
    const dIn=I(S.day+1);
    P.appendChild(h("div",{className:"row"},[dIn,B("Jump to day",()=>A.jump(num(dIn,S.day)))]));
    P.appendChild(h("div",{className:"row"},[B("Day 1, George replays",A.day1George),B("Next day (skip)",()=>A.jump(S.day+1))]));
    P.appendChild(h("div",{className:"hint",textContent:"Day 1: George ~noon · Day 2+: distributor's van each morning · orders arrive 2 mornings later."}));

    P.appendChild(h("h3",{textContent:"Bank balance"}));
    const cIn=I(Math.round(S.cash));
    P.appendChild(h("div",{className:"row"},[cIn,B("Set",()=>A.cash(num(cIn,S.cash))),
      B("+1,000",()=>A.addCash(1000)),B("+5,000",()=>A.addCash(5000)),B("−500",()=>A.addCash(-500))]));

    P.appendChild(h("h3",{textContent:"Reputation"}));
    const rIn=I(Math.round(S.rep));
    P.appendChild(h("div",{className:"row"},[rIn,B("Set",()=>A.rep(num(rIn,S.rep))),
      B("15",()=>A.rep(15)),B("18",()=>A.rep(18)),B("30",()=>A.rep(30)),B("45",()=>A.rep(45)),B("100",()=>A.rep(100))]));
    P.appendChild(h("div",{className:"hint",textContent:"Level 2 at 18 · level 3 (Coffee Corner) at 45 · floor expansions need 15 / 30."}));

    P.appendChild(h("h3",{textContent:"Floor"}));
    P.appendChild(h("div",{className:"row"},[B("Expand floor (free)",A.expand),B("+3 copies of everything",()=>A.fillStock(3))]));

    P.appendChild(h("h3",{textContent:"Events"}));
    P.appendChild(h("div",{className:"row"},[B("Reset George",A.replayGeorge),B("George now",A.georgeNow),
      B("Reset magazine rack",A.resetMags),B("Clear stamps",A.clearStamps),B("Reset all",A.resetEvents)]));
    P.appendChild(h("h3",{textContent:"Coffee Corner & stamps"}));
    P.appendChild(h("div",{className:"row"},[B("Beans: 0",()=>A.beans(0)),B("Beans: 20",()=>A.beans(20)),B("Beans: 200",()=>A.beans(200)),
      B("Takings $9,990",()=>A.takings(9990)),B("Takings $0",()=>A.takings(0))]));
    P.appendChild(h("div",{className:"hint",textContent:"Stamps: Extended Shop, Double Shopfront, Coffee Corner, $10,000 taken. Beans run the corner; set takings just under $10,000 and sell one book to see that stamp land."}));

    P.appendChild(h("h3",{textContent:"Trading day"}));
    P.appendChild(h("div",{className:"row"},[B("Customer now",A.customer),B("Skip to closing",A.skipToClose),B("Close instantly",A.closeNow)]));
    P.appendChild(h("div",{className:"row"},["Speed ",...[1,2,4].map(v=>B(v+"×",()=>A.speed(v),window.DEV_SPEED===v?"on":""))]));

    P.appendChild(h("h3",{textContent:"Save"}));
    P.appendChild(h("div",{className:"row"},[B("Wipe dev save & reload",e=>A.wipe(e.currentTarget))]));
    P.appendChild(h("div",{className:"hint",textContent:"This copy keeps its own save, separate from the real game."}));

    msgEl=h("div",{className:"msg"}); P.appendChild(msgEl);
    status();
  }

  btn.onclick=e=>{ e.stopPropagation(); P.classList.toggle("on"); if(P.classList.contains("on")) build(); };
  setInterval(()=>{ if(P.classList.contains("on")) status(); },400);
  window.DEV=A;                              // handy from the console too
})();
