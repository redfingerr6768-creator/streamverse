/**
 * StreamVerse UI Module
 * Handles all UI rendering and updates
 */

const UI = {
    /**
     * Create a content card for drama/anime/etc
     */
    createCard(item, type = 'drama') {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-id', item.id || item.bookId || item.shortPlayId || item.manga_id || '');
        card.setAttribute('data-type', type);

        // Determine image source based on item structure (Sansekai API uses coverWap)
        const image = item.coverWap || item.cover || item.poster || item.image || item.thumbnail ||
            item.coverUrl || item.img || item.coverImage || item.pic || '';
        const title = item.bookName || item.title || item.name || item.dramaname || item.bookname || item.animeName || '';
        const badge = item.isVip ? 'VIP' : (item.isNew ? 'NEW' : (item.trending ? 'TRENDING' : ''));
        const meta = item.serialCount || item.episodes || item.totalEpisode || item.chapterCount || '';

        card.innerHTML = `
            <div class="card-image">
                ${image ? `<img src="${image}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/1a1a1a/737373?text=No+Image'">` :
                `<div class="skeleton skeleton-card"></div>`}
                ${badge ? `<span class="card-badge ${badge.toLowerCase()}">${badge}</span>` : ''}
                <div class="card-overlay">
                    <button class="btn btn-primary btn-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        Watch Now
                    </button>
                </div>
            </div>
            <div class="card-body">
                <h3 class="card-title">${title}</h3>
                ${meta ? `<p class="card-meta">${meta} ${type === 'komik' ? 'Chapters' : 'Episodes'}</p>` : ''}
            </div>
        `;

        return card;
    },

    /**
     * Create a wide card for search results or lists
     */
    createWideCard(item, type = 'drama') {
        const card = document.createElement('div');
        card.className = 'card card-wide';
        card.setAttribute('data-id', item.id || item.bookId || '');
        card.setAttribute('data-type', type);

        const image = item.coverWap || item.cover || item.poster || item.image || item.thumbnail || item.pic || '';
        const title = item.bookName || item.title || item.name || item.dramaname || item.animeName || '';
        const description = item.introduction || item.description || item.synopsis || item.intro || '';

        card.innerHTML = `
            <div class="card-image">
                ${image ? `<img src="${image}" alt="${title}" loading="lazy">` : ''}
            </div>
            <div class="card-body">
                <span class="type-badge ${type}">${type}</span>
                <h3 class="card-title">${title}</h3>
                <p class="card-meta">${description ? description.substring(0, 80) + '...' : ''}</p>
            </div>
        `;

        return card;
    },

    /**
     * Create skeleton loading cards
     */
    createSkeletonCards(count = 6) {
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'card';
            skeleton.innerHTML = `
                <div class="skeleton skeleton-card"></div>
                <div class="card-body">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            `;
            fragment.appendChild(skeleton);
        }

        return fragment;
    },

    /**
     * Create episode item for player sidebar
     */
    createEpisodeItem(episode, index, isActive = false) {
        const item = document.createElement('div');
        item.className = `episode-item ${isActive ? 'active' : ''}`;
        item.setAttribute('data-index', index);
        item.setAttribute('data-url', episode.videoUrl || episode.url || episode.streamUrl || '');

        const thumb = episode.cover || episode.thumbnail || episode.poster || '';
        const epNum = episode.episode || episode.episodeNumber || episode.chapterNum || (index + 1);
        const epName = episode.title || episode.name || `Episode ${epNum}`;

        item.innerHTML = `
            <div class="episode-thumb">
                ${thumb ? `<img src="${thumb}" alt="${epName}" loading="lazy">` : ''}
            </div>
            <div class="episode-info">
                <span class="episode-number">EP ${epNum}</span>
                <span class="episode-name">${epName}</span>
            </div>
        `;

        return item;
    },

    /**
     * Render a content section
     */
    async renderSection(containerId, fetchFunction, type = 'drama') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Show loading skeletons
        container.innerHTML = '';
        container.appendChild(this.createSkeletonCards(6));

        try {
            const data = await fetchFunction();
            container.innerHTML = '';

            // Handle different API response structures
            // Sansekai API returns direct array, not wrapped in data property
            const items = Array.isArray(data) ? data :
                (data.data || data.result || data.list || data.results ||
                    data.dramas || data.animes || data.comics || []);

            if (Array.isArray(items) && items.length > 0) {
                items.slice(0, 12).forEach(item => {
                    const card = this.createCard(item, type);
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = '<p class="text-muted">No content available</p>';
            }
        } catch (error) {
            console.error(`Error loading section ${containerId}:`, error);
            container.innerHTML = '<p class="text-muted">Failed to load content</p>';
        }
    },

    /**
     * Update hero section with featured content
     */
    updateHero(item) {
        const heroBackground = document.querySelector('.hero-background img');
        const heroTitle = document.querySelector('.hero-title');
        const heroDescription = document.querySelector('.hero-description');
        const heroBadge = document.querySelector('.hero-badge');

        if (heroBackground && item.cover) {
            heroBackground.src = item.cover || item.poster || item.image || '';
        }
        if (heroTitle) {
            heroTitle.textContent = item.title || item.name || item.dramaname || '';
        }
        if (heroDescription) {
            const desc = item.description || item.synopsis || item.intro || '';
            heroDescription.textContent = desc.substring(0, 200) + (desc.length > 200 ? '...' : '');
        }
        if (heroBadge && item.genre) {
            heroBadge.textContent = item.genre;
        }
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 16px 24px;
            background: var(--color-surface-2);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            font-size: var(--text-sm);
            z-index: var(--z-toast);
            animation: fadeIn 0.3s ease;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

window.UI = UI;
