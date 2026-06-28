// ==========================================================================
// Constants & Configuration
// ==========================================================================
const API_BASE = 'https://api.github.com/users/';
const HISTORY_KEY = 'github_finder_history';
const THEME_KEY = 'github_finder_theme';
const MAX_HISTORY = 5;

// ==========================================================================
// DOM Elements
// ==========================================================================
const elements = {
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    historyContainer: document.getElementById('history-container'),
    historyChips: document.getElementById('history-chips'),
    clearHistoryBtn: document.getElementById('clear-history'),
    
    // States
    emptyState: document.getElementById('empty-state'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    profileContent: document.getElementById('profile-content'),
    
    // Profile Elements
    avatar: document.getElementById('user-avatar'),
    badges: document.getElementById('user-badges'),
    name: document.getElementById('user-name'),
    login: document.getElementById('user-login'),
    bio: document.getElementById('user-bio'),
    joined: document.getElementById('user-joined'),
    details: document.getElementById('user-details'),
    
    // Stats
    followers: document.getElementById('stat-followers'),
    following: document.getElementById('stat-following'),
    repos: document.getElementById('stat-repos'),
    gists: document.getElementById('stat-gists'),
    
    // Extra Stats
    totalStars: document.getElementById('total-stars'),
    topLanguage: document.getElementById('top-language'),
    topRepo: document.getElementById('top-repo'),
    languageBarContainer: document.getElementById('language-bar-container'),
    languageLegend: document.getElementById('language-legend'),
    contributionPlaceholder: document.getElementById('contribution-placeholder'),
    
    // Repos
    reposContainer: document.getElementById('repos-container'),
    viewAllRepos: document.getElementById('view-all-repos'),
    
    // Actions
    copyUrlBtn: document.getElementById('copy-url-btn'),
    shareBtn: document.getElementById('share-btn'),
    backToTopBtn: document.getElementById('back-to-top')
};

// ==========================================================================
// State
// ==========================================================================
let currentUser = null;
let currentRepos = [];

// GitHub Language Colors mapping (subset for demo, defaulting to blue)
const languageColors = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26',
    CSS: '#563d7c', Python: '#3572A5', Java: '#b07219',
    'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
    PHP: '#4F5D95', Ruby: '#701516', Go: '#00ADD8',
    Rust: '#dea584', Swift: '#F05138', Kotlin: '#A97BFF',
    Dart: '#00B4AB', Vue: '#41b883', Shell: '#89e051'
};
const defaultLangColor = '#3b82f6';

// ==========================================================================
// Initialization
// ==========================================================================
function init() {
    loadTheme();
    loadHistory();
    setupEventListeners();
    generateContributionPlaceholder();
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
    // Theme
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Search
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Debounce typing (optional visual feedback, but we search on Enter/Click)
    elements.searchInput.addEventListener('input', debounce(() => {
        // Could implement live search hints here if needed
    }, 500));
    
    // History
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    
    // Actions
    elements.copyUrlBtn.addEventListener('click', copyProfileUrl);
    elements.shareBtn.addEventListener('click', shareProfile);
    
    // Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            elements.backToTopBtn.classList.remove('hidden');
        } else {
            elements.backToTopBtn.classList.add('hidden');
        }
    });
    elements.backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ==========================================================================
// Theme Management
// ==========================================================================
function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    if (theme === 'light') {
        elements.themeIcon.className = 'fa-solid fa-moon';
    } else {
        elements.themeIcon.className = 'fa-solid fa-sun';
    }
}

// ==========================================================================
// History Management
// ==========================================================================
function loadHistory() {
    const history = getHistory();
    renderHistoryChips(history);
}

function getHistory() {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

function saveToHistory(username) {
    if (!username) return;
    let history = getHistory();
    
    // Remove if exists to move to front
    history = history.filter(item => item.toLowerCase() !== username.toLowerCase());
    
    // Add to front
    history.unshift(username);
    
    // Limit size
    if (history.length > MAX_HISTORY) {
        history.pop();
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistoryChips(history);
}

function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistoryChips([]);
}

function renderHistoryChips(history) {
    if (history.length === 0) {
        elements.historyContainer.classList.add('hidden');
        return;
    }
    
    elements.historyContainer.classList.remove('hidden');
    elements.historyChips.innerHTML = history.map(username => `
        <div class="chip" onclick="searchFromHistory('${username}')">
            <i class="fa-solid fa-clock-rotate-left"></i> ${username}
        </div>
    `).join('');
}

window.searchFromHistory = function(username) {
    elements.searchInput.value = username;
    handleSearch();
};

// ==========================================================================
// API & Search Logic
// ==========================================================================
async function handleSearch() {
    const username = elements.searchInput.value.trim();
    if (!username) return;
    
    showState('loading');
    
    try {
        const [profileRes, reposRes, socialRes] = await Promise.all([
            fetch(`${API_BASE}${username}`),
            fetch(`${API_BASE}${username}/repos?sort=updated&per_page=100`),
            fetch(`${API_BASE}${username}/social_accounts`)
        ]);
        
        if (!profileRes.ok) {
            if (profileRes.status === 404) throw new Error('User not found');
            throw new Error(`API Error: ${profileRes.status}`);
        }
        
        const profile = await profileRes.json();
        const repos = await reposRes.json();
        const socials = socialRes.ok ? await socialRes.json() : [];
        
        currentUser = profile;
        currentRepos = repos;
        
        saveToHistory(profile.login);
        renderProfile(profile, socials);
        renderRepos(repos);
        processExtraStats(repos);
        renderContributionChart(profile.login);
        
        showState('profile');
    } catch (error) {
        console.error(error);
        showState('error', error.message === 'User not found' ? 'User Not Found' : 'API Limit Exceeded', 
            error.message === 'User not found' ? 
            "We couldn't find a GitHub user with that name. Please try again." : 
            "GitHub API rate limit exceeded. Please wait a while before trying again.");
    }
}

// ==========================================================================
// UI Rendering
// ==========================================================================
function showState(state, errorTitle = '', errorDesc = '') {
    // Hide all
    elements.emptyState.classList.add('hidden');
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.profileContent.classList.add('hidden');
    
    // Show requested
    switch (state) {
        case 'empty':
            elements.emptyState.classList.remove('hidden');
            break;
        case 'loading':
            elements.loadingState.classList.remove('hidden');
            break;
        case 'error':
            document.getElementById('error-title').textContent = errorTitle;
            document.getElementById('error-desc').textContent = errorDesc;
            elements.errorState.classList.remove('hidden');
            break;
        case 'profile':
            elements.profileContent.classList.remove('hidden');
            break;
    }
}

function renderProfile(profile, socials = []) {
    elements.avatar.src = profile.avatar_url;
    elements.name.textContent = profile.name || profile.login;
    elements.login.textContent = `@${profile.login}`;
    elements.login.href = profile.html_url;
    elements.bio.textContent = profile.bio || 'This profile has no bio.';
    elements.joined.textContent = `Joined ${formatDate(profile.created_at)}`;
    
    elements.viewAllRepos.href = `https://github.com/${profile.login}?tab=repositories`;
    
    // Badges
    let badgesHtml = '';
    if (profile.type === 'Organization') badgesHtml += '<span class="badge pro">Organization</span>';
    if (profile.hireable) badgesHtml += '<span class="badge hireable">Hireable</span>';
    if (profile.plan && profile.plan.name === 'pro') badgesHtml += '<span class="badge pro">PRO</span>';
    elements.badges.innerHTML = badgesHtml;
    
    // Details (Location, Company, Website, Email, and Social Accounts)
    let detailsItems = [
        { icon: 'fa-solid fa-location-dot', text: profile.location, link: null },
        { icon: 'fa-solid fa-building', text: profile.company, link: null },
        { icon: 'fa-solid fa-envelope', text: profile.email, link: profile.email ? `mailto:${profile.email}` : null }
    ];
    
    // Add blog if exists
    if (profile.blog) {
        detailsItems.push({ icon: 'fa-solid fa-link', text: profile.blog, link: profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}` });
    }
    
    // Add Twitter if exists
    if (profile.twitter_username) {
        detailsItems.push({ icon: 'fa-brands fa-x-twitter', text: `@${profile.twitter_username}`, link: `https://twitter.com/${profile.twitter_username}` });
    }
    
    // Add other social accounts
    socials.forEach(social => {
        // Skip twitter if we already added it from profile
        if (social.provider === 'twitter' && profile.twitter_username) return;
        
        let icon = 'fa-solid fa-link';
        if (social.provider === 'linkedin') icon = 'fa-brands fa-linkedin';
        else if (social.provider === 'facebook') icon = 'fa-brands fa-facebook';
        else if (social.provider === 'instagram') icon = 'fa-brands fa-instagram';
        else if (social.provider === 'youtube') icon = 'fa-brands fa-youtube';
        else if (social.provider === 'twitch') icon = 'fa-brands fa-twitch';
        else if (social.provider === 'github') icon = 'fa-brands fa-github';
        
        // Extract a nice display text from URL if possible
        let text = social.url;
        try {
            const urlObj = new URL(social.url);
            text = urlObj.hostname + urlObj.pathname;
        } catch(e) {}
        
        detailsItems.push({ icon, text, link: social.url });
    });
    
    // If we only have location and company and they are both empty, add a default empty state, otherwise filter empty
    const validItems = detailsItems.filter(item => item.text);
    
    if (validItems.length === 0) {
        validItems.push({ icon: 'fa-solid fa-circle-info', text: 'No additional details available', link: null, isEmpty: true });
    }
    
    const detailsHtml = validItems.map(item => {
        if (item.isEmpty) return `<div class="detail-item empty"><i class="${item.icon}"></i> <span>${item.text}</span></div>`;
        if (item.link) return `<div class="detail-item"><i class="${item.icon}"></i> <a href="${item.link}" target="_blank" title="${item.text}">${item.text.length > 25 ? item.text.substring(0, 25) + '...' : item.text}</a></div>`;
        return `<div class="detail-item"><i class="${item.icon}"></i> <span>${item.text}</span></div>`;
    }).join('');
    
    elements.details.innerHTML = detailsHtml;
    
    // Stats
    elements.followers.textContent = formatNumber(profile.followers);
    elements.following.textContent = formatNumber(profile.following);
    elements.repos.textContent = formatNumber(profile.public_repos);
    elements.gists.textContent = formatNumber(profile.public_gists);
}

function renderRepos(repos) {
    if (!repos || repos.length === 0) {
        elements.reposContainer.innerHTML = '<p class="placeholder-text">No public repositories found.</p>';
        return;
    }
    
    // Sort by updated, take top 6
    const topRepos = [...repos].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 6);
    
    elements.reposContainer.innerHTML = topRepos.map(repo => {
        const langColor = languageColors[repo.language] || defaultLangColor;
        const desc = repo.description || 'No description available';
        
        return `
            <a href="${repo.html_url}" target="_blank" class="repo-card glass-card">
                <div class="repo-top">
                    <h4><i class="fa-regular fa-folder"></i> ${repo.name}</h4>
                    <p class="repo-desc">${desc}</p>
                </div>
                <div class="repo-stats">
                    ${repo.language ? `<span class="repo-stat"><div class="repo-lang-dot" style="background-color: ${langColor}"></div> ${repo.language}</span>` : ''}
                    <span class="repo-stat"><i class="fa-regular fa-star"></i> ${formatNumber(repo.stargazers_count)}</span>
                    <span class="repo-stat"><i class="fa-solid fa-code-fork"></i> ${formatNumber(repo.forks_count)}</span>
                </div>
            </a>
        `;
    }).join('');
}

function processExtraStats(repos) {
    if (!repos || repos.length === 0) {
        elements.totalStars.innerHTML = `0 <i class="fa-solid fa-star star-color"></i>`;
        elements.topLanguage.textContent = 'N/A';
        elements.topRepo.textContent = 'N/A';
        elements.languageBarContainer.innerHTML = '';
        elements.languageLegend.innerHTML = '';
        return;
    }

    // Total Stars
    const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
    elements.totalStars.innerHTML = `${formatNumber(totalStars)} <i class="fa-solid fa-star star-color"></i>`;
    
    // Most Starred Repo
    const mostStarred = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
    if (mostStarred && mostStarred.stargazers_count > 0) {
        elements.topRepo.textContent = mostStarred.name;
        elements.topRepo.href = mostStarred.html_url;
    } else {
        elements.topRepo.textContent = 'N/A';
        elements.topRepo.removeAttribute('href');
    }
    
    // Language Stats
    const langCounts = {};
    let totalSize = 0;
    
    repos.forEach(repo => {
        if (repo.language) {
            langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
            totalSize += 1;
        }
    });
    
    if (totalSize === 0) return;
    
    const sortedLangs = Object.entries(langCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5 langs
        
    if (sortedLangs.length > 0) {
        elements.topLanguage.textContent = sortedLangs[0][0];
    }
    
    // Render Language Bar
    let barHtml = '';
    let legendHtml = '';
    
    sortedLangs.forEach(([lang, size]) => {
        const percentage = ((size / totalSize) * 100).toFixed(1);
        const color = languageColors[lang] || defaultLangColor;
        
        barHtml += `<div class="lang-segment" style="width: ${percentage}%; background-color: ${color};" title="${lang} ${percentage}%"></div>`;
        legendHtml += `<div class="legend-item"><div class="legend-dot" style="background-color: ${color};"></div><span>${lang} (${percentage}%)</span></div>`;
    });
    
    elements.languageBarContainer.innerHTML = barHtml;
    elements.languageLegend.innerHTML = legendHtml;
}

// ==========================================================================
// Utilities
// ==========================================================================
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Render actual GitHub contribution chart
function renderContributionChart(username) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    // Use an API that provides the contribution graph as an image or SVG
    // We append a timestamp to avoid caching issues when searching multiple users
    const timestamp = new Date().getTime();
    
    // There are a few public services for this, ghchart is a good reliable one
    const chartUrl = `https://ghchart.rshah.org/${isDark ? '216e39' : '40c463'}/${username}?v=${timestamp}`;
    
    // Override the grid CSS from the placeholder class to show the image properly
    elements.contributionPlaceholder.style.display = 'block';
    elements.contributionPlaceholder.style.height = 'auto';
    
    elements.contributionPlaceholder.innerHTML = `
        <div style="width: 100%; overflow-x: auto; padding-bottom: 10px; display: flex; justify-content: center;">
            <img src="${chartUrl}" alt="${username}'s Contribution Chart" style="max-width: 100%; height: auto; min-width: 600px;">
        </div>
    `;
    
    // Also update the heading and description
    const activitySection = elements.contributionPlaceholder.parentElement;
    const title = activitySection.querySelector('h3');
    if (title) title.innerHTML = '<i class="fa-solid fa-chart-line"></i> Contribution Activity <span style="font-size: 0.7em; color: var(--text-secondary); font-weight: normal; margin-left: 10px;">(Public only)</span>';
    
    const desc = activitySection.querySelector('.placeholder-text');
    if (desc) desc.style.display = 'none';
}

function generateContributionPlaceholder() {
    // Initial empty state before a search is performed
    elements.contributionPlaceholder.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--text-secondary);">
            Search for a user to see their contribution chart.
        </div>
    `;
}

// ==========================================================================
// Actions
// ==========================================================================
function copyProfileUrl() {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.html_url).then(() => {
        const icon = elements.copyUrlBtn.querySelector('i');
        icon.className = 'fa-solid fa-check';
        setTimeout(() => {
            icon.className = 'fa-solid fa-link';
        }, 2000);
    });
}

function shareProfile() {
    if (!currentUser) return;
    const shareData = {
        title: `${currentUser.name || currentUser.login} on GitHub`,
        text: `Check out ${currentUser.login}'s GitHub profile!`,
        url: currentUser.html_url
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(console.error);
    } else {
        copyProfileUrl();
        alert('URL copied to clipboard! (Web Share API not supported on this browser)');
    }
}

// Start app
init();
