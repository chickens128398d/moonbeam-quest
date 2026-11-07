// Dependency-free simulation: node tests/game.test.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
function element(selector) {
  if (!elements.has(selector)) elements.set(selector, {style:{},classList:{add(){},remove(){},toggle(){}},listeners:{},addEventListener(name,fn){this.listeners[name]=fn},setPointerCapture(){},setAttribute(){},getBoundingClientRect(){return{left:0,top:0,width:100,height:100}},dataset:{},clientWidth:480,clientHeight:300,open:false});
  return elements.get(selector);
}
const drawing = new Proxy({}, {get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):key==='arc'?(_x,_y,r)=>assert.ok(r>=0,'Canvas arc radius'):()=>{}});
element('#game').getContext = ()=>drawing;
const saved = new Map();
const context = vm.createContext({console,Math,Set,setTimeout(){},requestAnimationFrame(){},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},matchMedia:()=>({matches:false}),window:{addEventListener(){}},document:{body:element('body'),querySelector:element,querySelectorAll:()=>[],addEventListener(){}}});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../audio.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8'),context);
function run(code){return vm.runInContext(code,context)}
function reachable() { return run(`(()=>{let seen=new Set(),q=[cellAt(player.x,player.y)];for(let i=0;i<q.length;i++){let c=q[i],k=c.x+','+c.y;if(seen.has(k))continue;seen.add(k);for(let [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(openCell(c.x+dx,c.y+dy)&&!seen.has((c.x+dx)+','+(c.y+dy)))q.push({x:c.x+dx,y:c.y+dy})}return {exit:seen.has((cols-1)+','+entranceRow()),enemies:enemies.every(e=>{let c=cellAt(e.x,e.y);return seen.has(c.x+','+c.y)})}})()`)}
run('startGame()');
assert.equal(run('state'),'playing');assert.equal(run('enemies.length'),6);
assert.ok(run('bounds().w>W && bounds().h>H'),'World extends beyond viewport');
const initialX=run('player.x');run("keys.add('d');update(.1);keys.clear()");assert.ok(run('player.x')>initialX);
run('hurtTime=0;damage(3);damage(3)');assert.equal(run('health'),97,'Invulnerability');
run('pause()');const paused=run('JSON.stringify(player)');run("keys.add('d');update(.1);keys.clear()");assert.equal(run('JSON.stringify(player)'),paused);run('pause()');
for(let room=1;room<=7;room++){
  assert.equal(run('level'),room);if(room>1)assert.equal(run('health'),100);
  assert.equal(run('blocked(player.x,player.y)'),false);
  assert.ok(reachable().exit);assert.ok(reachable().enemies);
  assert.equal(run('maze.flat().some(Boolean)'),room!==7);
  assert.equal(run('powers[weapon].damage'),room>=5?10:room>=3?5:3);
  assert.equal(run('enemies.length'),room===7?1:room+5);
  // Fight each storm using actual shots in its reachable corridor.
  let enemies=run('enemies.length');
  while(enemies){
    run('player.x=enemies[0].x-(enemies[0].boss?65:0);player.y=enemies[0].y;shooting=true');
    let frames=0;
    while(run('enemies.length')===enemies&&frames++<1000)run('hurtTime=999;update(1/60)');
    assert.ok(frames<1000,`Room ${room}: projectiles defeat a storm`);enemies=run('enemies.length');
  }
  run('shooting=false');assert.equal(run('roomsBeaten'),room);
  if(room<7){
    assert.equal(run('doorOpen'),true);
    run('player={...cellCenter(0,entranceRow()),face:1}');
    let walking=0;
    while(run('player.x<bounds().w-24')&&walking++<18000)run('{let target=nextStep(player,cellCenter(cols-1,entranceRow())),d=Math.hypot(target.x-player.x,target.y-player.y),step=Math.min(3,d);if(d)moveEntity(player,(target.x-player.x)/d*step,(target.y-player.y)/d*step)}');
    assert.ok(walking<18000,'Exit reachable on foot');assert.equal(run('blocked(player.x,player.y)'),false);
    run('health=42;update(1/60)');
  }else{assert.ok(run('pie'));run('player.x=pie.x;player.y=pie.y;update(1/60)');assert.equal(run('state'),'party')}
}
run("keys.add(' ');for(let i=0;i<90;i++)update(1/60)");assert.ok(run('flight')>50,'Space flies');assert.ok(run('particles.length')>0,'Flying poops glitter');
run("keys.clear();for(let i=0;i<180;i++)update(1/60)");assert.equal(run('flight'),0,'Release lands');
run('player.x=100;player.y=340;partyTime=0;update(.1)');assert.equal(run('partyPies'),1);run('partyTime=0;update(.1)');assert.equal(run('partyPies'),2,'Endless pie');
run('pause();update(.1)');assert.equal(run('state'),'paused');run('pause()');assert.equal(run('state'),'party','Party pause resumes party');run('render()');
run('startGame();roomsBeaten=3;hurtTime=0;damage(100)');assert.equal(run('state'),'lost');assert.match(element('#message-title').textContent,/GOOD JOB/);assert.match(element('#message-copy').textContent,/3 of 7/);assert.equal(saved.get('moonbeam-best'),7);
run('startGame()');assert.equal(run('roomsBeaten'),0);assert.equal(run('weapon'),0);assert.equal(run('health'),100);
const layouts=new Set();
for(let i=0;i<12;i++) {run('startGame()');layouts.add(run('JSON.stringify(maze)'));assert.ok(reachable().exit);assert.ok(reachable().enemies);assert.ok(run('enemies.every(e=>!blocked(e.x,e.y))'));}
assert.ok(layouts.size>1);
run('player={...cellCenter(cols-2,rows-2),face:1};discover();updateCamera(true)');assert.ok(run('camera.x>0&&camera.y>0'));assert.ok(run('explored.size')>28);
const oldPosition=run('JSON.stringify(player)');element('.canvas-wrap').clientWidth=800;element('.canvas-wrap').clientHeight=320;run('resize()');assert.equal(run('JSON.stringify(player)'),oldPosition,'Rotation preserves world position');
const stick=element('#joystick');stick.listeners.pointerdown({pointerId:1,clientX:90,clientY:50,preventDefault(){}});assert.ok(run('joystick.x')>.9);stick.listeners.pointercancel({pointerId:1});assert.equal(run('joystick.x'),0);
run('enterParty()');element('#shoot').listeners.pointerdown({pointerId:2,preventDefault(){},target:{closest(){return element('#shoot')}}});run('update(.3)');assert.ok(run('flight')>0,'Mobile button flies');element('#shoot').listeners.pointerup();assert.equal(run('shooting'),false);
run('flight=0;flightVelocity=0;jump();update(.04)');assert.ok(run('flight')>2,'Tap gives a real jump');
run('render();startGame();render();showMessage("lost");render()');
console.log('PASS: 7-room combat, connected large mazes, scrolling camera, exploration, rotation, upgrades, damage, room counts, best score, party transition, endless pie, flight, glitter, joystick, mobile fly, pause, replay, rendering.');
