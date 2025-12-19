import { UIComponent } from './UIComponent.js';

/**
 * Виджет часов с датой
 * Отображает текущее время с аналоговыми и цифровыми часами
 */
export class ClockWidget extends UIComponent {
    constructor(config = {}) {
        super({
            title: config.title || 'Часы',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
            </svg>`,
            ...config
        });
        
        this.intervalId = null;
        this.showAnalog = true;
    }

    render() {
        const element = super.render();
        this.startClock();
        return element;
    }

    renderContent() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        const timeString = this.formatTime(now);
        const dateString = this.formatDate(now);
        const dayOfWeek = this.getDayOfWeek(now);
        
        // Углы для стрелок аналоговых часов
        const secondsDeg = seconds * 6;
        const minutesDeg = minutes * 6 + seconds * 0.1;
        const hoursDeg = (hours % 12) * 30 + minutes * 0.5;
        
        return `
            <div class="clock">
                <div class="clock__toggle">
                    <button class="clock__toggle-btn ${this.showAnalog ? 'active' : ''}" data-type="analog">
                        Аналоговые
                    </button>
                    <button class="clock__toggle-btn ${!this.showAnalog ? 'active' : ''}" data-type="digital">
                        Цифровые
                    </button>
                </div>
                
                ${this.showAnalog ? `
                    <div class="clock__analog">
                        <div class="clock__face">
                            ${this.renderClockMarks()}
                            <div class="clock__hand clock__hand--hour" style="transform: rotate(${hoursDeg}deg)"></div>
                            <div class="clock__hand clock__hand--minute" style="transform: rotate(${minutesDeg}deg)"></div>
                            <div class="clock__hand clock__hand--second" style="transform: rotate(${secondsDeg}deg)"></div>
                            <div class="clock__center"></div>
                        </div>
                    </div>
                ` : `
                    <div class="clock__digital">
                        <span class="clock__time">${timeString}</span>
                    </div>
                `}
                
                <div class="clock__date-info">
                    <span class="clock__day">${dayOfWeek}</span>
                    <span class="clock__date">${dateString}</span>
                </div>
            </div>
        `;
    }

    /**
     * Генерирует разметки на циферблате
     */
    renderClockMarks() {
        let marks = '';
        for (let i = 0; i < 12; i++) {
            const angle = i * 30;
            const isMain = i % 3 === 0;
            marks += `<div class="clock__mark ${isMain ? 'clock__mark--main' : ''}" style="transform: rotate(${angle}deg)"></div>`;
        }
        return marks;
    }

    setupEvents() {
        const toggleBtns = this.element.querySelectorAll('.clock__toggle-btn');
        
        toggleBtns.forEach(btn => {
            const handleToggle = () => {
                this.showAnalog = btn.dataset.type === 'analog';
                this.refreshContent();
            };
            this.addEventListenerTracked(btn, 'click', handleToggle);
        });
    }

    /**
     * Запускает обновление часов каждую секунду
     */
    startClock() {
        this.intervalId = setInterval(() => {
            this.updateClock();
        }, 1000);
    }

    /**
     * Обновляет отображение времени без полной перерисовки
     */
    updateClock() {
        const now = new Date();
        
        if (this.showAnalog) {
            const seconds = now.getSeconds();
            const minutes = now.getMinutes();
            const hours = now.getHours();
            
            const secondsDeg = seconds * 6;
            const minutesDeg = minutes * 6 + seconds * 0.1;
            const hoursDeg = (hours % 12) * 30 + minutes * 0.5;
            
            const hourHand = this.element?.querySelector('.clock__hand--hour');
            const minuteHand = this.element?.querySelector('.clock__hand--minute');
            const secondHand = this.element?.querySelector('.clock__hand--second');
            
            if (hourHand) hourHand.style.transform = `rotate(${hoursDeg}deg)`;
            if (minuteHand) minuteHand.style.transform = `rotate(${minutesDeg}deg)`;
            if (secondHand) secondHand.style.transform = `rotate(${secondsDeg}deg)`;
        } else {
            const timeEl = this.element?.querySelector('.clock__time');
            if (timeEl) {
                timeEl.textContent = this.formatTime(now);
            }
        }
        
        // Обновляем дату раз в минуту
        if (now.getSeconds() === 0) {
            const dayEl = this.element?.querySelector('.clock__day');
            const dateEl = this.element?.querySelector('.clock__date');
            if (dayEl) dayEl.textContent = this.getDayOfWeek(now);
            if (dateEl) dateEl.textContent = this.formatDate(now);
        }
    }

    /**
     * Форматирует время
     */
    formatTime(date) {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Форматирует дату
     */
    formatDate(date) {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    /**
     * Возвращает название дня недели
     */
    getDayOfWeek(date) {
        return date.toLocaleDateString('ru-RU', { weekday: 'long' });
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
     * Очистка интервала при уничтожении
     */
    cleanup() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

