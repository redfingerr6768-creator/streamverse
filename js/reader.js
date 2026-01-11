/**
 * StreamVerse Reader Module
 * Handles comic/manga reader functionality
 */

const Reader = {
    modal: null,
    body: null,
    chapterSelect: null,
    chapters: [],
    currentChapter: 0,
    images: [],
    mangaId: null,

    /**
     * Initialize reader
     */
    init() {
        this.modal = document.getElementById('readerModal');
        this.body = document.getElementById('readerBody');
        this.chapterSelect = document.getElementById('chapterSelect');

        // Close button
        const closeBtn = document.getElementById('readerClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Navigation buttons
        document.getElementById('prevChapter')?.addEventListener('click', () => this.prevChapter());
        document.getElementById('nextChapter')?.addEventListener('click', () => this.nextChapter());

        // Chapter select
        this.chapterSelect?.addEventListener('change', (e) => {
            this.loadChapter(parseInt(e.target.value));
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
                this.close();
            }
            // Arrow navigation
            if (this.modal?.classList.contains('active')) {
                if (e.key === 'ArrowLeft') this.prevChapter();
                if (e.key === 'ArrowRight') this.nextChapter();
            }
        });
    },

    /**
     * Open reader with manga data
     */
    async open(mangaId) {
        if (!this.modal) return;

        this.mangaId = mangaId;
        document.body.classList.add('no-scroll');
        this.modal.classList.add('active');

        // Show loading state
        document.getElementById('readerTitle').textContent = 'Loading...';
        this.body.innerHTML = '<div class="skeleton" style="width: 300px; height: 400px; margin: auto;"></div>';

        try {
            // Get chapter list
            const chapterData = await API.Komik.getChapterList(mangaId);
            this.chapters = chapterData.data || chapterData.chapters || [];

            // Get manga detail for title
            const detailData = await API.Komik.getDetail(mangaId);
            const title = detailData.data?.title || detailData.title || 'Comic';
            document.getElementById('readerTitle').textContent = title;

            // Populate chapter select
            this.populateChapterSelect();

            // Load first chapter
            if (this.chapters.length > 0) {
                this.loadChapter(0);
            }

        } catch (error) {
            console.error('Error loading reader data:', error);
            UI.showToast('Failed to load comic', 'error');
            this.body.innerHTML = '<p class="text-muted" style="text-align: center; padding: 40px;">Failed to load comic</p>';
        }
    },

    /**
     * Populate chapter dropdown
     */
    populateChapterSelect() {
        if (!this.chapterSelect) return;

        this.chapterSelect.innerHTML = '';
        this.chapters.forEach((chapter, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = chapter.title || chapter.name || `Chapter ${index + 1}`;
            this.chapterSelect.appendChild(option);
        });
    },

    /**
     * Load specific chapter
     */
    async loadChapter(index) {
        if (index < 0 || index >= this.chapters.length) return;

        this.currentChapter = index;
        const chapter = this.chapters[index];

        // Update select
        if (this.chapterSelect) {
            this.chapterSelect.value = index;
        }

        // Update navigation buttons
        this.updateNavButtons();

        // Show loading
        this.body.innerHTML = '<div class="skeleton" style="width: 300px; height: 400px; margin: auto;"></div>';

        try {
            const chapterId = chapter.chapter_id || chapter.id || chapter.chapterId;
            const imageData = await API.Komik.getImages(chapterId);
            this.images = imageData.data || imageData.images || imageData.pages || [];

            this.renderImages();

        } catch (error) {
            console.error('Error loading chapter images:', error);
            this.body.innerHTML = '<p class="text-muted" style="text-align: center; padding: 40px;">Failed to load images</p>';
        }
    },

    /**
     * Render chapter images
     */
    renderImages() {
        this.body.innerHTML = '';

        this.images.forEach((image, index) => {
            const page = document.createElement('div');
            page.className = 'reader-page';

            const imgUrl = typeof image === 'string' ? image : (image.url || image.src || image.image);

            page.innerHTML = `<img src="${imgUrl}" alt="Page ${index + 1}" loading="lazy" 
                onerror="this.src='https://via.placeholder.com/800x1200/1a1a1a/737373?text=Failed+to+Load'">`;

            this.body.appendChild(page);
        });

        // Scroll to top
        this.body.scrollTop = 0;
    },

    /**
     * Update navigation button states
     */
    updateNavButtons() {
        const prevBtn = document.getElementById('prevChapter');
        const nextBtn = document.getElementById('nextChapter');

        if (prevBtn) {
            prevBtn.disabled = this.currentChapter === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentChapter >= this.chapters.length - 1;
        }
    },

    /**
     * Go to previous chapter
     */
    prevChapter() {
        if (this.currentChapter > 0) {
            this.loadChapter(this.currentChapter - 1);
        }
    },

    /**
     * Go to next chapter
     */
    nextChapter() {
        if (this.currentChapter < this.chapters.length - 1) {
            this.loadChapter(this.currentChapter + 1);
        }
    },

    /**
     * Close reader
     */
    close() {
        document.body.classList.remove('no-scroll');
        this.modal?.classList.remove('active');
        this.chapters = [];
        this.images = [];
        this.currentChapter = 0;
        this.mangaId = null;
    }
};

window.Reader = Reader;
