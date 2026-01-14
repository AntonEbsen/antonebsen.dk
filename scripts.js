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

function toggleToc() {
  const toc = document.getElementById("toc");
  if (!toc) return;
  toc.classList.toggle("is-hidden");
}

