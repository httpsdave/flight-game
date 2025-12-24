import Game from './game/Game.js';
import UI from './game/UI.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);
    const ui = new UI(game);
    
    game.init();
    ui.init();
});
