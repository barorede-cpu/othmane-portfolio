(function(){
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

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
      if(el.id === 'mr1' || el.id === 'mr2') return; /* handled by preloader */
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

  /* preloader */
  var pre = document.getElementById('preloader');
  var fill = document.getElementById('preloadFill');
  function finishPreload(){
    document.getElementById('mr1').classList.add('is-visible');
    setTimeout(function(){ document.getElementById('mr2').classList.add('is-visible'); }, 90);
    pre.classList.add('is-done');
    setTimeout(function(){ pre.style.display = 'none'; }, 700);
  }
  if(reduce){
    pre.style.display = 'none';
    document.getElementById('mr1').classList.add('is-visible');
    document.getElementById('mr2').classList.add('is-visible');
  } else {
    var pct = 0;
    var t = setInterval(function(){
      pct += Math.random()*18 + 8;
      if(pct >= 100){ pct = 100; clearInterval(t); setTimeout(finishPreload, 220); }
      fill.style.width = pct + '%';
    }, 140);
  }

  /* custom cursor + magnetic buttons (fine pointers only) */
  if(fine && !reduce){
    body.classList.add('has-cursor');
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    var rx=0, ry=0, tx=0, ty=0;
    window.addEventListener('mousemove', function(e){
      dot.style.transform = 'translate3d('+e.clientX+'px,'+e.clientY+'px,0)';
      tx = e.clientX; ty = e.clientY;
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

  /* hero ghost parallax */
  if(!reduce){
    var ghost = document.getElementById('heroGhost');
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
    var palette = ['#e6ff4d', '#101114', '#c7db3f'];
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
  })();
})();
