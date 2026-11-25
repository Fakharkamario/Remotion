// Renders the procedural "photographs" used by the TideShort composition.
// Each image is a GLSL fragment shader drawn once in headless Chromium and
// saved as a JPEG into public/tide/. Run: node scripts/tide-images.mjs
import {createRequire} from 'node:module';
const {chromium} = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('public/tide');
fs.mkdirSync(OUT, {recursive: true});

const COMMON = `
precision highp float;
uniform vec2 R;
#define PI 3.14159265
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
vec2 h22(vec2 p){float n=h21(p);return vec2(n,h21(p+n));}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<6;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
vec3 grade(vec3 c, vec2 fc){ // film-ish finish: grain + soft vignette
 float g=h21(fc*1.7)-.5; c+=g*.035;
 vec2 q=fc/R-.5; c*=1.-dot(q,q)*.25; return clamp(c,0.,1.);}
`;

// ---------- shaders ----------
const S = {};

// Hero: a person on a chair on a wide beach, facing the sea (portrait)
S.hero = `
float box(vec2 p, vec2 c, vec2 s){vec2 d=abs(p-c)-s;return length(max(d,0.))+min(max(d.x,d.y),0.);}
void main(){
 vec2 fc=gl_FragCoord.xy; vec2 uv=fc/R; float y=1.-uv.y; // y: 0 top -> 1 bottom
 float hz=.34; // horizon
 vec3 skyTop=vec3(.42,.72,.76), skyLow=vec3(.70,.84,.80);
 vec3 c=mix(skyTop,skyLow,smoothstep(0.,hz,y));
 c=mix(c,vec3(.80,.88,.84),smoothstep(hz-.06,hz,y)*.6); // haze at horizon
 // sea
 if(y>hz){
  float d=(y-hz)/(.50-hz);
  vec3 sea=mix(vec3(.38,.62,.64),vec3(.20,.52,.56),pow(d,.6));
  float w=fbm(vec2(uv.x*6.,y*90.))*.5+fbm(vec2(uv.x*40.,y*260.))*.5;
  sea+=(w-.5)*.07; sea+=smoothstep(.70,.88,w)*.16*d; sea=mix(sea,vec3(.72,.84,.82),(1.-smoothstep(0.,.35,d))*.45);
  c=sea;
 }
 // shore: wet sand + foam line
 float shore=.50+.012*sin(uv.x*9.)+.01*fbm(uv*vec2(20,4));
 if(y>shore){
  float d=(y-shore)/(1.-shore);
  vec3 sand=mix(vec3(.74,.70,.58),vec3(.86,.80,.66),smoothstep(0.,.35,d));
  sand=mix(sand,vec3(.80,.74,.60),smoothstep(.5,1.,d));
  float t=fbm(uv*vec2(30.,80.));
  sand*=.93+.12*t;
  sand=mix(sand,vec3(.55,.62,.60),smoothstep(.06,.0,d)*.7); // wet edge
  c=sand;
 }
 float foam=smoothstep(.012,0.,abs(y-shore+.004))*(.6+.4*fbm(vec2(uv.x*30.,3.)));
 c=mix(c,vec3(.95,.97,.95),foam*.85);
 // shadow + chair + person, at (.55,.69)
 vec2 p=vec2(uv.x,y); p.x*=R.x/R.y;
 vec2 o=vec2(.55*R.x/R.y,.70);
 float sh=length((p-o-vec2(-.035,.04))*vec2(1.,4.));
 c*=mix(.72,1.,smoothstep(.05,.09,sh));
 vec3 ink=vec3(.16,.13,.11);
 float chair=min(min(box(p,o+vec2(-.012,.012),vec2(.0018,.028)),box(p,o+vec2(.026,.016),vec2(.0018,.026))),
   min(box(p,o+vec2(.008,-.012),vec2(.024,.003)),box(p,o+vec2(-.014,-.04),vec2(.0022,.03))));
 chair=min(chair,box(p,o+vec2(.0,.013),vec2(.0016,.02)));
 c=mix(c,ink,smoothstep(.0015,0.,chair));
 vec3 cloth=vec3(.94,.93,.89);
 float body=min(length((p-o-vec2(.0,-.042))*vec2(1.6,1.))-.026, box(p,o+vec2(.016,-.006),vec2(.022,.007))-.004);
 body=min(body,box(p,o+vec2(.036,.012),vec2(.004,.02))-.002);
 float shade=smoothstep(-.02,.02,p.x-o.x);
 c=mix(c,cloth*mix(1.,.82,shade),smoothstep(.0015,0.,body));
 float head=length(p-o-vec2(-.002,-.078))-.011;
 c=mix(c,vec3(.34,.22,.16),smoothstep(.0015,0.,head));
 gl_FragColor=vec4(grade(c,fc),1.);
}`;

// Raymarched folded sheets (the "curled leaves" equivalent). Colors via uniforms.
S.ribbon = `
uniform vec3 BG, A, B;
float wall(vec3 p, float c, float k, float ph, float amp, float top, float tk, float tq){
 float z=c+amp*sin(k*p.x+ph)+.12*sin(2.3*k*p.x+ph*1.7);
 float h=top+.28*sin(tk*p.x+tq);
 float d=abs(p.z-z)-.012;
 float cap=p.y-h;
 return max(d*.6,cap);
}
vec2 map(vec3 p){
 float d=1e9, id=0.;
 for(int i=0;i<5;i++){float fi=float(i);
  float w=wall(p,-.55+fi*.42,1.6+fi*.35,fi*1.9,.32,.22-fi*.30,2.1+fi*.4,fi*2.6);
  if(w<d){d=w;id=fi;}}
 return vec2(d,id);
}
vec3 nrm(vec3 p){vec2 e=vec2(.0015,0);return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));}
void main(){
 vec2 fc=gl_FragCoord.xy; vec2 uv=(fc-.5*R)/R.y;
 vec3 ro=vec3(.25,1.25,3.3), ta=vec3(.1,-.15,0.);
 vec3 f=normalize(ta-ro), r=normalize(cross(f,vec3(0,1,0))), u=cross(r,f);
 vec3 rd=normalize(f*1.9+uv.x*r+uv.y*u);
 vec3 col=mix(BG,BG*.93,clamp(.5-uv.y,0.,1.));
 float t=0.; vec2 h=vec2(0);
 for(int i=0;i<260;i++){h=map(ro+rd*t); if(h.x<.0008||t>9.)break; t+=h.x;}
 if(t<9.){
  vec3 p=ro+rd*t, n=nrm(p); if(dot(n,rd)>0.)n=-n;
  vec3 L=normalize(vec3(-.6,.9,.5));
  float dif=max(dot(n,L),0.), bk=max(dot(n,-L),0.);
  float ao=clamp(map(p+n*.08).x/.08,0.,1.)*.5+.5;
  float top=.22-h.y*.30+.28*sin((2.1+h.y*.4)*p.x+h.y*2.6);
  float edge=smoothstep(.06,0.,top-p.y);
  float vein=.5+.5*sin(p.y*70.+p.x*9.);
  vec3 base=mix(B,A,clamp(.25+.55*dif+.35*edge,0.,1.));
  col=base*(.45+.7*dif+.15*bk)*ao*(.96+.05*vein);
  col+=edge*.22*(1.-dif*.4);
  col+=pow(max(dot(reflect(rd,n),L),0.),24.)*.15;
 }
 gl_FragColor=vec4(grade(col,fc),1.);
}`;

// Pool caustics
S.caustic = `
void main(){
 vec2 fc=gl_FragCoord.xy; vec2 uv=fc/R.x;
 vec2 p=mod(uv*6.28318*1.6,6.28318)-250.; vec2 i=p; float c=1.,inten=.005;
 for(int n=0;n<5;n++){float t=3.7*(1.-(3.5/float(n+1)));
  i=p+vec2(cos(t-i.x)+sin(t+i.y),sin(t-i.y)+cos(t+i.x));
  c+=1./length(vec2(p.x/(sin(i.x+t)/inten),p.y/(cos(i.y+t)/inten)));}
 c/=5.; c=1.17-pow(c,1.4); float l=pow(abs(c),8.);
 vec3 col=mix(vec3(.05,.42,.55),vec3(.10,.62,.70),uv.y)+vec3(.85,.97,.97)*clamp(l,0.,1.);
 gl_FragColor=vec4(grade(col,fc),1.);
}`;

// Macro sand ripples
S.sand = `
void main(){
 vec2 fc=gl_FragCoord.xy; vec2 uv=fc/R.y;
 float w=uv.x*46.+uv.y*10.+fbm(uv*2.5)*9.;
 float ph=fract(w/6.2832); float h=pow(ph,1.6); // asymmetric ripple: slow rise, sharp crest
 float dh=ph<.82?ph/.82:1.-(ph-.82)/.18*1.6;
 vec3 col=mix(vec3(.52,.42,.31),vec3(.95,.87,.72),clamp(dh,0.,1.));
 col*=.9+.2*fbm(uv*120.);
 col+=(h21(fc)-.5)*.08;
 gl_FragColor=vec4(grade(col,fc),1.);
}`;

// Open ocean from above with foam lace
S.foam = `
void main(){
 vec2 fc=gl_FragCoord.xy; vec2 uv=fc/R.y;
 vec2 q=vec2(fbm(uv*3.),fbm(uv*3.+5.2));
 float f=fbm(uv*5.+q*3.);
 vec3 col=mix(vec3(.02,.20,.33),vec3(.06,.42,.55),f);
 float rd=1.-abs(fbm(uv*7.+q*4.)*2.-1.); float lace=smoothstep(.86,.97,rd)*(.5+.5*smoothstep(.4,.7,fbm(uv*20.)));
 col=mix(col,vec3(.92,.97,.98),lace*.9);
 gl_FragColor=vec4(grade(col,fc),1.);
}`;

// Underwater light rays
S.rays = `
void main(){
 vec2 fc=gl_FragCoord.xy; vec2 uv=fc/R; uv.y=1.-uv.y;
 vec3 col=mix(vec3(.30,.70,.78),vec3(.02,.16,.30),pow(uv.y,.8));
 vec2 src=vec2(.35,-.3); vec2 d=uv-src; float a=atan(d.x,d.y);
 float r=fbm(vec2(a*14.,1.))*fbm(vec2(a*31.,4.));
 col+=vec3(.6,.9,.9)*smoothstep(.15,.45,r)*(1.-uv.y)*.55;
 for(int i=0;i<40;i++){vec2 s=h22(vec2(float(i),3.)); float b=length((uv-s)*vec2(1.,.8));
  col+=vec3(.8,.95,1.)*smoothstep(.006,.0,b)*.5;}
 gl_FragColor=vec4(grade(col,fc),1.);
}`;

// Droplets on glass over a blurred sea
S.drops = `
void main(){
 vec2 fc=gl_FragCoord.xy; vec2 uv=fc/R.y;
 vec3 bg=mix(vec3(.10,.36,.48),vec3(.55,.80,.82),smoothstep(.2,1.,uv.y+.2*fbm(uv*2.)));
 vec3 col=bg;
 vec2 g=uv*9.; vec2 id=floor(g), f=fract(g);
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 o=vec2(x,y); vec2 r=h22(id+o); vec2 c=o+r*.8+.1-f;
  float rad=.08+.22*h21(id+o+7.);
  float d=length(c*vec2(1.,1.1));
  if(d<rad){
   float k=d/rad; vec3 inner=mix(vec3(.55,.80,.82),vec3(.10,.36,.48),.5+c.y*2.);
   col=inner*(.95+.1*k); col=mix(col,vec3(.02,.12,.18),smoothstep(.75,1.,k)*step(c.y,0.)*.6);
   col+=vec3(1.)*smoothstep(.25,.0,length(c/rad-vec2(.35,.35)))*.8;
  }
 }
 gl_FragColor=vec4(grade(col,fc),1.);
}`;

// Aerial shoreline: sand, turquoise shallows, foam edge
S.shore = `
void main(){
 vec2 fc=gl_FragCoord.xy; vec2 uv=fc/R.y;
 float s=uv.x*.8+uv.y*.6+.12*fbm(uv*3.)+.03*fbm(uv*20.);
 vec3 sand=vec3(.90,.84,.71)*(.92+.12*fbm(uv*40.));
 vec3 sea=mix(vec3(.35,.80,.78),vec3(.04,.33,.50),smoothstep(.7,1.4,s));
 sea+=(fbm(uv*12.)-.5)*.08;
 vec3 col=s<.66?sand:sea;
 col=mix(col,vec3(.62,.72,.66),smoothstep(.04,0.,abs(s-.64))*.6);
 float foam=smoothstep(.03,0.,abs(s-.68-.03*fbm(uv*15.)))*smoothstep(.3,.65,fbm(uv*25.));
 col=mix(col,vec3(.97),foam);
 gl_FragColor=vec4(grade(col,fc),1.);
}`;

// Sunset over water
S.sunset = `
void main(){
 vec2 fc=gl_FragCoord.xy; vec2 uv=fc/R; float y=1.-uv.y;
 float hz=.58;
 vec3 col=mix(vec3(.55,.62,.78),vec3(.98,.70,.55),smoothstep(.05,hz,y));
 vec2 sp=vec2(.5,hz-.1); float sd=length((uv-vec2(sp.x,1.-sp.y))*vec2(R.x/R.y,1.));
 col+=vec3(1.,.85,.6)*smoothstep(.06,.045,sd)+vec3(1.,.6,.4)*exp(-sd*9.)*.35;
 if(y>hz){float d=y-hz;
  col=mix(vec3(.55,.45,.55),vec3(.12,.18,.32),smoothstep(0.,.4,d));
  float glit=smoothstep(.55,.8,fbm(vec2(uv.x*30.,y*200.)))*exp(-abs(uv.x-.5)*9./(1.+d*4.));
  col+=vec3(1.,.8,.55)*glit*1.1;}
 gl_FragColor=vec4(grade(col,fc),1.);
}`;

// Twisted ribbon ring (raymarched sculpture - the "knot" equivalent)
S.twist = `
uniform vec3 BG, A;
float sdf(vec3 p){
 p.yz=mat2(.8,-.6,.6,.8)*p.yz; p.xz=mat2(.9,-.44,.44,.9)*p.xz;
 float a=atan(p.z,p.x);
 vec2 q=vec2(length(p.xz)-.95,p.y);
 float t=a*1.5; q=mat2(cos(t),-sin(t),sin(t),cos(t))*q;
 vec2 d=abs(q)-vec2(.42,.07); return (length(max(d,0.))+min(max(d.x,d.y),0.)-.03)*.5;}
void main(){
 vec2 fc=gl_FragCoord.xy; vec2 uv=(fc-.5*R)/R.y;
 vec3 ro=vec3(0,0,3.2), rd=normalize(vec3(uv,-1.5));
 vec3 col=BG*(1.-.1*length(uv));
 float t=0.; bool hit=false;
 for(int i=0;i<220;i++){float d=sdf(ro+rd*t); if(d<.0005){hit=true;break;} t+=d; if(t>8.)break;}
 if(hit){vec3 p=ro+rd*t; vec2 e=vec2(.001,0);
  vec3 n=normalize(vec3(sdf(p+e.xyy)-sdf(p-e.xyy),sdf(p+e.yxy)-sdf(p-e.yxy),sdf(p+e.yyx)-sdf(p-e.yyx)));
  vec3 L=normalize(vec3(-.5,.8,.6)); float dif=max(dot(n,L),0.); float rim=pow(1.-max(dot(n,-rd),0.),3.);
  float ang=atan(p.z,p.x); float str=.5+.5*sin(ang*120.+p.y*60.);
  col=A*(.35+.75*dif)*(.94+.06*str)+rim*.25;
 }
 gl_FragColor=vec4(grade(col,fc),1.);
}`;

const JOBS = [
  {name: 'hero', s: 'hero', w: 720, h: 892},
  {name: 'ribbon', s: 'ribbon', w: 960, h: 900, u: {BG: [.96, .93, .89], A: [.62, .82, .84], B: [.07, .27, .35]}},
  {name: 'ribbon-coral', s: 'ribbon', w: 960, h: 900, u: {BG: [.50, .66, .92], A: [1., .93, .95], B: [1., .70, .78]}},
  {name: 'ribbon-sky', s: 'ribbon', w: 960, h: 900, u: {BG: [.50, .66, .92], A: [.66, .84, .86], B: [.08, .28, .36]}},
  {name: 'ribbon-sage', s: 'ribbon', w: 960, h: 900, u: {BG: [.50, .66, .92], A: [.80, .88, .80], B: [.30, .44, .40]}},
  {name: 'twist', s: 'twist', w: 800, h: 900, u: {BG: [.90, .91, .90], A: [.38, .64, .68]}},
  {name: 'caustic', s: 'caustic', w: 800, h: 800},
  {name: 'sand', s: 'sand', w: 800, h: 900},
  {name: 'foam', s: 'foam', w: 900, h: 800},
  {name: 'rays', s: 'rays', w: 800, h: 900},
  {name: 'drops', s: 'drops', w: 800, h: 900},
  {name: 'shore', s: 'shore', w: 900, h: 800},
  {name: 'sunset', s: 'sunset', w: 800, h: 900},
];

const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const page = await browser.newPage();
await page.setContent('<canvas id=c></canvas>');
for (const j of JOBS) {
  const src = COMMON + S[j.s];
  const url = await page.evaluate(({src, w, h, u}) => {
    const c = document.getElementById('c');
    c.width = w; c.height = h;
    const gl = c.getContext('webgl', {preserveDrawingBuffer: true});
    const sh = (t, s) => {const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o;};
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}'));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, src));
    gl.linkProgram(p); gl.useProgram(p);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, w, h);
    gl.uniform2f(gl.getUniformLocation(p, 'R'), w, h);
    for (const [k, v] of Object.entries(u || {})) gl.uniform3f(gl.getUniformLocation(p, k), ...v);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return c.toDataURL('image/jpeg', 0.92);
  }, {src, w: j.w, h: j.h, u: j.u});
  fs.writeFileSync(path.join(OUT, j.name + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', j.name);
}

// Soft coral noise ring used behind the collage burst (PNG with alpha, drawn via 2D canvas)
const ring = await page.evaluate(() => {
  const w = 1280, h = 720, c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); const img = x.createImageData(w, h);
  const hs = (a, b) => {let n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n);};
  const vn = (px, py) => {const i = Math.floor(px), j = Math.floor(py), f = px - i, g = py - j;
    const u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g);
    return (hs(i, j) * (1 - u) + hs(i + 1, j) * u) * (1 - v) + (hs(i, j + 1) * (1 - u) + hs(i + 1, j + 1) * u) * v;};
  const fb = (px, py) => {let s = 0, a = .5; for (let k = 0; k < 5; k++) {s += a * vn(px, py); px *= 2.03; py *= 2.03; a *= .5;} return s;};
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    const dx = (xx - 640) / 470, dy = (y - 360) / 345; const r = Math.sqrt(dx * dx + dy * dy);
    const band = Math.exp(-Math.pow((r - 1) / .2, 2));
    const n = fb(xx / 38, y / 38);
    const a = Math.max(0, Math.min(1, (n - .42) * 3.2)) * band;
    const i = (y * w + xx) * 4; img.data[i] = 240; img.data[i + 1] = 188; img.data[i + 2] = 206; img.data[i + 3] = a * 150;
  }
  x.putImageData(img, 0, 0); return c.toDataURL('image/png');
});
fs.writeFileSync(path.join(OUT, 'ring.png'), Buffer.from(ring.split(',')[1], 'base64'));
console.log('wrote ring');
await browser.close();
