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

class MediaItem {
  constructor() {
    this.id = null;
    this.title = 'Unknown Title';
    this.nativeTitle = '';
    this.year = 'N/A';
    this.type = 'media';
    this.poster = '';
    this.rating = 'N/A';
    this.votes = '';
    this.status = 'Unknown';
    this.duration = 'N/A';
    this.genres = [];
    this.overview = 'No synopsis available.';
    this.trailerYoutubeId = null;
  }
}

class AnimeItem extends MediaItem {
  constructor(raw) {
    super();
    this.id = raw.mal_id;
    this.title = raw.title_english || raw.title || 'Unknown Title';
    this.nativeTitle = raw.title_japanese || '';
    
    // Check raw.year, fall back to aired prop year or parsed date
    this.year = raw.year || raw.aired?.prop?.from?.year || (raw.aired?.from ? new Date(raw.aired.from).getFullYear() : 'N/A');
    this.type = 'anime';
    
    // Use WebP high-res if available, fall back to JPG
    this.poster = raw.images?.webp?.large_image_url || raw.images?.jpg?.large_image_url || '';
    
    this.rating = raw.score ? Number(raw.score).toFixed(1) : 'N/A';
    this.votes = raw.scored_by ? `(${raw.scored_by.toLocaleString()} votes)` : '';
    this.status = raw.status || 'Unknown';
    this.duration = raw.episodes ? `${raw.episodes} eps` : (raw.duration || 'Ongoing');
    
    // Extract genre names into a simple array of strings
    this.genres = Array.isArray(raw.genres) ? raw.genres.map(g => g.name) : [];
    
    this.overview = raw.synopsis || 'No synopsis available.';
    this.trailerYoutubeId = raw.trailer?.youtube_id || null;
  }
}

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

async function searchAnime(query) {
  if (!query || !query.trim()) return [];

  try {
    const response = await fetch(
      `https://api.tenrai.org/v1/anime?q=${encodeURIComponent(query.trim())}&limit=20`
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const rawList = data.data || [];
    
    // Normalize into uniform AnimeItem instances
    const normalized = rawList.map(item => new AnimeItem(item));
    console.log(normalized);
    return normalized;
  } catch (err) {
    console.error('Fetch failed:', err);
    return [];
  }
}

window.searchAnime = searchAnime;
console.log('main.js loaded successfully!');