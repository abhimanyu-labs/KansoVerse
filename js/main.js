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
const filtersContainerEl = document.querySelector('.js-filters-container');
const resultsGridEl = document.getElementById('results-grid');

const detailModalEl = document.getElementById('detail-modal');
const closeDetailBtn = document.getElementById('close-detail-btn');

const modalPosterEl = document.getElementById('modal-poster');
const modalTitleEl = document.getElementById('modal-title');
const modalNativeTitleEl = document.getElementById('modal-native-title');

const modalYearEl = document.getElementById('modal-year');
const modalTypeEl = document.getElementById('modal-type');
const modalStatusEl = document.getElementById('modal-status');
const modalDurationEl = document.getElementById('modal-duration');

const modalRatingEl = document.getElementById('modal-rating');
const modalVotesEl = document.getElementById('modal-votes');

const modalGenresEl = document.getElementById('modal-genres');
const modalOverviewEl = document.getElementById('modal-overview');
const overviewToggleBtn = document.getElementById('overview-toggle-btn');

const trailerIframeEl = document.getElementById('trailer-iframe');
const trailerSectionEl = document.getElementById('trailer-section');
const videoWrapperEl = document.querySelector('.js-video-wrapper');
const noTrailerMsgEl = document.getElementById('no-trailer-msg');

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
    this.nativeTitle = raw.title_japanese || 'Unknown Title';
    
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
  document.querySelectorAll('.js-filter-btn').forEach(btn => {
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

resultsGridEl.addEventListener('click', event => {
  if (event.target.closest('.media-card')) {
    const mediaCardEl = event.target.closest('.media-card');
    const { id } = mediaCardEl.dataset;
    const matchingMediaItem = state.results.find(mediaItem => Number(id) === mediaItem.id);
    if (!matchingMediaItem) {
      return;
    }
    openMediaModal(matchingMediaItem);
  }
});

closeDetailBtn.addEventListener('click', () => {
  closeMediaModal();
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

function openMediaModal(mediaItem) {
  const {poster, title, nativeTitle, year, type, status, duration, rating, votes, genres, overview, trailerYoutubeId} = mediaItem;

  modalPosterEl.src = poster;
  modalTitleEl.textContent = title;
  modalNativeTitleEl.textContent = nativeTitle;
  modalYearEl.textContent = year;
  modalTypeEl.textContent = type;
  modalStatusEl.textContent = status;
  modalDurationEl.textContent = duration;
  modalRatingEl.textContent = rating;
  modalVotesEl.textContent = votes;
  modalOverviewEl.textContent = overview;

  modalOverviewEl.classList.add('collapsed');

  if (overview && overview.length > 200) {
    overviewToggleBtn.textContent = 'Read More';
    overviewToggleBtn.classList.remove('hidden');
  } else {
    modalOverviewEl.classList.remove('collapsed');
    overviewToggleBtn.classList.add('hidden');
  }

  modalGenresEl.innerHTML = genres
    .map(genre => `<span class="genre-pill">${genre}</span>`)
    .join('');

  if (trailerYoutubeId) {
    trailerIframeEl.src = `https://www.youtube-nocookie.com/embed/${trailerYoutubeId}?autoplay=1`;
    videoWrapperEl.classList.remove('hidden');
    noTrailerMsgEl.classList.add('hidden');
  } else {
    trailerIframeEl.src = '';
    videoWrapperEl.classList.add('hidden');
    noTrailerMsgEl.classList.remove('hidden');
  }

  detailModalEl.showModal();
}

function closeMediaModal() {
  detailModalEl.close();
  trailerIframeEl.src = '';
}

detailModalEl.addEventListener('cancel', () => {
  trailerIframeEl.src = '';
});

detailModalEl.addEventListener('click', (event) => {
  const rect = detailModalEl.getBoundingClientRect();
  const clickedInDialog = (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );

  if (!clickedInDialog) {
    closeMediaModal();
  }
});


document.querySelector('.hero-video-container').addEventListener('contextmenu', event => {
  event.preventDefault();
})

overviewToggleBtn.addEventListener('click', () => {
  const isCollapsed = modalOverviewEl.classList.toggle('collapsed');
  overviewToggleBtn.textContent = isCollapsed ? 'Read more' : 'Read less';
})