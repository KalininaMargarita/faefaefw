import { UIComponent } from './UIComponent.js';

/**
 * Виджет случайных цитат
 * Получает цитаты из внешнего API
 */
export class QuoteWidget extends UIComponent {
    // API для получения цитат (бесплатный, без ключа)
    static API_URL = 'https://api.quotable.io/random';
    
    // Резервные цитаты на случай ошибки API
    static fallbackQuotes = [
        { content: "Единственный способ делать великую работу — любить то, что вы делаете.", author: "Стив Джобс" },
        { content: "Будьте собой; все остальные роли уже заняты.", author: "Оскар Уайльд" },
        { content: "Жизнь — это то, что происходит, пока вы строите другие планы.", author: "Джон Леннон" },
        { content: "Успех — это способность идти от неудачи к неудаче, не теряя энтузиазма.", author: "Уинстон Черчилль" },
        { content: "Будущее принадлежит тем, кто верит в красоту своей мечты.", author: "Элеонора Рузвельт" },
        { content: "Простота — это высшая степень изощрённости.", author: "Леонардо да Винчи" },
        { content: "Делай, что можешь, с тем, что имеешь, там, где ты есть.", author: "Теодор Рузвельт" },
        { content: "Воображение важнее знания.", author: "Альберт Эйнштейн" },
        { content: "Лучший способ предсказать будущее — создать его.", author: "Питер Друкер" },
        { content: "Не бойтесь идти медленно, бойтесь стоять на месте.", author: "Китайская пословица" }
    ];

    constructor(config = {}) {
        super({
            title: config.title || 'Цитата дня',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1z"/>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
            </svg>`,
            ...config
        });
        
        this.currentQuote = null;
        this.isLoading = false;
        this.error = null;
    }

    /**
     * Рендерит виджет и загружает цитату
     */
    render() {
        const element = super.render();
        this.fetchQuote();
        return element;
    }

    /**
     * Возвращает HTML-контент виджета
     */
    renderContent() {
        if (this.isLoading) {
            return `
                <div class="quote">
                    <div class="quote__loading">
                        <div class="quote__spinner"></div>
                        <p>Загрузка цитаты...</p>
                    </div>
                </div>
            `;
        }
        
        if (this.error) {
            return `
                <div class="quote">
                    <div class="quote__error">
                        <p>${this.error}</p>
                        <button class="quote__refresh-btn">Попробовать снова</button>
                    </div>
                </div>
            `;
        }
        
        if (!this.currentQuote) {
            return `
                <div class="quote">
                    <p class="quote__empty">Нажмите кнопку для получения цитаты</p>
                    <button class="quote__refresh-btn">Получить цитату</button>
                </div>
            `;
        }
        
        return `
            <div class="quote">
                <blockquote class="quote__text">
                    <span class="quote__mark quote__mark--open">"</span>
                    ${this.escapeHtml(this.currentQuote.content)}
                    <span class="quote__mark quote__mark--close">"</span>
                </blockquote>
                <cite class="quote__author">— ${this.escapeHtml(this.currentQuote.author)}</cite>
                <button class="quote__refresh-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 4v6h-6"/>
                        <path d="M1 20v-6h6"/>
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                    </svg>
                    <span>Новая цитата</span>
                </button>
            </div>
        `;
    }

    /**
     * Настраивает обработчики событий
     */
    setupEvents() {
        const refreshBtn = this.element.querySelector('.quote__refresh-btn');
        
        if (refreshBtn) {
            const handleRefresh = () => this.fetchQuote();
            this.addEventListenerTracked(refreshBtn, 'click', handleRefresh);
        }
    }

    /**
     * Загружает случайную цитату из API
     */
    async fetchQuote() {
        this.isLoading = true;
        this.error = null;
        this.refreshContent();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(QuoteWidget.API_URL, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки');
            }
            
            const data = await response.json();
            
            this.currentQuote = {
                content: data.content,
                author: data.author
            };
        } catch (err) {
            console.warn('Ошибка загрузки цитаты из API, используем резервную:', err);
            // Используем резервную цитату
            this.currentQuote = this.getRandomFallbackQuote();
        } finally {
            this.isLoading = false;
            this.refreshContent();
        }
    }

    /**
     * Возвращает случайную резервную цитату
     */
    getRandomFallbackQuote() {
        const quotes = QuoteWidget.fallbackQuotes;
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    /**
     * Обновляет контент виджета
     */
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
     * Экранирует HTML-символы
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

