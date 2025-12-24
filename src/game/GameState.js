class GameState {
    constructor() {
        this.state = 'menu';
        this.money = 0;
        this.currentRun = {
            distance: 0,
            maxAltitude: 0,
            moneyEarned: 0,
            startTime: 0
        };
        
        this.upgrades = {
            speed: 1,
            weight: 1,
            aero: 1,
            fuel: 0
        };
        
        this.upgradeCosts = {
            speed: 50,
            weight: 75,
            aero: 100,
            fuel: 200
        };
        
        this.loadProgress();
    }
    
    upgradestat(type) {
        const cost = this.getUpgradeCost(type);
        
        if (this.money >= cost) {
            this.money -= cost;
            this.upgrades[type]++;
            this.saveProgress();
            return true;
        }
        
        return false;
    }
    
    getUpgradeCost(type) {
        const baseCost = this.upgradeCosts[type];
        const level = this.upgrades[type];
        return Math.floor(baseCost * Math.pow(1.5, level - (type === 'fuel' ? 0 : 1)));
    }
    
    saveProgress() {
        const saveData = {
            money: this.money,
            upgrades: this.upgrades
        };
        localStorage.setItem('flightGameSave', JSON.stringify(saveData));
    }
    
    loadProgress() {
        const saveData = localStorage.getItem('flightGameSave');
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                this.money = data.money || 0;
                this.upgrades = data.upgrades || this.upgrades;
            } catch (e) {
                console.error('Failed to load save:', e);
            }
        }
    }
    
    resetProgress() {
        this.money = 0;
        this.upgrades = { speed: 1, weight: 1, aero: 1, fuel: 0 };
        this.saveProgress();
    }
}

export default GameState;
