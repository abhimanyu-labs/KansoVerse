const state = {
  query: '',
  activeFilters: {
    format: 'all',
    status: 'all'
  },
  results: []
}

let isCatalog = false;

const bodyEl = document.body;

const heroSearchFormEl = document.getElementById('hero-search-form');
const compactSearchFormEl = document.getElementById('compact-search-form');
const heroSearchInputEl = document.getElementById('hero-search-input');
const compactSearchInputEl = document.getElementById('compact-search-input');

const navbarEl = document.getElementById('compact-nav');
const navbarLogoEl = document.getElementById('nav-logo');
const popularTagsEl = document.getElementById('popular-tags');

const exploreCatalogBtn = document.getElementById('explore-btn');
const statusEl = document.getElementById('status-message');
const filtersContainerEl = document.querySelector('.filters-container');
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
    this.format = (raw.type || 'unknown').toLowerCase();

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
  compactSearchInputEl.value = isCatalog ? '' : query;
  window.scrollTo({ top: 0, behavior: 'instant'});
}

function resetLandingMode() {
  bodyEl.classList.remove('is-searching');
  navbarEl.classList.add('hidden');
  compactSearchInputEl.value = '';
  heroSearchInputEl.value = '';
  state.query = '';
  state.results = [];
  resultsGridEl.innerHTML = '';
  showStatus(false);
  state.activeFilters.format = 'all';
  state.activeFilters.status = 'all';
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.value === 'all') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  })

}

heroSearchFormEl.addEventListener('submit', event => {
  event.preventDefault();
  const query = heroSearchInputEl.value.trim();
  if (!query) {
    return;
  }
  executeSearch(query);
})

compactSearchFormEl.addEventListener('submit', event => {
  event.preventDefault();
  const query = compactSearchInputEl.value.trim();
  if (!query) {
    return;
  }
  executeSearch(query);
})

popularTagsEl.addEventListener('click', event => {
  const tagEl = event.target;
  if (tagEl.classList.contains('tag-link')) {
    const query = tagEl.textContent.trim();
    if (!query) {
      return;
    }
    executeSearch(query);
  }
})

exploreCatalogBtn.addEventListener('click', () => {
  isCatalog = true;
  executeSearch('top');
})

navbarLogoEl.addEventListener('click', () => {
  resetLandingMode();
})

filtersContainerEl.addEventListener('click', event => {
  if (event.target.classList.contains('filter-btn')) {
    const filterBtn = event.target;
    const {filterType, value} = filterBtn.dataset;
    const previousActiveBtn = filterBtn.parentElement.querySelector('.active');
    previousActiveBtn.classList.remove('active');
    filterBtn.classList.add('active');
    state.activeFilters[filterType] = value;
    const visibleItems = getFilteredResults();
    renderGrid(visibleItems);
  }
})


function showStatus(isVisible, message) {
  if (isVisible) {
    statusEl.textContent = message;
    statusEl.classList.remove('hidden');
  } else {
    statusEl.classList.add('hidden');
    statusEl.textContent = '';
  }
}

async function searchAnime(query) {
  if (!query || !query.trim()) return [];
  const searchString = isCatalog ? '' : `q=${encodeURIComponent(query.trim())}&`;
  try {
    const response = await fetch(
      `https://api.tenrai.org/v1/anime?${searchString}limit=20`
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const rawList = data.data || [];
    
    // Normalize into uniform AnimeItem instances
    const normalized = rawList.map(item => new AnimeItem(item));
    return normalized;
  } catch (err) {
    showStatus(true, `Fetch failed: ${err}`);
    return [];
  }
}

function renderGrid(items) {
  resultsGridEl.innerHTML = '';
  if (!items.length) {
    showStatus(true, 'No results found matching your criteria.')
    return;
  }
  const html = items.map(item => createMediaCard(item)).join('');
  showStatus(false);
  resultsGridEl.innerHTML = html;
}

function createMediaCard(item) {
  const fallbackUrl = "https://placehold.co/300x450/1e2534/5e6b82?text=No+Poster";
  const posterSrc = item.poster || fallbackUrl;
  const html =`
    <article class="media-card" data-id="${item.id}" data-trailer="${item.trailerYoutubeId || ''}">
      <img 
        class="card-poster" 
        src="${posterSrc}" 
        alt="${item.title}" 
        loading="lazy" 
        onerror="this.onerror=null; this.src='${fallbackUrl}';"
      />
      <div class="card-info">
        <h2 class="card-title">${item.title}</h2>
        <p class="card-meta">${item.year} • ${item.type}</p>
      </div>
    </article>`;
  return html;
}

async function executeSearch(query) {
  enterSearchMode(query);
  resultsGridEl.innerHTML = '';
  showStatus(true, 'Searching titles...');
  state.results = await searchAnime(query);
  renderGrid(getFilteredResults());
  if (isCatalog) {
    isCatalog = false;
  }
}

function getFilteredResults() {
  return state.results.filter(item => {
    const matchingFormat = state.activeFilters.format === 'all'
      ? true
      : state.activeFilters.format === 'special'
        ? ['special', 'ova', 'tv special', 'pv'].includes(item.format)
        : item.format === state.activeFilters.format;

    const matchingStatus = state.activeFilters.status === 'all'
      ? true
        : item.status.toLowerCase() === state.activeFilters.status.toLowerCase(); 

    return matchingFormat && matchingStatus;
  })
}