/* Máquina de pespunte de la cabecera (lienzo v6, «Fundamentos 1 y 2»).
   Decorativa: el JS escribe variables CSS y transforms en el `.hm` de la cabecera según el scroll.
   Con prefers-reduced-motion la cabeza se oculta y la costura queda completa. */
export const costura = (() => {
  type V2 = [number, number]
  type Pose = { u: number; T: number; b: number; sp: number; wd: number; kmax: number }
  type Lay = { x0: number; x1: number; P: number; s: number; yp: number }
  type Refs = { head: HTMLElement | null; disc: Element | null; rod: Element | null; bar: Element | null; lever: Element | null; link: Element | null; dogs: Element | null; giro: Element | null; hilo: Element[] }
  type Hm = HTMLElement & { _L?: Lay | null; _m?: Refs }
  type KT = { RHK: number; RD: number; RSP: number; NLEN: number; CLAMP: number; NX: number; YP: number; C: V2; RA: number; LR: number; EYE: number; PV: V2; LT: number; DQ: number; LB: number; RB: number; PHI: number; SP: V2; RW: number; G1: V2; T: V2; G2: V2; G3: V2; HK: V2; RBK: number; FEED: V2; HOLE: number; PARK: number; CATCH: number; HSPD: number; SPD: number }
  const K: KT = {"NX": 86.0, "YP": 70.0, "C": [86.0, 17.0], "RD": 11.5, "RA": 8.0, "LR": 28.0, "NLEN": 22.5, "EYE": 19.0, "CLAMP": 10.0, "PV": [62.9, 33.5], "LT": 13.81, "DQ": 10.41, "LB": 23.0, "RB": 4.73, "PHI": 6.12, "SP": [26.0, 17.0], "RSP": 8.6, "RW": 7.2, "G1": [38.0, 5.6], "T": [45.0, 22.0], "G2": [56.0, 26.5], "G3": [79.0, 44.0], "HK": [86.0, 81.5], "RHK": 4.4, "RBK": 7.2, "FEED": [0.3, 0.74], "HOLE": 0.18, "PARK": 0.66, "CATCH": 0.08, "HSPD": 2.0, "SPD": 130.0};
  const TAU = Math.PI * 2, DEG = 180 / Math.PI;
  const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
  const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const n2 = (v: number) => Math.round(v * 100) / 100;
  const frac = (x: number) => x - Math.floor(x);
  const wrapPi = (a: number) => a - TAU * Math.round(a / TAU);
  const ang = (x: number, c: number, q: number) => c + wrapPi(x - c) * (1 - q);       // acerca un ángulo a otro por el camino corto

  // Cinemática de un ciclo. p = 0: aguja en el punto muerto inferior. Una manivela mueve la barra de la aguja (biela) y, con otro pasador, la palanca.
  function kin(psi: number) {
    const s = Math.sin(psi), c = Math.cos(psi);
    const A: V2 = [K.C[0] + K.RA * s, K.C[1] + K.RA * c];
    const yN = K.C[1] + K.RA * c + Math.sqrt(K.LR * K.LR - K.RA * K.RA * s * s);
    const ph = psi + K.PHI, B: V2 = [K.C[0] + K.RB * Math.sin(ph), K.C[1] + K.RB * Math.cos(ph)];
    const dx = B[0] - K.PV[0], dy = B[1] - K.PV[1], D = Math.hypot(dx, dy);
    const cq = (D * D + K.DQ * K.DQ - K.LB * K.LB) / (2 * K.DQ);       // cierra el triángulo pivote–pasador–articulación
    const a = Math.atan2(dy, dx) + Math.acos(clamp(cq / D, -1, 1));
    const Q: V2 = [K.PV[0] + K.DQ * Math.cos(a), K.PV[1] + K.DQ * Math.sin(a)];
    const E: V2 = [K.PV[0] + K.LT * Math.cos(a), K.PV[1] + K.LT * Math.sin(a)];
    return { psi, A, yN, a, B, Q, E };
  }
  const PSI_MID = Math.PI / 2;                                  // pose media (la que toman las piezas cuando van demasiado rápido para verse)
  const YN_MID = kin(PSI_MID).yN;
  const tangente = (c: V2, r: number, g: V2): V2 => {                               // punto de la circunferencia (c, r) del que sale la tangente hacia g
    const dx = g[0] - c[0], dy = g[1] - c[1], d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) - Math.acos(clamp(r / d, -1, 1));
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  };
  const dist = (a: V2, b: V2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  // Hilo: cadena de tramos entre guías. Un hilo inextensible con cuerda c y sobrante s cuelga una flecha h = √(3·c·s/8).
  function curva(a: V2, b: V2, s: number) {
    const dx = b[0] - a[0], dy = b[1] - a[1], c = Math.hypot(dx, dy) || 1, h = Math.sqrt(Math.max(0, 3 * c * s / 8));
    let nx = -dy / c, ny = dx / c; if (ny < 0) { nx = -nx; ny = -ny; }   // cuelga hacia abajo
    return 'Q' + n2((a[0] + b[0]) / 2 + nx * 2 * h) + ' ' + n2((a[1] + b[1]) / 2 + ny * 2 * h) + ' ' + n2(b[0]) + ' ' + n2(b[1]);
  }
  const REPARTO = [0.02, 0.40, 0.48, 0.10];   // qué parte del sobrante cuelga en cada tramo (carrete → ojo de la aguja)
  let LMAX = 0;
  (function () { for (let i = 0; i < 48; i++) { const t = trazoPuntos(kin(TAU * i / 48), 1); LMAX = Math.max(LMAX, t.len); } })();
  function trazoPuntos(k: ReturnType<typeof kin>, rw: number) {
    const S0 = tangente(K.SP, rw, K.G1);
    const G4: V2 = [K.NX - 1.7, k.yN + 8], NE: V2 = [K.NX - 0.5, k.yN + K.EYE];
    const nodes: V2[] = [S0, K.G1, k.E, G4, NE];
    let len = 0; for (let i = 1; i < nodes.length; i++) len += dist(nodes[i - 1], nodes[i]);
    return { nodes, len, NE };
  }
  // T: tensión 0 a 1 (1 = recta). dxh: cuánto va la cabeza por delante del último agujero (px de la cabeza); aire: la aguja está fuera de la tela
  function trazo(k: ReturnType<typeof kin>, T: number, rw: number, dxh: number, f: number) {
    const { nodes, len, NE } = trazoPuntos(k, rw), g = Math.pow(1 - T, 1.15);
    const tirante = 1 - smooth(0.1, 0.3, Math.abs(wrapPi(TAU * (f - 0.4)) / TAU));    // con la palanca arriba (f ≈ 0,4) el hilo queda tirante, haya el gesto que haya
    const sob = (Math.max(0, LMAX - len) + 7) * g * (1 - 0.85 * tirante);                 
    let d = 'M' + n2(nodes[0][0]) + ' ' + n2(nodes[0][1]);
    for (let i = 1; i < nodes.length; i++) d += curva(nodes[i - 1], nodes[i], sob * REPARTO[i - 1]);
    if (NE[1] < K.YP - 0.5) {                                    // con la aguja arriba el hilo baja hasta el último agujero
      const H: V2 = [K.NX - dxh, K.YP - 0.5];
      d += curva(NE, H, (0.5 + 2.2 * g) * 0.5);
    }
    return d;
  }

  function refs(e: Hm): Refs {
    const q = (c: string) => e.querySelector(c);
    return { head: q('.hm-head') as HTMLElement | null, disc: q('.m-disc'), rod: q('.m-rod'), bar: q('.m-bar'), lever: q('.m-lever'), link: q('.m-link'), dogs: q('.m-dogs'),
      giro: q('.m-giro'), hilo: Array.from(e.querySelectorAll('.hebra,.hebra-env,.hebra-t')) };
  }
  const tr = (el: Element | null | undefined, v: string) => { if (el) el.setAttribute('transform', v); };
  const rot = (a: number, c: V2) => 'rotate(' + n2(a * DEG) + ' ' + c[0] + ' ' + c[1] + ')';
  const put = (e: HTMLElement, k: string, v: string) => e.style.setProperty(k, v);

  // Estado → dibujo. s.u: fase en ciclos (la parte entera cuenta puntadas; 0 = aguja abajo); s.T: tensión; s.b: difuminado; s.sp: giro del carrete (°);
  // s.wd: hilo que queda en el carrete (1 a 0,62); s.kmax: último agujero cosido.
  function pose(e: Hm, s: Pose) {
    const L = e._L as Lay, m = e._m || (e._m = refs(e)), u = s.u, f = frac(u), q = s.b;
    const F = Math.floor(u) + smooth(K.FEED[0], K.FEED[1], f);          // la cabeza solo avanza con la aguja fuera de la tela
    const xr = L.P * lerp(F, u, q);                                       // rápido, el avance deja de verse a saltos
    const hole = Math.floor(u + K.HOLE), dxh = Math.max(0, xr - hole * L.P) / L.s;
    const k = kin(ang(TAU * f, PSI_MID, q));
    const up = smooth(0.20, 0.30, f) - smooth(0.74, 0.80, f);             // los dientes de arrastre suben antes de avanzar y bajan antes de que la aguja entre
    tr(m.disc, rot(-k.psi, K.C));                                          // el disco gira al revés de como se mide el ángulo (y hacia abajo)
    tr(m.rod, 'translate(' + n2(k.A[0]) + ' ' + n2(k.A[1]) + ') rotate(' + n2(Math.atan2(k.A[0] - K.NX, k.yN - k.A[1]) * DEG) + ')');
    tr(m.bar, 'translate(0 ' + n2(k.yN - YN_MID) + ')');
    tr(m.lever, rot(k.a, K.PV));
    tr(m.link, 'translate(' + n2(k.B[0]) + ' ' + n2(k.B[1]) + ') rotate(' + n2(Math.atan2(k.B[0] - k.Q[0], k.Q[1] - k.B[1]) * DEG) + ')');
    tr(m.dogs, 'translate(0 ' + n2(2.4 * (1 - lerp(up, 0.5, q))) + ')');
    tr(m.giro, 'rotate(' + n2(s.sp) + ' ' + K.SP[0] + ' ' + K.SP[1] + ')');
    const d = trazo(k, s.T, K.RW * s.wd, dxh, f);
    for (const el of m.hilo) el.setAttribute('d', d);
    if (m.head) { m.head.style.transform = 'translate3d(' + n2(L.x0 + xr - K.NX) + 'px,0,0) scale(' + L.s + ')'; m.head.style.top = n2(L.yp - K.YP) + 'px'; }
    put(e, '--s', String(n2(L.s))); put(e, '--b', String(n2(q))); put(e, '--P', n2(L.P) + 'px'); put(e, '--wd', String(n2(s.wd))); put(e, '--x0', n2(L.x0) + 'px'); put(e, '--yp', n2(L.yp) + 'px');
    put(e, '--sewn', s.kmax > 0 ? n2(s.kmax * L.P + 1.3) + 'px' : '0px');
  }

  const root = () => (document.scrollingElement || document.documentElement) as HTMLElement;
  const ov = (): Hm | null => document.getElementById('costura');
  const quiet = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let on = false, raf = 0, ro: ResizeObserver | null = null, sc: HTMLElement | null = null, vh = 0, docH = 0;
  let tPrev = 0, tMove = 0, yLast: number | null = null, tgtLast = 0, dir = 1, ud = K.PARK, vel = 0, vs = 0, parked = true, parkU = K.PARK, kmax = 0, spin = 0, gLast: number | null = null;

  const scroller = () => {
    const r = root();
    if (r.scrollHeight - window.innerHeight >= Math.max(200, r.scrollHeight * 0.12)) return r;
    let a: HTMLElement | null = ov()?.parentElement ?? null;
    while (a && a !== document.body && a !== document.documentElement) {
      if (a.scrollHeight - a.clientHeight >= 200 && /(auto|scroll)/.test(getComputedStyle(a).overflowY)) return a;
      a = a.parentElement;
    }
    return r;
  };
  // Recorrido: la aguja parte en el borde izquierdo del logo y termina en el borde derecho del último elemento de la fila; la banda de tela va arriba de ambos.
  function layout(e: Hm): Lay {
    const h = e.parentElement as HTMLElement, hr = h.getBoundingClientRect(), W = hr.width, inn = h.querySelector('.hdr-in') as HTMLElement, lane = h.querySelector('.hdr-lane') as HTMLElement | null
    const s = W >= 768 ? 0.435 : 0.39
    const img = (h.querySelector('.brand img') || h.querySelector('.brand')) as HTMLElement, ir = img.getBoundingClientRect()
    const items = (Array.from(inn.children) as HTMLElement[]).filter((n) => n.offsetParent !== null), lr = items[items.length - 1].getBoundingClientRect()
    return { x0: Math.max(ir.left - hr.left, 86 * s + 8), x1: Math.min(lr.right - hr.left, W - 10),
      P: W >= 1100 ? 10 : W >= 768 ? 9 : 7, s, yp: lane ? lane.offsetTop + lane.offsetHeight - 5 : 31 }
  }
  function measure() {
    sc = scroller() as HTMLElement; const own = sc !== root(), e = ov(); vh = own ? sc.clientHeight : window.innerHeight; docH = sc.scrollHeight;
    if (!e) return;
    e._L = layout(e);
    kmax = Math.min(kmax, Math.max(0, Math.floor((e._L.x1 - e._L.x0) / e._L.P)));
  }
  function reposo(e: Hm, lleno: boolean) {
    e.classList.add('is-static'); yLast = null; vs = 0; vel = 0; ud = K.PARK; parkU = K.PARK; parked = true; kmax = 0; spin = 0; gLast = null;
    const L = e._L; if (lleno && L) kmax = Math.floor((L.x1 - L.x0) / L.P);
    pose(e, { u: K.PARK, T: 0.14, b: 0, sp: 0, wd: lleno ? 0.62 : 1, kmax });
  }
  function frame(t?: number) {
    raf = 0; const e = ov(); if (!e) return;
    if (!e._L) measure();
    const max = docH - vh;
    if (quiet()) { reposo(e, true); return; }
    if (max < 24) { reposo(e, false); return; }    // en el lienzo el marco mide casi lo mismo que la página: no hay scroll que seguir
    e.classList.remove('is-static');
    const L = e._L as Lay, Lm = L.x1 - L.x0; t = t || performance.now();
    const dt = clamp(t - (tPrev || t - 16), 4, 64); tPrev = t;
    const y = (sc || root()).scrollTop, tgt = clamp(y / max, 0, 1) * Lm / L.P;      // un ciclo por cada paso de puntada que recorre la cabeza
    if (yLast === null) { yLast = y; tgtLast = tgt; tMove = t; ud = Math.max(K.PARK, Math.floor(tgt) + K.PARK); parkU = ud; kmax = Math.floor(ud + K.HOLE); gLast = null; }
    if (Math.abs(y - yLast) > 0) {                                  // gesto en curso: velocidad desde el último cuadro con movimiento
      const vi = Math.abs(y - yLast) / clamp(t - tMove, 8, 200); tMove = t;
      vs += (vi - vs) * (1 - Math.exp(-dt / (vi > vs ? 70 : 140)));
      dir = tgt >= tgtLast ? 1 : -1; parked = false;
    } else if (t - tMove > 50) {
      vs *= Math.exp(-dt / 90);
      if (!parked && t - tMove > 110) {                             // se detuvo: la máquina termina la puntada y se para con la aguja arriba
        const lim = Math.floor(Lm / L.P) + K.PARK;
        parkU = clamp(dir >= 0 ? Math.ceil(tgt - K.PARK) + K.PARK : Math.floor(tgt - K.PARK) + K.PARK, K.PARK, lim); parked = true;
      }
    }
    yLast = y; tgtLast = tgt;
    const w0 = 1 / (parked ? 55 : 36), ex = Math.exp(-w0 * dt), target = parked ? parkU : tgt;     // volante con inercia (amortiguamiento crítico)
    const A0 = ud - target, B0 = vel + w0 * A0;
    ud = target + (A0 + B0 * dt) * ex; vel = (B0 - w0 * (A0 + B0 * dt)) * ex;
    const I = clamp(Math.log10(1 + vs / 0.1) / Math.log10(81), 0, 1);                 // intensidad del gesto: 0,1 px/ms a 8 px/ms, escala logarítmica
    const b = smooth(0.07, 0.30, Math.abs(vel) * 16.7);                               // ciclos por cuadro: a partir de ahí solo se ve un borrón
    const hole = Math.floor(ud + K.HOLE); if (hole > kmax) kmax = hole;
    const g = Math.floor(ud) + smooth(0.05, 0.40, frac(ud));                          // el carrete suelta hilo mientras la palanca lo tira, y siempre en el mismo sentido
    if (gLast !== null) spin += K.SPD * Math.abs(g - gLast); gLast = g;
    pose(e, { u: ud, T: 0.14 + 0.86 * I, b, sp: spin, wd: 1 - 0.38 * clamp(kmax * L.P / Lm, 0, 1), kmax });
    if (!parked || Math.abs(ud - parkU) > 0.003 || Math.abs(vel) > 0.00005 || vs > 0.003) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const resize = () => { const e = ov(); if (e) e._L = null; measure(); kick(); };
  return {
    K, pose, measure,
    start() {
      if (on) return; on = true; measure();
      window.addEventListener('scroll', kick, { passive: true, capture: true });
      window.addEventListener('resize', resize);
      if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(document.getElementById('root') ?? document.documentElement) /* html mide 100 % del alto: el contenido crece en #root */; }
      frame();
    },
    stop() {
      if (!on) return; on = false;
      window.removeEventListener('scroll', kick, { capture: true }); window.removeEventListener('resize', resize);
      if (ro) { ro.disconnect(); ro = null; }
      cancelAnimationFrame(raf); raf = 0;
    },
  };
})();
