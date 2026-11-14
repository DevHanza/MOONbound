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

const nav = document.querySelector(".nav");
const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Animations: only when GSAP loaded and the visitor has not asked for reduced motion.
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const ease = "power3.out";

    // Hero entrance
    gsap.timeline({ defaults: { ease, duration: 1 } })
      .from(".hero__bg img", { scale: 1.25, duration: 2.4, ease: "power2.out" }, 0)
      .from(".nav__inner", { y: -30, autoAlpha: 0 }, 0.2)
      .from(".hero__eyebrow", { y: 20, autoAlpha: 0 }, 0.4)
      .from(".hero__title .line > span", { yPercent: 110, stagger: 0.12, duration: 1.2 }, 0.5)
      .from(".hero__sub", { y: 30, autoAlpha: 0 }, 0.9)
      .from(".hero__actions > *", { y: 30, autoAlpha: 0, stagger: 0.12 }, 1.1);

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

    // Horizon rises as the last section scrolls in
    gsap.from(".cta__bg", {
      yPercent: 18, ease: "none",
      scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom bottom", scrub: true },
    });
  });
}
