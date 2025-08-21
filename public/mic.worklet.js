let src = null;

class MicProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const p = (options && options.processorOptions) || {};
    this.frameSize = p.frameSize || 1024;
    this.hopSize   = p.hopSize   || 160;
    this.targetSR  = p.targetRate || 16000;

    this.ring = [];      // 16k 샘플 슬라이딩 윈도우
    this.buf16k = [];    // 16k 누적 버퍼

    // Worklet 내부 SR (입력 SR) 은 글로벌 sampleRate
    const inSR = sampleRate;

    // libsamplerate-js 초기화 (Full API: 스트리밍에 적합)
    // ConverterType: 품질/속도 균형으로 MEDIUM
    const { create, ConverterType } = globalThis.LibSampleRate;
    create(1, inSR, this.targetSR, {
      converterType: ConverterType.SRC_SINC_MEDIUM_QUALITY,
    }).then((instance) => { src = instance; });
  }

  process(inputs) {
    const ch0 = inputs[0] && inputs[0][0];
    if (!ch0 || !src) return true;

    // 1) 입력 블록을 WASM 리샘플러(full)로 통과
    // full()은 스트리밍 청크에 적합
    const resampled = src.full(ch0); // Float32Array @16k
    if (resampled && resampled.length) {
      this.buf16k.push(...resampled);
    }

    // 2) hopSize마다 프레임 한 개씩 만들기
    while (this.buf16k.length >= this.hopSize) {
      const hop = this.buf16k.splice(0, this.hopSize);
      this.ring.push(...hop);
      if (this.ring.length > this.frameSize) {
        this.ring.splice(0, this.ring.length - this.frameSize);
      }
      if (this.ring.length === this.frameSize) {
        const frame = new Float32Array(this.ring);
        this.port.postMessage({ type: 'frame', frame }, [frame.buffer]);
      }
    }

    return true;
  }
}

registerProcessor('mic-processor', MicProcessor);