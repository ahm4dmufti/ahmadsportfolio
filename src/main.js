import { ar } from './i18n.js';

const root = document.documentElement;
const heroName = document.getElementById('hero-name');
const langButton = document.getElementById('lang');

const heroWords = {
  en: ['Ahmad', 'El Mufti'],
  ar: ['أحمد', 'المفتي'],
};

const meta = {
  en: {
    title: document.title,
    description: document.querySelector('meta[name="description"]').content,
    heroLabel: 'Ahmad El Mufti',
    button: { text: 'عربي', lang: 'ar', label: 'اقرأ الصفحة بالعربية' },
  },
  ar: {
    title: 'أحمد المفتي، مهندس برمجيات',
    description: 'أحمد المفتي، مهندس برمجيات في بنغازي. مهندس أمن معلومات في بولسار، والرئيس التنفيذي لمعرض المفتي، ومؤسس تك غارد ودارا مان.',
    heroLabel: 'أحمد المفتي',
    button: { text: 'English', lang: 'en', label: 'Read this page in English' },
  },
};

/* Keep the English that ships in the HTML, so the dictionary only has to hold Arabic. */
const textNodes = [...document.querySelectorAll('[data-i18n]')].map((el) => ({ el, key: el.dataset.i18n, en: el.textContent }));
const htmlNodes = [...document.querySelectorAll('[data-i18n-html]')].map((el) => ({ el, key: el.dataset.i18nHtml, en: el.innerHTML }));
const attrNodes = [...document.querySelectorAll('[data-i18n-attr]')].flatMap((el) =>
  el.dataset.i18nAttr.split(';').map((pair) => {
    const [attr, key] = pair.split(':');
    return { el, attr, key, en: el.getAttribute(attr) };
  })
);

/* Latin letters rise one by one; Arabic rises a word at a time, because splitting
   Arabic into letters breaks the joins between them. */
function setHeroWords(lang) {
  heroName.setAttribute('aria-label', meta[lang].heroLabel);
  heroName.replaceChildren(
    ...heroWords[lang].map((word, w, words) => {
      const span = document.createElement('span');
      span.className = 'hero__word';
      span.setAttribute('aria-hidden', 'true');
      if (lang === 'en') {
        const offset = words.slice(0, w).join('').length;
        [...word].forEach((ch, i) => {
          const l = document.createElement('span');
          l.className = 'hero__letter';
          l.style.setProperty('--l', String(offset + i));
          l.textContent = ch;
          span.append(l);
        });
      } else {
        const l = document.createElement('span');
        l.className = 'hero__letter';
        l.style.setProperty('--l', String(w * 3));
        l.textContent = word;
        span.append(l);
      }
      return span;
    })
  );
}

function applyLanguage(lang) {
  const dict = lang === 'ar' ? ar : null;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  for (const n of textNodes) n.el.textContent = dict?.[n.key] ?? n.en;
  for (const n of htmlNodes) n.el.innerHTML = dict?.[n.key] ?? n.en;
  for (const n of attrNodes) n.el.setAttribute(n.attr, dict?.[n.key] ?? n.en);
  setHeroWords(lang);
  document.title = meta[lang].title;
  document.querySelector('meta[name="description"]').content = meta[lang].description;
  const b = meta[lang].button;
  langButton.textContent = b.text;
  langButton.lang = b.lang;
  langButton.setAttribute('aria-label', b.label);
}

function loadArabicFont() {
  if (document.getElementById('font-ar')) return;
  const link = document.createElement('link');
  link.id = 'font-ar';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Amiri&display=swap';
  document.head.append(link);
}

function savedLanguage() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'ar' || q === 'en') return q;
    return localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

/* first paint */
const initial = savedLanguage();
if (initial === 'ar') {
  loadArabicFont();
  applyLanguage('ar');
} else {
  setHeroWords('en');
}
root.classList.remove('pre-ar');

langButton.addEventListener('click', () => {
  const next = root.lang === 'ar' ? 'en' : 'ar';
  if (next === 'ar') loadArabicFont();
  try { localStorage.setItem('lang', next); } catch {}
  const swap = () => applyLanguage(next);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !calm) document.startViewTransition(swap);
  else swap();
});

/* Reveal once as each part enters the viewport. Never replays; never leaves content hidden. */
(() => {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
  addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
    });
  }, 2500));
})();
