import {Sprite} from "./render.js";

export abstract class GameObject {
    private static nextUid: number = 1;

    readonly uid: number;
    readonly objectType: string;

    isActive: boolean = true;

    centerX: number;
    centerY: number;

    rotation: number = 0;
    scale:    number = 1;

    width:    number = 0;
    height:   number = 0;

    sprite: Sprite | null = null;

    protected constructor(objectType: string, centerX: number, centerY: number) {
        this.uid = GameObject.nextUid++;
        this.objectType = objectType;
        this.centerX = centerX;
        this.centerY = centerY;
    }

    update(deltaTime: number): void {
    }

    render(ctx: CanvasRenderingContext2D): void {
    }
}

export class GameObjectManager {
    private objects: GameObject[] = [];

    add(object: GameObject) {
        this.objects.push(object);
    }

    getAll(): GameObject[] {
        return this.objects;
    }

    updateAll(deltaTime: number) {
        for (const object of this.objects) {
            if (object.isActive) {
                object.sprite?.update(deltaTime);
                object.update(deltaTime);
            }
        }
    }

    deleteInactiveObjects() {
        this.objects = this.objects.filter(object => object.isActive);
    }
}

export class CollisionManager {
    private collisionCallbacks: Map<string, (objectA: GameObject, objectB: GameObject) => void> = new Map();
    private collisionTolerances: Map<string, number> = new Map();
    private collidedPairs: Set<string> = new Set();

    // checks unique object instances, each pair once per frame
    checkCollisions(objects: GameObject[]): void {
        this.collidedPairs.clear();
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const objectA = objects[i];
                const objectB = objects[j];

                const typePairKey = this.getTypePairKey(objectA.objectType, objectB.objectType);
                const callback = this.collisionCallbacks.get(typePairKey);
                if (!callback) {
                    continue;
                }

                const tolerance = this.collisionTolerances.get(typePairKey) ?? 0;
                const instancePairKey = this.getInstancePairKey(objectA.uid, objectB.uid);

                if (this.hasCollided(objectA, objectB, tolerance) && !this.collidedPairs.has(instancePairKey)) {
                    this.collidedPairs.add(instancePairKey);
                    this.handleCollision(objectA, objectB, callback);
                }
            }
        }
    }

    addCollisionCallback(typeA: string, typeB: string, callback: (objectA: GameObject, objectB: GameObject) => void, tolerance: number = 0): void {
        const key = this.getTypePairKey(typeA, typeB);
        this.collisionCallbacks.set(key, callback);
        this.collisionTolerances.set(key, tolerance);
    }

    private hasCollided(objectA: GameObject, objectB: GameObject, tolerance: number): boolean {
        if (!objectA.isActive || !objectB.isActive) {
            return false;
        }

        const halfWidthA = (objectA.width * objectA.scale) / 2;
        const halfHeightA = (objectA.height * objectA.scale) / 2;
        const halfWidthB = (objectB.width * objectB.scale) / 2;
        const halfHeightB = (objectB.height * objectB.scale) / 2;

        return (
            objectA.centerX - halfWidthA + tolerance < objectB.centerX + halfWidthB &&
            objectA.centerX + halfWidthA - tolerance > objectB.centerX - halfWidthB &&
            objectA.centerY - halfHeightA + tolerance < objectB.centerY + halfHeightB &&
            objectA.centerY + halfHeightA - tolerance > objectB.centerY - halfHeightB
        );
    }

    private getInstancePairKey(uidA: number, uidB: number): string {
        return uidA < uidB ? `${uidA}:${uidB}` : `${uidB}:${uidA}`;
    }

    private getTypePairKey(typeA: string, typeB: string): string {
        return typeA < typeB ? `${typeA}:${typeB}` : `${typeB}:${typeA}`;
    }

    private handleCollision(objectA: GameObject, objectB: GameObject, callback: (objectA: GameObject, objectB: GameObject) => void): void {
        callback(objectA, objectB); // WARNING: callback must recognize on its own which object is which
    }
}
