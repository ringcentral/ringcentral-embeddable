// Globals in AudioWorkletGlobalScope: currentTime, sampleRate
// this.port for communication with the main thread

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
    this.noBeepSilenceDuration = 4; // no beep silence duration
    // @ts-ignore
    this.sampleRate = sampleRate;
    this.framesPerSecond = this.sampleRate / 128; // 128 is default buffer size
    console.log('sampleRate: ', this.sampleRate);
    console.log('framesPerSecond: ', this.framesPerSecond);
    this.beepFreq = 450;
    this.state = 'listening'; // listening → beep-detected → waiting-for-silence → silence-detected → greeting-ended
    this.inputBuffer = [];
    // TODO: add detection timeout 1 minute
  }

  rms(input) {
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * input[i];
    }
    return Math.sqrt(sum / input.length);
  }

  pushInputToBuffer(input) {
    // buffer max size 128 * 5 = 640
    if (this.inputBuffer.length >= 640) {
      // remove the first 128 samples
      this.inputBuffer.splice(0, 128);
    }
    input.forEach(sample => {
      this.inputBuffer.push(sample);
    });
  }

  detectBeep(input) {
    this.pushInputToBuffer(input);
    const inputSamples = this.inputBuffer;
    const N = inputSamples.length;
    if (N < 640) {
      return false;
    }

    const targetFreq = this.beepFreq;
    // @ts-ignore sampleRate is a global in AudioWorkletGlobalScope
    const SR = this.sampleRate;

    // Calculate Goertzel parameters
    // k is the specific frequency bin index for the target frequency
    const k = Math.floor(0.5 + (N * targetFreq) / SR);
    const omega = (2 * Math.PI * k) / N;
    const coeff = 2 * Math.cos(omega);

    let s0 = 0;
    let s1 = 0;
    let s2 = 0;

    // Process samples
    for (let i = 0; i < N; i++) {
      s0 = inputSamples[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }

    // Calculate power (magnitude squared) of the target frequency
    // This power is proportional to (Amplitude * N / 2)^2
    const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
    
    // For debugging or tuning the beepPowerThreshold:
    // You can uncomment this log to see the power values for detected sounds.
    if (power > this.beepPowerThreshold / 1.5) { // Log if power is somewhat significant
      console.log(`VoicemailGreetingEndDetector - Beep Detection Debug: Freq: ${targetFreq}Hz, Power: ${power.toFixed(2)}, Threshold: ${this.beepPowerThreshold}, N: ${N}, SR: ${SR}, k_bin: ${k}`);
    }

    return power > this.beepPowerThreshold;
  }

  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true; // keep processor alive

    const rmsVal = this.rms(input);
    const isSilence = rmsVal < this.threshold;

    switch (this.state) {
      case 'listening': {
        if (isSilence) {
          this.silenceCounter++;
          // If the silence duration is longer than the noBeepSilenceDuration, we consider the greeting to have ended
          if (this.silenceCounter > this.noBeepSilenceDuration * this.framesPerSecond) {
            console.log('Greeting ended after long silence');
            this.state = 'greeting-ended';
            this.silenceCounter = 0;
            this.port.postMessage('greeting-ended');
          }
          break;
        }
        this.silenceCounter = 0;
        if (this.detectBeep(input)) {
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
        if (this.beepSoundCounter > this.beepSilenceDuration * this.framesPerSecond) {
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
          if (this.silenceCounterAfterBeep > this.beepSilenceDuration * this.framesPerSecond) {
            this.state = 'greeting-ended';
            this.silenceCounterAfterBeep = 0;
            console.log('Greeting ended after beep silence');
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
