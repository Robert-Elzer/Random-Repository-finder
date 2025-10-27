//Config, Octokit and DOM elements
import { Octokit, App } from "https://esm.sh/octokit";
const GITHUB_PAT = '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';
document.addEventListener("DOMContentLoaded", () => {
  const octokit = new Octokit({ auth: GITHUB_PAT });
  //Tailwind fallback, Tailwind is not a native GitHub language  
  const TAILWIND_SEARCH_QUERY = '(topic:tailwind OR language:CSS)';
  //Get DOM elements
  const languageSelect = document.getElementById("language-select");
  const fetchButton = document.getElementById("fetch-button");
  const refreshButton = document.getElementById("refresh-button");
  const statusMessage = document.getElementById("status-message");
  const repoDetails = document.getElementById("Repository-details");

  //Utility functions
  const setUIState = (type, message = '') => {
    repoDetails.classList.add('hidden');
    statusMessage.className = 'status-message';
    statusMessage.innerHTML = '';

    if (type === 'loading') {
      statusMessage.classList.add('loading');
      statusMessage.innerHTML = message;
    } else if (type === 'error') {
      statusMessage.classList.add('error');
      statusMessage.innerHTML = `<p>**Error**</p><p>${message}</p>`;
    } else if ( type === 'empty') {
      statusMessage.classList.add('empty');
      statusMessage.innerHTML = `<p>**No Results**</p><p>${message}</p>`;
    } else {
      statusMessage.classList.add('initial');
      statusMessage.innerHTML = '<p>Select a language from the dropdown to find a random GitHub repository.</p>';
    }
  };

  //Setting disabled state and text for buttons
  const setLoading = (isLoading) => {
    const selectedValue = languageSelect.value;
    const buttonToShow = selectedValue ? refreshButton : fetchButton;
    const buttonToHide = selectedValue ? fetchButton : refreshButton;

    buttonToShow.disabled = isLoading;
    languageSelect.disabled = isLoading;

    if (isLoading) {
      buttonToShow.textContent = 'Loading...';
      buttonToHide.classList.add('hidden');
      buttonToShow.classList.remove('hidden');
    } else {
      if (selectedValue) {
        refreshButton.classList.remove('hidden');
        fetchButton.classList.add('hidden');
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
      } else {
        fetchButton.classList.remove('hidden');
        refreshButton.classList.add('hidden');
        fetchButton.textContent = 'Fetch Repository';
      }
    }
  };

  //Rendering function
  const renderRepository = (repo) => {
    const description = repo.description || '*No description provided.*';
    const html = `
      <h2>
        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
            ${repo.name}
        </a>
      </h2>
      <p class="description">${description}</p>
      <div class="stats">
          <span>⭐ Stars: <b>${repo.stargazers_count.toLocaleString()}</b></span>
          <span>🍴 Forks: <b>${repo.forks_count.toLocaleString()}</b></span>
          <span>⚠️ Issues: <b>${repo.open_issues_count.toLocaleString()}</b></span>
      </div>
      `;
    repoDetails.innerHTML = html;
    repoDetails.classList.remove('hidden');
    statusMessage.innerHTML = '';
    statusMessage.className = 'status-message';
  };

  //Fetching logic
  const fetchRandomRepository = async () => {
    const selectedLanguage = languageSelect.value;
    if (!selectedLanguage) return;

    setLoading(true);
    setUIState('loading', `Searching for a random **${selectedLanguage}** repository...`);
    //Determine the search query
    let query;
    if (selectedLanguage === 'Tailwind') {
      query = TAILWIND_SEARCH_QUERY;
    } else {
      query = `language:${selectedLanguage}`;
    }
    const randomPage = Math.floor(Math.random() * 5) + 1;

    try {
      const response = await octokit.request('GET /search/repositories', {
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: 1,
        page: randomPage,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

    const data = response.data;
    if (data.items.length === 0) {
      setUIState('empty', `Could not find any popular repositories for **${selectedLanguage}** on this search page. Try refreshing!`);
      return;
    }
    renderRepository(data.items[0]);  
    } catch (error) {
      let errorMessage = 'An unknown error occured.';
      if (error.status === 403) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
      } else if (error.message) {
        errorMessage = `API Error: ${error.message}`;
      }
      setUIState('error', errorMessage);
    } finally {
      setLoading(false);
    }
    };
  //Event listeners
  setUIState('initial');
  languageSelect.addEventListener ('change', (e) => {
    if (e.target.value) {
      fetchRandomRepository();
    }
  });
  //Handle button clicks
  fetchButton.addEventListener('click', fetchRandomRepository);
  refreshButton.addEventListener('click', fetchRandomRepository);
});