const noteElement = document.getElementById("note");
const freqElement = document.getElementById("freq");
const arrow = document.getElementById("arrow");
const status = document.getElementById("status");

const notes = ["C", "C#", "D", "D#", "E", "F",
               "F#", "G", "G#", "A", "A#", "B"];
const A4 = 440;

function startTuner() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 2048;
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    function update() {
      analyser.getFloatTimeDomainData(dataArray);
      const freq = autoCorrelate(dataArray, audioContext.sampleRate);
      if (freq !== -1) {
        freqElement.textContent = freq.toFixed(2) + " Hz";
        const note = frequencyToNote(freq);
        noteElement.textContent = note;

        // Indicador visual
        const diff = freq - noteToFrequency(note);
        if (diff > 1) {
          arrow.style.transform = "rotate(30deg)";
          status.textContent = "Aguarde: Alto";
        } else if (diff < -1) {
          arrow.style.transform = "rotate(-30deg)";
          status.textContent = "Aguarde: Baixo";
        } else {
          arrow.style.transform = "rotate(0deg)";
          status.textContent = "Afinado!";
        }
      }
      requestAnimationFrame(update);
    }
    update();
  });
}

// Função para detectar frequência
function autoCorrelate(buf, sampleRate) {
  let SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  const c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE - i; j++) c[i] += buf[j] * buf[j + i];

  let d = 0; while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  let T0 = maxpos;

  return sampleRate / T0;
}

// Converter frequência para nota
function frequencyToNote(freq) {
  const semitone = 69;
  const noteNumber = 12 * (Math.log(freq / A4) / Math.log(2)) + semitone;
  const rounded = Math.round(noteNumber);
  return notes[(rounded % 12 + 12) % 12];
}

// Função para pegar a frequência exata da nota
function noteToFrequency(note) {
  const noteIndex = notes.indexOf(note);
  return A4 * Math.pow(2, (noteIndex - 9) / 12);
}
