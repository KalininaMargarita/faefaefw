import { UIComponent } from './UIComponent.js';

/**
 * Виджет Тамагочи - виртуальный питомец
 */
export class TamagotchiWidget extends UIComponent {
    // Спрайты питомца (ASCII арт)
    static sprites = {
        happy: `
  ∩∩
（ • ω •）
  |    |つ
  しーＪ
        `,
        sad: `
  ∩∩
（ ; ω ;）
  |    |
  しーＪ
        `,
        hungry: `
  ∩∩
（ ｡•́︿•̀｡）
  |    |
  しーＪ
        `,
        sleeping: `
  ∩∩
（－ω－）zzZ
  |    |
  しーＪ
        `,
        eating: `
  ∩∩
（ ˘ω˘ ）🍖
  |    |つ
  しーＪ
        `,
        playing: `
  ∩∩
（ ＾ω＾）🎾
  \\    /
   しーＪ
        `,
        dead: `
  ∩∩
（ ×_× ）
  |    |
  しーＪ
        `
    };

    static petNames = ['Пушок', 'Барсик', 'Мурзик', 'Котик', 'Снежок', 'Рыжик', 'Васька', 'Кузя'];

    constructor(config = {}) {
        super({
            title: config.title || 'Тамагочи',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
                <path d="M9 16c.85.63 1.885 1 3 1s2.15-.37 3-1"/>
            </svg>`,
            ...config
        });
        
        // Состояние питомца
        this.petName = this.getRandomName();
        this.hunger = 70;      // Сытость (0-100)
        this.happiness = 70;   // Счастье (0-100)
        this.energy = 70;      // Энергия (0-100)
        this.isAlive = true;
        this.isSleeping = false;
        this.currentAction = null;
        this.age = 0;          // Возраст в минутах
        
        this.decayInterval = null;
        this.ageInterval = null;
    }

    render() {
        const element = super.render();
        this.startLifeCycle();
        return element;
    }

    renderContent() {
        if (!this.isAlive) {
            return `
                <div class="tamagotchi tamagotchi--dead">
                    <div class="tamagotchi__sprite">${TamagotchiWidget.sprites.dead}</div>
                    <p class="tamagotchi__message">${this.petName} умер 😢</p>
                    <p class="tamagotchi__submessage">Прожил ${this.age} мин.</p>
                    <button class="tamagotchi__btn tamagotchi__btn--revive">🔄 Новый питомец</button>
                </div>
            `;
        }

        const sprite = this.getCurrentSprite();
        const mood = this.getMood();
        
        return `
            <div class="tamagotchi">
                <div class="tamagotchi__header">
                    <span class="tamagotchi__name">${this.petName}</span>
                    <span class="tamagotchi__age">${this.age} мин.</span>
                </div>
                
                <div class="tamagotchi__sprite ${this.isSleeping ? 'tamagotchi__sprite--sleeping' : ''}">${sprite}</div>
                
                <div class="tamagotchi__mood">${mood.emoji} ${mood.text}</div>
                
                <div class="tamagotchi__stats">
                    <div class="tamagotchi__stat">
                        <span class="tamagotchi__stat-label">🍖 Сытость</span>
                        <div class="tamagotchi__bar">
                            <div class="tamagotchi__bar-fill tamagotchi__bar-fill--hunger" style="width: ${this.hunger}%"></div>
                        </div>
                        <span class="tamagotchi__stat-value">${Math.round(this.hunger)}%</span>
                    </div>
                    <div class="tamagotchi__stat">
                        <span class="tamagotchi__stat-label">😊 Счастье</span>
                        <div class="tamagotchi__bar">
                            <div class="tamagotchi__bar-fill tamagotchi__bar-fill--happiness" style="width: ${this.happiness}%"></div>
                        </div>
                        <span class="tamagotchi__stat-value">${Math.round(this.happiness)}%</span>
                    </div>
                    <div class="tamagotchi__stat">
                        <span class="tamagotchi__stat-label">⚡ Энергия</span>
                        <div class="tamagotchi__bar">
                            <div class="tamagotchi__bar-fill tamagotchi__bar-fill--energy" style="width: ${this.energy}%"></div>
                        </div>
                        <span class="tamagotchi__stat-value">${Math.round(this.energy)}%</span>
                    </div>
                </div>
                
                <div class="tamagotchi__actions">
                    <button class="tamagotchi__btn" data-action="feed" ${this.isSleeping ? 'disabled' : ''}>
                        🍖 Кормить
                    </button>
                    <button class="tamagotchi__btn" data-action="play" ${this.isSleeping || this.energy < 10 ? 'disabled' : ''}>
                        🎾 Играть
                    </button>
                    <button class="tamagotchi__btn" data-action="sleep">
                        ${this.isSleeping ? '☀️ Разбудить' : '😴 Спать'}
                    </button>
                </div>
            </div>
        `;
    }

    getCurrentSprite() {
        if (this.currentAction === 'eating') return TamagotchiWidget.sprites.eating;
        if (this.currentAction === 'playing') return TamagotchiWidget.sprites.playing;
        if (this.isSleeping) return TamagotchiWidget.sprites.sleeping;
        if (this.hunger < 20) return TamagotchiWidget.sprites.hungry;
        if (this.happiness < 20) return TamagotchiWidget.sprites.sad;
        return TamagotchiWidget.sprites.happy;
    }

    getMood() {
        const avg = (this.hunger + this.happiness + this.energy) / 3;
        if (this.isSleeping) return { emoji: '😴', text: 'Спит...' };
        if (avg >= 70) return { emoji: '😄', text: 'Отлично!' };
        if (avg >= 50) return { emoji: '🙂', text: 'Хорошо' };
        if (avg >= 30) return { emoji: '😐', text: 'Так себе' };
        return { emoji: '😢', text: 'Плохо!' };
    }

    setupEvents() {
        const buttons = this.element.querySelectorAll('.tamagotchi__btn[data-action]');
        buttons.forEach(btn => {
            const handleClick = () => {
                const action = btn.dataset.action;
                if (action === 'feed') this.feed();
                else if (action === 'play') this.play();
                else if (action === 'sleep') this.toggleSleep();
            };
            this.addEventListenerTracked(btn, 'click', handleClick);
        });
        
        const reviveBtn = this.element.querySelector('.tamagotchi__btn--revive');
        if (reviveBtn) {
            this.addEventListenerTracked(reviveBtn, 'click', () => this.revive());
        }
    }

    feed() {
        if (this.isSleeping || !this.isAlive) return;
        
        this.currentAction = 'eating';
        this.hunger = Math.min(100, this.hunger + 25);
        this.happiness = Math.min(100, this.happiness + 5);
        this.refreshContent();
        
        setTimeout(() => {
            this.currentAction = null;
            this.refreshContent();
        }, 1500);
    }

    play() {
        if (this.isSleeping || !this.isAlive || this.energy < 10) return;
        
        this.currentAction = 'playing';
        this.happiness = Math.min(100, this.happiness + 20);
        this.energy = Math.max(0, this.energy - 15);
        this.hunger = Math.max(0, this.hunger - 10);
        this.refreshContent();
        
        setTimeout(() => {
            this.currentAction = null;
            this.refreshContent();
        }, 2000);
    }

    toggleSleep() {
        if (!this.isAlive) return;
        
        this.isSleeping = !this.isSleeping;
        this.currentAction = null;
        this.refreshContent();
    }

    startLifeCycle() {
        // Каждые 5 секунд уменьшаем параметры
        this.decayInterval = setInterval(() => {
            if (!this.isAlive) return;
            
            if (this.isSleeping) {
                // Во сне восстанавливается энергия, но растёт голод
                this.energy = Math.min(100, this.energy + 3);
                this.hunger = Math.max(0, this.hunger - 1);
                
                // Просыпается когда энергия полная
                if (this.energy >= 100) {
                    this.isSleeping = false;
                }
            } else {
                // Бодрствование - параметры падают
                this.hunger = Math.max(0, this.hunger - 2);
                this.happiness = Math.max(0, this.happiness - 1);
                this.energy = Math.max(0, this.energy - 1);
            }
            
            // Проверка смерти
            if (this.hunger <= 0 || this.happiness <= 0) {
                this.die();
            }
            
            this.refreshContent();
        }, 5000);
        
        // Возраст увеличивается каждую минуту
        this.ageInterval = setInterval(() => {
            if (this.isAlive) {
                this.age++;
                this.refreshContent();
            }
        }, 60000);
    }

    die() {
        this.isAlive = false;
        this.isSleeping = false;
        this.currentAction = null;
        this.refreshContent();
    }

    revive() {
        this.petName = this.getRandomName();
        this.hunger = 70;
        this.happiness = 70;
        this.energy = 70;
        this.isAlive = true;
        this.isSleeping = false;
        this.currentAction = null;
        this.age = 0;
        this.refreshContent();
    }

    getRandomName() {
        return TamagotchiWidget.petNames[Math.floor(Math.random() * TamagotchiWidget.petNames.length)];
    }

    cleanup() {
        if (this.decayInterval) {
            clearInterval(this.decayInterval);
            this.decayInterval = null;
        }
        if (this.ageInterval) {
            clearInterval(this.ageInterval);
            this.ageInterval = null;
        }
    }
}

