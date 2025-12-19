import { UIComponent } from './UIComponent.js';

/**
 * Виджет криптовалют
 * Получает данные о курсах из CoinGecko API (бесплатный, без ключа)
 */
export class CryptoWidget extends UIComponent {
    // CoinGecko API - бесплатный, не требует API ключа
    static API_URL = 'https://api.coingecko.com/api/v3/simple/price';
    
    // Список отслеживаемых криптовалют
    static COINS = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana'];
    
    // Информация о криптовалютах
    static coinInfo = {
        bitcoin: { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
        ethereum: { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
        tether: { symbol: 'USDT', name: 'Tether', color: '#26A17B' },
        binancecoin: { symbol: 'BNB', name: 'BNB', color: '#F3BA2F' },
        solana: { symbol: 'SOL', name: 'Solana', color: '#9945FF' }
    };

    constructor(config = {}) {
        super({
            title: config.title || 'Криптовалюты',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.5 9.5c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2 0 .8-.5 1.5-1.2 1.8l-1.3.6c-.7.3-1.2 1-1.2 1.8V14"/>
                <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
            </svg>`,
            ...config
        });
        
        this.prices = null;
        this.isLoading = false;
        this.error = null;
        this.lastUpdate = null;
        this.autoRefreshInterval = null;
    }

    render() {
        const element = super.render();
        this.fetchPrices();
        this.startAutoRefresh();
        return element;
    }

    renderContent() {
        if (this.isLoading && !this.prices) {
            return `
                <div class="crypto">
                    <div class="crypto__loading">
                        <div class="crypto__spinner"></div>
                        <p>Загрузка курсов...</p>
                    </div>
                </div>
            `;
        }
        
        if (this.error && !this.prices) {
            return `
                <div class="crypto">
                    <div class="crypto__error">
                        <p>${this.error}</p>
                        <button class="crypto__refresh-btn">Попробовать снова</button>
                    </div>
                </div>
            `;
        }
        
        if (!this.prices) {
            return `
                <div class="crypto">
                    <p class="crypto__empty">Нет данных</p>
                    <button class="crypto__refresh-btn">Загрузить</button>
                </div>
            `;
        }
        
        const coinsHtml = CryptoWidget.COINS.map(coinId => {
            const coin = CryptoWidget.coinInfo[coinId];
            const price = this.prices[coinId];
            
            if (!price) return '';
            
            const changeClass = price.usd_24h_change >= 0 ? 'crypto__change--up' : 'crypto__change--down';
            const changeIcon = price.usd_24h_change >= 0 ? '▲' : '▼';
            
            return `
                <div class="crypto__coin">
                    <div class="crypto__coin-icon" style="background: ${coin.color}20; color: ${coin.color}">
                        ${coin.symbol}
                    </div>
                    <div class="crypto__coin-info">
                        <span class="crypto__coin-name">${coin.name}</span>
                        <span class="crypto__coin-symbol">${coin.symbol}</span>
                    </div>
                    <div class="crypto__coin-price">
                        <span class="crypto__price">$${this.formatPrice(price.usd)}</span>
                        <span class="crypto__change ${changeClass}">
                            ${changeIcon} ${Math.abs(price.usd_24h_change).toFixed(2)}%
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="crypto">
                <div class="crypto__list">
                    ${coinsHtml}
                </div>
                <div class="crypto__footer">
                    <span class="crypto__updated ${this.isLoading ? 'crypto__updated--loading' : ''}">
                        ${this.isLoading ? 'Обновление...' : `Обновлено: ${this.formatTime(this.lastUpdate)}`}
                    </span>
                    <button class="crypto__refresh-btn" ${this.isLoading ? 'disabled' : ''}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="${this.isLoading ? 'spinning' : ''}">
                            <path d="M23 4v6h-6"/>
                            <path d="M1 20v-6h6"/>
                            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    setupEvents() {
        const refreshBtn = this.element.querySelector('.crypto__refresh-btn');
        
        if (refreshBtn) {
            const handleRefresh = () => {
                if (!this.isLoading) this.fetchPrices();
            };
            this.addEventListenerTracked(refreshBtn, 'click', handleRefresh);
        }
    }

    async fetchPrices() {
        this.isLoading = true;
        this.error = null;
        
        // Не обновляем контент если есть данные (чтобы не мигало)
        if (!this.prices) {
            this.refreshContent();
        } else {
            this.updateFooter();
        }
        
        try {
            const coins = CryptoWidget.COINS.join(',');
            const response = await fetch(
                `${CryptoWidget.API_URL}?ids=${coins}&vs_currencies=usd&include_24hr_change=true`
            );
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки');
            }
            
            const data = await response.json();
            this.prices = data;
            this.lastUpdate = new Date();
            
        } catch (err) {
            console.error('Ошибка загрузки криптовалют:', err);
            this.error = 'Не удалось загрузить курсы';
        } finally {
            this.isLoading = false;
            this.refreshContent();
        }
    }

    /**
     * Запускает автообновление каждые 60 секунд
     */
    startAutoRefresh() {
        this.autoRefreshInterval = setInterval(() => {
            this.fetchPrices();
        }, 60000);
    }

    /**
     * Форматирует цену для отображения
     */
    formatPrice(price) {
        if (price >= 1000) {
            return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        } else if (price >= 1) {
            return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        }
    }

    /**
     * Форматирует время последнего обновления
     */
    formatTime(date) {
        if (!date) return '—';
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Обновляет только footer без полной перерисовки
     */
    updateFooter() {
        const footer = this.element?.querySelector('.crypto__footer');
        if (footer) {
            const updatedSpan = footer.querySelector('.crypto__updated');
            if (updatedSpan) {
                updatedSpan.textContent = this.isLoading ? 'Обновление...' : `Обновлено: ${this.formatTime(this.lastUpdate)}`;
                updatedSpan.classList.toggle('crypto__updated--loading', this.isLoading);
            }
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

    /**
     * Очистка ресурсов при уничтожении виджета
     */
    cleanup() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }
}

