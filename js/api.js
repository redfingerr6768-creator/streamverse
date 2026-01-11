/**
 * StreamVerse API Module
 * Handles all API calls to Sansekai API
 */

const API_BASE = 'https://api.sansekai.my.id/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        throw error;
    }
}

/**
 * DramaBox API
 */
const DramaBoxAPI = {
    getVIP: () => fetchAPI('/dramabox/vip'),
    getDubIndo: (classify = 'terpopuler', page = 1) => 
        fetchAPI(`/dramabox/dubindo?classify=${classify}&page=${page}`),
    getRandom: () => fetchAPI('/dramabox/randomdrama'),
    getForYou: () => fetchAPI('/dramabox/foryou'),
    getLatest: () => fetchAPI('/dramabox/latest'),
    getTrending: () => fetchAPI('/dramabox/trending'),
    getPopularSearch: () => fetchAPI('/dramabox/populersearch'),
    search: (query) => fetchAPI(`/dramabox/search?query=${encodeURIComponent(query)}`),
    getDetail: (bookId) => fetchAPI(`/dramabox/detail?bookId=${bookId}`),
    getAllEpisodes: (bookId) => fetchAPI(`/dramabox/allepisode?bookId=${bookId}`)
};

/**
 * NetShort API
 */
const NetShortAPI = {
    getTheaters: () => fetchAPI('/netshort/theaters'),
    getForYou: (page = 1) => fetchAPI(`/netshort/foryou?page=${page}`),
    search: (query) => fetchAPI(`/netshort/search?query=${encodeURIComponent(query)}`),
    getAllEpisodes: (shortPlayId) => fetchAPI(`/netshort/allepisode?shortPlayId=${shortPlayId}`)
};

/**
 * Melolo API
 */
const MeloloAPI = {
    getLatest: () => fetchAPI('/melolo/latest'),
    getTrending: () => fetchAPI('/melolo/trending'),
    search: (query, limit = 10, offset = 0) => 
        fetchAPI(`/melolo/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`),
    getDetail: (bookId) => fetchAPI(`/melolo/detail?bookId=${bookId}`),
    getStream: (videoId) => fetchAPI(`/melolo/stream?videoId=${videoId}`)
};

/**
 * FlickReels API
 */
const FlickReelsAPI = {
    getLatest: () => fetchAPI('/flickreels/latest'),
    getForYou: () => fetchAPI('/flickreels/foryou'),
    search: (query) => fetchAPI(`/flickreels/search?query=${encodeURIComponent(query)}`),
    getHotRank: () => fetchAPI('/flickreels/hotrank'),
    getDetailAndEpisodes: (id) => fetchAPI(`/flickreels/detailAndAllEpisode?id=${id}`)
};

/**
 * Anime API
 */
const AnimeAPI = {
    getLatest: () => fetchAPI('/anime/latest'),
    getRecommended: (page = 1) => fetchAPI(`/anime/recommended?page=${page}`),
    search: (query) => fetchAPI(`/anime/search?query=${encodeURIComponent(query)}`),
    getDetail: (urlId) => fetchAPI(`/anime/detail?urlId=${urlId}`),
    getMovies: () => fetchAPI('/anime/movie'),
    getVideo: (chapterUrlId, reso = '480p') => 
        fetchAPI(`/anime/getvideo?chapterUrlId=${chapterUrlId}&reso=${reso}`)
};

/**
 * Komik API
 */
const KomikAPI = {
    getRecommended: (type) => fetchAPI(`/komik/recommended?type=${type}`),
    getLatest: (type) => fetchAPI(`/komik/latest?type=${type}`),
    search: (query) => fetchAPI(`/komik/search?query=${encodeURIComponent(query)}`),
    getPopular: (page = 1) => fetchAPI(`/komik/popular?page=${page}`),
    getDetail: (mangaId) => fetchAPI(`/komik/detail?manga_id=${mangaId}`),
    getChapterList: (mangaId) => fetchAPI(`/komik/chapterlist?manga_id=${mangaId}`),
    getImages: (chapterId) => fetchAPI(`/komik/getimage?chapter_id=${chapterId}`)
};

// Export all APIs
window.API = {
    DramaBox: DramaBoxAPI,
    NetShort: NetShortAPI,
    Melolo: MeloloAPI,
    FlickReels: FlickReelsAPI,
    Anime: AnimeAPI,
    Komik: KomikAPI
};
