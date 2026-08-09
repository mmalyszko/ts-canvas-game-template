import {GameLoop, IGame} from "../src/core/loop";

describe("GameLoop", () => {
    test("each animation frame calls update()", () => {
        let animationFrameCallback: ((timestamp: number) => void) | undefined;

        (global as any).requestAnimationFrame = (callback: (timestamp: number) => void) => {
            animationFrameCallback = callback;
            return 0;
        };

        let counter = 0;
        const game: IGame = {
            update: () => {
                counter++;
            },
            render: () => {
            },
        };

        const gameLoop = new GameLoop(game);
        gameLoop.start();

        animationFrameCallback!(1000);
        animationFrameCallback!(1010);
        animationFrameCallback!(1020);

        expect(counter).toBe(3);
    });
});
