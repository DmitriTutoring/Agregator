const themeToggle = document.querySelector('#theme-toggle');
const themeIcon = document.querySelector('#theme-icon');
const savedTheme = localStorage.getItem('aggregator-theme');
const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
const initialTheme = savedTheme || (prefersLight ? 'light' : 'dark');
document.documentElement.dataset.theme = initialTheme;
function updateThemeButton() {
  const light = document.documentElement.dataset.theme === 'light';
  const label = light ? 'Przełącz na ciemny motyw' : 'Przełącz na jasny motyw';
  themeIcon.src = light ? '/MoonSymbol.svg' : '/SunSymbol.svg';
  themeToggle.setAttribute('aria-label', label);
  themeToggle.setAttribute('title', label);
  themeToggle.setAttribute('aria-pressed', String(light));
}
themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem('aggregator-theme', nextTheme);
  updateThemeButton();
});
updateThemeButton();
const hero = document.querySelector('#hero');
const heroImage = document.querySelector('#hero-image');
const headline = document.querySelector('#headline');
const source = document.querySelector('#source');
const storyIndex = document.querySelector('#story-index');
const storyRegion = document.querySelector('#story-region');
const storyTime = document.querySelector('#story-time');
const slideList = document.querySelector('#slide-list');
const progress = document.querySelector('#progress');
const tickerText = document.querySelector('#ticker-text');
const dateEl = document.querySelector('#current-date');
const prev = document.querySelector('#prev');
const next = document.querySelector('#next');
const categoryButtons = [...document.querySelectorAll('.category:not(:disabled)')];
const latestGrid = document.querySelector('#latest-grid');
const loadMoreButton = document.querySelector('#load-more');
const sourceOptions = document.querySelector('#source-options');
const sourceCount = document.querySelector('#source-count');
const weatherLocation = document.querySelector('#weather-location');
const weatherContent = document.querySelector('#weather-content');
const weatherSearch = document.querySelector('#weather-search');
const weatherSearchInput = document.querySelector('#weather-search-input');
const weatherSearchResults = document.querySelector('#weather-search-results');
let weatherQuery = '';
weatherLocation.innerHTML = ['B\u0069a\u0142ystok','Warszawa','Krak\u00f3w','Gda\u0144sk','Wroc\u0142aw','Pozna\u0144','\u0141\u00f3d\u017a','Lublin','Olsztyn','Suwa\u0142ki','\u0141om\u017ca'].map((name) => '<option value="'+name+'">'+name+'</option>').join('');
const selectedSources = new Set();
let sourceOptionsReady = false;

const fallback = [{
  title: 'Nie udało się pobrać wiadomości',
  source: 'Agregator',
  url: '#',
  image: '',
  region: 'polska',
  publishedAt: null
}];

let allArticles = [];
let visibleArticles = [];
let current = 0;
let timer;
const refreshInterval = 60 * 60 * 1000;
let latestArticles = [];
let latestVisibleCount = 10;
let activeFilter = 'all';


function placeholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="#273449"/><circle cx="1270" cy="270" r="230" fill="#3a4b62"/><path d="M0 760C340 560 560 870 900 640s530-120 700-230v590H0Z" fill="#314058"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function formatTime(value) {
  if (!value) return 'teraz';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'teraz';
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff >= 0 && diff < 60) return `${Math.max(diff, 1)} min temu`;
  if (diff >= 60 && diff < 1440) return `${Math.floor(diff / 60)} godz. temu`;
  return new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' }).format(d);
}

function renderSourceOptions(sources = []) {
  if (!sourceOptionsReady) sources.forEach((item) => selectedSources.add(item.id));
  sourceOptionsReady = true;
  sourceOptions.innerHTML = '';
  sources.forEach((item) => {
    const label = document.createElement('label');
    label.className = 'source-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = item.id;
    checkbox.checked = selectedSources.has(item.id);
    checkbox.addEventListener('change', () => {
      checkbox.checked ? selectedSources.add(item.id) : selectedSources.delete(item.id);
      updateSourceCount();
      latestVisibleCount = 10;
      renderLatest();
    });
    const text = document.createElement('span');
    text.textContent = item.name;
    label.append(checkbox, text);
    sourceOptions.appendChild(label);
  });
  updateSourceCount();
}

function updateSourceCount() {
  sourceCount.textContent = String(selectedSources.size);
}

function sourceFiltered(articles) {
  return articles.filter((article) => selectedSources.has(article.sourceFilterId || article.sourceId || article.sourceGroup || article.source));
}

function renderLatest() {
  latestGrid.innerHTML = '';
  const categoryLatest = activeFilter === 'all'
    ? latestArticles
    : latestArticles.filter((article) => article.category === activeFilter || article.region === activeFilter);
  const filteredLatest = sourceFiltered(categoryLatest);
  filteredLatest.slice(0, latestVisibleCount).forEach((article) => {
    const card = document.createElement('a'); card.className = 'latest-card'; card.href = article.url || '#'; card.target = '_blank'; card.rel = 'noopener noreferrer';
    card.innerHTML = '<div class="latest-image"></div><div class="latest-card-body"><span class="latest-region"></span><h3></h3><p></p><div class="latest-meta"><strong></strong><span>•</span><span></span></div></div>';
    card.querySelector('.latest-image').style.backgroundImage = 'url("' + (article.image || placeholder()) + '")';
    card.querySelector('.latest-region').textContent = (article.region || 'polska').toUpperCase(); card.querySelector('h3').textContent = article.title; card.querySelector('p').textContent = article.description || '';
    card.querySelector('.latest-meta strong').textContent = article.source || 'Nieznane źródło'; card.querySelector('.latest-meta span:last-child').textContent = formatTime(article.publishedAt); latestGrid.appendChild(card);
  });
  loadMoreButton.hidden = latestVisibleCount >= filteredLatest.length;
}
loadMoreButton.addEventListener('click', () => { latestVisibleCount += 10; renderLatest(); });
document.querySelector('#sources-all').addEventListener('click', () => {
  sourceOptions.querySelectorAll('input[type=checkbox]').forEach((checkbox) => { checkbox.checked = true; selectedSources.add(checkbox.value); });
  latestVisibleCount = 10; updateSourceCount(); renderLatest();
});
document.querySelector('#sources-none').addEventListener('click', () => {
  sourceOptions.querySelectorAll('input[type=checkbox]').forEach((checkbox) => { checkbox.checked = false; selectedSources.delete(checkbox.value); });
  latestVisibleCount = 10; updateSourceCount(); renderLatest();
});

function render() {
  if (!visibleArticles.length) return;
  const article = visibleArticles[current];
  heroImage.style.backgroundImage = `url("${article.image || placeholder()}")`;
  hero.classList.remove('active');
  requestAnimationFrame(() => hero.classList.add('active'));
  headline.textContent = article.title;
  source.textContent = article.source || 'Nieznane źródło';
  storyIndex.textContent = String(current + 1).padStart(2, '0');
  storyRegion.textContent = article.region === 'podlasie' ? 'PODLASIE' : 'POLSKA';
  storyTime.textContent = formatTime(article.publishedAt);
  hero.href = article.url || '#';
  hero.style.cursor = article.url && article.url !== '#' ? 'pointer' : 'default';
  tickerText.textContent = article.title;
  progress.style.setProperty('--progress', `${((current + 1) / visibleArticles.length) * 100}%`);

  slideList.innerHTML = '';
  visibleArticles.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = `slide-item ${index === current ? 'active' : ''}`;
    button.type = 'button';
    button.innerHTML = `<span class="slide-number">${String(index + 1).padStart(2, '0')}</span><span class="slide-title"></span>`;
    button.querySelector('.slide-title').textContent = item.title;
    button.addEventListener('click', () => goTo(index));
    slideList.appendChild(button);
  });
}

function applyFilter(filter) {
  activeFilter = filter;
  visibleArticles = filter === 'all'
    ? [...allArticles]
    : allArticles.filter((article) => article.region === filter || article.category === filter);
  current = 0;
  render();
  renderLatest();
  restart();
}

function goTo(index) {
  if (!visibleArticles.length) return;
  current = (index + visibleArticles.length) % visibleArticles.length;
  render();
  restart();
}

function restart() {
  clearInterval(timer);
  if (visibleArticles.length < 2) return;
  timer = setInterval(() => {
    current = (current + 1) % visibleArticles.length;
    render();
  }, 6500);
}

prev.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  goTo(current - 1);
});

next.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  goTo(current + 1);
});

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    categoryButtons.forEach((candidate) => candidate.classList.toggle('active', candidate === button));
    applyFilter(button.dataset.filter);
  });
});

function weatherIcon(src, className) {
  if (!src) return null;
  const image = document.createElement('img'); image.className = className; image.alt = ''; image.src = src; image.loading = 'lazy'; return image;
}
function renderWeather(data) {
  weatherContent.innerHTML = '';
  const current = document.createElement('div'); current.className = 'weather-current';
  const icon = weatherIcon(data.current.icon, 'weather-current-icon'); if (icon) current.appendChild(icon);
  const summary = document.createElement('div'); summary.className = 'weather-current-summary';
  const place = document.createElement('strong'); place.textContent = data.location.name;
  const condition = document.createElement('span'); condition.textContent = data.current.condition;
  summary.append(place, condition);
  const temp = document.createElement('span'); temp.className = 'weather-temperature'; temp.textContent = Math.round(data.current.tempC) + '°';
  current.append(summary, temp); weatherContent.appendChild(current);
  const details = document.createElement('div'); details.className = 'weather-details';
  details.textContent = 'Odczuwalna ' + Math.round(data.current.feelsLikeC) + '° · Wilgotność ' + data.current.humidity + '% · Wiatr ' + Math.round(data.current.windKph) + ' km/h';
  weatherContent.appendChild(details);

  const forecast = document.createElement('div'); forecast.className = 'weather-forecast';
  data.days.forEach((day, index) => {
    const row = document.createElement('div'); row.className = 'weather-day';
    const date = new Date(day.date + 'T12:00:00');
    const name = document.createElement('span'); name.className = 'weather-day-name';
    name.textContent = index === 0 ? 'Dziś' : new Intl.DateTimeFormat('pl-PL', { weekday: 'short' }).format(date) + ' ' + date.getDate();
    const icon = weatherIcon(day.icon, 'weather-day-icon');
    const range = document.createElement('strong'); range.textContent = Math.round(day.minC) + '° / ' + Math.round(day.maxC) + '°';
    const precipitation = document.createElement('span'); precipitation.className = 'weather-rain';
    const amount = Number(day.precipMm || 0);
    precipitation.textContent = amount > 0 ? amount.toFixed(1).replace('.', ',') + ' mm' : '—';
    precipitation.title = 'Suma opadów';
    row.append(name); if (icon) row.append(icon); row.append(range, precipitation); forecast.appendChild(row);
  });
  weatherContent.appendChild(forecast);
}
async function loadWeather() {
  const location = weatherQuery || weatherLocation.value;
  weatherContent.textContent = 'Ładowanie prognozy...';
  try {
    const response = await fetch('/api/weather?location='+encodeURIComponent(location));
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Nie udało się pobrać prognozy.');
    renderWeather(data);
  } catch (error) {
    weatherContent.innerHTML = '';
    const message=document.createElement('p'); message.className='weather-message'; message.textContent=error.message; weatherContent.appendChild(message);
    if (error.message.includes('Dodaj klucz WeatherAPI do ustawień serwera.')) { const help=document.createElement('small'); help.className='weather-setup-note'; help.textContent='Ustaw WEATHERAPI_KEY w pliku .env obok server.js i uruchom ponownie serwer.'; weatherContent.appendChild(help); }
  }
}
const savedWeatherLocation = localStorage.getItem('weather-location');
weatherLocation.value = [...weatherLocation.options].some((option) => option.value === savedWeatherLocation) ? savedWeatherLocation : weatherLocation.options[0].value;
weatherLocation.addEventListener('change', () => { weatherQuery = ''; localStorage.setItem('weather-location', weatherLocation.value); loadWeather(); });
weatherSearch.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = weatherSearchInput.value.trim();
  weatherSearchResults.textContent = 'Wyszukiwanie...';
  try {
    const response = await fetch('/api/weather/search?q=' + encodeURIComponent(query));
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Nie udało się wyszukać miejscowości.');
    weatherSearchResults.innerHTML = '';
    if (!data.results.length) { weatherSearchResults.textContent = 'Nie znaleziono miejscowości w Polsce.'; return; }
    data.results.forEach((place) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'weather-search-result';
      button.textContent = [place.name, place.region].filter(Boolean).join(', ');
      button.addEventListener('click', () => { weatherQuery = place.query; weatherSearchResults.innerHTML = ''; loadWeather(); });
      weatherSearchResults.appendChild(button);
    });
  } catch (error) { weatherSearchResults.textContent = error.message; }
});

const currencyList = document.querySelector('#currency-list');
const cryptoList = document.querySelector('#crypto-list');
const metalsList = document.querySelector('#metals-list');
const lottoTabs = document.querySelector('#lotto-tabs');
const lottoList = document.querySelector('#lotto-list');
const fuelList = document.querySelector('#fuel-list');
const formatPln = (value) => new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' zł';
function renderCurrencies(data) {
  currencyList.innerHTML = '';
  data.rates.forEach((rate) => { const row = document.createElement('div'); row.className = 'market-row'; row.innerHTML = '<span><strong>'+rate.code+'</strong><small>'+rate.name+'</small></span><b>'+formatPln(rate.value)+'</b>'; currencyList.appendChild(row); });
}
function renderCrypto(data) {
  cryptoList.innerHTML = '';
  data.rates.forEach((rate) => { const row = document.createElement('div'); row.className = 'market-row'; const change = Number(rate.change24h); const trend = document.createElement('small'); trend.className = 'market-change ' + (change >= 0 ? 'up' : 'down'); trend.textContent = (change >= 0 ? '+' : '') + change.toFixed(2).replace('.', ',') + '%'; row.innerHTML = '<span><strong>'+rate.symbol+'</strong><small>'+rate.name+'</small></span><b>'+formatPln(rate.value)+'</b>'; row.querySelector('span').appendChild(trend); cryptoList.appendChild(row); });
}
function renderMetals(data) {
  metalsList.innerHTML = '';
  data.rates.forEach((rate) => { const row = document.createElement('div'); row.className = 'market-row'; const change = Number(rate.change24h); const trend = document.createElement('small'); trend.className = 'market-change ' + (change >= 0 ? 'up' : 'down'); trend.textContent = (change >= 0 ? '+' : '') + change.toFixed(2).replace('.', ',') + '%'; row.innerHTML = '<span><strong>'+rate.symbol+'</strong><small>'+rate.name+' ('+rate.unit+')</small></span><b>'+Number(rate.value).toLocaleString('pl-PL',{maximumFractionDigits:2})+' USD</b>'; row.querySelector('span').appendChild(trend); metalsList.appendChild(row); });
}
function formatManualDate(value) {
  if (!value) return '';
  const date = new Date(value + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
function renderLottoGame(game) {
  lottoList.innerHTML = '';
  if (Array.isArray(game?.numbers) && game.numbers.length) {
    const heading = document.createElement('strong');
    heading.textContent = (game.name || 'Lotto') + (game.drawDate ? ' · ' + formatManualDate(game.drawDate) : '');
    lottoList.appendChild(heading);
    const numbers = document.createElement('div');
    numbers.className = 'manual-numbers';
    game.numbers.forEach((value) => {
      const number = document.createElement('span');
      number.textContent = value;
      numbers.appendChild(number);
    });
    lottoList.appendChild(numbers);
    if (Array.isArray(game.extraNumbers) && game.extraNumbers.length) {
      const extra = document.createElement('small');
      extra.className = 'market-note';
      extra.textContent = 'Dodatkowe liczby: ' + game.extraNumbers.join(' · ');
      lottoList.appendChild(extra);
    }
    if (game.plusNumber !== undefined && game.plusNumber !== null && game.plusNumber !== '') {
      const plus = document.createElement('small');
      plus.className = 'market-note';
      plus.textContent = 'Plus: ' + game.plusNumber;
      lottoList.appendChild(plus);
    }
    if (game.drawNumber) {
      const draw = document.createElement('small');
      draw.className = 'market-note';
      draw.textContent = 'Numer losowania: ' + game.drawNumber;
      lottoList.appendChild(draw);
    }
  } else {
    lottoList.textContent = 'Brak wpisanego wyniku.';
  }
}
function renderManualInfo(data) {
  const lotto = data.lotto || {};
  const games = Array.isArray(lotto.games)
    ? lotto.games
    : (Array.isArray(lotto.numbers) ? [lotto] : []);
  lottoTabs.innerHTML = '';
  if (games.length) {
    const activeKey = lotto.activeGame || games[0].key || games[0].name;
    const activeGame = games.find((game) => (game.key || game.name) === activeKey) || games[0];
    games.forEach((game) => {
      const key = game.key || game.name;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'lotto-tab' + (game === activeGame ? ' active' : '');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', game === activeGame ? 'true' : 'false');
      tab.textContent = game.name || 'Lotto';
      tab.addEventListener('click', () => {
        lottoTabs.querySelectorAll('.lotto-tab').forEach((item) => {
          const selected = item === tab;
          item.classList.toggle('active', selected);
          item.setAttribute('aria-selected', selected ? 'true' : 'false');
        });
        renderLottoGame(game);
      });
      tab.dataset.game = key;
      lottoTabs.appendChild(tab);
    });
    renderLottoGame(activeGame);
  } else {
    lottoList.textContent = 'Brak wpisanego wyniku.';
  }

  fuelList.innerHTML = '';
  const fuel = data.fuel || {};
  const labels = [['pb95', 'Pb95'], ['diesel', 'ON'], ['lpg', 'LPG']];
  const available = labels.filter(([key]) => Number.isFinite(Number(fuel.prices?.[key])));
  if (available.length) {
    available.forEach(([key, label]) => {
      const row = document.createElement('div');
      row.className = 'market-row';
      row.innerHTML = '<span><strong>' + label + '</strong></span><b>' + Number(fuel.prices[key]).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (fuel.unit || 'PLN/l') + '</b>';
      fuelList.appendChild(row);
    });
    const date = document.createElement('small');
    date.className = 'market-note';
    date.textContent = 'Stan na: ' + (fuel.asOf || 'brak daty');
    fuelList.appendChild(date);
  } else {
    fuelList.textContent = 'Brak wpisanych cen.';
  }
}async function loadMarkets() {
  try { const response = await fetch('/api/markets/currencies'); const data = await response.json(); if (!response.ok) throw new Error(data.message); renderCurrencies(data); } catch (error) { currencyList.textContent = error.message || 'Kursy walut są chwilowo niedostępne.'; }
  try { const response = await fetch('/api/markets/crypto'); const data = await response.json(); if (!response.ok) throw new Error(data.message); renderCrypto(data); } catch (error) { cryptoList.textContent = error.message || 'Kursy kryptowalut są chwilowo niedostępne.'; }
  try { const response = await fetch('/api/markets/metals'); const data = await response.json(); if (!response.ok) throw new Error(data.message); renderMetals(data); } catch (error) { metalsList.textContent = error.message || 'Ceny metali są chwilowo niedostępne.'; }
  try { const response = await fetch('/api/manual-info'); const data = await response.json(); if (!response.ok) throw new Error(data.message); renderManualInfo(data); } catch (error) { lottoList.textContent = error.message || 'Wyniki LOTTO sa chwilowo niedostepne.'; fuelList.textContent = error.message || 'Ceny paliw sa chwilowo niedostepne.'; }
}



function setDate() {
  dateEl.textContent = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long', day: '2-digit', month: 'long'
  }).format(new Date());
}

async function load() {
  try {
    const response = await fetch('/api/news?limit=5');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    latestArticles = data.latest || [];
    allArticles = data.articles?.length ? data.articles : fallback;
    renderSourceOptions(data.sources || []);

  } catch {
    allArticles = fallback;
    latestArticles = [];
  }

  visibleArticles = activeFilter === 'all'
    ? [...allArticles]
    : allArticles.filter((article) => article.region === activeFilter || article.category === activeFilter);
  current = 0;
  render();
  restart();
}

setDate();
load();
loadWeather();
loadMarkets();
setInterval(load, refreshInterval);
setInterval(loadWeather, 30 * 60 * 1000);
setInterval(loadMarkets, 15 * 60 * 1000);
