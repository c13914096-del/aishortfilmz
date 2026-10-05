'use strict';

/* ==========================================================================
   AIShortFilmz — storefront with payment-link checkout
   ========================================================================== */

const CONFIG = {
  // The address shown on the contact button and used in every policy page's
  // mailto links. Change it here once, and every page updates — each of
  // those links also has this same address written into its HTML as a
  // fallback, in case a visitor's browser has JavaScript turned off.
  supportEmail: 'charlessikha1@gmail.com',
};

/* ---------- Catalog (dummy data — replace titles, prices, art and payment links) ---------- */
// Each "paymentLink" is the checkout link your payment gateway gives you for
// that exact product (for example, a Stripe Payment Link, a PayPal.me link,
// or a Gumroad/Payhip/Lemon Squeezy product page). Paste one per product
// below. Until you do, the button shows a dashed border and reminds you to
// add it instead of sending visitors to a dead link.
const PRODUCTS = [
  {
    id: 'film-neon-skyline',
    category: 'films',
    badge: 'Short film',
    meta: '2:40',
    name: 'Neon Skyline',
    description: 'A rain-lit chase through a synthetic city, told without a single word of dialogue.',
    price: 49,
    paymentLink: '',
  },
  {
    id: 'film-last-letter',
    category: 'films',
    badge: 'Short film',
    meta: '4:55',
    name: 'The Last Letter',
    description: 'A quiet family drama about a letter that arrives forty years too late.',
    price: 69,
    paymentLink: '',
  },
  {
    id: 'film-coffee-dreams',
    category: 'films',
    badge: 'Video ad',
    meta: '0:15',
    name: 'Coffee Dreams',
    description: 'A warm, fast-cut product ad built for a café brand — easy to re-badge as your own.',
    price: 29,
    paymentLink: '',
  },
  {
    id: 'film-mountain-escape',
    category: 'films',
    badge: 'Video ad',
    meta: '0:30',
    name: 'Mountain Escape',
    description: 'A travel-brand ad built around a single sweeping mountain shot and a clear call to action.',
    price: 39,
    paymentLink: '',
  },
  {
    id: 'asset-reels-bundle',
    category: 'assets',
    badge: 'Reels bundle',
    meta: '.mp4',
    name: 'AI Horror Reels Bundle',
    description: '600+ AI horror reels for Instagram and TikTok, covering trending formats.',
    price: 29.99,
    paymentLink: 'https://pay.atexpay.com/p/Qvm0DT84L85Q',
  },
  {
    id: 'asset-reels-bundle',
    category: 'assets',
    badge: 'Reels bundle',
    meta: '.mp4',
    name: 'AI Reels Bundle',
    description: '1000+ AI reels for Instagram and TikTok, covering trending formats.',
    price: 34.99,
    paymentLink: '',
  },
  {
    id: 'asset-prompts-bundle',
    category: 'assets',
    badge: 'Prompts',
    meta: '.txt',
    name: 'AI Prompts Bundle',
    description: '500+ curated prompts for AI image and video generation, organized by style.',
    price: 15,
    paymentLink: '',
  },
  {
    id: 'asset-kids-worksheets',
    category: 'assets',
    badge: 'Worksheets',
    meta: '.pdf',
    name: "Children's Drawing Worksheets Bundle",
    description: '40 printable drawing and coloring worksheets, designed for early learners.',
    price: 12,
    paymentLink: '',
  },
  
  {
    id: 'asset-script-pack',
    category: 'assets',
    badge: 'Scripts',
    meta: '.docx',
    name: 'Faceless Video Script Pack',
    description: '30 ready-to-record scripts for faceless YouTube and TikTok channels.',
    price: 22,
    paymentLink: '',
  },
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = (amount) => `$${amount.toFixed(2)}`;

/* A different soft gradient per product, by category + a small hash, so
   every thumbnail looks distinct without needing real artwork yet. */
function thumbGradient(product) {
  const hues = { films: [262, 318], assets: [28, 48] };
  const [a, b] = hues[product.category] || [220, 260];
  let hash = 0;
  for (const char of product.id) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  const h1 = (a + (hash % 30)) % 360;
  const h2 = (b + (hash % 40)) % 360;
  return `linear-gradient(135deg, hsl(${h1} 70% 72%), hsl(${h2} 75% 65%))`;
}

/* ---------- Footer year ---------- */
function initYear() {
  $$('#year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

/* ---------- Mobile navigation ---------- */
function initNav() {
  const toggle = $('.nav-toggle');
  const nav = $('#site-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/* ---------- Back to top ---------- */
// The logo needs no special handling: it's a plain link to index.html, which
// the browser reloads normally when you're already there, and which takes
// you home from a policy page. Only "Back to top" needs JS, for a smooth scroll.
function initPageLinks() {
  $$('[data-scroll-top]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      try {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (error) {
        // Some embedded previews block this; the scroll still works.
      }
    });
  });
}

/* ---------- Product grids ---------- */
function productCardHTML(product) {
  const hasLink = Boolean(product.paymentLink && product.paymentLink.trim());
  const href = hasLink ? product.paymentLink : '#';

  return `
    <article class="product-card">
      <div class="product-thumb" style="background:${thumbGradient(product)}">
        <span class="product-badge">${product.badge}</span>
        <span class="product-meta">${product.meta}</span>
        <span>${product.name}</span>
      </div>
      <div class="product-body">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-foot">
          <span class="product-price">${money(product.price)}</span>
          <a
            class="btn buy-now"
            href="${href}"
            data-product-id="${product.id}"
            data-pending="${!hasLink}"
            ${hasLink ? 'target="_blank" rel="noopener noreferrer"' : ''}
          >Buy now${hasLink ? '<span class="sr-only">, opens in a new tab</span>' : ''}</a>
        </div>
      </div>
    </article>`;
}

function initGrids() {
  const filmsGrid = $('#films-grid');
  const assetsGrid = $('#assets-grid');
  if (filmsGrid) filmsGrid.innerHTML = PRODUCTS.filter((p) => p.category === 'films').map(productCardHTML).join('');
  if (assetsGrid) assetsGrid.innerHTML = PRODUCTS.filter((p) => p.category === 'assets').map(productCardHTML).join('');
}

function initBuyButtons() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.buy-now[data-pending="true"]');
    if (!button) return;
    event.preventDefault();

    const original = button.textContent;
    button.textContent = 'Add a payment link →';
    console.info(`[AIShortFilmz] Add a payment link for "${button.dataset.productId}" in script.js (CONFIG / PRODUCTS).`);
    window.setTimeout(() => {
      button.innerHTML = 'Buy now';
    }, 1800);
  });
}

/* ---------- Support email ----------
   Every mailto link already has CONFIG.supportEmail written into its HTML
   as a working fallback. This just keeps them all in sync with CONFIG,
   across every page, so the address only has to be changed in one place. */
function initSupportLinks() {
  $$('[data-support-email]').forEach((link) => {
    link.href = `mailto:${CONFIG.supportEmail}`;
    link.textContent = CONFIG.supportEmail;
  });
}

/* ---------- Start ---------- */
initYear();
initNav();
initPageLinks();
initGrids();
initBuyButtons();
initSupportLinks();
