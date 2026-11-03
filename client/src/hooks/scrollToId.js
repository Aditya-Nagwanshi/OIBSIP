export default function scrollToId(id) {
  const element = document.getElementById(id);
  if (!element) return;

  const lenis = window.__sliceLenis;
  if (lenis) {
    lenis.scrollTo(element, { offset: -90 });
    return;
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
