/* =========================
   Catholic Themes Switcher
   - Adds a class to <body> based on dates (local time)
   ========================= */

(function () {
  "use strict";

  // Use local noon to avoid DST edge cases
  function atNoon(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  function inRangeInclusive(d, start, end) {
    const x = d.getTime();
    return x >= start.getTime() && x <= end.getTime();
  }

  // Anonymous Gregorian Computus (Meeus/Jones/Butcher)
  function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return atNoon(new Date(year, month - 1, day));
  }

  // First Sunday of Advent: Sunday between Nov 27 and Dec 3
  function firstSundayOfAdvent(year) {
    for (let day = 27; day <= 33; day++) {
      const d = atNoon(new Date(year, 10, day)); // month 10 = Nov, JS auto-rolls into Dec
      if (d.getDay() === 0) return d; // Sunday
    }
    // fallback (should never happen)
    return atNoon(new Date(year, 10, 27));
  }

  function clearThemeClasses(body) {
    body.classList.remove(
      "theme-lent",
      "theme-easter",
      "theme-ascension",
      "theme-pentecost",
      "theme-corpus",
      "theme-advent",
      "theme-camino"
    );
  }

  function applyTheme() {
    const body = document.body;
    if (!body) return;

    // Manual override (optional)
    const override = localStorage.getItem("themeOverride");
    if (override && override !== "auto") {
      clearThemeClasses(body);
      body.classList.add(override);
      return;
    }

    const today = atNoon(new Date());
    const y = today.getFullYear();

    const easter = easterSunday(y);
    const ashWednesday = addDays(easter, -46);       // 46 days before Easter
    const holySaturday = addDays(easter, -1);        // day before Easter

    const ascension = addDays(easter, 39);           // Easter + 39 days (Thursday)
    const dayBeforeAscension = addDays(ascension, -1);

    const pentecost = addDays(easter, 49);           // Easter + 49 days (Sunday)
    const pentecostMonday = addDays(pentecost, 1);
    const dayBeforePentecost = addDays(pentecost, -1);

    const corpusChristi = addDays(easter, 60);       // Thursday after Trinity Sunday
    const corpusSunday = addDays(corpusChristi, 3);  // Many places observe on Sunday

    const adventStart = firstSundayOfAdvent(y);
    const dec24 = atNoon(new Date(y, 11, 24));       // Dec 24

    const stJames = atNoon(new Date(y, 6, 25));      // July 25
    const stJamesStart = addDays(stJames, -1);       // small buffer (Fri/Sat/Sun feel)
    const stJamesEnd = addDays(stJames, 1);

    clearThemeClasses(body);

    // Priority order matters
    if (inRangeInclusive(today, ashWednesday, holySaturday)) {
      body.classList.add("theme-lent");
      return;
    }

    if (inRangeInclusive(today, easter, dayBeforeAscension)) {
      body.classList.add("theme-easter");
      return;
    }

    if (inRangeInclusive(today, ascension, dayBeforePentecost)) {
      body.classList.add("theme-ascension");
      return;
    }

    if (inRangeInclusive(today, pentecost, pentecostMonday)) {
      body.classList.add("theme-pentecost");
      return;
    }

    if (sameDay(today, corpusChristi) || sameDay(today, corpusSunday)) {
      body.classList.add("theme-corpus");
      return;
    }

    if (inRangeInclusive(today, adventStart, dec24)) {
      body.classList.add("theme-advent");
      return;
    }

    if (inRangeInclusive(today, stJamesStart, stJamesEnd)) {
      body.classList.add("theme-camino");
      return;
    }
  }

  document.addEventListener("DOMContentLoaded", applyTheme);
})();
