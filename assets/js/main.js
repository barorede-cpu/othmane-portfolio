(function(){
  'use strict';

  /* ------------------------------------------------------------------
     Two things to fill in when the accounts exist. Both degrade to
     something that already works, so the site is never broken while
     they are empty.
     ------------------------------------------------------------------ */

  /* Paste a Calendly / Cal.com link here and every "Book a call" button
     opens it. Left empty, they scroll to the qualifying form instead. */
  var BOOKING_URL = '';

  /* Paste a Web3Forms access key (free, web3forms.com) and the form
     posts straight to your inbox. Left empty, it falls back to opening a
     pre-filled email with the same answers — no silent failures. */
  var FORM_ACCESS_KEY = '';
  var FORM_ENDPOINT = 'https://api.web3forms.com/submit';
  var CONTACT_EMAIL = 'barorede@gmail.com';

  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var lang = 'en';

  /* ---- language ----------------------------------------------------- */
  var langBtn = document.getElementById('langToggle');
  function setLang(next){
    lang = next;
    body.setAttribute('data-lang', next);
    document.documentElement.lang = next;
    if(langBtn){
      langBtn.textContent = next === 'en' ? 'FR' : 'EN';
      langBtn.setAttribute('aria-pressed', String(next === 'fr'));
    }
    try{ localStorage.setItem('ob-lang', next); }catch(e){}
  }
  var savedLang = null;
  try{ savedLang = localStorage.getItem('ob-lang'); }catch(e){}
  setLang(savedLang === 'fr' ? 'fr' : 'en');
  if(langBtn){
    langBtn.addEventListener('click', function(){ setLang(lang === 'en' ? 'fr' : 'en'); });
  }

  var yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- booking links ------------------------------------------------ */
  if(BOOKING_URL){
    document.querySelectorAll('.js-book').forEach(function(a){
      a.href = BOOKING_URL;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if(hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---- smooth scroll ------------------------------------------------ */
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
    /* in-page anchors have to go through Lenis or they fight the wheel */
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function(a){
      a.addEventListener('click', function(e){
        var target = document.querySelector(a.getAttribute('href'));
        if(!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -68 });
      });
    });
  }

  /* ---- scroll reveal ------------------------------------------------ */
  if(!reduce && hasGsap){
    document.querySelectorAll('.reveal').forEach(function(el){
      gsap.to(el, {
        opacity:1, y:0, duration:0.9, ease:'power3.out',
        onComplete:function(){ gsap.set(el, {clearProps:'transform'}); },
        scrollTrigger:{ trigger: el, start:'top 88%', once:true }
      });
    });
  } else if(!reduce && 'IntersectionObserver' in window){
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('is-visible'); obs.unobserve(e.target); }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---- hero name ------------------------------------------------------
     Letters blur in one after another. Two frames so the from-state is
     painted first, otherwise the transition has nothing to run from. */
  (function(){
    var name = document.getElementById('heroName');
    var hero = document.querySelector('.hero');
    if(!name || !hero) return;

    var released = false;
    function releaseRest(){
      if(released) return;
      released = true;
      hero.classList.add('is-ready');
    }

    if(reduce){ name.classList.add('is-in'); releaseRest(); return; }

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ name.classList.add('is-in'); });
    });

    /* Hand over on the real end of the last letter rather than a guessed
       duration, with a timeout in case the transition never fires. */
    var chars = name.querySelectorAll('.hn-char');
    var last = chars[chars.length - 1];
    if(last) last.addEventListener('transitionend', releaseRest, {once:true});
    setTimeout(releaseRest, 2400);
  })();

  /* ---- grain --------------------------------------------------------- */
  (function(){
    var canvas = document.getElementById('grain');
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    canvas.width = 220; canvas.height = 220;
    canvas.style.width = '100vw'; canvas.style.height = '100vh';
    var imgData = ctx.createImageData(220, 220);
    for(var i = 0; i < imgData.data.length; i += 4){
      var v = Math.random() * 255;
      imgData.data[i] = v; imgData.data[i+1] = v; imgData.data[i+2] = v; imgData.data[i+3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  })();

  /* ---- scroll progress ----------------------------------------------- */
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

  /* ---- counters ------------------------------------------------------ */
  (function(){
    if(!('IntersectionObserver' in window)) return;
    function run(el){
      var raw = el.getAttribute('data-count');
      var target = parseFloat(raw);
      if(isNaN(target)) return;
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = (raw.split('.')[1] || '').length;
      var settle = function(){ el.textContent = prefix + target.toFixed(decimals) + suffix; };
      if(reduce){ settle(); return; }
      var start = null, dur = 1100;
      requestAnimationFrame(function step(ts){
        if(!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + (eased * target).toFixed(decimals) + suffix;
        if(p < 1) requestAnimationFrame(step); else settle();
      });
    }
    document.querySelectorAll('.hero-stats, .kpi').forEach(function(group){
      var o = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(!e.isIntersecting) return;
          group.querySelectorAll('b[data-count]').forEach(run);
          o.disconnect();
        });
      }, {threshold:0.3});
      o.observe(group);
    });
  })();

  /* ---- proof screenshots: 3D scroll entrance --------------------------
     The cards start tipped back in perspective and offset sideways in
     alternating directions, then rotate flat and slide into place as the
     grid comes up the viewport. Scrubbed, so the scroll drives it. */
  if(hasGsap && !reduce){
    gsap.utils.toArray('.cs-shots').forEach(function(grid){
      gsap.utils.toArray('.shot', grid).forEach(function(shot, i){
        var dir = (i % 2 === 0) ? -1 : 1;
        gsap.fromTo(shot,
          { rotateX: 18, rotateZ: dir * 5, y: 110, x: dir * 90, opacity: 0.15 },
          { rotateX: 0, rotateZ: 0, y: 0, x: 0, opacity: 1, ease: 'none',
            scrollTrigger:{ trigger: grid, start: 'top bottom', end: 'top 32%', scrub: 0.8 } }
        );
      });
    });
    /* a little drift inside each frame, so the images are not static plates */
    gsap.utils.toArray('.shot-btn img').forEach(function(img){
      gsap.fromTo(img, {yPercent:-3}, {
        yPercent:3, ease:'none',
        scrollTrigger:{ trigger: img.parentNode, start:'top bottom', end:'bottom top', scrub:0.6 }
      });
    });
    var portrait = document.querySelector('.profile-photo img');
    if(portrait){
      gsap.fromTo(portrait, {scale:1.08}, {
        scale:1, ease:'none',
        scrollTrigger:{ trigger: portrait, start:'top bottom', end:'bottom top', scrub:0.8 }
      });
    }
  }

  /* ---- custom cursor + magnetic buttons ------------------------------- */
  if(fine && !reduce){
    body.classList.add('has-cursor');
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    var rx = 0, ry = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', function(e){
      dot.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
      tx = e.clientX; ty = e.clientY;
      if(!body.classList.contains('cursor-live')){
        rx = tx; ry = ty; /* avoid the ring easing in from the corner */
        body.classList.add('cursor-live');
      }
    });
    (function loop(){
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, input, textarea, label').forEach(function(el){
      el.addEventListener('mouseenter', function(){ body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function(){ body.classList.remove('cursor-hover'); });
    });
    document.querySelectorAll('.magnetic').forEach(function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width/2) * 0.25) + 'px,' +
                                            ((e.clientY - r.top - r.height/2) * 0.3) + 'px)';
      });
      el.addEventListener('mouseleave', function(){ el.style.transform = ''; });
    });
  }

  /* ---- lightbox -------------------------------------------------------- */
  (function(){
    var box = document.getElementById('lightbox');
    var img = document.getElementById('lbImg');
    var close = document.getElementById('lbClose');
    var buttons = document.querySelectorAll('.shot-btn');
    if(!box || !img || !buttons.length) return;
    var opener = null;

    function open(btn){
      var thumb = btn.querySelector('img');
      opener = btn;
      img.src = btn.getAttribute('data-full');
      img.alt = thumb ? thumb.alt : '';
      box.hidden = false;
      /* next frame so the transition has a from-state to animate out of */
      requestAnimationFrame(function(){ box.classList.add('is-open'); });
      if(lenis) lenis.stop();
      body.style.overflow = 'hidden';
      close.focus();
    }
    function shut(){
      box.classList.remove('is-open');
      if(lenis) lenis.start();
      body.style.overflow = '';
      setTimeout(function(){ box.hidden = true; img.src = ''; }, 300);
      if(opener){ opener.focus(); opener = null; }
    }

    buttons.forEach(function(btn){ btn.addEventListener('click', function(){ open(btn); }); });
    close.addEventListener('click', shut);
    box.addEventListener('click', function(e){ if(e.target === box) shut(); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && !box.hidden) shut();
    });
  })();

  /* ---- active nav link -------------------------------------------------- */
  (function(){
    if(!('IntersectionObserver' in window)) return;
    var links = {};
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(function(a){
      links[a.getAttribute('href').slice(1)] = a;
    });
    var order = Object.keys(links);
    if(!order.length) return;
    /* Track the whole visible set rather than the last event, otherwise the
       highlight sticks on whatever fired last once we scroll off every
       observed section (the hero, for instance, has no nav entry). */
    var visible = Object.create(null);
    var o = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting) visible[e.target.id] = 1; else delete visible[e.target.id];
      });
      order.forEach(function(k){ links[k].classList.remove('is-active'); });
      for(var i = 0; i < order.length; i++){
        if(visible[order[i]]){ links[order[i]].classList.add('is-active'); break; }
      }
    }, {rootMargin:'-45% 0px -50% 0px'});
    order.forEach(function(id){
      var sec = document.getElementById(id);
      if(sec) o.observe(sec);
    });
  })();

  /* ---- qualifying contact form ------------------------------------------ */
  (function(){
    var form = document.getElementById('qform');
    var status = document.getElementById('qformStatus');
    if(!form || !status) return;

    var COPY = {
      en: {
        missing: 'Please add your name and a valid email.',
        sending: 'Sending…',
        sent: 'Thanks — I\'ll get back to you within 24 hours.',
        failed: 'Something went wrong. Email me directly at ' + CONTACT_EMAIL + '.',
        mail: 'Opening your email app with the answers filled in.'
      },
      fr: {
        missing: 'Merci d\'indiquer votre nom et un email valide.',
        sending: 'Envoi…',
        sent: 'Merci — je vous réponds sous 24 heures.',
        failed: 'Un problème est survenu. Écrivez-moi directement à ' + CONTACT_EMAIL + '.',
        mail: 'Ouverture de votre messagerie avec les réponses pré-remplies.'
      }
    };
    var t = function(key){ return (COPY[lang] || COPY.en)[key]; };

    function say(msg, kind){
      status.textContent = msg;
      status.className = 'qform-status' + (kind ? ' ' + kind : '');
    }

    function collect(){
      var d = new FormData(form);
      var goals = d.getAll('goal');
      return {
        name: (d.get('name') || '').trim(),
        company: (d.get('company') || '').trim(),
        email: (d.get('email') || '').trim(),
        website: (d.get('website') || '').trim(),
        goals: goals.join(', '),
        budget: d.get('budget') || '',
        message: (d.get('message') || '').trim()
      };
    }

    function markInvalid(v){
      form.querySelectorAll('.fld').forEach(function(f){ f.classList.remove('invalid'); });
      var bad = [];
      if(!v.name) bad.push('name');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) bad.push('email');
      bad.forEach(function(n){
        var input = form.querySelector('[name="' + n + '"]');
        if(input && input.closest('.fld')) input.closest('.fld').classList.add('invalid');
      });
      return bad.length === 0;
    }

    function asText(v){
      return [
        'Name: ' + v.name,
        'Company: ' + (v.company || '—'),
        'Email: ' + v.email,
        'Website: ' + (v.website || '—'),
        'Wants to improve: ' + (v.goals || '—'),
        'Monthly marketing budget: ' + (v.budget || '—'),
        '',
        v.message || ''
      ].join('\n');
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var v = collect();
      if(!markInvalid(v)){ say(t('missing'), 'err'); return; }

      /* No key configured yet — hand the same answers to the mail client
         rather than pretending the message was sent. */
      if(!FORM_ACCESS_KEY){
        say(t('mail'), 'ok');
        window.location.href = 'mailto:' + CONTACT_EMAIL +
          '?subject=' + encodeURIComponent('Project enquiry — ' + (v.company || v.name)) +
          '&body=' + encodeURIComponent(asText(v));
        return;
      }

      say(t('sending'));
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type':'application/json', 'Accept':'application/json'},
        body: JSON.stringify({
          access_key: FORM_ACCESS_KEY,
          subject: 'Project enquiry — ' + (v.company || v.name),
          from_name: v.name,
          email: v.email,
          company: v.company,
          website: v.website,
          goals: v.goals,
          budget: v.budget,
          message: v.message
        })
      }).then(function(r){ return r.json(); })
        .then(function(json){
          if(json && json.success){ form.reset(); say(t('sent'), 'ok'); }
          else say(t('failed'), 'err');
        })
        .catch(function(){ say(t('failed'), 'err'); });
    });
  })();
})();
