import {GameObject} from "../core/objects.js";
import {Sprite, Animation} from "../core/render.js";
import {GameObjectType, TextureId} from "./commons.js";

export class Spaceship extends GameObject {
    private static SPEED = 0.3;

    constructor(centerX: number, centerY: number) {
        super(GameObjectType.Spaceship, centerX, centerY);

        this.width = 32;
        this.height = 48;
        this.scale = 1.2;

        this.sprite = new Sprite(TextureId.Spaceship, 32, 48);
        this.sprite.setAnimation(new Animation(32, 48, 0, 0, 2, 100));
    }

    move(left: boolean, right: boolean, deltaTime: number, min: number, max: number) {
        const halfWidth = (this.width * this.scale) / 2;

        if (left && (this.centerX - halfWidth > min)) {
            this.centerX -= deltaTime * Spaceship.SPEED;
        }

        if (right && (this.centerX + halfWidth < max)) {
            this.centerX += deltaTime * Spaceship.SPEED;
        }
    }
}

export class Missile extends GameObject {
    private static SPEED = 0.3;

    constructor(centerX: number, centerY: number) {
        super(GameObjectType.Missile, centerX, centerY);

        this.width = 3;
        this.height = 9;
        this.scale = 2;

        this.sprite = new Sprite(TextureId.Missile, 3, 9);
        this.sprite.setAnimation(new Animation(3, 9, 0, 0, 3, 100));
    }

    update(deltaTime: number) {
        this.centerY -= deltaTime * Missile.SPEED;
    }
}

export class Asteroid extends GameObject {
    private rotationDirection: number = 1;
    private velocityX: number;
    private velocityY: number;

    constructor(centerX: number, centerY: number) {
        super(GameObjectType.Asteroid, centerX, centerY);

        this.width = 32;
        this.height = 32;

        this.sprite = new Sprite(TextureId.Asteroid, 32, 32);

        this.velocityX = (Math.random() - 0.5) * 0.1; // left||right
        this.velocityY = 0.05 + Math.random() * 0.1; // down
        this.scale = 0.8 + Math.random() * 0.8; // 0.8-1.6
    }

    update(deltaTime: number) {
        this.rotation += deltaTime * 0.001 * this.rotationDirection; // 0.001 => converts deltaTime to seconds
        this.centerX += deltaTime * this.velocityX;
        this.centerY += deltaTime * this.velocityY;
    }

    bounceOff(other: Asteroid) {
        const dx = other.centerX - this.centerX;
        const dy = other.centerY - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1; // OR => avoids division by zero

        const normalX = dx / distance;
        const normalY = dy / distance;

        const thisRadius = (this.width * this.scale) / 2;
        const otherRadius = (other.width * other.scale) / 2;

        const overlap = thisRadius + otherRadius - distance;
        if (overlap <= 0) {
            return;
        }

        // A pair of objects must be separated first;
        // otherwise, hasCollided() re-triggers the collision in the next frame.
        this.centerX -= normalX * overlap / 2;
        this.centerY -= normalY * overlap / 2;
        other.centerX += normalX * overlap / 2;
        other.centerY += normalY * overlap / 2;

        // simple physics: elastic collision between two equal-mass bodies
        // 1. speed of each object along the collision normal
        const thisNormalSpeed = this.velocityX * normalX + this.velocityY * normalY;
        const otherNormalSpeed = other.velocityX * normalX + other.velocityY * normalY;
        // 2. difference between them - the amount to swap
        const delta = otherNormalSpeed - thisNormalSpeed;
        // 3. swap that amount between the two objects
        this.velocityX += delta * normalX;
        this.velocityY += delta * normalY;
        other.velocityX -= delta * normalX;
        other.velocityY -= delta * normalY;
        // 4. bounced :)
    }
}

export class StarsBackground extends GameObject {
    private static SPEED = 0.02;

    constructor(centerX: number, centerY: number) {
        super(GameObjectType.Starfield, centerX, centerY);

        this.width = 800;
        this.height = 600;

        this.sprite = new Sprite(TextureId.Starfield, 800, 600);
    }

    update(deltaTime: number) {
        this.centerY += deltaTime * StarsBackground.SPEED;

        if (this.centerY >= this.height / 2 + this.height) {
            this.centerY -= 2 * this.height;
        }
    }
}

export class Explosion extends GameObject {

    constructor(centerX: number, centerY: number) {
        super(GameObjectType.Explosion, centerX, centerY);

        this.width = 32;
        this.height = 32;
        this.scale = 1.3;

        this.sprite = new Sprite(TextureId.Explosion, 32, 32);
        this.sprite.setAnimation(new Animation(32, 32, 0, 0, 6, 80, false));
    }

    update(deltaTime: number) {
        if (this.sprite?.isFinished()) {
            this.isActive = false;
        }
    }
}
