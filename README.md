```markdown
# KansoVerse

A clean, responsive, and minimalist anime discovery portal built with vanilla JavaScript. Explore trending series, discover verified community ratings, filter by format and airing status, and watch official high-definition trailers directly in a cinematic modal.

---

## Features

- **Dynamic Search & Catalog Exploration:** Search for titles or explore the catalog with instant client-side responses.
- **Dual-Layer Filtering:** Filter results simultaneously across format (`TV Series`, `Movies`, `OVA / Special`) and airing status (`Airing`, `Finished`).
- **Cinematic Trailer Modal:** Watch official YouTube trailers inside an accessible dialog window equipped with automatic playback teardown and backdrop dismissal.
- **Defensive UI Rendering:** Resilient image loading with SVG data URI fallbacks and runtime `onerror` handlers to prevent broken card states.
- **Pure Client-Side Architecture:** Fast, lightweight, and completely backend-free using normalized proxy data.

---

## Tech Stack

- **HTML5:** Semantic markup, native `<dialog>` modal API, and embedded media.
- **CSS3:** Custom CSS variables, modern CSS Grid, Flexbox, backdrop blur filters, and responsive design down to mobile breakpoints.
- **JavaScript (ES6+):** Object-oriented data normalization (`MediaItem` base class and `AnimeItem` subclass), asynchronous data fetching, and event delegation.
- **Data Source:** Powered by the [Tenrai API](https://api.tenrai.org/) (Jikan/MyAnimeList open proxy).

---

## Project Structure

```text
├── index.html        # Main portal markup & dialog modal
├── style.css         # Design tokens, layouts, and responsive rules
├── js/
│   └── main.js       # App state, API service, normalization & DOM handlers
└── assets/           # Local media assets and fallbacks

```

---

## Getting Started

1. **Clone the repository:**
```bash
git clone [https://github.com/](https://github.com/)<your-username>/kansoverse.git
cd kansoverse

```


2. **Run locally:**
Open `index.html` directly in your browser, or serve it using any local static server (e.g., Live Server in VS Code):
```bash
npx serve .

```



No API keys, build steps, or backend configuration required.

```

```