class UI {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.screens = {};
    }
    
    init() {
        this.elements = {
            hud: document.getElementById('hud'),
            distance: document.getElementById('distance'),
            money: document.getElementById('money'),
            altitude: document.getElementById('altitude'),
            fuelContainer: document.getElementById('fuel-container'),
            fuelBar: document.getElementById('fuel-bar'),
            
            statSpeed: document.getElementById('stat-speed'),
            statWeight: document.getElementById('stat-weight'),
            statAero: document.getElementById('stat-aero'),
            statFuel: document.getElementById('stat-fuel')
        };
        
        this.screens = {
            launch: document.getElementById('launch-screen'),
            shop: document.getElementById('shop-screen'),
            gameover: document.getElementById('gameover-screen')
        };
        
        this.setupEventListeners();
        this.showLaunchScreen();
    }
    
    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.hideLaunchScreen();
            this.game.startLaunchMode();
        });
        
        document.querySelectorAll('.btn-upgrade').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeType = e.target.getAttribute('data-upgrade');
                this.handleUpgrade(upgradeType);
            });
        });
        
        document.getElementById('fly-again-btn').addEventListener('click', () => {
            this.hideShopScreen();
            this.game.reset();
        });
        
        document.getElementById('continue-btn').addEventListener('click', () => {
            this.hideGameOverScreen();
            this.showShopScreen();
        });
        
        window.addEventListener('hudUpdate', (e) => this.updateHUD(e.detail));
        window.addEventListener('gameOver', (e) => this.showGameOverScreen(e.detail));
        window.addEventListener('gameStateChange', (e) => {
            if (e.detail.state === 'flying') {
                this.elements.hud.style.display = 'block';
            }
        });
        
        // Quick restart (R key) - skip game over, go straight to launch
        window.addEventListener('quickRestart', () => {
            this.hideGameOverScreen();
            this.hideShopScreen();
            this.showLaunchScreen();
        });
    }
    
    showLaunchScreen() {
        this.screens.launch.classList.remove('hidden');
        this.elements.hud.style.display = 'none';
        this.updateStatsDisplay();
    }
    
    hideLaunchScreen() {
        this.screens.launch.classList.add('hidden');
    }
    
    showShopScreen() {
        this.screens.shop.classList.remove('hidden');
        this.updateShopDisplay();
    }
    
    hideShopScreen() {
        this.screens.shop.classList.add('hidden');
    }
    
    showGameOverScreen(data) {
        this.elements.hud.style.display = 'none';
        this.screens.gameover.classList.remove('hidden');
        
        document.getElementById('final-distance').textContent = data.distance;
        document.getElementById('earned-money').textContent = data.earned;
        document.getElementById('total-money').textContent = data.total;
    }
    
    hideGameOverScreen() {
        this.screens.gameover.classList.add('hidden');
    }
    
    updateHUD(data) {
        this.elements.distance.textContent = data.distance;
        this.elements.money.textContent = data.money;
        this.elements.altitude.textContent = data.altitude;
        
        if (data.maxFuel > 0) {
            this.elements.fuelContainer.style.display = 'block';
            const fuelPercent = (data.fuel / data.maxFuel) * 100;
            this.elements.fuelBar.style.width = fuelPercent + '%';
        } else {
            this.elements.fuelContainer.style.display = 'none';
        }
    }
    
    updateStatsDisplay() {
        const upgrades = this.game.gameState.upgrades;
        this.elements.statSpeed.textContent = upgrades.speed;
        this.elements.statWeight.textContent = upgrades.weight;
        this.elements.statAero.textContent = upgrades.aero;
        this.elements.statFuel.textContent = upgrades.fuel;
    }
    
    updateShopDisplay() {
        const state = this.game.gameState;
        
        document.getElementById('shop-money').textContent = state.money;
        
        ['speed', 'weight', 'aero', 'fuel'].forEach(type => {
            const level = state.upgrades[type];
            const cost = state.getUpgradeCost(type);
            
            document.getElementById(`${type}-level`).textContent = level;
            document.getElementById(`${type}-cost`).textContent = cost;
            
            const btn = document.querySelector(`[data-upgrade="${type}"]`);
            btn.disabled = state.money < cost;
            
            if (type === 'fuel' && level === 0) {
                btn.textContent = `Unlock - $${cost}`;
            } else {
                btn.textContent = `Upgrade - $${cost}`;
            }
        });
    }
    
    handleUpgrade(type) {
        const success = this.game.gameState.upgradestat(type);
        if (success) {
            this.updateShopDisplay();
            this.showUpgradeEffect(type);
        }
    }
    
    showUpgradeEffect(type) {
        const btn = document.querySelector(`[data-upgrade="${type}"]`);
        const card = btn.closest('.upgrade-card');
        card.style.transform = 'scale(1.1) rotate(2deg)';
        card.style.borderColor = '#FFD700';
        
        setTimeout(() => {
            card.style.transform = '';
            card.style.borderColor = '';
        }, 300);
    }
}

export default UI;
