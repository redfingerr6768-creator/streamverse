/**
 * StreamVerse - Main Application
 * Premium Streaming Platform
 */

const App = {
    currentSection: 'home',
    heroItems: [],
    heroIndex: 0,
    heroInterval: null,

    /**
     * Initialize the application
     */
    async init() {
        console.log('StreamVerse initializing...');

        // Initialize modules
        Player.init();
        Reader.init();
        Search.init();

        // Setup event listeners
        this.setupNavigation();
        this.setupCardClicks();
        this.setupHeaderScroll();

        // Load initial content
        await this.loadAllSections();

        // Start hero slideshow
        this.startHeroSlideshow();

        console.log('StreamVerse ready!');
    },

    /**
     * Setup navigation
     */
    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });
    },

    /**
     * Navigate to section
     */
    navigateToSection(section) {
        this.currentSection = section;

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-section') === section);
        });

        // Scroll to section
        const sectionEl = document.getElementById(`section-${section}`);
        if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Setup card click handlers using event delegation
     */
    setupCardClicks() {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (!card) return;

            const id = card.getAttribute('data-id');
            const type = card.getAttribute('data-type');

            if (!id) return;

            if (type === 'komik') {
                Reader.open(id);
            } else {
                Player.open(id, type);
            }
        });
    },

    /**
     * Setup header scroll effect
     */
    setupHeaderScroll() {
        const header = document.querySelector('.header');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header?.classList.add('scrolled');
            } else {
                header?.classList.remove('scrolled');
            }
        });
    },

    /**
     * Load all content sections
     */
    async loadAllSections() {
        // Load in parallel for better performance
        const loadPromises = [
            this.loadHero(),
            this.loadDramaBox(),
            this.loadNetShort(),
            this.loadMelolo(),
            this.loadFlickReels(),
            this.loadAnime(),
            this.loadKomik()
        ];

        await Promise.allSettled(loadPromises);
    },

    /**
     * Load hero section
     */
    async loadHero() {
        try {
            const data = await API.DramaBox.getTrending();
            // Handle direct array response from Sansekai API
            const items = Array.isArray(data) ? data : (data.data || data.result || []);

            if (items.length > 0) {
                this.heroItems = items.slice(0, 5);
                this.updateHero(0);
            }
        } catch (error) {
            console.error('Error loading hero:', error);
        }
    },

    /**
     * Update hero display
     */
    updateHero(index) {
        if (!this.heroItems.length) return;

        this.heroIndex = index;
        const item = this.heroItems[index];

        const heroBackground = document.querySelector('.hero-background img');
        const heroTitle = document.querySelector('.hero-title');
        const heroDescription = document.querySelector('.hero-description');
        const heroMeta = document.querySelector('.hero-meta');

        if (heroBackground) {
            heroBackground.style.opacity = '0';
            setTimeout(() => {
                // Sansekai API uses coverWap
                heroBackground.src = item.coverWap || item.cover || item.poster || item.image || '';
                heroBackground.style.opacity = '1';
            }, 300);
        }

        if (heroTitle) {
            // Sansekai API uses bookName
            heroTitle.textContent = item.bookName || item.title || item.name || item.dramaname || '';
        }

        if (heroDescription) {
            // Sansekai API uses introduction
            const desc = item.introduction || item.description || item.synopsis || item.intro || '';
            heroDescription.textContent = desc.substring(0, 180) + (desc.length > 180 ? '...' : '');
        }

        if (heroMeta) {
            heroMeta.innerHTML = `
                <span class="hero-meta-item">${item.serialCount || item.totalEpisode || item.episodes || '?'} Episodes</span>
                <span class="hero-meta-item">${item.year || new Date().getFullYear()}</span>
                ${item.genre ? `<span class="hero-meta-item">${item.genre}</span>` : ''}
            `;
        }

        // Update dots
        document.querySelectorAll('.hero-slider-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    },

    /**
     * Start hero slideshow
     */
    startHeroSlideshow() {
        if (this.heroInterval) clearInterval(this.heroInterval);

        this.heroInterval = setInterval(() => {
            const nextIndex = (this.heroIndex + 1) % this.heroItems.length;
            this.updateHero(nextIndex);
        }, 8000);

        // Setup dot clicks
        document.querySelectorAll('.hero-slider-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.updateHero(index);
                // Reset interval
                clearInterval(this.heroInterval);
                this.startHeroSlideshow();
            });
        });
    },

    /**
     * Load DramaBox section
     */
    async loadDramaBox() {
        await UI.renderSection('dramabox-trending', () => API.DramaBox.getTrending(), 'dramabox');
        await UI.renderSection('dramabox-latest', () => API.DramaBox.getLatest(), 'dramabox');
    },

    /**
     * Load NetShort section
     */
    async loadNetShort() {
        await UI.renderSection('netshort-content', () => API.NetShort.getTheaters(), 'netshort');
    },

    /**
     * Load Melolo section
     */
    async loadMelolo() {
        await UI.renderSection('melolo-trending', () => API.Melolo.getTrending(), 'melolo');
    },

    /**
     * Load FlickReels section
     */
    async loadFlickReels() {
        await UI.renderSection('flickreels-content', () => API.FlickReels.getLatest(), 'flickreels');
    },

    /**
     * Load Anime section
     */
    async loadAnime() {
        await UI.renderSection('anime-latest', () => API.Anime.getLatest(), 'anime');
        await UI.renderSection('anime-recommended', () => API.Anime.getRecommended(), 'anime');
    },

    /**
     * Load Komik section
     */
    async loadKomik() {
        await UI.renderSection('komik-popular', () => API.Komik.getPopular(), 'komik');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
