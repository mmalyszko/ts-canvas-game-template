export interface IGame {
    update(deltaTime: number): void;
    render(): void;
}

export class GameLoop {

    private game: IGame;
    private readonly boundLoop: (timestamp: number) => void;

    private lastTime: number = 0;

    constructor(game: IGame) {
        this.game = game;
        this.boundLoop = this.loop.bind(this);
    }

    private loop(timestamp: number) {
        const MAX_DELTA_TIME = 100;
        const deltaTime = Math.min(timestamp - this.lastTime, MAX_DELTA_TIME);
        this.lastTime = timestamp;

        this.game.update(deltaTime);
        this.game.render();

        requestAnimationFrame(this.boundLoop);
    }

    start() {
        requestAnimationFrame(this.boundLoop);
    }
}
