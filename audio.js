'use strict';
// Original procedural score and effects. No samples, network requests, or assets.
class MoonbeamAudio {
  constructor() {
    this.context=null;this.enabled=false;this.scene='title';this.level=1;
    this.voices=new Set();this.timer=null;this.step=0;this.nextBeat=0;this.lastEffects=new Map();
  }
  init() {
    if(this.context)return true;
    try {
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return false;
      const c=this.context=new Audio();
      this.master=c.createGain();this.master.gain.value=0;
      this.music=c.createGain();this.music.gain.value=.36;
      this.fx=c.createGain();this.fx.gain.value=.65;
      const limiter=c.createDynamicsCompressor();
      limiter.threshold.value=-14;limiter.knee.value=14;limiter.ratio.value=8;
      limiter.attack.value=.004;limiter.release.value=.18;
      this.music.connect(this.master);this.fx.connect(this.master);this.master.connect(limiter);limiter.connect(c.destination);
      this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);
      const data=this.noise.getChannelData(0);
      // Seeded noise makes the sound palette reproducible.
      let seed=4321;for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/2147483647)*2-1;}
      return true;
    }catch{this.context=null;return false;}
  }
  setEnabled(value) {
    if(!value){this.enabled=false;this.stop();return false;}
    if(!this.init())return false;
    this.enabled=true;
    // Called directly by the sound button, inside the browser's user gesture.
    this.context.resume().then(()=>{if(this.enabled)this.start();}).catch(()=>{this.enabled=false;this.stop();});
    return true;
  }
  setScene(scene,level=1) {
    if(this.scene===scene&&this.level===level)return;
    this.scene=scene;this.level=level;this.stop();
    if(this.enabled)this.start();
  }
  stop() {
    if(this.timer!==null){clearInterval(this.timer);this.timer=null;}
    if(!this.context)return;
    const t=this.context.currentTime;
    this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(0,t,.012);
    for(const voice of this.voices){try{voice.stop(t+.055);}catch{}}
    this.lastEffects.clear();
  }
  start() {
    if(!this.enabled||!this.context||this.context.state!=='running'||this.scene==='paused'||this.scene==='lost')return;
    if(this.timer!==null)return;
    const t=this.context.currentTime;
    this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(.7,t,.04);
    this.step=0;this.nextBeat=t+.075;this.schedule();
    this.timer=setInterval(()=>this.schedule(),25);
  }
  note(midi){return 440*2**((midi-69)/12);}
  voice(freq,time,duration,volume=.1,type='sine',bus=this.music,pan=0,endFreq=null) {
    if(!this.enabled||this.voices.size>=80)return;
    const c=this.context,source=type==='noise'?c.createBufferSource():c.createOscillator(),gain=c.createGain();
    const nodes=[source,gain];
    if(type==='noise'){
      source.buffer=this.noise;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(freq,time);
      if(endFreq)filter.frequency.exponentialRampToValueAtTime(endFreq,time+duration);
      source.connect(filter);filter.connect(gain);nodes.push(filter);
    }else{
      source.type=type;source.frequency.setValueAtTime(freq,time);
      if(endFreq)source.frequency.exponentialRampToValueAtTime(endFreq,time+duration);
      source.connect(gain);
    }
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.009);
    gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=pan;gain.connect(p);p.connect(bus);nodes.push(p);}else gain.connect(bus);
    this.voices.add(source);source.onended=()=>{this.voices.delete(source);nodes.forEach(n=>n.disconnect());};
    source.start(time);source.stop(time+duration+.02);
  }
  bell(midi,t,length=.5,volume=.1,pan=0,bus=this.music) {
    const f=this.note(midi);this.voice(f,t,length,volume,'sine',bus,pan);
    this.voice(f*2.003,t,length*.45,volume*.22,'sine',bus,pan);
  }
  schedule() {
    if(!this.enabled||this.context.state!=='running')return;
    const boss=this.scene==='playing'&&this.level===7,party=this.scene==='party';
    const beat=60/(party?124:boss?112:this.scene==='title'?88:98)/4;
    // Eight-bar phrases: a composed melody over changing arpeggios and warm bass.
    const chords=boss?[[57,60,64],[53,57,60],[50,53,57],[55,59,62]]:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]];
    const melody=boss?[76,null,72,69,null,72,74,null,76,null,79,76,74,null,71,null]:[79,null,76,74,72,null,76,null,74,null,76,79,81,null,79,null];
    // Recover from a stalled tab without scheduling a burst of overdue notes.
    if(this.nextBeat<this.context.currentTime-.1)this.nextBeat=this.context.currentTime+.03;
    while(this.nextBeat<this.context.currentTime+.14){
      const s=this.step%16,bar=Math.floor(this.step/16)%8,chord=chords[bar%4],t=this.nextBeat;
      if(s%2===0){const n=chord[[0,1,2,1][(s/2)%4]]+12;this.bell(n,t,.43,.045,(s%4===0?-.4:.4));}
      if(s===0||s===8)this.voice(this.note(chord[0]-24),t,beat*7,.12,'triangle');
      if(s===0)for(const n of chord)this.voice(this.note(n),t,beat*15,.025,'sine');
      let n=melody[(s+(bar%2)*8)%16];
      if(n!==null&&(this.scene==='title'||bar%2===0||party||boss))this.bell(n+(party?12:0),t,party?.26:.65,.085,-.15);
      if(party||boss){
        if(s%4===0)this.voice(boss?110:150,t,.13,.15,'sine',this.music,0,45);
        if(s%4===2)this.voice(party?6000:2400,t,.045,.025,'noise',this.music,.25,700);
        if(party&&(s===4||s===12))this.voice(1800,t,.1,.06,'noise',this.music,-.2,700);
      }
      this.step++;this.nextBeat+=beat;
    }
  }
  effect(name,variant=0) {
    if(!this.enabled||!this.context||this.context.state!=='running'||this.scene==='paused'||this.scene==='lost')return;
    const t=this.context.currentTime,last=this.lastEffects.get(name)??-100;
    if(t-last<({hit:.065,thunder:.3,glitter:.24}[name]||.08))return;
    this.lastEffects.set(name,t);
    const tone=(f,d,v=.12,type='sine',delay=0,end=null)=>this.voice(f,t+delay,d,v,type,this.fx,0,end);
    const chime=(notes,length=.4)=>notes.forEach((n,i)=>this.bell(n,t+i*.075,length,.15,(i-1)*.15,this.fx));
    switch(name){
      case 'shoot': {const f=[620,820,1040][variant]||620;tone(f,.16,.09,'triangle',0,f*1.75);tone(f*2,.12,.025,'sine',.025,f*2.8);break;}
      case 'hit':tone(1300,.07,.045,'noise',0,300);tone(540,.11,.07,'sine',0,300);break;
      case 'defeat':chime([72,76,79],.27);tone(2600,.2,.04,'noise',0,300);break;
      case 'bossDefeat':chime([60,67,72,76,79,84],.8);tone(900,.8,.13,'noise',0,70);break;
      case 'hurt':tone(220,.22,.15,'triangle',0,95);tone(650,.12,.055,'noise',0,180);break;
      case 'thunder':tone(950,.4,variant?.11:.045,'noise',0,65);tone(85,.27,.07,'sine',0,40);break;
      case 'clear':chime([72,76,79,84],.6);break;
      case 'room':chime([67,72,76],.55);break;
      case 'upgrade':chime([72,76,79,84,88],.65);break;
      case 'party':chime([72,76,79,84,79,88],.8);break;
      case 'pie':chime([84,88,91],.3);tone(300,.09,.075,'sine',0,650);break;
      case 'jump':tone(240,.25,.11,'sine',0,900);break;
      case 'land':tone(160,.14,.08,'sine',0,65);tone(850,.08,.03,'noise',0,150);break;
      case 'glitter':tone(1700+(variant%5)*160,.13,.025,'sine',0,3200);break;
    }
  }
}
