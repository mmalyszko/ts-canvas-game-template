import {GameLoop} from "./core/loop.js";
import {Game} from "./game/game.js";

const IS_FULLSCREEN = false;

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

if (IS_FULLSCREEN) {
    resizeCanvas();
} else {
    canvas.width = 480;
    canvas.height = 640;
}

const game = new Game(canvas);
const loop = new GameLoop(game);

if (IS_FULLSCREEN) {
    window.addEventListener('resize', () => {
        resizeCanvas();
        game.onResize(canvas.width, canvas.height);
    });
}

loop.start();
