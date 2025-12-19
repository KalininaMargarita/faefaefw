import { UIComponent } from './UIComponent.js';

/**
 * Виджет погоды
 * Получает данные о погоде из Open-Meteo API (бесплатный, без ключа)
 */
export class WeatherWidget extends UIComponent {
    // Open-Meteo API - бесплатный, не требует API ключа
    static API_BASE = 'https://api.open-meteo.com/v1/forecast';
    static GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
    
    // Код погоды -> иконка и описание
    static weatherCodes = {
        0: { icon: '☀️', description: 'Ясно' },
        1: { icon: '🌤️', description: 'Преимущественно ясно' },
        2: { icon: '⛅', description: 'Переменная облачность' },
        3: { icon: '☁️', description: 'Облачно' },
        45: { icon: '🌫️', description: 'Туман' },
        48: { icon: '🌫️', description: 'Изморозь' },
        51: { icon: '🌧️', description: 'Лёгкая морось' },
        53: { icon: '🌧️', description: 'Морось' },
        55: { icon: '🌧️', description: 'Сильная морось' },
        61: { icon: '🌧️', description: 'Небольшой дождь' },
        63: { icon: '🌧️', description: 'Дождь' },
        65: { icon: '🌧️', description: 'Сильный дождь' },
        66: { icon: '🌨️', description: 'Ледяной дождь' },
        67: { icon: '🌨️', description: 'Сильный ледяной дождь' },
        71: { icon: '🌨️', description: 'Небольшой снег' },
        73: { icon: '🌨️', description: 'Снег' },
        75: { icon: '❄️', description: 'Сильный снег' },
        77: { icon: '❄️', description: 'Снежная крупа' },
        80: { icon: '🌦️', description: 'Небольшой ливень' },
        81: { icon: '🌦️', description: 'Ливень' },
        82: { icon: '⛈️', description: 'Сильный ливень' },
        85: { icon: '🌨️', description: 'Снегопад' },
        86: { icon: '🌨️', description: 'Сильный снегопад' },
        95: { icon: '⛈️', description: 'Гроза' },
        96: { icon: '⛈️', description: 'Гроза с градом' },
        99: { icon: '⛈️', description: 'Сильная гроза с градом' }
    };

    constructor(config = {}) {
        super({
            title: config.title || 'Погода',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                <circle cx="12" cy="12" r="4"/>
            </svg>`,
            ...config
        });
        
        this.weather = null;
        this.city = config.city || 'Moscow';
        this.isLoading = false;
        this.error = null;
        this.coordinates = null;
    }

    render() {
        const element = super.render();
        this.fetchWeather();
        return element;
    }

    renderContent() {
        if (this.isLoading) {
            return `
                <div class="weather">
                    <div class="weather__loading">
                        <div class="weather__spinner"></div>
                        <p>Загрузка погоды...</p>
                    </div>
                </div>
            `;
        }
        
        if (this.error) {
            return `
                <div class="weather">
                    <div class="weather__error">
                        <p>${this.error}</p>
                        <button class="weather__refresh-btn">Попробовать снова</button>
                    </div>
                </div>
            `;
        }
        
        if (!this.weather) {
            return `
                <div class="weather">
                    <div class="weather__search">
                        <input type="text" class="weather__input" placeholder="Введите город..." value="${this.city}">
                        <button class="weather__search-btn">Найти</button>
                    </div>
                </div>
            `;
        }
        
        const weatherInfo = WeatherWidget.weatherCodes[this.weather.weatherCode] || 
                          { icon: '🌡️', description: 'Неизвестно' };
        
        return `
            <div class="weather">
                <div class="weather__header">
                    <span class="weather__city">${this.escapeHtml(this.city)}</span>
                    <button class="weather__change-city" title="Изменить город">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                </div>
                <div class="weather__main">
                    <span class="weather__icon">${weatherInfo.icon}</span>
                    <div class="weather__temp-block">
                        <span class="weather__temp">${Math.round(this.weather.temperature)}°C</span>
                        <span class="weather__desc">${weatherInfo.description}</span>
                    </div>
                </div>
                <div class="weather__details">
                    <div class="weather__detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
                        </svg>
                        <span>${this.weather.humidity}%</span>
                        <small>Влажность</small>
                    </div>
                    <div class="weather__detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/>
                        </svg>
                        <span>${this.weather.windSpeed} м/с</span>
                        <small>Ветер</small>
                    </div>
                    <div class="weather__detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2v10l4 4"/>
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                        <span>${this.weather.apparentTemp}°C</span>
                        <small>Ощущается</small>
                    </div>
                </div>
                <button class="weather__refresh-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 4v6h-6"/>
                        <path d="M1 20v-6h6"/>
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                    </svg>
                    <span>Обновить</span>
                </button>
            </div>
        `;
    }

    setupEvents() {
        const refreshBtn = this.element.querySelector('.weather__refresh-btn');
        const searchBtn = this.element.querySelector('.weather__search-btn');
        const changeCityBtn = this.element.querySelector('.weather__change-city');
        const searchInput = this.element.querySelector('.weather__input');
        
        if (refreshBtn) {
            const handleRefresh = () => this.fetchWeather();
            this.addEventListenerTracked(refreshBtn, 'click', handleRefresh);
        }
        
        if (searchBtn && searchInput) {
            const handleSearch = () => {
                const city = searchInput.value.trim();
                if (city) {
                    this.city = city;
                    this.fetchWeather();
                }
            };
            this.addEventListenerTracked(searchBtn, 'click', handleSearch);
            
            const handleKeydown = (e) => {
                if (e.key === 'Enter') handleSearch();
            };
            this.addEventListenerTracked(searchInput, 'keydown', handleKeydown);
        }
        
        if (changeCityBtn) {
            const handleChangeCity = () => {
                this.weather = null;
                this.refreshContent();
            };
            this.addEventListenerTracked(changeCityBtn, 'click', handleChangeCity);
        }
    }

    async fetchWeather() {
        this.isLoading = true;
        this.error = null;
        this.refreshContent();
        
        try {
            // Сначала получаем координаты города
            const geoResponse = await fetch(
                `${WeatherWidget.GEOCODING_API}?name=${encodeURIComponent(this.city)}&count=1&language=ru`
            );
            
            if (!geoResponse.ok) throw new Error('Ошибка геокодинга');
            
            const geoData = await geoResponse.json();
            
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('Город не найден');
            }
            
            const location = geoData.results[0];
            this.city = location.name;
            this.coordinates = { lat: location.latitude, lon: location.longitude };
            
            // Теперь получаем погоду
            const weatherResponse = await fetch(
                `${WeatherWidget.API_BASE}?latitude=${this.coordinates.lat}&longitude=${this.coordinates.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
            );
            
            if (!weatherResponse.ok) throw new Error('Ошибка загрузки погоды');
            
            const weatherData = await weatherResponse.json();
            
            this.weather = {
                temperature: weatherData.current.temperature_2m,
                humidity: weatherData.current.relative_humidity_2m,
                apparentTemp: Math.round(weatherData.current.apparent_temperature),
                weatherCode: weatherData.current.weather_code,
                windSpeed: Math.round(weatherData.current.wind_speed_10m * 10 / 36) // км/ч -> м/с
            };
            
        } catch (err) {
            console.error('Ошибка загрузки погоды:', err);
            this.error = err.message || 'Не удалось загрузить погоду';
        } finally {
            this.isLoading = false;
            this.refreshContent();
        }
    }

    refreshContent() {
        this.eventListeners = this.eventListeners.filter(({ element, type, handler }) => {
            const isBaseEvent = element.classList?.contains('widget__btn--minimize') || 
                               element.classList?.contains('widget__btn--close');
            if (!isBaseEvent) {
                element.removeEventListener(type, handler);
                return false;
            }
            return true;
        });
        
        const content = this.element?.querySelector('.widget__content');
        if (content) {
            content.innerHTML = this.renderContent();
            this.setupEvents();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

