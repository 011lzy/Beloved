/* songwrite.js - 从 app.js 拆分 */

    // ========== 一起写歌（重写版） ==========
    /* 双人共创旋律：定字数 → 定歌名 → 轮流绘画发声 → 保存 → 仿网易云视频式回放 */

    /* ---- 常量 ---- */
    var SW_INSTS = [
        {key:'piano',name:'钢琴',en:'Piano',wave:'triangle',oct:1,sustain:false,svg:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="18" height="12" rx="1.5"/><line x1="8" y1="6" x2="8" y2="18"/><line x1="13" y1="6" x2="13" y2="18"/><line x1="18" y1="6" x2="18" y2="18"/><rect x="6.5" y="6" width="1.5" height="6" fill="currentColor" stroke="none"/><rect x="11.5" y="6" width="1.5" height="6" fill="currentColor" stroke="none"/><rect x="16.5" y="6" width="1.5" height="6" fill="currentColor" stroke="none"/></svg>'},
        {key:'epiano',name:'电钢琴',en:'E.Piano',wave:'sine',oct:1,sustain:false,svg:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="11" rx="1.5"/><line x1="8" y1="7" x2="8" y2="18"/><line x1="13" y1="7" x2="13" y2="18"/><line x1="18" y1="7" x2="18" y2="18"/></svg>'},
        {key:'organ',name:'风琴',en:'Organ',wave:'sawtooth',oct:1,sustain:true,svg:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="3" width="2" height="16" rx="1"/><rect x="10" y="5" width="2" height="14" rx="1"/><rect x="14" y="3" width="2" height="16" rx="1"/><rect x="3" y="19" width="18" height="2.5" rx="1"/></svg>'},
        {key:'guitar',name:'木吉他',en:'Guitar',wave:'sawtooth',oct:1,sustain:false,svg:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="15" r="5"/><rect x="11" y="3" width="2" height="9" rx="1" transform="rotate(20 12 7)"/><circle cx="9" cy="15" r="1.4" fill="currentColor" stroke="none"/></svg>'},
        {key:'strings',name:'弦乐',en:'Strings',wave:'sawtooth',oct:1,sustain:true,svg:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 21c2-1 3-3 3-7s-1-6 0-9"/><path d="M13 21c2-1 3-3 3-7s-1-6 0-9"/><circle cx="7" cy="5" r="1.6"/><circle cx="13" cy="5" r="1.6"/></svg>'},
        {key:'bass',name:'贝斯',en:'Bass',wave:'sine',oct:0.5,sustain:false,svg:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="10" cy="16" rx="6" ry="5"/><rect x="12" y="3" width="2" height="11" rx="1" transform="rotate(20 13 8)"/></svg>'},
        {key:'synth',name:'合成器',en:'Synth',wave:'square',oct:1,sustain:true,svg:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M5 12h2l1.5-3 2 6 2-6 1.5 3H19"/></svg>'},
        {key:'flute',name:'长笛',en:'Flute',wave:'sine',oct:2,sustain:true,svg:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="10" width="20" height="4" rx="2"/><circle cx="8" cy="12" r="0.9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="0.9" fill="currentColor" stroke="none"/></svg>'},
        {key:'harmonica',name:'口琴',en:'Harmonica',wave:'triangle',oct:1,sustain:false,svg:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="9" width="20" height="7" rx="1.5"/><line x1="6" y1="9" x2="6" y2="16"/><line x1="10" y1="9" x2="10" y2="16"/><line x1="14" y1="9" x2="14" y2="16"/><line x1="18" y1="9" x2="18" y2="16"/></svg>'},
        {key:'harpsichord',name:'古钢琴',en:'Harpsi.',wave:'sawtooth',oct:1,sustain:false,svg:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="10" rx="1.5"/><line x1="8" y1="7" x2="8" y2="17"/><line x1="13" y1="7" x2="13" y2="17"/><line x1="18" y1="7" x2="18" y2="17"/></svg>'}
    ];
    var SW_TIME_OPTS = [
        {label:'5秒',  sec:5,   strokes:5,   pct:0.35, reward:200},
        {label:'30秒', sec:30,  strokes:30,  pct:0.40, reward:1000},
        {label:'45秒', sec:45,  strokes:45,  pct:0.42, reward:1500},
        {label:'60秒', sec:60,  strokes:60,  pct:0.45, reward:3000},
        {label:'2分钟',sec:120, strokes:120, pct:0.50, reward:4000},
        {label:'3分钟',sec:180, strokes:180, pct:0.60, reward:5000}
    ];
    var SW_WARM_DEF = ['#FF6B6B','#FF9F43','#FECA57','#FF6B9D','#E17055'];
    var SW_COOL_DEF = ['#4A90D9','#5BC0BE','#6BCB77','#845EC2','#00C9A7'];
    var SW_NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    /* C大调自然音阶 C4~B4（7个音符，中音区） */
    var SW_SCALE = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
    /* 混响预设 */
    var SW_REVERBS = [
        {key:'none',name:'无',mix:0},
        {key:'room',name:'房间',mix:0.25,decay:0.5},
        {key:'hall',name:'大厅',mix:0.35,decay:1.5},
        {key:'church',name:'教堂',mix:0.45,decay:3.0},
        {key:'valley',name:'山谷',mix:0.5,decay:4.0},
        {key:'space',name:'星空',mix:0.6,decay:5.0,preDelay:0.15},
        {key:'ocean',name:'海底',mix:0.55,decay:3.5,preDelay:0.2},
        {key:'radio',name:'复古电台',mix:0.4,decay:1.0,filter:3000},
        {key:'dream',name:'幻境',mix:0.65,decay:6.0,preDelay:0.3},
        {key:'wet',name:'湿声',mix:0.7,decay:2.5}
    ];

    /* ---- 状态 ---- */
    var swState = {
        title:'', nameLen:0, nameChars:[], charIdx:0, charTurn:'me',
        myLenChoice:0, taLenChoice:0, myTimeChoice:null, taTimeChoice:null,
        timeOpt:null, totalStrokes:0, duration:0, canvasPct:0, canvasW:0, canvasH:0,
        firstPlayer:'me', round:0, curAuthor:'me',
        strokes:[],           // 已完成的所有笔触
        roundStrokes:[],      // 当前回合的笔触
        drums:[],             // 鼓点（打击垫）记录
        drumAlt:0,            // 鼓点交替计数（hi-hat / bass drum）
        curInst:'piano', curColor:'#FFFFFF', eraseMode:false,
        drawTimer:null, phaseTimer:null, taTimer:null,
        audioCtx:null, osc:null, curStroke:null, strokeStart:0,
        drawing:false, _melodyTouchId:null,
        /* 长按发声相关 */
        pressTimer:null, longPress:false, pressStartTime:0,
        glowAnim:null, glowPos:null, glowParticles:[], glowRipples:[],
        /* 合作者选择 */
        partnerName:'',       // 选定的合作者昵称
        partnerId:null        // 选定的合作者联系人 ID
    };
    var swNavStack = [];

    /* ---- 数据 ---- */
    function swInitData() {
        try {
            if (typeof appData === 'undefined') window.appData = {};
            if (!appData.songwriteData) appData.songwriteData = {};
            var d = appData.songwriteData;
            if (!d.library || !d.library.length) d.library = ['爱','梦','星','光','风','云','雨','花','月','心'].map(function(c){return {text:c,hidden:false,builtin:true};});
            if (!d.songs) d.songs = [];
            if (!d.theme) d.theme = {};
            var t = d.theme;
            if (!t.warmColors) t.warmColors = SW_WARM_DEF.slice();
            if (!t.coolColors) t.coolColors = SW_COOL_DEF.slice();
        } catch(e){ console.error('[写歌] init', e); }
    }
    function swSave(){ try{ if(typeof saveData==='function') saveData(); }catch(e){} }
    function swTheme(){ return appData.songwriteData.theme; }
    function swMe(){ return (appData.chatSettings && appData.chatSettings.myNickname) || '我'; }
    function swOther(){ return swState.partnerName || (appData.chatSettings && appData.chatSettings.otherNickname) || '对方'; }
    function swInstByKey(k){ var i=SW_INSTS.find(function(x){return x.key===k;}); return i||SW_INSTS[0]; }
    function swInstName(k){ return swInstByKey(k).name; }
    function swTimeLabel(sec){ var o=SW_TIME_OPTS.find(function(x){return x.sec===sec;}); return o?o.label:sec+'秒'; }
    function swFormatDate(d){ var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),da=String(d.getDate()).padStart(2,'0'); return y+'.'+m+'.'+da; }
    function swVisibleLib(){ return appData.songwriteData.library.filter(function(c){return !c.hidden;}).map(function(c){return c.text;}); }

    /* ---- 音频 ---- */
    /* 共享 AudioContext：优先复用保活系统的 context，避免 iOS 多 AudioContext 冲突 */
    function swAudio(){
        if(!swState.audioCtx){
            try {
                if(typeof _silentAudio!=='undefined' && _silentAudio && _silentAudio._ctx){
                    swState.audioCtx=_silentAudio._ctx;
                }
            } catch(e) {}
            if(!swState.audioCtx){
                try{ swState.audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ console.error('[写歌] AudioContext创建失败:', e); }
            }
        }
        return swState.audioCtx;
    }
    function swResumeAudio(){
        var c=swAudio(); if(!c) return;
        /* 仅尝试 resume，不创建新 context（新 context 必须在用户手势中创建，见 swForceResumeAudio） */
        if(c.state!=='running'){
            var p=c.resume();
            if(p&&typeof p.then==='function'){
                p.then(function(){
                    var fix=document.getElementById('swAudioFix'); if(fix) fix.classList.remove('show');
                }).catch(function(e){
                    console.warn('[写歌] AudioContext resume failed:', e);
                });
            }
        }
    }
    /* 强制恢复音频：在用户手势（点击恢复按钮）上下文中调用。
       核心策略：关闭旧 context → 同步创建新 context → 同步重建播放器音频链。
       iOS 后台回来后旧 context 常进入"僵尸"状态，resume() 静默失败，必须重建。*/
    function swForceResumeAudio(){
        /* 1. 关闭旧 context（同步，在用户手势内） */
        var oldCtx=swState.audioCtx;
        if(oldCtx){
            try{ oldCtx.close(); }catch(e){}
        }
        /* 2. 同步创建新 AudioContext（在用户手势中创建，iOS 会直接进入 running 状态） */
        var newCtx=null;
        try{
            newCtx=new (window.AudioContext||window.webkitAudioContext)();
            swState.audioCtx=newCtx;
            console.log('[写歌] 已创建新 AudioContext, state=', newCtx.state);
        }catch(e){
            console.error('[写歌] 创建 AudioContext 失败:', e);
            var tx=document.querySelector('.sw-audio-fix-tx');
            if(tx) tx.innerHTML='恢复失败，请刷新页面后重试';
            return;
        }
        /* 3. 同步更新保活系统指向新 context */
        if(typeof _silentAudio!=='undefined'){
            _silentAudio={_ctx:newCtx,_osc:null,_gain:null};
            _audioKeepAliveStarted=true;
        }
        /* 4. 同步重建播放器音频链（新 context 上的新节点） */
        swPlayer._masterGain=null; swPlayer._convolver=null; swPlayer._wetGain=null;
        swSetupPlayerAudio();
        /* 恢复之前的混响设置 */
        var savedReverb='none';
        try{ savedReverb=localStorage.getItem('swReverbType')||'none'; }catch(e){}
        if(savedReverb!=='none'){ swSetReverb(savedReverb); }
        /* 5. 如果新 context 不是 running（极少见），尝试 resume */
        if(newCtx.state!=='running'){
            var p=newCtx.resume();
            if(p&&typeof p.then==='function'){
                p.then(function(){
                    console.log('[写歌] 新 AudioContext resume 成功, state=', newCtx.state);
                }).catch(function(e){ console.error('[写歌] 新 context resume 失败:', e); });
            }
        }
        /* 6. 隐藏修复浮层 */
        var fix=document.getElementById('swAudioFix'); if(fix) fix.classList.remove('show');
        /* 恢复浮层文案为默认值（防止上次失败改过文案） */
        var tx2=document.querySelector('.sw-audio-fix-tx');
        if(tx2) tx2.innerHTML='音频被系统中断（可能是录屏）<br>点击下方按钮恢复声音';
    }
    /* 显示音频修复浮层 */
    function swShowAudioFix(){
        var fix=document.getElementById('swAudioFix');
        if(fix) fix.classList.add('show');
    }
    /* 音频健康检查：定期检测 AudioContext 状态，被中断时自动显示修复浮层 */
    var _swAudioMonitor=null;
    function swStartAudioMonitor(){
        swStopAudioMonitor();
        _swAudioMonitor=setInterval(function(){
            var page=document.getElementById('songwriteAppPage');
            if(!page || page.style.display==='none'){ return; }
            var c=swState.audioCtx;
            if(c && (c.state==='suspended'||c.state==='interrupted')){
                /* 自动尝试一次静默恢复（可能失败，因为不在用户手势中） */
                swResumeAudio();
                /* 如果仍然不是 running，显示修复浮层等用户点击 */
                setTimeout(function(){
                    var c2=swState.audioCtx;
                    if(c2 && c2.state!=='running'){ swShowAudioFix(); }
                }, 500);
            }
        }, 2000);
    }
    function swStopAudioMonitor(){
        if(_swAudioMonitor){ clearInterval(_swAudioMonitor); _swAudioMonitor=null; }
    }
    /* y(0=顶..canvasH=底) → C大调7音阶量化频率（C4~B4，上=高音，下=低音） */
    function swY2Freq(y, h){ h=h||swState.canvasH||300; var region=Math.floor(Math.max(0,Math.min(1,y/h))*7); if(region>6)region=6; return SW_SCALE[region]; }
    function swFreqToNote(freq){ var midi=Math.round(69+12*Math.log2(freq/440)); var n=SW_NOTE_NAMES[((midi%12)+12)%12]; var oct=Math.floor(midi/12)-1; return n+oct; }
    /* 各乐器泛音配置：partials=[[倍频,振幅],...]，wave 主波形，attack 起音(秒)，
       decay 衰减(秒，0=持续发声)，release 释放(秒)，vibrato 颤音Hz(0=无)，
       oct 八度倍率，noise 拨弦噪声，detune 失谐 cents，sweep 扫频。*/
    var SW_INST_HARM = {
        piano:       {partials:[[1,1],[2,0.45],[3,0.20],[4,0.12],[5,0.06],[6,0.03]], wave:'triangle',  attack:0.003, decay:0.50, release:0.08, vibrato:0, peak:0.30, filter:{type:'lowpass',freq:5000,q:0.7}},
        epiano:      {partials:[[1,1],[2,0.35],[3,0.15],[4,0.08]],                   wave:'sine',      attack:0.004, decay:0.60, release:0.12, vibrato:0, peak:0.28, filter:{type:'lowpass',freq:3500,q:1.2}},
        guitar:      {partials:[[1,1],[2,0.25],[3,0.12],[4,0.06],[5,0.03]],          wave:'sawtooth',  attack:0.002, decay:0.35, release:0.05, vibrato:0, noise:true, peak:0.25, filter:{type:'lowpass',freq:3000,q:1.5}},
        strings:     {partials:[[1,1],[2,0.35],[3,0.18],[4,0.08]],                   wave:'sawtooth',  attack:0.06,  decay:0,    release:0.60, vibrato:5, peak:0.22, filter:{type:'lowpass',freq:4000,q:0.5}},
        organ:       {partials:[[1,1],[2,0.50],[3,0.30],[4,0.15]],                   wave:'sine',      attack:0.02,  decay:0,    release:0.10, vibrato:5.5, peak:0.25, filter:{type:'lowpass',freq:5000,q:0.3}},
        bass:        {partials:[[1,1],[2,0.12],[3,0.04]],                            wave:'triangle',  attack:0.005, decay:0.35, release:0.05, vibrato:0, oct:0.5, peak:0.30, filter:{type:'lowpass',freq:800,q:0.8}},
        synth:       {partials:[[1,1]],                                             wave:'sawtooth',  attack:0.02,  decay:0,    release:0.35, vibrato:0, detune:12, sweep:true, peak:0.22, filter:{type:'lowpass',freq:2500,q:3}},
        flute:       {partials:[[1,1],[2,0.25],[3,0.08]],                           wave:'sine',      attack:0.08,  decay:0,    release:0.25, vibrato:5, peak:0.25, filter:{type:'lowpass',freq:4500,q:0.5}},
        harmonica:   {partials:[[1,1],[2,0.18],[3,0.06]],                           wave:'triangle',  attack:0.004, decay:0.25, release:0.04, vibrato:5.5, peak:0.26, filter:{type:'lowpass',freq:3500,q:0.8}},
        harpsichord: {partials:[[1,1],[2,0.12],[3,0.04],[4,0.02]],                  wave:'sawtooth',  attack:0.001, decay:0.20, release:0.03, vibrato:0, peak:0.24, filter:{type:'lowpass',freq:6000,q:0.5}}
    };
    /* 构建一个音符的振荡器组：多泛音叠加 + 滤波器塑形 + 颤音 + 拨弦噪声/失谐扫频，返回 voice 对象 */
    function swBuildVoice(freq, instKey, destNode, opts){
        opts=opts||{};
        var ctx=swAudio(); if(!ctx) return null;
        if(ctx.state!=='running'){ swResumeAudio(); }
        var inst=swInstByKey(instKey);
        var cfg=SW_INST_HARM[instKey]||SW_INST_HARM['piano'];
        var now=ctx.currentTime;
        var peak=(opts.volMult!=null?opts.volMult:1)*(cfg.peak||0.28);
        var attack=cfg.attack||0.005;
        var release=cfg.release||0.05;
        var oct=(cfg.oct!=null)?cfg.oct:(inst.oct||1);
        var baseFreq=freq*oct;
        var partials=cfg.partials||[[1,1]];
        var totalAmp=partials.reduce(function(s,p){return s+(p[1]||0);},0)||1;

        /* 包络增益 */
        var master=ctx.createGain();
        master.gain.setValueAtTime(0.0001, now);
        master.gain.linearRampToValueAtTime(peak, now+attack);

        /* 滤波器：为每种乐器塑形音色，去掉刺耳的高频泛音 */
        var filterNode=null;
        if(cfg.filter){
            try{
                filterNode=ctx.createBiquadFilter();
                filterNode.type=cfg.filter.type||'lowpass';
                filterNode.frequency.value=cfg.filter.freq||5000;
                filterNode.Q.value=cfg.filter.q||0.5;
                filterNode.connect(master);
            }catch(e){ filterNode=null; }
        }
        var voiceDest=filterNode||master;

        var autoStopAt=0;
        if(opts.sustain){
            master.gain.setValueAtTime(peak, now+attack+0.002);
        } else {
            var dur=opts.duration||0.3;
            if(cfg.decay>0){
                var dec=Math.min(cfg.decay, dur);
                master.gain.setValueAtTime(peak, now+attack);
                master.gain.exponentialRampToValueAtTime(0.001, now+attack+dec);
                autoStopAt=now+attack+dec+0.05;
            } else {
                master.gain.setValueAtTime(peak, now+Math.max(attack, dur-release));
                master.gain.exponentialRampToValueAtTime(0.001, now+dur);
                autoStopAt=now+dur+0.02;
            }
        }
        var dest=destNode||ctx.destination;
        master.connect(dest);
        if(swPlayer._convolver && swPlayer._wetGain && swPlayer._reverbType!=='none'){
            master.connect(swPlayer._convolver);
        }
        var oscs=[], gains=[];
        partials.forEach(function(p){
            var mult=p[0], amp=(p[1]||0)/totalAmp;
            if(cfg.detune){
                [-cfg.detune, cfg.detune].forEach(function(c){
                    var o=ctx.createOscillator(); o.type=cfg.wave;
                    o.frequency.value=baseFreq*mult; o.detune.value=c;
                    if(cfg.sweep && !opts.sustain){ o.frequency.linearRampToValueAtTime(baseFreq*mult*1.3, now+(opts.duration||0.3)); }
                    var g=ctx.createGain(); g.gain.value=amp*0.5;
                    o.connect(g); g.connect(voiceDest); oscs.push(o); gains.push(g);
                });
            } else {
                var o=ctx.createOscillator(); o.type=cfg.wave; o.frequency.value=baseFreq*mult;
                var g=ctx.createGain(); g.gain.value=amp;
                o.connect(g); g.connect(voiceDest); oscs.push(o); gains.push(g);
            }
        });
        var lfo=null;
        if(cfg.vibrato){
            lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=cfg.vibrato;
            var lfoGain=ctx.createGain(); lfoGain.gain.value=Math.max(2, baseFreq*0.008);
            lfo.connect(lfoGain); oscs.forEach(function(o){ lfoGain.connect(o.frequency); });
            lfo.start(now);
        }
        var noiseSrc=null;
        if(cfg.noise){
            try{
                var buf=ctx.createBuffer(1, Math.floor(ctx.sampleRate*0.03), ctx.sampleRate);
                var dat=buf.getChannelData(0);
                for(var i=0;i<dat.length;i++){ dat[i]=(Math.random()*2-1)*Math.pow(1-i/dat.length,3); }
                noiseSrc=ctx.createBufferSource(); noiseSrc.buffer=buf;
                var ng=ctx.createGain(); ng.gain.value=0.08;
                var bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=baseFreq*2;
                noiseSrc.connect(bp); bp.connect(ng); ng.connect(voiceDest);
                noiseSrc.start(now);
            }catch(e){}
        }
        oscs.forEach(function(o){ o.start(now); });
        if(autoStopAt){
            oscs.forEach(function(o){ try{o.stop(autoStopAt);}catch(e){} });
            if(lfo){ try{lfo.stop(autoStopAt);}catch(e){} }
            if(noiseSrc){ try{noiseSrc.stop(autoStopAt);}catch(e){} }
        }
        var voice={ osc:oscs[0], gain:master, inst:inst, stopped:false,
            _oscs:oscs, _lfo:lfo, _noise:noiseSrc, _ctx:ctx, _release:release, _oct:oct, _partials:partials, _detune:cfg.detune, _filter:filterNode };
        voice.setFreq=function(f){
            var bf=f*oct, t=ctx.currentTime;
            var idx=0;
            partials.forEach(function(p){
                var mult=p[0];
                if(cfg.detune){
                    if(oscs[idx]) oscs[idx].frequency.setTargetAtTime(bf*mult, t, 0.02);
                    if(oscs[idx+1]) oscs[idx+1].frequency.setTargetAtTime(bf*mult, t, 0.02);
                    idx+=2;
                } else {
                    if(oscs[idx]) oscs[idx].frequency.setTargetAtTime(bf*mult, t, 0.02);
                    idx+=1;
                }
            });
            if(filterNode && cfg.filter){
                filterNode.frequency.setTargetAtTime(cfg.filter.freq, t, 0.02);
            }
        };
        return voice;
    }
    /* 启动一个固定时长音符，自动停止（回放/短按使用） */
    function swStartOsc(freq, instKey, duration, destNode){
        return swBuildVoice(freq, instKey, destNode, {duration:duration||0.3, sustain:false});
    }
    /* 启动持续音（长按使用），不自动停止，音量为短音的 0.7 倍，可用 voice.setFreq 滑音 */
    function swStartSustain(freq, instKey, destNode, volMult){
        return swBuildVoice(freq, instKey, destNode, {sustain:true, volMult:(volMult!=null?volMult:0.7)});
    }
    function swStopOsc(voice){
        if(!voice||voice.stopped) return; voice.stopped=true;
        try{
            var ctx=voice._ctx||swState.audioCtx||swAudio(); var now=ctx.currentTime;
            var rel=voice._release||0.05;
            voice.gain.gain.cancelScheduledValues(now);
            voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value,0.0001), now);
            voice.gain.gain.exponentialRampToValueAtTime(0.0001, now+rel);
            var stopAt=now+rel+0.02;
            (voice._oscs||[voice.osc]).forEach(function(o){ try{o.stop(stopAt);}catch(e){} });
            if(voice._lfo){ try{voice._lfo.stop(stopAt);}catch(e){} }
            if(voice._noise){ try{voice._noise.stop(stopAt);}catch(e){} }
        }catch(e){}
    }

    /* ---- 鼓点 / 和弦合成 ---- */
    /* 打击垫音效：hi-hat（白噪声短促）/ kick（低频正弦衰减） */
    function swPlayDrum(type){
        var ctx=swAudio(); if(!ctx) return;
        if(ctx.state!=='running'){ swResumeAudio(); }
        var now=ctx.currentTime;
        if(type==='hihat'){
            // Hi-hat: white noise burst, very short
            var bufferSize=ctx.sampleRate*0.05;
            var buffer=ctx.createBuffer(1,bufferSize,ctx.sampleRate);
            var data=buffer.getChannelData(0);
            for(var i=0;i<bufferSize;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/bufferSize,3);
            var noise=ctx.createBufferSource(); noise.buffer=buffer;
            var filt=ctx.createBiquadFilter(); filt.type='highpass'; filt.frequency.value=7000;
            var g=ctx.createGain(); g.gain.value=0.15;
            noise.connect(filt); filt.connect(g);
            if(swPlayer._masterGain) g.connect(swPlayer._masterGain); else g.connect(ctx.destination);
            if(swPlayer._convolver && swPlayer._reverbType!=='none') g.connect(swPlayer._convolver);
            noise.start(now); noise.stop(now+0.05);
        } else {
            // Bass drum: low sine wave with quick decay
            var osc=ctx.createOscillator(); osc.type='sine'; osc.frequency.setValueAtTime(150,now);
            osc.frequency.exponentialRampToValueAtTime(50,now+0.1);
            var g=ctx.createGain(); g.gain.setValueAtTime(0.4,now);
            g.gain.exponentialRampToValueAtTime(0.001,now+0.15);
            osc.connect(g);
            if(swPlayer._masterGain) g.connect(swPlayer._masterGain); else g.connect(ctx.destination);
            if(swPlayer._convolver && swPlayer._reverbType!=='none') g.connect(swPlayer._convolver);
            osc.start(now); osc.stop(now+0.15);
        }
    }
    /* 和弦伴奏：根音 + 大三度 + 纯五度 */
    function swPlayChord(rootFreq, duration){
        var ctx=swAudio(); if(!ctx) return;
        if(ctx.state!=='running'){ swResumeAudio(); }
        var now=ctx.currentTime;
        // Major chord: root, major third, fifth
        var freqs=[rootFreq, rootFreq*1.26, rootFreq*1.498];
        freqs.forEach(function(f){
            var osc=ctx.createOscillator(); osc.type='sine'; osc.frequency.value=f;
            var g=ctx.createGain(); g.gain.setValueAtTime(0,now);
            g.gain.linearRampToValueAtTime(0.06,now+0.05);
            g.gain.setValueAtTime(0.06,now+duration-0.1);
            g.gain.exponentialRampToValueAtTime(0.001,now+duration);
            osc.connect(g);
            if(swPlayer._masterGain) g.connect(swPlayer._masterGain); else g.connect(ctx.destination);
            if(swPlayer._convolver && swPlayer._reverbType!=='none') g.connect(swPlayer._convolver);
            osc.start(now); osc.stop(now+duration);
        });
    }
    /* 绘制画布 70/30 分区背景：上 70% 旋律区（白），下 30% 打击垫（浅灰）+ 分隔线 + 4 等分 */
    function swDrawCanvasBg(ctx){
        var W=swState.canvasW, H=swState.canvasH;
        var melodyH=H*0.7, drumH=H*0.3;
        ctx.globalCompositeOperation='source-over';
        ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,melodyH);
        ctx.fillStyle='#f0f2f5'; ctx.fillRect(0,melodyH,W,drumH);
        ctx.strokeStyle='#d0d4da'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(0,melodyH); ctx.lineTo(W,melodyH); ctx.stroke();
        ctx.strokeStyle='#cfd4da';
        for(var i=1;i<4;i++){ var x=W*i/4; ctx.beginPath(); ctx.moveTo(x,melodyH); ctx.lineTo(x,H); ctx.stroke(); }
    }
    /* 在指定 ctx 上绘制一个鼓点标记（小圆点） */
    function swDrawDrumMarkerAt(ctx, x, y, type, author){
        ctx.save();
        ctx.globalCompositeOperation='source-over';
        ctx.globalAlpha=1;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI*2);
        if(type==='hihat'){ ctx.fillStyle = author==='ta' ? '#f39c12' : '#4A90D9'; }
        else { ctx.fillStyle = author==='ta' ? '#e0607a' : '#E17055'; }
        ctx.fill();
        ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.stroke();
        ctx.restore();
    }
    /* 在当前绘制画布上绘制鼓点标记 */
    function swDrawDrumMarker(x, y, type, author){
        var ctx=swState._ctx; if(!ctx) return;
        swDrawDrumMarkerAt(ctx, x, y, type, author);
    }
    /* 创建一个鼓点：交替 hi-hat/kick，播放音效，记录到 swState.drums，绘制标记 */
    function swAddDrumBeat(p){
        var type=(swState.drumAlt%2===0)?'hihat':'kick';
        swState.drumAlt++;
        swPlayDrum(type);
        var W=swState.canvasW||1, H=swState.canvasH||1;
        var drum={ type:type, x:p.x/W, y:p.y/H, time:performance.now()/1000, author:(swState.curAuthor||'me') };
        swState.drums.push(drum);
        swDrawDrumMarker(p.x, p.y, type, swState.curAuthor);
    }
    /* 算法生成脉冲响应（无需外部音频文件） */
    function swMakeIR(ctx, key){
        var cfg=SW_REVERBS.find(function(r){return r.key===key;}); if(!cfg||cfg.key==='none') return null;
        var sr=ctx.sampleRate;
        var preDelaySamples = cfg.preDelay ? Math.floor(sr * cfg.preDelay) : 0;
        var len=Math.max(1,Math.floor(sr*cfg.decay) + preDelaySamples);
        var ir=ctx.createBuffer(2,len,sr);
        for(var ch=0;ch<2;ch++){
            var data=ir.getChannelData(ch);
            for(var i=0;i<len;i++){
                if(i < preDelaySamples){ data[i]=0; continue; }
                var t=(i-preDelaySamples)/(len-preDelaySamples);
                var env=Math.pow(1-t,2);
                data[i]=(Math.random()*2-1)*env*(1-t*0.3);
            }
            /* 低通滤波（复古电台） */
            if(cfg.filter){
                var last=0, cutoff=cfg.filter/sr;
                for(var j=0;j<len;j++){
                    last = last + cutoff * (data[j] - last);
                    data[j] = last;
                }
            }
        }
        return ir;
    }
    /* 播放器音频链：masterGain→destination, convolver→wetGain→masterGain */
    function swSetupPlayerAudio(){
        var ctx=swAudio(); if(!ctx) return;
        if(!swPlayer._masterGain){ swPlayer._masterGain=ctx.createGain(); swPlayer._masterGain.gain.value=1.0; swPlayer._masterGain.connect(ctx.destination); }
        if(!swPlayer._convolver){ swPlayer._convolver=ctx.createConvolver(); swPlayer._wetGain=ctx.createGain(); swPlayer._wetGain.gain.value=0; swPlayer._convolver.connect(swPlayer._wetGain); swPlayer._wetGain.connect(swPlayer._masterGain); }
        swPlayer._reverbType='none';
    }
    function swSetReverb(key){
        var ctx=swAudio(); if(!ctx||!swPlayer._convolver) return;
        var cfg=SW_REVERBS.find(function(r){return r.key===key;}); if(!cfg) return;
        swPlayer._reverbType=key;
        if(cfg.key==='none'){ swPlayer._wetGain.gain.value=0; }
        else { swPlayer._convolver.buffer=swMakeIR(ctx,key); swPlayer._wetGain.gain.value=cfg.mix; }
    }
    function swPickReverb(key){
        swSetReverb(key);
        try{ localStorage.setItem('swReverbType', key); }catch(e){}
        document.querySelectorAll('#swReverbRow .sw-reverb-btn').forEach(function(el){ el.classList.toggle('on', el.dataset.key===key); });
    }

    /* ---- 导航 ---- */
    function swPushNav(fn){ swNavStack.push(fn); }
    function swBack(){ swCleanup(); swStopPlayer(); if(swNavStack.length){ var fn=swNavStack.pop(); if(typeof fn==='function') fn(); } else closeSongwriteApp(); }
    function swCleanup(){
        swState.drawing=false;
        if(swState.drawTimer){ clearInterval(swState.drawTimer); swState.drawTimer=null; }
        if(swState.phaseTimer){ clearInterval(swState.phaseTimer); swState.phaseTimer=null; }
        if(swState.taTimer){ clearTimeout(swState.taTimer); swState.taTimer=null; }
        if(swState.pressTimer){ clearTimeout(swState.pressTimer); swState.pressTimer=null; }
        if(swState.osc){ swStopOsc(swState.osc); swState.osc=null; }
        swStopGlow();
        swState.longPress=false;
    }
    function openSongwriteApp(){
        swInitData(); swApplyTheme(); swResumeAudio();
        document.getElementById('songwriteAppPage').style.display='flex'; swNavStack=[]; swShowStart();
        /* 启动音频健康监测：录屏/系统中断后自动检测并提示恢复 */
        swStartAudioMonitor();
        /* iOS Safari:在 app 页面首次触摸时确保音频解锁。
           如果 context 不是 running，直接强制重建（在用户手势内，成功率最高） */
        var page=document.getElementById('songwriteAppPage');
        if(page && !page._swAudioUnlock){
            page._swAudioUnlock=true;
            var unlock=function(){
                var c=swAudio();
                if(!c || c.state!=='running'){
                    /* context 不在运行状态，直接强制重建（在用户手势内同步执行） */
                    swForceResumeAudio();
                }
            };
            page.addEventListener('touchstart',unlock,{once:true,passive:true});
            page.addEventListener('mousedown',unlock,{once:true});
        }
        /* 离开网站再回来时：AudioContext 会被浏览器挂起，监听 visibilitychange 恢复 */
        if(!window._swVisHandler){
            window._swVisHandler=true;
            document.addEventListener('visibilitychange',function(){
                if(!document.hidden){
                    /* 页面重新可见：尝试恢复现有 context（不置空 audioCtx，避免播放器节点脱节）。
                       注意：visibilitychange 不是用户手势，resume 可能失败，失败后由监测器弹修复浮层 */
                    setTimeout(function(){
                        swResumeAudio();
                        /* 检查状态，如果仍非 running 则显示修复浮层 */
                        setTimeout(function(){
                            var c=swState.audioCtx;
                            if(c && c.state!=='running'){ swShowAudioFix(); }
                        }, 600);
                    }, 100);
                }
            });
        }
    }
    function closeSongwriteApp(){ swCleanup(); swStopPlayer(); swStopAudioMonitor(); var fix=document.getElementById('swAudioFix'); if(fix) fix.classList.remove('show'); document.getElementById('songwriteAppPage').style.display='none'; }

    /* ---- 主题 ---- */
    function swApplyTheme(){
        var page=document.getElementById('songwriteAppPage'); if(!page) return;
        var t=swTheme();
        page.style.setProperty('--sw-btn-bg', t.btnColor||'#1a1a1a');
        page.style.setProperty('--sw-accent', t.btnColor||'#1a1a1a');
        page.style.setProperty('--sw-btn-text', t.btnTextColor||'#ffffff');
        page.style.setProperty('--sw-font', t.fontColor||'');
        page.style.setProperty('--sw-btn-img', t.btnImage?('url('+t.btnImage+')'):'none');
        if(t.bgImage){ page.style.background='url('+t.bgImage+') center/cover no-repeat'; }
        else if(t.bgColor){ page.style.background=t.bgColor; }
        else { page.style.background='linear-gradient(160deg,#eef1f5,#f7f7fa)'; }
    }
    function swTopbar(title){
        var _backStyle = (typeof _swCustomBackImg !== 'undefined' && _swCustomBackImg) ? 'style="background-image:url(\''+_swCustomBackImg+'\');background-size:cover;background-position:center;"' : '';
        var _menuStyle = (typeof _swCustomMenuImg !== 'undefined' && _swCustomMenuImg) ? 'style="background-image:url(\''+_swCustomMenuImg+'\');background-size:cover;background-position:center;"' : '';
        var _backContent = (typeof _swCustomBackImg !== 'undefined' && _swCustomBackImg) ? '' : '‹';
        var _menuContent = (typeof _swCustomMenuImg !== 'undefined' && _swCustomMenuImg) ? '' : '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
        return '<div class="sw-topbar">'+
            '<div class="sw-tb-back" onclick="swBack()" '+_backStyle+'>'+_backContent+'</div>'+
            '<div class="sw-tb-title">'+(title||'一起写歌')+'</div>'+
            '<div class="sw-tb-menu" onclick="swOpenMenu()" '+_menuStyle+'>'+_menuContent+'</div>'+
            '</div>';
    }
    function swRender(html, attach){ var c=document.getElementById('songwriteAppContent'); c.innerHTML=html; swApplyTheme(); if(attach) attach(); }

    /* ---- 起始页 ---- */
    function swShowStart(){
        swCleanup(); swState.title=''; swState.partnerName=''; swState.partnerId=null;
        var h=swTopbar('一起写歌');
        h+='<div class="sw-wrap" style="text-align:center;padding-top:36px;">';
        h+='<div class="sw-glass"><div class="sw-title">一起写一首我们的歌</div><div class="sw-glass-text">从歌名到旋律，每一笔都由你们共同落下</div></div>';
        h+='<div class="sw-btn" style="max-width:240px;" onclick="swPushNav(swShowStart);swSelectPartner()">开始写歌</div>';
        h+='<div class="sw-btn ghost" style="max-width:240px;" onclick="swPushNav(swShowStart);swShowSongs()">我的歌单</div>';
        h+='<div class="sw-btn ghost" style="max-width:240px;" onclick="swPushNav(swShowStart);swShowLibrary()">字库管理</div>';
        h+='</div>';
        swRender(h);
    }

    /* ---- 选择合作者 ---- */
    function swSelectPartner(){
        swCleanup();
        var h=swTopbar('选择合作者');
        h+='<div class="sw-wrap"><div class="sw-step">选择和谁一起写歌</div>';
        h+='<div class="sw-glass"><div class="sw-title">邀请谁一起创作？</div><div class="sw-glass-text">选择一位联系人，与Ta共同谱写旋律</div></div>';
        var contacts = [];
        try {
            contacts = (appData.contactList && appData.contactList.contacts) || [];
        } catch(e) {}
        h+='<div class="sw-partner-list" id="swPartnerList">';
        /* 已有联系人：有几个显示几个，不再额外添加「默认对方」 */
        if (contacts.length > 0) {
            for (var i = 0; i < contacts.length; i++) {
                var c = contacts[i];
                if (!c || !c.id) continue;
                var cname = c.name || c.nickname || '联系人';
                h+='<div class="sw-partner-item" onclick="swSetPartner(\''+c.id+'\',\''+swEsc(cname)+'\')">';
                h+='<div class="sw-partner-avatar">'+swPartnerAvatar(c.avatar||'')+'</div>';
                h+='<div class="sw-partner-name">'+swEsc(cname)+'</div>';
                h+='</div>';
            }
        } else {
            h+='<div class="sw-glass" style="text-align:center;padding:30px 0;"><div class="sw-glass-text">还没有联系人，请先在聊天中添加联系人</div></div>';
        }
        /* 手动输入 */
        h+='<div class="sw-partner-item sw-partner-custom" onclick="swCustomPartner()">';
        h+='<div class="sw-partner-avatar sw-partner-add">+</div>';
        h+='<div class="sw-partner-name">自定义昵称</div>';
        h+='</div>';
        h+='</div>';
        h+='</div>';
        swRender(h);
    }
    function swSetPartner(id, name){
        swState.partnerId = id || null;
        swState.partnerName = name || '';
        swStep1();
    }
    function swCustomPartner(){
        var h=swTopbar('自定义合作者');
        h+='<div class="sw-wrap"><div class="sw-step">输入合作者昵称</div>';
        h+='<div class="sw-glass"><div class="sw-glass-text">请输入你想一起写歌的人的昵称</div>';
        h+='<input class="sw-name-input" id="swCustomPartnerInput" maxlength="20" placeholder="输入昵称" onkeydown="if(event.key===\'Enter\')swConfirmCustomPartner()"/>';
        h+='<div class="sw-btn" style="max-width:180px;" onclick="swConfirmCustomPartner()">确定</div></div></div>';
        swRender(h, function(){ var inp=document.getElementById('swCustomPartnerInput'); if(inp){ inp.focus(); setTimeout(function(){ inp.focus(); },100); } });
    }
    function swConfirmCustomPartner(){
        var inp=document.getElementById('swCustomPartnerInput');
        var v=inp.value.trim();
        if(!v){ swToast('请输入昵称'); return; }
        swState.partnerId=null;
        swState.partnerName=v;
        swStep1();
    }
    function swPartnerAvatar(avatar){
        if(avatar) return '<img src="'+avatar+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>';
        return '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z"/></svg>';
    }
    function swEsc(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

    /* ===== 第一步：确定歌名字数 ===== */
    function swStep1(){
        swCleanup();
        swState.myLenChoice=0; swState.taLenChoice=0;
        var h=swTopbar('第一步 · 字数');
        h+='<div class="sw-wrap"><div class="sw-step">第 1 步 / 共 4 步</div>';
        h+='<div class="sw-glass"><div class="sw-title">歌名几个字？</div><div class="sw-glass-text">请双方选择歌曲名字为几个字，同时揭晓</div></div>';
        h+='<div class="sw-chips" id="swLenChips">';
        [3,4,5,6].forEach(function(n){ h+='<div class="sw-chip" data-len="'+n+'" onclick="swPickLen('+n+')">'+n+'个字</div>'; });
        h+='</div>';
        h+='<div class="sw-glass small" id="swLenStatus" style="text-align:center;font-size:13px;color:#8a8a8a;min-height:30px;"></div>';
        h+='</div>';
        swRender(h);
    }
    function swPickLen(n){
        if(swState.myLenChoice) return;
        swState.myLenChoice=n;
        document.querySelectorAll('#swLenChips .sw-chip').forEach(function(el){ if(parseInt(el.dataset.len)===n) el.classList.add('on'); });
        var st=document.getElementById('swLenStatus');
        var left=30;
        st.innerHTML='你选择了 '+n+' 个字，等待'+swOther()+'选择… 还剩 '+left+' 秒 <span onclick="swTaPickLen()" style="color:#2b7fd6;cursor:pointer;margin-left:6px;">立即揭晓</span>';
        swState.phaseTimer=setInterval(function(){
            left--;
            if(left<=0){ clearInterval(swState.phaseTimer); swState.phaseTimer=null; swTaPickLen(); return; }
            st.innerHTML='你选择了 '+n+' 个字，等待'+swOther()+'选择… 还剩 '+left+' 秒 <span onclick="swTaPickLen()" style="color:#2b7fd6;cursor:pointer;margin-left:6px;">立即揭晓</span>';
        },1000);
    }
    function swTaPickLen(){
        if(swState.phaseTimer){ clearInterval(swState.phaseTimer); swState.phaseTimer=null; }
        if(!swState.taLenChoice) swState.taLenChoice=[3,4,5,6][Math.floor(Math.random()*4)];
        var st=document.getElementById('swLenStatus');
        if(swState.myLenChoice===swState.taLenChoice){
            swState.nameLen=swState.myLenChoice;
            st.innerHTML='默契！你们都选择了 '+swState.nameLen+' 个字';
            setTimeout(function(){ swStep2(); }, 1300);
        } else {
            st.innerHTML='你选 '+swState.myLenChoice+' 字，'+swOther()+' 选 '+swState.taLenChoice+' 字，不一致，听谁的？';
            var chips=document.getElementById('swLenChips');
            chips.innerHTML='<div class="sw-chip" onclick="swResolveLen(\'me\')">听你的（'+swState.myLenChoice+'字）</div><div class="sw-chip" onclick="swResolveLen(\'ta\')">听'+swOther()+'的（'+swState.taLenChoice+'字）</div>';
        }
    }
    function swResolveLen(who){
        swState.nameLen=who==='me'?swState.myLenChoice:swState.taLenChoice;
        document.getElementById('swLenStatus').innerHTML='最终确定歌名为 '+swState.nameLen+' 个字';
        setTimeout(function(){ swStep2(); }, 900);
    }

    /* ===== 第二步：逐字确定歌名 ===== */
    function swStep2(){
        swState.nameChars=[]; swState.charIdx=0; swState.charTurn='me';
        swRenderStep2();
    }
    function swNamePreviewHtml(){
        var h='';
        for(var i=0;i<swState.nameLen;i++){
            if(i<swState.nameChars.length) h+='<div class="sw-name-char filled">'+swState.nameChars[i]+'</div>';
            else if(i===swState.charIdx) h+='<div class="sw-name-char cur">?</div>';
            else h+='<div class="sw-name-char"></div>';
        }
        return h;
    }
    function swRenderStep2(){
        var title='第二步 · 歌名';
        if(swState.charIdx>=swState.nameLen){
            swState.title=swState.nameChars.join('');
            var h=swTopbar(swState.title);
            h+='<div class="sw-wrap"><div class="sw-step">第 2 步 / 共 4 步</div>';
            h+='<div class="sw-glass"><div class="sw-title">歌名已确定</div><div class="sw-name-preview">'+swNamePreviewHtml()+'</div><div class="sw-glass-text">歌名：《'+swState.title+'》</div></div>';
            h+='<div class="sw-btn" style="max-width:220px;" onclick="swPushNav(function(){swState.charIdx=swState.nameLen;swRenderStep2();});swStep3()">下一步：选择时长</div></div>';
            swRender(h); return;
        }
        var who=swState.charTurn==='me'?swMe():swOther();
        var h=swTopbar(title);
        h+='<div class="sw-wrap"><div class="sw-step">第 2 步 / 共 4 步 · 第 '+(swState.charIdx+1)+' / '+swState.nameLen+' 字</div>';
        h+='<div class="sw-glass"><div class="sw-name-preview">'+swNamePreviewHtml()+'</div></div>';
        if(swState.charTurn==='me'){
            h+='<div class="sw-glass"><div class="sw-glass-text">轮到你了，请输入第 '+(swState.charIdx+1)+' 个字</div>';
            h+='<input class="sw-name-input" id="swCharInput" maxlength="1" placeholder="输入一个字" onkeydown="if(event.key===\'Enter\')swSubmitChar()"/>';
            h+='<div class="sw-btn" style="max-width:180px;" onclick="swSubmitChar()">确定</div></div>';
            swRender(h,function(){ var inp=document.getElementById('swCharInput'); if(inp){ inp.focus(); setTimeout(function(){ inp.focus(); },100); } });
        } else {
            h+='<div class="sw-glass"><div class="sw-glass-text">'+swOther()+' 正在从字库中抽取第 '+(swState.charIdx+1)+' 个字…</div>';
            h+='<div class="sw-countdown" id="swTaChar">·</div></div>';
            swRender(h,function(){ swTaPickChar(); });
        }
    }
    function swSubmitChar(){
        var inp=document.getElementById('swCharInput');
        var v=inp.value.trim();
        if(!v){ swToast('请输入一个字'); return; }
        swState.nameChars.push(v.charAt(0));
        swState.charIdx++;
        swState.charTurn='ta';
        swRenderStep2();
    }
    function swTaPickChar(){
        var lib=swVisibleLib(); if(!lib.length) lib=['爱','梦','星','光','风'];
        var dots=0, el=document.getElementById('swTaChar');
        var dotT=setInterval(function(){ dots++; if(el) el.innerHTML='正在抽取 '+'·'.repeat(dots%4+1); },300);
        swState.taTimer=setTimeout(function(){
            clearInterval(dotT);
            var ch=lib[Math.floor(Math.random()*lib.length)];
            swState.nameChars.push(ch);
            swState.charIdx++;
            swState.charTurn='me';
            swRenderStep2();
        }, 1600);
    }

    /* ===== 第三步：选择总时长 + 谁先画 ===== */
    function swStep3(){
        swState.myTimeChoice=null; swState.taTimeChoice=null;
        var h=swTopbar(swState.title||'第三步');
        h+='<div class="sw-wrap"><div class="sw-step">第 3 步 / 共 4 步</div>';
        h+='<div class="sw-glass"><div class="sw-title">选择创作总时长</div><div class="sw-glass-text">双方各自选择，取平均值后就近确定</div></div>';
        h+='<div class="sw-chips" id="swTimeChips">';
        SW_TIME_OPTS.forEach(function(o,i){ h+='<div class="sw-chip" data-i="'+i+'" onclick="swPickTime('+i+')">'+o.label+'</div>'; });
        h+='</div>';
        h+='<div class="sw-glass small" id="swTimeStatus" style="text-align:center;font-size:13px;color:#8a8a8a;min-height:30px;"></div>';
        h+='</div>';
        swRender(h);
    }
    function swPickTime(i){
        if(swState.myTimeChoice!==null) return;
        swState.myTimeChoice=i;
        document.querySelectorAll('#swTimeChips .sw-chip').forEach(function(el){ if(parseInt(el.dataset.i)===i) el.classList.add('on'); });
        document.getElementById('swTimeStatus').innerHTML='你选择了 '+SW_TIME_OPTS[i].label+'，等待'+swOther()+'选择…';
        swState.taTimer=setTimeout(function(){
            swState.taTimeChoice=Math.floor(Math.random()*SW_TIME_OPTS.length);
            var avg=(swState.myTimeChoice+swState.taTimeChoice)/2;
            var nearest=SW_TIME_OPTS.reduce(function(b,o,idx){ return Math.abs(idx-avg)<Math.abs(b-avg)?idx:b; },0);
            swState.timeOpt=SW_TIME_OPTS[nearest];
            document.getElementById('swTimeStatus').innerHTML='你 '+SW_TIME_OPTS[swState.myTimeChoice].label+'，'+swOther()+' '+SW_TIME_OPTS[swState.taTimeChoice].label+' → 取 '+swState.timeOpt.label;
            setTimeout(function(){ swStep3b(); }, 1300);
        }, 1400);
    }
    function swStep3b(){
        var h=swTopbar(swState.title||'第三步');
        h+='<div class="sw-wrap"><div class="sw-step">第 3 步 / 共 4 步</div>';
        h+='<div class="sw-glass"><div class="sw-title">谁先开始绘画？</div><div class="sw-glass-text">总时长 '+swState.timeOpt.label+' · 共 '+swState.timeOpt.strokes+' 次绘画</div></div>';
        h+='<div class="sw-chips">';
        h+='<div class="sw-chip" onclick="swResolveFirst(\'me\')">我先来</div>';
        h+='<div class="sw-chip" onclick="swResolveFirst(\'ta\')">Ta先来</div>';
        h+='</div></div>';
        swRender(h);
    }
    function swResolveFirst(who){ swState.firstPlayer=who; swStartCreation(); }

    /* ===== 创作主循环 ===== */
    function swStartCreation(){
        swInitData();
        swState.totalStrokes=swState.timeOpt.strokes;
        swState.duration=swState.timeOpt.sec;
        swState.canvasPct=swState.timeOpt.pct;
        swState.round=0; swState.strokes=[]; swState.roundStrokes=[];
        swState.drums=[]; swState.drumAlt=0;
        swState.curAuthor=swState.firstPlayer;
        swNextRound();
    }
    function swNextRound(){
        swCleanup();
        if(swState.round>=swState.totalStrokes){ swFinishCreation(); return; }
        swState.round++;
        swState.curAuthor = (swState.round%2===1) ? swState.firstPlayer : (swState.firstPlayer==='me'?'ta':'me');
        swState.roundStrokes=[]; swState.eraseMode=false; swState.curInst='piano'; swState.curColor='#FFFFFF';
        if(swState.curAuthor==='me') swPhaseInstrument();
        else swTaRound();
    }
    function swRoundHeader(phase){
        var who=swState.curAuthor==='me'?swMe():swOther();
        var pct=Math.round((swState.round-1)/swState.totalStrokes*100);
        var h=swTopbar(swState.title||'创作中');
        h+='<div class="sw-wrap"><div class="sw-turn"><span class="sw-turn-badge '+(swState.curAuthor==='ta'?'ta':'')+'">'+who+'的回合</span><span>第 '+swState.round+' / '+swState.totalStrokes+' 次</span></div>';
        h+='<div class="sw-progress"><div class="sw-progress-bar" style="width:'+pct+'%"></div></div>';
        h+='<div class="sw-progress-txt">已完成 '+(swState.round-1)+' / '+swState.totalStrokes+'</div>';
        h+='<div class="sw-glass"><div class="sw-glass-text">'+phase+'</div></div>';
        return h;
    }

    /* 阶段一：选乐器（5秒） */
    function swPhaseInstrument(){
        var h=swRoundHeader('请选择你的乐器');
        h+='<div class="sw-countdown" id="swPhaseCd"></div>';
        h+='<div class="sw-inst-scroll" id="swInstScroll">';
        SW_INSTS.forEach(function(it){ h+='<div class="sw-inst-card" data-key="'+it.key+'" onclick="swPickInst(\''+it.key+'\')"><div class="sw-inst-ic">'+it.svg+'</div><div class="sw-inst-nm">'+it.name+'</div><div class="sw-inst-en">'+it.en+'</div></div>'; });
        h+='</div></div>';
        swRender(h);
        swRunPhase(5, function(){ swPickInst('piano'); });
    }
    function swPickInst(key){
        if(swState.phaseTimer){ clearInterval(swState.phaseTimer); swState.phaseTimer=null; }
        /* Bug13修复：切换乐器前停止当前正在发声的 osc，避免旧音符持续鸣响 */
        if(swState.osc){ swStopOsc(swState.osc); swState.osc=null; }
        swState.curInst=key; swResumeAudio();
        document.querySelectorAll('#swInstScroll .sw-inst-card').forEach(function(el){ el.classList.toggle('on', el.dataset.key===key); });
        setTimeout(function(){ swPhaseColor(); }, 220);
    }
    /* 阶段二：选颜色（5秒） */
    function swPhaseColor(){
        var t=swTheme(); var colors=(t.warmColors||[]).concat(t.coolColors||[]);
        var h=swRoundHeader('请选择你的画笔颜色');
        h+='<div class="sw-countdown" id="swPhaseCd"></div>';
        h+='<div class="sw-color-row" id="swColorRow">';
        colors.forEach(function(c,i){ h+='<div class="sw-color-dot" data-c="'+c+'" style="background:'+c+';" onclick="swPickColor(\''+c+'\')"></div>'; });
        h+='</div></div>';
        swRender(h);
        swRunPhase(5, function(){ swPickColor('#FFFFFF'); });
    }
    function swPickColor(c){
        if(swState.phaseTimer){ clearInterval(swState.phaseTimer); swState.phaseTimer=null; }
        swState.curColor=c;
        document.querySelectorAll('#swColorRow .sw-color-dot').forEach(function(el){ el.classList.toggle('on', el.dataset.c===c); });
        setTimeout(function(){ swPhaseDraw(); }, 220);
    }
    function swRunPhase(sec, onTimeout){
        var left=sec; var el=document.getElementById('swPhaseCd');
        if(el) el.innerHTML='还剩 <b>'+left+'</b> 秒';
        swState.phaseTimer=setInterval(function(){
            left--;
            if(el) el.innerHTML='还剩 <b>'+left+'</b> 秒';
            if(left<=0){ clearInterval(swState.phaseTimer); swState.phaseTimer=null; onTimeout(); }
        },1000);
    }

    /* 阶段三：绘画（10秒） */
    function swPhaseDraw(){
        var vh=window.innerHeight, vw=window.innerWidth;
        swState.canvasH=Math.round(vh*swState.canvasPct);
        swState.canvasW=Math.min(Math.round(vw*0.92), Math.round(swState.canvasH*1.5));
        var h=swRoundHeader('请开始你的绘画');
        h+='<div class="sw-countdown" id="swPhaseCd"></div>';
        h+='<div class="sw-canvas-wrap"><div class="sw-canvas-box"><canvas class="sw-canvas" id="swDrawCanvas"></canvas><canvas id="swGlowCanvas" style="position:absolute;top:0;left:0;pointer-events:none;z-index:2;"></canvas></div>';
        h+='<div class="sw-canvas-tools">';
        h+='<div class="sw-tool on" id="swToolPen" onclick="swToggleErase(false)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg></div>';
        h+='<div class="sw-tool" id="swToolEraser" onclick="swToggleErase(true)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 20H7L3 16a2 2 0 010-3l9-9a2 2 0 013 0l6 6a2 2 0 010 3l-5 5"/><path d="M15 7l-8 8"/></svg></div>';
        h+='</div>';
        h+='<div class="sw-btn ghost" style="max-width:200px;margin-top:12px;font-size:13px;padding:8px 16px;" onclick="swEarlyFinish()">提前结束创作</div>';
        h+='</div></div>';
        swRender(h, function(){ swInitDrawCanvas(); });
        swRunPhase(10, function(){ swEndRound(); });
    }
    function swInitDrawCanvas(){
        var cv=document.getElementById('swDrawCanvas'); if(!cv) return;
        var dpr=window.devicePixelRatio||1;
        cv.style.width=swState.canvasW+'px'; cv.style.height=swState.canvasH+'px';
        cv.width=swState.canvasW*dpr; cv.height=swState.canvasH*dpr;
        var ctx=cv.getContext('2d'); ctx.scale(dpr,dpr);
        ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=4;
        /* 70/30 分区背景：上 70% 旋律区，下 30% 打击垫 */
        swDrawCanvasBg(ctx);
        swState._cv=cv; swState._ctx=ctx; swState.drawing=false; swState._melodyTouchId=null;
        /* 光晕叠加层：独立 canvas，每帧清空重绘，不影响主画布笔触 */
        var glowCv=document.getElementById('swGlowCanvas');
        if(glowCv){
            glowCv.style.width=swState.canvasW+'px'; glowCv.style.height=swState.canvasH+'px';
            glowCv.width=swState.canvasW*dpr; glowCv.height=swState.canvasH*dpr;
            swState._glowCv=glowCv; swState._glowCtx=glowCv.getContext('2d');
            swState._glowCtx.scale(dpr,dpr);
        }
        var inDrumArea=function(y){ return y > swState.canvasH*0.7; };
        var getPos=function(e, touch){
            var r=cv.getBoundingClientRect(); var cx, cy;
            if(touch){ cx=touch.clientX; cy=touch.clientY; }
            else if(e.touches && e.touches.length){ cx=e.touches[0].clientX; cy=e.touches[0].clientY; }
            else { cx=e.clientX; cy=e.clientY; }
            return {x:cx-r.left, y:cy-r.top};
        };
        /* 触摸：支持多指（一指画旋律 + 另一指敲鼓） */
        var tdown=function(e){
            e.preventDefault(); swResumeAudio();
            for(var i=0;i<e.changedTouches.length;i++){
                var t=e.changedTouches[i]; var p=getPos(e,t);
                if(inDrumArea(p.y)){ swAddDrumBeat(p); }            /* 下 30%：鼓点 */
                else if(!swState.drawing){                          /* 上 70%：旋律笔触 */
                    swState._melodyTouchId=t.identifier; swBeginStroke(p);
                }
            }
        };
        var tmove=function(e){
            e.preventDefault(); if(!swState.drawing) return;
            for(var i=0;i<e.changedTouches.length;i++){
                var t=e.changedTouches[i];
                if(t.identifier===swState._melodyTouchId){ swMoveStroke(getPos(e,t)); break; }
            }
        };
        var tup=function(e){
            e.preventDefault();
            for(var i=0;i<e.changedTouches.length;i++){
                if(e.changedTouches[i].identifier===swState._melodyTouchId){
                    swState._melodyTouchId=null; swEndStroke(); break;
                }
            }
        };
        /* 鼠标：上 70% 旋律 / 下 30% 鼓点（swBeginStroke 内部判断分区） */
        var mdown=function(e){ e.preventDefault(); swResumeAudio(); swBeginStroke(getPos(e)); };
        var mmove=function(e){ e.preventDefault(); if(!swState.drawing) return; swMoveStroke(getPos(e)); };
        var mup=function(e){ e.preventDefault(); swEndStroke(); };
        cv.addEventListener('touchstart',tdown,{passive:false});
        cv.addEventListener('touchmove',tmove,{passive:false});
        cv.addEventListener('touchend',tup,{passive:false});
        cv.addEventListener('touchcancel',tup,{passive:false});
        cv.addEventListener('mousedown',mdown);
        cv.addEventListener('mousemove',mmove);
        window.addEventListener('mouseup',mup);
        swState._upHandler=mup;
    }
    function swToggleErase(on){
        swState.eraseMode=on;
        var p=document.getElementById('swToolPen'), e=document.getElementById('swToolEraser');
        if(p) p.classList.toggle('on',!on); if(e) e.classList.toggle('on',on);
        if(on){
            if(swState.osc){ swStopOsc(swState.osc); swState.osc=null; }
            if(swState.pressTimer){ clearTimeout(swState.pressTimer); swState.pressTimer=null; }
            swStopGlow();
            swState.longPress=false;
        }
    }
    function swBeginStroke(p){
        /* 下 30% 区域：打击垫，不开始笔触，改为创建鼓点 */
        if(p.y > swState.canvasH*0.7){ swAddDrumBeat(p); return; }
        swState.drawing=true; swState.strokeStart=performance.now();
        /* 无重叠：先停掉上一个还在响的音符 */
        if(swState.osc){ swStopOsc(swState.osc); swState.osc=null; }
        swState.longPress=false; swState.pressStartTime=performance.now();
        if(swState.pressTimer){ clearTimeout(swState.pressTimer); swState.pressTimer=null; }
        var ctx=swState._ctx;
        if(swState.eraseMode){
            ctx.globalCompositeOperation='destination-out';
            ctx.lineWidth=22;
        } else {
            ctx.globalCompositeOperation='source-over';
            ctx.strokeStyle=swState.curColor; ctx.lineWidth=4;
            ctx.beginPath(); ctx.moveTo(p.x,p.y);
            /* 立即播放短音（0.3s自动停止），同时启动长按检测 */
            var f0=swY2Freq(p.y);
            swState.osc=swStartOsc(f0, swState.curInst, 0.3);
            /* 长按检测：500ms 后切换为持续音模式，音量为短音的 0.7 倍 */
            swState.pressTimer=setTimeout(function(){
                if(!swState.drawing) return;
                swState.longPress=true;
                if(swState.osc){ swStopOsc(swState.osc); }
                swState.osc=swStartSustain(f0, swState.curInst, null, 0.7);
                swStartGlow(p);
            }, 500);
        }
        swState.curStroke={ author:swState.curAuthor, instrument:swState.curInst, color:swState.curColor, erase:swState.eraseMode, points:[{x:p.x,y:p.y}], timestamps:[0] };
    }
    function swMoveStroke(p){
        var ctx=swState._ctx; var t=(performance.now()-swState.strokeStart)/1000;
        if(swState.eraseMode){ ctx.lineTo(p.x,p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x,p.y); }
        else { ctx.lineTo(p.x,p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x,p.y); }
        swState.curStroke.points.push({x:p.x,y:p.y}); swState.curStroke.timestamps.push(parseFloat(t.toFixed(3)));
        /* 长按模式下：音高跟随手指滑动 */
        if(swState.longPress && swState.osc && swState.osc.setFreq){
            var f=swY2Freq(p.y);
            swState.osc.setFreq(f);
        }
        /* 更新光晕位置 */
        if(swState.longPress){ swState.glowPos={x:p.x,y:p.y}; }
    }
    function swEndStroke(){
        if(!swState.drawing) return; swState.drawing=false;
        var ctx=swState._ctx; ctx.globalCompositeOperation='source-over';
        /* 清除长按定时器 */
        if(swState.pressTimer){ clearTimeout(swState.pressTimer); swState.pressTimer=null; }
        if(!swState.longPress && !swState.eraseMode){
            /* 短按（500ms内抬起）：触发0.3秒短音 */
            if(swState.curStroke && swState.curStroke.points.length){
                var lastP=swState.curStroke.points[swState.curStroke.points.length-1];
                var f=swY2Freq(lastP.y);
                if(swState.osc){ swStopOsc(swState.osc); }
                swState.osc=swStartOsc(f, swState.curInst, 0.3);
            }
        } else if(swState.longPress){
            /* 长按结束：停止持续音 + 光晕 */
            if(swState.osc){ swStopOsc(swState.osc); swState.osc=null; }
            swStopGlow();
        }
        swState.longPress=false;
        if(swState.curStroke && swState.curStroke.points.length){
            swState.roundStrokes.push(swState.curStroke);
        }
        swState.curStroke=null;
    }
    /* 长按光晕效果：画布出现光晕扩散 + 手指周围光点跟随（独立叠加层） */
    function swStartGlow(p){
        swState.glowPos={x:p.x,y:p.y};
        swState.glowParticles=[];
        swState.glowRipples=[];
        for(var i=0;i<8;i++){
            swState.glowParticles.push({
                angle:(Math.PI*2/8)*i+Math.random()*0.3,
                radius:18+Math.random()*12,
                speed:0.04+Math.random()*0.03,
                alpha:0.8,
                size:2.5+Math.random()*2
            });
        }
        if(swState.glowAnim) cancelAnimationFrame(swState.glowAnim);
        swGlowLoop();
    }
    function swGlowLoop(){
        if(!swState.longPress || !swState._glowCtx){ return; }
        var gctx=swState._glowCtx;
        var W=swState.canvasW, H=swState.canvasH;
        gctx.clearRect(0,0,W,H);
        var p=swState.glowPos||{x:0,y:0};
        /* 随机产生扩散波纹 */
        if(Math.random()<0.18){
            swState.glowRipples.push({x:p.x,y:p.y,r:10,alpha:0.5});
        }
        /* 波纹扩散动画 */
        for(var i=swState.glowRipples.length-1;i>=0;i--){
            var rp=swState.glowRipples[i];
            rp.r+=2; rp.alpha-=0.018;
            if(rp.alpha<=0){ swState.glowRipples.splice(i,1); continue; }
            gctx.beginPath();
            gctx.arc(rp.x,rp.y,rp.r,0,Math.PI*2);
            gctx.strokeStyle='rgba(255,255,255,'+rp.alpha+')';
            gctx.lineWidth=2; gctx.stroke();
        }
        /* 中心径向光晕 */
        var grad=gctx.createRadialGradient(p.x,p.y,0,p.x,p.y,35);
        grad.addColorStop(0,'rgba(255,255,255,0.35)');
        grad.addColorStop(0.5,'rgba(255,255,255,0.12)');
        grad.addColorStop(1,'rgba(255,255,255,0)');
        gctx.fillStyle=grad;
        gctx.fillRect(p.x-35,p.y-35,70,70);
        /* 光点环绕手指 */
        swState.glowParticles.forEach(function(pt){
            pt.angle+=pt.speed;
            var px=p.x+Math.cos(pt.angle)*pt.radius;
            var py=p.y+Math.sin(pt.angle)*pt.radius;
            gctx.beginPath();
            gctx.arc(px,py,pt.size,0,Math.PI*2);
            gctx.fillStyle='rgba(255,255,255,'+pt.alpha+')';
            gctx.fill();
            /* 光点外发光 */
            gctx.beginPath();
            gctx.arc(px,py,pt.size*2,0,Math.PI*2);
            gctx.fillStyle='rgba(255,255,255,'+(pt.alpha*0.25)+')';
            gctx.fill();
        });
        swState.glowAnim=requestAnimationFrame(swGlowLoop);
    }
    function swStopGlow(){
        if(swState.glowAnim){ cancelAnimationFrame(swState.glowAnim); swState.glowAnim=null; }
        if(swState._glowCtx){ try{ swState._glowCtx.clearRect(0,0,swState.canvasW,swState.canvasH); }catch(e){} }
        swState.glowPos=null;
        swState.glowParticles=[];
        swState.glowRipples=[];
    }
    function swEndRound(){
        swEndStroke();
        if(swState.phaseTimer){ clearInterval(swState.phaseTimer); swState.phaseTimer=null; }
        if(swState._upHandler){ window.removeEventListener('mouseup', swState._upHandler); swState._upHandler=null; }
        if(swState.pressTimer){ clearTimeout(swState.pressTimer); swState.pressTimer=null; }
        if(swState.osc){ swStopOsc(swState.osc); swState.osc=null; }
        swStopGlow();
        swState.longPress=false;
        // 把本回合笔触并入总数据
        swState.roundStrokes.forEach(function(s){ swState.strokes.push(s); });
        swNextRound();
    }

    /* Ta 的回合：系统模拟 */
    function swTaRound(){
        // 选乐器
        var inst=SW_INSTS[Math.floor(Math.random()*SW_INSTS.length)];
        swState.curInst=inst.key;
        var colorArr=(swTheme().warmColors||[]).concat(swTheme().coolColors||[]);
        swState.curColor=colorArr[Math.floor(Math.random()*colorArr.length)]||'#FFFFFF';
        var h=swRoundHeader(swOther()+' 正在创作…');
        h+='<div class="sw-canvas-wrap"><div class="sw-canvas-box"><canvas class="sw-canvas" id="swDrawCanvas"></canvas></div></div></div>';
        swRender(h, function(){ swTaDraw(); });
    }
    function swTaDraw(){
        swResumeAudio();
        var cv=document.getElementById('swDrawCanvas'); if(!cv){ swEndTaRound(); return; }
        var dpr=window.devicePixelRatio||1;
        swState.canvasH=Math.round(window.innerHeight*swState.canvasPct);
        swState.canvasW=Math.min(Math.round(window.innerWidth*0.92), Math.round(swState.canvasH*1.5));
        cv.style.width=swState.canvasW+'px'; cv.style.height=swState.canvasH+'px';
        cv.width=swState.canvasW*dpr; cv.height=swState.canvasH*dpr;
        var ctx=cv.getContext('2d'); ctx.scale(dpr,dpr);
        ctx.lineCap='round'; ctx.lineJoin='round';
        /* 70/30 分区背景 */
        swDrawCanvasBg(ctx);
        swState._cv=cv; swState._ctx=ctx;
        // 5% 概率擦除重画
        var willErase=(Math.random()<0.05);
        var melodyH=swState.canvasH*0.7;
        var actionCount=3+Math.floor(Math.random()*4); /* 3-6 个动作 */
        var i=0;
        function doAction(){
            if(i>=actionCount){ swEndTaRound(); return; }
            i++;
            if(Math.random()<0.5){
                /* 旋律笔触（限定在上 70% 旋律区） */
                ctx.globalCompositeOperation='source-over';
                ctx.strokeStyle=swState.curColor; ctx.lineWidth=4;
                ctx.beginPath();
                var x=Math.random()*swState.canvasW, y=Math.random()*melodyH;
                ctx.moveTo(x,y);
                var pts=[{x:x,y:y}]; var ts=[0]; var sStart=performance.now();
                /* 固定0.3s音符，量化音高 */
                var f=swY2Freq(y); swStartOsc(f, swState.curInst, 0.3);
                var segs=6+Math.floor(Math.random()*10); var si=0;
                var stepT=setInterval(function(){
                    si++;
                    x=Math.max(0,Math.min(swState.canvasW, x+(Math.random()-0.5)*60));
                    y=Math.max(0,Math.min(melodyH, y+(Math.random()-0.5)*60));
                    ctx.lineTo(x,y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x,y);
                    pts.push({x:x,y:y}); ts.push(parseFloat(((performance.now()-sStart)/1000).toFixed(3)));
                    if(si>=segs){ clearInterval(stepT);
                        swState.roundStrokes.push({author:'ta',instrument:swState.curInst,color:swState.curColor,erase:false,points:pts,timestamps:ts});
                        if(willErase && i===1){ // 擦除重画
                            ctx.globalCompositeOperation='destination-out'; ctx.lineWidth=30;
                            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(swState.canvasW,swState.canvasH); ctx.stroke();
                            ctx.globalCompositeOperation='source-over';
                            swState.roundStrokes.push({author:'ta',instrument:swState.curInst,color:swState.curColor,erase:true,points:[{x:0,y:0},{x:swState.canvasW,y:swState.canvasH}],timestamps:[0,0.2]});
                        }
                        setTimeout(doAction, 250);
                    }
                }, 180);
            } else {
                /* 鼓点：随机 hi-hat / bass drum，0.3s 渐显动画 */
                var type=Math.random()<0.5?'hihat':'kick';
                swPlayDrum(type);
                var px=Math.random()*swState.canvasW;
                var py=melodyH+Math.random()*(swState.canvasH*0.3);
                swState.drums.push({type:type, x:px/(swState.canvasW||1), y:py/(swState.canvasH||1), time:performance.now()/1000, author:'ta'});
                swTaDrumAnim(ctx, px, py, type, function(){ setTimeout(doAction, 250); });
            }
        }
        doAction();
    }
    /* AI 鼓点 0.3s 渐显动画：半径与透明度递增，最终落定实心标记 */
    function swTaDrumAnim(ctx, x, y, type, done){
        var color = type==='hihat' ? '#f39c12' : '#e0607a';
        var steps=8, s=0, target=7;
        var t=setInterval(function(){
            s++;
            ctx.save();
            ctx.globalCompositeOperation='source-over';
            ctx.globalAlpha=Math.min(1, s/steps);
            ctx.beginPath();
            ctx.arc(x, y, target*(s/steps), 0, Math.PI*2);
            ctx.fillStyle=color; ctx.fill();
            ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.stroke();
            ctx.restore();
            if(s>=steps){ clearInterval(t); swDrawDrumMarkerAt(ctx, x, y, type, 'ta'); if(done) done(); }
        }, 38); /* ~0.3s */
    }
    function swEndTaRound(){
        if(swState.osc){ swStopOsc(swState.osc); swState.osc=null; }
        swState.roundStrokes.forEach(function(s){ swState.strokes.push(s); });
        swState.taTimer=setTimeout(function(){ swNextRound(); }, 600);
    }

    /* 提前结束创作：保存当前笔触后直接进入完结界面 */
    function swEarlyFinish(){
        swEndStroke();
        if(swState.phaseTimer){ clearInterval(swState.phaseTimer); swState.phaseTimer=null; }
        if(swState.pressTimer){ clearTimeout(swState.pressTimer); swState.pressTimer=null; }
        if(swState.osc){ swStopOsc(swState.osc); swState.osc=null; }
        swStopGlow();
        if(swState._upHandler){ window.removeEventListener('mouseup', swState._upHandler); swState._upHandler=null; }
        /* 保存当前回合的笔触 */
        swState.roundStrokes.forEach(function(s){ swState.strokes.push(s); });
        swState.roundStrokes=[];
        swFinishCreation();
    }

    /* ===== 创作完成 → 保存 ===== */
    function swFinishCreation(){
        swCleanup();
        if(!swState.strokes.length){
            var h=swTopbar(swState.title||'创作完成');
            h+='<div class="sw-wrap"><div class="sw-glass"><div class="sw-title">创作完成</div><div class="sw-glass-text" style="color:#e0607a;">还没有落下任何笔触，再来一次吧</div></div>';
            h+='<div class="sw-btn" style="max-width:200px;" onclick="swStep3()">再来一次</div>';
            h+='<div class="sw-btn ghost" style="max-width:200px;" onclick="swBack()">返回</div></div>';
            swRender(h); return;
        }
        var song={
            id:Date.now(),
            title:swState.title||'未命名',
            authors:[swMe(), swOther()],
            date:swFormatDate(new Date()),
            duration:swState.duration,
            durationLabel:swState.timeOpt.label,
            totalStrokes:swState.totalStrokes,
            canvasW:swState.canvasW, canvasH:swState.canvasH,
            strokes:swState.strokes.map(function(s){ return JSON.parse(JSON.stringify(s)); }),
            drums:swState.drums.map(function(d){ return JSON.parse(JSON.stringify(d)); }),
            // Translated song data
            melody: [],    // Quantized melody notes (one per beat)
            drumPattern: [], // Drum pattern
            chords: [],    // Chord progression
            tempo: 120     // BPM
        };
        swTranslateSong(song);
        appData.songwriteData.songs.push(song); swSave();
        // 创作完成赚钱逻辑：根据选择的总时长，双方各自获得对应金额，直接存入余额App
        var _swReward = (swState.timeOpt && swState.timeOpt.reward) ? swState.timeOpt.reward : 0;
        if (_swReward > 0) {
            try {
                addBalanceRecord('mine', _swReward, '一起写歌创作·' + (swState.timeOpt.label || ''));
                addBalanceRecord('other', _swReward, '一起写歌创作·' + (swState.timeOpt.label || ''));
            } catch(e) { console.error('[写歌]余额发放失败:', e); }
        }
        var melody=song.strokes.filter(function(s){return !s.erase;}).map(function(s){ var mid=s.points[Math.floor(s.points.length/2)]||s.points[0]; return swFreqToNote(swY2Freq(mid.y, song.canvasH)); }).join(' ');
        var h=swTopbar(song.title);
        h+='<div class="sw-wrap"><div class="sw-step">第 4 步 / 共 4 步</div>';
        h+='<div class="sw-glass"><div class="sw-title">创作完成</div></div>';
        h+='<div class="sw-card">';
        h+='<div class="rw"><span class="k">歌曲名称</span><span class="v">'+song.title+'</span></div>';
        h+='<div class="rw"><span class="k">创作者</span><span class="v">'+song.authors.join(' + ')+'</span></div>';
        h+='<div class="rw"><span class="k">创作时长</span><span class="v">'+song.durationLabel+'</span></div>';
        h+='<div class="rw"><span class="k">创作收益</span><span class="v" style="color:#2e7d32;font-weight:600;">双方各 +¥'+(_swReward||0)+'</span></div>';
        h+='<div class="rw"><span class="k">绘画次数</span><span class="v">'+song.totalStrokes+' 次</span></div>';
        h+='<div class="rw"><span class="k">笔触数</span><span class="v">'+song.strokes.length+'</span></div>';
        h+='<div class="rw"><span class="k">创作日期</span><span class="v">'+song.date+'</span></div>';
        h+='<div class="rw"><span class="k">旋律</span><span class="v" style="font-size:12px;">'+melody+'</span></div>';
        h+='</div>';
        h+='<div class="sw-btn" style="max-width:220px;" onclick="swPushNav(swShowStart);swPlaySaved(-1)">播放回放</div>';
        h+='<div class="sw-btn ghost" style="max-width:220px;" onclick="swPushNav(swShowStart);swShowSongs()">进入歌单</div>';
        h+='<div class="sw-btn ghost" style="max-width:220px;" onclick="swShowStart()">再写一首</div></div>';
        swRender(h);
        // 记录刚保存的歌曲索引，供“播放回放”
        swState._lastIdx=appData.songwriteData.songs.length-1;
    }
    /* 翻译歌曲数据：把笔触/鼓点量化为 4/4 拍结构（120 BPM，每拍 0.5s） */
    function swTranslateSong(song){
        var beat=0.5;            // 120 BPM → 每拍 0.5s
        var tempo=120;
        song.tempo=tempo;
        var canvasH=song.canvasH||swState.canvasH||300;
        /* 1. 旋律：按笔触顺序（每个 0.3s）量化到拍，取笔触中点音符 */
        var notesByBeat={};
        var maxBeat=0;
        var off=0;
        (song.strokes||[]).forEach(function(st){
            if(st.erase){ off+=0.3; return; }
            var mid=st.points[Math.floor(st.points.length/2)]||st.points[0];
            var freq=swY2Freq(mid.y, canvasH);
            var beatIdx=Math.round(off/beat);
            notesByBeat[beatIdx]=swFreqToNote(freq);
            if(beatIdx>maxBeat) maxBeat=beatIdx;
            off+=0.3;
        });
        var melody=[];
        for(var b=0;b<=maxBeat;b++){ melody.push(notesByBeat[b]||null); } /* null = 休止 */
        song.melody=melody;
        /* 2. 鼓点：按顺序交替排到拍上 */
        var drumPattern=[];
        (song.drums||[]).forEach(function(d,i){
            drumPattern.push({beat:i, type:d.type||'hihat'});
            if(i>maxBeat) maxBeat=i;
        });
        song.drumPattern=drumPattern;
        /* 3. 和弦进行：C-Am-F-G，每小节 4 拍一个和弦 */
        var prog=[{name:'C',root:261.63},{name:'Am',root:220.00},{name:'F',root:349.23},{name:'G',root:392.00}];
        var chords=[];
        var numBars=Math.max(1, Math.ceil((maxBeat+1)/4));
        for(var bar=0;bar<numBars;bar++){ var c=prog[bar%4]; chords.push({bar:bar, name:c.name, root:c.root}); }
        song.chords=chords;
    }
    // 兼容：从完成页播放
    function swPlaySaved(idx){
        var realIdx = idx<0 ? (swState._lastIdx!=null?swState._lastIdx:appData.songwriteData.songs.length-1) : idx;
        swShowPlayer(realIdx);
    }

    /* ===== 字库管理 ===== */
    function swShowLibrary(){
        swInitData();
        var lib=appData.songwriteData.library;
        var h=swTopbar('字库管理');
        h+='<div class="sw-wrap"><div class="sw-glass"><div class="sw-glass-text">'+swOther()+' 的回合将从字库随机抽取汉字（隐藏的字不参与）</div></div>';
        h+='<div class="sw-glass"><div style="font-size:13px;font-weight:600;margin-bottom:6px;color:var(--sw-font);">批量上传（一行一个或多个汉字）</div>';
        h+='<textarea class="sw-name-input" id="swLibUpload" rows="3" style="font-size:15px;max-width:100%;" placeholder="爱&#10;梦&#10;星光"></textarea>';
        h+='<div class="sw-btn" style="max-width:120px;margin-top:8px;" onclick="swUploadLib()">上传</div></div>';
        h+='<div class="sw-glass"><div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--sw-font);">字库列表（'+lib.length+' 个）</div>';
        h+='<div style="display:flex;flex-wrap:wrap;gap:8px;max-height:260px;overflow-y:auto;">';
        lib.forEach(function(ch,i){ var op=ch.hidden?'opacity:0.4;':''; h+='<div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.6);padding:6px 8px;border-radius:10px;'+op+'"><span style="font-size:18px;color:var(--sw-font);cursor:pointer;" onclick="swEditChar('+i+')">'+ch.text+'</span><span style="font-size:11px;color:#2b7fd6;cursor:pointer;" onclick="swToggleHide('+i+')">'+(ch.hidden?'显示':'隐藏')+'</span><span style="font-size:11px;color:#e0607a;cursor:pointer;" onclick="swDeleteChar('+i+')">删</span></div>'; });
        h+='</div></div>';
        h+='<div class="sw-btn ghost" style="max-width:160px;" onclick="swBack()">返回</div></div>';
        swRender(h);
    }
    function swUploadLib(){
        var ta=document.getElementById('swLibUpload'); if(!ta) return;
        var ex={}; appData.songwriteData.library.forEach(function(c){ex[c.text]=true;});
        ta.value.split('\n').forEach(function(line){ for(var i=0;i<line.length;i++){ var ch=line.charAt(i); if(ch.trim()&&!ex[ch]){ appData.songwriteData.library.push({text:ch,hidden:false,builtin:false}); ex[ch]=true; } } });
        swSave(); swShowLibrary();
    }
    function swToggleHide(i){ appData.songwriteData.library[i].hidden=!appData.songwriteData.library[i].hidden; swSave(); swShowLibrary(); }
    function swDeleteChar(i){ appData.songwriteData.library.splice(i,1); swSave(); swShowLibrary(); }
    function swEditChar(i){ var v=prompt('修改为：',appData.songwriteData.library[i].text); if(v!==null&&v.trim()){ appData.songwriteData.library[i].text=v.trim().charAt(0); swSave(); swShowLibrary(); } }

    /* ===== 歌单 ===== */
    var swPlayer={ idx:-1, playing:false, t:0, duration:0, raf:0, osc:null, activeIdx:-1, strokes:[], song:null, loop:false, lastDrawn:0 };
    function swShowSongs(){
        swInitData(); swStopPlayer();
        var songs=appData.songwriteData.songs||[];
        var h=swTopbar('我的歌单');
        h+='<div class="sw-wrap"><div class="sw-songs-head"><span class="t">我创建的歌单</span><span class="c">共 '+songs.length+' 首</span></div>';
        if(!songs.length){ h+='<div class="sw-glass" style="text-align:center;padding:40px 0;"><div class="sw-glass-text">还没有保存的歌曲，去写一首吧</div></div>'; }
        else {
            for(var k=songs.length-1;k>=0;k--){
                var s=songs[k]; var playing=(swPlayer.idx===k&&swPlayer.playing);
                var stitle=s.title||s.name||'未命名';
                var smeta=(s.authors?s.authors.join(' + '):(s.lyricist||''))+' · '+(s.date||'')+' · '+(s.durationLabel||swTimeLabel(s.duration)||'');
                h+='<div class="sw-song-item-wrap'+(s.hidden?' hidden':'')+'" data-idx="'+k+'">';
                h+='<div class="sw-song-actions left"><span onclick="swDeleteSong('+k+')">删除</span></div>';
                h+='<div class="sw-song-actions right"><span onclick="swHideSong('+k+')">'+(s.hidden?'显示':'隐藏')+'</span></div>';
                h+='<div class="sw-song-item" onclick="swPushNav(swShowSongs);swShowPlayer('+k+')">';
                h+='<span class="sw-song-num'+(playing?' playing':'')+'">'+(songs.length-k)+'</span>';
                h+='<div class="sw-song-info"><div class="sw-song-name">'+stitle+(s.hidden?' <span class="sw-song-tag">已隐藏</span>':'')+'</div><div class="sw-song-meta">'+smeta+'</div></div>';
                h+='<span class="sw-song-arrow">›</span></div>';
                h+='</div>';
            }
        }
        h+='<div class="sw-btn ghost" style="max-width:160px;margin-top:14px;" onclick="swBack()">返回</div></div>';
        swRender(h, function(){
            document.querySelectorAll('.sw-song-item-wrap').forEach(function(el){ swBindSongSwipe(el); });
        });
    }
    /* 左滑显示删除+隐藏 / 右滑关闭操作（同时支持触摸与鼠标） */
    function swBindSongSwipe(el){
        var sx=0, sy=0, dx=0, dragging=false, isTouch=false;
        function start(x,y){ sx=x; sy=y; dragging=true; dx=0; }
        function move(x,y){ if(!dragging) return; dx=x-sx; var dy=y-sy; if(Math.abs(dx)>Math.abs(dy)){ 
            if(el.classList.contains('show-actions')){
                // 已展开：允许右滑关闭，限制范围
                var tx=Math.min(0, dx-160); 
                el.querySelector('.sw-song-item').style.transform='translateX('+tx+'px)';
            } else {
                // 未展开：只允许左滑，禁止右滑
                var tx=Math.min(0, dx);
                el.querySelector('.sw-song-item').style.transform='translateX('+tx+'px)';
            }
        } }
        function end(){
            if(!dragging) return; dragging=false;
            el.querySelector('.sw-song-item').style.transform='';
            if(el.classList.contains('show-actions')){
                // 已展开时：右滑超过60px关闭
                if(dx>60) el.classList.remove('show-actions');
            } else {
                // 未展开时：左滑超过60px展开两个按钮
                if(dx<-60) el.classList.add('show-actions');
            }
        }
        el.addEventListener('touchstart',function(e){ isTouch=true; start(e.touches[0].clientX,e.touches[0].clientY); },{passive:true});
        el.addEventListener('touchmove',function(e){ if(!dragging) return; dx=e.touches[0].clientX-sx; var dy=e.touches[0].clientY-sy; if(Math.abs(dx)>Math.abs(dy)){ e.preventDefault(); } move(e.touches[0].clientX,e.touches[0].clientY); },{passive:false});
        el.addEventListener('touchend',function(e){ isTouch=false; end(); });
        el.addEventListener('mousedown',function(e){ isTouch=false; start(e.clientX,e.clientY); });
        document.addEventListener('mousemove',function(e){ if(!dragging || isTouch) return; move(e.clientX,e.clientY); });
        document.addEventListener('mouseup',function(e){ if(!dragging || isTouch) return; end(); });
        // 点击歌曲项时关闭操作按钮（不在touchstart上关闭，避免干扰滑动）
        var item=el.querySelector('.sw-song-item');
        if(item){
            item.addEventListener('click',function(){ el.classList.remove('show-actions'); });
        }
    }
    function swDeleteSong(idx){
        if(!confirm('确定删除这首歌？')) return;
        appData.songwriteData.songs.splice(idx,1); swSave(); swShowSongs();
    }
    function swHideSong(idx){
        var s=appData.songwriteData.songs[idx]; if(!s) return;
        s.hidden=!s.hidden; swSave(); swShowSongs();
    }

    /* ===== 播放器（仿网易云，视频式回放） ===== */
    function swShowPlayer(idx){
        swInitData(); swStopPlayer();
        var songs=appData.songwriteData.songs||[];
        var s=songs[idx]; if(!s){ swBack(); return; }
        if(!s.strokes || !s.strokes.length){
            var fh=swTopbar(s.title||s.name||'歌曲');
            fh+='<div class="sw-wrap"><div class="sw-glass" style="text-align:center;padding:40px 10px;"><div class="sw-title">无法回放</div><div class="sw-glass-text">该歌曲为旧版本数据，缺少绘画过程，无法视频回放。<br>请用新版本重新创作一首。</div></div>';
            fh+='<div class="sw-btn ghost" style="max-width:180px;" onclick="swBack()">返回歌单</div></div>';
            swRender(fh); return;
        }
        swPlayer.idx=idx; swPlayer.song=s; swPlayer.playing=false; swPlayer.t=0; swPlayer.activeIdx=-1; swPlayer.lastDrawn=0;
        swSetupPlayerAudio();
        // 计算时间轴：每笔固定0.3s，无间隔，节奏由笔画数决定
        var off=0; swPlayer.strokes=[];
        (s.strokes||[]).forEach(function(st){
            var origDur=st.timestamps.length?st.timestamps[st.timestamps.length-1]:0.3;
            swPlayer.strokes.push({s:st, start:off, dur:0.3, origDur:origDur, _played:false});
            off+=0.3;
        });
        swPlayer.duration=Math.max(0.5, off);
        /* 鼓点 / 和弦时间表（回放时伴奏） */
        swPlayer.drums=[]; swPlayer.chords=[];
        var beat=0.5;
        if(s.drumPattern && s.drumPattern.length){
            s.drumPattern.forEach(function(dp){ swPlayer.drums.push({time:dp.beat*beat, type:dp.type, _played:false}); });
        } else if(s.drums && s.drums.length){
            s.drums.forEach(function(d,i){ swPlayer.drums.push({time:i*beat, type:d.type||'hihat', _played:false}); });
        }
        if(s.chords && s.chords.length){
            s.chords.forEach(function(c){ swPlayer.chords.push({time:c.bar*4*beat, root:c.root, name:c.name, _played:false, dur:4*beat}); });
        } else {
            var _numBeats=Math.max(1, Math.ceil(swPlayer.duration/beat));
            var _numBars=Math.max(1, Math.ceil(_numBeats/4));
            var _prog=[{name:'C',root:261.63},{name:'Am',root:220.00},{name:'F',root:349.23},{name:'G',root:392.00}];
            for(var _bar=0;_bar<_numBars;_bar++){ var _c=_prog[_bar%4]; swPlayer.chords.push({time:_bar*4*beat, root:_c.root, name:_c.name, _played:false, dur:4*beat}); }
        }
        swPlayer.chords.forEach(function(c){ var e=c.time+c.dur; if(e>swPlayer.duration) swPlayer.duration=e; });
        var melody=swPlayer.strokes.filter(function(x){return !x.s.erase;}).map(function(x){ var mid=x.s.points[Math.floor(x.s.points.length/2)]||x.s.points[0]; return swFreqToNote(swY2Freq(mid.y, s.canvasH)); });
        var h=swTopbar(s.title);
        h+='<div class="sw-player">';
        h+='<div class="sw-player-stage" id="swStage"><canvas id="swReplayCanvas"></canvas><div class="sw-stage-cnt" id="swStageCnt">0 / '+(s.strokes||[]).length+'</div><div class="sw-stage-progress"><i id="swStageBar"></i></div></div>';
        h+='<div class="sw-player-name">'+s.title+'</div>';
        h+='<div class="sw-player-meta">'+s.authors.join(' + ')+' · '+s.date+'</div>';
        var savedReverb='none';
        try{ savedReverb=localStorage.getItem('swReverbType')||'none'; }catch(e){}
        h+='<div class="sw-reverb-row" id="swReverbRow">';
        SW_REVERBS.forEach(function(r,i){ h+='<div class="sw-reverb-btn'+(r.key===savedReverb?' on':'')+'" data-key="'+r.key+'" onclick="swPickReverb(\''+r.key+'\')">'+r.name+'</div>'; });
        h+='</div>';
        h+='<div class="sw-player-prog"><div class="sw-player-bar" id="swBar"><i id="swBarFill"></i></div><div class="sw-player-time"><span id="swCurT">0:00</span><span id="swTotT">'+swFmtTime(swPlayer.duration)+'</span></div></div>';
        h+='<div class="sw-player-ctrls">';
        h+='<span class="sw-pbtn" onclick="swPlayerPrev()"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><rect x="5" y="4" width="2" height="16"/></svg></span>';
        h+='<span class="sw-pbtn play" id="swPlayBtn" onclick="swTogglePlay()"><svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" id="swPlayIcon"><polygon points="6 3 20 12 6 21 6 3"/></svg></span>';
        h+='<span class="sw-pbtn" onclick="swPlayerNext()"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><rect x="17" y="4" width="2" height="16"/></svg></span>';
        h+='<span class="sw-pbtn loop" id="swLoopBtn" onclick="swToggleLoop()" title="循环模式"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></span>';
        h+='</div>';
        h+='<div class="sw-player-melody"><div class="mt">旋律</div><div class="sw-melody-list">'+(melody.length?melody.map(function(n){return '<span>'+n+'</span>';}).join(''):'<span style="color:#bbb;">无</span>')+'</div></div>';
        h+='</div>';
        swRender(h, function(){ swInitReplayCanvas(); swBarBind(); setTimeout(function(){ swSetReverb(savedReverb); },100); });
    }
    function swInitReplayCanvas(){
        var stage=document.getElementById('swStage'); var cv=document.getElementById('swReplayCanvas'); if(!cv||!stage) return;
        var s=swPlayer.song;
        var w=stage.clientWidth; var ratio=s.canvasH/(s.canvasW||1); var h=Math.round(w*ratio);
        cv.style.width=w+'px'; cv.style.height=h+'px';
        var dpr=window.devicePixelRatio||1; cv.width=w*dpr; cv.height=h*dpr;
        var ctx=cv.getContext('2d'); ctx.scale(dpr,dpr);
        ctx.lineCap='round'; ctx.lineJoin='round'; ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
        swPlayer._cv=cv; swPlayer._ctx=ctx; swPlayer._w=w; swPlayer._h=h; swPlayer._sx=w/(s.canvasW||1); swPlayer._sy=h/(s.canvasH||1);
        swPlayer._pen={}; // strokeIdx -> last drawn point index
    }
    function swBarBind(){
        var bar=document.getElementById('swBar'); if(!bar) return;
        var seek=function(e){ var r=bar.getBoundingClientRect(); var x=(e.touches?e.touches[0].clientX:e.clientX)-r.left; var p=Math.max(0,Math.min(1,x/r.width)); swSeek(p*swPlayer.duration); };
        var dragging=false;
        bar.addEventListener('mousedown',function(e){ dragging=true; seek(e); });
        window.addEventListener('mousemove',function(e){ if(dragging) seek(e); });
        window.addEventListener('mouseup',function(){ dragging=false; });
        bar.addEventListener('touchstart',function(e){ dragging=true; seek(e); },{passive:true});
        bar.addEventListener('touchmove',function(e){ if(dragging) seek(e); },{passive:true});
        bar.addEventListener('touchend',function(){ dragging=false; });
    }
    function swFmtTime(sec){ sec=Math.max(0,Math.floor(sec)); var m=Math.floor(sec/60), s2=sec%60; return m+':'+(s2<10?'0':'')+s2; }
    function swTogglePlay(){ swPlayer.playing?swPause():swPlay(); }
    function swToggleLoop(){ swPlayer.loop=!swPlayer.loop; var b=document.getElementById('swLoopBtn'); if(b) b.classList.toggle('on',swPlayer.loop); }
    function swPlay(){
        if(swPlayer.t>=swPlayer.duration) swPlayer.t=0;
        /* 播放按钮点击是用户手势：如果 context 不在 running，直接强制重建 */
        var c=swAudio();
        if(!c || c.state!=='running'){
            swForceResumeAudio();
            c=swState.audioCtx;
        }
        /* 仍然不是 running 则提示用户 */
        if(!c || c.state!=='running'){
            swShowAudioFix();
            return;
        }
        swPlayer.playing=true; swUpdatePlayIcon();
        swPlayer._perf0=performance.now(); swPlayer._t0=swPlayer.t;
        swReplayFrame();
    }
    function swPause(){
        swPlayer.playing=false; swUpdatePlayIcon();
        if(swPlayer.raf){ cancelAnimationFrame(swPlayer.raf); swPlayer.raf=0; }
        swPlayer.activeIdx=-1;
    }
    function swStopPlayer(){ swPause(); swPlayer.t=0; swPlayer.lastDrawn=0; swPlayer._masterGain=null; swPlayer._convolver=null; swPlayer._wetGain=null; swPlayer._reverbType='none'; }
    function swUpdatePlayIcon(){ var ic=document.getElementById('swPlayIcon'); if(!ic) return; ic.innerHTML=swPlayer.playing?'<rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/>':'<polygon points="6 3 20 12 6 21 6 3"/>'; }
    function swPlayerPrev(){ var n=appData.songwriteData.songs.length; if(n){ swStopPlayer(); swShowPlayer((swPlayer.idx-1+n)%n); } }
    function swPlayerNext(){ var n=appData.songwriteData.songs.length; if(n){ swStopPlayer(); swShowPlayer((swPlayer.idx+1)%n); } }

    function swReplayFrame(){
        if(!swPlayer.playing) return;
        swPlayer.t=swPlayer._t0+(performance.now()-swPlayer._perf0)/1000;
        if(swPlayer.t>=swPlayer.duration){
            swDrawUpTo(swPlayer.duration);
            swUpdateProgress(swPlayer.duration);
            swPlayer.playing=false; swUpdatePlayIcon();
            if(swPlayer.loop){ swPlayer.t=0; swClearStage(); swPlayer._pen={}; swPlayer.lastDrawn=0; swPlayer.strokes.forEach(function(it){it._played=false;}); if(swPlayer.drums) swPlayer.drums.forEach(function(d){d._played=false;}); if(swPlayer.chords) swPlayer.chords.forEach(function(c){c._played=false;}); setTimeout(function(){ swPlay(); },300); }
            return;
        }
        swDrawUpTo(swPlayer.t);
        swUpdateActiveSound(swPlayer.t);
        swUpdateProgress(swPlayer.t);
        swPlayer.raf=requestAnimationFrame(swReplayFrame);
    }
    function swDrawUpTo(t){
        var ctx=swPlayer._ctx; if(!ctx) return;
        for(var i=0;i<swPlayer.strokes.length;i++){
            var item=swPlayer.strokes[i]; var st=item.s;
            if(item.start>t) break;
            var pen=swPlayer._pen[i]||0;
            var localT=t-item.start;
            /* 将0.3s的播放时间映射到原始绘制时间轴，确保整笔在0.3s内画完 */
            var origDur=item.origDur||0.3;
            var scaledT=origDur>0.001 ? Math.min(origDur, (localT/0.3)*origDur) : origDur;
            var pts=st.points;
            if(st.erase){ ctx.globalCompositeOperation='destination-out'; ctx.lineWidth=22; }
            else { ctx.globalCompositeOperation='source-over'; ctx.strokeStyle=st.color; ctx.lineWidth=4; }
            ctx.beginPath();
            ctx.moveTo(pts[0].x*swPlayer._sx, pts[0].y*swPlayer._sy);
            var j=1;
            for(;j<pts.length;j++){ if(st.timestamps[j]>scaledT) break; ctx.lineTo(pts[j].x*swPlayer._sx, pts[j].y*swPlayer._sy); pen=j; }
            ctx.stroke();
            ctx.globalCompositeOperation='source-over';
            swPlayer._pen[i]=pen;
        }
        swPlayer.lastDrawn=t;
    }
    function swClearStage(){ var ctx=swPlayer._ctx; if(!ctx) return; ctx.globalCompositeOperation='source-over'; ctx.fillStyle='#fff'; ctx.fillRect(0,0,swPlayer._w,swPlayer._h); }
    function swUpdateActiveSound(t){
        /* 每个笔触到达起始时间时播放固定0.3s音符（量化音高，无滑音） */
        for(var i=0;i<swPlayer.strokes.length;i++){
            var it=swPlayer.strokes[i];
            if(it.s.erase) continue;
            if(!it._played && t>=it.start){
                it._played=true;
                var p=it.s.points[0];
                swStartOsc(swY2Freq(p.y, swPlayer.song.canvasH), it.s.instrument, 0.3, swPlayer._masterGain);
                swPlayer.activeIdx=i;
            }
        }
        /* 鼓点：到达计划时间即播放 */
        if(swPlayer.drums){
            for(var j=0;j<swPlayer.drums.length;j++){
                var d=swPlayer.drums[j];
                if(!d._played && t>=d.time){ d._played=true; swPlayDrum(d.type); }
            }
        }
        /* 和弦伴奏：每小节起始处播放 */
        if(swPlayer.chords){
            for(var k=0;k<swPlayer.chords.length;k++){
                var c=swPlayer.chords[k];
                if(!c._played && t>=c.time){ c._played=true; swPlayChord(c.root, c.dur); }
            }
        }
    }
    function swUpdateProgress(t){
        var p=swPlayer.duration>0?t/swPlayer.duration:0;
        var fill=document.getElementById('swBarFill'); if(fill) fill.style.width=(p*100)+'%';
        var sb=document.getElementById('swStageBar'); if(sb) sb.style.width=(p*100)+'%';
        var ct=document.getElementById('swCurT'); if(ct) ct.textContent=swFmtTime(t);
        var cnt=document.getElementById('swStageCnt'); if(cnt){ var done=0; for(var i=0;i<swPlayer.strokes.length;i++){ if(swPlayer.strokes[i].start<=t) done++; } cnt.textContent=done+' / '+swPlayer.strokes.length; }
    }
    function swSeek(newT){
        var wasPlaying=swPlayer.playing;
        swPause();
        swPlayer.t=Math.max(0,Math.min(swPlayer.duration,newT));
        // 重置播放标记，已过时间的标记为已播放
        swPlayer.strokes.forEach(function(it){ it._played = it.start <= swPlayer.t; });
        if(swPlayer.drums) swPlayer.drums.forEach(function(d){ d._played = d.time <= swPlayer.t; });
        if(swPlayer.chords) swPlayer.chords.forEach(function(c){ c._played = c.time <= swPlayer.t; });
        // 重绘到该时刻
        swClearStage(); swPlayer._pen={};
        swDrawUpTo(swPlayer.t);
        swUpdateProgress(swPlayer.t);
        if(wasPlaying) swPlay();
    }

    /* ===== 顶部菜单：自定义 ===== */
    function swOpenMenu(){
        if(document.getElementById('swMenuModal')) return;
        swInitData(); var t=swTheme();
        var m=document.createElement('div'); m.className='sw-modal'; m.id='swMenuModal';
        m.innerHTML='<div class="sw-modal-card">'+
            '<div class="sw-modal-title">界面自定义</div>'+
            '<div class="sw-menu-item" onclick="swMenuPick(\'btnColor\')"><div class="mi-l"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="8" width="18" height="8" rx="3"/></svg>修改按钮颜色</div><div class="sw-color-pick"><input type="color" id="swBtnColor" value="'+(t.btnColor||'#1a1a1a')+'" onchange="swSetBtnColor(this.value)"></div></div>'+
            '<div class="sw-menu-item" onclick="swMenuPick(\'btnTextColor\')"><div class="mi-l"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>修改按钮文字颜色</div><div class="sw-color-pick"><input type="color" id="swBtnTextColor" value="'+(t.btnTextColor||'#ffffff')+'" onchange="swSetBtnTextColor(this.value)"></div></div>'+
            '<div class="sw-menu-item" onclick="swMenuPick(\'bgColor\')"><div class="mi-l"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>修改背景颜色</div><div class="sw-color-pick"><input type="color" id="swBgColor" value="'+(t.bgColor||'#eef1f5')+'" onchange="swSetBgColor(this.value)"></div></div>'+
            '<div class="sw-menu-item" onclick="swUploadCustomBack()"><div class="mi-l"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 18l-6-6 6-6"/></svg>修改返回键（上传图片）</div><div class="mi-r">'+(typeof _swCustomBackImg!=='undefined'&&_swCustomBackImg?'已设置':'默认')+'</div></div>'+
            '<div class="sw-menu-item" onclick="swResetCustomBack()"><div class="mi-l"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>恢复默认返回键</div></div>'+
            '<div class="sw-menu-item" onclick="swUploadCustomMenu()"><div class="mi-l"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>修改菜单键（上传图片）</div><div class="mi-r">'+(typeof _swCustomMenuImg!=='undefined'&&_swCustomMenuImg?'已设置':'默认')+'</div></div>'+
            '<div class="sw-menu-item" onclick="swResetCustomMenu()"><div class="mi-l"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>恢复默认菜单键</div></div>'+
            '<div class="sw-menu-item" onclick="swUploadBgImg()"><div class="mi-l"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg>修改背景（上传图片）</div><div class="mi-r">'+(t.bgImage?'已设置':'默认')+'</div></div>'+
            '<div class="sw-menu-item" onclick="swMenuPick(\'fontColor\')"><div class="mi-l"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>修改字体颜色</div><div class="sw-color-pick"><input type="color" id="swFontColor" value="'+(t.fontColor||'#222222')+'" onchange="swSetFontColor(this.value)"></div></div>'+
            '<div class="sw-sec-h">绘画区域内置颜色</div>'+
            '<div class="sw-glass small" style="margin:0 4px 8px;"><div style="font-size:12px;color:#8a8a8a;margin-bottom:6px;">暖色系</div><div class="sw-pal-row" id="swWarmRow"></div></div>'+
            '<div class="sw-glass small" style="margin:0 4px 8px;"><div style="font-size:12px;color:#8a8a8a;margin-bottom:6px;">冷色系</div><div class="sw-pal-row" id="swCoolRow"></div></div>'+
            '<div class="sw-close-row"><div class="sw-btn ghost" style="flex:1;margin-top:0;" onclick="swRestoreTheme()">恢复默认</div><div class="sw-btn" style="flex:1;margin-top:0;" onclick="swCloseMenu()">完成</div></div>'+
            '</div>';
        document.body.appendChild(m);
        m.addEventListener('click', function(e){ if(e.target===m) swCloseMenu(); });
        swRenderPalettes();
    }
    function swRenderPalettes(){
        var t=swTheme();
        var renderRow=function(id, arr, key){
            var el=document.getElementById(id); if(!el) return; var h='';
            arr.forEach(function(c,i){ h+='<div class="sw-pal-dot" style="background:'+c+';"><div class="x" onclick="event.stopPropagation();swPalRemove(\''+key+'\','+i+')">×</div></div>'; });
            h+='<div class="sw-pal-add" onclick="swPalAdd(\''+key+'\')">+</div>';
            el.innerHTML=h;
        };
        renderRow('swWarmRow', t.warmColors||[], 'warm');
        renderRow('swCoolRow', t.coolColors||[], 'cool');
    }
    function swPalAdd(key){ var c=prompt('输入颜色（如 #FF6B6B）：','#FF8866'); if(c){ var t=swTheme(); var arr=key==='warm'?(t.warmColors||(t.warmColors=[])):(t.coolColors||(t.coolColors=[])); arr.push(c); swSave(); swRenderPalettes(); } }
    function swPalRemove(key,i){ var t=swTheme(); var arr=key==='warm'?t.warmColors:t.coolColors; if(arr){ arr.splice(i,1); swSave(); swRenderPalettes(); } }
    function swMenuPick(){ /* 占位：颜色用内联 onchange */ }
    function swSetBtnColor(v){ swTheme().btnColor=v; swSave(); swApplyTheme(); }
    function swSetBtnTextColor(v){ swTheme().btnTextColor=v; swSave(); swApplyTheme(); }
    function swSetBgColor(v){ swTheme().bgColor=v; swTheme().bgImage=''; swSave(); swApplyTheme(); swRefreshMenuStatus(); }
    function swSetFontColor(v){ swTheme().fontColor=v; swSave(); swApplyTheme(); }
    function swRefreshMenuStatus(){ var t=swTheme(); var bg=document.getElementById('swBgColor'); if(bg) bg.value=t.bgColor||'#eef1f5'; }
    function swUploadBtnImg(){ var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange=function(){ var f=inp.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ swTheme().btnImage=r.result; swSave(); swApplyTheme(); swCloseMenu(); swOpenMenu(); }; r.readAsDataURL(f); }; inp.click(); }
    function swUploadBgImg(){ var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange=function(){ var f=inp.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ swTheme().bgImage=r.result; swSave(); swApplyTheme(); swCloseMenu(); swOpenMenu(); }; r.readAsDataURL(f); }; inp.click(); }
    function swRestoreTheme(){ appData.songwriteData.theme={ warmColors:SW_WARM_DEF.slice(), coolColors:SW_COOL_DEF.slice() }; swSave(); swApplyTheme(); swCloseMenu(); swOpenMenu(); swToast('已恢复默认'); }
    function swCloseMenu(){ var m=document.getElementById('swMenuModal'); if(m) m.remove(); }

    /* ===== 轻提示 ===== */
    var swToastTimer=null;
    function swToast(msg){
        var old=document.getElementById('swToast'); if(old) old.remove();
        var d=document.createElement('div'); d.id='swToast'; d.className='sw-toast'; d.textContent=msg;
        document.body.appendChild(d);
        if(swToastTimer) clearTimeout(swToastTimer);
        swToastTimer=setTimeout(function(){ d.remove(); }, 1600);
    }

    // ========== 余额应用 ==========
    function openBalanceApp() {
        document.getElementById('balanceAppPage').style.display = 'flex';
        // 恢复上次选择的联系人（持久化在 balanceData 中）
        if (!_balanceContactId && appData.balanceData && appData.balanceData._balanceContactId) {
            var _saved = appData.balanceData._balanceContactId;
            var _contacts = (appData.contactList && appData.contactList.contacts) || [];
            var _found = false;
            for (var i = 0; i < _contacts.length; i++) {
                if (_contacts[i].id === _saved) { _found = true; break; }
            }
            if (_found) _balanceContactId = _saved;
        }
        // Initialize _balanceContactId to first contact if still empty
        if (!_balanceContactId) {
            var contacts = (appData.contactList && appData.contactList.contacts) || [];
            if (contacts.length > 0) _balanceContactId = contacts[0].id || '';
        }
        /* 持久化当前选择 */
        if (appData.balanceData) {
            appData.balanceData._balanceContactId = _balanceContactId;
            if (typeof saveData === 'function') saveData();
        }
        renderBalanceApp();
    }





// ===== 写歌App：自定义返回键/菜单键 =====
var _swCustomBackImg = '';
var _swCustomMenuImg = '';
function swUploadCustomBack() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            _swCustomBackImg = ev.target.result;
            if(window.saveImgDB){ window.saveImgDB('_swCustomBackImg', _swCustomBackImg); }
            else { try { localStorage.setItem('_swCustomBackImg', _swCustomBackImg); } catch(e) {} }
            swApplyCustomButtons();
            alert('返回键图片已更新');
        };
        reader.readAsDataURL(file);
    };
    input.click();
}
function swResetCustomBack() {
    _swCustomBackImg = '';
    if(window.removeImgDB){ window.removeImgDB('_swCustomBackImg'); } else { try { localStorage.removeItem('_swCustomBackImg'); } catch(e) {} }
    swApplyCustomButtons();
    alert('返回键已恢复默认');
}
function swUploadCustomMenu() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            _swCustomMenuImg = ev.target.result;
            if(window.saveImgDB){ window.saveImgDB('_swCustomMenuImg', _swCustomMenuImg); }
            else { try { localStorage.setItem('_swCustomMenuImg', _swCustomMenuImg); } catch(e) {} }
            swApplyCustomButtons();
            alert('菜单键图片已更新');
        };
        reader.readAsDataURL(file);
    };
    input.click();
}
function swResetCustomMenu() {
    _swCustomMenuImg = '';
    if(window.removeImgDB){ window.removeImgDB('_swCustomMenuImg'); } else { try { localStorage.removeItem('_swCustomMenuImg'); } catch(e) {} }
    swApplyCustomButtons();
    alert('菜单键已恢复默认');
}
function swApplyCustomButtons() {
    var backEl = document.querySelector('.sw-tb-back');
    var menuEl = document.querySelector('.sw-tb-menu');
    if (backEl) {
        if (_swCustomBackImg) {
            backEl.style.backgroundImage = 'url(' + _swCustomBackImg + ')';
            backEl.style.backgroundSize = 'cover';
            backEl.style.backgroundPosition = 'center';
            backEl.innerHTML = '';
        } else {
            backEl.style.backgroundImage = '';
            backEl.innerHTML = '\u2039';
        }
    }
    if (menuEl) {
        if (_swCustomMenuImg) {
            menuEl.style.backgroundImage = 'url(' + _swCustomMenuImg + ')';
            menuEl.style.backgroundSize = 'cover';
            menuEl.style.backgroundPosition = 'center';
            menuEl.innerHTML = '';
        } else {
            menuEl.style.backgroundImage = '';
            menuEl.innerHTML = '\u22ee';
        }
    }
}
// 初始化：从 localStorage 恢复自定义按钮
try {
    _swCustomBackImg = localStorage.getItem('_swCustomBackImg') || '';
    _swCustomMenuImg = localStorage.getItem('_swCustomMenuImg') || '';
} catch(e) {}
// 异步从 IndexedDB 恢复（如果 localStorage 中没有）
if(window.loadImgDB){
    window.loadImgDB('_swCustomBackImg', function(v){ if(v && !_swCustomBackImg){ _swCustomBackImg=v; swApplyCustomButtons(); } });
    window.loadImgDB('_swCustomMenuImg', function(v){ if(v && !_swCustomMenuImg){ _swCustomMenuImg=v; swApplyCustomButtons(); } });
}


(function(){
  'use strict';

  /* ============ SVG 图标 ============ */
  var ICON = {
    back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M15 18l-6-6 6-6"/></svg>',
    more:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    moreH:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    play:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M7 5v14l12-7z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    prev:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M18 5v14l-9-7z"/><rect x="4" y="5" width="2.5" height="14" rx="1"/></svg>',
    next:'<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M6 5l9 7-9 7z"/><rect x="17.5" y="5" width="2.5" height="14" rx="1"/></svg>',
    heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M12 21s-7-4.5-9.5-9C1 8.5 3.5 5 6.8 5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3 3.3 0 5.8 3.5 4.3 7-2.5 4.5-9.5 9-9.5 9z"/></svg>',
    heartFill:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" width="100%" height="100%"><path d="M12 21s-7-4.5-9.5-9C1 8.5 3.5 5 6.8 5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3 3.3 0 5.8 3.5 4.3 7-2.5 4.5-9.5 9-9.5 9z"/></svg>',
    comment:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/></svg>',
    share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.6" x2="15.4" y2="6.4"/><line x1="8.6" y1="13.4" x2="15.4" y2="17.6"/></svg>',
    download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    loopList:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    loopOne:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="12" y="15.5" font-size="8" fill="currentColor" stroke="none" text-anchor="middle" font-family="sans-serif" font-weight="700">1</text></svg>',
    shuffle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    person:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    music:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
  };
  function icon(n){return ICON[n]||'';}

  /* ============ 存储 ============ */
  var K = {
    songs:'lt_songs', fav:'lt_favorites', comments:'lt_comments',
    play:'lt_playstate', timer:'lt_timer', reject:'lt_rejectCount', other:'lt_otherName',
    together:'lt_togetherActive', replies:'lt_scheduledReplies', played:'lt_playedSongs',
    settings:'lt_settings', bg:'lt_bgImage', cumTime:'lt_cumulativeTime',
    ltFontColor:'lt_fontColor', ltFontSize:'lt_fontSize', ltBgColor:'lt_bgColor', ltBgImage:'lt_bgImg',
    ltHomeFontColor:'lt_homeFontColor',
    ltProfileBg:'lt_profileBg',
    ltAvatar1:'lt_avatar1', ltAvatar2:'lt_avatar2',
    mwBg:'lt_mwBgImg', mwFontColor:'lt_mwFontColor', mwAvatar1:'lt_mwAvatar1', mwAvatar2:'lt_mwAvatar2',
    togetherAv:'lt_togetherAv',
    profile:'lt_profileData',
    contactId:'lt_contactId'
  };
  function load(key,def){
    /* 先查内存缓存，再查 localStorage */
    if(_ltCache[key]!==undefined) return _ltCache[key];
    try{var v=localStorage.getItem(key);return v===null?def:JSON.parse(v);}catch(e){return def;}
  }
  function save(key,val){
    _ltCache[key]=val;
    var json;
    try{ json=JSON.stringify(val); }catch(e){ return; }
    try{
      localStorage.setItem(key,json);
    }catch(e){
      /* localStorage 空间不足，存入 IndexedDB（30GB配额） */
      if(window.saveImgDB){ window.saveImgDB(key, json); }
      return;
    }
    /* 大数据同步备份到 IndexedDB，确保刷新后可恢复 */
    if(json.length > 5000 && window.saveImgDB){ window.saveImgDB(key, json); }
  }
  var _ltCache={};
  /* 异步从 IndexedDB 恢复数据到内存缓存 */
  function restoreLTFromIDB(){
    if(!window.loadImgDB) return;
    /* 清理可能被 DEFAULT_SONGS 污染的 lt_songs，让 loadImgDB 能从 IDB 恢复真实数据（含MP3链接） */
    try {
      var lsSongs = localStorage.getItem(K.songs);
      if (lsSongs) {
        var parsed = JSON.parse(lsSongs);
        if (Array.isArray(parsed) && parsed.length === 5 && parsed[0] && parsed[0].id === 's1' && !parsed[0].url) {
          localStorage.removeItem(K.songs);
        }
      }
    } catch(e) {}
    Object.keys(K).forEach(function(k){
      var key=K[k];
      window.loadImgDB(key, function(val){
        if(val){
          try{
            var parsed=JSON.parse(val);
            _ltCache[key]=parsed;
            /* 恢复后更新界面 */
            _ltIDBRestored=true;
            try{ _applyIDBRestored(); }catch(e){}
          }catch(e){}
        }
      });
    });
  }
  var _ltIDBRestored=false;
  function _applyIDBRestored(){
    if(!_ltIDBRestored) return;
    /* 更新关键变量 */
    if(_ltCache[K.songs]){ songs=_ltCache[K.songs]; try{localStorage.setItem(K.songs,JSON.stringify(songs));}catch(e){} }
    if(_ltCache[K.settings]){ settings=_ltCache[K.settings]; otherName=settings.otherName||'对方'; }
    if(_ltCache[K.contactId]!==undefined){ ltContactId=_ltCache[K.contactId]; }
    if(_ltCache[K.cumTime]!==undefined){ cumulativeTime=_ltCache[K.cumTime]; }
    if(_ltCache[K.play]){ playstate=_ltCache[K.play]; }
    if(_ltCache[K.comments]){ comments=_ltCache[K.comments]; }
    if(_ltCache[K.fav]){ favorites=_ltCache[K.fav]; }
    if(_ltCache[K.together]!==undefined){ together=_ltCache[K.together]; }
    if(_ltCache[K.played] && !_ltPlayedModified){ playedSongs=_ltCache[K.played]; }
    if(_ltCache[K.profile]){ profileData=_ltCache[K.profile]; }
    /* 恢复头像、背景等大图片数据（base64 数据量大，常被存入 IndexedDB） */
    if(_ltCache[K.bg]!==undefined){ bgImage=_ltCache[K.bg]; }
    if(_ltCache[K.ltFontColor]!==undefined){ ltFontColor=_ltCache[K.ltFontColor]; }
    if(_ltCache[K.ltHomeFontColor]!==undefined){ ltHomeFontColor=_ltCache[K.ltHomeFontColor]; }
    if(_ltCache[K.ltFontSize]!==undefined){ ltFontSize=_ltCache[K.ltFontSize]; }
    if(_ltCache[K.ltBgColor]!==undefined){ ltBgColor=_ltCache[K.ltBgColor]; }
    if(_ltCache[K.ltBgImage]!==undefined){ ltBgImage=_ltCache[K.ltBgImage]; }
    if(_ltCache[K.ltProfileBg]!==undefined){ ltProfileBg=_ltCache[K.ltProfileBg]; }
    if(_ltCache[K.ltAvatar1]!==undefined){ ltAvatar1=_ltCache[K.ltAvatar1]; }
    if(_ltCache[K.ltAvatar2]!==undefined){ ltAvatar2=_ltCache[K.ltAvatar2]; }
    if(_ltCache[K.mwBg]!==undefined){ mwBgImg=_ltCache[K.mwBg]; }
    if(_ltCache[K.mwFontColor]!==undefined){ mwFontColor=_ltCache[K.mwFontColor]; }
    if(_ltCache[K.mwAvatar1]!==undefined){ mwAvatar1=_ltCache[K.mwAvatar1]; }
    if(_ltCache[K.mwAvatar2]!==undefined){ mwAvatar2=_ltCache[K.mwAvatar2]; }
    /* 重新渲染界面 */
    try{ renderProfileCard(); renderPlayer(); renderMini(); updateCenter(); renderList(); updateEndTogetherBtn(); applyLtAppearance(); renderComments(); }catch(e){}
  }

  var DEFAULT_SONGS=[
    {id:'s1',name:'晴天',artist:'周杰伦',url:'',cover:null,duration:269},
    {id:'s2',name:'夜曲',artist:'周杰伦',url:'',cover:null,duration:226},
    {id:'s3',name:'小幸运',artist:'田馥甄',url:'',cover:null,duration:293},
    {id:'s4',name:'起风了',artist:'买辣椒也用券',url:'',cover:null,duration:325},
    {id:'s5',name:'稻香',artist:'周杰伦',url:'',cover:null,duration:223}
  ];
  var LT_FALLBACK_REPLIES=['这首歌好好听','想到你了','今天也在一起听歌呢','旋律一响就想起你','单曲循环了一整天','听到这句就笑了','你是不是也在听','想和你一起看演唱会','这首歌的副歌太绝了','安静的时候听最合适','耳机分你一半','今天的天气适合这首歌','听到前奏就沦陷了','你也喜欢这句歌词吗','一起听到天黑','节奏刚好踩在心跳上','想把这首歌设成你的来电铃声','又是一个听歌的夜晚','这首歌藏着一个故事','陪你听完整张专辑'];

  /* ============ 状态 ============ */
  var songs=load(K.songs,null); if(!songs){songs=DEFAULT_SONGS.slice();}
  var favorites=load(K.fav,[]);
  var comments=load(K.comments,[]);
  var playstate=load(K.play,{currentSongId:null,currentTime:0,isPlaying:false,loopMode:'list'});
  var timerState=load(K.timer,{startTs:null});
  var rejectCount=load(K.reject,0);
  var otherName=load(K.other,'对方');
  var ltContactId=load(K.contactId,null);
  var together=load(K.together,false);
  var scheduledReplies=load(K.replies,[]);
  var playedSongs=load(K.played,[]);
  var _ltPlayedModified=false;
  var settings=load(K.settings,{myName:'我',distance:null,replyDelayMin:1});
  var bgImage=load(K.bg,null);
  var cumulativeTime=load(K.cumTime,0); /* total together time across sessions (seconds) */
  var ltFontColor=load(K.ltFontColor,null);
  var ltHomeFontColor=load(K.ltHomeFontColor,null);
  var ltFontSize=load(K.ltFontSize,null);
  var ltBgColor=load(K.ltBgColor,null);
  var ltBgImage=load(K.ltBgImage,null);
  var ltProfileBg=load(K.ltProfileBg,null);
  var ltAvatar1=load(K.ltAvatar1,null);
  var ltAvatar2=load(K.ltAvatar2,null);
  var mwBgImg=load(K.mwBg,null);
  var mwFontColor=load(K.mwFontColor,null);
  var mwAvatar1=load(K.mwAvatar1,null);
  var mwAvatar2=load(K.mwAvatar2,null);
  if(!settings.distance){settings.distance=Math.floor(Math.random()*1980)+20;save(K.settings,settings);}

  /* 异步从 IndexedDB 恢复大数据（图片等），避免 localStorage 配额不足导致数据丢失 */
  setTimeout(restoreLTFromIDB, 500);

  /* ============ 运行时 ============ */
  var audio=new Audio();
  audio.preload='auto';
  var simTimer=null, timerInterval=null, inviteTimer=null, probScheduled={};
  var currentView='list', listTab='all', listView='home', replyTarget=null, fileCallback=null;
  var inited=false;

  /* ============ DOM ============ */
  function $(id){return document.getElementById(id);}
  function currentSong(){return songs.find(function(s){return s.id===playstate.currentSongId;});}

  /* ============ 工具 ============ */
  function randId(){return 'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
  function pad(n){n=Math.max(0,Math.floor(n));return n<10?'0'+n:''+n;}
  function fmtTime(sec){return pad(sec/60)+':'+pad(sec%60);}
  function escapeHTML(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function randPick(arr){return arr.length?arr[Math.floor(Math.random()*arr.length)]:'';}

  /* ============ toast ============ */
  var toastTimer=null;
  function toast(msg){
    var wrap=$('lt-toast');
    var el=document.createElement('div');
    el.className='lt-toast';
    el.textContent=msg;
    wrap.appendChild(el);
    setTimeout(function(){el.style.transition='opacity .3s,transform .3s';el.style.opacity='0';el.style.transform='translateY(-8px)';setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},300);},2200);
  }

  /* ============ action sheet ============ */
  function promptText(title,defaultVal,cb){
    $('lt-text-title').textContent=title||'输入';
    var inp=$('lt-text-input'); inp.value=defaultVal||'';
    $('lt-text-modal').style.display='flex';
    setTimeout(function(){inp.focus();inp.select();},50);
    var ok=$('lt-text-ok'),cancel=$('lt-text-cancel');
    function cleanup(){
      $('lt-text-modal').style.display='none';
      ok.onclick=null; cancel.onclick=null; inp.onkeydown=null;
    }
    ok.onclick=function(){ var v=inp.value; cleanup(); if(cb)cb(v); };
    cancel.onclick=function(){ cleanup(); };
    inp.onkeydown=function(e){ if(e.key==='Enter'){e.preventDefault();var v=inp.value;cleanup();if(cb)cb(v);} if(e.key==='Escape'){cleanup();} };
  }
  function showSheet(title,items){
    $('lt-sheet-title').textContent=title||'';
    var box=$('lt-sheet-items');box.innerHTML='';
    items.forEach(function(it){
      var d=document.createElement('div');
      d.className='lt-sheet-item'+(it.danger?' danger':'');
      d.textContent=it.label;
      d.onclick=function(){$('lt-sheet').style.display='none';if(it.onClick)it.onClick();};
      box.appendChild(d);
    });
    $('lt-sheet').style.display='flex';
  }
  function hideSheet(){$('lt-sheet').style.display='none';}

  /* ============ 渲染：歌单 ============ */
  function renderList(){
    var box=$('lt-songlist');box.innerHTML='';
    var list=songs;
    if(listTab==='fav') list=songs.filter(function(s){return favorites.indexOf(s.id)>=0;});
    if(!list.length){box.innerHTML='<div class="lt-empty">'+(listTab==='fav'?'还没有收藏的歌曲':'还没有歌曲，点击右上角添加')+'</div>';}
    list.forEach(function(s,i){
      var row=document.createElement('div');
      row.className='lt-song';row.dataset.id=s.id;
      var favDot=favorites.indexOf(s.id)>=0?'<span class="lt-fav-dot"></span>':'';
      var coverInner=s.cover?'<img src="'+escapeHTML(s.cover)+'">':icon('music');
      row.innerHTML='<div class="lt-song-no">'+(i+1)+'</div>'+
        '<div class="lt-song-cover">'+coverInner+'</div>'+
        '<div class="lt-song-info"><div class="lt-song-name">'+favDot+escapeHTML(s.name)+'</div>'+
        '<div class="lt-song-artist">'+escapeHTML(s.artist||'未知歌手')+(s.url?'':' · 模拟')+'</div></div>'+
        '<button class="lt-song-more">'+icon('moreH')+'</button>';
      box.appendChild(row);
    });
    $('lt-playall-count').textContent='共 '+songs.length+' 首';
    /* update entry card subtitles */
    var favSub=$('lt-entry-fav-sub');
    if(favSub) favSub.textContent='共 '+favorites.length+' 首收藏';
    var allSub=$('lt-entry-all-sub');
    if(allSub) allSub.textContent='共 '+songs.length+' 首歌曲';
  }

  /* ============ 渲染：关系卡 ============ */
  /* ============ 仿网易云主页详情：渲染 & 交互 ============ */
  var K_PROFILE=K.profile;
  var profileData=load(K_PROFILE,{name:'你的昵称',date:'点击即可替换文案',follow:32,fans:43,level:8,avatar:null,imgs:[null,null,null,null],bg:null});
  function saveProfileData(){ save(K_PROFILE,profileData); }
  function renderProfileCard(){
    if(!profileData) profileData={name:'你的昵称',date:'点击即可替换文案',follow:32,fans:43,level:8,avatar:null,imgs:[null,null,null,null]};
    var nm=$('lt-profile-name'); if(nm) nm.textContent=profileData.name||'你的昵称';
    var dt=$('lt-profile-date'); if(dt) dt.textContent=profileData.date||'点击即可替换文案';
    var fn=$('lt-stat-follow-num'); if(fn) fn.textContent=profileData.follow!=null?profileData.follow:23;
    var fa=$('lt-stat-fans-num'); if(fa) fa.textContent=profileData.fans!=null?profileData.fans:65;
    var lv=$('lt-stat-level-num'); if(lv) lv.textContent='Lv.'+(profileData.level!=null?profileData.level:8);
    /* avatar handled by applyLtAvatars() */
    var imgs=$('lt-profile-imgs'); if(imgs){
      imgs.querySelectorAll('.lt-profile-img').forEach(function(box,idx){
        var ph=box.querySelector('.lt-profile-img-ph');
        var im=box.querySelector('img');
        if(profileData.imgs&&profileData.imgs[idx]){
          im.src=profileData.imgs[idx].replace(/"/g,'');
          im.style.display='block';
          if(ph) ph.style.display='none';
        }else{
          im.style.display='none';
          im.src='';
          if(ph) ph.style.display='';
        }
      });
    }
  }

  /* ============ 渲染：播放界面 ============ */
  function renderPlayer(){
    var s=currentSong();
    $('lt-player-title').textContent=s?s.name:'未在播放';
    // cover
    $('lt-coverimg').style.backgroundImage=s&&s.cover?'url("'+s.cover.replace(/"/g,'')+'")':'none';
    $('lt-cover-hint').style.display=together?'none':'block';
    updateCenter();
    updatePlayUI();
    updateProgress();
    updateLoopIcon();
    updateLikeIcon();
    renderProfileCard();
  }
  function updateCenter(){
    var center=$('lt-center');
    if(together){center.classList.add('lt-mode-together');
      var comp='0小时0分0秒';
      if(timerState.startTs){
        var el=Math.floor((Date.now()-timerState.startTs)/1000);
        var h=Math.floor(el/3600),m=Math.floor((el%3600)/60),s=el%60;
        comp=h+'小时'+m+'分'+s+'秒';
      }
      $('lt-t-name').textContent=(settings.myName||'我')+'和'+otherName+'一起听歌'+comp;
    }
    else{center.classList.remove('lt-mode-together');}
    $('lt-playerbg').style.backgroundImage=bgImage?'url("'+bgImage.replace(/"/g,'')+'")':'none';
  }
  function updatePlayUI(){
    var s=currentSong();
    var playing=playstate.isPlaying;
    $('lt-play').innerHTML=playing?icon('pause'):icon('play');
    var cover=$('lt-cover');
    if(playing)cover.classList.add('playing');else cover.classList.remove('playing');
    // mini
    var mp=$('lt-mini-play');if(mp)mp.innerHTML=playing?icon('pause'):icon('play');
    renderMini();
  }
  function updateLoopIcon(){
    var m=playstate.loopMode;
    $('lt-loop').innerHTML=m==='single'?icon('loopOne'):m==='random'?icon('shuffle'):icon('loopList');
  }
  function updateLikeIcon(){
    var s=currentSong();
    var on=s&&favorites.indexOf(s.id)>=0;
    $('lt-act-like-icon').innerHTML=on?icon('heartFill'):icon('heart');
    $('lt-act-like').classList.toggle('active',!!on);
  }
  function updateProgress(){
    var s=currentSong();
    var dur=s?s.duration||0:0;
    var cur=playstate.currentTime||0;
    if(s&&s.url&&audio.duration&&!isNaN(audio.duration)) dur=audio.duration;
    $('lt-curtime').textContent=fmtTime(cur);
    $('lt-durtime').textContent=fmtTime(dur);
    var pct=dur?Math.min(100,cur/dur*100):0;
    $('lt-bar-fill').style.width=pct+'%';
    $('lt-bar-dot').style.left=pct+'%';
  }
  function renderMini(){
    var s=currentSong();
    var show=currentView!=='player' && currentView!=='comments' && s;
    $('lt-mini').style.display=show?'flex':'none';
    if(!show)return;
    $('lt-mini-cover').innerHTML=s.cover?'<img src="'+escapeHTML(s.cover)+'">':icon('music');
    $('lt-mini-name').textContent=s.name;
    $('lt-mini-artist').textContent=s.artist||'';
    $('lt-mini-play').innerHTML=playstate.isPlaying?icon('pause'):icon('play');
  }

  /* ============ song list popup (menu button) ============ */
  function showSongPopup(){
    var old=$('lt-song-popup'); if(old) old.remove();
    var popup=document.createElement('div');
    popup.className='lt-song-popup'; popup.id='lt-song-popup';
    var box=document.createElement('div');
    box.className='lt-song-popup-box';
    var title=document.createElement('div');
    title.className='lt-song-popup-title'; title.textContent='歌单 ('+songs.length+'首)';
    box.appendChild(title);
    var list=document.createElement('div');
    list.className='lt-song-popup-list';
    if(!songs.length){ list.innerHTML='<div class="lt-empty">还没有歌曲</div>'; }
    songs.forEach(function(s,i){
      var item=document.createElement('div');
      item.className='lt-song-popup-item'+(s.id===playstate.currentSongId?' active':'');
      item.innerHTML='<div class="lt-song-no">'+(i+1)+'</div><div class="lt-song-name">'+escapeHTML(s.name)+(s.artist?' - '+escapeHTML(s.artist):'')+'</div>';
      item.onclick=function(){ popup.remove(); playSong(s.id,true); };
      list.appendChild(item);
    });
    box.appendChild(list);
    popup.appendChild(box);
    $('lt-app').querySelector('.lt-phone').appendChild(popup);
    popup.addEventListener('click',function(e){ if(e.target===popup) popup.remove(); });
  }

  /* ============ 渲染：评论 ============ */
  function renderComments(){
    var s=currentSong();
    $('lt-cmt-cover').innerHTML=s&&s.cover?'<img src="'+escapeHTML(s.cover)+'">':icon('music');
    $('lt-cmt-songname').textContent=s?s.name:'未在播放';
    $('lt-cmt-songartist').textContent=s?(s.artist||''):'';
    var list=$('lt-cmt-list');list.innerHTML='';
    var cur=playstate.currentSongId;
    var tops=comments.filter(function(c){return c.songId===cur&&!c.parentId;}).sort(function(a,b){return b.time-a.time;});
    var reps={};
    comments.forEach(function(c){if(c.parentId){(reps[c.parentId]=reps[c.parentId]||[]).push(c);}});
    $('lt-cmt-count').textContent='评论 '+(comments.filter(function(c){return c.songId===cur;}).length);
    if(!toppsExist(tops)){list.innerHTML='<div class="lt-empty">还没有评论，写下第一条吧</div>';return;}
    tops.forEach(function(t){
      list.appendChild(buildCmt(t,false));
      (reps[t.id]||[]).sort(function(a,b){return a.time-b.time;}).forEach(function(r){list.appendChild(buildCmt(r,true));});
    });
  }
  function toppsExist(t){return t.length>0;}
  function buildCmt(c,indent){
    var d=document.createElement('div');
    d.className='lt-cmt'+(indent?' lt-cmt-indent':'');
    var avClass=c.isMe?'':'other';
    var nickClass=c.isMe?'me':'';
    var nick=c.isMe?(settings.myName||'我'):otherName;
    var avImg=c.isMe?(ltAvatar1?'<img src="'+escapeHTML(ltAvatar1)+'">':icon('person')):(ltAvatar2?'<img src="'+escapeHTML(ltAvatar2)+'">':icon('person'));
    d.innerHTML='<div class="lt-cmt-avatar '+avClass+'">'+avImg+'</div>'+
      '<div class="lt-cmt-body">'+
        '<div class="lt-cmt-nick '+nickClass+'">'+escapeHTML(nick)+(c.isOther?'<span style="color:#8a8a90;font-weight:400"> · 对方</span>':'')+'</div>'+
        '<div class="lt-cmt-text">'+escapeHTML(c.content)+'</div>'+
        '<div class="lt-cmt-meta">'+
          '<span class="lt-cmt-time">'+timeAgo(c.time)+'</span>'+
          '<div class="lt-cmt-actions">'+
            '<button class="lt-cmt-like'+(c.liked?' on':'')+'" data-id="'+c.id+'">'+icon('heart')+'<span>'+(c.likes||0)+'</span></button>'+
            '<button class="lt-cmt-reply" data-id="'+c.id+'">回复</button>'+
            '<button class="lt-cmt-del" data-id="'+c.id+'">删除</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    return d;
  }
  function timeAgo(ts){
    var d=Math.floor((Date.now()-ts)/1000);
    if(d<60)return '刚刚';
    if(d<3600)return Math.floor(d/60)+'分钟前';
    if(d<86400)return Math.floor(d/3600)+'小时前';
    if(d<2592000)return Math.floor(d/86400)+'天前';
    var dt=new Date(ts);
    return (dt.getMonth()+1)+'月'+dt.getDate()+'日';
  }

  /* ============ 屏幕切换 ============ */
  function showScreen(name){
    currentView=name;
    ['list','player','comments'].forEach(function(n){
      $('lt-screen-'+n).classList.toggle('active',n===name);
    });
    if(name==='list'){ showListView(listView); if(listView==='songs')renderList(); else renderProfileCard(); }
    if(name==='player')renderPlayer();
    if(name==='comments')renderComments();
    renderMini();
  }
  function showListView(v){
    listView=v;
    var home=$('lt-list-home'), songsEl=$('lt-list-songs'), title=$('lt-list-title');
    if(v==='songs'){
      home.style.display='none';
      songsEl.style.display='flex';
    } else {
      home.style.display='';
      songsEl.style.display='none';
      title.textContent='';
      renderProfileCard();
      updateEndTogetherBtn();
    }
  }
  function updateEndTogetherBtn(){
    var btn=$('lt-end-together');
    if(btn) btn.style.display = together ? 'block' : 'none';
  }

  /* ============ 播放逻辑 ============ */
  function setupAudioListeners(){
    audio.addEventListener('timeupdate',function(){
      var s=currentSong();
      if(s&&s.url&&!isNaN(audio.currentTime)){
        playstate.currentTime=audio.currentTime;
        updateProgress();
        save(K.play,playstate);
      }
    });
    audio.addEventListener('loadedmetadata',function(){
      if(playstate.currentTime){try{audio.currentTime=playstate.currentTime;}catch(e){}}
      updateProgress();
    });
    audio.addEventListener('ended',handleEnded);
    audio.addEventListener('play',function(){playstate.isPlaying=true;updatePlayUI();});
    audio.addEventListener('pause',function(){playstate.isPlaying=false;updatePlayUI();save(K.play,playstate);});
    audio.addEventListener('error',function(){ /* 静默，模拟回退 */ });
  }
  function startSim(){
    stopSim();
    simTimer=setInterval(function(){
      if(!playstate.isPlaying)return;
      var s=currentSong();if(!s)return;
      playstate.currentTime+=1;
      if(s.duration&&playstate.currentTime>=s.duration){playstate.currentTime=s.duration;handleEnded();return;}
      updateProgress();
      save(K.play,playstate);
    },1000);
  }
  function stopSim(){if(simTimer){clearInterval(simTimer);simTimer=null;}}
  function play(){
    var s=currentSong();if(!s)return;
    playstate.isPlaying=true;
    if(s.url){try{audio.play().catch(function(){playstate.isPlaying=false;updatePlayUI();});}catch(e){playstate.isPlaying=false;}}
    else{startSim();}
    save(K.play,playstate);updatePlayUI();
  }
  function pause(){
    playstate.isPlaying=false;
    var s=currentSong();
    if(s&&s.url){try{audio.pause();}catch(e){}}
    stopSim();
    save(K.play,playstate);updatePlayUI();
  }
  function togglePlay(){if(playstate.isPlaying)pause();else play();}
  function playSong(id,fromStart){
    var s=songs.find(function(x){return x.id===id;});if(!s)return;
    if(playstate.currentSongId!==id){playstate.currentTime=0;}
    if(fromStart)playstate.currentTime=0;
    playstate.currentSongId=id;
    if(!s.duration&&!s.url)s.duration=180+Math.floor(Math.random()*120);
    playedSongs.push(id);_ltPlayedModified=true;save(K.played,playedSongs);
    stopSim();
    if(s.url){
      audio.src=s.url;
      try{audio.load();}catch(e){}
      if(playstate.isPlaying||fromStart===false){
        // will play via play()
      }
    }else{
      try{audio.pause();audio.removeAttribute('src');}catch(e){}
    }
    save(K.play,playstate);
    renderPlayer();renderProfileCard();renderMini();
    // 自动播放（用户手势触发可生效）
    if(fromStart!==false){
      if(s.url){try{audio.play().then(function(){playstate.isPlaying=true;updatePlayUI();}).catch(function(){playstate.isPlaying=false;updatePlayUI();});}catch(e){}}
      else{playstate.isPlaying=true;startSim();updatePlayUI();}
      save(K.play,playstate);
    }
    maybeScheduleProb(s);
  }
  function nextSong(){
    if(!songs.length)return;
    var idx=songs.findIndex(function(s){return s.id===playstate.currentSongId;});
    var next;
    if(playstate.loopMode==='random'){
      if(songs.length===1)next=songs[0];
      else{do{next=songs[Math.floor(Math.random()*songs.length)];}while(next.id===playstate.currentSongId);}
    }else{
      next=songs[(idx+1)%songs.length];
    }
    playSong(next.id,true);
  }
  function prevSong(){
    if(!songs.length)return;
    var idx=songs.findIndex(function(s){return s.id===playstate.currentSongId;});
    var p=songs[(idx-1+songs.length)%songs.length];
    playSong(p.id,true);
  }
  function handleEnded(){
    var s=currentSong();
    if(playstate.loopMode==='single'){
      playstate.currentTime=0;
      if(s&&s.url){try{audio.currentTime=0;audio.play();}catch(e){}}
      else{playstate.isPlaying=true;startSim();}
      updateProgress();updatePlayUI();
      return;
    }
    nextSong();
  }

  /* ============ 概率事件 ============ */
  function maybeScheduleProb(song){
    if(!together)return;
    if(probScheduled[song.id])return;
    probScheduled[song.id]=true;
    // 1) 切歌（单曲循环不触发）
    if(playstate.loopMode!=='single' && Math.random()<0.05){
      setTimeout(function(){
        if(!together||playstate.currentSongId!==song.id)return;
        toast('对方切歌了，已为你切换下一首');
        setTimeout(nextSong,800);
      },6000+Math.random()*8000);
      return; // 切歌后不再判收藏/评论
    }
    // 2) 收藏 5%
    if(Math.random()<0.05){
      setTimeout(function(){
        if(!together||playstate.currentSongId!==song.id)return;
        if(favorites.indexOf(song.id)<0){favorites.push(song.id);save(K.fav,favorites);}
        toast('对方收藏了这首歌');
        updateLikeIcon();renderList();
      },5000+Math.random()*10000);
    }
    // 3) 评论 10%
    if(Math.random()<0.10){
      setTimeout(function(){
        if(!together||playstate.currentSongId!==song.id)return;
        addOtherComment(song);
      },8000+Math.random()*14000);
    }
  }
  function addOtherComment(song){
    var allCards=getAllWordCards();
    var content=allCards.length>0?allCards[Math.floor(Math.random()*allCards.length)].text:randPick(LT_FALLBACK_REPLIES);
    if(!content)return;
    var c={id:randId(),songId:song.id,nickname:otherName,isMe:false,isOther:true,content:content,time:Date.now(),likes:0,liked:false,parentId:null};
    comments.push(c);save(K.comments,comments);
    toast(otherName+' 评论了「'+song.name+'」');
    if(currentView==='comments'&&playstate.currentSongId===song.id)renderComments();
  }

  /* ============ 评论交互 ============ */
  function postComment(){
    var inp=$('lt-cmt-input');
    var text=inp.value.trim();
    if(!text){toast('请输入评论内容');return;}
    var s=currentSong();
    var pid=replyTarget;
    var parent=pid?comments.find(function(c){return c.id===pid;}):null;
    var content=text;
    if(parent && !text.toLowerCase().indexOf('@')){
      // 已带 @ 前缀
    }
    var c={id:randId(),songId:playstate.currentSongId,nickname:settings.myName||'我',isMe:true,isOther:false,content:content,time:Date.now(),likes:0,liked:false,parentId:pid};
    comments.push(c);save(K.comments,comments);
    inp.value='';replyTarget=null;inp.placeholder='写下你的评论...';
    renderComments();
    // 评论后自动安排对方在设置时间后回复
    scheduleAutoReply(c);
  }
  function scheduleAutoReply(myComment){
    var delayMin=settings.replyDelayMin||1;
    var targetTs=Date.now()+delayMin*60*1000;
    var sch={id:randId(),parentId:myComment.id,songId:myComment.songId,targetTs:targetTs,replied:false};
    scheduledReplies.push(sch);save(K.replies,scheduledReplies);
    /* 轮询机制会自动检测并执行到期的回复 */
  }
  /* 轮询检查到期回复，每3秒检查一次，比单次setTimeout更可靠 */
  var _replyPollTimer=null;
  function startReplyPolling(){
    if(_replyPollTimer) return;
    _replyPollTimer=setInterval(function(){
      checkDueReplies();
    },3000);
    /* 立即检查一次 */
    checkDueReplies();
  }
  function checkDueReplies(){
    var now=Date.now();
    var changed=false;
    for(var i=0;i<scheduledReplies.length;i++){
      var sch=scheduledReplies[i];
      if(!sch.replied && sch.targetTs<=now){
        doReply(sch);
        changed=true;
      }
    }
    if(changed) save(K.replies,scheduledReplies);
  }
  function doReply(sch){
    if(sch.replied)return;
    sch.replied=true;
    var allCards=getAllWordCards();
    var content=allCards.length>0?allCards[Math.floor(Math.random()*allCards.length)].text:randPick(LT_FALLBACK_REPLIES);
    if(!content)content=randPick(LT_FALLBACK_REPLIES);
    var c={id:randId(),songId:sch.songId,nickname:otherName,isMe:false,isOther:true,content:content,time:Date.now(),likes:0,liked:false,parentId:sch.parentId};
    comments.push(c);save(K.comments,comments);
    toast(otherName+' 回复了你');
    if(currentView==='comments'&&playstate.currentSongId===sch.songId)renderComments();
  }
  function processScheduledReplies(){
    /* 启动轮询，由轮询统一检查到期回复 */
    startReplyPolling();
    /* 立即检查一次过期回复 */
    checkDueReplies();
  }
  function delComment(id){
    var idx=comments.findIndex(function(c){return c.id===id;});
    if(idx<0)return;
    /* 同时删除该评论的所有子回复 */
    comments=comments.filter(function(c){return c.id!==id && c.parentId!==id;});
    save(K.comments,comments);
    /* 清理关联的定时回复 */
    scheduledReplies=scheduledReplies.filter(function(s){return s.parentId!==id;});
    save(K.replies,scheduledReplies);
    renderComments();
    toast('已删除');
  }
  function toggleCommentLike(id){
    var c=comments.find(function(x){return x.id===id;});if(!c)return;
    if(c.liked){c.liked=false;c.likes=Math.max(0,(c.likes||0)-1);}
    else{c.liked=true;c.likes=(c.likes||0)+1;}
    save(K.comments,comments);renderComments();
  }
  function setReplyTarget(id){
    var c=comments.find(function(x){return x.id===id;});
    var nick=c?(c.isMe?(settings.myName||'我'):otherName):'';
    replyTarget=id;
    var inp=$('lt-cmt-input');
    inp.placeholder='回复 @'+nick;
    inp.focus();
  }

  /* ============ 邀请 ============ */
  function openInvite(){
    var s=currentSong();
    if(!s){toast('请先选择一首歌');return;}
    /* get contacts from the main app */
    var contacts=[];
    try{
      if(typeof appData!=='undefined'&&appData&&appData.contactList&&Array.isArray(appData.contactList.contacts)){
        contacts=appData.contactList.contacts;
      }
    }catch(e){}
    if(!contacts.length){ toast('没有可邀请的联系人'); return; }
    /* show contact picker */
    var old=$('lt-contact-picker'); if(old) old.remove();
    var picker=document.createElement('div');
    picker.className='lt-contact-picker'; picker.id='lt-contact-picker';
    picker.innerHTML='<div class="lt-cp-header">'+
      '<button class="lt-icon-btn" id="lt-cp-back">'+icon('back')+'</button>'+
      '<div class="lt-cp-title">选择联系人邀请</div>'+
      '<div style="width:38px"></div>'+
      '</div>'+
      '<div class="lt-cp-list" id="lt-cp-list"></div>';
    $('lt-app').querySelector('.lt-phone').appendChild(picker);
    var listEl=picker.querySelector('#lt-cp-list');
    if(!contacts.length){
      listEl.innerHTML='<div class="lt-cp-empty">没有联系人</div>';
    } else {
      contacts.forEach(function(c){
        var item=document.createElement('div');
        item.className='lt-cp-item';
        var avHtml=c.avatar?'<img src="'+escapeHTML(c.avatar)+'">':icon('person');
        item.innerHTML='<div class="lt-cp-avatar">'+avHtml+'</div><div class="lt-cp-name">'+escapeHTML(c.nickname||'联系人')+'</div>';
        item.onclick=function(){ picker.remove(); sendInviteToContact(c, s); };
        listEl.appendChild(item);
      });
    }
    picker.querySelector('#lt-cp-back').onclick=function(){ picker.remove(); };
  }
  function sendInviteToContact(contact, song){
    /* 记录当前一起听歌的联系人ID，用于后续调取专属字卡 */
    ltContactId=contact.id;save(K.contactId,ltContactId);
    /* 同步对方昵称 */
    if(contact.nickname){ otherName=contact.nickname;save(K.other,otherName); }
    /* check if this song has been rejected 3 times this round */
    var songRejectKey='lt_songReject_'+song.id;
    var songRejectCount=0;
    try{ songRejectCount=parseInt(localStorage.getItem(songRejectKey)||'0',10); }catch(e){}
    if(songRejectCount>=3){ toast('该歌曲已被拒绝3次，本轮不再生成邀请卡片'); return; }
    /* send invite card to the contact's chat */
    var inviteId=Date.now();
    try{
      var savedActive = (typeof _activeContactId!=='undefined') ? _activeContactId : null;
      if(typeof _activeContactId!=='undefined') _activeContactId = contact.id;
      if(typeof addMessage==='function'){
        addMessage({
          id: inviteId,
          type: 'system',
          subtype: 'lt-invite',
          content: '一起听歌邀请：'+song.name+(song.artist?' - '+song.artist:''),
          contactId: contact.id,
          ltInvite: {
            songId: song.id,
            name: song.name,
            artist: song.artist||'',
            cover: song.cover||'',
            status: 'pending',
            sentAt: Date.now(),
            rejectCount: 0
          }
        });
      }
      if(typeof _activeContactId!=='undefined') _activeContactId = savedActive;
      if(typeof saveData==='function') saveData();
    }catch(e){}
    toast('已向'+(contact.nickname||'对方')+'发送一起听歌邀请');
    /* auto-respond with 90% accept / 10% reject after delay */
    var waitMs=3000+Math.random()*5000;
    setTimeout(function(){
      var accept=Math.random()<0.9;
      /* update invite card status in the correct contact's chat history */
      var savedActive=null;
      try{
        if(typeof _activeContactId!=='undefined'){ savedActive=_activeContactId; }
        if(typeof _activeContactId!=='undefined' && contact && contact.id){ _activeContactId=contact.id; }
        if(typeof appData!=='undefined'&&appData.chatHistory){
          appData.chatHistory.forEach(function(m){
            if(m.id===inviteId && m.ltInvite){ m.ltInvite.status=accept?'accepted':'rejected'; if(!accept){ m.ltInvite.rejectCount=(m.ltInvite.rejectCount||0)+1; } }
          });
          if(typeof saveData==='function') saveData();
          if(typeof renderMessages==='function') renderMessages(false);
        }
      }catch(e){}
      finally{
        if(typeof _activeContactId!=='undefined'){ _activeContactId=savedActive; }
      }
      if(accept){
        /* start together — NO chat bubble message */
        together=true;save(K.together,true);
        timerState.startTs=Date.now();save(K.timer,timerState);
        startTimer();
        updateCenter();renderMini();renderPlayer();renderProfileCard();updateEndTogetherBtn();
        toast(contact.nickname+' 接受了邀请，开始一起听');
      } else {
        /* NO chat bubble message — just update reject count */
        rejectCount++;save(K.reject,rejectCount);
        /* increment per-song reject count */
        try{
          var srKey='lt_songReject_'+song.id;
          var srCnt=parseInt(localStorage.getItem(srKey)||'0',10)+1;
          localStorage.setItem(srKey,String(srCnt));
        }catch(e){}
        toast(contact.nickname+' 拒绝了一起听歌邀请');
      }
    }, waitMs);
  }
  function closeInvite(){if(inviteTimer){clearInterval(inviteTimer);inviteTimer=null;}$('lt-invite').style.display='none';}
  function acceptInvite(){
    closeInvite();
    together=true;save(K.together,true);
    timerState.startTs=Date.now();save(K.timer,timerState);
    showScreen('player');
    startTimer();
    updateCenter();renderMini();renderPlayer();renderProfileCard();updateEndTogetherBtn();
    toast(otherName+' 接受了邀请，开始一起听');
  }
  function rejectInvite(){
    closeInvite();
    rejectCount++;save(K.reject,rejectCount);
    var texts=['系统抽疯！再邀请对方一次试试。','嗯？不管了，面子大过天，再邀请一次。','？我不中了，去买彩票吧。'];
    toast(texts[Math.min(rejectCount-1,2)]);
  }
  function endTogether(){
    together=false;save(K.together,false);
    stopTimer();
    /* preserve cumulativeTime - it persists across sessions */
    timerState.startTs=null;save(K.timer,timerState);
    updateCenter();renderMini();renderPlayer();renderProfileCard();updateEndTogetherBtn();
    toast('已结束一起听歌');
  }
  function acceptInviteFromChat(inv, msgId){
    if(!inv)return;
    try{
      if(typeof appData!=='undefined' && appData && appData.chatHistory){
        appData.chatHistory.forEach(function(m){ if(m.id===msgId && m.ltInvite){ m.ltInvite.status='accepted'; } });
        if(typeof saveData==='function')saveData();
        if(typeof renderMessages==='function')renderMessages(false);
      }
    }catch(e){}
    together=true;save(K.together,true);
    timerState.startTs=Date.now();save(K.timer,timerState);
    startTimer();
    if(inv.songId && songs.some(function(s){return s.id===inv.songId;})){
      playstate.currentSongId=inv.songId;save(K.play,playstate);
    }
    if(!playstate.currentSongId && songs.length){ playstate.currentSongId=songs[0].id; save(K.play,playstate); }
    updateCenter();renderMini();renderPlayer();renderProfileCard();updateEndTogetherBtn();
    toast('已开始一起听');
  }
  function rejectInviteFromChat(inv, msgId){
    if(!inv)return;
    try{
      if(typeof appData!=='undefined' && appData && appData.chatHistory){
        appData.chatHistory.forEach(function(m){ if(m.id===msgId && m.ltInvite){ m.ltInvite.status='rejected'; m.ltInvite.rejectCount=(m.ltInvite.rejectCount||0)+1; } });
        if(typeof saveData==='function')saveData();
        if(typeof renderMessages==='function')renderMessages(false);
      }
    }catch(e){}
    rejectCount++;save(K.reject,rejectCount);
    /* increment per-song reject count */
    if(inv.songId){
      try{
        var srKey='lt_songReject_'+inv.songId;
        var srCnt=parseInt(localStorage.getItem(srKey)||'0',10)+1;
        localStorage.setItem(srKey,String(srCnt));
      }catch(e){}
    }
    var texts=['系统抽疯！再邀请对方一次试试。','嗯？不管了，面子大过天，再邀请一次。','？我不中了，去买彩票吧。'];
    toast(texts[Math.min(rejectCount-1,2)]);
  }

  /* ============ 一起听计时器 ============ */
  /* sessionTimer = current session (resets each invite); cumulativeTime = total across all sessions */
  function getCumulativeTime(){ return cumulativeTime; }
  function startTimer(){
    if(!together)return;
    if(!timerState.startTs){timerState.startTs=Date.now();save(K.timer,timerState);}
    stopTimer();
    timerInterval=setInterval(updateTimer,1000);
    updateTimer();
  }
  function stopTimer(){if(timerInterval){clearInterval(timerInterval);timerInterval=null;}}
  function updateTimer(){
    if(!timerState.startTs)return;
    updateCenter();
    /* accumulate into cumulativeTime */
    cumulativeTime++; save(K.cumTime,cumulativeTime);
    renderProfileCard();
  }

  /* ============ 图片上传（封面/背景） ============ */
  function pickImage(cb){
    fileCallback=cb;
    $('lt-file').value='';
    $('lt-file').click();
  }
  function compressImage(dataUrl, opts, cb){
    opts=opts||{};
    var maxW=opts.maxWidth||1200, maxH=opts.maxHeight||1200, quality=opts.quality||0.82;
    var img=new Image();
    img.onload=function(){
      var w=img.width, h=img.height;
      if(w>maxW||h>maxH){
        var ratio=Math.min(maxW/w, maxH/h);
        w=Math.floor(w*ratio); h=Math.floor(h*ratio);
      }
      var canvas=document.createElement('canvas');
      canvas.width=w; canvas.height=h;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
      ctx.drawImage(img,0,0,w,h);
      var out=canvas.toDataURL('image/jpeg', quality);
      cb(out);
    };
    img.onerror=function(){ cb(dataUrl); };
    img.src=dataUrl;
  }
  function onFileChange(){
    var f=$('lt-file').files[0];if(!f)return;
    if(f.size>8*1024*1024){toast('图片过大，请选 8MB 以内的图片');return;}
    var r=new FileReader();
    r.onload=function(){
      compressImage(r.result, {maxWidth:1200, maxHeight:1200, quality:0.82}, function(compressed){
        if(fileCallback){fileCallback(compressed);fileCallback=null;}
      });
    };
    r.readAsDataURL(f);
  }

  /* ============ 模态：上传歌曲 ============ */
  function openUpload(){
    $('lt-up-name').value='';$('lt-up-artist').value='';$('lt-up-url').value='';
    $('lt-upload-modal').style.display='flex';
    setTimeout(function(){$('lt-up-name').focus();},50);
  }
  function submitUpload(){
    var name=$('lt-up-name').value.trim();
    if(!name){toast('请输入歌曲名');return;}
    var artist=$('lt-up-artist').value.trim();
    var url=$('lt-up-url').value.trim();
    songs.push({id:randId(),name:name,artist:artist,url:url,cover:null,duration:0});
    save(K.songs,songs);
    $('lt-upload-modal').style.display='none';
    renderList();
    toast('已添加「'+name+'」');
  }
  /* ============ 模态：设置 ============ */
  function openSettings(){
    $('lt-set-other').value=otherName;
    $('lt-set-me').value=settings.myName||'我';
    $('lt-set-dist').value=settings.distance||'';
    $('lt-set-replydelay').value=settings.replyDelayMin||1;
    $('lt-set-fontcolor').value=ltFontColor||'#1a1a1a';
    $('lt-set-homefontcolor').value=ltHomeFontColor||'#1a1a1a';
    $('lt-set-fontsize').value=ltFontSize||14;
    $('lt-set-fontsize-val').textContent=ltFontSize||14;
    $('lt-set-bgcolor').value=ltBgColor||'#f6f7f9';
    $('lt-settings-modal').style.display='flex';
  }
  function submitSettings(){
    otherName=$('lt-set-other').value.trim()||'对方';save(K.other,otherName);
    settings.myName=$('lt-set-me').value.trim()||'我';
    var dv=parseInt($('lt-set-dist').value,10);if(!isNaN(dv)&&dv>=0)settings.distance=dv;
    var rd=parseInt($('lt-set-replydelay').value,10);if(!isNaN(rd)&&rd>=1)settings.replyDelayMin=rd;else settings.replyDelayMin=1;
    save(K.settings,settings);
    ltFontColor=$('lt-set-fontcolor').value;save(K.ltFontColor,ltFontColor);
    ltHomeFontColor=$('lt-set-homefontcolor').value;save(K.ltHomeFontColor,ltHomeFontColor);
    ltFontSize=parseInt($('lt-set-fontsize').value,10);save(K.ltFontSize,ltFontSize);
    ltBgColor=$('lt-set-bgcolor').value;save(K.ltBgColor,ltBgColor);
    $('lt-settings-modal').style.display='none';
    applyLtAppearance();
    renderProfileCard();renderPlayer();renderMini();renderComments();
    toast('设置已保存');
  }
  function applyLtAppearance(){
    var phone=document.querySelector('#lt-app .lt-phone');
    if(!phone)return;
    /* font color - affects entire app */
    var fc=ltFontColor||'#1a1a1a';
    phone.style.setProperty('--lt-text',fc);
    phone.style.setProperty('--lt-sub',hexToRgbaLt(fc,0.58));
    phone.style.setProperty('--lt-faint',hexToRgbaLt(fc,0.4));
    /* homepage font color - affects nickname and stats numbers */
    var hfc=ltHomeFontColor||fc;
    var pn=$('lt-profile-name'); if(pn) pn.style.color=hfc;
    phone.querySelectorAll('.lt-stat-num').forEach(function(el){ el.style.color=hfc; });
    /* font size */
    if(ltFontSize){ phone.style.fontSize=ltFontSize+'px'; }
    /* background color/image (list + comments screens, NOT player screen) */
    var screens=[$('lt-screen-list'),$('lt-screen-comments')];
    screens.forEach(function(sc){
      if(!sc)return;
      if(ltBgColor) sc.style.background=ltBgColor;
      else sc.style.background='';
      if(ltBgImage){
        sc.style.backgroundImage='url("'+ltBgImage+'")';
        sc.style.backgroundSize='cover';
        sc.style.backgroundPosition='center';
      } else {
        sc.style.backgroundImage='';
        sc.style.backgroundSize='';
        sc.style.backgroundPosition='';
      }
    });
    /* profile card background (independent, clickable to replace) */
    /* 同时把背景延伸到顶栏区域，使整个上半部分填满 */
    var pc=$('lt-profile-card');
    var tb=document.querySelector('#lt-app .lt-screen-list .lt-topbar');
    if(pc){
      if(ltProfileBg){
        pc.style.setProperty('--lt-profile-bg','url("'+ltProfileBg+'")');
        pc.style.borderRadius='0 0 0 0';
        pc.style.margin='0';
        pc.style.paddingTop='calc(60px + env(safe-area-inset-top, 0px))'; /* 为顶栏留出空间（含刘海安全区） */
        if(tb){
          tb.style.background='url("'+ltProfileBg+'")';
          tb.style.backgroundSize='cover';
          tb.style.backgroundPosition='center';
          tb.style.position='absolute';
          tb.style.top='0';
          tb.style.left='0';
          tb.style.right='0';
          tb.style.zIndex='2';
        }
      }else{
        pc.style.setProperty('--lt-profile-bg','transparent');
        pc.style.borderRadius='22px';
        pc.style.margin='0 16px 2px';
        pc.style.paddingTop='4px';
        if(tb){
          tb.style.background='';
          tb.style.backgroundSize='';
          tb.style.backgroundPosition='';
          tb.style.position='';
          tb.style.top='';
          tb.style.left='';
          tb.style.right='';
          tb.style.zIndex='';
        }
      }
    }
    applyLtAvatars();
  }
  function hexToRgbaLt(hex,alpha){
    hex=hex.replace('#','');
    if(hex.length===3) hex=hex.split('').map(function(c){return c+c;}).join('');
    var r=parseInt(hex.slice(0,2),16)||0, g=parseInt(hex.slice(2,4),16)||0, b=parseInt(hex.slice(4,6),16)||0;
    return 'rgba('+r+','+g+','+b+','+alpha+')';
  }
  function applyLtAvatars(){
    var av1=$('lt-rel-av1'), av2=$('lt-rel-av2');
    var t1=$('lt-t-av1'), t2=$('lt-t-av2');
    [av1,t1].forEach(function(el){ if(!el)return; if(ltAvatar1){ el.innerHTML='<img src="'+escapeHTML(ltAvatar1)+'" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">'; } else { el.innerHTML=icon('person'); } });
    [av2,t2].forEach(function(el){ if(!el)return; if(ltAvatar2){ el.innerHTML='<img src="'+escapeHTML(ltAvatar2)+'" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">'; } else { el.innerHTML=icon('person'); } });
  }
  function pickLtAvatar(which){
    pickImage(function(data){
      if(which==='me'){ ltAvatar1=data;save(K.ltAvatar1,ltAvatar1); }
      else { ltAvatar2=data;save(K.ltAvatar2,ltAvatar2); }
      applyLtAvatars();
      toast('头像已更新');
    });
  }
  /* ============ 字卡调取（仅引用字卡App，不内置） ============ */
  function getAllWordCards(){
    /* 仅调取字卡App的共用字卡 + 当前联系人的专属字卡，不内置任何字卡 */
    var all=[];
    /* 主App共用字卡 */
    try{
      if(typeof appData!=='undefined' && appData && appData.wordCards){
        for(var g in appData.wordCards){
          (appData.wordCards[g]||[]).forEach(function(c){
            if(!c.hidden && c.text) all.push({text:c.text,source:'shared'});
          });
        }
      }
    }catch(e){}
    /* 当前联系人的专属字卡：优先用 ltContactId，其次按 otherName 匹配 */
    try{
      if(typeof appData!=='undefined' && appData && appData.contactWordCards){
        var matchedId=ltContactId;
        /* 如果没有 ltContactId，尝试按 otherName 匹配联系人 */
        if(!matchedId && appData.contactList){
          var contacts=appData.contactList.contacts||[];
          for(var ci=0;ci<contacts.length;ci++){
            if(contacts[ci].nickname===otherName){ matchedId=contacts[ci].id; break; }
          }
        }
        /* 如果匹配到联系人，使用其专属字卡；否则遍历所有联系人 */
        var cids=matchedId?[matchedId]:Object.keys(appData.contactWordCards);
        cids.forEach(function(cid){
          var cw=appData.contactWordCards[cid];
          if(cw && cw.cards){
            for(var g2 in cw.cards){
              (cw.cards[g2]||[]).forEach(function(c){
                if(!c.hidden && c.text) all.push({text:c.text,source:'exclusive'});
              });
            }
          }
        });
      }
    }catch(e){}
    return all;
  }

  /* ============ 事件绑定 ============ */
  function wire(){
    // 静态图标
    $('lt-list-back').innerHTML=icon('back');
    $('lt-list-settings').innerHTML=icon('more');
    $('lt-add-song').innerHTML=icon('plus');
    $('lt-playall-icon').innerHTML=icon('play');
    $('lt-player-back').innerHTML=icon('back');
    $('lt-player-more').innerHTML=icon('moreH');
    $('lt-rel-av1').innerHTML=icon('person'); if($('lt-rel-av2'))$('lt-rel-av2').innerHTML=icon('person');
    $('lt-t-av1').innerHTML=icon('person');$('lt-t-av2').innerHTML=icon('person');
    $('lt-entry-fav-icon').innerHTML=icon('heart');
    $('lt-entry-all-icon').innerHTML=icon('music');
    $('lt-entry-fav-arrow').innerHTML=icon('back').replace('M15 18l-6-6 6-6','M9 18l6-6-6-6');
    $('lt-entry-all-arrow').innerHTML=icon('back').replace('M15 18l-6-6 6-6','M9 18l6-6-6-6');
    $('lt-act-dl-icon').innerHTML=icon('download');
    $('lt-act-cmt-icon').innerHTML=icon('comment');
    $('lt-act-share-icon').innerHTML=icon('share');
    $('lt-act-more-icon').innerHTML=icon('moreH');
    $('lt-prev').innerHTML=icon('prev');
    $('lt-next').innerHTML=icon('next');
    $('lt-tolist').innerHTML=icon('list');
    $('lt-cmt-back').innerHTML=icon('back');
    $('lt-cmt-send').innerHTML=icon('send');
    $('lt-mini-next').innerHTML=icon('next');
    $('lt-mini-list').innerHTML=icon('list');

    // list
    $('lt-list-back').onclick=function(){
      if(listView==='songs'){ showListView('home'); }
      else { closeLTApp(); }
    };
    $('lt-list-settings').onclick=openSettings;
    $('lt-add-song').onclick=openUpload;
    $('lt-playall').onclick=function(){if(songs.length)playSong(songs[0].id,true);showScreen('player');};
    document.querySelectorAll('.lt-tab').forEach(function(t){
      t.onclick=function(){listTab=t.dataset.tab;document.querySelectorAll('.lt-tab').forEach(function(x){x.classList.toggle('active',x===t);});renderList();};
    });
    $('lt-songlist').addEventListener('click',function(e){
      var row=e.target.closest('.lt-song');if(!row)return;
      var id=row.dataset.id;
      if(e.target.closest('.lt-song-more')){
        var s=songs.find(function(x){return x.id===id;});
        var isFav=favorites.indexOf(id)>=0;
        showSheet(s.name,[{label:isFav?'取消收藏':'收藏',onClick:function(){toggleFav(id);renderList();}},{label:'删除歌曲',danger:true,onClick:function(){delSong(id);}}]);
        return;
      }
      playSong(id,true);showScreen('player');
    });
    // entry cards
    $('lt-entry-fav').onclick=function(){ listTab='fav'; document.querySelectorAll('.lt-tab').forEach(function(x){x.classList.toggle('active',x.dataset.tab==='fav');}); showListView('songs'); $('lt-list-title').textContent='我喜欢的'; renderList(); };
    $('lt-entry-all').onclick=function(){ listTab='all'; document.querySelectorAll('.lt-tab').forEach(function(x){x.classList.toggle('active',x.dataset.tab==='all');}); showListView('songs'); $('lt-list-title').textContent='我的歌单'; renderList(); };
    // end together
    $('lt-end-together').onclick=function(){
      showSheet('结束一起听歌',[{label:'确认结束',danger:true,onClick:function(){ endTogether(); }}]);
    };
    // rel-card avatar click handlers
    $('lt-rel-av1').onclick=function(e){ e.stopPropagation(); showSheet('我的头像',[{label:'上传头像',onClick:function(){ pickLtAvatar('me'); }},{label:'恢复默认',onClick:function(){ ltAvatar1=null;save(K.ltAvatar1,null);applyLtAvatars();toast('已恢复默认'); }}]); };
    if($('lt-rel-av2'))$('lt-rel-av2').onclick=function(e){ e.stopPropagation(); showSheet('对方头像',[{label:'上传头像',onClick:function(){ pickLtAvatar('other'); }},{label:'恢复默认',onClick:function(){ ltAvatar2=null;save(K.ltAvatar2,null);applyLtAvatars();toast('已恢复默认'); }}]); };

    /* ===== 仿网易云主页详情：交互 ===== */
    // 昵称可点击修改
    $('lt-profile-name').onclick=function(e){ e.stopPropagation();
      promptText('修改昵称',profileData.name||'你的昵称',function(v){ if(v&&v.trim()){profileData.name=v.trim();saveProfileData();renderProfileCard();} });
    };
    // 文案可点击修改
    $('lt-profile-date').onclick=function(e){ e.stopPropagation();
      promptText('修改文案',profileData.date||'点击即可替换文案',function(v){ if(v&&v.trim()){profileData.date=v.trim();saveProfileData();renderProfileCard();} });
    };
    // 关注可点击修改
    $('lt-stat-follow').onclick=function(e){ e.stopPropagation();
      promptText('修改关注数',String(profileData.follow!=null?profileData.follow:23),function(v){ var n=parseInt(v);if(!isNaN(n)){profileData.follow=n;saveProfileData();renderProfileCard();} });
    };
    // 粉丝可点击修改
    $('lt-stat-fans').onclick=function(e){ e.stopPropagation();
      promptText('修改粉丝数',String(profileData.fans!=null?profileData.fans:65),function(v){ var n=parseInt(v);if(!isNaN(n)){profileData.fans=n;saveProfileData();renderProfileCard();} });
    };
    // 等级可点击修改
    $('lt-stat-level').onclick=function(e){ e.stopPropagation();
      promptText('修改等级',String(profileData.level!=null?profileData.level:8),function(v){ var n=parseInt(v);if(!isNaN(n)&&n>=0){profileData.level=n;saveProfileData();renderProfileCard();} });
    };
    // 四张图片可点击替换
    $('lt-profile-imgs').addEventListener('click',function(e){
      var box=e.target.closest('.lt-profile-img'); if(!box)return;
      e.stopPropagation();
      var idx=parseInt(box.dataset.idx);
      showSheet('替换图片',[{label:'上传图片',onClick:function(){
        pickImage(function(data){
          if(!profileData.imgs)profileData.imgs=[null,null,null,null];
          profileData.imgs[idx]=data;saveProfileData();renderProfileCard();toast('图片已更新');
        });
      }},{label:'清除图片',onClick:function(){
        if(!profileData.imgs)profileData.imgs=[null,null,null,null];
        profileData.imgs[idx]=null;saveProfileData();renderProfileCard();
      }}]);
    });
    // 点击profile-card空白区域替换背景
    $('lt-profile-card').addEventListener('click',function(e){
      /* 子元素的点击都已 stopPropagation，这里只处理空白区域 */
      showSheet('替换背景',[{label:'上传背景图片',onClick:function(){
        pickImage(function(data){
          ltProfileBg=data;save(K.ltProfileBg,ltProfileBg);
          applyLtAppearance();toast('背景已更新');
        });
      }},{label:'清除背景',onClick:function(){
        ltProfileBg=null;save(K.ltProfileBg,null);
        applyLtAppearance();toast('已清除背景');
      }}]);
    });
    // 初始化渲染
    renderProfileCard();

    // player
    $('lt-player-back').onclick=function(){ showListView('home'); showScreen('list'); };
    $('lt-player-more').onclick=openSettings;
    $('lt-cover').onclick=function(){
      var s=currentSong();if(!s){toast('请先选择歌曲');return;}
      showSheet('更换封面',[{label:'上传封面图片',onClick:function(){pickImage(function(data){s.cover=data;save(K.songs,songs);renderPlayer();renderList();});}},{label:'恢复默认封面',onClick:function(){s.cover=null;save(K.songs,songs);renderPlayer();renderList();}}]);
    };
    $('lt-playerbg').onclick=function(){
      showSheet('更换背景',[{label:'上传背景图片',onClick:function(){pickImage(function(data){bgImage=data;save(K.bg,bgImage);updateCenter();});}},{label:'恢复默认背景',onClick:function(){bgImage=null;save(K.bg,null);updateCenter();}}]);
    };
    // 点击播放器空白区域也可更换背景
    $('lt-center').addEventListener('click',function(e){
      if(e.target.closest('.lt-t-avatar')) return;
      if(e.target.closest('.lt-cover')) return;
      if(e.target.closest('.lt-cover-hint')) return;
      showSheet('更换背景',[{label:'上传背景图片',onClick:function(){pickImage(function(data){bgImage=data;save(K.bg,bgImage);updateCenter();});}},{label:'恢复默认背景',onClick:function(){bgImage=null;save(K.bg,null);updateCenter();}}]);
    });
    $('lt-together').onclick=function(e){
      if(!together)return;
      var av1=$('lt-t-av1'), av2=$('lt-t-av2');
      if(e.target===av1||av1.contains(e.target)){
        e.stopPropagation();
        showSheet('更换我的头像',[{label:'上传头像图片',onClick:function(){ pickLtAvatar('me'); }},{label:'恢复默认头像',onClick:function(){ ltAvatar1=null;save(K.ltAvatar1,null);applyLtAvatars(); }}]);
      } else if(e.target===av2||av2.contains(e.target)){
        e.stopPropagation();
        showSheet('更换对方头像',[{label:'上传头像图片',onClick:function(){ pickLtAvatar('other'); }},{label:'恢复默认头像',onClick:function(){ ltAvatar2=null;save(K.ltAvatar2,null);applyLtAvatars(); }}]);
      }
    };
    $('lt-act-like').onclick=function(){var s=currentSong();if(s)toggleFav(s.id);};
    $('lt-act-dl').onclick=function(){toast('暂不支持下载');};
    $('lt-act-cmt').onclick=function(){showScreen('comments');};
    $('lt-act-share').onclick=openInvite;
    $('lt-act-more').onclick=openSettings;
    $('lt-loop').onclick=function(){
      var order=['list','single','random'];
      var i=order.indexOf(playstate.loopMode);
      playstate.loopMode=order[(i+1)%order.length];
      save(K.play,playstate);updateLoopIcon();
      toast(playstate.loopMode==='single'?'单曲循环':playstate.loopMode==='random'?'随机播放':'顺序播放');
    };
    $('lt-prev').onclick=prevSong;
    $('lt-play').onclick=togglePlay;
    $('lt-next').onclick=nextSong;
    $('lt-tolist').onclick=function(){ showSongPopup(); };

    // progress bar 拖动
    (function(){
      var bar=$('lt-bar');var dragging=false;
      function seek(clientX){
        var r=bar.getBoundingClientRect();var p=Math.max(0,Math.min(1,(clientX-r.left)/r.width));
        var s=currentSong();if(!s)return;
        var dur=s.duration||0;
        if(s.url&&audio.duration&&!isNaN(audio.duration))dur=audio.duration;
        playstate.currentTime=dur*p;
        if(s.url){try{audio.currentTime=playstate.currentTime;}catch(e){}}
        updateProgress();save(K.play,playstate);
      }
      bar.addEventListener('mousedown',function(e){dragging=true;seek(e.clientX);});
      window.addEventListener('mousemove',function(e){if(dragging)seek(e.clientX);});
      window.addEventListener('mouseup',function(){dragging=false;});
      bar.addEventListener('touchstart',function(e){dragging=true;seek(e.touches[0].clientX);},{passive:true});
      bar.addEventListener('touchmove',function(e){if(dragging)seek(e.touches[0].clientX);},{passive:true});
      bar.addEventListener('touchend',function(){dragging=false;});
    })();

    // comments
    $('lt-cmt-back').onclick=function(){showScreen('player');};
    $('lt-cmt-send').onclick=postComment;
    $('lt-cmt-input').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();postComment();}});
    $('lt-cmt-list').addEventListener('click',function(e){
      var lk=e.target.closest('.lt-cmt-like');if(lk){toggleCommentLike(lk.dataset.id);return;}
      var rp=e.target.closest('.lt-cmt-reply');if(rp){setReplyTarget(rp.dataset.id);return;}
      var dl=e.target.closest('.lt-cmt-del');if(dl){delComment(dl.dataset.id);return;}
    });

    // mini
    $('lt-mini-play').onclick=togglePlay;
    $('lt-mini-next').onclick=nextSong;
    $('lt-mini-list').onclick=function(){showScreen('list');};
    $('lt-mini').querySelector('.lt-mini-info').onclick=function(){ if(currentSong()) showScreen('player'); };
    $('lt-mini').querySelector('.lt-mini-cover').onclick=function(){ if(currentSong()) showScreen('player'); };

    // invite
    $('lt-invite-accept').onclick=acceptInvite;
    $('lt-invite-reject').onclick=rejectInvite;
    $('lt-invite').addEventListener('click',function(e){if(e.target===$('lt-invite')){closeInvite();toast('已取消邀请');}});

    // modals
    $('lt-up-cancel').onclick=function(){$('lt-upload-modal').style.display='none';};
    $('lt-up-ok').onclick=submitUpload;
    $('lt-set-cancel').onclick=function(){$('lt-settings-modal').style.display='none';};
    $('lt-set-ok').onclick=submitSettings;
    $('lt-set-fontsize').addEventListener('input',function(){$('lt-set-fontsize-val').textContent=this.value;});
    $('lt-set-bgimg-btn').onclick=function(){ pickImage(function(data){ ltBgImage=data;save(K.ltBgImage,ltBgImage);applyLtAppearance();toast('背景图片已更新'); }); };
    $('lt-set-bgimg-reset').onclick=function(){ ltBgImage=null;save(K.ltBgImage,null);applyLtAppearance();toast('已恢复默认背景'); };

    // sheet
    $('lt-sheet-cancel').onclick=hideSheet;
    $('lt-sheet').addEventListener('click',function(e){if(e.target===$('lt-sheet'))hideSheet();});

    // file
    $('lt-file').addEventListener('change',onFileChange);

    setupAudioListeners();
  }

  function toggleFav(id){
    var i=favorites.indexOf(id);
    if(i>=0){favorites.splice(i,1);toast('已取消收藏');}
    else{favorites.push(id);toast('已收藏');}
    save(K.fav,favorites);updateLikeIcon();renderList();
  }
  function delSong(id){
    songs=songs.filter(function(x){return x.id!==id;});save(K.songs,songs);
    if(playstate.currentSongId===id){
      stopSim();try{audio.pause();audio.removeAttribute('src');}catch(e){}
      playstate.currentSongId=songs.length?songs[0].id:null;playstate.currentTime=0;playstate.isPlaying=false;
      save(K.play,playstate);
    }
    renderList();renderPlayer();renderMini();
    toast('已删除');
  }

  /* ============ 初始化 / 恢复 ============ */
  function restore(){
    renderList();
    if(playstate.currentSongId){
      var s=currentSong();
      if(s){
        if(s.url){audio.src=s.url;try{audio.load();}catch(e){}}
        // currentTime 在 loadedmetadata 里恢复
        renderPlayer();renderProfileCard();renderMini();
        if(playstate.isPlaying){
          if(s.url){try{audio.play().catch(function(){playstate.isPlaying=false;updatePlayUI();});}catch(e){playstate.isPlaying=false;}}
          else{startSim();}
        }
        maybeScheduleProb(s);
      }
    }
    if(together){startTimer();updateCenter();}
    updateEndTogetherBtn();
    applyLtAppearance();
    processScheduledReplies();
    showListView('home');
    showScreen('list');
  }

  /* ============ 入口 ============ */
  function openLTApp(){
    // 在打开app前先应用全局设置，避免颜色闪烁
    if(typeof applyGlobalSettings === 'function'){
        try{ applyGlobalSettings(); }catch(e){}
    }
    // 隐藏桌面层和底栏，防止第三页桌面穿透重叠
    var dw = document.getElementById('desktopWrapper');
    if (dw) dw.style.display = 'none';
    var dock = document.querySelector('.dock-bar');
    if (dock) dock.style.display = 'none';
    $('lt-app').style.display='flex';
    if(!inited){wire();inited=true;}
    restore();
  }
  function closeLTApp(){
    /* do NOT pause music - it should continue playing in background */
    $('lt-app').style.display='none';
    // 恢复桌面层和底栏显示
    var dw = document.getElementById('desktopWrapper');
    if (dw) dw.style.display = '';
    var dock = document.querySelector('.dock-bar');
    if (dock) dock.style.display = '';
  }
  window.openLTApp=openLTApp;
  window.closeLTApp=closeLTApp;

  window.LTBridge={
    play:play, pause:pause, toggle:togglePlay, next:nextSong, prev:prevSong,
    fav:function(){ if(playstate.currentSongId) toggleFav(playstate.currentSongId); },
    seek:function(frac){ var cur=currentSong(); if(cur&&cur.duration){ var t=cur.duration*frac; playstate.currentTime=t; try{if(audio&&audio.duration)audio.currentTime=t;}catch(e){} save(K.play,playstate); } },
    acceptInviteFromChat:acceptInviteFromChat,
    rejectInviteFromChat:rejectInviteFromChat,
    getState:function(){ return {songs:songs,playstate:playstate,together:together,settings:settings,timer:timerState,favorites:favorites,audioDuration:(audio.duration&&!isNaN(audio.duration)?audio.duration:0),cumulativeTime:getCumulativeTime()}; }
  };
  // 不再自动打开：嵌入桌面后由用户点击触发，避免页面加载即弹窗遮挡桌面
})();
