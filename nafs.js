    const $ = (s)=>document.querySelector(s);
    const $$ = (s)=>document.querySelectorAll(s);
    const root = document.documentElement;
    const body = document.body;

    // Year
    $('#year').textContent = new Date().getFullYear();

    // Smooth scroll helper
    function scrollToId(id){
      document.getElementById(id).scrollIntoView({behavior:'smooth', block:'start'});
    }

    // Theme toggle (supports two buttons: desktop + mobile)
    const themeButtons = [document.getElementById('themeBtn'), document.getElementById('themeBtn2')].filter(Boolean);
    const saved = localStorage.getItem('theme');
    if(saved){ body.setAttribute('data-theme', saved); }
    themeButtons.forEach(btn=>btn.addEventListener('click', ()=>{
      const cur = body.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      body.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }));

    // Modal
    function openModal(){
      document.getElementById('modal').classList.remove('hide');
      document.body.classList.add('modal-open');
      setTimeout(()=>{
        const f = document.querySelector('.modal-panel input, .modal-panel select, .modal-panel textarea, .modal-close');
        if(f && typeof f.focus === 'function') f.focus();
      }, 10);
    }
    function closeModal(){
      document.getElementById('modal').classList.add('hide');
      document.body.classList.remove('modal-open');
    }
    window.openModal = openModal; window.closeModal = closeModal;

    function e2e(e){
      e.preventDefault();
      closeModal();
      // flash success toast
      const toast = document.createElement('div');
      toast.textContent = 'تم استلام طلبك! سنعود إليك قريبًا.';
      toast.style.cssText = 'position:fixed;inset-inline:0;bottom:20px;margin:auto;max-width:700px;padding:14px 18px;border-radius:14px;border:1px solid var(--stroke);background:var(--glass);backdrop-filter:blur(8px);text-align:center;z-index:9999;box-shadow:var(--shadow)';
      document.body.appendChild(toast);
      setTimeout(()=>toast.remove(), 2600);
    }

    // Counters on view
    const counters = [
      {el:'#c1', from:0, to:38, suffix:'%'},
      {el:'#c2', from:0, to:124, suffix:''},
      {el:'#m1', from:0, to:47, suffix:''},
      {el:'#m2', from:0, to:6, suffix:''},
      {el:'#m3', from:0, to:92, suffix:'%'}
    ];
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(ent=>{
        if(ent.isIntersecting){
          counters.forEach(c=>animateCount(c.el, c.from, c.to, 900, c.suffix));
          io.disconnect();
        }
      })
    }, {threshold:.25});
    io.observe(document.querySelector('.hero-stats'));

    function animateCount(sel, from, to, dur, suffix){
      const el = document.querySelector(sel); if(!el) return;
      const t0 = performance.now();
      const step = (t)=>{
        const p = Math.min(1, (t - t0)/dur);
        const val = Math.floor(from + (to - from) * p);
        el.textContent = val + (suffix||'');
        if(p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    // Trend chart (enhanced)
    (function(){
      const canvas = document.getElementById('trend'); if(!canvas) return;
      const ctx = canvas.getContext('2d');
      let data = [14,18,22,19,24,28,27,31,36,34,38,41];
      let playing = false; let timer = null; let range = 'm';
      const pad = 16;
      function size(){
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;
        ctx.setTransform(1,0,0,1,0,0);
        ctx.scale(devicePixelRatio, devicePixelRatio);
      }
      function grid(){
        const w = canvas.clientWidth - pad*2; const h = canvas.clientHeight - pad*2;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.globalAlpha = .25; ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--stroke'); ctx.lineWidth = 1;
        for(let i=0;i<=4;i++){ let y = pad + h*(i/4); ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad+w, y); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
      function drawLine(ds){
        const w = canvas.clientWidth - pad*2; const h = canvas.clientHeight - pad*2;
        const max = Math.max(...ds) * 1.15; const min = 0;
        ctx.beginPath(); ctx.lineWidth = 3;
        const grad = ctx.createLinearGradient(pad,0,pad+w,0); grad.addColorStop(0,'#6ef3ff'); grad.addColorStop(1,'#7aa2ff'); ctx.strokeStyle = grad;
        ds.forEach((v,i)=>{
          const x = pad + (w/(ds.length-1))*i;
          const y = pad + h - (v-min)/(max-min)*h;
          if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
        const grad2 = ctx.createLinearGradient(0,pad,0,pad+h);
        grad2.addColorStop(0,'rgba(110,243,255,.35)');
        grad2.addColorStop(1,'rgba(122,162,255,0)');
        ctx.lineTo(pad+w, pad+h); ctx.lineTo(pad, pad+h); ctx.closePath(); ctx.fillStyle = grad2; ctx.fill();
      }
      function redraw(){ size(); grid(); drawLine(data); }
      function nextPoint(base){
        const last = base[base.length-1];
        const drift = (Math.random()-.5)*6; const v = Math.max(4, last + drift);
        return Math.round(v);
      }
      function tick(){
        const len = range==='w'?7:12;
        if(data.length!==len){
          // remap length
          while(data.length>len) data.shift();
          while(data.length<len) data.push(nextPoint(data));
        } else {
          data = data.slice(1).concat(nextPoint(data));
        }
        redraw();
      }
      function play(on){
        playing = typeof on==='boolean'? on : !playing;
        clearInterval(timer);
        if(playing){ timer = setInterval(tick, 1500); }
        const btn = document.getElementById('trendPlay'); if(btn) btn.textContent = playing ? '⏸' : '▶';
      }
      function setRange(r){ range = r==='w'?'w':'m'; redraw(); }
      // Controls
      const seg = document.getElementById('trendRange');
      if(seg){
        seg.querySelectorAll('button').forEach(b=>{
          b.addEventListener('click',()=>{
            seg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected','false'));
            b.setAttribute('aria-selected','true');
            setRange(b.dataset.range);
          });
        });
      }
      const dl = document.getElementById('trendDL'); if(dl){ dl.addEventListener('click',()=>{
        const a = document.createElement('a'); a.download = 'trend.png'; a.href = canvas.toDataURL('image/png'); a.click();
      }); }
      const pb = document.getElementById('trendPlay'); if(pb){ pb.addEventListener('click',()=>play()); }
      // Crosshair
      let over=false; canvas.addEventListener('mousemove', (e)=>{
        over=true; redraw();
        const rect = canvas.getBoundingClientRect();
        const w = canvas.clientWidth - pad*2; const x = e.clientX - rect.left - pad;
        const i = Math.max(0, Math.min(data.length-1, Math.round((x/w)*(data.length-1))));
        const h = canvas.clientHeight - pad*2; const max = Math.max(...data)*1.15; const min=0;
        const cx = pad + (w/(data.length-1))*i; const cy = pad + h - (data[i]-min)/(max-min)*h;
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(cx, pad); ctx.lineTo(cx, pad+h); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = '#6ef3ff'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill(); ctx.restore();
      });
      canvas.addEventListener('mouseleave', ()=>{ over=false; redraw(); });
      window.addEventListener('resize', redraw);
      redraw();
    })();

    // Animate radial progress
    (function(){
      const els = $$('.progress'); if(!els.length) return;
      const obs = new IntersectionObserver((entries)=>{
        entries.forEach(ent=>{
          if(ent.isIntersecting){
            const el = ent.target; const target = parseFloat(getComputedStyle(el).getPropertyValue('--p')) || parseFloat((el.getAttribute('style')||'').match(/--p:\s*(\d+)/)?.[1]||'0');
            let from=0; const t0 = performance.now();
            const step=(t)=>{ const p = Math.min(1,(t-t0)/900); const v=Math.floor(from + (target-from)*p); el.style.setProperty('--p', v); el.setAttribute('data-label', (el.dataset.labelBase||el.getAttribute('data-label')||'') || ('%'+v)); if(p<1) requestAnimationFrame(step); };
            requestAnimationFrame(step);
            obs.unobserve(el);
          }
        });
      }, {threshold:.3});
      els.forEach(el=>obs.observe(el));
    })();

    // Table: sort, search, export
    (function(){
      const table = document.getElementById('dashTable'); if(!table) return;
      const tbody = table.querySelector('tbody'); const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.forEach((r,i)=>r.dataset.idx=i);
      const headers = table.querySelectorAll('th[data-sort]');
      headers.forEach((th,ci)=>{
        th.addEventListener('click', ()=>{
          const desc = th.classList.toggle('desc'); headers.forEach(h=>{ if(h!==th){ h.classList.remove('desc'); h.classList.remove('asc'); }});
          th.classList.toggle('asc', !desc);
          const dir = desc? -1: 1;
          const get=(tr)=> tr.children[ci].textContent.trim();
          const num=(s)=>{ const m = s.match(/[-+]?\d+(?:\.\d+)?/); return m? parseFloat(m[0]) : null };
          const sorted = rows.slice().sort((a,b)=>{
            const A=get(a), B=get(b); const na=num(A), nb=num(B);
            if(na!==null && nb!==null) return (na-nb)*dir; return A.localeCompare(B,'ar')*dir;
          });
          tbody.innerHTML=''; sorted.forEach(r=>tbody.appendChild(r));
        });
      });
      const q = document.getElementById('tblSearch'); const reset=document.getElementById('tblReset');
      function filter(){ const v=(q.value||'').trim(); const re = v? new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'): null; rows.forEach(r=>{ const txt=r.textContent; r.style.display = re? (re.test(txt)?'':'none') : ''; }); }
      if(q){ q.addEventListener('input', filter); }
      if(reset){ reset.addEventListener('click', ()=>{ if(q){ q.value=''; } rows.forEach(r=>r.style.display=''); tbody.innerHTML=''; rows.sort((a,b)=>a.dataset.idx-b.dataset.idx).forEach(r=>tbody.appendChild(r)); headers.forEach(h=>h.classList.remove('asc','desc')); }); }
      const ex = document.getElementById('tblExport'); if(ex){ ex.addEventListener('click', ()=>{
        const rowsNow = Array.from(tbody.querySelectorAll('tr')).filter(r=>r.style.display!== 'none');
        const out = [Array.from(table.querySelectorAll('thead th')).map(th=>`"${th.textContent.trim()}"`).join(',')]
          .concat(rowsNow.map(r=>Array.from(r.children).map(td=>`"${td.textContent.trim()}"`).join(',')));
        const blob = new Blob([out.join('\n')],{type:'text/csv;charset=utf-8'});
        const a = document.createElement('a'); a.download='table.csv'; a.href=URL.createObjectURL(blob); a.click(); URL.revokeObjectURL(a.href);
      }); }
    })();

    // Copy metric value on click
    ['#m1','#m2','#m3'].forEach(sel=>{ const el=$(sel); if(!el) return; el.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(el.textContent.trim()); }catch{} const t=document.createElement('div'); t.textContent='تم النسخ'; t.style.cssText='position:fixed;inset-inline:0;bottom:20px;margin:auto;max-width:220px;padding:10px 12px;border-radius:12px;border:1px solid var(--stroke);background:var(--glass);backdrop-filter:blur(8px);text-align:center;z-index:9999;box-shadow:var(--shadow)'; document.body.appendChild(t); setTimeout(()=>t.remove(),1600); }); });

    // Tilt interaction for cards/panels
    (function(){
      const els = $$('.tilt'); if(!els.length) return;
      const on=(el,e)=>{
        const r = el.getBoundingClientRect(); const x = (e.clientX - r.left)/r.width - .5; const y = (e.clientY - r.top)/r.height - .5;
        el.style.transform = `perspective(800px) rotateX(${y*-4}deg) rotateY(${x*4}deg)`;
      };
      const off=(el)=>{ el.style.transform='perspective(800px)'; };
      els.forEach(el=>{
        el.addEventListener('pointermove', (e)=>on(el,e));
        el.addEventListener('pointerleave', ()=>off(el));
      });
    })();

    // Accessibility: keyboard close modal/menu (Esc)
    window.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ closeModal(); if(typeof toggleMenu==='function') toggleMenu(false);} });

    // Mobile menu
    const menuBtn = document.getElementById('menuBtn');
    const menuClose = document.getElementById('menuClose');
    const mobileMenu = document.getElementById('mobileMenu');
    function toggleMenu(open){
      if(!mobileMenu) return;
      const isOpen = typeof open === 'boolean' ? open : !mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open', isOpen);
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    if(menuBtn) menuBtn.addEventListener('click', ()=>toggleMenu(true));
    if(menuClose) menuClose.addEventListener('click', ()=>toggleMenu(false));
    if(mobileMenu) mobileMenu.addEventListener('click', (e)=>{ if(e.target === mobileMenu) toggleMenu(false); });

    // Intercept anchor links for smooth scroll + close menu
    $$('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', (e)=>{
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); toggleMenu(false); }
      });
    });

    // Reveal on scroll
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const markReveal = (sel, type)=>{ $$(sel).forEach(el=>{ if(!el.hasAttribute('data-anim')) el.setAttribute('data-anim', type||'up'); }); };
    markReveal('.hero-card','up');
    markReveal('.hero-preview','zoom');
    markReveal('.feature','up');
    markReveal('.persona','up');
    markReveal('.step','up');
    markReveal('.panel','up');
    markReveal('.stat','up');
    if(!prefersReduced){
      const revealIO = new IntersectionObserver((entries)=>{
        entries.forEach(ent=>{ if(ent.isIntersecting){ ent.target.classList.add('in-view'); revealIO.unobserve(ent.target); }});
      }, {threshold:.12});
      $$('[data-anim]').forEach(el=>revealIO.observe(el));
    } else {
      $$('[data-anim]').forEach(el=>el.classList.add('in-view'));
    }

    // Parallax for orbs
    if(!prefersReduced){
      let raf;
      window.addEventListener('pointermove', (e)=>{
        const x = (e.clientX / window.innerWidth) - .5;
        const y = (e.clientY / window.innerHeight) - .5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(()=>{
          const o1 = document.querySelector('.orb.o1');
          const o2 = document.querySelector('.orb.o2');
          if(o1) o1.style.transform = `translate(${x*20}px, ${y*20}px)`;
          if(o2) o2.style.transform = `translate(${x*-16}px, ${y*-16}px)`;
        });
      });
    }

    // Ripple effect for buttons
    document.addEventListener('click', (e)=>{
      const t = e.target.closest('.btn, .btn-icon');
      if(!t) return;
      const rect = t.getBoundingClientRect();
      const span = document.createElement('span');
      span.className = 'ripple';
      span.style.left = (e.clientX - rect.left) + 'px';
      span.style.top = (e.clientY - rect.top) + 'px';
      t.appendChild(span);
      setTimeout(()=>span.remove(), 650);
    });
