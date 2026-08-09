import {RenderHelper, TextureManager} from "../core/render.js";
import {GameObject} from "../core/objects.js";

export class Renderer {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private textures: TextureManager;

    constructor(canvas: HTMLCanvasElement, textures: TextureManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.ctx.imageSmoothingEnabled = false;
        this.textures = textures;
    }

    render(objects: GameObject[], fps: number, isDebug: boolean, score: number) {
        RenderHelper.clearScreen(this.ctx, this.canvas);

        for (const object of objects) {
            if (!object.isActive) continue;

            if (object.sprite) {
                RenderHelper.renderSprite(this.ctx, this.textures, object.sprite, object.centerX, object.centerY, object.rotation, object.scale);
            }

            object.render(this.ctx);

            if (isDebug) {
                RenderHelper.drawDebugBox(this.ctx, object.centerX, object.centerY, object.width * object.scale, object.height * object.scale);
            }
        }

        RenderHelper.drawText(this.ctx, `FPS: ${fps}`, this.canvas.width - 60, 20, '#4fb0bd', '14px sans-serif', 'left');
        RenderHelper.drawText(this.ctx, `SCORE: ${score}`, 10, 20, '#e2f37e', '14px sans-serif', 'left');
    }
}
