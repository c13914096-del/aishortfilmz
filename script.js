'use strict';

/* ==========================================================================
   AIShortFilmz
   ========================================================================== */

const CONFIG = {
  // Where form submissions are sent. The service emails each submission to your inbox.
  // Your email address is set in the service's dashboard, so it never appears on this site.
  //
  // Option A: Formspree (https://formspree.io)
  //   Create a form, then paste its URL here, like 'https://formspree.io/f/abcdwxyz'.
  //
  // Option B: Web3Forms (https://web3forms.com)
  //   Set formEndpoint to 'https://api.web3forms.com/submit' and paste your access key below.
  //
  // Left empty, the form runs in demo mode: it shows the thank-you message
  // but does not send the details anywhere.
  formEndpoint: '',

  // Only needed for Web3Forms. Leave empty for Formspree.
  accessKey: '',

  // The subject line of the email you receive.
  emailSubject: 'New AIShortFilmz project enquiry',
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

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

/* ---------- Length scrubber ---------- */
function initScrubber() {
  const root = $('#scrubber');
  const range = $('#length');
  if (!root || !range) return;

  const timecodeEl = $('#timecode');
  const nameEl = $('#format-name');
  const textEl = $('#format-text');

  // The slider is logarithmic, so short lengths get as much room as long ones.
  const MIN_SECONDS = 5;
  const MAX_SECONDS = 1800;
  const RATIO = MAX_SECONDS / MIN_SECONDS;

  const FORMATS = [
    { max: 15, name: 'Social clip', text: 'A quick teaser or product highlight, made for feeds and stories.' },
    { max: 60, name: 'Video ad', text: 'A complete ad with a hook, a message and a call to action.' },
    { max: 300, name: 'Extended ad or brand story', text: 'Room to tell the story behind your product, service or brand.' },
    { max: Infinity, name: 'Short film', text: 'A full story with characters, scenes and a script from our story team.' },
  ];

  const toSeconds = (position) => MIN_SECONDS * Math.pow(RATIO, position / 100);
  const toPosition = (seconds) => (100 * Math.log(seconds / MIN_SECONDS)) / Math.log(RATIO);

  // Round to friendly values so the timecode never shows odd numbers like 0:47
  const snap = (seconds) => {
    let value;
    if (seconds < 30) value = Math.round(seconds);
    else if (seconds < 120) value = Math.round(seconds / 5) * 5;
    else if (seconds < 600) value = Math.round(seconds / 15) * 15;
    else value = Math.round(seconds / 60) * 60;
    return Math.min(Math.max(value, MIN_SECONDS), MAX_SECONDS);
  };

  const formatTimecode = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const speak = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    const parts = [];
    if (minutes) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    if (rest) parts.push(`${rest} ${rest === 1 ? 'second' : 'seconds'}`);
    return parts.join(' ');
  };

  let currentFormat = null;

  const render = () => {
    const position = Number(range.value);
    const seconds = snap(toSeconds(position));
    const format = FORMATS.find((item) => seconds <= item.max);

    root.style.setProperty('--p', position);
    timecodeEl.textContent = formatTimecode(seconds);

    if (format !== currentFormat) {
      nameEl.textContent = format.name;
      textEl.textContent = format.text;
      currentFormat = format;
    }

    range.setAttribute('aria-valuetext', `${speak(seconds)}, ${format.name}`);
  };

  // Intro: the playhead sweeps out to its starting length once. Any input from the visitor cancels it.
  let frame = null;
  let interrupted = false;

  const interrupt = () => {
    interrupted = true;
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  };

  const sweep = (target) => {
    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      range.value = target * eased;
      render();
      frame = progress < 1 ? requestAnimationFrame(step) : null;
    };

    frame = requestAnimationFrame(step);
  };

  range.addEventListener('pointerdown', interrupt);
  range.addEventListener('keydown', interrupt);
  range.addEventListener('input', () => {
    interrupt();
    render();
  });

  $$('[data-seconds]', root).forEach((button) => {
    button.addEventListener('click', () => {
      interrupt();
      range.value = toPosition(Number(button.dataset.seconds));
      render();
    });
  });

  const startValue = Number(range.value);

  if (prefersReducedMotion) {
    render();
    return;
  }

  range.value = 0;
  render();
  window.setTimeout(() => {
    if (!interrupted) sweep(startValue);
  }, 1000);
}

/* ---------- Process steps: the timeline fills as you scroll ---------- */
function initSteps() {
  const steps = $$('.step');
  if (!steps.length) return;

  const numbers = steps.map((step) => $('.step-number', step));
  let ticking = false;

  const update = () => {
    const anchor = window.innerHeight * 0.6;

    steps.forEach((step, index) => {
      const box = numbers[index].getBoundingClientRect();
      const reached = box.top + box.height / 2 <= anchor;

      step.classList.toggle('is-reached', reached);
      if (index > 0) steps[index - 1].classList.toggle('is-passed', reached);
    });

    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}

/* ---------- Contact form ---------- */
function initForm() {
  const form = $('#contact-form');
  if (!form) return;

  const submitButton = $('#submit-btn');
  const status = $('#form-status');
  const success = $('#form-success');
  const successName = $('#success-name');
  const successMessage = $('#success-message');

  const fields = {
    name: {
      input: $('#name'),
      error: $('#name-error'),
      validate: (value) => (value.trim().length >= 2 ? '' : 'Enter your name.'),
    },
    email: {
      input: $('#email'),
      error: $('#email-error'),
      validate: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
          ? ''
          : 'Enter a valid email address, like name@example.com.',
    },
    whatsapp: {
      input: $('#whatsapp'),
      error: $('#whatsapp-error'),
      // Optional: an empty field is fine. If a number is typed, it must look valid.
      validate: (value) => {
        const text = value.trim();
        if (!text) return '';
        const digits = text.replace(/\D/g, '');
        const valid = /^[+\d\s().-]+$/.test(text) && digits.length >= 8 && digits.length <= 15;
        return valid ? '' : 'Enter a valid number with country code, like +1 555 010 0199, or leave this empty.';
      },
    },
  };

  const validateField = (field) => {
    const message = field.validate(field.input.value);
    field.error.textContent = message;
    field.input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  };

  // Validate when a visitor leaves a field, then keep it live once it has been checked
  Object.values(fields).forEach((field) => {
    field.input.addEventListener('blur', () => validateField(field));
    field.input.addEventListener('input', () => {
      if (field.input.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  const sendLead = async (payload) => {
    if (!CONFIG.formEndpoint) {
      console.info('[AIShortFilmz] Demo mode: set CONFIG.formEndpoint in script.js to receive leads.', payload);
      await new Promise((resolve) => setTimeout(resolve, 600));
      return;
    }

    // Web3Forms reads "access_key" and "subject". Formspree reads "_subject".
    const body = CONFIG.accessKey
      ? { ...payload, access_key: CONFIG.accessKey, subject: CONFIG.emailSubject }
      : { ...payload, _subject: CONFIG.emailSubject };

    const response = await fetch(CONFIG.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';

    // Bots fill in the hidden field; people never see it
    if (form.elements.company.value) return;

    const invalidFields = Object.values(fields).filter((field) => !validateField(field));
    if (invalidFields.length) {
      invalidFields[0].input.focus();
      return;
    }

    const payload = {
      name: fields.name.input.value.trim(),
      email: fields.email.input.value.trim(),
      whatsapp: fields.whatsapp.input.value.trim() || 'Not provided',
    };

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    try {
      await sendLead(payload);
      successName.textContent = payload.name.split(' ')[0];
      successMessage.textContent = fields.whatsapp.input.value.trim()
        ? 'Your details are in. Our story team will contact you on WhatsApp or email to brief your project.'
        : 'Your details are in. Our story team will contact you by email to brief your project.';
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (error) {
      console.error(error);
      status.textContent = 'Your details were not sent. Check your connection and try again.';
      submitButton.disabled = false;
      submitButton.textContent = 'Send my details';
    }
  });
}

/* ---------- Back to top and logo ---------- */
function clearHash() {
  try {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch (error) {
    // Some embedded previews block this. The scroll still works.
  }
}

function initPageLinks() {
  // "Back to top" scrolls all the way up
  $$('[data-scroll-top]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      clearHash();
    });
  });

  // The logo reloads the site from the top
  $$('[data-reload]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      clearHash();
      // Browsers restore the scroll position on reload, so jump to the top first.
      // It must be instant: the page's smooth scrolling would still be moving at reload time.
      window.scrollTo({ top: 0, behavior: 'instant' });
      window.location.reload();
    });
  });
}

/* ---------- Start ---------- */
initYear();
initNav();
initPageLinks();
initScrubber();
initSteps();
initForm();
