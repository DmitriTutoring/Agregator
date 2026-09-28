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
  return articles.filter((article) => selectedSources.has(article.sourceId || article.sourceGroup || article.source));
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

const weatherEmoji = (code) => ({1000:'??',1003:'???',1006:'??',1009:'??',1030:'???',1135:'???',1150:'???',1180:'???',1183:'???',1186:'???',1189:'???',1192:'???',1195:'???',1063:'???',1066:'???',1210:'???',1213:'???',1216:'??',1219:'??',1222:'??',1225:'??',1087:'??'}[code] || '???');
function renderWeather(data) {
  weatherContent.innerHTML = '';
  const current = document.createElement('div'); current.className = 'weather-current';
  const icon = document.createElement('span'); icon.className = 'weather-current-icon'; icon.textContent = weatherEmoji(data.current.code);
  const summary = document.createElement('div'); summary.className = 'weather-current-summary';
  const place = document.createElement('strong'); place.textContent = data.location.name;
  const condition = document.createElement('span'); condition.textContent = data.current.condition;
  summary.append(place, condition);
  const temp = document.createElement('span'); temp.className = 'weather-temperature'; temp.textContent = Math.round(data.current.tempC) + String.fromCodePoint(0x00b0);
  current.append(icon, summary, temp); weatherContent.appendChild(current);
  const details = document.createElement('div'); details.className = 'weather-details';
  details.textContent = 'Odczuwalna ' + Math.round(data.current.feelsLikeC) + String.fromCodePoint(0x00b0) + '  ?  Wiatr ' + Math.round(data.current.windKph) + ' km/h'; weatherContent.appendChild(details);
  const forecast = document.createElement('div'); forecast.className = 'weather-forecast';
  data.days.forEach((day, index) => {
    const row = document.createElement('div'); row.className = 'weather-day';
    const name = document.createElement('span'); name.textContent = index === 0 ? 'Dzi?' : new Intl.DateTimeFormat('pl-PL',{weekday:'short'}).format(new Date(day.date+'T12:00:00'));
    const symbol = document.createElement('span'); symbol.textContent = weatherEmoji(day.code);
    const rain = document.createElement('span'); rain.className='weather-rain'; rain.textContent = day.chanceOfRain + '%';
    const range = document.createElement('strong'); range.textContent = Math.round(day.maxC)+String.fromCodePoint(0x00b0)+' / '+Math.round(day.minC)+String.fromCodePoint(0x00b0);
    row.append(name,symbol,rain,range); forecast.appendChild(row);
  });
  weatherContent.appendChild(forecast);
}

async function loadWeather() {
  const location = weatherLocation.value;
  weatherContent.textContent = '?adowanie prognozy?';
  try {
    const response = await fetch('/api/weather?location='+encodeURIComponent(location));
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Prognoza niedost?pna.');
    renderWeather(data);
  } catch (error) {
    weatherContent.innerHTML = '';
    const message=document.createElement('p'); message.className='weather-message'; message.textContent=error.message; weatherContent.appendChild(message);
    if (error.message.includes('klucz WeatherAPI')) { const help=document.createElement('small'); help.className='weather-setup-note'; help.textContent='Ustaw WEATHERAPI_KEY w pliku .env obok server.js i uruchom ponownie serwer.'; weatherContent.appendChild(help); }
  }
}
weatherLocation.value = localStorage.getItem('weather-location') || 'Bia?ystok';
weatherLocation.addEventListener('change', () => { localStorage.setItem('weather-location', weatherLocation.value); loadWeather(); });

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
setInterval(load, refreshInterval);
