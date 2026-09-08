const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');
const tabs = document.querySelectorAll('.tab');

if ('IntersectionObserver' in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

tabs.forEach((tab) => tab.addEventListener('click', (event) => {
  const target = document.querySelector(tab.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  history.replaceState(null, '', tab.getAttribute('href'));
}));

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    tabs.forEach((tab) => {
      const active = tab.hash === `#${entry.target.id}`;
      tab.classList.toggle('active', active);
      active ? tab.setAttribute('aria-current', 'true') : tab.removeAttribute('aria-current');
    });
  }), { rootMargin: '-35% 0px -55%' });
  document.querySelectorAll('main section[id]').forEach((section) => navObserver.observe(section));
}

document.querySelectorAll('[data-carousel="images"]').forEach((carousel) => {
  const slides = [...carousel.querySelectorAll('.coverflow-slide')];
  const previous = carousel.querySelector('.carousel-prev');
  const next = carousel.querySelector('.carousel-next');
  let activeIndex = 0;

  const render = () => {
    slides.forEach((slide, index) => {
      slide.classList.remove('prev', 'active', 'next');
      const offset = (index - activeIndex + slides.length) % slides.length;
      if (offset === 0) slide.classList.add('active');
      if (offset === slides.length - 1) slide.classList.add('prev');
      if (offset === 1) slide.classList.add('next');
    });
  };

  previous.addEventListener('click', () => { activeIndex = (activeIndex - 1 + slides.length) % slides.length; render(); });
  next.addEventListener('click', () => { activeIndex = (activeIndex + 1) % slides.length; render(); });
  render();
});

document.querySelectorAll('[data-carousel="videos"]').forEach((carousel) => {
  const allSlides = [...carousel.querySelectorAll('.video-slide')];
  const previous = carousel.querySelector('.carousel-prev');
  const next = carousel.querySelector('.carousel-next');
  const stage = carousel.querySelector('.video-stage');
  const filters = [...carousel.parentElement.querySelectorAll('[data-video-filter]')];
  let slides = allSlides;
  let currentFilter = 'all';
  let activeIndex = 0;

  const render = () => {
    allSlides.forEach((slide) => {
      const visible = currentFilter === 'all' || slide.dataset.videoFormat === currentFilter;
      slide.hidden = !visible;
      slide.classList.toggle('active', visible && slides[activeIndex] === slide);
      const video = slide.querySelector('video');
      if (visible && slides[activeIndex] === slide) video.play().catch(() => {});
      else video.pause();
    });
  };

  const applyFilter = (filter) => {
    currentFilter = filter;
    slides = filter === 'all' ? allSlides : allSlides.filter((slide) => slide.dataset.videoFormat === filter);
    activeIndex = 0;
    stage.classList.toggle('square-format', filter === 'square');
    filters.forEach((button) => {
      const active = button.dataset.videoFilter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    render();
  };

  previous.addEventListener('click', () => { activeIndex = (activeIndex - 1 + slides.length) % slides.length; render(); });
  next.addEventListener('click', () => { activeIndex = (activeIndex + 1) % slides.length; render(); });
  filters.forEach((button) => button.addEventListener('click', () => applyFilter(button.dataset.videoFilter)));
  applyFilter('all');
});

// Handle Horizontal Scroll Arrows for Galleries
document.querySelectorAll('[data-gallery]').forEach((gallery) => {
  const track = gallery.querySelector('.gallery-track');
  const prevBtn = gallery.querySelector('.previous');
  const nextBtn = gallery.querySelector('.next');

  if (!track) return;

  const move = (direction) => {
    const slide = [...track.children].find((item) => !item.hidden);
    if (!slide) return;
    track.scrollBy({
      left: direction * (slide.getBoundingClientRect().width + 18),
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  };

  if (prevBtn) prevBtn.addEventListener('click', () => move(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => move(1));
});

// Lazy-load video content on explicit button trigger
document.querySelectorAll('.load-video').forEach((button) => {
  button.addEventListener('click', () => {
    const video = button.parentElement.querySelector('video');
    if (video) {
      if (!video.src && video.dataset.src) {
        video.src = video.dataset.src;
      }
      button.remove();
      video.load();
      video.play().catch(() => {});
    }
  });
});

// Open showcase images in a full-viewport lightbox.
const galleryImages = document.querySelectorAll('.gallery-card img');
const lightbox = document.createElement('div');
lightbox.className = 'image-lightbox';
lightbox.hidden = true;
lightbox.setAttribute('role', 'dialog');
lightbox.setAttribute('aria-modal', 'true');
lightbox.setAttribute('aria-label', 'Expanded image');
lightbox.innerHTML = '<button class="lightbox-back" type="button" aria-label="Back to gallery">←</button><img class="lightbox-image" alt="">';
document.body.appendChild(lightbox);

const lightboxImage = lightbox.querySelector('.lightbox-image');
const lightboxBack = lightbox.querySelector('.lightbox-back');
let lastFocusedImage = null;

const closeLightbox = () => {
  lightbox.hidden = true;
  document.body.classList.remove('lightbox-open');
  if (lastFocusedImage) lastFocusedImage.focus();
};

galleryImages.forEach((image) => {
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', `View ${image.alt} fullscreen`);
  const openLightbox = () => {
    lastFocusedImage = image;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    lightboxBack.focus();
  };
  image.addEventListener('click', openLightbox);
  image.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLightbox();
    }
  });
});

lightboxBack.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
});

// Auto-pause playing videos when a new one starts playing
document.querySelectorAll('video').forEach((video) => {
  video.addEventListener('play', () => {
    document.querySelectorAll('video').forEach((other) => {
      if (other !== video) {
        other.pause();
      }
    });
  });
});

// Handle broken image file links gracefully
document.querySelectorAll('img').forEach((image) => {
  image.addEventListener('error', () => {
    const container = image.closest('figure, .browser-window');
    if (container) {
      container.classList.add('missing-image');
    }
  });
});