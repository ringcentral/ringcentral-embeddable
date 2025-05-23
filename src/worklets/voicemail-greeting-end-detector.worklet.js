// Globals in AudioWorkletGlobalScope: currentTime, sampleRate
// this.port for communication with the main thread

const INPUT_BUFFER_SIZE = 128;
// @ts-ignore
class VoicemailGreetingEndDetector extends AudioWorkletProcessor {
  constructor() {
    super();
    this.threshold = 0.01; // RMS threshold
    this.beepPowerThreshold = 100; // Power threshold for Goertzel beep detection (initial value, needs tuning)
    this.silenceCounter = 0; // silence counter if no beep detected
    this.silenceCounterAfterBeep = 0; // silence counter after beep detected
    this.beepSoundCounter = 0; // beep sound counter
    this.beepSilenceDuration = 2; // beep silence duration
    this.beepSoundDuration = 5; // beep sound duration
    this.noBeepSilenceDuration = 4; // no beep silence duration
    // @ts-ignore
    this.sampleRate = sampleRate; // 48000
    this.framesPerSecond = this.sampleRate / INPUT_BUFFER_SIZE; // 128 is default buffer size, 375 frames per second
    this.fftSize = 512;
    this.noBeepSilenceCounterThreshold = this.noBeepSilenceDuration * this.framesPerSecond / (this.fftSize / INPUT_BUFFER_SIZE);
    this.beepSilenceCounterThreshold = this.beepSilenceDuration * this.framesPerSecond / (this.fftSize / INPUT_BUFFER_SIZE);
    this.beepSoundCounterThreshold = this.beepSoundDuration * this.framesPerSecond / (this.fftSize / INPUT_BUFFER_SIZE);
    this.state = 'listening'; // listening → beep-detected → waiting-for-silence → silence-detected → greeting-ended
    this.inputBuffer = new Float32Array(this.fftSize);
    this.inputBufferIndex = 0;
    // TODO: add detection timeout 1 minute
  }

  rms(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  pushInputToBuffer(input) {
    // buffer size 128 * 4 = 512
    for (let i = 0; i < input.length; i++) {
      this.inputBuffer[this.inputBufferIndex++] = input[i];
    }
    let bufferReady = this.inputBufferIndex >= this.fftSize;
    if (bufferReady) {
      this.inputBufferIndex = 0;
    }
    return bufferReady;
  }

  _fftMag(buffer) {
    // Real-valued FFT using naive DFT (for small fftSize)
    const N = buffer.length;
    const mags = new Float32Array(N / 2);
    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        real += buffer[n] * Math.cos(angle);
        imag -= buffer[n] * Math.sin(angle);
      }
      mags[k] = Math.sqrt(real * real + imag * imag);
    }
    return mags;
  }

  detectBeep(buffer) {
    const spectrum = this._fftMag(buffer);
    const binSize = this.sampleRate / this.fftSize;
    const low = Math.floor(1000 / binSize);
    const high = Math.floor(3000 / binSize);

    let bandEnergy = 0;
    let totalEnergy = 0;

    for (let i = 0; i < spectrum.length; i++) {
      totalEnergy += spectrum[i];
      if (i >= low && i <= high) {
        bandEnergy += spectrum[i];
      }
    }

    const ratio = bandEnergy / (totalEnergy + 1e-6);
    console.log('ratio: ', ratio, 'bandEnergy: ', bandEnergy, 'totalEnergy: ', totalEnergy);
    return ratio > 0.2 && bandEnergy > 50;
  }

  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true; // keep processor alive

    let bufferReady = this.pushInputToBuffer(input);
    if (!bufferReady) {
      return true; // need more samples, keep processor alive
    }

    const rmsVal = this.rms(this.inputBuffer);
    const isSilence = rmsVal < this.threshold;

    switch (this.state) {
      case 'listening': {
        if (isSilence) {
          this.silenceCounter++;
          // If the silence duration is longer than the noBeepSilenceDuration, we consider the greeting to have ended
          if (this.silenceCounter > this.noBeepSilenceCounterThreshold) {
            console.log('Greeting ended after long silence');
            this.state = 'greeting-ended';
            this.silenceCounter = 0;
            // @ts-ignore
            this.port.postMessage('greeting-ended');
          }
          break;
        }
        this.silenceCounter = 0;
        if (this.detectBeep(this.inputBuffer)) {
          console.log('Beep detected, waiting for silence');
          this.state = 'waiting-for-silence';
        }
        break;
      }
      case 'waiting-for-silence': {
        if (isSilence) {
          console.log('Silence detected after beep');
          this.state = 'silence-detected';
          this.beepSoundCounter = 0;
          break;
        }
        this.beepSoundCounter++;
        // if beep sound too long, we consider wrong detection
        if (this.beepSoundCounter > this.beepSoundCounterThreshold) {
          console.log('Wrong beep detection, back to listening');
          this.beepSoundCounter = 0;
          this.state = 'listening';
          break;
        }
        break;
      }
      case 'silence-detected': {
        if (isSilence) {
          this.silenceCounterAfterBeep++;
          if (this.silenceCounterAfterBeep > this.beepSilenceCounterThreshold) {
            this.state = 'greeting-ended';
            this.silenceCounterAfterBeep = 0;
            console.log('Greeting ended after beep silence');
            // @ts-ignore
            this.port.postMessage('greeting-ended');
          }
        } else {
          this.state = 'listening';
          this.silenceCounterAfterBeep = 0;
          console.log('Get sound after silence, back to listening');
        }
        break;
      }
    }
    return true; // keep processor alive
  }
}

try {
  // @ts-ignore
  registerProcessor('voicemail-greeting-end-detector', VoicemailGreetingEndDetector);
} catch (e) {
  console.error('Failed to register VoicemailGreetingEndDetector processor:', e);
}
