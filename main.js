(() => {
  const numero = (window.FUSE && window.FUSE.whatsapp) || "";
  const wa = (texto) => `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Botón flotante: directo a WhatsApp si ya hay número; si no, al formulario.
  const flotante = document.querySelector(".wa-meca");
  if (numero && flotante) {
    flotante.href = wa("Hola, me interesa Negocio Listo en 30 Días de Fuse.");
    flotante.target = "_blank";
    flotante.rel = "noopener";
  }

  // Nav con más fondo al bajar.
  const nav = document.querySelector("[data-nav]");
  const marcarNav = () => nav.classList.toggle("con-fondo", window.scrollY > 40);
  marcarNav();
  window.addEventListener("scroll", marcarNav, { passive: true });

  // Los botones de nivel preseleccionan el nivel en el formulario.
  const form = document.getElementById("form");
  const select = form.querySelector('select[name="nivel"]');
  document
    .querySelectorAll("[data-nivel]")
    .forEach((a) => a.addEventListener("click", () => (select.value = a.dataset.nivel)));

  // Formulario → mensaje de WhatsApp (no se guarda nada en un servidor).
  const nota = document.getElementById("form-nota");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const faltan = ["nombre", "giro"].filter((k) => !String(d[k] || "").trim());
    form.querySelectorAll("input").forEach((i) => {
      const mal = faltan.includes(i.name);
      i.classList.toggle("error", mal);
      i.setAttribute("aria-invalid", mal ? "true" : "false");
    });
    if (faltan.length) {
      nota.textContent = "Escribe tu nombre y tu negocio para continuar.";
      form.querySelector(`[name="${faltan[0]}"]`).focus();
      return;
    }
    const texto =
      `Hola, soy ${d.nombre.trim()}. Me interesa Negocio Listo en 30 Días de Fuse.\n` +
      `Negocio: ${d.giro.trim()}\nNivel: ${d.nivel}` +
      (d.mensaje && d.mensaje.trim() ? `\n${d.mensaje.trim()}` : "");
    if (!numero) {
      nota.textContent = "El número de WhatsApp aún no está configurado (config.js).";
      return;
    }
    nota.textContent = "Abriendo WhatsApp…";
    const boton = form.querySelector(".boton-mecha");
    boton.classList.add("prendido");
    setTimeout(() => boton.classList.remove("prendido"), 1600);
    window.open(wa(texto), "_blank", "noopener");
  });

  // Plan de 30 días: la mecha se quema con el scroll y el contador sigue el avance.
  const plan = document.querySelector("[data-plan]");
  const pasos = [...plan.querySelectorAll(".paso")];
  const dia = plan.querySelector("[data-dia]");
  const quemado = plan.querySelector("[data-quemado]");
  const pista = plan.querySelector("[data-pista]");
  let pendiente = false;
  const pintar = () => {
    pendiente = false;
    const caja = plan.querySelector(".plan-pasos").getBoundingClientRect();
    const centro = window.innerHeight * 0.55;
    const avance = Math.min(1, Math.max(0, (centro - caja.top) / caja.height));
    quemado.style.transform = `scaleX(${avance.toFixed(4)})`;
    pista.style.transform = `translateX(${(avance * 100).toFixed(2)}%)`;
    const n = Math.max(1, Math.round(avance * 30));
    dia.textContent = String(n).padStart(2, "0");
    // La semana activa sale del día del contador, no de la posición en pantalla.
    const activo = pasos.find((p) => n <= Number(p.dataset.paso));
    pasos.forEach((p) => p.classList.toggle("activo", p === activo));
  };
  const pedir = () => {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(pintar);
    }
  };
  pintar();
  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", pedir);

  // Aparición suave de bloques; si no hay IntersectionObserver o se pidió menos movimiento, todo queda visible.
  const bloques = document.querySelectorAll(
    ".encabezado, .seccion-quien .titulo, .rejilla, .quien-carril, .carriles, .listas, .garantia .contenedor, .preguntas, .form",
  );
  if (!reducir && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("visto");
            io.unobserve(en.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px" },
    );
    bloques.forEach((b) => {
      if (b.getBoundingClientRect().top > window.innerHeight) {
        b.classList.add("revelar");
        io.observe(b);
      }
    });
  }

  // Escenas de "idea a realidad": se arman cuando entran en pantalla.
  const realidad = document.querySelector("[data-realidad]");
  if (realidad) {
    const escenas = realidad.querySelectorAll(".escena");
    if (reducir || !("IntersectionObserver" in window)) escenas.forEach((e) => e.classList.add("en-vista"));
    else {
      // Cada pantalla se arma cuando ella misma entra a la vista (en celular van apiladas).
      const io2 = new IntersectionObserver(
        (entradas) =>
          entradas.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("en-vista");
              io2.unobserve(en.target);
            }
          }),
        { threshold: 0.35 },
      );
      escenas.forEach((e) => io2.observe(e));
    }
  }

  // Cursor: punto que sigue al mouse exacto y aro que lo alcanza con retraso. Solo con mouse.
  const cursor = document.querySelector(".cursor");
  if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.documentElement.classList.add("con-cursor");
    const punto = cursor.querySelector(".cursor-punto");
    const aro = cursor.querySelector(".cursor-aro");
    const luz = cursor.querySelector(".cursor-luz");
    let mx = -100,
      my = -100,
      ax = -100,
      ay = -100,
      escala = 0.46,
      meta = 0.46;
    window.addEventListener("pointermove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      punto.style.transform = `translate(${mx}px, ${my}px)`;
      const objetivo = e.target.closest("a, button, summary, select, [data-nivel]");
      const campo = e.target.closest("input, textarea");
      cursor.classList.toggle("sobre", !!objetivo);
      cursor.classList.toggle("escribiendo", !!campo);
      meta = objetivo ? 1 : 0.46;
      cursor.classList.remove("fuera");
    });
    document.addEventListener("pointerleave", () => cursor.classList.add("fuera"));
    window.addEventListener("pointerdown", () => (meta = 0.38));
    window.addEventListener("pointerup", () => (meta = cursor.classList.contains("sobre") ? 1 : 0.46));
    const seguir = () => {
      const k = reducir ? 1 : 0.18;
      ax += (mx - ax) * k;
      ay += (my - ay) * k;
      escala += (meta - escala) * (reducir ? 1 : 0.2);
      aro.style.transform = `translate(${ax}px, ${ay}px) scale(${escala.toFixed(3)})`;
      luz.style.transform = `translate(${ax}px, ${ay}px)`;
      requestAnimationFrame(seguir);
    };
    requestAnimationFrame(seguir);
  }
})();
