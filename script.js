const SITE_ASSET_VERSION = "20260408a";
const DISCORD_URL = "https://discord.gg/voxelbox";
const GITHUB_URL = "https://github.com/voxel-box";
const LOGO_URL = `logo.png?v=${SITE_ASSET_VERSION}`;

const partnerStreamers = [
  {
    name: "Tyler Moose Live",
    channel: "tylermooselive",
    role: "Community Streamer",
    focus: "Community sessions, live hangouts, and Voxelbox server moments."
  },
  {
    name: "Howe Randome",
    channel: "howe_randome",
    role: "Featured Creator",
    focus: "Gameplay streams, chill community energy, and smaller-scale creator growth."
  },
  {
    name: "qqvirtue",
    channel: "qqvirtue",
    role: "Rising Streamer",
    focus: "Live gameplay, community interactions, and room to grow with Voxelbox."
  }
  // Add more streamers below as the community grows.
  // Keep the same shape: { name: "", channel: "", role: "", focus: "" }
];

const navigationLinks = [
  { id: "home", label: "Home", href: "index.html" },
  { id: "prints", label: "3D Prints", href: "3d-prints.html" },
  {
    id: "about",
    label: "About",
    href: "about.html",
    children: [
      { id: "team", label: "Team", href: "team.html" },
      { id: "build-log", label: "Build Log", href: "build-log.html" }
    ]
  },
  {
    id: "community",
    label: "Community",
    href: "community.html",
    children: [
      { id: "servers", label: "Servers", href: "servers.html" },
      { id: "announcements", label: "News", href: "announcements.html" },
      { id: "showcase", label: "Showcase", href: "showcase.html" },
      { id: "partners", label: "Partners", href: "partners.html" },
      { id: "rules", label: "Rules", href: "rules.html" }
    ]
  },
  {
    id: "support",
    label: "Support",
    href: "support.html",
    children: [
      { id: "getting-started", label: "Getting Started", href: "getting-started.html" },
      { id: "applications", label: "Applications", href: "applications.html" },
      { id: "update-pings", label: "Update Pings", href: "update-pings.html" }
    ]
  },
  { id: "contact", label: "Contact", href: "contact.html" }
];

const footerGroups = [
  {
    title: "Navigation",
    links: [
      { label: "Home", href: "index.html" },
      { label: "3D Prints", href: "3d-prints.html" },
      { label: "About Voxelbox", href: "about.html" },
      { label: "Staff & Team", href: "team.html" },
      { label: "Build Log", href: "build-log.html" },
      { label: "Community", href: "community.html" },
      { label: "Getting Started", href: "getting-started.html" },
      { label: "Contact", href: "contact.html" }
    ]
  },
  {
    title: "Servers",
    links: [
      { label: "Our Servers", href: "servers.html" },
      { label: "Server Pages", href: "servers.html#supported-games" },
      { label: "Server Status", href: "announcements.html#status" },
      { label: "How To Join", href: "servers.html#how-to-join" },
      { label: "Server Help", href: "support.html#faq" }
    ]
  },
  {
    title: "Community",
    links: [
      { label: "Join Discord", href: DISCORD_URL, external: true },
      { label: "GitHub", href: GITHUB_URL, external: true },
      { label: "Announcements", href: "announcements.html" },
      { label: "Events Calendar", href: "announcements.html#calendar" },
      { label: "Community Showcase", href: "showcase.html" },
      { label: "Server Spotlights", href: "community.html#spotlights" },
      { label: "Partners & Streamers", href: "partners.html" },
      { label: "Rules & Expectations", href: "rules.html" }
    ]
  },
  {
    title: "Support & Legal",
    links: [
      { label: "Print Requests", href: "3d-prints.html#request" },
      { label: "Getting Started", href: "getting-started.html" },
      { label: "Support / FAQ", href: "support.html" },
      { label: "Applications", href: "applications.html" },
      { label: "Update Pings", href: "update-pings.html" },
      { label: "Contact Staff", href: "contact.html#contact-options" },
      { label: "Terms of Service", href: "terms.html" },
      { label: "Privacy Policy", href: "privacy.html" }
    ]
  }
];

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  initHeaderScroll();
  initNavDropdowns();
  initMobileMenu();
  initReveal();
  initCounters();
  initFaq();
  initBackgroundCanvas();
  initPartnersPage();
  initBuildLogPage();
  setFooterYear();
});

function renderHeader() {
  const mount = document.querySelector("[data-site-header]");
  if (!mount) {
    return;
  }

  const page = document.body.dataset.page || "";
  const links = navigationLinks
    .map((link) => {
      const isActive = isLinkActive(link, page);

      if (link.children?.length) {
        const submenuId = `${link.id}-submenu`;
        const childLinks = link.children
          .map((child) => {
            const childActiveClass = child.id === page ? "is-active" : "";
            return `<a class="nav-dropdown-item ${childActiveClass}" href="${child.href}"${getExternalAttributes(child)}>${child.label}</a>`;
          })
          .join("");

        return `
          <div class="nav-dropdown ${isActive ? "is-active" : ""}">
            <div class="nav-dropdown-head">
              <a class="site-nav-link ${isActive ? "is-active" : ""}" href="${link.href}"${getExternalAttributes(link)}>${link.label}</a>
              <button class="nav-dropdown-toggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="${submenuId}" aria-label="Toggle ${link.label} menu">
                <span class="nav-dropdown-caret" aria-hidden="true"></span>
              </button>
            </div>
            <div class="nav-dropdown-menu" id="${submenuId}" aria-label="${link.label} submenu">
              ${childLinks}
            </div>
          </div>
        `;
      }

      return `<a class="site-nav-link ${isActive ? "is-active" : ""}" href="${link.href}"${getExternalAttributes(link)}>${link.label}</a>`;
    })
    .join("");

  mount.innerHTML = `
    <header class="site-header">
      <div class="container nav-shell">
        <a class="brand" href="index.html" aria-label="Voxelbox home">
          <img class="brand-logo" src="${LOGO_URL}" alt="Voxelbox">
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-navigation" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav class="site-nav" id="site-navigation" aria-label="Primary navigation">
          ${links}
          <a class="button button--primary nav-cta" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Join Community</a>
        </nav>
      </div>
    </header>
  `;
}

function isLinkActive(link, page) {
  return link.id === page || Boolean(link.children?.some((child) => child.id === page));
}

function renderFooter() {
  const mount = document.querySelector("[data-site-footer]");
  if (!mount) {
    return;
  }

  const groups = footerGroups
    .map((group) => {
      const links = group.links
        .map((link) => `<li><a href="${link.href}"${getExternalAttributes(link)}>${link.label}</a></li>`)
        .join("");

      return `
        <div class="footer-column">
          <h3>${group.title}</h3>
          <ul class="footer-links">${links}</ul>
        </div>
      `;
    })
    .join("");

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-shell surface">
        <div class="footer-top">
          <div class="footer-brand">
            <a class="brand" href="index.html" aria-label="Voxelbox home">
              <img class="brand-logo" src="${LOGO_URL}" alt="Voxelbox">
            </a>
            <p>Voxelbox is growing into a hybrid brand that combines custom 3D prints with free community-run game servers. We focus on practical support, creative projects, good vibes, and a smoother experience for everyone in the community.</p>
            <div class="pill-row">
              <span class="pill pill--soft">Custom 3D Prints</span>
              <span class="pill">Free Servers</span>
              <span class="pill">Discord Ready</span>
            </div>
          </div>
          <div class="footer-grid">
            ${groups}
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; <span data-current-year></span> Voxelbox. All rights reserved.</span>
          <span class="muted">Hybrid community and print brand maintained by Voxelbox staff.</span>
        </div>
      </div>
    </footer>
  `;
}

function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) {
    return;
  }

  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

function initMobileMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) {
    return;
  }

  const closeMenu = () => {
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    closeAllNavDropdowns();
  };

  toggle.addEventListener("click", () => {
    const willOpen = !document.body.classList.contains("nav-open");
    document.body.classList.toggle("nav-open", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) {
      closeMenu();
    }
  });
}

function initNavDropdowns() {
  const dropdowns = document.querySelectorAll(".nav-dropdown");
  if (!dropdowns.length) {
    return;
  }

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".nav-dropdown-toggle");
    if (!toggle) {
      return;
    }

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const willOpen = !dropdown.classList.contains("is-open");
      closeAllNavDropdowns(willOpen ? dropdown : null);
      dropdown.classList.toggle("is-open", willOpen);
      toggle.setAttribute("aria-expanded", String(willOpen));
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-dropdown")) {
      closeAllNavDropdowns();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllNavDropdowns();
    }
  });
}

function closeAllNavDropdowns(except = null) {
  document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
    const shouldStayOpen = except && dropdown === except;
    dropdown.classList.toggle("is-open", Boolean(shouldStayOpen));

    const toggle = dropdown.querySelector(".nav-dropdown-toggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(Boolean(shouldStayOpen)));
    }
  });
}

function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  items.forEach((item) => {
    if (item.dataset.delay) {
      item.style.setProperty("--delay", item.dataset.delay);
    }
    if (reducedMotion) {
      item.classList.add("is-visible");
    }
  });

  if (reducedMotion) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  items.forEach((item) => observer.observe(item));
}

function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!counters.length) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  counters.forEach((counter) => {
    const target = Number(counter.dataset.count);
    const decimals = Number(counter.dataset.decimals || 0);
    const prefix = counter.dataset.prefix || "";
    const suffix = counter.dataset.suffix || "";
    counter.textContent = `${prefix}${formatCounter(target, decimals)}${suffix}`;
  });

  if (reducedMotion) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.target.dataset.animated === "true") {
          return;
        }

        entry.target.dataset.animated = "true";
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((counter) => {
    counter.textContent = `${counter.dataset.prefix || ""}0${counter.dataset.suffix || ""}`;
    observer.observe(counter);
  });
}

function animateCounter(element) {
  const target = Number(element.dataset.count);
  const decimals = Number(element.dataset.decimals || 0);
  const prefix = element.dataset.prefix || "";
  const suffix = element.dataset.suffix || "";
  const duration = 1200;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    element.textContent = `${prefix}${formatCounter(value, decimals)}${suffix}`;

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  };

  window.requestAnimationFrame(tick);
}

function formatCounter(value, decimals) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals && Math.abs(value) < 100 ? decimals : 0,
    maximumFractionDigits: decimals
  });
}

function initFaq() {
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) {
    return;
  }

  items.forEach((item, index) => {
    const trigger = item.querySelector(".faq-trigger");
    if (!trigger) {
      return;
    }

    if (index === 0) {
      item.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    } else {
      trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      item.classList.toggle("is-open", !isOpen);
      trigger.setAttribute("aria-expanded", String(!isOpen));
    });
  });
}

function initBackgroundCanvas() {
  const canvas = document.querySelector("[data-background-canvas]");
  if (!canvas) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const intensityMap = { high: 46, medium: 28, low: 18 };
  const intensity = document.body.dataset.background || "medium";
  const particleCount = intensityMap[intensity] || intensityMap.medium;
  const intensityScale = intensity === "high" ? 1.1 : intensity === "low" ? 0.78 : 0.92;
  let particles = [];
  let width = 0;
  let height = 0;
  let devicePixelRatioSafe = 1;
  let animationFrame = 0;

  const random = (min, max) => Math.random() * (max - min) + min;

  function createParticle(initial = false) {
    const size = random(8, 34);
    return {
      x: random(-40, width + 40),
      y: initial ? random(-40, height + 20) : random(-height * 0.25, -size),
      width: size,
      height: size * random(0.65, 1.95),
      speed: random(0.3, 1.1) * intensityScale,
      drift: random(-0.28, 0.28) * intensityScale,
      rotation: random(0, Math.PI * 2),
      rotationSpeed: random(-0.011, 0.011),
      opacity: random(0.06, intensity === "high" ? 0.24 : 0.16)
    };
  }

  function resize() {
    devicePixelRatioSafe = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * devicePixelRatioSafe;
    canvas.height = height * devicePixelRatioSafe;
    context.setTransform(devicePixelRatioSafe, 0, 0, devicePixelRatioSafe, 0, 0);
    particles = Array.from({ length: particleCount }, () => createParticle(true));
  }

  function drawParticle(particle) {
    context.save();
    context.translate(particle.x, particle.y);
    context.rotate(particle.rotation);
    context.fillStyle = `rgba(255, 122, 26, ${particle.opacity})`;
    context.strokeStyle = `rgba(255, 186, 132, ${particle.opacity * 1.35})`;
    context.lineWidth = 1;
    context.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
    context.strokeRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
    context.restore();
  }

  function update() {
    context.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.y += particle.speed;
      particle.x += particle.drift;
      particle.rotation += particle.rotationSpeed;

      if (particle.y - particle.height > height + 40 || particle.x < -100 || particle.x > width + 100) {
        Object.assign(particle, createParticle(false));
      }

      drawParticle(particle);
    });

    animationFrame = window.requestAnimationFrame(update);
  }

  resize();
  update();

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pagehide", () => window.cancelAnimationFrame(animationFrame), { once: true });
}

function initPartnersPage() {
  const grid = document.querySelector("[data-streamer-grid]");
  if (!grid) {
    return;
  }

  const summary = document.querySelector("[data-live-summary]");
  const liveCount = document.querySelector("[data-live-count]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = partnerStreamers.map((streamer) => ({
    ...streamer,
    live: false,
    checked: false,
    preview: "",
    previewBroken: false
  }));

  renderPartnerCards(grid, state);
  updatePartnerSummary(state, summary, liveCount);

  state.forEach((streamer) => {
    const preview = new Image();
    const previewUrl = getTwitchPreviewUrl(streamer.channel);
    preview.decoding = "async";
    preview.loading = "lazy";
    preview.referrerPolicy = "no-referrer";
    preview.onload = () => {
      streamer.live = true;
      streamer.checked = true;
      streamer.preview = previewUrl;
      streamer.previewBroken = false;
      renderPartnerCards(grid, state);
      updatePartnerSummary(state, summary, liveCount);
    };
    preview.onerror = () => {
      streamer.live = false;
      streamer.checked = true;
      streamer.preview = "";
      streamer.previewBroken = false;
      renderPartnerCards(grid, state);
      updatePartnerSummary(state, summary, liveCount);
    };
    preview.src = previewUrl;
  });

  if (reducedMotion) {
    renderPartnerCards(grid, state);
  }
}

function renderPartnerCards(grid, state) {
  const ordered = [...state].sort((left, right) => Number(right.live) - Number(left.live));
  grid.innerHTML = ordered
    .map((streamer) => {
      const statusLabel = streamer.live ? "Live now" : streamer.checked ? "Offline right now" : "Checking live status";
      const cardClass = streamer.live ? "streamer-card is-live" : "streamer-card";
      const previewMarkup = streamer.live && streamer.preview && !streamer.previewBroken
        ? `<img class="streamer-preview-image" src="${streamer.preview}" alt="${streamer.name} live preview" loading="lazy" referrerpolicy="no-referrer" data-streamer-preview="${streamer.channel}">`
        : `<div class="streamer-preview-fallback">
             <span class="streamer-channel-tag">${streamer.channel}</span>
             <strong>${streamer.live ? "Live on Twitch" : streamer.role}</strong>
             <p>${streamer.live ? "Preview unavailable right now, but the channel is live and ready to watch." : streamer.focus}</p>
           </div>`;

      return `
        <article class="${cardClass}" data-streamer="${streamer.channel}">
          <div class="streamer-preview">
            ${previewMarkup}
            <span class="streamer-status">${statusLabel}</span>
          </div>
          <div class="streamer-body">
            <div class="pill-row">
              <span class="pill pill--soft">${streamer.role}</span>
              <span class="pill">@${streamer.channel}</span>
            </div>
            <h3>${streamer.name}</h3>
            <p>${streamer.focus}</p>
            <div class="button-row">
              <a class="button ${streamer.live ? "button--primary" : "button--secondary"}" href="https://twitch.tv/${streamer.channel}" target="_blank" rel="noopener noreferrer">${streamer.live ? "Watch Live" : "Visit Channel"}</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  attachPartnerPreviewFallbacks(grid, state);
}

function updatePartnerSummary(state, summary, liveCount) {
  if (!summary || !liveCount) {
    return;
  }

  const checked = state.filter((streamer) => streamer.checked).length;
  const live = state.filter((streamer) => streamer.live).length;
  liveCount.textContent = String(live);

  if (!checked) {
    summary.textContent = "Checking featured community channels now.";
    return;
  }

  if (live > 0) {
    summary.textContent = live === 1
      ? "One featured Voxelbox creator is live right now."
      : `${live} featured Voxelbox creators are live right now.`;
    return;
  }

  summary.textContent = "None of the featured channels are live right now, but you can still jump over and follow them.";
}

function getTwitchPreviewUrl(channel) {
  // Twitch exposes a live preview image for active channels, which gives us a lightweight live-status check.
  return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-640x360.jpg?cb=${Date.now()}`;
}

function attachPartnerPreviewFallbacks(grid, state) {
  grid.querySelectorAll("[data-streamer-preview]").forEach((image) => {
    image.addEventListener("error", () => {
      const streamer = state.find((entry) => entry.channel === image.dataset.streamerPreview);
      if (!streamer || streamer.previewBroken) {
        return;
      }

      streamer.previewBroken = true;
      renderPartnerCards(grid, state);
    }, { once: true });
  });
}

function initBuildLogPage() {
  const repoGrid = document.querySelector("[data-github-repos]");
  const eventList = document.querySelector("[data-github-events]");
  const status = document.querySelector("[data-github-status]");
  if (!repoGrid && !eventList) {
    return;
  }

  const headers = { Accept: "application/vnd.github+json" };
  Promise.all([
    fetch("https://api.github.com/users/voxel-box/repos?per_page=12&sort=updated", { headers }).then((res) => res.ok ? res.json() : []),
    fetch("https://api.github.com/users/voxel-box/events/public?per_page=12", { headers }).then((res) => res.ok ? res.json() : [])
  ])
    .then(([repos, events]) => {
      if (status) {
        status.textContent = "Live public GitHub activity loaded.";
      }
      renderGitHubRepos(repoGrid, Array.isArray(repos) ? repos : []);
      renderGitHubEvents(eventList, Array.isArray(events) ? events : []);
    })
    .catch(() => {
      if (status) {
        status.textContent = "GitHub activity is temporarily unavailable. The public profile link still works.";
      }
      renderGitHubRepos(repoGrid, []);
      renderGitHubEvents(eventList, []);
    });
}

function renderGitHubRepos(grid, repos) {
  if (!grid) {
    return;
  }
  const visible = repos.slice(0, 6);
  if (!visible.length) {
    grid.innerHTML = '<article class="card"><h3>GitHub profile</h3><p>Open the public VoxelBox GitHub profile for the current repository list.</p><div class="button-row"><a class="button button--secondary" href="https://github.com/voxel-box" target="_blank" rel="noopener noreferrer">Open GitHub</a></div></article>';
    return;
  }
  grid.innerHTML = visible
    .map((repo) => `
      <article class="card github-card">
        <span class="story-kicker">${escapeHtml(repo.language || "Repository")}</span>
        <h3>${escapeHtml(repo.name)}</h3>
        <p>${escapeHtml(repo.description || "Public VoxelBox repository.")}</p>
        <div class="github-meta">
          <span>Updated ${formatGitHubDate(repo.updated_at)}</span>
          ${repo.homepage ? `<span>${escapeHtml(repo.homepage.replace(/^https?:\/\//, ""))}</span>` : ""}
        </div>
        <div class="button-row">
          <a class="button button--secondary" href="${escapeAttribute(repo.html_url)}" target="_blank" rel="noopener noreferrer">View Repo</a>
        </div>
      </article>
    `)
    .join("");
}

function renderGitHubEvents(list, events) {
  if (!list) {
    return;
  }
  const visible = events.slice(0, 8);
  if (!visible.length) {
    list.innerHTML = '<div class="timeline-item"><div class="timeline-year">GitHub</div><div><h3>No recent public events loaded</h3><p>Use the GitHub profile button to see the live account.</p></div></div>';
    return;
  }
  list.innerHTML = visible
    .map((event) => {
      const repoName = event.repo?.name ? event.repo.name.split("/").pop() : "voxel-box";
      const summary = summarizeGitHubEvent(event, repoName);
      const repoUrl = event.repo?.name ? `https://github.com/${event.repo.name}` : GITHUB_URL;
      return `
        <div class="timeline-item">
          <div class="timeline-year">${escapeHtml(summary.kind)}</div>
          <div>
            <h3><a href="${escapeAttribute(repoUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(summary.title)}</a></h3>
            <p>${escapeHtml(summary.detail)}</p>
            <span class="muted">${formatGitHubDate(event.created_at)}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function summarizeGitHubEvent(event, repoName) {
  const type = event.type || "Event";
  if (type === "PushEvent") {
    const commits = event.payload?.commits || [];
    const detail = commits.slice(0, 3).map((commit) => commit.message?.split("\n")[0]).filter(Boolean).join("; ");
    return {
      kind: "Push",
      title: commits.length ? `Pushed ${commits.length} commit${commits.length === 1 ? "" : "s"} to ${repoName}` : `Pushed to ${repoName}`,
      detail: detail || "Repository update pushed."
    };
  }
  if (type === "CreateEvent") {
    return {
      kind: "Create",
      title: `Created ${event.payload?.ref_type || "item"} on ${repoName}`,
      detail: event.payload?.ref ? `Reference: ${event.payload.ref}` : "New public GitHub item created."
    };
  }
  if (type === "PullRequestEvent") {
    return {
      kind: "PR",
      title: `Pull request ${event.payload?.action || "activity"} on ${repoName}`,
      detail: event.payload?.pull_request?.title || "Pull request activity."
    };
  }
  return {
    kind: type.replace("Event", "") || "Event",
    title: `${type.replace("Event", "") || "Event"} on ${repoName}`,
    detail: "Public GitHub activity."
  };
}

function formatGitHubDate(value) {
  if (!value) {
    return "recently";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function setFooterYear() {
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });
}

function getExternalAttributes(link) {
  return link.external ? ' target="_blank" rel="noopener noreferrer"' : "";
}


