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

  /* scroll reveal */
  if(!reduce && 'IntersectionObserver' in window){
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('is-visible'); obs.unobserve(e.target); }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.reveal, #mrFeat').forEach(function(el){ obs.observe(el); });
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
})();
