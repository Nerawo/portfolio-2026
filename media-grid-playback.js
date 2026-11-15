// Native grid playback only. No timers seek or rate-correct individual videos while playing.
export class GridPlayback {
  constructor(videos, { onState = () => {}, timeoutMs = 5000 } = {}) {
    this.videos = videos; this.onState = onState; this.timeoutMs = timeoutMs;
    this.state = 'idle'; this.members = []; this.master = null; this.operation = null; this.message = '';
    videos.forEach(video => {
      video.addEventListener('ended', () => { if (this.state === 'playing' && video === this.master) void this.start(true); });
      video.addEventListener('pause', () => { if (this.state === 'playing' && video.paused && !video.error && this.members.includes(video) && !video.ended && video.currentTime < video.duration - .04) this.stop('manual'); });
      video.addEventListener('seeking', () => { if (['playing','paused'].includes(this.state) && this.members.includes(video)) this.stop('manual'); });
      video.addEventListener('ratechange', () => { if (this.members.includes(video)) this.stop('manual'); });
      video.addEventListener('play', () => { if (['paused','playing'].includes(this.state) && this.members.includes(video)) this.stop('manual', video); });
      for (const event of ['waiting','stalled']) video.addEventListener(event, () => { if (this.state === 'playing' && video.readyState < 3 && this.members.includes(video)) this.pause('buffer'); });
      video.addEventListener('error', () => this.remove(video));
      video.addEventListener('durationchange', () => { if (!Number.isFinite(video.duration) || video.duration <= 0) this.remove(video); });
    });
  }
  notify() { this.onState(this.state, this.message); }
  cancel() { this.operation?.abort(); this.operation = null; }
  wait(video, predicate, events, signal) {
    if (signal.aborted) return Promise.reject(new Error('cancelled'));
    if (video.error) return Promise.reject(new Error('media error'));
    if (predicate()) return Promise.resolve();
    return new Promise((resolve,reject) => {
      const finish = error => { clearTimeout(timer); for (const e of events) video.removeEventListener(e,check); video.removeEventListener('error',fail); signal.removeEventListener('abort',cancel); error ? reject(error) : resolve(); };
      const check = () => { if (predicate()) finish(); }, fail = () => finish(new Error('media error')), cancel = () => finish(new Error('cancelled'));
      const timer = setTimeout(() => finish(new Error('timeout')),this.timeoutMs);
      for (const e of events) video.addEventListener(e,check); video.addEventListener('error',fail); signal.addEventListener('abort',cancel,{once:true});
    });
  }
  bounded(promise, signal) {
    return new Promise((resolve,reject) => {
      const finish = (error,value) => { clearTimeout(timer); signal.removeEventListener('abort',cancel); error ? reject(error) : resolve(value); };
      const cancel = () => finish(new Error('cancelled'));
      const timer = setTimeout(() => finish(new Error('timeout')),this.timeoutMs);
      signal.addEventListener('abort',cancel,{once:true}); Promise.resolve(promise).then(v=>finish(null,v),e=>finish(e));
    });
  }
  async start(restart = false) {
    const resume = !restart && this.state === 'paused' && this.members.length;
    this.cancel(); const operation = new AbortController(); this.operation = operation; const signal = operation.signal;
    this.state = 'loading'; this.message = ''; this.notify();
    try {
      let ready;
      if (resume || restart) ready = this.members.filter(v=>!v.error && v.isConnected !== false && Number.isFinite(v.duration) && v.duration > 0);
      else {
        const loaded = await Promise.allSettled(this.videos.map(async v => {
          if (v.isConnected === false || v.error) throw new Error('unavailable');
          if (!this.loops) this.loops = new Map(); if (!this.loops.has(v)) this.loops.set(v,v.loop); v.loop = false; v.pause();
          if (v.readyState === 0 && v.networkState === 0) v.load();
          await this.wait(v,()=>v.readyState >= 2 && Number.isFinite(v.duration) && v.duration > 0,['loadedmetadata','loadeddata','canplay','durationchange'],signal); return v;
        }));
        if (signal.aborted) return;
        ready = loaded.filter(r=>r.status === 'fulfilled').map(r=>r.value);
      }
      ready = ready.filter(v=>!v.error && v.isConnected !== false && Number.isFinite(v.duration) && v.duration > 0);
      this.members = ready;
      if (!ready.length) throw new Error('none');
      const unfinished = resume && !ready.every(v=>v.ended || v.currentTime >= v.duration-.04);
      const sought = await Promise.allSettled(ready.map(async v => {
        if (!unfinished) { v.currentTime = 0; await this.wait(v,()=>!v.seeking,['seeked'],signal); }
        if (!unfinished || (!v.ended && v.currentTime < v.duration-.04)) await this.wait(v,()=>v.readyState >= 2,['canplay','loadeddata'],signal);
        return v;
      }));
      if (signal.aborted) return;
      ready = sought.filter(r=>r.status === 'fulfilled').map(r=>r.value); this.members = ready;
      const starts = await Promise.allSettled(ready.map(async v => {
        if (unfinished && (v.ended || v.currentTime >= v.duration-.04)) return v;
        const play = v.play();
        Promise.resolve(play).then(()=>{if((signal.aborted || !this.members.includes(v)) && !(this.state === 'playing' && this.members.includes(v)))v.pause();},()=>{});
        await this.bounded(play,signal); return v;
      }));
      if (signal.aborted) return;
      const successful = starts.filter(r=>r.status === 'fulfilled').map(r=>r.value).filter(v=>!v.error && v.isConnected !== false && Number.isFinite(v.duration) && v.duration > 0);
      ready.filter(v=>!successful.includes(v)).forEach(v=>v.pause()); this.members = successful;
      if (!successful.length) throw new Error('none');
      // Stable DOM order breaks equal-duration ties. Only this master may restart a cycle.
      this.master = successful.reduce((a,b)=>b.duration>a.duration?b:a);
      this.state = 'playing'; this.operation = null;
      this.message = successful.length < this.videos.length ? 'partial' : ''; this.notify();
      if (this.master.ended) void this.start(true);
    } catch {
      if (!signal.aborted) { this.stop(); this.message = 'failed'; this.notify(); }
    }
  }
  pause(message = '') {
    const hasCycle = this.members.length > 0;
    this.state = hasCycle ? 'paused' : 'idle'; this.cancel(); this.message = message;
    this.videos.forEach(v=>v.pause()); this.notify();
  }
  stop(message = '', except = null) {
    this.state = 'idle'; this.cancel(); this.message = message;
    this.videos.forEach(v=>{ if(v !== except)v.pause(); });
    this.members = []; this.master = null;
    this.loops?.forEach((loop,v)=>{v.loop=loop;}); this.loops = null; this.notify();
  }
  remove(video) {
    if (!this.members.includes(video)) return;
    this.members = this.members.filter(v=>v!==video && v.isConnected !== false && !v.error && Number.isFinite(v.duration) && v.duration > 0);
    if (!this.members.length) { this.stop(); this.message='failed'; this.notify(); return; }
    this.master = this.members.reduce((a,b)=>b.duration>a.duration?b:a); this.message = 'partial'; this.notify();
    if (this.state === 'playing' && this.master.ended) void this.start(true);
  }
}

export function attachGridPlayback(grid) {
  const videos = [...grid.querySelectorAll('video')]; if (videos.length < 2) return null;
  const zh = document.documentElement.dataset.lang === 'zh';
  const labels = zh ? {play:'全部播放',pause:'全部暂停',loading:'取消加载',partial:'部分视频无法参与，其余视频继续。',failed:'视频未能开始播放，可重试或使用各视频控件。',manual:'已退出同步；再次全部播放将从头开始。',buffer:'缓冲中，整组已暂停；点击全部播放继续。',background:'整组已暂停；点击全部播放继续。'} : {play:'Play All',pause:'Pause All',loading:'Cancel loading',partial:'Some videos could not join; the remaining videos continue.',failed:'Playback could not start. Retry or use individual controls.',manual:'Group mode ended. Play All starts a fresh cycle.',buffer:'Buffering: group paused. Play All resumes.',background:'Group paused. Play All resumes.'};
  const toolbar = document.createElement('div'); toolbar.className='blog-grid-controls';
  const button = document.createElement('button'); button.type='button';
  const status = document.createElement('span'); status.className='blog-grid-playback-status'; status.setAttribute('role','status');
  toolbar.append(status,button); grid.before(toolbar);
  const controller = new GridPlayback(videos,{onState:(state,message)=>{
    grid.toggleAttribute('data-grid-playing',state==='playing'||state==='loading');
    button.textContent = (state==='playing'?'Ⅱ ':state==='loading'?'× ':'▶ ') + labels[state==='playing'?'pause':state==='loading'?'loading':'play'];
    button.setAttribute('aria-pressed',String(state==='playing')); button.setAttribute('aria-busy',String(state==='loading'));
    status.textContent=labels[message]||'';
  }});
  controller.notify(); button.addEventListener('click',()=>{if(['playing','loading'].includes(controller.state))controller.pause();else void controller.start();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden && ['playing','loading'].includes(controller.state))controller.pause('background');});
  addEventListener('pagehide',()=>controller.stop());
  const observer = new MutationObserver(()=>videos.forEach(v=>{if(!grid.contains(v))controller.remove(v);}));observer.observe(grid,{childList:true,subtree:true});
  const visibility = new IntersectionObserver(entries=>{if(!entries[0].isIntersecting && ['playing','loading'].includes(controller.state))controller.pause('background');});visibility.observe(grid);
  return controller;
}
if (typeof document !== 'undefined') document.querySelectorAll('.blog-media-grid').forEach(attachGridPlayback);
