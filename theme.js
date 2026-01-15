// theme.js
(function () {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12
  const d = now.getDate();      // 1-31

  // Eksempler (vælg dine egne dage)
  const isChristmas = (m === 12 && (d==23 || d === 24 || d === 25 || d === 26 || d==27));
  const isBirthday  = (m === 1  && d === 13); // eksempel

  // Prioritet: fødselsdag > jul (justér som du vil)
  if (isBirthday) {
    document.body.classList.add("theme-birthday");
    return;
  }

  if (isChristmas) {
    document.body.classList.add("theme-christmas");
  }
})();

(function () {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12
  const d = now.getDate();      // 1-31

  const isValentine = (m === 2 && d === 14);

  if (isValentine) {
    document.body.classList.add("theme-valentine");
  }
})();

