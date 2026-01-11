/**
 * StreamVerse Search Module
 * Premium search with beautiful UI
 */

const Search = {
    overlay: null,
    input: null,
    resultsContainer: null,
    debounceTimer: null,
    isSearching: false,

    /**
     * Initialize search
     */
    init() {
        this.overlay = document.getElementById('searchOverlay');
        this.input = document.getElementById('searchInput');
        this.resultsContainer = document.getElementById('searchResults');

        // Search trigger button
        document.querySelectorAll('.search-trigger').forEach(btn => {
            btn.addEventListener('click', () => this.open());
        });

        // Close button
        document.getElementById('searchClose')?.addEventListener('click', () => this.close());

        // Click outside to close
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Input handler with debounce
        this.input?.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            const query = e.target.value.trim();

            if (query.length < 2) {
                this.showInitialState();
                return;
            }

            this.debounceTimer = setTimeout(() => {
                this.search(query);
            }, 400);
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay?.classList.contains('active')) {
                this.close();
            }
        });

        // Keyboard shortcut (Ctrl+K or Cmd+K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.open();
            }
        });
    },

    /**
     * Open search overlay
     */
    open() {
        document.body.classList.add('no-scroll');
        this.overlay?.classList.add('active');
        this.input?.focus();
        this.showInitialState();
    },

    /**
     * Close search overlay
     */
    close() {
        document.body.classList.remove('no-scroll');
        this.overlay?.classList.remove('active');
        if (this.input) this.input.value = '';
        if (this.resultsContainer) this.resultsContainer.innerHTML = '';
    },

    /**
     * Show initial state with search hints
     */
    showInitialState() {
        if (!this.resultsContainer) return;

        this.resultsContainer.innerHTML = `
            <div class="search-hints">
                <div class="search-hint-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                </div>
                <h3 class="search-hint-title">Search StreamVerse</h3>
                <p class="search-hint-text">Find drama, anime, and komik across all platforms</p>
                <div class="search-shortcuts">
                    <span class="search-shortcut"><kbd>ESC</kbd> to close</span>
                    <span class="search-shortcut"><kbd>↵</kbd> to select</span>
                </div>
            </div>
        `;
    },

    /**
     * Show loading state
     */
    showLoading(query) {
        if (!this.resultsContainer) return;

        this.resultsContainer.innerHTML = `
            <div class="search-loading">
                <div class="search-loading-spinner"></div>
                <p class="search-loading-text">Searching for "<strong>${query}</strong>"...</p>
            </div>
        `;
    },

    /**
     * Perform search across all APIs
     */
    async search(query) {
        if (this.isSearching) return;
        this.isSearching = true;

        this.showLoading(query);

        try {
            // Search all APIs in parallel
            const [dramaResults, animeResults, komikResults] = await Promise.allSettled([
                API.DramaBox.search(query),
                API.Anime.search(query),
                API.Komik.search(query)
            ]);

            this.resultsContainer.innerHTML = '';
            let totalResults = 0;

            // Process drama results - handle direct array response
            if (dramaResults.status === 'fulfilled') {
                const data = dramaResults.value;
                const dramas = Array.isArray(data) ? data : (data.data || data.result || data.list || []);
                if (dramas.length > 0) {
                    totalResults += dramas.length;
                    this.renderSearchCategory('Drama', dramas.slice(0, 8), 'dramabox');
                }
            }

            // Process anime results - handle direct array response
            if (animeResults.status === 'fulfilled') {
                const data = animeResults.value;
                const animes = Array.isArray(data) ? data : (data.data || data.result || data.list || []);
                if (animes.length > 0) {
                    totalResults += animes.length;
                    this.renderSearchCategory('Anime', animes.slice(0, 8), 'anime');
                }
            }

            // Process komik results - handle direct array response
            if (komikResults.status === 'fulfilled') {
                const data = komikResults.value;
                const komiks = Array.isArray(data) ? data : (data.data || data.result || data.list || []);
                if (komiks.length > 0) {
                    totalResults += komiks.length;
                    this.renderSearchCategory('Komik', komiks.slice(0, 8), 'komik');
                }
            }

            // No results message
            if (totalResults === 0) {
                this.showNoResults(query);
            }

        } catch (error) {
            console.error('Search error:', error);
            this.showError();
        } finally {
            this.isSearching = false;
        }
    },

    /**
     * Show no results message
     */
    showNoResults(query) {
        this.resultsContainer.innerHTML = `
            <div class="search-no-results">
                <div class="search-no-results-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                        <path d="M8 8l6 6M14 8l-6 6"/>
                    </svg>
                </div>
                <h3 class="search-no-results-title">No results found</h3>
                <p class="search-no-results-text">We couldn't find anything for "<strong>${query}</strong>"</p>
                <p class="search-no-results-hint">Try different keywords or check the spelling</p>
            </div>
        `;
    },

    /**
     * Show error message
     */
    showError() {
        this.resultsContainer.innerHTML = `
            <div class="search-error">
                <div class="search-error-icon">⚠️</div>
                <h3 class="search-error-title">Something went wrong</h3>
                <p class="search-error-text">Please try again later</p>
            </div>
        `;
    },

    /**
     * Create search result card
     */
    createSearchCard(item, type) {
        const card = document.createElement('div');
        card.className = 'search-card';
        card.setAttribute('data-id', item.id || item.bookId || item.shortPlayId || item.manga_id || '');
        card.setAttribute('data-type', type);

        // Use correct field names from Sansekai API
        const image = item.coverWap || item.cover || item.poster || item.image || item.thumbnail || '';
        const title = item.bookName || item.title || item.name || item.dramaname || item.animeName || '';
        const desc = item.introduction || item.description || item.synopsis || '';
        const episodes = item.serialCount || item.episodes || item.totalEpisode || item.chapterCount || '';

        card.innerHTML = `
            <div class="search-card-image">
                ${image ?
                `<img src="${image}" alt="${title}" loading="lazy" onerror="this.parentElement.classList.add('no-image')">` :
                `<div class="search-card-placeholder"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v16H4V4zm2 2v12h12V6H6z"/></svg></div>`
            }
            </div>
            <div class="search-card-content">
                <h4 class="search-card-title">${title || 'Untitled'}</h4>
                <div class="search-card-meta">
                    <span class="search-card-type">${type}</span>
                    ${episodes ? `<span class="search-card-episodes">${episodes} ${type === 'komik' ? 'Ch' : 'Ep'}</span>` : ''}
                </div>
                ${desc ? `<p class="search-card-desc">${desc.substring(0, 80)}${desc.length > 80 ? '...' : ''}</p>` : ''}
            </div>
            <div class="search-card-action">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            </div>
        `;

        return card;
    },

    /**
     * Render a search category
     */
    renderSearchCategory(title, items, type) {
        const category = document.createElement('div');
        category.className = 'search-category';

        // Category header
        const header = document.createElement('div');
        header.className = 'search-category-header';
        header.innerHTML = `
            <h4 class="search-category-title">
                <span class="search-category-icon">${type === 'dramabox' ? '🎬' : type === 'anime' ? '🎌' : '📚'}</span>
                ${title}
            </h4>
            <span class="search-category-count">${items.length} results</span>
        `;
        category.appendChild(header);

        // Results list
        const list = document.createElement('div');
        list.className = 'search-results-list';

        items.forEach(item => {
            const card = this.createSearchCard(item, type);
            card.addEventListener('click', () => {
                this.close();
                if (type === 'komik') {
                    Reader.open(item.manga_id || item.id || item.bookId);
                } else {
                    Player.open(item.bookId || item.id || item.urlId, type);
                }
            });
            list.appendChild(card);
        });

        category.appendChild(list);
        this.resultsContainer.appendChild(category);
    }
};

window.Search = Search;
