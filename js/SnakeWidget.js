import { UIComponent } from './UIComponent.js';

/**
 * Виджет игры "Змейка"
 */
export class SnakeWidget extends UIComponent {
    constructor(config = {}) {
        super({
            title: config.title || 'Змейка',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3c-1.5 0-2.5 1-2.5 2s1 2 2.5 2 2.5 1 2.5 2-1 2-2.5 2-2.5 1-2.5 2 1 2 2.5 2 2.5 1 2.5 2-1 2-2.5 2"/>
                <circle cx="12" cy="19" r="1" fill="currentColor"/>
            </svg>`,
            ...config
        });
        
        this.gridSize = 15;
        this.cellSize = 18;
        this.snake = [];
        this.food = null;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.gameInterval = null;
        this.isPlaying = false;
        this.isGameOver = false;
        this.speed = 150;
        this.boundKeyHandler = null;
    }

    renderContent() {
        const canvasSize = this.gridSize * this.cellSize;
        
        return `
            <div class="snake-game">
                <div class="snake-game__header">
                    <div class="snake-game__score">
                        <span>Счёт: <strong>${this.score}</strong></span>
                    </div>
                    <div class="snake-game__high-score">
                        <span>Рекорд: <strong>${this.highScore}</strong></span>
                    </div>
                </div>
                
                <div class="snake-game__canvas-wrapper">
                    <canvas 
                        class="snake-game__canvas" 
                        width="${canvasSize}" 
                        height="${canvasSize}"
                    ></canvas>
                    
                    ${this.isGameOver ? `
                        <div class="snake-game__overlay">
                            <div class="snake-game__game-over">
                                <h3>Игра окончена!</h3>
                                <p>Счёт: ${this.score}</p>
                                ${this.score === this.highScore && this.score > 0 ? '<p class="snake-game__new-record">🏆 Новый рекорд!</p>' : ''}
                                <button class="snake-game__btn snake-game__btn--restart">Играть снова</button>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${!this.isPlaying && !this.isGameOver ? `
                        <div class="snake-game__overlay">
                            <div class="snake-game__start">
                                <p>Управление: WASD или стрелки</p>
                                <button class="snake-game__btn snake-game__btn--start">▶ Начать игру</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="snake-game__controls">
                    <div class="snake-game__controls-row">
                        <button class="snake-game__control-btn" data-dir="up">▲</button>
                    </div>
                    <div class="snake-game__controls-row">
                        <button class="snake-game__control-btn" data-dir="left">◀</button>
                        <button class="snake-game__control-btn" data-dir="down">▼</button>
                        <button class="snake-game__control-btn" data-dir="right">▶</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEvents() {
        const startBtn = this.element.querySelector('.snake-game__btn--start');
        const restartBtn = this.element.querySelector('.snake-game__btn--restart');
        const controlBtns = this.element.querySelectorAll('.snake-game__control-btn');
        
        if (startBtn) {
            this.addEventListenerTracked(startBtn, 'click', () => this.startGame());
        }
        
        if (restartBtn) {
            this.addEventListenerTracked(restartBtn, 'click', () => this.startGame());
        }
        
        // Мобильные кнопки управления
        controlBtns.forEach(btn => {
            this.addEventListenerTracked(btn, 'click', () => {
                if (this.isPlaying) {
                    this.setDirection(btn.dataset.dir);
                }
            });
        });
        
        // Клавиатура
        this.boundKeyHandler = (e) => this.handleKeyPress(e);
        document.addEventListener('keydown', this.boundKeyHandler);
        
        // Отрисовка начального состояния
        this.draw();
    }

    handleKeyPress(e) {
        if (!this.isPlaying) return;
        
        const keyMap = {
            'ArrowUp': 'up', 'KeyW': 'up',
            'ArrowDown': 'down', 'KeyS': 'down',
            'ArrowLeft': 'left', 'KeyA': 'left',
            'ArrowRight': 'right', 'KeyD': 'right'
        };
        
        const dir = keyMap[e.code];
        if (dir) {
            e.preventDefault();
            this.setDirection(dir);
        }
    }

    setDirection(newDir) {
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (opposites[newDir] !== this.direction) {
            this.nextDirection = newDir;
        }
    }

    startGame() {
        // Сброс состояния
        this.snake = [
            { x: 7, y: 7 },
            { x: 6, y: 7 },
            { x: 5, y: 7 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.isPlaying = true;
        this.isGameOver = false;
        this.speed = 150;
        
        this.spawnFood();
        this.refreshContent();
        
        // Запуск игрового цикла
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), this.speed);
    }

    spawnFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        this.food = newFood;
    }

    gameLoop() {
        this.direction = this.nextDirection;
        
        // Вычисляем новую позицию головы
        const head = { ...this.snake[0] };
        
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        
        // Проверка столкновений со стенами
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            this.gameOver();
            return;
        }
        
        // Проверка столкновения с собой
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        // Добавляем новую голову
        this.snake.unshift(head);
        
        // Проверка съедания еды
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.spawnFood();
            
            // Ускорение каждые 50 очков
            if (this.score % 50 === 0 && this.speed > 80) {
                this.speed -= 10;
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => this.gameLoop(), this.speed);
            }
            
            this.updateScore();
        } else {
            // Убираем хвост если не съели еду
            this.snake.pop();
        }
        
        this.draw();
    }

    draw() {
        const canvas = this.element?.querySelector('.snake-game__canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const cell = this.cellSize;
        
        // Очистка
        ctx.fillStyle = '#1a1d23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Сетка
        ctx.strokeStyle = '#2d323c';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cell, 0);
            ctx.lineTo(i * cell, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cell);
            ctx.lineTo(canvas.width, i * cell);
            ctx.stroke();
        }
        
        // Еда
        if (this.food) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(
                this.food.x * cell + cell / 2,
                this.food.y * cell + cell / 2,
                cell / 2 - 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Блик
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.arc(
                this.food.x * cell + cell / 2 - 2,
                this.food.y * cell + cell / 2 - 2,
                3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // Змейка
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            
            // Градиент от головы к хвосту
            const greenValue = Math.max(100, 200 - index * 5);
            ctx.fillStyle = isHead ? '#22c55e' : `rgb(34, ${greenValue}, 94)`;
            
            // Скругленные углы для сегментов
            const padding = 1;
            const radius = 4;
            const x = segment.x * cell + padding;
            const y = segment.y * cell + padding;
            const size = cell - padding * 2;
            
            ctx.beginPath();
            ctx.roundRect(x, y, size, size, radius);
            ctx.fill();
            
            // Глаза на голове
            if (isHead) {
                ctx.fillStyle = '#000';
                const eyeSize = 3;
                let eye1X, eye1Y, eye2X, eye2Y;
                
                switch (this.direction) {
                    case 'up':
                        eye1X = x + 4; eye1Y = y + 4;
                        eye2X = x + size - 7; eye2Y = y + 4;
                        break;
                    case 'down':
                        eye1X = x + 4; eye1Y = y + size - 7;
                        eye2X = x + size - 7; eye2Y = y + size - 7;
                        break;
                    case 'left':
                        eye1X = x + 4; eye1Y = y + 4;
                        eye2X = x + 4; eye2Y = y + size - 7;
                        break;
                    case 'right':
                    default:
                        eye1X = x + size - 7; eye1Y = y + 4;
                        eye2X = x + size - 7; eye2Y = y + size - 7;
                }
                
                ctx.beginPath();
                ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    updateScore() {
        const scoreEl = this.element?.querySelector('.snake-game__score strong');
        if (scoreEl) scoreEl.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            const highScoreEl = this.element?.querySelector('.snake-game__high-score strong');
            if (highScoreEl) highScoreEl.textContent = this.highScore;
        }
    }

    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;
        
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        this.refreshContent();
    }

    cleanup() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        if (this.boundKeyHandler) {
            document.removeEventListener('keydown', this.boundKeyHandler);
            this.boundKeyHandler = null;
        }
    }
}

