(function(){
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  /* ------------------------------------------------------------------
     Sound — a tiny synth kit. Every cue is generated with WebAudio, so
     there are no audio files to ship and nothing to preload. Off unless
     the visitor turns it on; the context stays suspended until then, so
     we never trip a browser autoplay block.
     ------------------------------------------------------------------ */
  var Sound = (function(){
    var ctx = null, master = null, on = false, lastHover = 0;

    function boot(){
      if(ctx) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return false;
      try{
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.13;
        master.connect(ctx.destination);
      }catch(e){ ctx = null; return false; }
      return true;
    }
    function live(){
      if(!on || !ctx) return false;
      if(ctx.state === 'suspended'){ ctx.resume(); }
      return true;
    }
    function tone(from, to, dur, type, gain){
      if(!live()) return;
      var t = ctx.currentTime;
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t);
      if(to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + dur + 0.02);
    }
    function noise(dur, freq, gain){
      if(!live()) return;
      var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for(var i = 0; i < len; i++){ d[i] = (Math.random() * 2 - 1) * (1 - i / len); }
      var src = ctx.createBufferSource(); src.buffer = buf;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 0.8;
      var g = ctx.createGain(); g.gain.value = gain;
      src.connect(bp); bp.connect(g); g.connect(master);
      src.start();
    }
    return {
      enable: function(v){ on = v; if(v) boot(); },
      /* throttled: sweeping a cursor across a list should not machine-gun */
      hover: function(){
        var now = Date.now();
        if(now - lastHover < 70) return;
        lastHover = now;
        tone(2050, 2500, 0.05, 'sine', 0.16);
      },
      click: function(){ tone(540, 190, 0.15, 'triangle', 0.34); },
      swipe: function(){ noise(0.2, 1500, 0.3); }
    };
  })();

  /* lang toggle */
  var btn = document.getElementById('langToggle');
  function setLang(lang){
    body.setAttribute('data-lang', lang);
    document.documentElement.lang = lang;
    btn.textContent = lang === 'fr' ? 'EN' : 'FR';
    btn.setAttribute('aria-pressed', lang === 'en');
    try{ localStorage.setItem('ob-lang', lang); }catch(e){}
  }
  var saved = null;
  try{ saved = localStorage.getItem('ob-lang'); }catch(e){}
  setLang(saved === 'en' ? 'en' : 'fr');
  btn.addEventListener('click', function(){
    setLang(body.getAttribute('data-lang') === 'fr' ? 'en' : 'fr');
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if(hasGsap){ gsap.registerPlugin(ScrollTrigger); }

  /* smooth scroll (Lenis), wired into GSAP's ticker + ScrollTrigger */
  var lenis = null;
  if(!reduce && window.Lenis){
    lenis = new Lenis({
      duration: 1.1,
      easing: function(t){ return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
      smoothWheel: true
    });
    if(hasGsap){
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(time){ lenis.raf(time); requestAnimationFrame(raf); });
    }
    /* keep the page frozen behind the intro overlay; restarted on intro:done */
    if(!document.documentElement.classList.contains('intro-done')) lenis.stop();
  }

  /* scroll reveal */
  if(!reduce && hasGsap){
    document.querySelectorAll('.reveal').forEach(function(el){
      gsap.to(el, {
        opacity:1, y:0, duration:0.9, ease:'power3.out',
        onComplete:function(){ gsap.set(el, {clearProps:'transform'}); },
        scrollTrigger:{ trigger: el, start:'top 88%', once:true }
      });
    });
    document.querySelectorAll('.mask-reveal').forEach(function(el){
      if(el.id === 'mr1' || el.id === 'mr2') return; /* handled by the intro handoff */
      gsap.to(el.querySelectorAll('.word span'), {
        y:0, duration:0.9, ease:'power3.out', stagger:0.06,
        scrollTrigger:{ trigger: el, start:'top 88%', once:true }
      });
    });
    gsap.set('.tk-group .chip', {opacity:0, y:10});
    document.querySelectorAll('.tk-group').forEach(function(group){
      gsap.to(group.querySelectorAll('.chip'), {
        opacity:1, y:0, duration:0.55, ease:'power2.out', stagger:0.045,
        scrollTrigger:{ trigger: group, start:'top 92%', once:true }
      });
    });
    var slimList = document.querySelector('.slim-list');
    if(slimList){
      gsap.set(slimList.children, {opacity:0, y:14});
      gsap.to(slimList.children, {
        opacity:1, y:0, duration:0.6, ease:'power2.out', stagger:0.1,
        scrollTrigger:{ trigger: slimList, start:'top 88%', once:true }
      });
    }
  } else if(!reduce && 'IntersectionObserver' in window){
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('is-visible'); obs.unobserve(e.target); }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.reveal, .mask-reveal').forEach(function(el){ obs.observe(el); });
  } else {
    document.querySelectorAll('.reveal, .mask-reveal').forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* grain */
  var canvas = document.getElementById('grain');
  var ctx = canvas.getContext('2d');
  canvas.width = 220; canvas.height = 220;
  canvas.style.width = '100vw'; canvas.style.height = '100vh';
  var imgData = ctx.createImageData(220,220);
  for(var i=0;i<imgData.data.length;i+=4){
    var v = Math.random()*255;
    imgData.data[i]=v; imgData.data[i+1]=v; imgData.data[i+2]=v; imgData.data[i+3]=255;
  }
  ctx.putImageData(imgData,0,0);

  /* intro → hero handoff: the name in the hero only unmasks once the
     black overlay has wiped away (see the controller in index.html) */
  (function(){
    function revealHero(){
      var a = document.getElementById('mr1'), b = document.getElementById('mr2');
      if(a) a.classList.add('is-visible');
      if(b) setTimeout(function(){ b.classList.add('is-visible'); }, 90);
      if(lenis) lenis.start();
    }
    if(document.documentElement.classList.contains('intro-done')) revealHero();
    else document.addEventListener('intro:done', revealHero, {once:true});
  })();

  /* custom cursor + magnetic buttons (fine pointers only) */
  if(fine && !reduce){
    body.classList.add('has-cursor');
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    var rx=0, ry=0, tx=0, ty=0;
    window.addEventListener('mousemove', function(e){
      dot.style.transform = 'translate3d('+e.clientX+'px,'+e.clientY+'px,0)';
      tx = e.clientX; ty = e.clientY;
      if(!body.classList.contains('cursor-live')){
        rx = tx; ry = ty; /* avoid the ring easing in from the corner */
        body.classList.add('cursor-live');
      }
    });
    function loop(){
      rx += (tx-rx)*0.18; ry += (ty-ry)*0.18;
      ring.style.transform = 'translate3d('+rx+'px,'+ry+'px,0)';
      requestAnimationFrame(loop);
    }
    loop();
    document.querySelectorAll('a, button').forEach(function(el){
      el.addEventListener('mouseenter', function(){ body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function(){ body.classList.remove('cursor-hover'); });
    });
    document.querySelectorAll('.magnetic').forEach(function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var relX = e.clientX - r.left - r.width/2;
        var relY = e.clientY - r.top - r.height/2;
        el.style.transform = 'translate('+(relX*0.3)+'px,'+(relY*0.35)+'px)';
      });
      el.addEventListener('mouseleave', function(){ el.style.transform = ''; });
    });

    /* cursor "view" label on gallery figures */
    var label = document.getElementById('cursor-label');
    document.querySelectorAll('.feature-gallery figure').forEach(function(fig){
      fig.addEventListener('mouseenter', function(){
        var lang = body.getAttribute('data-lang');
        label.textContent = lang === 'en' ? fig.getAttribute('data-view-en') : fig.getAttribute('data-view-fr');
        body.classList.add('cursor-view');
      });
      fig.addEventListener('mouseleave', function(){ body.classList.remove('cursor-view'); });
    });
  }

  /* count-up on facts */
  var countEls = document.querySelectorAll('.fact-value');
  var counted = false;
  function runCountUp(){
    if(counted) return; counted = true;
    countEls.forEach(function(el){
      var m = el.textContent.match(/^(\d+)(\+?)$/);
      if(!m) return;
      var target = parseInt(m[1],10), suffix = m[2] || '';
      el.classList.add('countup');
      if(reduce){ return; }
      var start = null, dur = 900;
      function step(ts){
        if(!start) start = ts;
        var p = Math.min((ts-start)/dur, 1);
        var val = Math.round(p * target);
        el.textContent = (target < 10 ? String(val).padStart(2,'0') : val) + suffix;
        if(p < 1) requestAnimationFrame(step);
        else el.textContent = (target < 10 ? String(target).padStart(2,'0') : target) + suffix;
      }
      requestAnimationFrame(step);
    });
  }
  var factsSection = document.querySelector('.facts');
  if(factsSection && 'IntersectionObserver' in window){
    var factsObs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ runCountUp(); factsObs.disconnect(); } });
    }, {threshold:0.4});
    factsObs.observe(factsSection);
  }

  /* hero ghost parallax — the ghost is gone now that the black hole is the
     hero background, so this is a no-op unless the element comes back */
  var ghost = document.getElementById('heroGhost');
  if(!reduce && ghost){
    var ticking = false;
    window.addEventListener('scroll', function(){
      if(!ticking){
        requestAnimationFrame(function(){
          ghost.style.transform = 'translateY(' + (window.scrollY*0.15) + 'px)';
          ticking = false;
        });
        ticking = true;
      }
    }, {passive:true});
  }

  /* pinned capability stack — GSAP ScrollTrigger, desktop only, safe no-op fallback */
  if(hasGsap && !reduce){
    ScrollTrigger.matchMedia({
      "(min-width: 861px)": function(){
        var pin = document.getElementById('stackPin');
        if(!pin) return;
        var cards = gsap.utils.toArray('.stack-card', pin);
        if(cards.length < 2) return;
        pin.classList.add('stack-ready');
        cards.forEach(function(card, i){
          if(i === 0) return;
          gsap.set(card, {yPercent:100});
        });
        var tl = gsap.timeline({
          scrollTrigger:{
            trigger: pin, start:'top top',
            end:'+=' + (window.innerHeight * (cards.length - 1) * 0.9),
            pin:true, scrub:0.5, pinSpacing:true
          }
        });
        cards.forEach(function(card, i){
          if(i === 0) return;
          tl.to(card, {yPercent:0, ease:'none', duration:1}, i - 1);
        });
        return function(){
          pin.classList.remove('stack-ready');
          gsap.set(cards, {clearProps:'all'});
        };
      }
    });
  }

  /* "hold to blast" — a small delight on the availability pill */
  (function(){
    var pill = document.getElementById('statusPill');
    var fx = document.getElementById('fx');
    if(!pill || !fx) return;
    var fctx = fx.getContext('2d');
    function sizeFx(){ fx.width = window.innerWidth; fx.height = window.innerHeight; }
    sizeFx();
    window.addEventListener('resize', sizeFx);

    var particles = [];
    var palette = ['#c8a96a', '#f4f1e8', '#a98c4f'];
    function blastAt(x, y){
      for(var i=0;i<28;i++){
        var angle = (Math.PI*2) * (i/28) + Math.random()*0.4;
        var speed = 2.5 + Math.random()*4;
        particles.push({
          x:x, y:y,
          vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
          size:2 + Math.random()*3,
          color:palette[i % palette.length],
          life:1
        });
      }
      if(!raf){ raf = requestAnimationFrame(tick); }
    }
    var raf = null;
    function tick(){
      fctx.clearRect(0,0,fx.width,fx.height);
      particles.forEach(function(p){
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.018;
        fctx.globalAlpha = Math.max(p.life,0);
        fctx.fillStyle = p.color;
        fctx.fillRect(p.x, p.y, p.size, p.size);
      });
      particles = particles.filter(function(p){ return p.life > 0; });
      fctx.globalAlpha = 1;
      if(particles.length){ raf = requestAnimationFrame(tick); } else { raf = null; }
    }

    var holdTimer = null, holdStart = 0;
    var HOLD_MS = 550;
    function startHold(){
      if(reduce){ triggerBlast(); return; }
      pill.classList.add('charging');
      holdStart = Date.now();
      holdTimer = setTimeout(triggerBlast, HOLD_MS);
    }
    function cancelHold(){
      pill.classList.remove('charging');
      clearTimeout(holdTimer);
    }
    function triggerBlast(){
      pill.classList.remove('charging');
      var r = pill.getBoundingClientRect();
      blastAt(r.left + r.width/2, r.top + r.height/2);
    }
    pill.addEventListener('pointerdown', startHold);
    pill.addEventListener('pointerup', cancelHold);
    pill.addEventListener('pointerleave', cancelHold);
    pill.addEventListener('click', function(e){ e.preventDefault(); });
    pill.addEventListener('pointerdown', function(){ Sound.click(); });
  })();

  /* ---- sound toggle ------------------------------------------------ */
  (function(){
    var btn = document.getElementById('sndToggle');
    if(!btn) return;
    var on = false;
    try{ on = localStorage.getItem('ob-sound') === '1'; }catch(e){}
    function set(v){
      on = v;
      Sound.enable(v);
      btn.classList.toggle('is-on', v);
      btn.setAttribute('aria-pressed', String(v));
      btn.setAttribute('aria-label', v ? 'Couper le son' : 'Activer le son');
      try{ localStorage.setItem('ob-sound', v ? '1' : '0'); }catch(e){}
    }
    set(on);
    btn.addEventListener('click', function(){ set(!on); if(on) Sound.click(); });
  })();

  /* ---- sound cues on interactive elements -------------------------- */
  (function(){
    if(fine){
      document.querySelectorAll('a, button, .svc, .chip, .plat, .slim-item, .pf').forEach(function(el){
        el.addEventListener('mouseenter', function(){ Sound.hover(); });
      });
    }
    document.querySelectorAll('a, button').forEach(function(el){
      el.addEventListener('click', function(){ Sound.click(); });
    });
  })();

  /* ---- scroll progress hairline ------------------------------------ */
  (function(){
    var bar = document.getElementById('scroll-progress');
    if(!bar) return;
    var ticking = false;
    function paint(){
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(window.scrollY / h, 1) : 0) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ requestAnimationFrame(paint); ticking = true; }
    }, {passive:true});
    paint();
  })();

  /* ---- proof counters ---------------------------------------------- */
  (function(){
    var grid = document.querySelector('.proof-grid');
    if(!grid || !('IntersectionObserver' in window)) return;
    function run(el){
      var target = parseFloat(el.getAttribute('data-count'));
      if(isNaN(target)) return;
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = (String(el.getAttribute('data-count')).split('.')[1] || '').length;
      if(reduce){ el.textContent = prefix + target.toFixed(decimals) + suffix; return; }
      var start = null, dur = 1100;
      function step(ts){
        if(!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + (eased * target).toFixed(decimals) + suffix;
        if(p < 1) requestAnimationFrame(step);
        else el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
      requestAnimationFrame(step);
    }
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        grid.querySelectorAll('.pf-val[data-count]').forEach(run);
        obs.disconnect();
      });
    }, {threshold:0.3});
    obs.observe(grid);
  })();

  /* ---- marquee reacts to scroll velocity --------------------------- */
  (function(){
    if(reduce || !lenis) return;
    var segs = document.querySelectorAll('.marquee-seg');
    if(!segs.length) return;
    var target = 0, current = 0;
    lenis.on('scroll', function(e){
      target = Math.max(-16, Math.min(16, -(e.velocity || 0) * 0.28));
    });
    (function loop(){
      current += (target - current) * 0.12;
      target *= 0.9; /* decay back to rest when the scroll stops */
      if(Math.abs(current) > 0.01){
        for(var i = 0; i < segs.length; i++){ segs[i].style.transform = 'skewX(' + current.toFixed(2) + 'deg)'; }
      }
      requestAnimationFrame(loop);
    })();
  })();

  /* ---- parallax on the gallery + portrait -------------------------- */
  if(hasGsap && !reduce){
    gsap.utils.toArray('.feature-gallery img').forEach(function(img, i){
      gsap.fromTo(img, {yPercent: -6}, {
        yPercent: 6, ease:'none',
        scrollTrigger:{ trigger: img.parentNode, start:'top bottom', end:'bottom top', scrub: 0.6 }
      });
    });
    var portrait = document.querySelector('.profile-photo img');
    if(portrait){
      gsap.fromTo(portrait, {scale:1.08}, {
        scale:1, ease:'none',
        scrollTrigger:{ trigger: portrait, start:'top bottom', end:'bottom top', scrub: 0.8 }
      });
    }
  }

  /* ---- proof screenshot lightbox ----------------------------------- */
  (function(){
    var box = document.getElementById('lightbox');
    var img = document.getElementById('lbImg');
    var close = document.getElementById('lbClose');
    var buttons = document.querySelectorAll('.shot-btn');
    if(!box || !img || !buttons.length) return;
    var opener = null;

    function open(btn){
      var src = btn.getAttribute('data-full');
      var thumb = btn.querySelector('img');
      opener = btn;
      img.src = src;
      img.alt = thumb ? thumb.alt : '';
      box.hidden = false;
      /* next frame so the transition has a from-state to animate out of */
      requestAnimationFrame(function(){ box.classList.add('is-open'); });
      if(lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
      close.focus();
    }
    function shut(){
      box.classList.remove('is-open');
      if(lenis) lenis.start();
      document.body.style.overflow = '';
      setTimeout(function(){ box.hidden = true; img.src = ''; }, 300);
      if(opener){ opener.focus(); opener = null; }
    }

    buttons.forEach(function(btn){
      btn.addEventListener('click', function(){ open(btn); });
    });
    close.addEventListener('click', shut);
    box.addEventListener('click', function(e){ if(e.target === box) shut(); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && !box.hidden) shut();
    });
  })();

  /* ---- active nav link --------------------------------------------- */
  (function(){
    if(!('IntersectionObserver' in window)) return;
    var links = {};
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(function(a){
      links[a.getAttribute('href').slice(1)] = a;
    });
    /* Track the whole visible set rather than the last event, otherwise the
       highlight sticks on whatever fired last once we scroll off every
       observed section (the hero, for instance, has no nav entry). */
    var order = Object.keys(links);
    var visible = Object.create(null);
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting) visible[e.target.id] = 1; else delete visible[e.target.id];
      });
      order.forEach(function(k){ links[k].classList.remove('is-active'); });
      for(var i = 0; i < order.length; i++){
        if(visible[order[i]]){ links[order[i]].classList.add('is-active'); break; }
      }
    }, {rootMargin:'-45% 0px -50% 0px'});
    Object.keys(links).forEach(function(id){
      var sec = document.getElementById(id);
      if(sec) obs.observe(sec);
    });
  })();
})();
