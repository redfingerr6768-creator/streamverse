/**
 * StreamVerse Player Module
 * Handles video player functionality
 */

const Player = {
    modal: null,
    video: null,
    episodeList: null,
    currentEpisode: 0,
    episodes: [],
    currentType: 'dramabox',

    /**
     * Initialize player
     */
    init() {
        this.modal = document.getElementById('playerModal');
        this.video = document.getElementById('playerVideo');
        this.episodeList = document.getElementById('episodeList');

        // Close button
        const closeBtn = document.getElementById('playerClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
                this.close();
            }
        });

        // Close on backdrop click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Auto-play next episode when current video ends
        if (this.video) {
            this.video.addEventListener('ended', () => {
                this.playNextEpisode();
            });
        }
    },

    /**
     * Play next episode automatically
     */
    playNextEpisode() {
        const nextIndex = this.currentEpisode + 1;
        if (nextIndex < this.episodes.length) {
            console.log(`Auto-playing next episode: ${nextIndex + 1}`);
            this.playEpisode(nextIndex);
        } else {
            console.log('Reached the last episode');
            UI.showToast('You have finished all episodes!', 'info');
        }
    },

    /**
     * Open player with drama/anime data
     */
    async open(id, type = 'dramabox') {
        if (!this.modal || !id) return;

        document.body.classList.add('no-scroll');
        this.modal.classList.add('active');
        this.currentType = type;

        // Show loading state
        document.getElementById('playerTitle').textContent = 'Loading...';
        this.episodeList.innerHTML = '<div class="skeleton skeleton-text" style="margin: 16px;"></div>'.repeat(5);

        try {
            let episodes = [];
            let title = '';

            switch (type) {
                case 'dramabox':
                    const dramaData = await API.DramaBox.getAllEpisodes(id);
                    // Sansekai API returns direct array
                    episodes = Array.isArray(dramaData) ? dramaData : (dramaData.data || dramaData.episodes || []);
                    // Get title from first episode if available, or use generic
                    title = 'DramaBox';
                    break;

                case 'netshort':
                    const netData = await API.NetShort.getAllEpisodes(id);
                    episodes = Array.isArray(netData) ? netData : (netData.data || netData.episodes || []);
                    title = 'NetShort';
                    break;

                case 'melolo':
                    const meloData = await API.Melolo.getDetail(id);
                    const meloResult = Array.isArray(meloData) ? meloData[0] : meloData;
                    episodes = meloResult?.episodes || meloResult?.data?.episodes || [];
                    title = meloResult?.bookName || meloResult?.title || 'Melolo';
                    break;

                case 'flickreels':
                    const flickData = await API.FlickReels.getDetailAndEpisodes(id);
                    const flickResult = Array.isArray(flickData) ? flickData[0] : flickData;
                    episodes = flickResult?.episodes || flickResult?.data?.episodes || [];
                    title = flickResult?.bookName || flickResult?.title || 'FlickReels';
                    break;

                case 'anime':
                    const animeData = await API.Anime.getDetail(id);
                    const animeResult = Array.isArray(animeData) ? animeData[0] : animeData;
                    episodes = animeResult?.chapter || animeResult?.data?.chapter || [];
                    title = animeResult?.title || animeResult?.name || 'Anime';
                    break;

                default:
                    break;
            }

            this.episodes = episodes;
            document.getElementById('playerTitle').textContent = title;

            // Render episode list
            this.renderEpisodeList();

            // Play first episode
            if (episodes.length > 0) {
                this.playEpisode(0);
            } else {
                // Show no episodes message
                this.episodeList.innerHTML = '<p class="text-muted" style="padding: 16px;">No episodes available</p>';
            }

        } catch (error) {
            console.error('Error loading player data:', error);
            this.episodeList.innerHTML = '<p class="text-muted" style="padding: 16px;">Failed to load episodes</p>';
            UI.showToast('Failed to load video', 'error');
        }
    },

    /**
     * Render episode list
     */
    renderEpisodeList() {
        this.episodeList.innerHTML = '';

        if (this.episodes.length === 0) {
            this.episodeList.innerHTML = '<p class="text-muted" style="padding: 16px;">No episodes available</p>';
            return;
        }

        this.episodes.forEach((ep, index) => {
            const item = document.createElement('div');
            item.className = `episode-item ${index === this.currentEpisode ? 'active' : ''}`;
            item.setAttribute('data-index', index);

            // Get episode info - Sansekai API uses chapterName, chapterImg
            const epName = ep.chapterName || ep.title || ep.name || `EP ${index + 1}`;
            const epThumb = ep.chapterImg || ep.cover || ep.thumbnail || '';

            item.innerHTML = `
                <div class="episode-thumb">
                    ${epThumb ? `<img src="${epThumb}" alt="${epName}" loading="lazy">` :
                    '<div class="episode-thumb-placeholder"></div>'}
                </div>
                <div class="episode-info">
                    <span class="episode-name">${epName}</span>
                </div>
            `;

            item.addEventListener('click', () => this.playEpisode(index));
            this.episodeList.appendChild(item);
        });
    },

    /**
     * Play specific episode
     */
    async playEpisode(index) {
        if (index < 0 || index >= this.episodes.length) return;

        this.currentEpisode = index;
        const episode = this.episodes[index];

        // Update active state
        this.episodeList.querySelectorAll('.episode-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        // Get video URL
        let videoUrl = '';

        // For DramaBox/NetShort/etc - Sansekai API provides cdnList with videoPathList
        if (episode.cdnList && episode.cdnList.length > 0) {
            const cdn = episode.cdnList.find(c => c.isDefault === 1) || episode.cdnList[0];
            if (cdn.videoPathList && cdn.videoPathList.length > 0) {
                // Try to get 720p first, then any available quality
                const video720p = cdn.videoPathList.find(v => v.quality === 720);
                const defaultVideo = cdn.videoPathList.find(v => v.isDefault === 1);
                const anyVideo = cdn.videoPathList[0];

                const videoInfo = video720p || defaultVideo || anyVideo;
                videoUrl = videoInfo?.videoPath || '';
            }
        }

        // Fallback to direct URL fields
        if (!videoUrl) {
            videoUrl = episode.videoUrl || episode.url || episode.streamUrl || episode.video || '';
        }

        // For anime, need to call getVideo API
        if (this.currentType === 'anime' && episode.url && !videoUrl) {
            try {
                const videoData = await API.Anime.getVideo(episode.url, '720p');
                const videoResult = Array.isArray(videoData) ? videoData[0] : videoData;
                videoUrl = videoResult?.url || videoResult?.data?.url || '';
            } catch (error) {
                console.error('Error fetching anime video:', error);
            }
        }

        // For melolo, need to call stream API
        if (this.currentType === 'melolo' && episode.vid && !videoUrl) {
            try {
                const streamData = await API.Melolo.getStream(episode.vid);
                const streamResult = Array.isArray(streamData) ? streamData[0] : streamData;
                videoUrl = streamResult?.url || streamResult?.data?.url || '';
            } catch (error) {
                console.error('Error fetching melolo stream:', error);
            }
        }

        if (videoUrl && this.video) {
            this.video.src = videoUrl;
            this.video.play().catch(e => console.log('Autoplay prevented:', e));
        } else {
            console.log('No video URL found for episode:', episode);
            UI.showToast('Video not available', 'error');
        }
    },

    /**
     * Close player
     */
    close() {
        if (this.video) {
            this.video.pause();
            this.video.src = '';
        }

        document.body.classList.remove('no-scroll');
        this.modal?.classList.remove('active');
        this.episodes = [];
        this.currentEpisode = 0;
    }
};

window.Player = Player;
