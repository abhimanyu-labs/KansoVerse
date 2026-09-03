const state = {
  query: '',
  activeFilter: 'all',
  results: []
}

const bodyEl = document.body;

const heroSearchFormEl = document.getElementById('hero-search-form');
const compactSearchFormEl = document.getElementById('compact-search-form');
const heroSearchInputEl = document.getElementById('hero-search-input');
const compactSearchInputEl = document.getElementById('compact-search-input');

const navbarEl = document.getElementById('compact-nav');
const navbarLogoEl = document.getElementById('nav-logo');
const popularTagsEl = document.getElementById('popular-tags');

const exploreCatalogBtn = document.getElementById('explore-btn');

const resultsGridEl = document.getElementById('results-grid');

function enterSearchMode(query) {
  state.query = query;
  bodyEl.classList.add('is-searching');
  navbarEl.classList.remove('hidden');
  compactSearchInputEl.value = query;
  window.scrollTo({ top: 0, behavior: 'instant'});
}

function resetLandingMode() {
  bodyEl.classList.remove('is-searching');
  navbarEl.classList.add('hidden');
  compactSearchInputEl.value = '';
  heroSearchInputEl.value = '';
  state.query = '';
  state.activeFilter = 'all';
  state.results = [];
  resultsGridEl.innerHTML = '';
}

heroSearchFormEl.addEventListener('submit', event => {
  event.preventDefault();
  const query = heroSearchInputEl.value.trim();
  if (!query) {
    return;
  }
  enterSearchMode(query);
})

compactSearchFormEl.addEventListener('submit', event => {
  event.preventDefault();
  const query = compactSearchInputEl.value.trim();
  if (!query) {
    return;
  }
  enterSearchMode(query);
})

popularTagsEl.addEventListener('click', event => {
  const tagEl = event.target;
  if (tagEl.classList.contains('tag-link')) {
    const query = tagEl.textContent.trim();
    if (!query) {
      return;
    }
    enterSearchMode(query);
  }
})

exploreCatalogBtn.addEventListener('click', () => {
  enterSearchMode('');
})

navbarLogoEl.addEventListener('click', () => {
  resetLandingMode();
})