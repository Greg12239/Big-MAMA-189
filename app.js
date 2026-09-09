const loader = document.querySelector("[data-loader]");
const header = document.querySelector("[data-header]");
const progress = document.querySelector(".scroll-progress");
const revealItems = document.querySelectorAll(".reveal:not(#menu .menu-card)");
const parallaxItems = document.querySelectorAll("[data-parallax]");
const scrollMotionItems = document.querySelectorAll("[data-scroll-motion]");
const ingredients = document.querySelectorAll(".ingredient, .ingredient-photo");
const magneticItems = document.querySelectorAll(".magnetic");
const menuTitle = document.querySelector("[data-menu-title]");
const menuTabs = document.querySelectorAll("[data-menu-tab]");
const menuPanels = document.querySelectorAll("[data-menu-panel]");
const menuCategorySwitcher = document.querySelector(".menu-category-switcher");
const menuCategoryNavigation = document.querySelector(".menu-category-navigation");
const menuOrderRoot = document.querySelector(".menu-panels");
const burgerTab = document.querySelector('[data-menu-tab="burgers"]');
const burgerPopover = document.querySelector("#burgers-submenu");
const burgerOptions = document.querySelectorAll("[data-burger-subcategory]");
const burgerPanels = document.querySelectorAll("[data-burger-panel]");
const burgerCurrentLabel = document.querySelector("[data-burger-current-label]");
const menuStatus = document.querySelector("[data-menu-status]");
const locationMapElement = document.querySelector("[data-location-map]");
const locationMapCard = locationMapElement?.closest(".location-map-card");
const locationMapStatus = document.querySelector("[data-map-status]");
const locationMapFallback = document.querySelector("[data-map-fallback]");
let activeOrderChooser = null;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const menuTitleSwitchDuration = prefersReducedMotion ? 0 : 260;
const menuPanelSwitchDuration = prefersReducedMotion ? 0 : 380;
const menuPanelEntryDuration = prefersReducedMotion ? 0 : 680;
const burgerSubpanelSwitchDuration = prefersReducedMotion ? 0 : 380;
const burgerImageReadyTimeout = 900;
const menuRailTravelDuration = prefersReducedMotion ? 0 : 380;
const menuRailGestureThreshold = 10;
const menuRailMaximumVelocity = 2.5;
const menuRailInertiaFriction = 0.009;
const menuRailInertiaStopVelocity = 0.03;
const menuRailWheelSettleDelay = 110;
const loaderExitDelay = prefersReducedMotion ? 140 : 1500;
const loaderExitDuration = prefersReducedMotion ? 160 : 760;
const loaderFailSafeDelay = prefersReducedMotion ? 900 : 3600;
const menuTitleAssets = {
  generic: { src: "./assets/MENU-nav-transparent.png", width: 1120, height: 486 },
  beef: { src: "./assets/menu/beef-burgers-title.png", width: 1078, height: 772 },
  chicken: { src: "./assets/menu/chicken-burgers-title-transparent.png", width: 1218, height: 774 },
};
const menuTitlePreloads = new Map();
let loaderStartTimer = 0;
let loaderExitTimer = 0;
let loaderFailSafeTimer = 0;

if (loader) {
  document.body.classList.add("is-loading");
}

function preloadMenuTitle(source) {
  if (menuTitlePreloads.has(source)) return menuTitlePreloads.get(source);

  const image = new Image();
  const ready = new Promise((resolve) => {
    const finish = () => resolve();

    image.addEventListener(
      "load",
      () => {
        if (typeof image.decode === "function") {
          image.decode().catch(() => undefined).finally(finish);
        } else {
          finish();
        }
      },
      { once: true }
    );
    image.addEventListener("error", finish, { once: true });
    image.src = source;

    if (image.complete) {
      if (typeof image.decode === "function") {
        image.decode().catch(() => undefined).finally(finish);
      } else {
        finish();
      }
    }
  });

  menuTitlePreloads.set(source, ready);
  return ready;
}

function completeLoader() {
  window.clearTimeout(loaderStartTimer);
  window.clearTimeout(loaderExitTimer);
  window.clearTimeout(loaderFailSafeTimer);

  if (loader) loader.classList.add("is-hidden");
  document.body.classList.remove("is-loading");
  document.body.classList.add("is-loaded");
}

function finishLoader({ immediate = false } = {}) {
  if (!loader) {
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-loaded");
    return;
  }

  if (loader.classList.contains("is-hidden")) return;

  if (loader.classList.contains("is-exiting")) {
    if (immediate) completeLoader();
    return;
  }

  if (immediate) {
    completeLoader();
    return;
  }

  loader.classList.add("is-exiting");
  loaderExitTimer = window.setTimeout(completeLoader, loaderExitDuration);
}

if (loader) {
  loaderStartTimer = window.setTimeout(() => finishLoader(), loaderExitDelay);
  loaderFailSafeTimer = window.setTimeout(() => finishLoader({ immediate: true }), loaderFailSafeDelay);

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) finishLoader({ immediate: true });
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 45, 240)}ms`;
  revealObserver.observe(item);
});

function updateScrollUI() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progressWidth = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;

  progress.style.width = `${progressWidth}%`;
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
  if (!prefersReducedMotion) {
    parallaxItems.forEach((item) => {
      const depth = Number(item.dataset.parallax || 0);
      item.style.transform = `translate3d(0, ${window.scrollY * depth * -0.12}px, 0)`;
    });

    scrollMotionItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const viewportMiddle = window.innerHeight * 0.5;
      const elementMiddle = rect.top + rect.height * 0.5;
      const distance = viewportMiddle - elementMiddle;
      const range = window.innerHeight + rect.height;
      const progress = Math.max(-1, Math.min(1, distance / range));
      const x = Number(item.dataset.scrollX || 0) * progress;
      const y = Number(item.dataset.scrollY || 0) * progress;
      const rotate = Number(item.dataset.scrollRotate || 0) * progress;

      item.style.setProperty("--motion-x", `${x.toFixed(2)}px`);
      item.style.setProperty("--motion-y", `${y.toFixed(2)}px`);
      item.style.setProperty("--motion-rotate", `${rotate.toFixed(3)}deg`);
    });

    ingredients.forEach((item) => {
      const stage = item.closest("[data-ingredient-stage]");
      if (!stage) return;

      const rect = stage.getBoundingClientRect();
      const viewportMiddle = window.innerHeight * 0.5;
      const distance = viewportMiddle - rect.top;
      const depth = Number(item.dataset.depth || 0.1);
      const limited = Math.max(-80, Math.min(110, distance * depth));
      const rotate = Math.max(-7, Math.min(7, limited * 0.05));

      item.style.transform = `translate3d(0, ${limited}px, 0) rotate(${rotate}deg)`;
    });
  }
}

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;

    window.requestAnimationFrame(() => {
      updateScrollUI();
      ticking = false;
    });
    ticking = true;
  },
  { passive: true }
);

updateScrollUI();

function menuRailTargetFor(tab, anchor = 0.5) {
  if (!menuCategorySwitcher || !tab) return null;

  const maxScrollLeft = menuCategorySwitcher.scrollWidth - menuCategorySwitcher.clientWidth;
  if (maxScrollLeft <= 1) return null;

  const tabCentre = tab.offsetLeft + tab.offsetWidth / 2;
  const target = tabCentre - menuCategorySwitcher.clientWidth * anchor;
  return Math.max(0, Math.min(maxScrollLeft, target));
}

function cubicBezierEase(progress, x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1) {
  const coordinate = (value, first, second) => {
    const inverse = 1 - value;
    return 3 * inverse * inverse * value * first + 3 * inverse * value * value * second + value * value * value;
  };

  let lower = 0;
  let upper = 1;
  let parameter = progress;
  for (let iteration = 0; iteration < 7; iteration += 1) {
    parameter = (lower + upper) / 2;
    if (coordinate(parameter, x1, x2) < progress) lower = parameter;
    else upper = parameter;
  }

  return coordinate(parameter, y1, y2);
}

function setMenuCardsVisible(root, { immediate = false } = {}) {
  const activeBurgerPanel = root?.dataset.menuPanel === "burgers"
    ? root.querySelector(".burger-subpanel.is-active")
    : root;

  activeBurgerPanel?.querySelectorAll(".menu-card").forEach((card, index) => {
    card.style.transitionDelay = immediate || prefersReducedMotion ? "0ms" : `${Math.min(index * 50, 180)}ms`;
    card.classList.add("is-menu-visible");
  });
}

function resetMenuCards(root) {
  const activeBurgerPanel = root?.dataset.menuPanel === "burgers"
    ? root.querySelector(".burger-subpanel.is-active")
    : root;

  activeBurgerPanel?.querySelectorAll(".menu-card").forEach((card) => {
    card.classList.remove("is-menu-visible");
    card.style.removeProperty("transition-delay");
  });
}

function setOrderChooserState(chooser, isOpen) {
  const toggle = chooser?.querySelector("[data-order-toggle]");
  const options = chooser?.querySelector(".menu-card__delivery-options");
  const providerLinks = chooser?.querySelectorAll("[data-order-provider]");

  if (!chooser || !toggle || !options || !providerLinks) return;

  chooser.classList.toggle("is-order-open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
  options.setAttribute("aria-hidden", String(!isOpen));
  providerLinks.forEach((link) => {
    if (isOpen) link.removeAttribute("tabindex");
    else link.setAttribute("tabindex", "-1");
  });

  if (isOpen) activeOrderChooser = chooser;
  else if (activeOrderChooser === chooser) activeOrderChooser = null;
}

function closeActiveOrderChooser({ restoreFocus = false } = {}) {
  if (!activeOrderChooser) return;

  const toggle = activeOrderChooser.querySelector("[data-order-toggle]");
  setOrderChooserState(activeOrderChooser, false);
  if (restoreFocus) toggle?.focus();
}

function openOrderChooser(chooser) {
  if (activeOrderChooser && activeOrderChooser !== chooser) {
    closeActiveOrderChooser();
  }

  setOrderChooserState(chooser, true);
}

menuOrderRoot?.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const toggle = event.target.closest("[data-order-toggle]");
  if (toggle) {
    const chooser = toggle.closest("[data-order-chooser]");
    if (!chooser) return;

    if (activeOrderChooser === chooser) closeActiveOrderChooser();
    else openOrderChooser(chooser);
    return;
  }

  if (event.target.closest("[data-order-provider]")) {
    closeActiveOrderChooser();
  }
});

document.addEventListener("click", (event) => {
  if (!activeOrderChooser || activeOrderChooser.contains(event.target)) return;
  closeActiveOrderChooser();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !activeOrderChooser) return;

  event.preventDefault();
  closeActiveOrderChooser({ restoreFocus: true });
});

const productSnapGap = 18;
const productSnapDeadZone = 18;
const productTapMovementThreshold = 12;
let productSnapFrame = 0;
let productTapState = null;

function cancelProductSnap() {
  if (!productSnapFrame) return;
  window.cancelAnimationFrame(productSnapFrame);
  productSnapFrame = 0;
}

function isProductInteractiveTarget(target) {
  return target instanceof Element && Boolean(target.closest(
    "a, button, input, select, textarea, summary, [contenteditable='true'], [role='button'], [data-order-chooser]"
  ));
}

function headerAwareProductOffset() {
  const navigation = [header, document.querySelector(".mobile-primary-nav"), menuCategoryNavigation]
    .filter(Boolean)
    .map((element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const isFixed = style.position === "fixed";
      const isStickyAndPinned = style.position === "sticky" && rect.top <= 1;

      return (isFixed || isStickyAndPinned) && rect.bottom > 0 && rect.top < window.innerHeight
        ? rect.bottom
        : 0;
    });

  return Math.max(0, ...navigation) + productSnapGap;
}

function snapProductIntoView(card) {
  if (!card?.isConnected) return;

  const cardRect = card.getBoundingClientRect();
  const targetOffset = headerAwareProductOffset();
  const delta = cardRect.top - targetOffset;
  if (Math.abs(delta) <= productSnapDeadZone) return;

  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const target = Math.max(0, Math.min(maxScroll, window.scrollY + delta));
  if (Math.abs(target - window.scrollY) <= productSnapDeadZone) return;

  cancelProductSnap();
  if (prefersReducedMotion) {
    window.scrollTo({ top: target, behavior: "auto" });
    return;
  }

  const start = window.scrollY;
  const distance = Math.abs(target - start);
  const duration = Math.max(300, Math.min(480, 260 + distance * 0.12));
  const startedAt = performance.now();

  const tick = (now) => {
    const progressValue = Math.min(1, (now - startedAt) / duration);
    const position = start + (target - start) * cubicBezierEase(progressValue, 0.16, 1, 0.3, 1);
    window.scrollTo(0, position);

    if (progressValue < 1) {
      productSnapFrame = window.requestAnimationFrame(tick);
      return;
    }

    window.scrollTo(0, target);
    productSnapFrame = 0;
  };

  productSnapFrame = window.requestAnimationFrame(tick);
}

menuOrderRoot?.addEventListener("pointerdown", (event) => {
  if (event.isPrimary === false || (event.pointerType === "mouse" && event.button !== 0)) return;
  if (isProductInteractiveTarget(event.target)) return;

  const card = event.target instanceof Element ? event.target.closest(".menu-card") : null;
  if (!card) return;

  productTapState = {
    card,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
  };
});

menuOrderRoot?.addEventListener("pointermove", (event) => {
  const state = productTapState;
  if (!state || state.pointerId !== event.pointerId || state.moved) return;

  const distance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
  if (distance > productTapMovementThreshold) state.moved = true;
});

menuOrderRoot?.addEventListener("pointerup", (event) => {
  const state = productTapState;
  productTapState = null;
  if (!state || state.pointerId !== event.pointerId || state.moved || isProductInteractiveTarget(event.target)) return;

  const card = event.target instanceof Element ? event.target.closest(".menu-card") : null;
  if (card === state.card) snapProductIntoView(card);
});

menuOrderRoot?.addEventListener("pointercancel", () => {
  productTapState = null;
});

["wheel", "touchmove", "pointerdown"].forEach((eventName) => {
  window.addEventListener(eventName, cancelProductSnap, { passive: true });
});

class MenuCategoryController {
  constructor() {
    this.tabs = Array.from(menuTabs);
    this.panels = Array.from(menuPanels);
    this.burgerPanels = Array.from(burgerPanels);
    this.activeTop = this.tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.menuTab || "burgers";
    this.activeBurger = this.burgerPanels.find((panel) => panel.classList.contains("is-active"))?.dataset.burgerPanel || "beef";
    this.generation = 0;
    this.transition = null;
    this.topPreparation = null;
    this.pendingTop = null;
    this.burgerGeneration = 0;
    this.burgerTransition = null;
    this.burgerPreparation = null;
    this.pendingBurger = null;
    this.menuImageReadiness = new Map();
    this.menuEntered = false;
    this.menuEntranceObserver = null;
    this.railMotion = null;
    this.railState = {
      phase: "idle",
      frame: 0,
      wheelTimer: 0,
      pointerId: null,
      pointerType: "",
      pointerIntent: null,
      startX: 0,
      startY: 0,
      latestX: 0,
      latestY: 0,
      startScrollLeft: 0,
      lastScrollLeft: 0,
      lastSampleAt: 0,
      lastFrameAt: 0,
      velocity: 0,
      pendingWheelDelta: 0,
      maxScrollLeft: 0,
      snapTargets: [],
      railCategories: [],
      focusedCategory: null,
      selectedCategory: this.activeTop,
      targetCategory: null,
      targetScrollLeft: 0,
      generation: 0,
      suppressClick: false,
    };
    this.titleTimer = null;
    this.titleRequest = 0;
    this.burgerPopoverState = burgerPopover?.hidden ? "closed" : "open";
    this.burgerPopoverGeneration = 0;
    this.burgerPopoverTimer = 0;
    this.burgerPopoverFrame = 0;
    this.burgerPopoverCompletion = null;
  }

  init() {
    if (!this.tabs.length || !this.panels.length) return;

    this.updateTopTabs(this.activeTop);
    this.showPanel(this.activeTop, { revealCards: false });
    this.showBurgerPanel(this.activeBurger, { revealCards: false });
    this.observeMenuEntrance();
    this.updateBurgerOptions();
    this.setBurgerPopoverInteractivity(false);
    Object.values(menuTitleAssets).forEach((title) => preloadMenuTitle(title.src));
    this.updateTitle({ immediate: true });
    this.updateStatus();

    const alignInitialCategoryRail = () => {
      window.requestAnimationFrame(() => {
        this.refreshCategoryRailMetrics();
        this.moveCategoryRail(this.tabs.find((tab) => tab.dataset.menuTab === this.activeTop), "neutral", { immediate: true });
      });
    };
    alignInitialCategoryRail();
    window.addEventListener("load", alignInitialCategoryRail, { once: true });
    if (document.fonts?.ready) document.fonts.ready.then(alignInitialCategoryRail).catch(() => undefined);

    this.tabs.forEach((tab) => {
      tab.addEventListener("click", () => this.handleTabClick(tab));
      tab.addEventListener("keydown", (event) => this.handleTabKeydown(event, tab));
      ["pointerenter", "focusin", "pointerdown"].forEach((eventName) => {
        tab.addEventListener(eventName, () => this.prewarmTopCategory(tab.dataset.menuTab), { passive: true });
      });
    });

    burgerOptions.forEach((option) => {
      option.addEventListener("click", () => this.selectBurgerSubcategory(option.dataset.burgerSubcategory));
      option.addEventListener("keydown", (event) => this.handleBurgerOptionKeydown(event, option));
      ["pointerenter", "focusin", "pointerdown"].forEach((eventName) => {
        option.addEventListener(eventName, () => this.prewarmBurgerSubcategory(option.dataset.burgerSubcategory), { passive: true });
      });
    });

    burgerPopover?.addEventListener("transitionend", (event) => this.handleBurgerPopoverTransitionEnd(event));

    document.addEventListener("click", (event) => {
      if (!this.isBurgerPopoverVisible()) return;
      if (menuCategoryNavigation?.contains(event.target)) return;
      this.closeBurgerPopover();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !this.isBurgerPopoverVisible()) return;
      event.preventDefault();
      this.closeBurgerPopover({ restoreFocus: true });
    });

    menuCategorySwitcher?.addEventListener("scroll", () => this.handleCategoryRailScroll(), { passive: true });
    menuCategorySwitcher?.addEventListener("pointerdown", (event) => this.handleCategoryRailPointerDown(event));
    menuCategorySwitcher?.addEventListener("pointermove", (event) => this.handleCategoryRailPointerMove(event), { passive: false });
    menuCategorySwitcher?.addEventListener("pointerup", (event) => this.handleCategoryRailPointerEnd(event));
    menuCategorySwitcher?.addEventListener("pointercancel", (event) => this.cancelCategoryRailPointer(event));
    menuCategorySwitcher?.addEventListener("lostpointercapture", (event) => this.cancelCategoryRailPointer(event));
    menuCategorySwitcher?.addEventListener("click", (event) => this.handleCategoryRailClick(event), true);
    menuCategorySwitcher?.addEventListener("wheel", (event) => this.handleCategoryRailWheel(event), { passive: false });
    window.addEventListener("resize", () => {
      this.cancelCategoryRailMotion();
      this.refreshCategoryRailMetrics();
      if (this.burgerPopoverState === "opening" || this.burgerPopoverState === "open") this.positionBurgerPopover();
      this.closeWhenBurgerLeavesRail();
    });
  }

  handleTabClick(tab) {
    const key = tab.dataset.menuTab;
    if (!key) return;

    if (key === "burgers" && this.activeTop === "burgers") {
      this.toggleBurgerPopover();
      return;
    }

    this.selectTopCategory(key);
  }

  handleTabKeydown(event, tab) {
    const currentIndex = this.tabs.indexOf(tab);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % this.tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = this.tabs.length - 1;
    else if (event.key === "ArrowDown" && tab === burgerTab) {
      event.preventDefault();
      this.openBurgerPopover();
      Array.from(burgerOptions).find((option) => !option.hidden)?.focus({ preventScroll: true });
      return;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = this.tabs[nextIndex];
    nextTab.focus({ preventScroll: true });
    this.selectTopCategory(nextTab.dataset.menuTab);
  }

  handleBurgerOptionKeydown(event, option) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeBurgerPopover({ restoreFocus: true });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.selectBurgerSubcategory(option.dataset.burgerSubcategory);
      return;
    }

    const visibleOptions = Array.from(burgerOptions).filter((item) => !item.hidden);
    const index = visibleOptions.indexOf(option);
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      visibleOptions[(index + 1) % visibleOptions.length]?.focus({ preventScroll: true });
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      visibleOptions[(index - 1 + visibleOptions.length) % visibleOptions.length]?.focus({ preventScroll: true });
    }
  }

  measurePanelHeight(panel) {
    const wasHidden = panel.hidden;
    panel.hidden = false;
    panel.classList.add("is-menu-measuring");
    const height = Math.ceil(panel.getBoundingClientRect().height);
    panel.classList.remove("is-menu-measuring");
    panel.hidden = wasHidden;
    return height;
  }

  measureBurgerPanelHeight(panel) {
    const wasHidden = panel.hidden;
    panel.hidden = false;
    panel.classList.add("is-burger-subpanel-measuring");
    const height = Math.ceil(panel.getBoundingClientRect().height);
    panel.classList.remove("is-burger-subpanel-measuring");
    panel.hidden = wasHidden;
    return height;
  }

  observeMenuEntrance() {
    const menu = menuOrderRoot?.closest("#menu");
    if (!menu) return;

    const reveal = () => {
      if (this.menuEntered) return;
      this.menuEntered = true;
      this.menuEntranceObserver?.disconnect();
      this.menuEntranceObserver = null;
      const activePanel = this.panels.find((panel) => panel.dataset.menuPanel === this.activeTop);
      this.waitForPanelImages(activePanel).finally(() => {
        if (!this.transition && activePanel?.dataset.menuPanel === this.activeTop) setMenuCardsVisible(activePanel, { immediate: prefersReducedMotion });
      });
    };

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      reveal();
      return;
    }

    this.menuEntranceObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) reveal();
    }, { threshold: 0.16 });
    this.menuEntranceObserver.observe(menu);
  }

  imagesForPanel(panel) {
    if (!panel) return [];
    const activeBurgerPanel = panel.dataset.menuPanel === "burgers"
      ? panel.querySelector(".burger-subpanel.is-active")
      : panel;
    return Array.from(activeBurgerPanel?.querySelectorAll("img.product-image") || []);
  }

  getMenuImageReadiness(image, { prewarm = false } = {}) {
    if (prewarm && image.loading === "lazy") image.loading = "eager";
    if (this.menuImageReadiness.has(image)) return this.menuImageReadiness.get(image);

    const readiness = new Promise((resolve) => {
      let settled = false;
      let timer = 0;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        image.removeEventListener("load", handleLoad);
        image.removeEventListener("error", finish);
        resolve();
      };
      const decode = () => {
        if (typeof image.decode === "function") image.decode().catch(() => undefined).finally(finish);
        else finish();
      };
      const handleLoad = () => decode();

      image.addEventListener("load", handleLoad, { once: true });
      image.addEventListener("error", finish, { once: true });
      timer = window.setTimeout(finish, burgerImageReadyTimeout);

      if (image.complete) {
        if (image.naturalWidth > 0) decode();
        else finish();
      }
    });

    this.menuImageReadiness.set(image, readiness);
    return readiness;
  }

  waitForPanelImages(panel, { prewarm = false } = {}) {
    return Promise.all(this.imagesForPanel(panel).map((image) => this.getMenuImageReadiness(image, { prewarm })));
  }

  prewarmTopCategory(key) {
    const panel = this.panels.find((item) => item.dataset.menuPanel === key);
    if (panel) this.waitForPanelImages(panel, { prewarm: true });
  }

  prewarmBurgerSubcategory(key) {
    const panel = this.burgerPanels.find((item) => item.dataset.burgerPanel === key);
    if (panel) this.waitForPanelImages(panel, { prewarm: true });
  }

  ensureBurgerCardsVisible(panel, { immediate = false } = {}) {
    setMenuCardsVisible(panel, { immediate });
  }

  clearBurgerPanelStates(panel) {
    panel?.classList.remove(
      "is-burger-subpanel-measuring",
      "is-burger-subpanel-transitioning",
      "is-burger-subpanel-entering",
      "is-burger-subpanel-entering-active",
      "is-burger-subpanel-leaving"
    );
  }

  clearTransitionListeners(transaction) {
    if (!transaction) return;
    window.clearTimeout(transaction.timer);
    window.cancelAnimationFrame(transaction.frame);
    transaction.nextPanel?.removeEventListener("transitionend", transaction.onPanelEnd);
    transaction.lastCard?.removeEventListener("transitionend", transaction.onCardEnd);
  }

  completeBurgerTransition(transaction) {
    if (this.burgerTransition !== transaction || transaction.generation !== this.burgerGeneration) return;

    this.clearTransitionListeners(transaction);
    const { currentPanel, nextPanel, host } = transaction;
    currentPanel.hidden = true;
    currentPanel.classList.remove("is-active");
    this.clearBurgerPanelStates(currentPanel);
    this.clearBurgerPanelStates(nextPanel);
    nextPanel.hidden = false;
    nextPanel.classList.add("is-active");
    this.ensureBurgerCardsVisible(nextPanel, { immediate: true });
    host.style.removeProperty("height");
    this.burgerTransition = null;
    this.processQueuedMenuRequest();
  }

  transitionBurgerSubpanels({ currentPanel, nextPanel, host, generation }) {
    if (!nextPanel || !host) return;

    if (prefersReducedMotion || !currentPanel || currentPanel === nextPanel) {
      if (currentPanel && currentPanel !== nextPanel) {
        currentPanel.hidden = true;
        currentPanel.classList.remove("is-active");
        this.clearBurgerPanelStates(currentPanel);
      }
      nextPanel.hidden = false;
      nextPanel.classList.add("is-active");
      this.clearBurgerPanelStates(nextPanel);
      this.ensureBurgerCardsVisible(nextPanel, { immediate: true });
      this.processQueuedMenuRequest();
      return;
    }

    const currentHeight = Math.ceil(currentPanel.getBoundingClientRect().height);
    const incomingHeight = this.measureBurgerPanelHeight(nextPanel);
    const transaction = {
      currentPanel,
      nextPanel,
      host,
      generation,
      incomingHeight,
      frame: 0,
      timer: 0,
      panelDone: false,
      cardsDone: false,
      lastCard: null,
      onPanelEnd: null,
      onCardEnd: null,
    };

    this.burgerTransition = transaction;
    host.style.height = `${Math.max(1, currentHeight)}px`;
    nextPanel.hidden = false;
    nextPanel.classList.add("is-active", "is-burger-subpanel-transitioning", "is-burger-subpanel-entering");
    resetMenuCards(nextPanel);
    currentPanel.classList.add("is-burger-subpanel-transitioning", "is-burger-subpanel-leaving");

    const settleIfReady = () => {
      if (transaction.panelDone && transaction.cardsDone) this.completeBurgerTransition(transaction);
    };
    transaction.lastCard = this.imagesForPanel(nextPanel).length ? Array.from(nextPanel.querySelectorAll(".menu-card")).at(-1) : null;
    transaction.cardsDone = !transaction.lastCard;
    transaction.onPanelEnd = (event) => {
      if (this.burgerTransition !== transaction || event.target !== nextPanel || event.propertyName !== "opacity") return;
      transaction.panelDone = true;
      settleIfReady();
    };
    transaction.onCardEnd = (event) => {
      if (this.burgerTransition !== transaction || event.target !== transaction.lastCard || event.propertyName !== "transform") return;
      transaction.cardsDone = true;
      settleIfReady();
    };
    nextPanel.addEventListener("transitionend", transaction.onPanelEnd);
    transaction.lastCard?.addEventListener("transitionend", transaction.onCardEnd);

    transaction.frame = window.requestAnimationFrame(() => {
      if (this.burgerTransition !== transaction || generation !== this.burgerGeneration) return;
      nextPanel.classList.add("is-burger-subpanel-entering-active");
      this.ensureBurgerCardsVisible(nextPanel);
      transaction.timer = window.setTimeout(() => this.completeBurgerTransition(transaction), menuPanelEntryDuration);
    });
  }

  refreshCategoryRailMetrics() {
    if (!menuCategorySwitcher) return;

    const state = this.railState;
    state.maxScrollLeft = Math.max(0, menuCategorySwitcher.scrollWidth - menuCategorySwitcher.clientWidth);
    const railCentre = menuCategorySwitcher.clientWidth * 0.5;
    state.railCategories = this.tabs.map((tab) => {
      const centre = tab.offsetLeft + tab.offsetWidth * 0.5;
      return {
        key: tab.dataset.menuTab,
        tab,
        centre,
        target: this.clampCategoryRailScroll(centre - railCentre),
      };
    });
    state.snapTargets = state.railCategories.map((category) => category.target);
  }

  getNearestRailCategory(scrollLeft = menuCategorySwitcher?.scrollLeft || 0) {
    const categories = this.railState.railCategories;
    if (!categories.length || !menuCategorySwitcher) return null;

    const railCentre = scrollLeft + menuCategorySwitcher.clientWidth * 0.5;
    return categories.reduce((nearest, category) => (
      Math.abs(category.centre - railCentre) < Math.abs(nearest.centre - railCentre) ? category : nearest
    ));
  }

  setRailFocusedCategory(category) {
    const state = this.railState;
    const key = category?.key || null;
    if (state.focusedCategory === key) return;

    state.focusedCategory = key;
    this.tabs.forEach((tab) => {
      tab.classList.toggle("is-scroll-focused", tab.dataset.menuTab === key && key !== this.activeTop);
    });
  }

  updateRailFocusedCategory(scrollLeft = menuCategorySwitcher?.scrollLeft || 0) {
    const category = this.getNearestRailCategory(scrollLeft);
    this.setRailFocusedCategory(category);
    return category;
  }

  clearRailFocusedCategory() {
    this.railState.focusedCategory = null;
    this.tabs.forEach((tab) => tab.classList.remove("is-scroll-focused"));
  }

  clampCategoryRailScroll(value) {
    return Math.max(0, Math.min(this.railState.maxScrollLeft, value));
  }

  writeCategoryRailScroll(value) {
    if (!menuCategorySwitcher) return 0;

    const next = this.clampCategoryRailScroll(value);
    menuCategorySwitcher.scrollLeft = next;
    return next;
  }

  hasCategoryRailOverflow() {
    this.refreshCategoryRailMetrics();
    return this.railState.maxScrollLeft > 1;
  }

  releaseCategoryRailPointer() {
    const state = this.railState;
    const pointerId = state.pointerId;
    const pointerType = state.pointerType;
    state.pointerId = null;
    state.pointerType = "";
    state.pointerIntent = null;
    if (pointerType !== "touch" && pointerId !== null && menuCategorySwitcher?.hasPointerCapture?.(pointerId)) {
      menuCategorySwitcher.releasePointerCapture(pointerId);
    }
  }

  clearCategoryRailFrame() {
    const state = this.railState;
    if (state.frame) window.cancelAnimationFrame(state.frame);
    state.frame = 0;
    this.railMotion = null;
  }

  finishCategoryRailMotion({ preserveClickSuppression = false } = {}) {
    const state = this.railState;
    this.clearCategoryRailFrame();
    window.clearTimeout(state.wheelTimer);
    state.wheelTimer = 0;
    state.phase = "idle";
    state.velocity = 0;
    state.pendingWheelDelta = 0;
    state.lastFrameAt = 0;
    state.targetCategory = null;
    state.targetScrollLeft = 0;
    this.releaseCategoryRailPointer();
    this.clearRailFocusedCategory();
    menuCategorySwitcher?.classList.remove("is-rail-dragging");

    if (!preserveClickSuppression) {
      state.suppressClick = false;
    }
  }

  cancelCategoryRailMotion({ preserveClickSuppression = false } = {}) {
    this.railState.generation += 1;
    this.finishCategoryRailMotion({ preserveClickSuppression });
  }

  scheduleCategoryRailFrame(callback) {
    const state = this.railState;
    if (state.frame) return;

    const motion = { frame: 0 };
    this.railMotion = motion;
    state.frame = window.requestAnimationFrame((timestamp) => {
      state.frame = 0;
      motion.frame = 0;
      if (this.railMotion !== motion) return;
      callback(timestamp);
    });
    motion.frame = state.frame;
  }

  sampleCategoryRailVelocity(nextScrollLeft, timestamp) {
    const state = this.railState;
    const elapsed = Math.max(1, timestamp - state.lastSampleAt);
    const sample = (nextScrollLeft - state.lastScrollLeft) / elapsed;
    state.velocity = Math.max(
      -menuRailMaximumVelocity,
      Math.min(menuRailMaximumVelocity, state.velocity * 0.66 + sample * 0.34)
    );
    state.lastScrollLeft = nextScrollLeft;
    state.lastSampleAt = timestamp;
  }

  beginCategoryRailDrag(event) {
    const state = this.railState;
    state.phase = "dragging";
    state.pointerIntent = "horizontal";
    state.lastScrollLeft = menuCategorySwitcher?.scrollLeft || 0;
    state.lastSampleAt = performance.now();
    state.velocity = 0;
    menuCategorySwitcher?.classList.add("is-rail-dragging");
    this.closeBurgerPopover();

    if (event.pointerType !== "touch" && menuCategorySwitcher?.setPointerCapture) {
      try {
        menuCategorySwitcher.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is an enhancement; direct rail tracking remains valid without it.
      }
    }
  }

  handleCategoryRailPointerDown(event) {
    if (!this.hasCategoryRailOverflow()) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.isPrimary === false) return;

    this.cancelCategoryRailMotion();
    const state = this.railState;
    state.phase = "pending";
    state.pointerId = event.pointerId;
    state.pointerType = event.pointerType || "";
    state.pointerIntent = null;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.latestX = event.clientX;
    state.latestY = event.clientY;
    state.startScrollLeft = menuCategorySwitcher?.scrollLeft || 0;
    state.lastScrollLeft = state.startScrollLeft;
    state.lastSampleAt = performance.now();
    state.velocity = 0;
  }

  handleCategoryRailPointerMove(event) {
    const state = this.railState;
    if (event.pointerId !== state.pointerId || !menuCategorySwitcher) return;
    state.latestX = event.clientX;
    state.latestY = event.clientY;
    if (state.pointerIntent === "vertical") return;

    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    if (state.phase !== "dragging") {
      if (Math.max(horizontalDistance, verticalDistance) < menuRailGestureThreshold) return;
      if (horizontalDistance <= verticalDistance * 1.15) {
        state.pointerIntent = "vertical";
        return;
      }
      this.beginCategoryRailDrag(event);
    }

    event.preventDefault();
    const next = this.writeCategoryRailScroll(state.startScrollLeft - deltaX);
    this.sampleCategoryRailVelocity(next, performance.now());
    this.updateRailFocusedCategory(next);
  }

  settleCategoryRailAfterInput() {
    const state = this.railState;
    if (prefersReducedMotion || Math.abs(state.velocity) < menuRailInertiaStopVelocity) {
      this.startCategoryRailSnap({ immediate: prefersReducedMotion });
      return;
    }
    this.startCategoryRailInertia();
  }

  handleCategoryRailPointerEnd(event) {
    const state = this.railState;
    if (event.pointerId !== state.pointerId) return;

    if (state.phase === "dragging") {
      event.preventDefault();
      state.suppressClick = true;
      this.releaseCategoryRailPointer();
      this.settleCategoryRailAfterInput();
      return;
    }

    this.releaseCategoryRailPointer();
    this.finishCategoryRailMotion();
  }

  cancelCategoryRailPointer(event) {
    const state = this.railState;
    if (event.pointerId !== state.pointerId) return;
    if (event.type === "lostpointercapture" && state.pointerType === "touch") return;

    const wasDragging = state.phase === "dragging";
    this.releaseCategoryRailPointer();
    if (wasDragging) {
      this.startCategoryRailSnap({ immediate: prefersReducedMotion });
      return;
    }
    this.finishCategoryRailMotion();
  }

  handleCategoryRailClick(event) {
    const state = this.railState;
    if (!state.suppressClick || !(event.target instanceof Element) || !event.target.closest(".menu-category-tab")) return;

    event.preventDefault();
    event.stopPropagation();
    state.suppressClick = false;
  }

  normaliseCategoryRailWheel(event) {
    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? Math.max(1, menuCategorySwitcher?.clientWidth || 1)
        : 1;
    const deltaX = event.deltaX * unit;
    const deltaY = event.deltaY * unit;

    if (event.shiftKey && Math.abs(deltaY) > 0) return deltaY;
    if (Math.abs(deltaX) > Math.abs(deltaY) * 0.5) return deltaX;
    return 0;
  }

  handleCategoryRailWheel(event) {
    if (event.ctrlKey || !this.hasCategoryRailOverflow() || !menuCategorySwitcher) return;

    const delta = this.normaliseCategoryRailWheel(event);
    if (Math.abs(delta) < 0.5) return;

    const current = menuCategorySwitcher.scrollLeft;
    const next = this.clampCategoryRailScroll(current + delta);
    if (Math.abs(next - current) < 0.5) return;

    const state = this.railState;
    if (state.phase !== "wheel-input") {
      this.cancelCategoryRailMotion();
      state.lastScrollLeft = current;
      state.lastSampleAt = performance.now();
      state.velocity = 0;
    }

    event.preventDefault();
    const now = performance.now();
    state.phase = "wheel-input";
    state.pendingWheelDelta += delta;
    const elapsed = Math.max(16, now - state.lastSampleAt);
    const sample = (delta / elapsed) * 0.18;
    state.velocity = Math.max(
      -menuRailMaximumVelocity,
      Math.min(menuRailMaximumVelocity, state.velocity * 0.58 + sample * 0.42)
    );
    state.lastScrollLeft = current;
    state.lastSampleAt = now;
    this.closeBurgerPopover();

    const transaction = state.generation;
    this.scheduleCategoryRailFrame(() => {
      if (state.phase !== "wheel-input" || transaction !== state.generation) return;
      const pending = state.pendingWheelDelta;
      state.pendingWheelDelta = 0;
      const nextScrollLeft = this.writeCategoryRailScroll(menuCategorySwitcher.scrollLeft + pending);
      this.updateRailFocusedCategory(nextScrollLeft);
    });

    window.clearTimeout(state.wheelTimer);
    state.wheelTimer = window.setTimeout(() => {
      state.wheelTimer = 0;
      if (state.phase === "wheel-input" && transaction === state.generation) this.settleCategoryRailAfterInput();
    }, menuRailWheelSettleDelay);
  }

  startCategoryRailInertia() {
    const state = this.railState;
    if (!menuCategorySwitcher || prefersReducedMotion) {
      this.startCategoryRailSnap({ immediate: true });
      return;
    }

    state.phase = "inertia";
    state.lastFrameAt = 0;
    const transaction = state.generation;
    const tick = (timestamp) => {
      if (state.phase !== "inertia" || transaction !== state.generation || !menuCategorySwitcher) return;
      if (!state.lastFrameAt) state.lastFrameAt = timestamp;
      const elapsed = Math.min(48, Math.max(1, timestamp - state.lastFrameAt));
      state.lastFrameAt = timestamp;
      state.velocity *= Math.exp(-menuRailInertiaFriction * elapsed);

      const current = menuCategorySwitcher.scrollLeft;
      const next = this.writeCategoryRailScroll(current + state.velocity * elapsed);
      this.updateRailFocusedCategory(next);
      const hitEdge = (next <= 0 && state.velocity < 0) || (next >= state.maxScrollLeft && state.velocity > 0);
      if (hitEdge || Math.abs(state.velocity) < menuRailInertiaStopVelocity) {
        state.velocity = 0;
        this.startCategoryRailSnap();
        return;
      }

      this.scheduleCategoryRailFrame(tick);
    };

    this.scheduleCategoryRailFrame(tick);
  }

  nearestCategoryRailSnapTarget() {
    return this.getNearestRailCategory()?.target ?? (menuCategorySwitcher?.scrollLeft || 0);
  }

  commitRailCategorySelection(key, transaction) {
    const state = this.railState;
    if (transaction !== state.generation || state.targetCategory !== key) return;

    if (key !== this.activeTop) this.selectTopCategory(key, { railAlreadyAligned: true, railTransaction: transaction });
  }

  startCategoryRailSnap({ immediate = false } = {}) {
    if (!menuCategorySwitcher || !this.hasCategoryRailOverflow()) {
      this.finishCategoryRailMotion();
      return;
    }

    const state = this.railState;
    const start = menuCategorySwitcher.scrollLeft;
    const targetCategory = this.getNearestRailCategory(start);
    if (!targetCategory) {
      this.finishCategoryRailMotion();
      return;
    }
    const target = targetCategory.target;
    const transaction = state.generation;
    state.targetCategory = targetCategory.key;
    state.targetScrollLeft = target;
    const distance = Math.abs(target - start);
    if (immediate || prefersReducedMotion || distance <= 1) {
      this.writeCategoryRailScroll(target);
      this.setRailFocusedCategory(targetCategory);
      this.commitRailCategorySelection(targetCategory.key, transaction);
      this.finishCategoryRailMotion();
      return;
    }

    state.phase = "snapping";
    state.velocity = 0;
    state.lastFrameAt = 0;
    const duration = Math.max(220, Math.min(420, 180 + distance * 0.55));
    const tick = (timestamp) => {
      if (state.phase !== "snapping" || transaction !== state.generation) return;
      if (!state.lastFrameAt) state.lastFrameAt = timestamp;
      const progress = Math.min(1, (timestamp - state.lastFrameAt) / duration);
      const nextScrollLeft = this.writeCategoryRailScroll(start + (target - start) * cubicBezierEase(progress));
      this.updateRailFocusedCategory(nextScrollLeft);
      if (progress >= 1) {
        this.writeCategoryRailScroll(target);
        this.setRailFocusedCategory(targetCategory);
        this.commitRailCategorySelection(targetCategory.key, transaction);
        this.finishCategoryRailMotion();
        return;
      }
      this.scheduleCategoryRailFrame(tick);
    };

    this.scheduleCategoryRailFrame(tick);
  }

  moveCategoryRail(tab, direction = "neutral", { immediate = false } = {}) {
    const anchors = { forward: 0.44, backward: 0.56, neutral: 0.5 };
    const target = menuRailTargetFor(tab, anchors[direction] ?? anchors.neutral);
    if (target === null || !menuCategorySwitcher) return;

    this.refreshCategoryRailMetrics();
    this.cancelCategoryRailMotion();
    const state = this.railState;
    const transaction = state.generation;
    const start = menuCategorySwitcher.scrollLeft;
    if (immediate || prefersReducedMotion || Math.abs(target - start) <= 1) {
      this.writeCategoryRailScroll(target);
      return;
    }

    state.phase = "programmatic";
    state.lastFrameAt = 0;
    const tick = (timestamp) => {
      if (state.phase !== "programmatic" || transaction !== state.generation) return;
      if (!state.lastFrameAt) state.lastFrameAt = timestamp;
      const progress = Math.min(1, (timestamp - state.lastFrameAt) / menuRailTravelDuration);
      this.writeCategoryRailScroll(start + (target - start) * cubicBezierEase(progress));
      if (progress >= 1) {
        this.writeCategoryRailScroll(target);
        this.finishCategoryRailMotion();
        return;
      }
      this.scheduleCategoryRailFrame(tick);
    };

    this.scheduleCategoryRailFrame(tick);
  }

  handleCategoryRailScroll() {
    if (this.railState.phase === "idle") this.closeWhenBurgerLeavesRail();
  }

  clearTopPanelStates(panel) {
    panel?.classList.remove("is-leaving", "is-entering", "is-menu-leaving", "is-menu-transitioning", "is-menu-entering", "is-menu-entering-active");
  }

  completeTopTransition(transaction) {
    if (this.transition !== transaction || transaction.generation !== this.generation) return;

    this.clearTransitionListeners(transaction);
    const { currentPanel, nextPanel, host } = transaction;
    currentPanel.hidden = true;
    currentPanel.classList.remove("is-active");
    this.clearTopPanelStates(currentPanel);
    this.clearTopPanelStates(nextPanel);
    nextPanel.hidden = false;
    nextPanel.classList.add("is-active");
    host.style.removeProperty("height");
    host.classList.remove("is-menu-transitioning");
    this.transition = null;
    this.processQueuedMenuRequest();
  }

  transitionPanels({ kind, currentPanel, nextPanel, host, generation }) {
    if (!nextPanel || !host) return;

    if (prefersReducedMotion || !currentPanel || currentPanel === nextPanel) {
      if (currentPanel && currentPanel !== nextPanel) {
        currentPanel.hidden = true;
        currentPanel.classList.remove("is-active");
      }
      nextPanel.hidden = false;
      nextPanel.classList.add("is-active");
      setMenuCardsVisible(nextPanel, { immediate: true });
      this.processQueuedMenuRequest();
      return;
    }

    const currentHeight = Math.ceil(currentPanel.getBoundingClientRect().height);
    const incomingHeight = this.measurePanelHeight(nextPanel);
    const transaction = {
      kind,
      currentPanel,
      nextPanel,
      host,
      generation,
      incomingHeight,
      frame: 0,
      timer: 0,
      panelDone: false,
      cardsDone: false,
      lastCard: null,
      onPanelEnd: null,
      onCardEnd: null,
    };

    this.transition = transaction;
    host.style.height = `${Math.max(1, currentHeight)}px`;
    host.classList.add("is-menu-transitioning");

    nextPanel.hidden = false;
    nextPanel.classList.add("is-active", "is-menu-transitioning", "is-menu-entering");
    resetMenuCards(nextPanel);
    currentPanel.classList.add("is-menu-leaving", "is-menu-transitioning");

    const settleIfReady = () => {
      if (transaction.panelDone && transaction.cardsDone) this.completeTopTransition(transaction);
    };
    const visibleCardRoot = nextPanel.dataset.menuPanel === "burgers"
      ? nextPanel.querySelector(".burger-subpanel.is-active")
      : nextPanel;
    transaction.lastCard = Array.from(visibleCardRoot?.querySelectorAll(".menu-card") || []).at(-1) || null;
    transaction.cardsDone = !transaction.lastCard;
    transaction.onPanelEnd = (event) => {
      if (this.transition !== transaction || event.target !== nextPanel || event.propertyName !== "opacity") return;
      transaction.panelDone = true;
      settleIfReady();
    };
    transaction.onCardEnd = (event) => {
      if (this.transition !== transaction || event.target !== transaction.lastCard || event.propertyName !== "transform") return;
      transaction.cardsDone = true;
      settleIfReady();
    };
    nextPanel.addEventListener("transitionend", transaction.onPanelEnd);
    transaction.lastCard?.addEventListener("transitionend", transaction.onCardEnd);

    transaction.frame = window.requestAnimationFrame(() => {
      if (this.transition !== transaction || generation !== this.generation) return;
      nextPanel.classList.add("is-menu-entering-active");
      setMenuCardsVisible(nextPanel);
      transaction.timer = window.setTimeout(() => this.completeTopTransition(transaction), menuPanelEntryDuration);
    });
  }

  selectTopCategory(key, { railAlreadyAligned = false, railTransaction = null } = {}) {
    const nextPanel = this.panels.find((panel) => panel.dataset.menuPanel === key);
    if (!nextPanel) return;

    if (this.transition || this.topPreparation || this.burgerTransition || this.burgerPreparation) {
      this.pendingTop = key;
      return;
    }
    if (key === this.activeTop) return;

    const request = ++this.generation;
    this.topPreparation = { key, request, railAlreadyAligned, railTransaction };
    this.waitForPanelImages(nextPanel, { prewarm: true }).finally(() => {
      if (!this.topPreparation || this.topPreparation.request !== request) return;
      if (railTransaction !== null && railTransaction !== this.railState.generation) {
        this.topPreparation = null;
        return;
      }
      this.topPreparation = null;
      if (this.pendingTop && this.pendingTop !== key) {
        const latest = this.pendingTop;
        this.pendingTop = null;
        this.selectTopCategory(latest);
        return;
      }
      if (this.transition || this.burgerTransition || key === this.activeTop) {
        if (key !== this.activeTop) this.pendingTop = key;
        this.processQueuedMenuRequest();
        return;
      }
      this.startTopCategoryTransition(key, nextPanel, request, { railAlreadyAligned });
    });
  }

  startTopCategoryTransition(key, nextPanel, generation, { railAlreadyAligned = false } = {}) {

    const currentPanel = this.panels.find((panel) => panel.dataset.menuPanel === this.activeTop);
    const previousIndex = this.tabs.findIndex((tab) => tab.dataset.menuTab === this.activeTop);
    const nextIndex = this.tabs.findIndex((tab) => tab.dataset.menuTab === key);
    const railDirection = nextIndex > previousIndex ? "forward" : nextIndex < previousIndex ? "backward" : "neutral";

    closeActiveOrderChooser();
    this.closeBurgerPopover();
    this.activeTop = key;
    this.updateTopTabs(key);
    this.updateTitle();
    this.updateStatus();

    if (!railAlreadyAligned) this.moveCategoryRail(this.tabs[nextIndex], railDirection);
    this.transitionPanels({
      kind: "top",
      currentPanel,
      nextPanel,
      host: menuOrderRoot,
      generation,
    });
  }

  selectBurgerSubcategory(key) {
    const nextPanel = this.burgerPanels.find((panel) => panel.dataset.burgerPanel === key);
    if (!nextPanel) {
      this.closeBurgerPopover();
      return;
    }

    if (this.activeTop !== "burgers" || this.transition || this.topPreparation || this.burgerTransition || this.burgerPreparation) {
      this.pendingBurger = key;
      return;
    }
    if (key === this.activeBurger) {
      this.closeBurgerPopover();
      return;
    }

    const burgerHost = this.panels.find((panel) => panel.dataset.menuPanel === "burgers");

    closeActiveOrderChooser();
    this.closeBurgerPopover({ restoreFocus: true });

    const generation = ++this.burgerGeneration;
    this.burgerPreparation = { key, generation };
    this.waitForPanelImages(nextPanel, { prewarm: true }).finally(() => {
      if (!this.burgerPreparation || this.burgerPreparation.generation !== generation) return;
      this.burgerPreparation = null;
      if (this.pendingBurger && this.pendingBurger !== key) {
        const latest = this.pendingBurger;
        this.pendingBurger = null;
        this.selectBurgerSubcategory(latest);
        return;
      }
      if (this.transition || this.activeTop !== "burgers" || key === this.activeBurger) {
        if (key !== this.activeBurger) this.pendingBurger = key;
        this.processQueuedMenuRequest();
        return;
      }

      const currentPanel = this.burgerPanels.find((panel) => panel.dataset.burgerPanel === this.activeBurger);
      if (!currentPanel || currentPanel === nextPanel) return;

      this.activeBurger = key;
      this.updateBurgerOptions();
      this.updateTitle();
      this.updateStatus();
      this.transitionBurgerSubpanels({
        currentPanel,
        nextPanel,
        host: burgerHost,
        generation,
      });
    });
  }

  showPanel(key, { immediate = false } = {}) {
    this.panels.forEach((panel) => {
      const isActive = panel.dataset.menuPanel === key;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
      panel.classList.remove("is-leaving", "is-entering", "is-menu-leaving", "is-menu-transitioning", "is-menu-entering", "is-menu-entering-active");
      if (isActive && immediate) setMenuCardsVisible(panel, { immediate: true });
      else if (isActive) resetMenuCards(panel);
    });
  }

  showBurgerPanel(key, { immediate = false } = {}) {
    this.burgerPanels.forEach((panel) => {
      const isActive = panel.dataset.burgerPanel === key;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
      this.clearBurgerPanelStates(panel);
      if (isActive && immediate) this.ensureBurgerCardsVisible(panel, { immediate: true });
      else if (isActive) resetMenuCards(panel);
    });
  }

  processQueuedMenuRequest() {
    if (this.transition || this.topPreparation || this.burgerTransition || this.burgerPreparation) return;

    const pendingTop = this.pendingTop;
    this.pendingTop = null;
    if (pendingTop && pendingTop !== this.activeTop) {
      this.selectTopCategory(pendingTop);
      return;
    }

    const pendingBurger = this.pendingBurger;
    this.pendingBurger = null;
    if (pendingBurger && this.activeTop === "burgers" && pendingBurger !== this.activeBurger) this.selectBurgerSubcategory(pendingBurger);
  }

  updateTopTabs(key) {
    this.railState.selectedCategory = key;
    this.tabs.forEach((tab) => {
      const isCurrent = tab.dataset.menuTab === key;
      tab.classList.toggle("is-active", isCurrent);
      tab.setAttribute("aria-selected", String(isCurrent));
      tab.tabIndex = isCurrent ? 0 : -1;
    });
  }

  updateBurgerOptions() {
    burgerCurrentLabel.textContent = this.activeBurger.toUpperCase();
    let visibleIndex = 0;
    burgerOptions.forEach((option) => {
      const isCurrent = option.dataset.burgerSubcategory === this.activeBurger;
      option.hidden = isCurrent;
      option.setAttribute("aria-current", isCurrent ? "true" : "false");
      if (isCurrent) {
        option.style.removeProperty("--burger-option-index");
      } else {
        option.style.setProperty("--burger-option-index", String(visibleIndex));
        visibleIndex += 1;
      }
    });
  }

  updateTitle({ immediate = false } = {}) {
    const title = this.activeTop === "burgers"
      ? (this.activeBurger === "chicken" ? menuTitleAssets.chicken : this.activeBurger === "beef" ? menuTitleAssets.beef : menuTitleAssets.generic)
      : menuTitleAssets.generic;

    if (!menuTitle || !title) return;

    const request = ++this.titleRequest;
    const commit = () => {
      if (request !== this.titleRequest) return;

      const sourceChanged = menuTitle.getAttribute("src") !== title.src;
      menuTitle.width = title.width;
      menuTitle.height = title.height;
      menuTitle.alt = "";
      menuTitle.classList.toggle("is-chicken-title", this.activeTop === "burgers" && this.activeBurger === "chicken");

      if (!sourceChanged) return;

      window.clearTimeout(this.titleTimer);
      menuTitle.classList.remove("is-switching");
      menuTitle.src = title.src;
      void menuTitle.offsetWidth;
      menuTitle.classList.add("is-switching");
      this.titleTimer = window.setTimeout(() => {
        if (request === this.titleRequest) menuTitle.classList.remove("is-switching");
      }, menuTitleSwitchDuration);
    };

    if (immediate) {
      commit();
    } else {
      preloadMenuTitle(title.src).then(commit);
    }
  }

  updateStatus() {
    if (!menuStatus) return;

    const labels = {
      appetizers: "Appetizers",
      fries: "Fries",
      kids: "Kids Menu",
      sauces: "Sauces",
      cookies: "Cookies",
      drinks: "Drinks",
    };
    menuStatus.textContent = this.activeTop === "burgers"
      ? `Burgers: ${this.activeBurger[0].toUpperCase()}${this.activeBurger.slice(1)}`
      : labels[this.activeTop];
  }

  toggleBurgerPopover() {
    if (this.burgerPopoverState === "closed" || this.burgerPopoverState === "closing") this.openBurgerPopover();
    else this.closeBurgerPopover();
  }

  openBurgerPopover() {
    if (!burgerPopover || this.activeTop !== "burgers") return;

    const generation = ++this.burgerPopoverGeneration;
    this.cancelBurgerPopoverCompletion();
    burgerPopover.hidden = false;
    burgerPopover.dataset.state = "opening";
    burgerPopover.removeAttribute("data-motion-settled");
    this.burgerPopoverState = "opening";
    burgerTab?.setAttribute("aria-expanded", "true");
    this.setBurgerPopoverInteractivity(false);
    this.positionBurgerPopover();

    if (prefersReducedMotion) {
      burgerPopover.dataset.state = "open";
      burgerPopover.dataset.motionSettled = "true";
      this.burgerPopoverState = "open";
      this.setBurgerPopoverInteractivity(true);
      return;
    }

    this.burgerPopoverFrame = window.requestAnimationFrame(() => {
      this.burgerPopoverFrame = 0;
      if (generation !== this.burgerPopoverGeneration || this.burgerPopoverState !== "opening") return;

      burgerPopover.dataset.state = "open";
      this.burgerPopoverState = "open";
      this.setBurgerPopoverInteractivity(true);
      this.awaitBurgerPopoverCompletion(generation, "open", 390);
    });
  }

  closeBurgerPopover({ restoreFocus = false } = {}) {
    if (!burgerPopover) return;

    const isClosed = this.burgerPopoverState === "closed" && burgerPopover.hidden;
    if (isClosed) {
      burgerTab?.setAttribute("aria-expanded", "false");
      return;
    }

    const focusIsInside = burgerPopover.contains(document.activeElement);
    if (restoreFocus || focusIsInside) burgerTab?.focus({ preventScroll: true });

    const generation = ++this.burgerPopoverGeneration;
    this.cancelBurgerPopoverCompletion();
    burgerTab?.setAttribute("aria-expanded", "false");
    this.setBurgerPopoverInteractivity(false);
    burgerPopover.hidden = false;
    burgerPopover.dataset.state = "closing";
    burgerPopover.removeAttribute("data-motion-settled");
    this.burgerPopoverState = "closing";

    if (prefersReducedMotion) {
      this.completeBurgerPopoverMotion(generation, "closing");
      return;
    }

    this.awaitBurgerPopoverCompletion(generation, "closing", 240);
  }

  isBurgerPopoverVisible() {
    return Boolean(burgerPopover && !burgerPopover.hidden && this.burgerPopoverState !== "closed");
  }

  setBurgerPopoverInteractivity(isInteractive) {
    burgerOptions.forEach((option) => {
      option.tabIndex = !option.hidden && isInteractive ? 0 : -1;
    });
  }

  cancelBurgerPopoverCompletion() {
    window.clearTimeout(this.burgerPopoverTimer);
    this.burgerPopoverTimer = 0;
    this.burgerPopoverCompletion = null;
    if (this.burgerPopoverFrame) {
      window.cancelAnimationFrame(this.burgerPopoverFrame);
      this.burgerPopoverFrame = 0;
    }
  }

  awaitBurgerPopoverCompletion(generation, state, fallbackDelay) {
    this.burgerPopoverCompletion = { generation, state };
    this.burgerPopoverTimer = window.setTimeout(() => {
      this.completeBurgerPopoverMotion(generation, state);
    }, fallbackDelay);
  }

  handleBurgerPopoverTransitionEnd(event) {
    if (event.target !== burgerPopover || event.propertyName !== "opacity") return;
    const completion = this.burgerPopoverCompletion;
    if (!completion || completion.generation !== this.burgerPopoverGeneration || completion.state !== this.burgerPopoverState) return;
    if (completion.state !== "closing") return;
    this.completeBurgerPopoverMotion(completion.generation, completion.state);
  }

  completeBurgerPopoverMotion(generation, state) {
    if (!burgerPopover || generation !== this.burgerPopoverGeneration || state !== this.burgerPopoverState) return;

    window.clearTimeout(this.burgerPopoverTimer);
    this.burgerPopoverTimer = 0;
    this.burgerPopoverCompletion = null;

    if (state === "open") {
      burgerPopover.dataset.motionSettled = "true";
    } else if (state === "closing") {
      burgerPopover.hidden = true;
      burgerPopover.removeAttribute("data-state");
      burgerPopover.removeAttribute("data-motion-settled");
      this.burgerPopoverState = "closed";
      this.setBurgerPopoverInteractivity(false);
    }
  }

  positionBurgerPopover() {
    if (!burgerPopover || !burgerTab || !menuCategoryNavigation) return;

    const navigationRect = menuCategoryNavigation.getBoundingClientRect();
    const tabRect = burgerTab.getBoundingClientRect();
    const popoverRect = burgerPopover.getBoundingClientRect();
    const gutter = 14;
    const preferredLeft = tabRect.left + tabRect.width / 2 - navigationRect.left - popoverRect.width / 2;
    const maxLeft = Math.max(gutter, navigationRect.width - popoverRect.width - gutter);
    const left = Math.max(gutter, Math.min(maxLeft, preferredLeft));
    const top = tabRect.bottom - navigationRect.top + 12;

    menuCategoryNavigation.style.setProperty("--burger-popover-left", `${left}px`);
    menuCategoryNavigation.style.setProperty("--burger-popover-top", `${top}px`);
  }

  closeWhenBurgerLeavesRail() {
    if (!burgerPopover || this.burgerPopoverState === "closed" || this.burgerPopoverState === "closing" || !burgerTab || !menuCategorySwitcher) return;

    const tabRect = burgerTab.getBoundingClientRect();
    const railRect = menuCategorySwitcher.getBoundingClientRect();
    if (tabRect.right < railRect.left || tabRect.left > railRect.right) {
      this.closeBurgerPopover();
    }
  }
}

new MenuCategoryController().init();

const mobileMenuLink = document.querySelector(".mobile-primary-nav__menu-link");
let mobileMenuActivationTimer = 0;

if (mobileMenuLink && !prefersReducedMotion) {
  mobileMenuLink.addEventListener("pointerdown", () => {
    if (!window.matchMedia("(max-width: 900px)").matches) return;

    window.clearTimeout(mobileMenuActivationTimer);
    mobileMenuLink.classList.remove("is-menu-activating");
    void mobileMenuLink.offsetWidth;
    mobileMenuLink.classList.add("is-menu-activating");
    mobileMenuActivationTimer = window.setTimeout(() => {
      mobileMenuLink.classList.remove("is-menu-activating");
      mobileMenuActivationTimer = 0;
    }, 460);
  }, { passive: true });
}

const mobileSectionLinks = [...document.querySelectorAll("[data-mobile-section-link]")];

if ("IntersectionObserver" in window && mobileSectionLinks.length) {
  const activeMobileSectionIds = new Set();
  const mobileSections = mobileSectionLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const mobileSectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeMobileSectionIds.add(entry.target.id);
        } else {
          activeMobileSectionIds.delete(entry.target.id);
        }
      });

      const activeSectionId = mobileSections.find((section) => activeMobileSectionIds.has(section.id))?.id;

      mobileSectionLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${activeSectionId}`;

        if (isCurrent) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },
    {
      rootMargin: "-24% 0px -75% 0px",
      threshold: 0,
    }
  );

  mobileSections.forEach((section) => mobileSectionObserver.observe(section));
}

if (!prefersReducedMotion) {
  magneticItems.forEach((item) => {
    item.addEventListener("mousemove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      item.style.transform = `translate3d(${x * 0.08}px, ${y * 0.1 - 2}px, 0)`;
    });

    item.addEventListener("mouseleave", () => {
      item.style.transform = "";
    });
  });
}

function showLocationMapFallback() {
  if (locationMapStatus) locationMapStatus.hidden = true;
  if (locationMapFallback) locationMapFallback.hidden = false;
  locationMapElement?.setAttribute("aria-busy", "false");
}

function initLocationMap() {
  if (!locationMapElement || locationMapElement.dataset.mapInitialized === "true") return;
  if (!window.L) {
    showLocationMapFallback();
    return;
  }

  locationMapElement.dataset.mapInitialized = "true";

  try {
    const coordinates = [38.0349902, 23.7386331];
    const map = window.L.map(locationMapElement, {
      center: coordinates,
      zoom: 16,
      scrollWheelZoom: false,
      keyboard: false,
      zoomAnimation: !prefersReducedMotion,
      fadeAnimation: !prefersReducedMotion,
      markerZoomAnimation: !prefersReducedMotion,
    });

    const tileLayer = window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      subdomains: "abc",
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    const getMarkerGeometry = () => {
      if (window.matchMedia("(max-width: 560px)").matches) {
        return { iconSize: [51, 72], iconAnchor: [26, 68], popupAnchor: [0, -64] };
      }

      if (window.matchMedia("(max-width: 1024px)").matches) {
        return { iconSize: [68, 96], iconAnchor: [34, 90], popupAnchor: [0, -85] };
      }

      return { iconSize: [86, 122], iconAnchor: [43, 115], popupAnchor: [0, -108] };
    };

    const createMarkerIcon = () => window.L.icon({
      iconUrl: "public/assets/contact/big-mama-map-pin.png",
      ...getMarkerGeometry(),
      className: "big-mama-map-marker",
    });

    const marker = window.L.marker(coordinates, {
      icon: createMarkerIcon(),
      title: "Big Mama Burgers n' Fries",
      alt: "Big Mama map pin",
      keyboard: true,
      riseOnHover: true,
    })
      .addTo(map)
      .bindPopup(
        "<strong>Big Mama Burgers n' Fries</strong>Leof. Dekelias 114<br>Nea Filadelfia 143 41"
      );

    [window.matchMedia("(max-width: 560px)"), window.matchMedia("(max-width: 1024px)")].forEach((query) => {
      query.addEventListener("change", () => marker.setIcon(createMarkerIcon()));
    });

    tileLayer.once("load", () => {
      locationMapCard?.classList.add("is-map-ready");
      if (locationMapStatus) locationMapStatus.hidden = true;
      if (locationMapFallback) locationMapFallback.hidden = true;
      locationMapElement.setAttribute("aria-busy", "false");
    });

    tileLayer.once("tileerror", showLocationMapFallback);
    window.requestAnimationFrame(() => map.invalidateSize(false));
  } catch {
    showLocationMapFallback();
  }
}

initLocationMap();
