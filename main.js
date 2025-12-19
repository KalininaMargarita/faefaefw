/**
 * Personal Hub Dashboard
 * Главный файл приложения
 * 
 * Инициализирует Dashboard и настраивает обработчики событий
 * для кнопок добавления виджетов
 */

import { Dashboard } from './js/Dashboard.js';

/**
 * Класс приложения
 * Управляет инициализацией и общей логикой страницы
 */
class App {
    constructor() {
        this.dashboard = null;
        this.init();
    }

    /**
     * Инициализация приложения
     */
    init() {
        // Ждём загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Настройка приложения после загрузки DOM
     */
    setup() {
        // Создаём экземпляр Dashboard
        this.dashboard = new Dashboard('widgetsGrid');
        
        // Настраиваем обработчики кнопок добавления виджетов
        this.setupAddWidgetButtons();
        
        // Добавляем начальные виджеты для демонстрации
        this.addInitialWidgets();
        
        console.log('✨ Personal Hub Dashboard инициализирован');
    }

    /**
     * Настраивает обработчики для кнопок добавления виджетов
     */
    setupAddWidgetButtons() {
        const buttons = document.querySelectorAll('.btn--add[data-widget]');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const widgetType = button.dataset.widget;
                
                if (widgetType) {
                    // Добавляем виджет
                    const widget = this.dashboard.addWidget(widgetType);
                    
                    if (widget) {
                        // Визуальная обратная связь
                        this.animateButton(button);
                        
                        // Прокручиваем к новому виджету
                        setTimeout(() => {
                            widget.element?.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'nearest' 
                            });
                        }, 100);
                    }
                }
            });
        });
    }

    /**
     * Анимация кнопки при клике
     */
    animateButton(button) {
        button.classList.add('btn--clicked');
        setTimeout(() => {
            button.classList.remove('btn--clicked');
        }, 200);
    }

    /**
     * Добавляет начальные виджеты при загрузке
     */
    addInitialWidgets() {
        // Добавляем часы и погоду по умолчанию для демонстрации
        this.dashboard.addWidget('clock');
        this.dashboard.addWidget('weather');
    }
}

// Запускаем приложение
const app = new App();

// Экспортируем для возможного использования в консоли
window.app = app;

