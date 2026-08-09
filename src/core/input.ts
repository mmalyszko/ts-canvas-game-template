export class InputManager {

    private canvas: HTMLCanvasElement; // required for mouse/touch events

    private keysDown:        Set<string> = new Set();
    private keysPressed:     Set<string> = new Set();

    private pointerPressed:  boolean = false;
    private pointerReleased: boolean = false;

    pointerX:      number = 0;
    pointerY:      number = 0;
    isPointerDown: boolean = false;

    constructor(canvas: HTMLCanvasElement, useKeyboard: boolean = true, useMouse: boolean = true) {
        this.canvas = canvas;

        if (useKeyboard) {
            this.onKeyboardEvents();
        }

        if (useMouse) {
            this.canvas.style.touchAction = 'none';
            this.onPointerEvents();
        }
    }

    isKeyDown(key: string): boolean {
        return this.keysDown.has(key);
    }

    isKeyPressed(key: string): boolean {
        return this.keysPressed.has(key);
    }

    isPointerPressed(): boolean {
        return this.pointerPressed;
    }

    isPointerReleased(): boolean {
        return this.pointerReleased;
    }

    wasAnyInputPressed(): boolean {
        return this.keysPressed.size > 0 || this.pointerPressed;
    }

    clearPressedInputs() {
        this.keysPressed.clear();
        this.pointerPressed = false;
        this.pointerReleased = false;
    }

    private onKeyboardEvents() {
        const SCROLL_KEYS = new Set([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);

        window.addEventListener('keydown', (event) => {
            if (SCROLL_KEYS.has(event.key)) {
                event.preventDefault();
            }
            if (!this.keysDown.has(event.key)) {
                this.keysPressed.add(event.key);
            }
            this.keysDown.add(event.key);
        });

        window.addEventListener('keyup', (event) => {
            this.keysDown.delete(event.key);
        });
    }

    private onPointerEvents() {
        this.canvas.addEventListener('pointerdown', (event) => {
            this.isPointerDown = true;
            this.pointerPressed = true;
            this.updatePointerPosition(event);
        });

        window.addEventListener('pointermove', (event) => {
            this.updatePointerPosition(event);
        });

        window.addEventListener('pointerup', () => {
            this.isPointerDown = false;
            this.pointerReleased = true;
        });

        window.addEventListener('pointercancel', () => {
            this.isPointerDown = false;
            this.pointerReleased = true;
        });
    }

    private updatePointerPosition(event: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointerX = event.clientX - rect.left;
        this.pointerY = event.clientY - rect.top;
    }
}
