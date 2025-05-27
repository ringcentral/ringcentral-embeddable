// Globals in AudioWorkletGlobalScope: currentTime, sampleRate
// this.port for communication with the main thread

const INPUT_BUFFER_SIZE = 128;
// @ts-ignore
class VoicemailGreetingEndDetector extends AudioWorkletProcessor {
  constructor() {
    super();
    this.threshold = 0.01; // RMS threshold
    this.beepPowerThreshold = 20000; // Power threshold for Goertzel beep detection (initial value, needs tuning)
    this.beepFrequencies = [625, 850, 1000, 1250, 1400, 1500, 1700]; // Hz, common beep tone frequencies, tune as needed
    this.silenceCounter = 0; // silence counter if no beep detected
    this.silenceCounterAfterBeep = 0; // silence counter after beep detected
    this.beepSoundCounter = 0; // beep sound counter
    this.beepSilenceDuration = 2; // beep silence duration
    this.beepSoundDuration = 5; // beep sound duration
    this.noBeepSilenceDuration = 4; // no beep silence duration
    // @ts-ignore
    this.sampleRate = sampleRate; // 48000
    this.framesPerSecond = this.sampleRate / INPUT_BUFFER_SIZE; // 128 is default buffer size, 375 frames per second, 27 frames is 0.072 seconds
    this.bufferSize = 3456; // 27 * 128 , 27 frames is 0.072 seconds
    this.inputBuffer = new Float32Array(this.bufferSize);
    this.noBeepSilenceCounterThreshold = this.noBeepSilenceDuration * this.framesPerSecond / (this.bufferSize / INPUT_BUFFER_SIZE);
    this.beepSilenceCounterThreshold = this.beepSilenceDuration * this.framesPerSecond / (this.bufferSize / INPUT_BUFFER_SIZE);
    this.beepSoundCounterThreshold = this.beepSoundDuration * this.framesPerSecond / (this.bufferSize / INPUT_BUFFER_SIZE);
    this.state = 'listening'; // listening → beep-detected → waiting-for-silence → silence-detected → greeting-ended
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
    let bufferReady = this.inputBufferIndex >= this.bufferSize;
    if (bufferReady) {
      this.inputBufferIndex = 0;
    }
    return bufferReady;
  }

  _goertzelPower(buffer, targetFrequency) {
    const N = buffer.length;
    // k is the normalized frequency; k = targetFrequency * N / this.sampleRate
    const k = Math.round((N * targetFrequency) / this.sampleRate);
    const omega = (2 * Math.PI * k) / N;
    const cosine = Math.cos(omega);
    const coeff = 2 * cosine;

    let s_prev = 0;
    let s_prev2 = 0;
    for (let i = 0; i < N; i++) {
      const s = buffer[i] + coeff * s_prev - s_prev2;
      s_prev2 = s_prev;
      s_prev = s;
    }
    // This power is proportional to the magnitude squared at the target frequency.
    const power = s_prev2 * s_prev2 + s_prev * s_prev - coeff * s_prev * s_prev2;
    return power;
  }

  detectBeep(buffer) {
    let maxPower = -1;
    let detectedFrequency = -1;
    let beepDetected = false;
    for (const freq of this.beepFrequencies) {
      const power = this._goertzelPower(buffer, freq);
      if (power > maxPower) {
        maxPower = power;
        detectedFrequency = freq;
      }
      if (power > this.beepPowerThreshold) {
        beepDetected = true;
      }
    }
    if (beepDetected) {
      console.log(`VoicemailGreetingEndDetector: Beep detected: ${beepDetected}. Max power ${maxPower.toFixed(2)} at ${detectedFrequency}Hz (Threshold: ${this.beepPowerThreshold})`);
    } else if (maxPower > 1000) {
      console.log(`VoicemailGreetingEndDetector: No beep detected, but max power ${maxPower.toFixed(2)} at ${detectedFrequency}Hz (Threshold: ${this.beepPowerThreshold})`);
    }
    return beepDetected;
  }

  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true; // keep processor alive

    let bufferReady = this.pushInputToBuffer(input);
    if (!bufferReady) {
      return true; // need more samples, keep processor alive
    }
    const inputBuffer = this.inputBuffer.slice(); // return a copy of the buffer to avoid mutating the original buffer

    const rmsVal = this.rms(inputBuffer);
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
        if (this.detectBeep(inputBuffer)) {
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
