// Globals in AudioWorkletGlobalScope: currentTime, sampleRate
// this.port for communication with the main thread

// @ts-ignore
class VoicemailGreetingEndDetector extends AudioWorkletProcessor {
  constructor() {
    super();
    this.threshold = 0.01; // RMS threshold
    this.silenceCounter = 0; // silence counter if no beep detected
    this.silenceCounterAfterBeep = 0; // silence counter after beep detected
    this.beepSoundCounter = 0; // beep sound counter
    this.beepSilenceDuration = 2; // beep silence duration
    this.noBeepSilenceDuration = 4; // no beep silence duration
    // @ts-ignore
    this.sampleRate = sampleRate;
    this.framesPerSecond = this.sampleRate / 128; // 128 is default buffer size

    this.beepFreq = 450;
    this.silenceStarted = null;
    this.state = 'listening'; // listening → beep-detected → waiting-for-silence → silence-detected → greeting-ended
  }

  rms(input) {
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * input[i];
    }
    return Math.sqrt(sum / input.length);
  }

  detectBeep(input) {
    // Simple 450Hz tone detector (very rough)
    // const fftSize = 128;
    const mag = input.reduce((acc, val) => acc + Math.sin(2 * Math.PI * this.beepFreq * val), 0);
    console.log('mag', mag);
    return Math.abs(mag) > 20;
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
            if (this.silenceStarted === null || this.silenceStarted === false) {
              console.log('silence-started');
              this.silenceStarted = true;
              this.state = 'greeting-ended';
              this.silenceCounter = 0;
              this.port.postMessage('greeting-ended');
            }
          }
          break;
        }
        this.silenceCounter = 0;
        if (this.detectBeep(input)) {
          console.log('beep-detected');
          this.state = 'waiting-for-silence';
        }
        break;
      }
      case 'waiting-for-silence': {
        if (isSilence) {
          this.state = 'silence-detected';
          this.beepSoundCounter = 0;
          break;
        } else {
          this.beepSoundCounter++;
        }
        // if beep sound too long, we consider wrong detection
        if (this.beepSoundCounter > this.beepSilenceDuration * this.framesPerSecond) {
          console.log('wrong beep detection');
          this.beepSoundCounter = 0;
          this.state = 'listening';
          break;
        }
      }
      case 'silence-detected': {
        if (isSilence) {
          this.silenceCounterAfterBeep++;
        } else {
          this.state = 'listening';
          this.silenceCounterAfterBeep = 0;
          break;
        }
        if (this.silenceCounterAfterBeep > this.beepSilenceDuration * this.framesPerSecond) {
          this.state = 'greeting-ended';
          this.silenceCounterAfterBeep = 0;
          this.port.postMessage('greeting-ended');
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
