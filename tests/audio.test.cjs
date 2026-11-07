// Audio lifecycle and scheduling checks: node tests/audio.test.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let intervals=new Set(),sources=[];
class Param {
  constructor(){this.value=0;}
  setValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t));}
  linearRampToValueAtTime(v,t){this.setValueAtTime(v,t);}
  exponentialRampToValueAtTime(v,t){assert.ok(v>0);this.setValueAtTime(v,t);}
  cancelScheduledValues(){}
  setTargetAtTime(v,t,k){assert.ok(k>0);this.setValueAtTime(v,t);}
}
function node(){return {gain:new Param(),frequency:new Param(),pan:new Param(),threshold:new Param(),knee:new Param(),ratio:new Param(),attack:new Param(),release:new Param(),connect(){},disconnect(){}};}
class AudioContext {
  constructor(){this.currentTime=0;this.sampleRate=8000;this.state='running';this.destination=node();}
  createGain(){return node();}createDynamicsCompressor(){return node();}createStereoPanner(){return node();}createBiquadFilter(){return node();}
  createBuffer(channels,length){return{getChannelData:()=>new Float32Array(length)};}
  createOscillator(){const n={...node(),start(t){assert.ok(t>=0);},stop(t){assert.ok(t>=0);this.stopped=t;}};sources.push(n);return n;}
  createBufferSource(){return this.createOscillator();}
  resume(){return Promise.resolve();}
}
const context=vm.createContext({window:{AudioContext},setInterval(fn){intervals.add(fn);return fn;},clearInterval(fn){intervals.delete(fn);}});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../audio.js'),'utf8'),context);
const run=code=>vm.runInContext(code,context);
(async()=>{
  run('var audio=new MoonbeamAudio();audio.effect("shoot");');assert.equal(sources.length,0,'Off by default');
  assert.equal(run('audio.setEnabled(true)'),true);await Promise.resolve();assert.equal(intervals.size,1);
  for(const scene of ['title','playing','party']){
    for(const level of [1,7]){
      run(`audio.setScene('${scene}',${level})`);
      for(let i=0;i<160;i++){
        run('audio.context.currentTime+=.1;audio.schedule()');
        // Simulate the browser's ended events to release expired nodes.
        for(const s of sources)if(s.stopped<=run('audio.context.currentTime')&&s.onended){s.onended();s.onended=null;}
      }
      assert.ok(run('audio.step')>64,'Score advances through phrases');assert.equal(intervals.size,1,'Single scheduler');
    }
  }
  for(const name of ['shoot','hit','defeat','bossDefeat','hurt','thunder','clear','room','upgrade','party','pie','jump','land','glitter']){
    const before=sources.length;run(`audio.effect('${name}')`);assert.ok(sources.length>before,name+' makes sound');
    const after=sources.length;run(`audio.effect('${name}')`);assert.equal(sources.length,after,'Repeated effects are throttled');
    run('audio.context.currentTime+=1');for(const s of sources)if(s.onended){s.onended();s.onended=null;}
  }
  run('audio.setScene("paused")');assert.equal(intervals.size,0);let count=sources.length;
  run('audio.effect("pie")');assert.equal(sources.length,count,'Pause silences effects');
  run('audio.setScene("party")');assert.equal(intervals.size,1);
  run('audio.setEnabled(false)');assert.equal(intervals.size,0);count=sources.length;
  run('audio.schedule();audio.effect("shoot")');assert.equal(sources.length,count,'Mute prevents new audio');
  run('audio.setEnabled(true);audio.setEnabled(false)');await Promise.resolve();assert.equal(intervals.size,0,'Rapid toggle cannot restart muted music');
  const unsupported=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../audio.js'),'utf8'),unsupported);
  assert.equal(vm.runInContext('new MoonbeamAudio().setEnabled(true)',unsupported),false);
  console.log('PASS: all score arrangements, effect palette, finite envelopes, throttling, voice cleanup, pause/resume, mute, rapid toggles, unsupported audio.');
})().catch(error=>{console.error(error);process.exitCode=1;});
