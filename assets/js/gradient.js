/* -------------------------------------------------------------------------- *
 *  Animated gradient page background — vanilla WebGL2.
 *
 *  Ported from a React/Tailwind component; the fragment shader is unchanged.
 *  Only the React wrapper is replaced, because this site is static HTML with
 *  no build step.
 *
 *  Unlike the black hole this replaced, the background is on screen for the
 *  whole visit, so it is deliberately cheap: a low internal resolution the
 *  CSS scales back up (the image is all soft gradients, so nothing shows),
 *  a capped pixel ratio, and it stops entirely when the tab is hidden.
 * -------------------------------------------------------------------------- */

const VERT = `#version 300 es
in vec4 a_position;
void main(){ gl_Position = a_position; }`;

const FRAG = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2  u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4  u_color1;
uniform vec4  u_color2;
uniform vec4  u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th){
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st){
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st){
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur){
  vec3 color1 = c1.rgb * c1.a;
  vec3 color2 = c2.rgb * c2.a;
  vec3 color3 = c3.rgb * c3.a;

  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);

  vec3 blended_color_2 = mix(color1, color2, r1);
  float blended_opacity_2 = mix(c1.a, c2.a, r1);

  vec3 c = mix(blended_color_2, color3, r2);
  float o = mix(blended_opacity_2, c3.a, r2);
  return vec4(c, o);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  float t = .5 * u_time;
  float noise_scale = .0005 + .006 * u_scale;

  uv -= .5;
  uv *= (noise_scale * u_resolution);
  uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;

  float n1 = noise(uv * 1. + t);
  float n2 = noise(uv * 2. - t);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= iterations_number; i++){
    uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
    uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);

  float shape = 0.;
  float mixer = 0.;
  if (u_shape < .5) {
    vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
    float f = fract(stripes_shape_uv.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float sh = 1. - uv.y;
    sh -= .5;
    sh /= (noise_scale * u_resolution.y);
    sh += .5;
    float shape_scaling = .2 * (1. - u_shapeScale);
    shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
    mixer = shape;
  }

  vec4 color_mix = blend_colors(u_color1, u_color2, u_color3, mixer,
                                1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);

  fragColor = vec4(color_mix.rgb, color_mix.a);
}`;

const SHAPES = { Checks: 0, Stripes: 1, Edge: 2 };

function hexToRgba(hex){
  const c = String(hex).replace('#', '');
  const n = c.length === 3
    ? [c[0] + c[0], c[1] + c[1], c[2] + c[2]]
    : [c.slice(0, 2), c.slice(2, 4), c.slice(4, 6)];
  const a = c.length === 8 ? parseInt(c.slice(6, 8), 16) / 255 : 1;
  return [parseInt(n[0], 16) / 255, parseInt(n[1], 16) / 255, parseInt(n[2], 16) / 255, a];
}

export function initGradient(canvas, options){
  const P = Object.assign({
    color1: '#000000',
    color2: '#c8a96a',
    color3: '#000000',
    rotation: 0,
    proportion: 30,
    scale: 0.5,
    speed: 16,
    distortion: 4,
    swirl: 65,
    swirlIterations: 5,
    softness: 100,
    offset: -235,
    shape: 'Edge',
    shapeSize: 48,
    /* internal render scale — the image is all soft gradients, so rendering
       below device resolution costs nothing visible and saves a lot of fill */
    resolution: 0.6,
    maxDpr: 1.5,
  }, options || {});

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
  /* A dead canvas paints white over the page, which is far worse than no
     gradient at all — hide it and let the flat black background stand. */
  if(!gl){ canvas.style.display = 'none'; return; }

  function compile(type, src){
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
      console.error('gradient: shader failed —', gl.getShaderInfoLog(sh) || 'no log');
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if(!vs || !fs){ canvas.style.display = 'none'; return; }

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
    console.error(gl.getProgramInfoLog(program));
    canvas.style.display = 'none';
    return;
  }
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = {};
  for(const name of ['u_time','u_resolution','u_pixelRatio','u_scale','u_rotation',
                     'u_color1','u_color2','u_color3','u_proportion','u_softness',
                     'u_shape','u_shapeScale','u_distortion','u_swirl','u_swirlIterations']){
    u[name] = gl.getUniformLocation(program, name);
  }

  let dpr = 1;
  function resize(){
    const w = window.innerWidth, h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, P.maxDpr) * P.resolution;
    canvas.width = Math.max(2, Math.round(w * dpr));
    canvas.height = Math.max(2, Math.round(h * dpr));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  const c1 = hexToRgba(P.color1), c2 = hexToRgba(P.color2), c3 = hexToRgba(P.color3);
  const start = performance.now();
  let raf = 0, visible = !document.hidden;

  function frame(now){
    const elapsed = (now - start) / 1000;
    const speed = (P.speed / 100) * 5;

    gl.uniform1f(u.u_time, elapsed * speed + P.offset * 0.01);
    gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
    gl.uniform1f(u.u_pixelRatio, dpr);
    gl.uniform1f(u.u_scale, P.scale);
    gl.uniform1f(u.u_rotation, (P.rotation * Math.PI) / 180);
    gl.uniform4f(u.u_color1, c1[0], c1[1], c1[2], c1[3]);
    gl.uniform4f(u.u_color2, c2[0], c2[1], c2[2], c2[3]);
    gl.uniform4f(u.u_color3, c3[0], c3[1], c3[2], c3[3]);
    gl.uniform1f(u.u_proportion, P.proportion / 100);
    gl.uniform1f(u.u_softness, P.softness / 100);
    gl.uniform1f(u.u_shape, SHAPES[P.shape] ?? 0);
    gl.uniform1f(u.u_shapeScale, P.shapeSize / 100);
    gl.uniform1f(u.u_distortion, P.distortion / 50);
    gl.uniform1f(u.u_swirl, P.swirl / 100);
    gl.uniform1f(u.u_swirlIterations, P.swirl === 0 ? 0 : P.swirlIterations);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function loop(now){
    if(!visible) return;
    raf = requestAnimationFrame(loop);
    frame(now);
  }

  if(reduce){
    frame(performance.now());          /* one still frame, no animation */
  } else {
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function(){
      visible = !document.hidden;
      if(visible && !reduce) raf = requestAnimationFrame(loop);
      else cancelAnimationFrame(raf);
    });
  }

  canvas.addEventListener('webglcontextlost', function(e){
    e.preventDefault();
    cancelAnimationFrame(raf);
    canvas.style.display = 'none';
  });
}

const el = document.getElementById('bg');
if(el){
  initGradient(el, {
    color1: '#000000',
    color2: '#c8a96a',
    color3: '#000000',
    rotation: -12,
    proportion: 26,
    scale: 0.5,
    speed: 13,
    distortion: 4,
    swirl: 62,
    swirlIterations: 5,
    softness: 100,
    offset: -235,
    shape: 'Edge',
    shapeSize: 46,
  });
}
