/**
 * Базовый (абстрактный) класс для всех виджетов
 * Реализует общую функциональность и интерфейс для наследников
 */
export class UIComponent {
    /**
     * Создаёт экземпляр UIComponent
     * @param {Object} config - конфигурация виджета
     * @param {string} config.title - заголовок виджета
     * @param {string} config.id - уникальный идентификатор
     * @param {string} config.icon - SVG иконка виджета
     */
    constructor(config = {}) {
        if (new.target === UIComponent) {
            throw new Error('UIComponent является абстрактным классом и не может быть создан напрямую');
        }
        
        this.id = config.id || `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.title = config.title || 'Виджет';
        this.icon = config.icon || '';
        this.isMinimized = false;
        this.element = null;
        this.eventListeners = [];
    }

    /**
     * Создаёт и возвращает DOM-элемент виджета
     * @returns {HTMLElement} DOM-элемент виджета
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'widget';
        this.element.id = this.id;
        this.element.dataset.widgetType = this.constructor.name;
        
        this.element.innerHTML = `
            <div class="widget__header">
                <div class="widget__title-group">
                    ${this.icon ? `<span class="widget__icon">${this.icon}</span>` : ''}
                    <h3 class="widget__title">${this.title}</h3>
                </div>
                <div class="widget__controls">
                    <button class="widget__btn widget__btn--minimize" title="Свернуть/Развернуть">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14"/>
                        </svg>
                    </button>
                    <button class="widget__btn widget__btn--close" title="Закрыть">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="widget__content">
                ${this.renderContent()}
            </div>
        `;
        
        this.setupBaseEvents();
        this.setupEvents();
        
        return this.element;
    }

    /**
     * Возвращает HTML-контент виджета
     * Должен быть переопределён в наследниках
     * @returns {string} HTML-строка с контентом
     */
    renderContent() {
        return '<p>Контент виджета</p>';
    }

    /**
     * Настраивает базовые обработчики событий (minimize, close)
     */
    setupBaseEvents() {
        const minimizeBtn = this.element.querySelector('.widget__btn--minimize');
        const closeBtn = this.element.querySelector('.widget__btn--close');
        
        const handleMinimize = () => this.minimize();
        const handleClose = () => this.close();
        
        minimizeBtn.addEventListener('click', handleMinimize);
        closeBtn.addEventListener('click', handleClose);
        
        this.eventListeners.push(
            { element: minimizeBtn, type: 'click', handler: handleMinimize },
            { element: closeBtn, type: 'click', handler: handleClose }
        );
    }

    /**
     * Настраивает специфичные для виджета обработчики событий
     * Должен быть переопределён в наследниках при необходимости
     */
    setupEvents() {
        // Переопределяется в наследниках
    }

    /**
     * Добавляет обработчик события с автоматическим отслеживанием
     * @param {HTMLElement} element - DOM элемент
     * @param {string} type - тип события
     * @param {Function} handler - обработчик
     */
    addEventListenerTracked(element, type, handler) {
        element.addEventListener(type, handler);
        this.eventListeners.push({ element, type, handler });
    }

    /**
     * Сворачивает/разворачивает виджет
     */
    minimize() {
        this.isMinimized = !this.isMinimized;
        this.element.classList.toggle('widget--minimized', this.isMinimized);
        
        const minimizeBtn = this.element.querySelector('.widget__btn--minimize');
        const svg = minimizeBtn.querySelector('svg');
        
        if (this.isMinimized) {
            svg.innerHTML = '<path d="M12 5v14M5 12h14"/>';
        } else {
            svg.innerHTML = '<path d="M5 12h14"/>';
        }
    }

    /**
     * Инициирует закрытие виджета
     * Вызывает событие для Dashboard
     */
    close() {
        const event = new CustomEvent('widget:close', {
            bubbles: true,
            detail: { widgetId: this.id }
        });
        this.element.dispatchEvent(event);
    }

    /**
     * Корректно удаляет виджет из DOM и очищает слушатели событий
     */
    destroy() {
        // Очищаем все отслеживаемые обработчики
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.eventListeners = [];
        
        // Дополнительная очистка в наследниках
        this.cleanup();
        
        // Удаляем элемент из DOM
        if (this.element && this.element.parentNode) {
            this.element.remove();
        }
        
        this.element = null;
    }

    /**
     * Дополнительная очистка ресурсов
     * Может быть переопределён в наследниках
     */
    cleanup() {
        // Переопределяется в наследниках при необходимости
    }

    /**
     * Обновляет контент виджета
     */
    updateContent() {
        const contentEl = this.element?.querySelector('.widget__content');
        if (contentEl) {
            contentEl.innerHTML = this.renderContent();
            this.setupEvents();
        }
    }
}

