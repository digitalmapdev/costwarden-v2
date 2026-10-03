(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];

  // soft cursor lighting
  const glow = qs('.cursor-glow');
  if (glow && !reduce && matchMedia('(pointer:fine)').matches) {
    addEventListener('pointermove', e => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, {passive:true});
  }

  // reveal
  const revealIO = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in'); revealIO.unobserve(entry.target); }
  }), {threshold:.18});
  qsa('.reveal').forEach(el => revealIO.observe(el));

  // tiny 3D response on product card
  qsa('[data-tilt]').forEach(card => {
    if (reduce || !matchMedia('(pointer:fine)').matches) return;
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width-.5;
      const y = (e.clientY-r.top)/r.height-.5;
      card.style.transform = `perspective(1100px) rotateX(${(-y*2.2).toFixed(2)}deg) rotateY(${(x*2.6).toFixed(2)}deg)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });

  // hero live analysis
  const data = {
    software:{title:'Overlapping software licences',text:'Similar tools appear across teams while some licences show little recent activity.',items:'12',value:'€8,420',source:'Subscription export',signal:'High signal'},
    suppliers:{title:'Supplier category overlap',text:'Several vendors appear in overlapping service categories across separate teams or cost centres.',items:'7',value:'€14,680',source:'Invoice export',signal:'Review'},
    telecom:{title:'Recurring service increase',text:'A recurring service cost rises across recent periods without a matching volume change.',items:'4',value:'€5,260',source:'GL + invoice data',signal:'Review'}
  };
  const rows = qsa('.source-row');
  const amount = qs('#scanAmount'), pct=qs('#scanPercent'), bar=qs('#scanProgress'), status=qs('#analysisStatus'), card=qs('#findingCard');
  let timers=[], raf;
  const clearRun = () => { timers.forEach(clearTimeout); timers=[]; if(raf) cancelAnimationFrame(raf); };
  const later=(fn,ms)=>timers.push(setTimeout(fn,reduce?0:ms));
  function setFinding(key){
    const d=data[key];
    qs('#findingTitle').textContent=d.title; qs('#findingText').textContent=d.text; qs('#findingItems').textContent=d.items; qs('#findingValue').textContent=d.value; qs('#findingSource').textContent=d.source; qs('#signalBadge').textContent=d.signal;
    card.classList.add('visible');
    rows.forEach(r=>r.classList.toggle('active',r.dataset.key===key));
  }
  function rowState(i,state,label){
    const r=rows[i]; if(!r)return; r.classList.remove('scanning','done'); if(state)r.classList.add(state); const t=qs('b span',r); if(t)t.textContent=label;
  }
  function animateScan(){
    const dur=reduce?1:3000,start=performance.now();
    const loop=now=>{const p=Math.min((now-start)/dur,1),e=1-Math.pow(1-p,3);amount.textContent=Math.floor(284520*e).toLocaleString('en-US');pct.textContent=Math.floor(e*100)+'%';bar.style.width=(e*100)+'%';if(p<1)raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);
  }
  function runHero(){
    clearRun(); card.classList.remove('visible'); qs('#evidencePopover').hidden=true; amount.textContent='0';pct.textContent='0%';bar.style.width='0';status.textContent='Analyzing';rows.forEach((r,i)=>{r.classList.remove('active','scanning','done');qs('b span',r).textContent=i===0?'Scanning':'Queued'});rows[0].classList.add('active','scanning');animateScan();
    later(()=>{rowState(0,'done','Reviewed');rowState(1,'scanning','Scanning')},850);
    later(()=>{rowState(1,'done','Reviewed');rowState(2,'scanning','Scanning')},1650);
    later(()=>{rowState(2,'done','Reviewed');status.textContent='Finding ready';setFinding('software')},2600);
  }
  rows.forEach(r=>r.addEventListener('click',()=>setFinding(r.dataset.key)));
  qs('#replayHero')?.addEventListener('click',runHero);
  qs('#inspectEvidence')?.addEventListener('click',()=>qs('#evidencePopover').hidden=false);
  qs('#closeEvidence')?.addEventListener('click',()=>qs('#evidencePopover').hidden=true);
  addEventListener('keydown',e=>{if(e.key==='Escape'&&qs('#evidencePopover'))qs('#evidencePopover').hidden=true});
  const productIO=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){runHero();productIO.disconnect()}}),{threshold:.3}); if(qs('#heroProduct'))productIO.observe(qs('#heroProduct'));

  // sticky story
  const mapCopy=[
    ['INPUT','Existing spend exports','No system replacement. Start from files your finance team already has.','Receiving spend data'],
    ['STRUCTURE','Comparable categories and vendors','Normalize names, categories and recurring costs into a view that can actually be compared.','Normalizing records'],
    ['DETECTION','Patterns worth reviewing','Surface overlaps, recurring shifts and supplier patterns instead of asking someone to hunt manually.','Scanning patterns'],
    ['EVIDENCE','A finding with a reason','Keep a path from the review candidate back to the data that caused it to surface.','Linking evidence']
  ];
  function setStory(i){
    qsa('.map-node').forEach((n,j)=>n.classList.toggle('active',i===j)); const d=mapCopy[i]; qs('#mapResult span').textContent=d[0]; qs('#mapResult strong').textContent=d[1]; qs('#mapResult p').textContent=d[2]; qs('#mapCoreStatus').textContent=d[3];
  }
  qsa('.map-node').forEach(n=>n.addEventListener('click',()=>setStory(+n.dataset.map)));
  const steps=qsa('.story-step');
  const storyIO=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)setStory(+e.target.dataset.step)}),{threshold:.55}); steps.forEach(s=>storyIO.observe(s));

  // findings selector
  const stageData={
    software:{label:'SOFTWARE / ILLUSTRATIVE FINDING',title:'Similar tools. Separate teams. One review opportunity.',text:'Recurring subscriptions with similar functions appear across teams, while activity suggests part of the licence base may be worth reviewing.',e:['3 products in the same functional category','Low activity on a subset of licences','Validate owners, usage and renewal dates']},
    supplier:{label:'SUPPLIERS / ILLUSTRATIVE FINDING',title:'Several vendors. Overlapping scope. A consolidation question.',text:'Multiple suppliers appear to provide comparable services across separate parts of the business, creating a useful place to review commercial overlap.',e:['4 vendors mapped to a similar category','Pricing and service scope vary by team','Compare contracts, owners and renewal windows']},
    recurring:{label:'RECURRING COSTS / ILLUSTRATIVE FINDING',title:'A recurring cost moved. The reason is not obvious.',text:'A recurring service cost changes across recent periods without a clear volume signal, making the movement worth understanding before the next renewal.',e:['Recurring charge increased across recent periods','Volume pattern does not explain the full movement','Validate scope, unit rate and contract change']}
  };
  qsa('.finding-selector button').forEach(btn=>btn.addEventListener('click',()=>{
    qsa('.finding-selector button').forEach(b=>b.classList.toggle('active',b===btn)); const d=stageData[btn.dataset.finding]; qs('#stageLabel').textContent=d.label; qs('#stageTitle').textContent=d.title; qs('#stageText').textContent=d.text; qsa('#stageEvidence strong').forEach((el,i)=>el.textContent=d.e[i]);
  }));
})();
