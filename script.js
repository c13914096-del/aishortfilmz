'use strict';

/* ==========================================================================
   AIShortFilmz — store
   ========================================================================== */

const CONFIG = {
  // Your PayPal REST app's Client ID (developer.paypal.com → Apps & Credentials).
  // 'sb' is PayPal's shared sandbox ID: buttons render and fake-pay for testing,
  // but money never moves. Replace it with your own Client ID before launch —
  // use a Sandbox app's ID while testing, then your Live app's ID to go live.
  paypalClientId: 'BAAs9lBUgX_ykXB4-Dcv45PSaVHZuKCxy9A46O5YIQ-tX12Lvkd1Ol9h734O4LhNVabHgy5gkH9ilULbvU',
  currency: 'USD',

  // IMPORTANT: this page captures payment entirely in the browser. That's
  // enough to take real PayPal payments, but a visitor with developer tools
  // open could trigger the "payment received" screen without paying. Fine
  // for a first launch; before relying on this for real digital-download
  // delivery, verify each payment server-side (PayPal's Orders API) before
  // revealing download links.
};

/* ---------- Catalog (dummy data — replace with your own titles, prices, art) ---------- */
const PRODUCTS = [
  {
    id: 'film-neon-skyline',
    category: 'films',
    badge: 'Short film',
    duration: '6:40',
    name: 'Neon Skyline',
    description: 'A rain-lit chase through a synthetic city, told without a single word of dialogue.',
    price: 80,
    deliveryNote: 'Delivered by email within 24 hours, as a 4K file plus a commercial license.',
  },
  {
    id: 'film-last-letter',
    category: 'films',
    badge: 'Short film',
    duration: '8:55',
    name: 'The Last Letter',
    description: 'A quiet family drama about a letter that arrives forty years too late.',
    price: 100,
    deliveryNote: 'Delivered by email within 24 hours, as a 4K file plus a commercial license.',
  },
  {
    id: 'film-coffee-dreams',
    category: 'films',
    badge: 'Video ad',
    duration: '0:15',
    name: 'Coffee Dreams',
    description: 'A warm, fast-cut product ad built for a café brand — easy to re-badge as your own.',
    price: 20,
    deliveryNote: 'Delivered by email within 24 hours, as a 4K file plus a commercial license.',
  },
  {
    id: 'film-mountain-escape',
    category: 'films',
    badge: 'Video ad',
    duration: '0:30',
    name: 'Mountain Escape',
    description: 'A travel-brand ad built around a single sweeping mountain shot and a clear call to action.',
    price: 35,
    deliveryNote: 'Delivered by email within 24 hours, as a 4K file plus a commercial license.',
  },
  {
    id: 'download-lut-pack',
    category: 'downloads',
    badge: 'LUT pack',
    format: '.cube',
    name: 'Cinematic LUT Pack',
    description: '100 color-grading presets for teal-and-amber, muted drama, and warm sunlit looks.',
    price: 60,
    deliveryNote: 'Unlocks instantly on the confirmation screen.',
  },
  {
    id: 'download-poster-templates',
    category: 'downloads',
    badge: 'Templates',
    format: '.psd',
    name: 'Film Poster Template Pack',
    description: '150 layered Photoshop poster templates, built for quick title and credit swaps.',
    price: 80,
    deliveryNote: 'Unlocks instantly on the confirmation screen.',
  },
  {
    id: 'download-titles-pack',
    category: 'downloads',
    badge: 'Motion pack',
    format: '.aep',
    name: 'Title Card & Lower Thirds Pack',
    description: '135 animated After Effects title cards and lower thirds, ready to re-type and render.',
    price: 70,
    deliveryNote: 'Unlocks instantly on the confirmation screen.',
  },
  {
    id: 'download-sound-fx',
    category: 'downloads',
    badge: 'Sound pack',
    format: '.wav',
    name: 'Sound FX Bundle',
    description: '80 whooshes, impacts and transitions for trailers, ads and title sequences.',
    price: 20,
    deliveryNote: 'Unlocks instantly on the confirmation screen.',
  },
];

const PRODUCTS_BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = (amount) => `$${amount.toFixed(2)}`;

/* A different soft gradient per product, by category + a small hash, so
   every thumbnail looks distinct without needing real artwork yet. */
function thumbGradient(product) {
  const hues = { films: [262, 318], downloads: [28, 48] };
  const [a, b] = hues[product.category] || [220, 260];
  let hash = 0;
  for (const char of product.id) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  const h1 = (a + (hash % 30)) % 360;
  const h2 = (b + (hash % 40)) % 360;
  return `linear-gradient(135deg, hsl(${h1} 70% 72%), hsl(${h2} 75% 65%))`;
}

/* ---------- Footer year ---------- */
function initYear() {
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
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

/* ---------- Back to top and logo reload ---------- */
function clearHash() {
  try {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch (error) {
    // Some embedded previews block this; the scroll still works.
  }
}

function initPageLinks() {
  $$('[data-scroll-top]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      clearHash();
    });
  });

  $$('[data-reload]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      clearHash();
      window.scrollTo({ top: 0, behavior: 'instant' });
      window.location.reload();
    });
  });
}

/* ---------- Product grids ---------- */
function productCardHTML(product) {
  const meta = product.category === 'films'
    ? `<span class="product-duration">${product.duration}</span>`
    : `<span class="product-duration">${product.format}</span>`;

  return `
    <article class="product-card">
      <div class="product-thumb" style="background:${thumbGradient(product)}">
        <span class="product-badge">${product.badge}</span>
        ${meta}
        <span>${product.name}</span>
      </div>
      <div class="product-body">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-foot">
          <span class="product-price">${money(product.price)}</span>
          <button type="button" class="btn add-to-cart" data-product-id="${product.id}">Add to cart</button>
        </div>
      </div>
    </article>`;
}

function initGrids() {
  const filmsGrid = $('#films-grid');
  const downloadsGrid = $('#downloads-grid');
  if (filmsGrid) filmsGrid.innerHTML = PRODUCTS.filter((p) => p.category === 'films').map(productCardHTML).join('');
  if (downloadsGrid) downloadsGrid.innerHTML = PRODUCTS.filter((p) => p.category === 'downloads').map(productCardHTML).join('');
}

/* ---------- Cart ---------- */
const Cart = {
  STORAGE_KEY: 'aishortfilmz:cart',

  read() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      // Drop any id that no longer matches a product, so an edited catalog never breaks the cart.
      return Array.isArray(ids) ? ids.filter((id) => PRODUCTS_BY_ID.has(id)) : [];
    } catch (error) {
      return [];
    }
  },

  write(ids) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      // Private browsing or a full storage quota. The cart still works for this visit.
    }
  },

  add(id) {
    const ids = this.read();
    if (!ids.includes(id)) this.write([...ids, id]);
  },

  remove(id) {
    this.write(this.read().filter((existing) => existing !== id));
  },

  clear() {
    this.write([]);
  },

  items() {
    return this.read().map((id) => PRODUCTS_BY_ID.get(id));
  },

  total() {
    return this.items().reduce((sum, product) => sum + product.price, 0);
  },
};

function cartItemHTML(product) {
  return `
    <li class="cart-item" data-product-id="${product.id}">
      <span class="cart-item-thumb" style="background:${thumbGradient(product)}" aria-hidden="true"></span>
      <span>
        <span class="cart-item-name">${product.name}</span>
        <span class="cart-item-price">${money(product.price)}</span>
      </span>
      <button type="button" class="cart-item-remove" data-remove-id="${product.id}" aria-label="Remove ${product.name} from cart">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </li>`;
}

function initCart() {
  const toggle = $('#cart-toggle');
  const drawer = $('#cart-drawer');
  const overlay = $('#cart-overlay');
  const closeBtn = $('#cart-close');
  const itemsList = $('#cart-items');
  const emptyMsg = $('#cart-empty');
  const subtotalEl = $('#cart-subtotal');
  const countEl = $('#cart-count');
  const paypalContainer = $('#paypal-button-container');
  const note = $('#cart-note');

  if (!toggle || !drawer) return;

  let paypalRendered = false;

  const render = () => {
    const items = Cart.items();

    itemsList.innerHTML = items.map(cartItemHTML).join('');
    emptyMsg.classList.toggle('is-visible', items.length === 0);
    subtotalEl.textContent = money(Cart.total());

    countEl.textContent = String(items.length);
    countEl.setAttribute('data-empty', String(items.length === 0));
    toggle.setAttribute('aria-label', `Open cart, ${items.length} item${items.length === 1 ? '' : 's'}`);

    paypalContainer.setAttribute('data-disabled', String(items.length === 0));

    // Render the PayPal buttons once; createOrder reads the live cart at click time,
    // so the buttons don't need to be rebuilt every time the cart changes.
    if (!paypalRendered && window.paypal) {
      renderPaypalButtons();
    }
  };

  const open = () => {
    drawer.hidden = false;
    overlay.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  const close = () => {
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      drawer.hidden = true;
      overlay.hidden = true;
    }, prefersReducedMotion ? 0 : 320);
    toggle.focus();
  };

  toggle.addEventListener('click', () => {
    render();
    open();
  });
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });

  // Add to cart, anywhere on the page
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.add-to-cart');
    if (!button) return;
    Cart.add(button.dataset.productId);
    render();
    button.textContent = 'Added';
    button.setAttribute('data-added', 'true');
    window.setTimeout(() => {
      button.textContent = 'Add to cart';
      button.removeAttribute('data-added');
    }, 1400);
  });

  itemsList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-id]');
    if (!button) return;
    Cart.remove(button.dataset.removeId);
    render();
  });

  function renderPaypalButtons() {
    paypalRendered = true;

    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },

      createOrder(data, actions) {
        const items = Cart.items();
        const total = items.reduce((sum, product) => sum + product.price, 0).toFixed(2);

        return actions.order.create({
          purchase_units: [{
            amount: {
              value: total,
              currency_code: CONFIG.currency,
              breakdown: {
                item_total: { value: total, currency_code: CONFIG.currency },
              },
            },
            items: items.map((product) => ({
              name: product.name,
              unit_amount: { value: product.price.toFixed(2), currency_code: CONFIG.currency },
              quantity: '1',
              category: 'DIGITAL_GOODS',
            })),
          }],
        });
      },

      onApprove(data, actions) {
        const purchasedItems = Cart.items();
        return actions.order.capture().then((details) => {
          Cart.clear();
          render();
          close();
          showConfirmation(details.id, purchasedItems);
        });
      },

      onError(err) {
        console.error('[AIShortFilmz] PayPal error:', err);
        note.textContent = 'PayPal had a problem starting checkout. Please try again.';
        note.classList.add('is-error');
      },
    }).render(paypalContainer).catch((err) => {
      console.error('[AIShortFilmz] Could not render PayPal buttons:', err);
      note.textContent = 'Checkout is temporarily unavailable. Please refresh and try again.';
      note.classList.add('is-error');
    });
  }

  render();
  loadPaypalSdk(() => render());
}

/* ---------- PayPal SDK loader ---------- */
function loadPaypalSdk(onReady) {
  if (window.paypal) {
    onReady();
    return;
  }

  const script = document.createElement('script');
  script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CONFIG.paypalClientId)}&currency=${encodeURIComponent(CONFIG.currency)}&intent=capture`;
  script.addEventListener('load', onReady);
  script.addEventListener('error', () => {
    const note = $('#cart-note');
    if (note) {
      note.textContent = 'PayPal could not load. Check your connection and refresh the page.';
      note.classList.add('is-error');
    }
  });
  document.head.appendChild(script);
}

/* ---------- Confirmation modal ---------- */
function confirmItemHTML(product) {
  const action = product.category === 'downloads'
    ? `<a class="btn confirm-download" href="#" data-dummy-download>Download</a>`
    : `<span class="confirm-item-note">On its way by email</span>`;

  return `
    <li class="confirm-item">
      <span>
        <span class="confirm-item-name">${product.name}</span>
        <span class="confirm-item-note">${product.deliveryNote}</span>
      </span>
      ${action}
    </li>`;
}

function showConfirmation(orderId, items) {
  const overlay = $('#confirm-overlay');
  const modal = $('#confirm-modal');
  $('#confirm-id').textContent = orderId;
  $('#confirm-items').innerHTML = items.map(confirmItemHTML).join('');

  overlay.hidden = false;
  modal.hidden = false;
  modal.focus();
  document.body.style.overflow = 'hidden';
}

function initConfirmModal() {
  const overlay = $('#confirm-overlay');
  const modal = $('#confirm-modal');
  const closeBtn = $('#confirm-close');
  if (!modal) return;

  const close = () => {
    overlay.hidden = true;
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) close();
  });

  // Dummy download links: in a real store these point at your file host or API.
  modal.addEventListener('click', (event) => {
    const link = event.target.closest('[data-dummy-download]');
    if (!link) return;
    event.preventDefault();
    link.textContent = 'Link placeholder';
  });
}

/* ---------- Start ---------- */
initYear();
initNav();
initPageLinks();
initGrids();
initCart();
initConfirmModal();
