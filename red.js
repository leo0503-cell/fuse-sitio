// Portada: una red de puntos de fondo y, encima, la historia "de la idea a la realidad":
// una chispa (la idea) que enciende uno por uno los nodos del negocio unidos por una mecha.
(() => {
  const canvas = document.querySelector("[data-red]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ROJO = "224, 49, 39";
  const BRASA = "255, 138, 61";
  const CREMA = "245, 238, 229";

  const NODOS = ["Idea", "Marca", "Página web", "Google", "Redes", "WhatsApp", "Ventas"];
  // Posiciones relativas: en escritorio rodean el titular; en celular van en zigzag arriba.
  const ANCHO = [
    [0.06, 0.26],
    [0.11, 0.52],
    [0.05, 0.76],
    [0.93, 0.2],
    [0.89, 0.44],
    [0.95, 0.64],
    [0.9, 0.84],
  ];
  const ANGOSTO = [
    [0.1, 0.17],
    [0.3, 0.27],
    [0.47, 0.15],
    [0.64, 0.26],
    [0.86, 0.15],
    [0.78, 0.31],
    [0.92, 0.36],
  ];

  let w = 0,
    h = 0,
    dpr = 1,
    puntos = [],
    nodos = [],
    raton = { x: -9999, y: -9999 },
    activo = true,
    historiaVisible = true,
    t0 = performance.now();

  const PASO = 1300; // ms entre un nodo y el siguiente
  const CICLO = PASO * NODOS.length + 3200;

  function medir() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const angosto = w < 760;
    if (angosto) {
      // En celular la historia vive en la franja libre entre el menú y el titular; si no cabe, solo queda la red.
      const titulo = document.querySelector(".hero-titulo").getBoundingClientRect();
      const arriba = 84;
      const abajo = titulo.top - r.top - 18;
      historiaVisible = abajo - arriba >= 130;
      const ys = ANGOSTO.map((p) => p[1]);
      const min = Math.min(...ys),
        max = Math.max(...ys);
      nodos = NODOS.map((nombre, i) => ({
        nombre,
        x: ANGOSTO[i][0] * w,
        y: arriba + ((ANGOSTO[i][1] - min) / (max - min)) * (abajo - arriba),
      }));
    } else {
      historiaVisible = true;
      nodos = NODOS.map((nombre, i) => ({ nombre, x: ANCHO[i][0] * w, y: ANCHO[i][1] * h }));
    }
    const n = Math.round(Math.min(110, (w * h) / (angosto ? 9000 : 14000)));
    puntos = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      r: Math.random() * 1.2 + 0.4,
      brillo: Math.random(),
    }));
  }

  function fondo(dt) {
    const lim = Math.min(170, w * 0.16);
    for (const p of puntos) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < puntos.length; i++) {
      const a = puntos[i];
      for (let j = i + 1; j < puntos.length; j++) {
        const b = puntos[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < lim) {
          ctx.strokeStyle = `rgba(${CREMA}, ${(1 - d / lim) * 0.09})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      const dr = Math.hypot(a.x - raton.x, a.y - raton.y);
      if (dr < 190) {
        ctx.strokeStyle = `rgba(${ROJO}, ${(1 - dr / 190) * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(raton.x, raton.y);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${CREMA}, ${0.25 + a.brillo * 0.35})`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function brasa(x, y, radio, alfa) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radio * 5);
    g.addColorStop(0, `rgba(255, 217, 168, ${alfa})`);
    g.addColorStop(0.25, `rgba(${BRASA}, ${alfa * 0.6})`);
    g.addColorStop(1, `rgba(${ROJO}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radio * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function historia(ms) {
    // ms: tiempo dentro del ciclo. Cada tramo i→i+1 se quema durante PASO ms.
    const fin = ms > PASO * (NODOS.length - 1) + 600;
    const desvanecer = ms > CICLO - 900 ? (CICLO - ms) / 900 : 1;
    const avance = Math.min(NODOS.length - 1, ms / PASO);
    ctx.save();
    ctx.globalAlpha = Math.max(0, desvanecer);
    ctx.lineCap = "round";
    for (let i = 0; i < NODOS.length - 1; i++) {
      const a = nodos[i],
        b = nodos[i + 1];
      // Mecha punteada completa (el camino por recorrer).
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = `rgba(${CREMA}, 0.16)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      // Tramo quemado.
      const k = Math.max(0, Math.min(1, avance - i));
      if (k > 0) {
        const x = a.x + (b.x - a.x) * k,
          y = a.y + (b.y - a.y) * k;
        ctx.setLineDash([]);
        const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        g.addColorStop(0, `rgba(${ROJO}, 0.25)`);
        g.addColorStop(1, `rgba(${ROJO}, 0.75)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (k < 1) brasa(x, y, 2.4, 1);
      }
    }
    ctx.setLineDash([]);
    // Nodos y etiquetas.
    const angosto = w < 760;
    ctx.font = `500 ${angosto ? 11 : 13}px "DM Sans", system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    nodos.forEach((n, i) => {
      const prendido = avance >= i - 0.02;
      const reciente = prendido && avance - i < 0.6;
      ctx.fillStyle = prendido ? `rgba(${ROJO}, 1)` : `rgba(${CREMA}, 0.25)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, prendido ? 3.6 : 2.4, 0, Math.PI * 2);
      ctx.fill();
      if (prendido) {
        ctx.strokeStyle = `rgba(${ROJO}, ${reciente ? 0.9 : 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, reciente ? 9 + (avance - i) * 10 : 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (i === NODOS.length - 1 && fin) brasa(n.x, n.y, 3, 0.9);
      const derecha = n.x > w * 0.5;
      ctx.textAlign = derecha ? "right" : "left";
      ctx.fillStyle = prendido ? `rgba(${CREMA}, 0.92)` : `rgba(${CREMA}, 0.35)`;
      ctx.fillText(n.nombre, n.x + (derecha ? -16 : 16), n.y);
    });
    ctx.restore();
  }

  let previo = performance.now();
  function cuadro(ahora) {
    if (!activo) return;
    const dt = Math.min(48, ahora - previo) / 16.7;
    previo = ahora;
    ctx.clearRect(0, 0, w, h);
    fondo(dt);
    if (historiaVisible) historia((ahora - t0) % CICLO);
    requestAnimationFrame(cuadro);
  }

  function estatico() {
    ctx.clearRect(0, 0, w, h);
    fondo(0);
    if (historiaVisible) historia(PASO * NODOS.length);
  }

  medir();
  if (document.fonts) document.fonts.ready.then(() => setTimeout(medir, 1100));
  if (reducir) {
    estatico();
    window.addEventListener("resize", () => {
      medir();
      estatico();
    });
    return;
  }

  const hero = canvas.closest(".hero");
  hero.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    raton = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  hero.addEventListener("pointerleave", () => (raton = { x: -9999, y: -9999 }));
  window.addEventListener("resize", medir);

  // Solo anima cuando la portada se ve y la pestaña está al frente.
  const reanudar = () => {
    if (!activo) {
      activo = true;
      previo = performance.now();
      requestAnimationFrame(cuadro);
    }
  };
  new IntersectionObserver(([en]) => (en.isIntersecting && !document.hidden ? reanudar() : (activo = false))).observe(
    hero,
  );
  document.addEventListener("visibilitychange", () => (document.hidden ? (activo = false) : reanudar()));
  requestAnimationFrame(cuadro);
})();
