import Matter from 'matter-js';
import Player from './Player.js';
import World from './World.js';
import GameState from './GameState.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = Matter.Engine.create();
        this.engine.gravity.y = 0.4;
        
        this.player = null;
        this.world = null;
        this.gameState = new GameState();
        
        this.isLaunching = false;
        this.launchStart = { x: 0, y: 0 };
        this.launchEnd = { x: 0, y: 0 };
        
        this.camera = { x: 0, y: 0 };
        this.animationId = null;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        this.world = new World(this.engine, this.canvas);
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onLaunchStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.onLaunchMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onLaunchEnd(e));
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onLaunchStart({ clientX: touch.clientX, clientY: touch.clientY });
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onLaunchMove({ clientX: touch.clientX, clientY: touch.clientY });
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onLaunchEnd(e);
        });
        
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    onLaunchStart(e) {
        if (this.gameState.state !== 'launching') return;
        
        this.isLaunching = true;
        this.launchStart = { x: e.clientX, y: e.clientY };
        this.launchEnd = { ...this.launchStart };
    }
    
    onLaunchMove(e) {
        if (!this.isLaunching) return;
        this.launchEnd = { x: e.clientX, y: e.clientY };
    }
    
    onLaunchEnd(e) {
        if (!this.isLaunching) return;
        
        this.isLaunching = false;
        
        const dx = this.launchStart.x - this.launchEnd.x;
        const dy = this.launchStart.y - this.launchEnd.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30) return;
        
        const power = Math.min(distance / 80, 4) * this.gameState.upgrades.speed;
        this.launchPlane(dx * power * 0.08, dy * power * 0.08);
    }
    
    startLaunchMode() {
        this.gameState.state = 'launching';
        this.camera = { x: 0, y: 0 };
        
        const startX = 150;
        const startY = this.canvas.height - 200;
        this.player = new Player(this.engine, startX, startY, this.gameState.upgrades);
        
        window.dispatchEvent(new CustomEvent('gameStateChange', { 
            detail: { state: 'launching' }
        }));
    }
    
    launchPlane(vx, vy) {
        if (!this.player) return;
        
        this.gameState.state = 'flying';
        this.gameState.currentRun = {
            distance: 0,
            maxAltitude: 0,
            moneyEarned: 0,
            startTime: Date.now()
        };
        
        Matter.Body.setVelocity(this.player.body, { x: vx, y: vy });
        
        this.startGameLoop();
        
        window.dispatchEvent(new CustomEvent('gameStateChange', { 
            detail: { state: 'flying' }
        }));
    }
    
    startGameLoop() {
        let lastTime = performance.now();
        
        const gameLoop = (timestamp) => {
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;
            
            if (this.gameState.state === 'flying') {
                this.update(deltaTime);
                this.render();
                this.animationId = requestAnimationFrame(gameLoop);
            }
        };
        
        this.animationId = requestAnimationFrame(gameLoop);
    }
    
    update(deltaTime) {
        Matter.Engine.update(this.engine, Math.min(deltaTime, 33));
        
        if (!this.player) return;
        
        this.player.handleInput(this.keys);
        this.player.update(deltaTime);
        
        const pos = this.player.body.position;
        this.camera.x += (pos.x - this.canvas.width / 3 - this.camera.x) * 0.1;
        this.camera.y += (pos.y - this.canvas.height / 2 - this.camera.y) * 0.1;
        
        const distance = Math.max(0, Math.floor(pos.x / 10));
        const altitude = Math.max(0, Math.floor((this.canvas.height - pos.y) / 10));
        
        this.gameState.currentRun.distance = distance;
        this.gameState.currentRun.maxAltitude = Math.max(this.gameState.currentRun.maxAltitude, altitude);
        this.gameState.currentRun.moneyEarned = Math.floor(distance * 0.1) + Math.floor(altitude * 0.05);
        
        const velocity = this.player.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed < 1 && pos.y > this.canvas.height - 50) {
            this.endFlight();
        }
        
        this.world.update(pos, this.player);
        
        window.dispatchEvent(new CustomEvent('hudUpdate', {
            detail: {
                distance,
                altitude,
                money: this.gameState.money,
                fuel: this.player.boostFuel,
                maxFuel: this.player.maxBoostFuel
            }
        }));
    }
    
    render() {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.world.render(this.ctx, this.camera, this.canvas);
        
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        this.ctx.restore();
        
        if (this.isLaunching && this.gameState.state === 'launching') {
            this.renderLaunchTrajectory();
        }
    }
    
    renderLaunchTrajectory() {
        const dx = this.launchStart.x - this.launchEnd.x;
        const dy = this.launchStart.y - this.launchEnd.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(distance / 80, 4);
        
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${power / 4})`;
        this.ctx.lineWidth = 5;
        this.ctx.setLineDash([10, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.launchStart.x, this.launchStart.y);
        this.ctx.lineTo(this.launchEnd.x, this.launchEnd.y);
        this.ctx.stroke();
        
        const angle = Math.atan2(dy, dx);
        this.ctx.save();
        this.ctx.translate(this.launchEnd.x, this.launchEnd.y);
        this.ctx.rotate(angle);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-15, -8);
        this.ctx.lineTo(-15, 8);
        this.ctx.closePath();
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.restore();
        
        this.ctx.setLineDash([]);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px "Indie Flower"';
        this.ctx.fillText(`Power: ${Math.floor(power * 100)}%`, this.launchStart.x + 10, this.launchStart.y - 20);
    }
    
    endFlight() {
        this.gameState.state = 'gameover';
        this.gameState.money += this.gameState.currentRun.moneyEarned;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        window.dispatchEvent(new CustomEvent('gameOver', {
            detail: {
                distance: this.gameState.currentRun.distance,
                altitude: this.gameState.currentRun.maxAltitude,
                earned: this.gameState.currentRun.moneyEarned,
                total: this.gameState.money
            }
        }));
        
        this.gameState.saveProgress();
    }
    
    reset() {
        if (this.player) {
            Matter.World.remove(this.engine.world, this.player.body);
        }
        this.camera = { x: 0, y: 0 };
        this.world.reset();
        this.startLaunchMode();
    }
}

export default Game;
