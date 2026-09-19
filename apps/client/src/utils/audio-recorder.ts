export interface AudioRecordingResult {
  blob: Blob;
  durationMs: number;
  url: string;
}

export class SimpleAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime = 0;

  async start(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch {
      return false;
    }
  }

  async stop(): Promise<AudioRecordingResult | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        // Use what the browser actually recorded (Safari produces mp4), without codec parameters.
        const mime = (this.mediaRecorder?.mimeType || 'audio/webm').split(';')[0];
        const audioBlob = new Blob(this.audioChunks, { type: mime });
        const audioUrl = URL.createObjectURL(audioBlob);
        const durationMs = Date.now() - this.startTime;
        resolve({
          blob: audioBlob,
          durationMs,
          url: audioUrl,
        });
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    });
  }
}
