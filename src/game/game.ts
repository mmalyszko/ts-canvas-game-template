import {IGame} from "../core/loop.js";
import {InputManager} from "../core/input.js";
import {AudioManager} from "../core/audio.js";
import {GameObjectManager, CollisionManager} from "../core/objects.js";
import {TextureManager} from "../core/render.js";
import {Renderer} from "./renderer.js";
import {SoundId, TextureId, GameObjectType} from "./commons.js";
import {Spaceship, Explosion, Asteroid, Missile, StarsBackground} from "./objects.js";

export class Game implements IGame {
    private input: InputManager;
    private audio: AudioManager;
    private renderer: Renderer;
    private objects:  GameObjectManager;
    private textures: TextureManager;
    private collisions: CollisionManager;

    private assetsLoaded:  boolean = false;
    private audioUnlocked: boolean = false;
    private isDebug: boolean = false;

    private spaceship: Spaceship;
    private score: number = 0;
    private timeToRespawn: number = 0;
    private static MAX_ASTEROIDS = 6;

    private gameWidth:  number;
    private gameHeight: number;

    private fps: number = 0;
    private frameCount: number = 0;
    private fpsTime: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.gameWidth  = canvas.width;
        this.gameHeight = canvas.height;

        this.textures   = new TextureManager();
        this.renderer   = new Renderer(canvas, this.textures);
        this.input      = new InputManager(canvas);
        this.audio      = new AudioManager();
        this.objects    = new GameObjectManager();
        this.collisions = new CollisionManager();

        this.objects.add(new StarsBackground(canvas.width / 2, canvas.height / 2));
        this.objects.add(new StarsBackground(canvas.width / 2, canvas.height / 2 - 600));

        this.spaceship = new Spaceship(canvas.width / 2, canvas.height - 50);
        this.objects.add(this.spaceship);

        this.registerCollisionCallbacks();

        void this.loadAssets();
    }

    private registerCollisionCallbacks() {

        this.collisions.addCollisionCallback(GameObjectType.Missile, GameObjectType.Asteroid, (objectA, objectB) => {
            const missile = objectA.objectType === GameObjectType.Missile ? objectA : objectB;
            const asteroid = objectA.objectType === GameObjectType.Asteroid ? objectA : objectB;

            this.objects.add(new Explosion(asteroid.centerX, asteroid.centerY));
            this.audio.play(SoundId.Explosion);

            missile.isActive = false;
            asteroid.isActive = false;
            this.score++;
        }, 5);

        this.collisions.addCollisionCallback(GameObjectType.Asteroid, GameObjectType.Asteroid, (objectA, objectB) => {
            if (objectA instanceof Asteroid && objectB instanceof Asteroid) {
                objectA.bounceOff(objectB);
            }
        });

        this.collisions.addCollisionCallback(GameObjectType.Spaceship, GameObjectType.Asteroid, (objectA, objectB) => {
            const spaceship = objectA.objectType === GameObjectType.Spaceship ? objectA : objectB;

            this.objects.add(new Explosion(spaceship.centerX, spaceship.centerY));
            spaceship.isActive = false;
            this.timeToRespawn = 3;
        }, 5);
    }

    onResize(width: number, height: number) {
        this.gameWidth  = width;
        this.gameHeight = height;
    }

    private async loadAssets() {
        await Promise.all([
            this.audio.loadSounds(new Map([
                [SoundId.Explosion,   'res/explosion.mp3']
            ])),
            this.textures.loadTextures(new Map([
                [TextureId.Spaceship, 'res/spaceship.png'],
                [TextureId.Explosion, 'res/explosion.png'],
                [TextureId.Asteroid,  'res/asteroid.png'],
                [TextureId.Missile,   'res/missile.png'],
                [TextureId.Starfield, 'res/space.png']
            ]))
        ]);
        this.assetsLoaded = true;
    }

    private updateFps(deltaTime: number) {
        this.frameCount++;
        this.fpsTime += deltaTime;
        if (this.fpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
        }
    }

    update(deltaTime: number) {
        if (!this.assetsLoaded) return;

        this.updateFps(deltaTime);

        if (!this.audioUnlocked && this.input.wasAnyInputPressed()) {
            this.audio.fixContext(); // fixes audio delay in Safari
            this.audioUnlocked = true;
        }

        if (this.spaceship.isActive)
        {

            if (this.input.isKeyPressed(' ')) {
                const noseOffset = (this.spaceship.height * this.spaceship.scale) / 2;
                this.objects.add(new Missile(this.spaceship.centerX, this.spaceship.centerY - noseOffset));
            }

            this.spaceship.move(
                this.input.isKeyDown('ArrowLeft'),
                this.input.isKeyDown('ArrowRight'),
                deltaTime,
                0,
                this.gameWidth
            );

        }

        if (this.input.isKeyPressed('d')) {
            this.isDebug = !this.isDebug;
        }

        if (this.input.isPointerPressed()) {
            this.objects.add(new Explosion(this.input.pointerX, this.input.pointerY));
            this.audio.play(SoundId.Explosion);
        }

        this.objects.updateAll(deltaTime);
        this.collisions.checkCollisions(this.objects.getAll());
        this.objects.deleteInactiveObjects();

        this.respawnAsteroids();
        this.respawnPlayer(deltaTime);

        this.input.clearPressedInputs();
    }

    private respawnPlayer(deltaTime: number)
    {
        if (this.timeToRespawn > 0) {
            this.timeToRespawn -= deltaTime / 1000;
            if (this.timeToRespawn < 0) {
                this.timeToRespawn = 0;
            }
        }

        const activeCount = this.objects.getAll().filter(object => object instanceof Asteroid && object.isActive).length;

        if (this.timeToRespawn <= 0 && !this.spaceship.isActive && activeCount === 0) {
            this.score = 0;
            this.spaceship = new Spaceship(this.gameWidth / 2, this.gameHeight - 50);
            this.objects.add(this.spaceship);
        }
    }

    private respawnAsteroids()
    {
        const asteroids = this.objects.getAll().filter(object => object instanceof Asteroid);

        for (const asteroid of asteroids) {
            const outOfScreen =
                asteroid.centerY > this.gameHeight + asteroid.height ||
                asteroid.centerX < -asteroid.width ||
                asteroid.centerX > this.gameWidth + asteroid.width;
            if (outOfScreen) {
                asteroid.isActive = false;
            }
        }

        if (!this.spaceship.isActive) {
            return;
        }

        const activeCount = asteroids.filter(asteroid => asteroid.isActive).length;
        for (let i = activeCount; i < Game.MAX_ASTEROIDS; i++) {
            const x = Math.random() * this.gameWidth;
            const y = -32 - Math.random() * 100;
            this.objects.add(new Asteroid(x, y));
        }
    }

    render() {
        this.renderer.render(this.objects.getAll(), this.fps, this.isDebug, this.score);
    }
}
