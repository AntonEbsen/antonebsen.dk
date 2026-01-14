// scripts.js
document.addEventListener('DOMContentLoaded', function() {
    const tocLinks = document.querySelectorAll('.toc a');
    const sections = Array.from(tocLinks).map(link => document.querySelector(link.getAttribute('href')));

    window.addEventListener('scroll', function() {
        let index = sections.length;

        while (--index && window.scrollY + 50 < sections[index].offsetTop) {}

        tocLinks.forEach(link => link.classList.remove('active'));
        if (index >= 0) tocLinks[index].classList.add('active');
    });
});

function applyTocStateFromStorage() {
  const wrap = document.querySelector(".cv-wrap");
  const btn = document.getElementById("tocToggle");
  if (!wrap || !btn) return;

  const collapsed = localStorage.getItem("tocCollapsed") === "1";
  wrap.classList.toggle("is-toc-collapsed", collapsed);
  btn.setAttribute("aria-expanded", String(!collapsed));
}

function toggleToc() {
  const wrap = document.querySelector(".cv-wrap");
  const btn = document.getElementById("tocToggle");
  if (!wrap || !btn) return;

  const nowCollapsed = wrap.classList.toggle("is-toc-collapsed");
  btn.setAttribute("aria-expanded", String(!nowCollapsed));
  localStorage.setItem("tocCollapsed", nowCollapsed ? "1" : "0");
}

document.addEventListener("DOMContentLoaded", applyTocStateFromStorage);

<script>
  document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll(".navbar .has-dropdown > .nav-link");

    items.forEach(link => {
      link.addEventListener("click", (e) => {
        // På desktop skal linket stadig kunne navigere normalt.
        // På mobil toggler vi dropdown.
        if (window.matchMedia("(max-width: 980px)").matches) {
          e.preventDefault();
          const parent = link.parentElement;
          parent.classList.toggle("open");
        }
      });
    });

    // Luk dropdown hvis man klikker udenfor
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".navbar .has-dropdown")) {
        document.querySelectorAll(".navbar .has-dropdown.open")
          .forEach(x => x.classList.remove("open"));
      }
    });
  });
</script>

