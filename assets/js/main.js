/* inhouse agency — скрипты сайта. Без библиотек. */

const CONFIG = {
  // Номер счётчика Яндекс.Метрики (цифрами), например 12345678. null — цели не отправляются.
  metrikaId: null,
  // Куда отправлять заявку. На PHP-хостинге работает send.php из этого репозитория.
  // Если сервер не ответил (например, на GitHub Pages), посетитель отправляет заявку в Telegram:
  // текст копируется в буфер и открывается чат.
  endpoint: 'send.php',
  telegram: 'Anthon_Ovdin'
};

document.documentElement.classList.add('js');

const goal = (name) => {
  if (CONFIG.metrikaId && typeof window.ym === 'function') window.ym(CONFIG.metrikaId, 'reachGoal', name);
};

/* Цели на клики по телефону, WhatsApp, почте */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-goal]');
  if (el) goal(el.dataset.goal);
});

/* Шапка: линия при прокрутке */
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* Мобильное меню */
const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');
const setMenu = (open) => {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
  } else {
    menu.classList.remove('is-open');
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 300);
  }
};
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
window.matchMedia('(min-width: 1025px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

/* Появление блоков при прокрутке */
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
  : null;
document.querySelectorAll('.reveal').forEach((el, i) => {
  if (!io) { el.classList.add('is-in'); return; }
  el.style.transitionDelay = `${Math.min((i % 6) * 60, 300)}ms`;
  io.observe(el);
});

/* Маска телефона */
const phone = document.querySelector('input[name="phone"]');
const formatPhone = (v) => {
  let d = v.replace(/\D/g, '');
  if (!d) return '';
  // d — национальная часть номера без +7 / 8
  if (v.trim().startsWith('+7')) d = d.slice(1);
  else if (d[0] === '8' || d[0] === '7') d = d.slice(1);
  if (d.length > 10 && (d[0] === '8' || d[0] === '7')) d = d.slice(1); // набрали 8 после +7
  d = d.slice(0, 10);
  const p = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)];
  let out = '+7';
  if (p[0]) out += ` (${p[0]}`;
  if (p[0].length === 3) out += ')';
  if (p[1]) out += ` ${p[1]}`;
  if (p[2]) out += `-${p[2]}`;
  if (p[3]) out += `-${p[3]}`;
  return out;
};
phone.addEventListener('input', () => { phone.value = formatPhone(phone.value); phone.classList.remove('is-invalid'); });
phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+7 '; });
phone.addEventListener('blur', () => { if (phone.value.replace(/\D/g, '').length <= 1) phone.value = ''; });

/* Форма заявки */
const form = document.getElementById('lead');
const status = form.querySelector('.form__status');
const submitBtn = form.querySelector('button[type="submit"]');
const startedAt = Date.now();

const setStatus = (text, type) => {
  status.textContent = text;
  status.className = 'form__status' + (type ? ` is-${type}` : '');
};

const leadText = (d) => [
  'Здравствуйте! Заявка с сайта inhouse agency.',
  `Имя: ${d.name}`,
  `Телефон: ${d.phone}`,
  d.site && `Сайт: ${d.site}`,
  d.need && `Что нужно: ${d.need}`,
  d.message && `Задача: ${d.message}`
].filter(Boolean).join('\n');

const copyText = async (text) => {
  try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.append(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) {}
  ta.remove();
  return ok;
};

/* Запасной путь без сервера: кнопка копирует текст заявки и открывает чат в Telegram */
const offerTelegram = (d) => {
  const text = leadText(d);
  status.className = 'form__status';
  status.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = 'Заявка готова. Нажмите кнопку — текст скопируется, останется вставить его в чат.';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn--dark btn--sm form__tg';
  btn.textContent = 'Отправить в Telegram';
  btn.addEventListener('click', async () => {
    const copied = await copyText(text);
    window.open(`https://t.me/${CONFIG.telegram}`, '_blank', 'noopener');
    goal('form_telegram');
    p.textContent = copied
      ? 'Текст скопирован. Вставьте его в чат и отправьте — ответим в рабочее время.'
      : `Не получилось скопировать. Напишите нам в Telegram: @${CONFIG.telegram}`;
    status.classList.add('is-ok');
  });
  status.append(p, btn);
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const data = {
    name: (fd.get('name') || '').trim(),
    phone: (fd.get('phone') || '').trim(),
    site: (fd.get('site') || '').trim(),
    need: fd.getAll('need').join(', '),
    message: (fd.get('message') || '').trim(),
    company: fd.get('company') || '',
    elapsed: Date.now() - startedAt
  };

  let ok = true;
  const nameEl = form.elements.name;
  const consentEl = form.elements.consent;
  nameEl.classList.toggle('is-invalid', !data.name);
  if (!data.name) ok = false;
  const digits = data.phone.replace(/\D/g, '');
  phone.classList.toggle('is-invalid', digits.length !== 11);
  if (digits.length !== 11) ok = false;
  consentEl.closest('.consent').classList.toggle('is-invalid', !consentEl.checked);
  if (!consentEl.checked) ok = false;
  if (!ok) { setStatus('Проверьте имя, телефон и согласие на обработку данных', 'err'); return; }
  if (data.company) return; // бот

  submitBtn.disabled = true;
  setStatus('Отправляем…');
  let sent = false;
  try {
    const res = await fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = res.ok ? await res.json().catch(() => null) : null;
    sent = !!(json && json.ok);
  } catch (_) { sent = false; }

  if (sent) {
    goal('form_submit');
    form.reset();
    setStatus('Спасибо! Заявка у нас, свяжемся в рабочее время.', 'ok');
  } else {
    offerTelegram(data);
  }
  submitBtn.disabled = false;
});
['name'].forEach((n) => form.elements[n].addEventListener('input', (e) => e.target.classList.remove('is-invalid')));
form.elements.consent.addEventListener('change', (e) => e.target.closest('.consent').classList.remove('is-invalid'));

/* Cookie-уведомление */
const cookie = document.getElementById('cookie');
let cookieOk = false;
try { cookieOk = localStorage.getItem('cookie-ok') === '1'; } catch (_) {}
if (!cookieOk) {
  cookie.hidden = false;
  cookie.querySelector('button').addEventListener('click', () => {
    cookie.hidden = true;
    try { localStorage.setItem('cookie-ok', '1'); } catch (_) {}
  });
}

/* Год в подвале */
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
