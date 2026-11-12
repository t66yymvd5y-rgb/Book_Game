/* ============================================================
   Corner Books — developer panel (dev build only)
   Built into dev.html by dev/build.sh; never loaded by index.html.
   It runs after the game's own script, so it reaches the game's globals
   (S, GEO, paint, hud, autosave, …) directly and changes nothing about how
   the game itself plays. It also holds the map editor (see below).
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
    resetEvents(){ if(!ready()) return; S.events={}; georgeReset(); S.mags=[]; S.stamps=[]; S.rare={next:2,asked:[],list:[]}; rareReset(); commit("All one-off events, magazines, stamps and collectors' requests reset."); },
    collectorNow(){
      if(!ready()) return;
      if(S.phase!=="open"){ say("Open the shop first.",true); return; }
      if(RQ.p){ say("A collector is already in.",true); return; }
      if(!rarePick()){ say("Every rare set already has an open request.",true); return; }
      closeModal(); RQ.at=S.tick; say("A collector is on the way to the counter.");
    },
    resetRequests(){ if(!ready()) return; S.rare={next:2,asked:[],list:[]}; rareReset(); commit("Collectors' requests reset: the next visit is Churchill's set, after noon on the next trading day from day 2."); },
    rareInStock(){
      if(!ready()) return;
      const r=S.rare.list[0]; const id=r?r.id:RARE_BOOKS[0].id;
      if(!hasSlotFor(id)){ say("No shelf space for it.",true); return; }
      addCopies(id,1); restockShelves(); commit(BOOK(id).title+" put on the shelf"+(r?" — call "+COLLECTOR(r.who).name+" from the Requests list.":"."));
    },
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

  /* ---------- map editor ----------
     Lay the floor out directly: add any piece free of charge and level, pick pieces up and put them
     down, remove them, and copy or paste the whole layout as JSON. The floor is S.grid (one tile
     type per cell); shelves and tables carry their books in S.slots keyed by tile; the information
     counter, the record corner and the cafe table span several tiles in a row from a left-hand
     anchor; the keeper's spot is S.keeper. Walls and the door are the border and stay as they are. */
  const PIECES=[
    {t:SHELF,   name:"Shelf",          tiles:[SHELF], slots:true},
    {t:TABLE,   name:"Display Table",  tiles:[TABLE], slots:true},
    {t:PLANT,   name:"Potted Palm",    tiles:[PLANT]},
    {t:ARMCHAIR,name:"Armchair",       tiles:[ARMCHAIR]},
    {t:CAFE,    name:"Coffee Corner",  tiles:[CAFE], one:true},
    {t:SEAT_L,  name:"Cafe Table",     tiles:[SEAT_L,SEAT_T,SEAT_R]},
    {t:COUNTER, name:"Counter",        tiles:[COUNTER], one:true, keep:true},
    {t:INFO,    name:"Info Counter",   tiles:[INFO,INFO_R], one:true, auto:true},
    {t:RACK,    name:"Magazine Rack",  tiles:[RACK], one:true, auto:true},
    {t:VINYL,   name:"Record Corner",  tiles:[VINYL,VINYL_R], one:true, auto:true},
    {t:CAT,     name:"Cat Cushion",    tiles:[CAT], one:true, keep:true},
  ];
  const PIECE_BY_TILE={}; PIECES.forEach(p=>p.tiles.forEach((t,i)=>PIECE_BY_TILE[t]={p,i}));
  const KNOWN_TILES=new Set([EMPTY,WALL,DOOR].concat(PIECES.flatMap(p=>p.tiles)));
  const ED={on:false, tool:"move", sel:null};      // tool: "move" | "erase" | "keeper" | a piece; sel: {p,x,y} | {keeper:true}

  const edCss=`
  #devEd{position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#1e1f24;color:#eee;border-top:2px solid #c0392b;
    padding:6px 10px 8px;font:13px/1.35 system-ui,sans-serif;box-shadow:0 -4px 18px rgba(0,0,0,.5);display:none}
  #devEd.on{display:block}
  #devEd .hdr{font:700 10px/1 system-ui,sans-serif;letter-spacing:.08em;color:#f5a99f;margin-bottom:5px}
  #devEd .strip{display:flex;gap:6px;align-items:center;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin}
  #devEd .hint{color:#aaa;font-size:11px;margin-top:2px}
  #devEd button{flex:none;padding:5px 8px;border-radius:4px;border:1px solid #666;background:#3a3d45;color:#fff;font:inherit;cursor:pointer}
  #devEd button:hover{background:#4a4e58}
  #devEd button.on{background:#c0392b;border-color:#e67e73}
  #devEd button.done{background:#2e7d4f;border-color:#5cb882}
  #devEd .sep{flex:none;width:1px;background:#555;margin:0 2px}
  #devEd textarea{width:100%;height:72px;box-sizing:border-box;margin-top:4px;padding:5px 6px;border-radius:4px;border:1px solid #555;
    background:#2b2d33;color:#fff;font:11px/1.3 ui-monospace,monospace;display:none;resize:vertical}
  #devEd textarea.on{display:block}
  #devEd .msg{min-height:1.2em;color:#9fe0a8;font-size:12px;margin-top:4px}
  #devEd .msg.bad{color:#f5a99f}`;
  const edStyle=document.createElement("style"); edStyle.textContent=edCss; document.head.appendChild(edStyle);
  const E=document.createElement("div"); E.id="devEd"; document.body.appendChild(E);
  ["keydown","keyup","keypress","pointerdown","click"].forEach(t=>E.addEventListener(t,e=>e.stopPropagation()));
  let edMsg=null, edTA=null;
  function edSay(t,bad){ if(edMsg){ edMsg.textContent=t; edMsg.className="msg"+(bad?" bad":""); } }

  const inside=(x,y)=>x>=1&&x<=GW-2&&y>=1&&y<=GH-2;
  const entrance=(x,y)=>x===doorX()&&y===GH-2;             // the tile inside the door: customers come in here
  function pieceAt(x,y){ const m=PIECE_BY_TILE[S.grid[y]&&S.grid[y][x]]; return m?{p:m.p,x:x-m.i,y}:null; }
  function partOf(s,x,y){ return !!s&&!s.keeper&&s.y===y&&x>=s.x&&x<s.x+s.p.tiles.length; }
  // a piece laid left to right from (x,y): every tile inside the walls, clear (or part of the piece being moved),
  // not the keeper's spot and not the doorway
  function fits(p,x,y,self){
    return p.tiles.every((t,i)=>{ const tx=x+i;
      return inside(tx,y)&&!entrance(tx,y)&&!isKeeperTile(tx,y)&&(S.grid[y][tx]===EMPTY||partOf(self,tx,y)); });
  }
  function keeperFits(x,y){ return inside(x,y)&&!entrance(x,y)&&S.grid[y][x]===EMPTY; }
  function clearPiece(s){ s.p.tiles.forEach((t,i)=>{ S.grid[s.y][s.x+i]=EMPTY; delete S.slots[key(s.x+i,s.y)]; }); }
  function putPiece(p,x,y,books){ p.tiles.forEach((t,i)=>{ S.grid[y][x+i]=t; if(p.slots) S.slots[key(x+i,y)]=books||[]; }); }
  function movePiece(s,x,y){ const books=s.p.slots?(S.slots[key(s.x,s.y)]||[]):null; clearPiece(s); putPiece(s.p,x,y,books); }
  // after every change: books back on shelves, the cat and the keeper on their spots, redraw, save
  function afterEdit(t){
    t+=gameRules();
    restockShelves(); catGoHome(); keeperHome();
    hud(); paint(); autosave();
    const shelved=new Set(shelvedIds()), un=stockedIds().filter(id=>!shelved.has(id)).length;
    edSay(t+(un?" "+un+" title"+(un>1?"s":"")+" in stock with no shelf space.":""));
  }
  // The game applies these when a save loads: a shop always has an information counter, a magazine
  // rack and a record corner (put by the door if missing), and a Coffee Corner moves in beside the
  // counter when there is room. Doing the same here shows the layout as the save will keep it.
  function gameRules(){
    const at=t=>JSON.stringify(tilesOf(t)), was={[INFO]:at(INFO),[RACK]:at(RACK),[VINYL]:at(VINYL),[CAFE]:at(CAFE)};
    placeInfoDesk(false); placeRack(false); placeRecordCorner(false); placeCafe();
    const notes=[];
    [[INFO,"Info Counter"],[RACK,"Magazine Rack"],[VINYL,"Record Corner"]].forEach(([t,n])=>{ if(was[t]!==at(t)) notes.push(was[t]==="[]"?"the game put a "+n+" back by the door":"the game moved the "+n); });
    if(was[CAFE]!==at(CAFE)) notes.push("the game moved the Coffee Corner in beside the counter");
    return notes.length?" ("+notes.join("; ")+", as it does whenever the save loads.)":"";
  }
  function hintFor(tool){
    if(tool==="move") return "Tap a piece to pick it up, then tap where it goes. Shelves and tables keep their books.";
    if(tool==="erase") return "Tap a piece to remove it. The counter and the cat's cushion can only be moved; the game insists on an info counter, a rack and a record corner.";
    if(tool==="keeper") return "Tap a clear floor tile: that is where you stand (the blue dot).";
    return "Tap a marked tile to place a "+tool.name+"."+(tool.tiles.length>1?" It takes "+tool.tiles.length+" tiles in a row, from the one you tap.":"")
      +(tool.one?" There is only one, so this moves it if the shop already has one.":"");
  }
  function edTap(x,y){
    if(!S.grid[y]||S.grid[y][x]==null) return;
    const here=pieceAt(x,y), tool=ED.tool;
    if(tool==="erase"){
      if(!here){ edSay(isKeeperTile(x,y)?"The keeper's spot can be moved, not removed.":"Nothing there to remove.",true); return; }
      if(here.p.keep){ edSay("The game needs its "+here.p.name+". Move it instead.",true); return; }
      clearPiece(here); ED.sel=null;
      afterEdit(here.p.name+" removed.");
      return;
    }
    if(tool==="keeper"){
      if(!keeperFits(x,y)){ edSay("The keeper needs a clear floor tile.",true); return; }
      S.keeper=[x,y]; afterEdit("Keeper's spot moved."); return;
    }
    if(tool==="move"){
      const s=ED.sel;
      if(s&&s.keeper&&keeperFits(x,y)){ S.keeper=[x,y]; ED.sel=null; afterEdit("Keeper's spot moved."); return; }
      if(s&&partOf(s,x,y)){ ED.sel=null; edSay("Put back down."); return; }
      if(s&&!s.keeper&&fits(s.p,x,y,s)){ movePiece(s,x,y); ED.sel=null; afterEdit(s.p.name+" moved."); return; }
      if(here){ ED.sel=here; edSay(here.p.name+" picked up: tap where it goes"+(here.p.tiles.length>1?" (its left tile)":"")+"."); return; }
      if(isKeeperTile(x,y)){ ED.sel={keeper:true}; edSay("Keeper's spot picked up: tap a clear tile."); return; }
      edSay(s?"Doesn't fit there.":"Nothing there. Tap a piece to pick it up.",true);
      return;
    }
    const p=tool;                                           // a piece from the palette
    if(p.one){
      const ex=tilesOf(p.t)[0];
      if(ex){ const s={p,x:ex[0],y:ex[1]};
        if(fits(p,x,y,s)){ movePiece(s,x,y); afterEdit("There is only one "+p.name+", so it moved."); } else edSay("Doesn't fit there.",true);
        return; }
    }
    if(!fits(p,x,y,null)){ edSay(p.name+" doesn't fit there"+(p.tiles.length>1?": it needs "+p.tiles.length+" clear tiles in a row from the one you tap":"")+".",true); return; }
    putPiece(p,x,y,[]); afterEdit(p.name+" placed.");
  }

  // drawn over the game's own frame while the editor is open
  function edOverlay(){
    const g=ctx; g.save();
    g.fillStyle="rgba(255,255,255,.28)";
    for(let x=1;x<GW;x++) g.fillRect(x*TS,0,1,GH*TS);
    for(let y=1;y<GH;y++) g.fillRect(0,y*TS,GW*TS,1);
    const on=(ANIM>>3)&1, tool=ED.tool, s=ED.sel;
    let p=null, self=null;
    if(tool==="move"&&s&&!s.keeper){ p=s.p; self=s; } else if(tool!=="move"&&tool!=="erase"&&tool!=="keeper") p=tool;
    const kp=tool==="keeper"||(tool==="move"&&s&&s.keeper);
    if(p||kp){
      g.fillStyle=on?"rgba(255,200,60,.9)":"rgba(255,200,60,.5)";
      for(let y=1;y<GH-1;y++) for(let x=1;x<GW-1;x++) if(kp?keeperFits(x,y):fits(p,x,y,self)) g.fillRect(x*TS+6,y*TS+6,4,4);
    }
    if(s){
      let x,y,w; if(s.keeper){ [x,y]=S.keeper; w=1; } else { x=s.x; y=s.y; w=s.p.tiles.length; }
      g.strokeStyle=on?"#ff5a3c":"#ffd36b"; g.lineWidth=1; g.strokeRect(x*TS+.5,y*TS+.5,w*TS-1,TS-1);
    }
    if(S.keeper){ g.fillStyle="rgba(70,150,255,.95)"; g.fillRect(S.keeper[0]*TS+1,S.keeper[1]*TS+1,3,3); }
    g.fillStyle="rgba(255,80,80,.22)"; g.fillRect(doorX()*TS,(GH-2)*TS,TS,TS);   // the doorway stays clear
    g.restore();
  }
  const gameRender=render;
  window.render=function(){ gameRender(); if(ED.on){ try{ edOverlay(); }catch(e){} } };
  // taps on the floor go to the editor, not the game, while it is open (capture on the stage, above the canvas)
  cv.parentElement.addEventListener("click",e=>{
    if(!ED.on) return;
    e.stopPropagation(); e.preventDefault();
    const r=cv.getBoundingClientRect();
    edTap(Math.floor((e.clientX-r.left)/r.width*GW), Math.floor((e.clientY-r.top)/r.height*GH));
  },true);

  // the layout as text: size, tier, keeper's spot and the grid, one row per line of tile numbers
  function layoutJSON(){
    return JSON.stringify({gw:GW,gh:GH,tier:S.tier,keeper:S.keeper,grid:S.grid.map(r=>r.join(" "))},null,1).replace(/\n\s*/g," ");
  }
  function applyLayout(d){
    if(!d||!Array.isArray(d.grid)||!d.grid.length) return "No grid in that layout.";
    const rows=d.grid.map(r=>typeof r==="string"?r.trim().split(/[\s,]+/).map(Number):Array.isArray(r)?r.map(Number):[]);
    const gh=rows.length, gw=rows[0].length;
    const ti=SIZE_TIERS.findIndex(t=>t.gw===gw&&t.gh===gh);
    if(ti<0) return "That grid is "+gw+"×"+gh+"; the floors are "+SIZE_TIERS.map(t=>t.gw+"×"+t.gh).join(", ")+".";
    if(rows.some(r=>r.length!==gw||r.some(v=>!KNOWN_TILES.has(v)))) return "The grid has a ragged row or an unknown tile number.";
    GW=gw; GH=gh; S.tier=ti;
    const dx=doorX();
    S.grid=rows.map((r,y)=>r.map((v,x)=>{
      if(y===0||x===0||x===GW-1||y===GH-1) return (y===GH-1&&x===dx)?DOOR:WALL;   // the border is always wall and door
      return (v===WALL||v===DOOR||(x===dx&&y===GH-2))?EMPTY:v; }));
    // a piece that spans several tiles must be whole; a stray part becomes floor
    const src=S.grid.map(r=>r.slice());
    for(let y=1;y<GH-1;y++) for(let x=1;x<GW-1;x++){ const m=PIECE_BY_TILE[src[y][x]]; if(!m) continue;
      const ax=x-m.i; if(!m.p.tiles.every((t,j)=>src[y][ax+j]===t)) S.grid[y][x]=EMPTY; }
    // one of each where the game expects one: keep the first, the rest become floor
    PIECES.filter(p=>p.one).forEach(p=>tilesOf(p.t).slice(1).forEach(([x,y])=>clearPiece({p,x,y})));
    S.keeper=null;
    const k=Array.isArray(d.keeper)?[d.keeper[0]|0,d.keeper[1]|0]:null;
    if(k&&keeperFits(k[0],k[1])) S.keeper=k;
    else {                                                  // behind the counter if clear, else beside it, else anywhere
      const c=tilesOf(COUNTER)[0], cand=c?[[c[0],c[1]-1],[c[0]-1,c[1]],[c[0]+1,c[1]]]:[];
      let spot=cand.find(([x,y])=>keeperFits(x,y));
      if(!spot) for(let y=1;y<GH-1&&!spot;y++) for(let x=1;x<GW-1&&!spot;x++) if(keeperFits(x,y)) spot=[x,y];
      S.keeper=spot||[dx,1];
    }
    Object.keys(S.slots).forEach(k2=>{ const [x,y]=k2.split(",").map(Number); const t=S.grid[y]&&S.grid[y][x]; if(t!==SHELF&&t!==TABLE) delete S.slots[k2]; });
    resizeStage(); return null;
  }
  function edCopy(){
    const j=layoutJSON(); edTA.value=j; edTA.classList.add("on");
    if(navigator.clipboard&&navigator.clipboard.writeText)
      navigator.clipboard.writeText(j).then(()=>edSay("Layout copied to the clipboard, and shown below."),()=>edSay("The clipboard is blocked here: copy the text below."));
    else edSay("Copy the text below.");
  }
  function edLoad(){
    edTA.classList.add("on");
    let d; try{ d=JSON.parse(edTA.value); }catch(e){ edSay("That isn't valid JSON. Paste a layout into the box, then tap Load.",true); return; }
    const err=applyLayout(d); if(err){ edSay(err,true); return; }
    ED.sel=null; afterEdit("Layout loaded: "+SIZE_TIERS[S.tier].name+".");
  }
  function edReset(){ initGrid(false); ED.sel=null; afterEdit("Grandfather's layout restored; the books are reshelved."); }

  function edBuild(){
    E.innerHTML="";
    const B=(label,fn,cls)=>{ const b=h("button",{textContent:label}); if(cls) b.className=cls; b.onclick=fn; return b; };
    const pick=t=>{ ED.tool=t; ED.sel=null; edBuild(); edSay(hintFor(t)); };
    const s1=h("div",{className:"strip"},[
      B("Done",edOff,"done"), h("span",{className:"sep"}),
      B("Move",()=>pick("move"),ED.tool==="move"?"on":""), B("Erase",()=>pick("erase"),ED.tool==="erase"?"on":""),
      B("Keeper spot",()=>pick("keeper"),ED.tool==="keeper"?"on":""), h("span",{className:"sep"})]);
    PIECES.forEach(p=>s1.appendChild(B("+ "+p.name,()=>pick(p),ED.tool===p?"on":"")));
    const s2=h("div",{className:"strip"},[B("Grandfather's layout",edReset),B("Copy layout",edCopy),B("Load layout",edLoad)]);
    const hint=h("div",{className:"hint",textContent:"Free, any level; pieces stay inside the walls and never overlap. Saved to the dev save only."});
    edTA=h("textarea",{spellcheck:false,placeholder:"Copy layout puts the JSON here. Paste a layout here and tap Load layout to use it."});
    edMsg=h("div",{className:"msg"});
    [h("div",{className:"hdr",textContent:"MAP EDITOR"}),s1,s2,hint,edTA,edMsg].forEach(n=>E.appendChild(n));
  }
  function edOn(){
    if(!ready()) return;
    if(S.phase==="open"){ say("Close the shop first ('Close instantly'), then open the map editor.",true); return; }
    S.placing=null; closeModal();
    ED.on=true; ED.tool="move"; ED.sel=null;
    P.classList.remove("on"); btn.style.display="none"; E.classList.add("on");
    edBuild(); edSay(hintFor("move")); paint();
  }
  function edOff(){ if(!ED.on) return; ED.on=false; ED.sel=null; E.classList.remove("on"); btn.style.display=""; try{ paint(); }catch(e){} }
  A.editor=edOn; A.editorOff=edOff; A.layout=layoutJSON; A.loadLayout=d=>{ const err=applyLayout(typeof d==="string"?JSON.parse(d):d); if(err) throw new Error(err); afterEdit("Layout loaded."); };

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
    P.appendChild(h("div",{className:"row"},[B("Map editor…",edOn)]));
    P.appendChild(h("div",{className:"hint",textContent:"Add, move and remove shelves, tables and every other piece free; copy or paste a layout as JSON. Morning or evening only."}));

    P.appendChild(h("h3",{textContent:"Events"}));
    P.appendChild(h("div",{className:"row"},[B("Reset George",A.replayGeorge),B("George now",A.georgeNow),
      B("Reset magazine rack",A.resetMags),B("Clear stamps",A.clearStamps),B("Reset all",A.resetEvents)]));
    P.appendChild(h("h3",{textContent:"Collectors' requests"}));
    P.appendChild(h("div",{className:"row"},[B("Collector now",A.collectorNow),B("Requested set on shelf",A.rareInStock),B("Reset requests",A.resetRequests)]));
    P.appendChild(h("div",{className:"hint",textContent:"From day 2, after noon, every 2–3 days: a collector asks for a rare set and names a price. Churchill's Second World War first. Promise it and the van brings it within 3 days; once shelved, Call brings them back to buy."}));
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
  setInterval(()=>{ if(P.classList.contains("on")) status(); if(ED.on&&(titleOn()||S.phase==="open")) edOff(); },400);
  window.DEV=A;                              // handy from the console too
})();
