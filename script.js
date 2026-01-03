// Retro Platform Game
class PlatformGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Game state
        this.gameState = 'start'; // start, playing, paused, gameover, levelcomplete
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.time = 999;
        this.timeInterval = null;

        // Player
        this.player = {
            x: 100,
            y: 400,
            width: 32,
            height: 32,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            jumpPower: 12,
            grounded: false,
            direction: 'right'
        };

        // Physics
        this.gravity = 0.5;
        this.friction = 0.8;

        // Input
        this.keys = {};

        // Joystick
        this.joystick = {
            active: false,
            x: 0,
            y: 0,
            centerX: 0,
            centerY: 0,
            maxDistance: 35
        };

        // Game objects
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        this.powerups = [];
        this.flag = null;

        // Animation
        this.animationId = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLevel(this.level);
    }

    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            if (e.key === 'Escape') {
                if (this.gameState === 'playing') {
                    this.pauseGame();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Buttons
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('pause-restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.nextLevel();
        });

        // Virtual Joystick
        const joystickStick = document.getElementById('joystick-stick');
        const joystickBase = document.querySelector('.joystick-base');

        const handleJoystickStart = (e) => {
            e.preventDefault();
            this.joystick.active = true;

            const rect = joystickBase.getBoundingClientRect();
            this.joystick.centerX = rect.left + rect.width / 2;
            this.joystick.centerY = rect.top + rect.height / 2;
        };

        const handleJoystickMove = (e) => {
            if (!this.joystick.active) return;
            e.preventDefault();

            const touch = e.touches ? e.touches[0] : e;
            const deltaX = touch.clientX - this.joystick.centerX;
            const deltaY = touch.clientY - this.joystick.centerY;

            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX);

            const limitedDistance = Math.min(distance, this.joystick.maxDistance);

            this.joystick.x = limitedDistance * Math.cos(angle);
            this.joystick.y = limitedDistance * Math.sin(angle);

            // Update stick position
            joystickStick.style.transform = `translate(${this.joystick.x}px, ${this.joystick.y}px)`;

            // Update movement keys based on joystick position
            const threshold = 10;
            this.keys['ArrowLeft'] = this.joystick.x < -threshold;
            this.keys['ArrowRight'] = this.joystick.x > threshold;
        };

        const handleJoystickEnd = (e) => {
            e.preventDefault();
            this.joystick.active = false;
            this.joystick.x = 0;
            this.joystick.y = 0;

            // Reset stick position
            joystickStick.style.transform = 'translate(0px, 0px)';

            // Clear movement keys
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
        };

        // Only add touch events for mobile
        joystickBase.addEventListener('touchstart', handleJoystickStart);
        joystickBase.addEventListener('touchmove', handleJoystickMove);
        joystickBase.addEventListener('touchend', handleJoystickEnd);
        joystickBase.addEventListener('touchcancel', handleJoystickEnd);

        // Jump button
        document.getElementById('btn-jump').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.player.grounded) {
                this.player.velocityY = -this.player.jumpPower;
            }
        });

        // Prevent canvas touch scrolling
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        });
    }

    loadLevel(levelNum) {
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        this.powerups = [];

        // Ground
        this.platforms.push({ x: 0, y: 568, width: 800, height: 32, color: '#228B22' });

        if (levelNum === 1) {
            // Platforms
            this.platforms.push({ x: 200, y: 450, width: 150, height: 20, color: '#8B4513' });
            this.platforms.push({ x: 400, y: 350, width: 150, height: 20, color: '#8B4513' });
            this.platforms.push({ x: 150, y: 250, width: 120, height: 20, color: '#8B4513' });
            this.platforms.push({ x: 500, y: 200, width: 180, height: 20, color: '#8B4513' });

            // Collectibles (stars)
            this.collectibles.push({ x: 250, y: 410, type: 'star', collected: false });
            this.collectibles.push({ x: 450, y: 310, type: 'star', collected: false });
            this.collectibles.push({ x: 200, y: 210, type: 'star', collected: false });
            this.collectibles.push({ x: 580, y: 160, type: 'star', collected: false });

            // Power-ups
            this.powerups.push({ x: 300, y: 320, type: 'gem', collected: false });

            // Enemies
            this.enemies.push({ x: 350, y: 530, width: 30, height: 30, velocityX: 2, direction: 1 });
            this.enemies.push({ x: 450, y: 320, width: 30, height: 30, velocityX: 2, direction: 1 });

            // Flag (goal)
            this.flag = { x: 720, y: 520, width: 30, height: 48 };
        } else if (levelNum === 2) {
            // More challenging level
            this.platforms.push({ x: 150, y: 500, width: 100, height: 20, color: '#8B4513' });
            this.platforms.push({ x: 300, y: 450, width: 100, height: 20, color: '#8B4513' });
            this.platforms.push({ x: 450, y: 400, width: 100, height: 20, color: '#8B4513' });
            this.platforms.push({ x: 250, y: 300, width: 120, height: 20, color: '#8B4513' });
            this.platforms.push({ x: 450, y: 250, width: 100, height: 20, color: '#8B4513' });
            this.platforms.push({ x: 600, y: 350, width: 150, height: 20, color: '#8B4513' });

            this.collectibles.push({ x: 180, y: 460, type: 'star', collected: false });
            this.collectibles.push({ x: 330, y: 410, type: 'star', collected: false });
            this.collectibles.push({ x: 480, y: 360, type: 'star', collected: false });
            this.collectibles.push({ x: 280, y: 260, type: 'star', collected: false });
            this.collectibles.push({ x: 670, y: 310, type: 'star', collected: false });

            this.powerups.push({ x: 300, y: 260, type: 'gem', collected: false });
            this.powerups.push({ x: 650, y: 310, type: 'gem', collected: false });

            this.enemies.push({ x: 200, y: 470, width: 30, height: 30, velocityX: 2, direction: 1 });
            this.enemies.push({ x: 350, y: 420, width: 30, height: 30, velocityX: 2, direction: 1 });
            this.enemies.push({ x: 500, y: 370, width: 30, height: 30, velocityX: 2, direction: 1 });

            this.flag = { x: 720, y: 520, width: 30, height: 48 };
        } else {
            // Victory - reload level 1 with bonus
            this.level = 1;
            this.loadLevel(1);
            this.score += 5000;
        }

        // Reset player position
        this.player.x = 100;
        this.player.y = 400;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
    }

    startGame() {
        this.gameState = 'playing';
        this.hideAllScreens();
        this.startTimer();
        document.body.classList.add('game-active');
        this.gameLoop();
    }

    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pause-screen').classList.add('active');
        document.body.classList.remove('game-active');
        this.stopTimer();
        cancelAnimationFrame(this.animationId);
    }

    resumeGame() {
        this.gameState = 'playing';
        this.hideAllScreens();
        this.startTimer();
        document.body.classList.add('game-active');
        this.gameLoop();
    }

    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.time = 999;
        this.loadLevel(this.level);
        this.updateUI();
        this.startGame();
    }

    nextLevel() {
        this.level++;
        this.time = 999;
        this.loadLevel(this.level);
        this.updateUI();
        this.startGame();
    }

    gameOver() {
        this.gameState = 'gameover';
        this.stopTimer();
        cancelAnimationFrame(this.animationId);
        document.body.classList.remove('game-active');
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-screen').classList.add('active');
    }

    levelComplete() {
        this.gameState = 'levelcomplete';
        this.stopTimer();
        cancelAnimationFrame(this.animationId);
        document.body.classList.remove('game-active');

        const timeBonus = this.time * 10;
        this.score += timeBonus;

        document.getElementById('level-score').textContent = this.score - timeBonus;
        document.getElementById('time-bonus').textContent = timeBonus;
        document.getElementById('level-complete-screen').classList.add('active');

        this.updateUI();
    }

    hideAllScreens() {
        document.querySelectorAll('.overlay').forEach(el => {
            el.classList.remove('active');
        });
    }

    startTimer() {
        this.stopTimer();
        this.timeInterval = setInterval(() => {
            this.time--;
            document.getElementById('timer').textContent = this.time.toString().padStart(3, '0');

            if (this.time <= 0) {
                this.loseLife();
            }

            if (this.time <= 10) {
                document.getElementById('timer').classList.add('blink');
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
    }

    loseLife() {
        this.lives--;
        this.updateUI();

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset player position
            this.player.x = 100;
            this.player.y = 400;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
            this.time = 999;

            // Shake effect
            document.querySelector('.game-screen').classList.add('shake');
            setTimeout(() => {
                document.querySelector('.game-screen').classList.remove('shake');
            }, 300);
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score.toString().padStart(4, '0');
        document.getElementById('lives').textContent = '❤️'.repeat(this.lives);
        document.getElementById('level').textContent = this.level.toString().padStart(2, '0');
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Player input
        if (this.keys['ArrowLeft']) {
            this.player.velocityX = -this.player.speed;
            this.player.direction = 'left';
        } else if (this.keys['ArrowRight']) {
            this.player.velocityX = this.player.speed;
            this.player.direction = 'right';
        } else {
            this.player.velocityX *= this.friction;
        }

        if (this.keys[' '] && this.player.grounded) {
            this.player.velocityY = -this.player.jumpPower;
            this.player.grounded = false;
        }

        // Apply gravity
        this.player.velocityY += this.gravity;

        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;

        // Platform collision
        this.player.grounded = false;

        this.platforms.forEach(platform => {
            if (this.checkCollision(this.player, platform)) {
                // Top collision
                if (this.player.velocityY > 0 &&
                    this.player.y + this.player.height - this.player.velocityY <= platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.grounded = true;
                }
            }
        });

        // Boundaries
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
        }

        // Fall off screen
        if (this.player.y > this.canvas.height) {
            this.loseLife();
        }

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.x += enemy.velocityX * enemy.direction;

            // Bounce off edges
            if (enemy.x <= 0 || enemy.x + enemy.width >= this.canvas.width) {
                enemy.direction *= -1;
            }

            // Enemy collision
            if (this.checkCollision(this.player, enemy)) {
                this.loseLife();
            }
        });

        // Collectibles
        this.collectibles.forEach(item => {
            if (!item.collected && this.checkPointInRect(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                { x: item.x - 10, y: item.y - 10, width: 20, height: 20 }
            )) {
                item.collected = true;
                this.score += 100;
                this.updateUI();
            }
        });

        // Power-ups
        this.powerups.forEach(item => {
            if (!item.collected && this.checkPointInRect(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                { x: item.x - 12, y: item.y - 12, width: 24, height: 24 }
            )) {
                item.collected = true;
                this.score += 500;
                this.updateUI();
            }
        });

        // Flag (goal)
        if (this.flag && this.checkCollision(this.player, this.flag)) {
            this.levelComplete();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw platforms
        this.platforms.forEach(platform => {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            // Border
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });

        // Draw collectibles
        this.collectibles.forEach(item => {
            if (!item.collected) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('⭐', item.x - 10, item.y + 5);
            }
        });

        // Draw power-ups
        this.powerups.forEach(item => {
            if (!item.collected) {
                this.ctx.fillStyle = '#FF69B4';
                this.ctx.font = '24px Arial';
                this.ctx.fillText('💎', item.x - 12, item.y + 6);
            }
        });

        // Draw enemies
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

            // Eyes
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 6);
            this.ctx.fillRect(enemy.x + 16, enemy.y + 8, 6, 6);

            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(enemy.x + 10, enemy.y + 10, 3, 3);
            this.ctx.fillRect(enemy.x + 18, enemy.y + 10, 3, 3);
        });

        // Draw flag
        if (this.flag) {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(this.flag.x, this.flag.y, 5, this.flag.height);

            this.ctx.fillStyle = '#FF0000';
            this.ctx.beginPath();
            this.ctx.moveTo(this.flag.x + 5, this.flag.y);
            this.ctx.lineTo(this.flag.x + 30, this.flag.y + 12);
            this.ctx.lineTo(this.flag.x + 5, this.flag.y + 24);
            this.ctx.fill();
        }

        // Draw player
        this.ctx.fillStyle = '#0000FF';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Player eyes
        this.ctx.fillStyle = '#FFF';
        const eyeOffset = this.player.direction === 'right' ? 18 : 8;
        this.ctx.fillRect(this.player.x + eyeOffset, this.player.y + 10, 6, 6);
        this.ctx.fillRect(this.player.x + eyeOffset + 8, this.player.y + 10, 6, 6);

        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(this.player.x + eyeOffset + 2, this.player.y + 12, 3, 3);
        this.ctx.fillRect(this.player.x + eyeOffset + 10, this.player.y + 12, 3, 3);
    }

    gameLoop() {
        this.update();
        this.draw();

        if (this.gameState === 'playing') {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    checkPointInRect(x, y, rect) {
        return x >= rect.x &&
               x <= rect.x + rect.width &&
               y >= rect.y &&
               y <= rect.y + rect.height;
    }
}

// Start the game
const game = new PlatformGame();
