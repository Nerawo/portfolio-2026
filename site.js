// Shared navigation, resume URLs and media accessibility.
(() => {
 const zh=document.documentElement.dataset.lang==='zh';
 const base=new URL('.',document.currentScript.src);
 const resumes={en:'file/resume/Lu_Zhang_Resume_02.pdf',zh:'file/resume/张璐_简历_02.pdf'};
 document.querySelectorAll('[data-resume]').forEach(a=>{a.href=new URL(resumes[a.dataset.resume],base).href;a.textContent=zh?(a.dataset.resume==='zh'?'中文简历':'英文简历'):(a.dataset.resume==='zh'?'中文':'English');});
 document.querySelectorAll('video').forEach(v=>{if(!v.closest('.archive-media'))v.preload='none';});
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)e.target.pause();}),{threshold:0});
 document.querySelectorAll('video').forEach(v=>observer.observe(v));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());});
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const stopMotion=()=>{if(motion.matches)document.querySelectorAll('video').forEach(v=>{v.autoplay=false;v.pause();});};motion.addEventListener('change',stopMotion);stopMotion();
 document.querySelectorAll('.resume-menu').forEach(menu=>menu.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.open=false;menu.querySelector('summary').focus();}}));
 const captionTranslations={"Reference and procedural reconstruction":"参考与程序化重构","Cam-follower controller setup":"凸轮与从动件控制器","Analytical linkage construction":"解析连杆结构","Endpoint and suspension system":"端点与悬挂系统","Exposed building parameters":"建筑开放参数","Procedural floor-type assembly":"程序化楼层装配","Combined building body":"组合建筑体量","Houdini network organization":"Houdini 节点网络","Procedural scattering result":"程序化散布结果","Custom orientation function":"自定义朝向函数","Camp Fire Scatter interface":"Camp Fire Scatter 工具界面","GUI callback debugging":"界面回调调试","Procedural kelp leaf network":"程序化海带叶片网络","POP fish-school system":"POP 鱼群系统","Environment and volume network":"环境与体积网络","Nuke camera tracking":"Nuke 摄影机跟踪","Localized Houdini Pyro setup":"局部 Houdini Pyro 设置","Procedural atmospheric fog":"程序化环境雾","Arnold layered rendering":"Arnold 分层渲染","Procedural character construction":"程序化角色构建","Python system structure":"Python 系统结构","Generated shader library":"生成的着色器库","Source animation frame":"源动画帧","Procedural tile layout":"程序化图块布局","Animation build debugging":"动画构建调试"};
 if(zh)document.querySelectorAll('.case-inline-media figure').forEach(figure=>{const caption=figure.querySelector('figcaption'),img=figure.querySelector('img');const text=captionTranslations[img.alt];if(text){caption.textContent=text;img.alt=text;}});
 const dialog=document.createElement('dialog');dialog.className='image-viewer';
 dialog.innerHTML='<button type="button" class="image-viewer-close">'+(zh?'关闭 ×':'Close ×')+'</button><div class="image-viewer-scroll"><img alt=""></div>';
 document.body.append(dialog);const full=dialog.querySelector('img');let trigger;
 const close=()=>dialog.close();dialog.querySelector('button').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 dialog.addEventListener('close',()=>{document.body.classList.remove('viewer-open');trigger?.focus({preventScroll:true});full.removeAttribute('src');});
 document.querySelectorAll('.case-inline-media img').forEach(img=>{
  const button=document.createElement('button');button.className='image-zoom';button.type='button';button.setAttribute('aria-label',(zh?'放大查看：':'Enlarge: ')+img.alt);
  img.before(button);button.append(img);const label=document.createElement('span');label.textContent=zh?'放大查看 ↗':'Enlarge ↗';button.append(label);
  button.addEventListener('click',()=>{trigger=button;full.src=img.currentSrc||img.src;full.alt=img.alt;document.body.classList.add('viewer-open');dialog.showModal();dialog.querySelector('button').focus();});
 });
})();
