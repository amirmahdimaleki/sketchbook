/* =========================================================
   «نامه‌ای برای تو» — حرکت، صدا، و برنامه‌ی قرار
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const body = document.body;
  const scenes = {
    envelope: $('#scene-envelope'),
    photo: $('#scene-photo'),
    letter: $('#scene-letter'),
  };

  const envelope = $('#envelope');
  const polaroid = $('#polaroid');
  const letter = $('#letter');
  const letterScroll = $('#letter-scroll');
  const scrollHint = $('#scroll-hint');
  const backBtn = $('#back');
  const soundBtn = $('#sound');
  const audio = $('#audio');

  let current = 'envelope';
  let busy = false;
  let sceneTimer = null;

  /* =========================================================
     صحنه‌ها
     ========================================================= */

  function setScene(name) {
    current = name;
    body.dataset.scene = name;

    Object.entries(scenes).forEach(([key, el]) => {
      const active = key === name;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
  }

  function afterScene(ms, fn) {
    clearTimeout(sceneTimer);
    sceneTimer = setTimeout(fn, reduceMotion ? 0 : ms);
  }

  /* =========================================================
     پاکت
     ========================================================= */

  function openEnvelope() {
    if (busy || current !== 'envelope') return;
    busy = true;

    envelope.classList.add('is-open');
    burstPetals();

    afterScene(1650, () => {
      setScene('photo');
      busy = false;
      afterScene(700, () => {
        try { polaroid.focus({ preventScroll: true }); } catch (e) {}
      });
    });
  }

  envelope.addEventListener('click', openEnvelope);

  function burstPetals() {
    if (reduceMotion) return;

    const burst = document.createElement('span');
    burst.className = 'burst';
    burst.setAttribute('aria-hidden', 'true');

    const colors = [
      'rgba(208, 149, 157, .95)',
      'rgba(167, 101, 111, .9)',
      'rgba(236, 211, 207, .95)',
      'rgba(208, 171, 114, .6)',
    ];

    for (let i = 0; i < 11; i++) {
      const petal = document.createElement('span');
      const angle = -70 + Math.random() * 140;
      const dist = -(46 + Math.random() * 46);
      petal.style.setProperty('--bw', (5 + Math.random() * 6).toFixed(1) + 'px');
      petal.style.setProperty('--bc', colors[i % colors.length]);
      petal.style.setProperty('--br', angle.toFixed(0) + 'deg');
      petal.style.setProperty('--bdist', dist.toFixed(0) + 'px');
      petal.style.setProperty('--bdx', ((Math.random() - 0.5) * 90).toFixed(0) + 'px');
      petal.style.setProperty('--bd', (1.1 + Math.random() * 0.7).toFixed(2) + 's');
      petal.style.setProperty('--bdelay', (0.05 + Math.random() * 0.18).toFixed(2) + 's');
      burst.appendChild(petal);
    }

    envelope.querySelector('.envelope__inner').appendChild(burst);
    setTimeout(() => burst.remove(), 2200);
  }

  /* =========================================================
     عکس
     ========================================================= */

  function openLetter() {
    if (busy || current !== 'photo') return;
    busy = true;

    polaroid.classList.add('is-going');

    afterScene(640, () => {
      setScene('letter');
      busy = false;
      letterScroll.scrollTop = 0;
      requestAnimationFrame(updateScrollState);
      afterScene(350, () => {
        updateScrollState();
        revealVisible();
      });
    });
  }

  polaroid.addEventListener('click', openLetter);

  /* شیبِ نرمِ عکس سمتِ نشانگر */
  if (finePointer && !reduceMotion) {
    let raf = 0;

    polaroid.addEventListener('pointermove', (event) => {
      if (polaroid.classList.contains('is-going')) return;
      const rect = polaroid.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        polaroid.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
        polaroid.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
      });
    });

    polaroid.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      polaroid.style.setProperty('--rx', '0deg');
      polaroid.style.setProperty('--ry', '0deg');
    });
  }

  /* =========================================================
     نامه
     ========================================================= */

  function goBack() {
    if (busy) return;
    busy = true;

    /* عکس نباید در حالتِ «برداشته‌شده» بماند */
    polaroid.classList.remove('is-going');
    polaroid.style.setProperty('--rx', '0deg');
    polaroid.style.setProperty('--ry', '0deg');

    setScene('photo');

    afterScene(500, () => {
      busy = false;
      try { polaroid.focus({ preventScroll: true }); } catch (e) {}
    });
  }

  backBtn.addEventListener('click', goBack);

  function revealVisible() {
    const box = letterScroll.getBoundingClientRect();
    $$('.letter__body p, .letter__greet, .letter__sign', letter).forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < box.bottom + 40 && rect.bottom > box.top - 40) {
        el.classList.add('is-in');
      }
    });
  }

  let observer = null;

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const siblings = Array.from(el.parentElement.children).filter((n) =>
            n.matches('.letter__body p, .letter__greet')
          );
          const index = Math.max(0, siblings.indexOf(el)) % 3;
          el.style.transitionDelay = reduceMotion ? '0s' : 0.06 * index + 's';
          el.classList.add('is-in');
          observer.unobserve(el);
        });
      },
      { root: letterScroll, rootMargin: '0px 0px -6% 0px', threshold: 0.12 }
    );

    $$('.letter__body p, .letter__greet, .letter__sign', letter).forEach((el) => {
      observer.observe(el);
    });
  } else {
    $$('.letter__body p, .letter__greet, .letter__sign', letter).forEach((el) => {
      el.classList.add('is-in');
    });
  }

  function updateScrollState() {
    if (!letterScroll) return;
    const max = letterScroll.scrollHeight - letterScroll.clientHeight;
    const top = letterScroll.scrollTop;
    letter.classList.toggle('is-scrollable', max > 70);
    letter.classList.toggle('is-at-end', max <= 70 || top >= max - 30);
    letter.classList.toggle('is-scrolled', top > 14);
  }

  letterScroll.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState);

  scrollHint.addEventListener('click', () => {
    letterScroll.scrollBy({
      top: Math.round(letterScroll.clientHeight * 0.78),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  });

  document.addEventListener('keydown', (event) => {
    if (current !== 'letter' || planner.open) return;

    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
      if (document.activeElement === scrollHint || document.activeElement === backBtn) return;
      const atEnd = letterScroll.scrollTop >= letterScroll.scrollHeight - letterScroll.clientHeight - 2;
      if (!atEnd) {
        event.preventDefault();
        letterScroll.scrollBy({
          top: letterScroll.clientHeight * (event.key === ' ' ? 0.8 : 0.35),
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
      }
    }

    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      if (letterScroll.scrollTop > 0) {
        event.preventDefault();
        letterScroll.scrollBy({
          top: -letterScroll.clientHeight * (event.key === 'PageUp' ? 0.8 : 0.35),
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || busy || planner.open) return;

    if (current === 'letter') goBack();
    else if (current === 'photo') {
      setScene('envelope');
      setTimeout(() => {
        envelope.classList.remove('is-open');
        polaroid.classList.remove('is-going');
      }, reduceMotion ? 0 : 850);
    }
  });

  /* =========================================================
     ذرات، برف و نورِ نشانگر
     ========================================================= */

  (function ambient() {
    if (reduceMotion) return;
    const host = $('#ambient');
    if (!host) return;

    const orbs = [
      { x: '-8%', y: '6%', s: '52vmin', c: 'rgba(208, 149, 157, .22)', d: '30s' },
      { x: '72%', y: '-6%', s: '48vmin', c: 'rgba(208, 171, 114, .16)', d: '36s' },
      { x: '58%', y: '66%', s: '60vmin', c: 'rgba(123, 74, 95, .18)', d: '42s' },
      { x: '-12%', y: '64%', s: '44vmin', c: 'rgba(36, 80, 68, .16)', d: '34s' },
    ];

    orbs.forEach((o) => {
      const el = document.createElement('span');
      el.className = 'ambient__orb';
      el.style.left = o.x;
      el.style.top = o.y;
      el.style.width = o.s;
      el.style.height = o.s;
      el.style.background = `radial-gradient(circle at 50% 50%, ${o.c}, transparent 68%)`;
      el.style.setProperty('--dur', o.d);
      host.appendChild(el);
    });

    const small = window.innerWidth < 640;
    const moteCount = small ? 12 : 18;

    for (let i = 0; i < moteCount; i++) {
      const el = document.createElement('span');
      el.className = 'ambient__mote';
      el.style.left = (Math.random() * 100).toFixed(2) + '%';
      el.style.setProperty('--s', (2 + Math.random() * 4).toFixed(1) + 'px');
      el.style.setProperty('--dur', (28 + Math.random() * 26).toFixed(1) + 's');
      el.style.setProperty('--delay', (-Math.random() * 40).toFixed(1) + 's');
      el.style.setProperty('--dx', ((Math.random() - 0.4) * 10).toFixed(1) + 'vw');
      el.style.setProperty('--o', (0.22 + Math.random() * 0.26).toFixed(2));
      host.appendChild(el);
    }

    for (let i = 0; i < (small ? 3 : 5); i++) {
      const el = document.createElement('span');
      el.className = 'ambient__petal';
      el.style.left = (Math.random() * 96).toFixed(2) + '%';
      el.style.setProperty('--w', (8 + Math.random() * 8).toFixed(1) + 'px');
      el.style.setProperty('--dur', (32 + Math.random() * 24).toFixed(1) + 's');
      el.style.setProperty('--delay', (-Math.random() * 46).toFixed(1) + 's');
      el.style.setProperty('--dx', ((Math.random() - 0.5) * 16).toFixed(1) + 'vw');
      host.appendChild(el);
    }
  })();

  (function snow() {
    if (reduceMotion) return;
    const host = $('#snow');
    if (!host) return;

    const count = window.innerWidth < 640 ? 12 : 18;

    for (let i = 0; i < count; i++) {
      const flake = document.createElement('span');
      flake.className = 'snow__flake';
      flake.style.left = (Math.random() * 100).toFixed(2) + '%';
      flake.style.setProperty('--s', (1.6 + Math.random() * 3).toFixed(1) + 'px');
      flake.style.setProperty('--dur', (9 + Math.random() * 9).toFixed(1) + 's');
      flake.style.setProperty('--delay', (-Math.random() * 18).toFixed(1) + 's');
      flake.style.setProperty('--dx', ((Math.random() - 0.5) * 26).toFixed(0) + 'px');
      flake.style.opacity = (0.45 + Math.random() * 0.45).toFixed(2);
      host.appendChild(flake);
    }

    const setTravel = () => {
      host.style.setProperty('--travel', Math.round(host.clientHeight + 24) + 'px');
    };
    setTravel();
    window.addEventListener('resize', setTravel);
  })();

  if (finePointer && !reduceMotion) {
    const glow = $('#cursor-glow');
    if (glow) {
      let tx = window.innerWidth / 2;
      let ty = window.innerHeight * 0.55;
      let cx = tx;
      let cy = ty;
      let active = false;

      window.addEventListener('pointermove', (event) => {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        tx = event.clientX;
        ty = event.clientY;
        if (!active) {
          active = true;
          body.classList.add('has-pointer');
        }
      }, { passive: true });

      (function loop() {
        cx += (tx - cx) * 0.075;
        cy += (ty - cy) * 0.075;
        glow.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
        requestAnimationFrame(loop);
      })();
    }
  }

  /* =========================================================
     برنامه‌ی قرار
     ========================================================= */

  const planner = $('#planner');
  const dateForm = $('#date-form');
  const plannerBody = $('#planner-body');
  const stepsEl = $('#steps');
  const prevBtn = $('#prev');
  const nextBtn = $('#next');
  const submitBtn = $('#submit');
  const activityError = $('#activity-error');
  const timeError = $('#time-error');
  const sendError = $('#send-error');
  const noteInput = $('#note');
  const summaryEl = $('#summary');
  const mailtoFallback = $('#mailto-fallback');
  const plannerTiny = $('.planner__tiny');

  const dateBtn = $('#date-btn');
  const dateBtnText = $('#date-btn-text');
  const hourSel = $('#hour');
  const minuteSel = $('#minute');
  const dateFa = $('#date-fa');
  const calendarEl = $('#calendar');
  const calMonthEl = $('#cal-month');
  const calGrid = $('#cal-grid');
  const calPrev = $('#cal-prev');
  const calNext = $('#cal-next');
  const calClose = $('#cal-close');

  const OWNER = ['kind7shark', 'gmail.com'].join(String.fromCharCode(64));
  const STORAGE_KEY = 'baraye-to-last-date-plan';
  const TOTAL_STEPS = 3;
  const MS = 86400000;
  const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

  let step = 1;
  let sending = false;
  let selectedDate = null;
  let calYear = 0;
  let calMonth = 0;

  const faDigits = (value) => String(value).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  const pad2 = (value) => String(value).padStart(2, '0');

  const jFmt = (() => {
    try {
      return new Intl.DateTimeFormat('en-US-u-ca-persian', {
        year: 'numeric', month: 'numeric', day: 'numeric',
      });
    } catch (err) {
      return null;
    }
  })();

  function jalaliFromDate(date) {
    if (!jFmt) return null;
    const parts = jFmt.formatToParts(date);
    const pick = (type) => Number((parts.find((p) => p.type === type) || {}).value);
    return { y: pick('year'), m: pick('month'), d: pick('day') };
  }

  const monthStartCache = new Map();

  function gregorianForJalali(jy, jm, jd = 1) {
    const monthKey = jy + '-' + jm;
    let start = monthStartCache.get(monthKey);

    if (!start) {
      /* اولِ ماهِ شمسی حدودِ اوایلِ همان ماهِ میلادیِ +۲ است */
      const guess = new Date(jy + 621, jm + 1, 1, 12);
      let found = null;

      for (let i = 0; i < 46; i++) {
        const candidate = new Date(guess.getTime() + i * MS);
        const p = jalaliFromDate(candidate);
        if (p && p.y === jy && p.m === jm && p.d === 1) {
          found = candidate;
          break;
        }
      }

      if (!found) return null;
      monthStartCache.set(monthKey, found);
      start = found;
    }

    return new Date(start.getTime() + (jd - 1) * MS);
  }

  function monthLength(jy, jm) {
    const start = gregorianForJalali(jy, jm, 1);
    const next = jm === 12 ? gregorianForJalali(jy + 1, 1, 1) : gregorianForJalali(jy, jm + 1, 1);
    if (!start || !next) return 30;
    return Math.round((next.getTime() - start.getTime()) / MS);
  }

  function weekdayName(date) {
    return WEEKDAYS[(date.getDay() + 1) % 7];
  }

  function formatJalali(jy, jm, jd, withWeekday = true) {
    const date = gregorianForJalali(jy, jm, jd);
    const dayName = date ? weekdayName(date) + ' ' : '';
    return (withWeekday ? dayName : '') + faDigits(jd) + ' ' + MONTHS[jm - 1] + ' ' + faDigits(jy);
  }

  function todayJalali() {
    return jalaliFromDate(new Date()) || { y: 1405, m: 1, d: 1 };
  }

  function isPast(y, m, d) {
    const t = todayJalali();
    if (y !== t.y) return y < t.y;
    if (m !== t.m) return m < t.m;
    return d < t.d;
  }

  function nextFridayParts() {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    do {
      d.setDate(d.getDate() + 1);
    } while (d.getDay() !== 5);

    return jalaliFromDate(d) || todayJalali();
  }

  function timeValue() {
    return pad2(hourSel.value) + ':' + pad2(minuteSel.value);
  }

  function updateDateUI() {
    if (!selectedDate) {
      dateBtnText.textContent = 'انتخاب روز';
      dateFa.textContent = '';
      return;
    }

    const { y, m, d } = selectedDate;
    dateBtnText.textContent = faDigits(d) + ' ' + MONTHS[m - 1] + ' ' + faDigits(y);

    const date = gregorianForJalali(y, m, d);
    dateFa.textContent = date
      ? weekdayName(date) + ' · ' + faDigits(d) + ' ' + MONTHS[m - 1] + ' ' + faDigits(y) +
        ' · ساعت ' + faDigits(timeValue())
      : '';
  }

  function fillTimeSelects() {
    for (let h = 0; h < 24; h++) {
      const option = document.createElement('option');
      option.value = String(h);
      option.textContent = faDigits(pad2(h));
      hourSel.appendChild(option);
    }

    [0, 15, 30, 45].forEach((min) => {
      const option = document.createElement('option');
      option.value = String(min);
      option.textContent = faDigits(pad2(min));
      minuteSel.appendChild(option);
    });

    hourSel.value = '20';
    minuteSel.value = '0';
  }

  function renderCalendar(jy, jm) {
    calYear = jy;
    calMonth = jm;
    calMonthEl.textContent = MONTHS[jm - 1] + ' ' + faDigits(jy);

    const start = gregorianForJalali(jy, jm, 1);
    if (!start) {
      calGrid.textContent = '';
      return;
    }

    const lead = (start.getDay() + 1) % 7;
    const length = monthLength(jy, jm);
    const today = todayJalali();

    calGrid.textContent = '';

    for (let i = 0; i < lead; i++) {
      const blank = document.createElement('span');
      blank.className = 'calendar__blank';
      calGrid.appendChild(blank);
    }

    for (let d = 1; d <= length; d++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'calendar__day';
      btn.textContent = faDigits(d);
      btn.setAttribute('aria-label', formatJalali(jy, jm, d));

      if (isPast(jy, jm, d)) btn.disabled = true;
      if (jy === today.y && jm === today.m && d === today.d) btn.classList.add('is-today');

      const isSelected = selectedDate &&
        selectedDate.y === jy && selectedDate.m === jm && selectedDate.d === d;
      if (isSelected) {
        btn.classList.add('is-selected');
        btn.setAttribute('aria-current', 'date');
      }

      btn.addEventListener('click', () => pickDay(jy, jm, d));
      calGrid.appendChild(btn);
    }

    const cells = lead + length;
    for (let i = cells; i % 7 !== 0; i++) {
      const blank = document.createElement('span');
      blank.className = 'calendar__blank';
      calGrid.appendChild(blank);
    }
  }

  function openCalendar() {
    if (!selectedDate) initializeDate();
    if (!calYear) {
      calYear = selectedDate ? selectedDate.y : todayJalali().y;
      calMonth = selectedDate ? selectedDate.m : todayJalali().m;
    }

    renderCalendar(calYear, calMonth);
    calendarEl.hidden = false;
    dateBtn.setAttribute('aria-expanded', 'true');
  }

  function closeCalendar() {
    calendarEl.hidden = true;
    dateBtn.setAttribute('aria-expanded', 'false');
  }

  function pickDay(y, m, d) {
    selectedDate = { y, m, d };
    updateDateUI();
    closeCalendar();
    timeError.hidden = true;
    try { dateBtn.focus({ preventScroll: true }); } catch (err) {}
  }

  function initializeDate() {
    const p = nextFridayParts();
    selectedDate = { y: p.y, m: p.m, d: p.d };
    calYear = p.y;
    calMonth = p.m;
    updateDateUI();
  }

  function highlightQuick() {
    const now = timeValue();
    $$('.quick', dateForm).forEach((btn) => {
      btn.classList.toggle('is-on', btn.dataset.time === now);
    });
  }

  function selectedActivities() {
    return $$('input[name="activity"]:checked', dateForm).map((input) => input.value);
  }

  function setStep(next) {
    step = next;

    $$('.pstep', dateForm).forEach((section) => {
      section.classList.toggle('is-active', Number(section.dataset.step) === next);
    });

    if (next <= TOTAL_STEPS) {
      $$('.steps__dot', stepsEl).forEach((dot, index) => {
        dot.classList.toggle('is-on', index < next);
      });
    }

    prevBtn.hidden = next === 1 || next > TOTAL_STEPS;
    nextBtn.hidden = next >= TOTAL_STEPS || next > TOTAL_STEPS;
    submitBtn.hidden = next !== TOTAL_STEPS;
    planner.classList.toggle('is-done', next > TOTAL_STEPS);
    plannerTiny.style.visibility = next > TOTAL_STEPS ? 'hidden' : 'visible';

    if (next !== 1) activityError.hidden = true;
    if (next !== 2) timeError.hidden = true;
    if (next !== 3) sendError.hidden = true;

    if (next !== 2) closeCalendar();

    plannerBody.scrollTop = 0;

    if (next === 2) {
      if (!selectedDate) initializeDate();
      highlightQuick();
      updateDateUI();
    }

    if (next === 3) buildSummary();

    const active = $('.pstep.is-active', dateForm);
    if (active) {
      active.classList.remove('is-active');
      void active.offsetWidth;
      active.classList.add('is-active');
    }
  }

  function validateStep1() {
    const ok = selectedActivities().length > 0;
    activityError.hidden = ok;
    return ok;
  }

  function validateStep2() {
    const ok = Boolean(selectedDate && hourSel.value !== '' && minuteSel.value !== '');
    timeError.hidden = ok;

    if (!ok) timeError.textContent = 'روز و ساعت رو انتخاب کن.';
    return ok;
  }

  function buildSummary() {
    summaryEl.textContent = '';

    const rows = [
      ['برنامه', selectedActivities().join('، ')],
      ['تاریخ', selectedDate ? formatJalali(selectedDate.y, selectedDate.m, selectedDate.d) : '—'],
      ['ساعت', faDigits(timeValue())],
    ];

    if (noteInput.value.trim()) rows.push(['یادداشت', noteInput.value.trim()]);

    rows.forEach(([label, value]) => {
      const li = document.createElement('li');
      const l = document.createElement('span');
      l.className = 'summary__label';
      l.textContent = label;
      const v = document.createElement('span');
      v.className = 'summary__value';
      v.textContent = value;
      li.append(l, v);
      summaryEl.appendChild(li);
    });
  }

  function openPlanner(trigger) {
    if (planner.open) return;
    planner.dataset.trigger = trigger ? trigger.id : '';

    if (step === 4) resetPlanner();

    if (!selectedDate) initializeDate();
    highlightQuick();

    if (typeof planner.showModal === 'function') planner.showModal();
    else planner.setAttribute('open', '');

    planner.setAttribute('tabindex', '-1');
    try { planner.focus({ preventScroll: true }); } catch (err) {}

    setStep(1);
    requestAnimationFrame(() => {
      plannerBody.scrollTop = 0;
    });
  }

  function closePlanner() {
    if (typeof planner.close === 'function') planner.close();
    else planner.removeAttribute('open');
  }

  function resetPlanner() {
    dateForm.reset();
    closeCalendar();
    selectedDate = null;
    initializeDate();
    hourSel.value = '20';
    minuteSel.value = '0';
    summaryEl.textContent = '';
    activityError.hidden = true;
    timeError.hidden = true;
    sendError.hidden = true;
    updateDateUI();
    highlightQuick();
    setStep(1);
  }

  fillTimeSelects();
  initializeDate();
  highlightQuick();

  $('#plan-open').addEventListener('click', (event) => openPlanner(event.currentTarget));
  $('#plan-open-letter').addEventListener('click', (event) => openPlanner(event.currentTarget));

  $$('[data-close]', planner).forEach((btn) => {
    btn.addEventListener('click', closePlanner);
  });

  planner.addEventListener('click', (event) => {
    if (event.target === planner) closePlanner();
  });

  planner.addEventListener('close', () => {
    if (step === 4) resetPlanner();
  });

  planner.addEventListener('cancel', () => {
    setTimeout(() => {
      if (step === 4) resetPlanner();
    }, 0);
  });

  prevBtn.addEventListener('click', () => {
    if (step > 1) setStep(step - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  });

  dateBtn.addEventListener('click', () => {
    if (calendarEl.hidden) openCalendar();
    else closeCalendar();
  });

  calPrev.addEventListener('click', () => {
    let y = calYear;
    let m = calMonth - 1;
    if (m < 1) { m = 12; y -= 1; }
    renderCalendar(y, m);
  });

  calNext.addEventListener('click', () => {
    let y = calYear;
    let m = calMonth + 1;
    if (m > 12) { m = 1; y += 1; }
    renderCalendar(y, m);
  });

  calClose.addEventListener('click', () => {
    closeCalendar();
    try { dateBtn.focus({ preventScroll: true }); } catch (err) {}
  });

  hourSel.addEventListener('change', () => { updateDateUI(); highlightQuick(); });
  minuteSel.addEventListener('change', () => { updateDateUI(); highlightQuick(); });

  $$('.quick', dateForm).forEach((btn) => {
    btn.addEventListener('click', () => {
      const [h, m] = btn.dataset.time.split(':');
      hourSel.value = String(Number(h));
      minuteSel.value = String(Number(m));
      updateDateUI();
      highlightQuick();
    });
  });

  dateForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (sending) return;

    if (step < 3) {
      if (step === 1 && validateStep1()) setStep(2);
      else if (step === 2 && validateStep2()) setStep(3);
      return;
    }

    sendPlan();
  });

  async function sendPlan() {
    if (sending || !selectedDate) return;

    const activities = selectedActivities();
    const when = formatJalali(selectedDate.y, selectedDate.m, selectedDate.d);
    const clock = faDigits(timeValue());
    const note = noteInput.value.trim();
    const planText =
      'برنامه: ' + activities.join('، ') + '\n' +
      'تاریخ: ' + when + '\n' +
      'ساعت: ' + clock + '\n' +
      (note ? 'یادداشت: ' + note + '\n' : '');

    try {
      localStorage.setItem(STORAGE_KEY, planText);
    } catch (err) {}

    mailtoFallback.href = 'mailto:' + OWNER +
      '?subject=' + encodeURIComponent('قرار بعدیِ ما 💌') +
      '&body=' + encodeURIComponent(planText);

    sending = true;
    sendError.hidden = true;
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      /* Netlify Forms — ایمیلِ نتیجه از تنظیماتِ سایت فعال می‌شود */
      const payload = new URLSearchParams({
        'form-name': 'date-plan',
        'bot-field': '',
        activities: activities.join('، '),
        date: when,
        time: clock,
        note: note || '—',
      });

      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error('send failed');

      setStep(4);
    } catch (err) {
      sendError.hidden = false;
    } finally {
      clearTimeout(timeout);
      sending = false;
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    }
  }

  /* =========================================================
     موسیقی (اختیاری)
     ========================================================= */

  (function music() {
    if (!soundBtn || !audio) return;

    fetch('assets/music.mp3', { method: 'HEAD' })
      .then((res) => {
        if (res.ok) soundBtn.hidden = false;
      })
      .catch(() => {});

    let playing = false;
    let fadeId = 0;

    function fadeTo(target, done) {
      clearInterval(fadeId);
      fadeId = setInterval(() => {
        const diff = target - audio.volume;
        if (Math.abs(diff) < 0.03) {
          audio.volume = target;
          clearInterval(fadeId);
          if (done) done();
          return;
        }
        audio.volume = Math.min(1, Math.max(0, audio.volume + diff * 0.18));
      }, 60);
    }

    soundBtn.addEventListener('click', async () => {
      if (!playing) {
        try {
          audio.volume = 0;
          await audio.play();
          playing = true;
          soundBtn.classList.add('is-playing');
          soundBtn.setAttribute('aria-pressed', 'true');
          soundBtn.setAttribute('aria-label', 'قطعِ موسیقی');
          fadeTo(0.5);
        } catch (err) {
          soundBtn.hidden = true;
        }
      } else {
        playing = false;
        soundBtn.classList.remove('is-playing');
        soundBtn.setAttribute('aria-pressed', 'false');
        soundBtn.setAttribute('aria-label', 'پخشِ موسیقی');
        fadeTo(0, () => audio.pause());
      }
    });

    audio.addEventListener('ended', () => {
      playing = false;
      soundBtn.classList.remove('is-playing');
      soundBtn.setAttribute('aria-pressed', 'false');
    });
  })();

  /* =========================================================
     آغاز
     ========================================================= */

  setScene('envelope');
  letterScroll.setAttribute('tabindex', '-1');
})();
