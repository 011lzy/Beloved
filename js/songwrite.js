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


