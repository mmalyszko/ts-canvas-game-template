export class TextureManager {
    private textures: Map<string, HTMLImageElement> = new Map();

    async loadTextures(textureSources: Map<string, string>): Promise<void> {
        await Promise.all(
            Array.from(textureSources).map(async ([id, src]) => {
                const image = new Image();
                image.src = src;
                await image.decode();
                this.textures.set(id, image);
            })
        );
    }

    get(id: string): HTMLImageElement | undefined {
        return this.textures.get(id);
    }
}

export class Animation {
    private currentFrame: number = 0;
    private timer: number = 0;

    constructor(
        private frameWidth: number,
        private frameHeight: number,
        private startRow: number,
        private startCol: number,
        private length: number,
        private delay: number = 100,
        private loop: boolean = true,
        private vertical: boolean = false
    ) {
    }

    update(deltaTime: number): void {
        this.timer += deltaTime;
        if (this.timer >= this.delay) {
            if (this.loop) {
                this.currentFrame = (this.currentFrame + 1) % this.length;
            } else if (this.currentFrame < this.length - 1) {
                this.currentFrame++;
            }
            this.timer = 0;
        }
    }

    isFinished(): boolean {
        return !this.loop && this.currentFrame === this.length - 1;
    }

    getFrameOffset(): { x: number, y: number } {
        if (this.vertical) {
            const row = this.startRow + this.currentFrame;
            return {
                x: this.startCol * this.frameWidth,
                y: row * this.frameHeight,
            };
        }

        const col = this.startCol + this.currentFrame;
        return {
            x: col * this.frameWidth,
            y: this.startRow * this.frameHeight,
        };
    }
}

export class Sprite {
    private animation: Animation | null = null;

    constructor(
        public textureId: string,
        public frameWidth: number,
        public frameHeight: number
    ) {
    }

    setAnimation(animation: Animation | null) {
        this.animation = animation;
    }

    update(deltaTime: number) {
        this.animation?.update(deltaTime);
    }

    isFinished(): boolean {
        return this.animation?.isFinished() ?? false;
    }

    getFrameOffset(): { x: number, y: number } {
        return this.animation?.getFrameOffset() ?? {x: 0, y: 0};
    }
}

export class RenderHelper {
    static clearScreen(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, color: string = 'black') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    static drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string = 'white', font: string = '16px sans-serif', align: CanvasTextAlign = 'left') {
        ctx.save();
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    static drawDebugBox(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string = 'lightgreen') {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.strokeRect(x - width / 2, y - height / 2, width, height);
        ctx.restore();
    }

    static renderSprite(
        ctx: CanvasRenderingContext2D,
        textures: TextureManager,
        sprite: Sprite,
        x: number,
        y: number,
        rotation: number = 0,
        scale: number = 1
    ) {
        const image = textures.get(sprite.textureId);
        if (!image) return;

        const offset = sprite.getFrameOffset();
        const w = sprite.frameWidth;
        const h = sprite.frameHeight;
        const destW = w * scale;
        const destH = h * scale;

        ctx.save();
        ctx.translate(x, y); // x,y - is center (rotation point), NOT top-left corner
        ctx.rotate(rotation);
        ctx.drawImage(image, offset.x, offset.y, w, h, -destW / 2, -destH / 2, destW, destH);
        ctx.restore();
    }
}
