// Swap every <i data-lucide="name"> for its Lucide SVG icon.
if (window.lucide) lucide.createIcons();

// Menu and nav work without GSAP; the page stays fully visible if the CDN fails.
const toggle = document.querySelector(".nav__toggle");
const menu = document.getElementById("menu");

function setMenu(open) {
  document.body.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", open);
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menu.inert = !open;
}
toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
menu.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
// Resizing up to desktop (where the menu button is hidden) must not leave the page locked.
matchMedia("(min-width: 901px)").addEventListener("change", (e) => e.matches && setMenu(false));

const nav = document.querySelector(".nav");
const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Animations: only when GSAP loaded and the visitor has not asked for reduced motion.
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const ease = "power3.out";

    // Hero entrance
    gsap.timeline({ defaults: { ease, duration: 1 } })
      .fromTo(".hero__bg img", { scale: 1.3, autoAlpha: 0 }, { scale: 1.1, autoAlpha: 1, duration: 2.6, ease: "power2.out" }, 0)
      .from(".nav__inner", { y: -30, autoAlpha: 0 }, 0.2)
      .from(".hero__eyebrow", { y: 20, autoAlpha: 0 }, 0.4)
      .from(".hero__title .line > span", { yPercent: 110, stagger: 0.12, duration: 1.2 }, 0.5)
      .from(".hero__sub", { y: 30, autoAlpha: 0 }, 0.9)
      .from(".hero__actions > *", { y: 30, autoAlpha: 0, stagger: 0.12 }, 1.1);

    // Endless slow drift, like a camera floating over the Moon. Each axis has its own length, so the path never visibly repeats.
    // The 1.1 scale above keeps the edges covered; the loop pauses while the hero is off screen.
    const loop = { ease: "sine.inOut", repeat: -1, yoyo: true };
    const drift = [
      gsap.fromTo(".hero__bg img", { xPercent: -1.5 }, { xPercent: 1.5, duration: 11, ...loop }),
      gsap.fromTo(".hero__bg img", { y: -12 }, { y: 12, duration: 9, ...loop }),
      gsap.fromTo(".hero__bg img", { rotation: -0.5 }, { rotation: 0.5, duration: 14, ...loop }),
    ];
    ScrollTrigger.create({ trigger: ".hero", start: "top bottom", end: "bottom top", onToggle: (s) => drift.forEach((t) => t.paused(!s.isActive)) });

    // Hero parallax: the Moon drifts slower than the page, the text fades away
    gsap.to(".hero__bg img", {
      yPercent: -12, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__content", {
      y: -80, autoAlpha: 0, ease: "none", immediateRender: false,
      scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true },
    });

    // Play each time the element scrolls into view; rewind only once it is fully off screen.
    const replay = (tween, trigger) => {
      ScrollTrigger.create({ trigger, start: "top 85%", end: "bottom top", onEnter: () => tween.play(), onEnterBack: () => tween.play() });
      ScrollTrigger.create({ trigger, start: "top bottom", end: "bottom top", onLeave: () => tween.pause(0), onLeaveBack: () => tween.pause(0) });
    };

    // Text and cards rise in, one after another
    const rise = (targets, trigger) =>
      replay(gsap.from(targets, { y: 50, autoAlpha: 0, duration: 0.9, ease, stagger: 0.12, paused: true }), trigger);
    gsap.utils.toArray("[data-reveal]").forEach((el) => rise(el, el));
    gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
      const items = group.matches(".panel") ? group.querySelectorAll("h3, li") : group.children;
      rise(items, group);
    });

    // Compare panels slide in from their own side
    gsap.utils.toArray(".panel").forEach((panel, i) =>
      replay(gsap.from(panel, { x: i ? 60 : -60, autoAlpha: 0, duration: 1, ease, paused: true }), ".compare")
    );

    // Media boxes wipe open
    gsap.utils.toArray("[data-media]").forEach((el) =>
      replay(gsap.from(el, { clipPath: "inset(100% 0 0 0 round 24px)", scale: 0.92, duration: 1.3, ease: "power4.out", paused: true }), el)
    );

    // Numbers count up from zero
    gsap.utils.toArray("[data-count]").forEach((el) => {
      const decimals = (el.dataset.count.split(".")[1] || "").length;
      const n = { v: 0 };
      const show = () => (el.textContent = n.v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
      replay(gsap.to(n, { v: +el.dataset.count, duration: 1.8, ease: "power2.out", paused: true, onUpdate: show }), el);
    });

    // Sun-and-horizon demos: the Sun's position is a function of one looping 0..1 value; paused while off screen.
    const sunPath = {
      equator: (u) => [300 - 240 * Math.cos(u * 2 * Math.PI), 240 - 200 * Math.sin(u * 2 * Math.PI)], // sunrise, noon, sunset, then below the horizon
      pole: (u) => [-40 + 680 * u, 214 - 10 * Math.sin(u * 6 * Math.PI)], // skims the horizon, passing behind ridges
    };
    gsap.utils.toArray("[data-sky]").forEach((svg) => {
      const sun = svg.querySelector(".sun");
      const place = sunPath[svg.dataset.sky];
      const t = { u: 0 };
      const tween = gsap.to(t, {
        u: 1, duration: svg.dataset.sky === "pole" ? 16 : 10, ease: "none", repeat: -1,
        onUpdate: () => sun.setAttribute("transform", `translate(${place(t.u).map((n) => n.toFixed(1)).join(" ")})`),
      });
      ScrollTrigger.create({ trigger: svg, start: "top bottom", end: "bottom top", onToggle: (s) => tween.paused(!s.isActive) });
    });

    // Horizon rises as the last section scrolls in
    gsap.from(".cta__bg", {
      yPercent: 18, ease: "none",
      scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom bottom", scrub: true },
    });
  });
}
