// ====== Настройки сайта ======
const CONFIG = {
  pricePerM2: 38000,
  // Телефон компании в формате +7XXXXXXXXXX — показывается в шапке и подвале.
  phone: "+79587866874",
  // Адрес, куда отправлять заявки (обработчик формы / CRM / сервис форм). Пока пусто — заявки никуда не уходят.
  formEndpoint: "",
};

// ====== Меню ======
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }
});

// ====== Калькулятор ======
const $ = (id) => document.getElementById(id);
const rub = (n) => Math.round(n).toLocaleString("ru-RU") + " ₽";

function years(n) {
  const d = n % 10, h = n % 100;
  if (d === 1 && h !== 11) return n + " год";
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return n + " года";
  return n + " лет";
}

function recalc() {
  const area = +$("area").value;
  const downPct = +$("down").value;
  const rate = +$("rate").value;
  const term = +$("term").value;

  const price = area * CONFIG.pricePerM2;
  const down = (price * downPct) / 100;
  const loan = price - down;
  const m = rate / 100 / 12;
  const n = term * 12;
  const pay = loan * (m / (1 - Math.pow(1 + m, -n)));

  $("oArea").textContent = area + " м²";
  $("oDown").textContent = downPct + " %";
  $("oRate").textContent = rate.toLocaleString("ru-RU") + " %";
  $("oTerm").textContent = years(term);
  tween("rPrice", price);
  tween("rDown", down);
  tween("rLoan", loan);
  tween("rPay", pay);
}
["area", "down", "rate", "term"].forEach((id) => $(id).addEventListener("input", recalc));

// ====== Телефон в подвале ======
if (CONFIG.phone) {
  const p = CONFIG.phone.replace(/\D/g, "");
  document.querySelectorAll("[data-phone]").forEach((a) => {
    a.href = "tel:+" + p;
    a.textContent = p.replace(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, "+$1 $2 $3-$4-$5");
    a.hidden = false;
  });
}

// ====== Форма заявки ======
const form = $("form");
const msg = $("formMsg");

function say(text, ok) {
  msg.textContent = text;
  msg.className = "form__msg " + (ok ? "is-ok" : "is-err");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = form.elements.name;
  const phone = form.elements.phone;
  const digits = phone.value.replace(/\D/g, "");
  name.classList.toggle("is-bad", !name.value.trim());
  phone.classList.toggle("is-bad", digits.length < 10);
  if (!name.value.trim() || digits.length < 10) {
    say("Укажите имя и номер телефона — мы перезвоним с расчётом.", false);
    return;
  }
  if (!CONFIG.formEndpoint) {
    say("Приём заявок через сайт ещё не подключён. Позвоните нам: " + document.querySelector("[data-phone]").textContent, false);
    return;
  }
  try {
    const res = await fetch(CONFIG.formEndpoint, { method: "POST", body: new FormData(form) });
    if (!res.ok) throw new Error(res.status);
    form.reset();
    say("Спасибо! Заявка отправлена, мы свяжемся с вами в ближайшее время.", true);
  } catch {
    say("Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.", false);
  }
});

// ====== Анимации ======
// Блоки плавно появляются при прокрутке; соседние карточки — по очереди.
const revealSel = ".section .eyebrow, .section h2, .about__lead, .about__text, .about__side, .why article, .price, .note, .calc__form, .calc__result, " +
  ".includes__lead, .checks li, .includes__pic, .gallery figure, .visit, .steps li, .mortgage__lead, .pay, .review, .form";
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add("is-in");
      io.unobserve(el);
      // после появления убираем задержку, чтобы она не мешала наведению
      setTimeout(() => el.style.removeProperty("--d"), 1400);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(revealSel).forEach((el) => {
    const i = [...el.parentElement.children].indexOf(el);
    el.style.setProperty("--d", Math.min(i, 5) * 0.09 + "s");
    el.classList.add("reveal");
    io.observe(el);
  });
}

// Цифры в калькуляторе плавно «докручиваются» до нового значения
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const shown = {};
function tween(id, to) {
  const el = $(id);
  const from = shown[id] ?? to;
  shown[id] = to;
  if (calm || from === to) { el.textContent = rub(to); return; }
  const t0 = performance.now();
  cancelAnimationFrame(el._raf);
  // страховка: если вкладка в фоне и кадры не рисуются, всё равно показать итог
  clearTimeout(el._fin);
  el._fin = setTimeout(() => { cancelAnimationFrame(el._raf); el.textContent = rub(shown[id]); }, 450);
  (function step(t) {
    const k = Math.min((t - t0) / 350, 1);
    el.textContent = rub(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) el._raf = requestAnimationFrame(step);
  })(t0);
}

recalc();

$("year").textContent = new Date().getFullYear();

