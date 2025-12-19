import { UIComponent } from './UIComponent.js';

/**
 * Виджет списка дел
 * Реализует добавление, удаление и отметку выполнения задач
 */
export class ToDoWidget extends UIComponent {
    constructor(config = {}) {
        super({
            title: config.title || 'Список дел',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>`,
            ...config
        });
        
        // Инкапсулированное состояние списка задач
        this.tasks = [];
    }

    /**
     * Возвращает HTML-контент виджета
     */
    renderContent() {
        const tasksHtml = this.tasks.length > 0 
            ? this.tasks.map(task => this.renderTask(task)).join('')
            : '<p class="todo__empty">Нет задач. Добавьте первую!</p>';
        
        return `
            <div class="todo">
                <form class="todo__form">
                    <input 
                        type="text" 
                        class="todo__input" 
                        placeholder="Введите новую задачу..." 
                        maxlength="100"
                        required
                    >
                    <button type="submit" class="todo__add-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                    </button>
                </form>
                <ul class="todo__list">
                    ${tasksHtml}
                </ul>
                ${this.tasks.length > 0 ? `
                    <div class="todo__footer">
                        <span class="todo__count">${this.getCompletedCount()}/${this.tasks.length} выполнено</span>
                        <button class="todo__clear-btn" ${this.getCompletedCount() === 0 ? 'disabled' : ''}>
                            Очистить выполненные
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Генерирует HTML для одной задачи
     * @param {Object} task - объект задачи
     */
    renderTask(task) {
        return `
            <li class="todo__item ${task.completed ? 'todo__item--completed' : ''}" data-task-id="${task.id}">
                <label class="todo__checkbox-label">
                    <input 
                        type="checkbox" 
                        class="todo__checkbox" 
                        ${task.completed ? 'checked' : ''}
                    >
                    <span class="todo__checkmark">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <path d="M5 12l5 5L20 7"/>
                        </svg>
                    </span>
                </label>
                <span class="todo__text">${this.escapeHtml(task.text)}</span>
                <button class="todo__delete-btn" title="Удалить">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                </button>
            </li>
        `;
    }

    /**
     * Настраивает обработчики событий
     */
    setupEvents() {
        const form = this.element.querySelector('.todo__form');
        const list = this.element.querySelector('.todo__list');
        const clearBtn = this.element.querySelector('.todo__clear-btn');
        
        if (form) {
            const handleSubmit = (e) => {
                e.preventDefault();
                const input = form.querySelector('.todo__input');
                const text = input.value.trim();
                
                if (text) {
                    this.addTask(text);
                    input.value = '';
                }
            };
            this.addEventListenerTracked(form, 'submit', handleSubmit);
        }
        
        if (list) {
            // Делегирование событий для списка
            const handleListClick = (e) => {
                const item = e.target.closest('.todo__item');
                if (!item) return;
                
                const taskId = item.dataset.taskId;
                
                // Обработка чекбокса
                if (e.target.classList.contains('todo__checkbox')) {
                    this.toggleTask(taskId);
                }
                
                // Обработка удаления
                if (e.target.closest('.todo__delete-btn')) {
                    this.deleteTask(taskId);
                }
            };
            this.addEventListenerTracked(list, 'click', handleListClick);
        }
        
        if (clearBtn) {
            const handleClear = () => this.clearCompleted();
            this.addEventListenerTracked(clearBtn, 'click', handleClear);
        }
    }

    /**
     * Добавляет новую задачу
     * @param {string} text - текст задачи
     */
    addTask(text) {
        const task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text,
            completed: false,
            createdAt: new Date()
        };
        
        this.tasks.unshift(task);
        this.refreshContent();
    }

    /**
     * Переключает статус выполнения задачи
     * @param {string} taskId - ID задачи
     */
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.refreshContent();
        }
    }

    /**
     * Удаляет задачу
     * @param {string} taskId - ID задачи
     */
    deleteTask(taskId) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            this.refreshContent();
        }
    }

    /**
     * Очищает выполненные задачи
     */
    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.refreshContent();
    }

    /**
     * Возвращает количество выполненных задач
     */
    getCompletedCount() {
        return this.tasks.filter(t => t.completed).length;
    }

    /**
     * Обновляет контент без перезаписи событий
     */
    refreshContent() {
        // Очищаем старые события перед обновлением
        this.eventListeners = this.eventListeners.filter(({ element, type, handler }) => {
            const isBaseEvent = element.classList?.contains('widget__btn--minimize') || 
                               element.classList?.contains('widget__btn--close');
            if (!isBaseEvent) {
                element.removeEventListener(type, handler);
                return false;
            }
            return true;
        });
        
        const content = this.element.querySelector('.widget__content');
        if (content) {
            content.innerHTML = this.renderContent();
            this.setupEvents();
        }
    }

    /**
     * Экранирует HTML-символы для безопасного отображения
     * @param {string} text - исходный текст
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

