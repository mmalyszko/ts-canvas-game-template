export class SoundEffect {

    private static audioContext: AudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();

    private src: string;
    private buffer: AudioBuffer | null = null;

    private mute: boolean = false;
    private playing: boolean = false;

    private gainNode: GainNode;
    private currentSource: AudioBufferSourceNode | null = null;

    private previousVolume: number = 1;

    private readyPromise: Promise<void>;

    constructor(src: string) {
        this.src = src;
        this.gainNode = SoundEffect.audioContext.createGain();
        this.gainNode.connect(SoundEffect.audioContext.destination);
        this.readyPromise = this.initBuffer();
    }

    whenReady(): Promise<void> {
        return this.readyPromise;
    }

    static fixContext(): void {
        if (SoundEffect.audioContext.state !== 'running') {
            void SoundEffect.audioContext.resume();
        }
    }

    // Safari audio fix
    static unlockOnUserInput(): void {
        window.addEventListener('keydown', () => SoundEffect.fixContext());
        window.addEventListener('pointerup', () => SoundEffect.fixContext());
        window.addEventListener('touchend', () => SoundEffect.fixContext());
    }

    private static isContextRunning(): boolean {
        return SoundEffect.audioContext.state === 'running';
    }

    public setVolume(volume: number): this {

        if (!this.mute) {
            this.gainNode.gain.value = volume;
        }

        this.previousVolume = volume;
        return this;
    }

    public setEnabled(enabled: boolean): void {
        this.mute = !enabled;
        this.gainNode.gain.value = this.mute ? 0 : this.previousVolume;
    }

    private async initBuffer(): Promise<void> {
        try {
            const response = await fetch(this.src);
            const arrayBuffer = await response.arrayBuffer();
            this.buffer = await SoundEffect.audioContext.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error('Sound buffer init error:', e);
        }
    }

    public play(): void {

        if (this.mute || !this.buffer || !SoundEffect.isContextRunning()) {
            return;
        }

        try {
            const source = SoundEffect.audioContext.createBufferSource();
            source.buffer = this.buffer;
            source.connect(this.gainNode);
            source.start(0);

            this.currentSource = source;
            this.playing = true;

            source.onended = () => {
                this.playing = false;
                this.currentSource = null;
            };

        } catch (e) {
            console.error('Sound playing error:', e);
        }
    }

    public stop(): void {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource.disconnect();
            this.currentSource = null;
            this.playing = false;
        }
    }

    public isPlaying(): boolean {
        return this.playing;
    }
}

export class AudioManager {  // TODO - rename to SoundManager ?

    private sounds: Map<string, SoundEffect> = new Map();
    private enabled: boolean = true;

    constructor() {
        SoundEffect.unlockOnUserInput();
    }

    async loadSounds(soundSources: Map<string, string>) {
        const sounds = Array.from(soundSources).map(([id, src]) => {
            const sound = new SoundEffect(src);
            sound.setEnabled(this.enabled);
            this.sounds.set(id, sound);
            return sound;
        });
        await Promise.all(sounds.map(sound => sound.whenReady()));
    }

    get(id: string): SoundEffect | undefined {
        return this.sounds.get(id);
    }

    play(id: string): void {
        this.sounds.get(id)?.play();
    }

    setVolume(id: string, volume: number) {
        const sound = this.sounds.get(id);
        if (sound) sound.setVolume(volume);
    }

    enableAll(enabled: boolean) {
        this.enabled = enabled;
        for (const sound of this.sounds.values()) {
            sound.setEnabled(enabled);
        }
    }
}
