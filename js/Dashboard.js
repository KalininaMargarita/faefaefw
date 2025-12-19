import { ToDoWidget } from './ToDoWidget.js';
import { QuoteWidget } from './QuoteWidget.js';
import { WeatherWidget } from './WeatherWidget.js';
import { CryptoWidget } from './CryptoWidget.js';
import { ClockWidget } from './ClockWidget.js';
import { TamagotchiWidget } from './TamagotchiWidget.js';
import { SnakeWidget } from './SnakeWidget.js';

/**
 * Класс Dashboard
 * Управляет коллекцией виджетов и их отображением
 */
export class Dashboard {
    /**
     * Карта доступных типов виджетов
     */
    static widgetTypes = {
        todo: ToDoWidget,
        quote: QuoteWidget,
        weather: WeatherWidget,
        crypto: CryptoWidget,
        clock: ClockWidget,
        tamagotchi: TamagotchiWidget,
        snake: SnakeWidget
    };

    /**
     * Создаёт экземпляр Dashboard
     * @param {string} containerId - ID контейнера для виджетов
     */
    constructor(containerId = 'widgetsGrid') {
        this.container = document.getElementById(containerId);
        this.emptyState = document.getElementById('emptyState');
        this.widgets = new Map(); // Коллекция активных виджетов
        
        this.setupDelegatedEvents();
    }

    /**
     * Настраивает делегированные обработчики событий
     */
    setupDelegatedEvents() {
        // Делегирование события закрытия виджета
        this.container.addEventListener('widget:close', (e) => {
            this.removeWidget(e.detail.widgetId);
        });
    }

    /**
     * Добавляет виджет указанного типа
     * @param {string} widgetType - тип виджета (todo, quote, weather, crypto, clock)
     * @returns {UIComponent|null} - созданный виджет или null
     */
    addWidget(widgetType) {
        const WidgetClass = Dashboard.widgetTypes[widgetType];
        
        if (!WidgetClass) {
            console.error(`Неизвестный тип виджета: ${widgetType}`);
            return null;
        }
        
        const widget = new WidgetClass();
        const element = widget.render();
        
        // Добавляем анимацию появления
        element.classList.add('widget--entering');
        
        this.container.appendChild(element);
        this.widgets.set(widget.id, widget);
        
        // Убираем класс анимации после её завершения
        requestAnimationFrame(() => {
            element.classList.remove('widget--entering');
        });
        
        this.updateEmptyState();
        
        return widget;
    }

    /**
     * Удаляет виджет по ID
     * @param {string} widgetId - ID виджета для удаления
     * @returns {boolean} - успешность удаления
     */
    removeWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        
        if (!widget) {
            console.warn(`Виджет с ID ${widgetId} не найден`);
            return false;
        }
        
        // Добавляем анимацию удаления
        widget.element.classList.add('widget--leaving');
        
        // Ждём завершения анимации перед удалением
        widget.element.addEventListener('animationend', () => {
            widget.destroy();
            this.widgets.delete(widgetId);
            this.updateEmptyState();
        }, { once: true });
        
        return true;
    }

    /**
     * Получает виджет по ID
     * @param {string} widgetId - ID виджета
     * @returns {UIComponent|undefined}
     */
    getWidget(widgetId) {
        return this.widgets.get(widgetId);
    }

    /**
     * Получает все виджеты определённого типа
     * @param {string} widgetType - тип виджета
     * @returns {UIComponent[]}
     */
    getWidgetsByType(widgetType) {
        const WidgetClass = Dashboard.widgetTypes[widgetType];
        if (!WidgetClass) return [];
        
        return Array.from(this.widgets.values())
            .filter(widget => widget instanceof WidgetClass);
    }

    /**
     * Обновляет отображение пустого состояния
     */
    updateEmptyState() {
        if (this.widgets.size === 0) {
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
        }
    }

    /**
     * Удаляет все виджеты
     */
    clearAll() {
        this.widgets.forEach((widget, id) => {
            widget.destroy();
        });
        this.widgets.clear();
        this.updateEmptyState();
    }

    /**
     * Получает количество активных виджетов
     * @returns {number}
     */
    get widgetCount() {
        return this.widgets.size;
    }
}

