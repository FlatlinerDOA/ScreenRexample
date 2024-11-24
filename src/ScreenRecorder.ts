import { fixWebmDuration } from "@fix-webm-duration/fix";
interface RecorderConfig {
    mimeType: string;
    videoBitsPerSecond?: number;
    audioBitsPerSecond?: number;
    includeAudio?: boolean;
    timeslice?: number;
  }
  
  class ScreenRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private startTime: number = 0;
    private recordedChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private stateChangeCallbacks: Set<() => void> = new Set();
    private stopping = false;
    private recordingPromise: Promise<ArrayBuffer> | null = null;
    private recordingResolve: ((buffer: ArrayBuffer) => void) | null = null;
    private recordingReject: ((error: Error) => void) | null = null;
    private fixDuration = true;

    constructor(private config: RecorderConfig = {
      mimeType: 'video/webm',
      videoBitsPerSecond: 2500000,
      audioBitsPerSecond: 128000,
      includeAudio: true,
      timeslice: 1000
    }) {}
  
    private async getSupportedMimeType(): Promise<string> {
      const types = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm',
      ];
  
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      }
      throw new Error('No supported mime type found');
    }
  
    onStateChange(callback: () => void): () => void {
      this.stateChangeCallbacks.add(callback);
      return () => {
        this.stateChangeCallbacks.delete(callback);
      };
    }
  
    private notifyStateChange(): void {
      for (const callback of this.stateChangeCallbacks) {
        callback();
      }
    }
  
    async start(): Promise<ArrayBuffer> {
      if (this.isRecording()) {
        throw new Error('Already recording');
      }
  
      this.stopping = false;
      this.recordedChunks = [];
  
      try {
        const displayMediaOptions: DisplayMediaStreamOptions = {
          video: <any>{
            cursor: "always",
          },
          audio: this.config.includeAudio ? {
            echoCancellation: true,
            noiseSuppression: true,
          } : false
        };
  
        this.stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        const mimeType = await this.getSupportedMimeType();
        
        this.mediaRecorder = new MediaRecorder(this.stream, {
          mimeType,
          videoBitsPerSecond: this.config.videoBitsPerSecond,
          audioBitsPerSecond: this.config.audioBitsPerSecond
        });
  
        // Create a promise that will resolve with the final recording
        this.recordingPromise = new Promise((resolve, reject) => {
          this.recordingResolve = resolve;
          this.recordingReject = reject;
        });
  
        // Set up all MediaRecorder event handlers
        this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };
  
        this.mediaRecorder.onstart = () => {
          this.notifyStateChange();
        };
  
        this.mediaRecorder.onerror = (event: Event) => {
          console.error('MediaRecorder error:', event);
          this.stop().catch(console.error);
        };
  
        // Handle stream track ended
        this.stream.getTracks().forEach(track => {
          track.addEventListener('ended', () => {
            if (this.isRecording()) {
              this.stop().catch(console.error);
            }
          });
        });
  
        // Start recording with timeslice
        this.mediaRecorder.start(this.config.timeslice);
        this.startTime = Date.now();
        this.notifyStateChange();
  
        return this.recordingPromise;
  
      } catch (error) {
        this.cleanup();
        throw error;
      }
    }
  
    private cleanup(): void {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      this.mediaRecorder = null;
      this.stopping = false;
      this.recordingPromise = null;
      this.recordingResolve = null;
      this.recordingReject = null;
      this.notifyStateChange();
    }
  
    async stop(): Promise<void> {
      if (!this.isRecording() || this.stopping) {
        throw new Error('Not recording or already stopping');
      }
  
      this.stopping = true;
  
      if (!this.mediaRecorder || !this.recordingResolve) {
        this.cleanup();
        throw new Error('Invalid recorder state');
      }
  
      const handleStop = async () => {
        try {
          
          // Request any final data
          if (this.mediaRecorder?.state === 'recording') {
            this.mediaRecorder.requestData();
          }
          const duration = Date.now() - this.startTime;
  
          // Wait briefly for final chunks
          await new Promise(resolve => setTimeout(resolve, 100));
          const blob = new Blob(this.recordedChunks, { 
            type: this.mediaRecorder?.mimeType || 'video/webm'
          });
          
          const buffer = this.fixDuration ? await (await fixWebmDuration(blob, duration)).arrayBuffer() : await blob.arrayBuffer();
          this.recordingResolve!(buffer);
          this.cleanup();
        } catch (error) {
          if (this.recordingReject) {
            this.recordingReject(error as Error);
          }
          this.cleanup();
        }
      };
  
      // Listen for both standard stop and ended events
      this.mediaRecorder.addEventListener('stop', handleStop, { once: true });
      this.mediaRecorder.addEventListener('ended', handleStop, { once: true });
      
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      } else {
        handleStop();
      }
    }
  
    isRecording(): boolean {
      return Boolean(
        this.mediaRecorder && 
        this.mediaRecorder.state === 'recording' && 
        this.stream &&
        this.stream.active &&
        !this.stopping
      );
    }
  
    createPreviewFromBuffer(arrayBuffer: ArrayBuffer): string {
      const blob = new Blob([arrayBuffer], { 
        type: this.mediaRecorder?.mimeType || 'video/webm'
      });
      return URL.createObjectURL(blob);
    }
  
    releasePreviewUrl(url: string): void {
      URL.revokeObjectURL(url);
    }
  }
  
  export default ScreenRecorder;