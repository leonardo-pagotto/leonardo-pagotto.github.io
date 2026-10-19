(function () {
  var root = document.querySelector("[data-post-carousel]");
  if (!root) return;

  var track = root.querySelector("[data-carousel-track]");
  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-slide]"));
  var spacer = root.querySelector("[data-carousel-spacer]");
  var dotsWrap = root.querySelector("[data-carousel-dots]");
  var controls = root.querySelector(".post-carousel__controls");
  var prev = root.querySelector("[data-carousel-prev]");
  var next = root.querySelector("[data-carousel-next]");
  var status = root.querySelector("[data-carousel-status]");
  var wide = window.matchMedia("(min-width: 768px)");
  if (!track || !slides.length) return;

  var index = 0;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var configured = parseInt(root.getAttribute("data-per-view"), 10) || 3;

  function perView() {
    return wide.matches ? configured : 1;
  }

  function pageCount() {
    return Math.max(1, Math.ceil(slides.length / perView()));
  }

  function updateSpacer() {
    if (!spacer) return;
    var view = perView();
    var remainder = slides.length % view;
    var missing = remainder === 0 ? 0 : view - remainder;
    var basis = (missing * 100) / view;
    spacer.style.flexBasis = basis + "%";
    spacer.style.minWidth = basis + "%";
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.replaceChildren();
    var total = pageCount();
    var view = perView();
    for (var i = 0; i < total; i++) {
      var start = i * view + 1;
      var end = Math.min(slides.length, (i + 1) * view);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "post-carousel__dot";
      button.dataset.page = String(i);
      button.setAttribute("aria-label", start === end ? "Show post " + start : "Show posts " + start + " to " + end);
      button.addEventListener("click", function () {
        go(Number(this.dataset.page));
      });
      dotsWrap.appendChild(button);
    }
  }

  function apply(page) {
    var total = pageCount();
    index = ((page % total) + total) % total;
    var view = perView();
    var start = index * view;
    slides.forEach(function (slide, i) {
      if (i >= start && i < start + view) slide.removeAttribute("inert");
      else slide.setAttribute("inert", "");
    });
    if (dotsWrap) {
      Array.prototype.forEach.call(dotsWrap.querySelectorAll("[data-page]"), function (dot) {
        dot.setAttribute("aria-current", Number(dot.dataset.page) === index ? "true" : "false");
      });
    }
    if (controls) controls.hidden = total < 2;
    if (status) {
      var from = start + 1;
      var to = Math.min(slides.length, start + view);
      status.textContent = from === to
        ? "Post " + from + " of " + slides.length
        : "Posts " + from + "–" + to + " of " + slides.length;
    }
  }

  function go(page, behavior) {
    apply(page);
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: behavior || (reduceMotion ? "auto" : "smooth")
    });
  }

  function layout() {
    updateSpacer();
    buildDots();
    if (index >= pageCount()) index = pageCount() - 1;
    go(index, "auto");
  }

  if (prev) prev.addEventListener("click", function () { go(index - 1); });
  if (next) next.addEventListener("click", function () { go(index + 1); });

  root.addEventListener("keydown", function (event) {
    var tag = event.target && event.target.tagName;
    if (tag === "A" || tag === "INPUT" || tag === "TEXTAREA") return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  });

  var frame = 0;
  track.addEventListener("scroll", function () {
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      var width = track.clientWidth || 1;
      var page = Math.round(track.scrollLeft / width);
      if (page !== index && page >= 0 && page < pageCount()) apply(page);
    });
  }, { passive: true });

  if (wide.addEventListener) wide.addEventListener("change", layout);
  window.addEventListener("resize", layout);
  layout();
})();
