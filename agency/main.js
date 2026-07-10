/* =============================================================================
   VoxelBox Agency — main.js
   Renders Services / Projects / Case Studies from data.js (window.VOXELBOX_DATA),
   plus scroll reveals, nav, case-study modal, and the contact form.
   No dependencies, no build step.
   ============================================================================= */
(function () {
  "use strict";

  var DATA = window.VOXELBOX_DATA || { SERVICES: [], PROJECTS: [], CASE_STUDIES: {} };
  var CONTACT_EMAIL = "admin@voxelbox.org"; // used for the mailto: fallback
  var CONTACT_ENDPOINT = "https://demos.voxelbox.org/api/lead";    // existing VoxelBox relay (verified live)

  /* --- tiny helpers ------------------------------------------------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (attrs[k] != null) node.setAttribute(k, attrs[k]); }
    if (html != null) node.innerHTML = html;
    return node;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }

  document.addEventListener("DOMContentLoaded", function () {
    renderServices();
    renderProjects();
    initReveal();
    initHeader();
    initNav();
    initModal();
    initContactForm();
    setYear();
  });

  /* --- Services ----------------------------------------------------------- */
  function renderServices() {
    var mount = $("[data-services]");
    if (!mount) return;
    DATA.SERVICES.forEach(function (s, i) {
      var card = el("article", {
        "class": "card service reveal",
        "data-delay": String((i % 3) + 1)
      });
      card.innerHTML =
        '<div class="icon" aria-hidden="true">' + s.icon + "</div>" +
        "<h3>" + esc(s.title) + "</h3>" +
        "<p>" + esc(s.desc) + "</p>";
      mount.appendChild(card);
    });
  }

  /* --- Projects ----------------------------------------------------------- */
  function renderProjects() {
    var mount = $("[data-projects]");
    if (!mount) return;
    DATA.PROJECTS.forEach(function (p, i) {
      var tags = p.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
      var grad = "linear-gradient(135deg, " + esc(p.accent) + " 0%, rgba(61,139,255,0.55) 100%)";
      var card = el("article", { "class": "card project reveal", "data-delay": String((i % 3) + 1) });
      card.innerHTML =
        '<div class="thumb" style="background:' + grad + '" role="img" aria-label="Illustrative demo screenshot placeholder for ' + esc(p.title) + '">' +
          '<span class="badge-demo">Demo</span>' +
          '<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
          '<span class="mock-window" aria-hidden="true"></span>' +
          '<span class="mock-label">' + esc(p.mock) + "<small>Demo preview</small></span>" +
        "</div>" +
        '<div class="body">' +
          "<h3>" + esc(p.title) + "</h3>" +
          "<p>" + esc(p.blurb) + "</p>" +
          '<div class="tags">' + tags + "</div>" +
          '<button class="btn btn--ghost btn--sm" type="button" data-case="' + esc(p.id) + '" aria-haspopup="dialog">View Case Study' +
            ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
          "</button>" +
        "</div>";
      mount.appendChild(card);
    });
  }

  /* --- Case-study modal (populated from CASE_STUDIES) --------------------- */
  var modal, modalContent, lastFocused;

  function initModal() {
    modal = $("[data-modal]");
    if (!modal) return;
    modalContent = $("[data-modal-content]", modal);

    document.addEventListener("click", function (e) {
      var trigger = e.target.closest ? e.target.closest("[data-case]") : null;
      if (trigger) { e.preventDefault(); openCase(trigger.getAttribute("data-case"), trigger); return; }
      if (e.target.closest && e.target.closest("[data-modal-close]")) { closeModal(); return; }
      if (e.target === modal) { closeModal(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });
  }

  function openCase(id, trigger) {
    var project = DATA.PROJECTS.filter(function (p) { return p.id === id; })[0];
    var cs = DATA.CASE_STUDIES[id];
    if (!project || !cs || !modal) return;
    lastFocused = trigger || document.activeElement;

    var grad = "linear-gradient(135deg, " + esc(project.accent) + " 0%, rgba(61,139,255,0.55) 100%)";
    var results = cs.results.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("");
    var tools = cs.tools.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");

    modalContent.innerHTML =
      '<div class="modal-hero" style="background:' + grad + '">' +
        '<button class="modal-close" type="button" data-modal-close aria-label="Close case study">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        "</button>" +
        '<span class="badge-demo" style="position:static;display:inline-block">Demo Case Study</span>' +
        '<h3 id="modal-title">' + esc(project.title) + "</h3>" +
        '<p style="color:rgba(255,255,255,0.9);max-width:52ch">' + esc(project.blurb) + "</p>" +
      "</div>" +
      '<div class="modal-body">' +
        block("Problem", "<p>" + esc(cs.problem) + "</p>") +
        block("Solution", "<p>" + esc(cs.solution) + "</p>") +
        block("Results", '<ul class="cs-results">' + results + "</ul>" +
          '<p class="cs-note">Results shown are illustrative demo figures to show the shape of an engagement — not measured outcomes from a real client.</p>') +
        block("Tools Used", '<div class="tags">' + tools + "</div>") +
        '<a class="btn btn--ghost btn--sm" href="case-study.html?id=' + encodeURIComponent(id) + '">Open full case-study page' +
          ' <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></a>' +
      "</div>";

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = $(".modal-close", modal);
    if (closeBtn) closeBtn.focus();
  }

  function block(title, inner) {
    return '<div class="cs-block"><h4>' + esc(title) + "</h4>" + inner + "</div>";
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* --- Scroll reveal ------------------------------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (n) { n.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (n) { io.observe(n); });
  }

  /* --- Header shadow on scroll ------------------------------------------- */
  function initHeader() {
    var header = $("[data-header]");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* --- Mobile nav --------------------------------------------------------- */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var links = $("[data-nav-links]");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* --- Contact form ------------------------------------------------------- */
  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) return;
    var statusEl = $("[data-form-status]", form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) { return; }

      var data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        business: form.business.value.trim(),
        budget: form.budget.value,
        message: form.message.value.trim()
      };

      var composed =
        data.message +
        "\n\n— — —\nBusiness type: " + (data.business || "n/a") +
        "\nProject budget: " + (data.budget || "n/a");

      setStatus(statusEl, "pending", "Sending…");
      var btn = $("[type=submit]", form);
      if (btn) btn.disabled = true;

      // Primary: POST to the existing VoxelBox contact relay.
      fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          message: composed,
          company: data.business
        })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (res) {
        if (res.ok && res.j && res.j.ok) {
          form.reset();
          setStatus(statusEl, "ok", "Thanks — your message has been sent. We'll be in touch soon.");
        } else {
          // Endpoint reachable but rejected — fall back to email so nothing is lost.
          mailtoFallback(data, composed);
          setStatus(statusEl, "ok", "Opening your email app so you can send this to us directly.");
        }
      }).catch(function () {
        // Network/endpoint unavailable — graceful mailto fallback.
        mailtoFallback(data, composed);
        setStatus(statusEl, "ok", "Opening your email app so you can send this to us directly.");
      }).then(function () {
        if (btn) btn.disabled = false;
      });
    });

    // Clear per-field error styling as the user fixes it.
    form.addEventListener("input", function (e) {
      var field = e.target.closest(".field");
      if (field && field.classList.contains("invalid")) {
        field.classList.remove("invalid");
        var msg = $(".err-msg", field);
        if (msg) msg.textContent = "";
      }
    });
  }

  function mailtoFallback(data, composed) {
    var subject = "VoxelBox project inquiry — " + (data.name || "New inquiry");
    var body =
      "Name: " + data.name + "\n" +
      "Email: " + data.email + "\n" +
      "Business type: " + (data.business || "n/a") + "\n" +
      "Project budget: " + (data.budget || "n/a") + "\n\n" +
      "Message:\n" + data.message;
    var href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    window.location.href = href;
  }

  function validate(form) {
    var ok = true;
    var checks = [
      { name: "name", test: function (v) { return v.trim().length >= 2; }, msg: "Please enter your name." },
      { name: "email", test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, msg: "Please enter a valid email." },
      { name: "message", test: function (v) { return v.trim().length >= 10; }, msg: "Please add a little more detail (10+ characters)." }
    ];
    checks.forEach(function (c) {
      var input = form[c.name];
      var field = input.closest(".field");
      var valid = c.test(input.value);
      if (!valid) {
        ok = false;
        if (field) {
          field.classList.add("invalid");
          var m = $(".err-msg", field);
          if (m) m.textContent = c.msg;
        }
      }
    });
    return ok;
  }

  function setStatus(node, cls, text) {
    if (!node) return;
    node.className = "form-status " + cls;
    node.textContent = text;
  }

  function setYear() {
    var y = document.querySelector("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  }
})();
