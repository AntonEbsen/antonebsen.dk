export class AudioVisualizer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private audioContext: AudioContext;
    private analyser: AnalyserNode;
    private dataArray: Uint8Array;
    private source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
    private animationId: number | null = null;
    private isActive: boolean = false;
    private color: string;

    constructor(canvas: HTMLCanvasElement, color: string = 'rgb(255, 215, 0)') { // Default to Gold
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.color = color;

        // Initialize Audio Context (must be done after user interaction ideally, but defined here)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256; // Trade-off between resolution and performance
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);

        // Handle resize
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    private resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    public connectStream(stream: MediaStream) {
        this.disconnect();
        this.resumeContext();
        this.source = this.audioContext.createMediaStreamSource(stream);
        this.source.connect(this.analyser);
        this.start();
    }

    public connectElement(audioElement: HTMLAudioElement) {
        this.disconnect();
        this.resumeContext();

        // Create source only once per element if possible, but for simplicity here:
        // Use a weak map or similar in production if re-connecting often. 
        // For now, allow try/catch as creating source twice on same element throws error.
        try {
            // Note: This requires CORS if audio is external. Our proxy handles it.
            this.source = this.audioContext.createMediaElementSource(audioElement);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination); // Re-connect to speaker
        } catch (e) {
            console.warn("Audio Element already connected or error:", e);
        }

        this.start();
    }

    public disconnect() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        this.stop();
    }

    private simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    private resumeContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    public start() {
        if (this.isActive) return;
        this.isActive = true;
        this.draw();
    }

    public stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    public setColor(color: string) {
        this.color = color;
    }

    private draw() {
        if (!this.isActive) return;

        this.animationId = requestAnimationFrame(() => this.draw());

        this.analyser.getByteFrequencyData(this.dataArray);

        const width = this.canvas.width;
        const height = this.canvas.height;
        const barWidth = (width / this.dataArray.length) * 2.5;
        let x = 0;

        this.ctx.clearRect(0, 0, width, height);

        // Draw "Siri-like" Waveform or Bars
        // Let's do a mirrored bar graph for a techy look

        const centerY = height / 2;

        for (let i = 0; i < this.dataArray.length; i++) {
            const v = this.dataArray[i] / 255.0; // 0.0 to 1.0
            const barHeight = v * height * 0.8; // Scale factor

            this.ctx.fillStyle = this.color;

            // Draw centered bars
            // Opacity based on height for "glow" effect
            this.ctx.globalAlpha = 0.5 + (v * 0.5);

            this.ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);

            x += barWidth + 1;
        }

        this.ctx.globalAlpha = 1.0;
    }
}
