const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
require("dotenv").config({ path: ".env" });
const { exec } = require("child_process");

const BAR_DELAY = 10000;
const PATH_TO_MOVES = path.resolve("./src/data/moves/moves.json");
const PATH_TO_MOVES_OUTPUT = path.resolve("./src/data/audio");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createSpeechFile(input) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  // const outputPath = path.resolve(`${PATH_TO_MOVES_OUTPUT}/move-${index}.mp3`);
  // await fs.promises.writeFile(outputPath, buffer);

  return buffer;
}

const checkIfAnyBuffersExist = async () => {
  const files = await fs.promises.readdir(PATH_TO_MOVES_OUTPUT);
  const buffers = [];

  for (const file of files) {
    const buffer = await fs.promises.readFile(
      path.resolve(PATH_TO_MOVES_OUTPUT, file)
    );
    buffers.push(buffer);
  }

  return buffers;
};

const createBuffers = async (inputs) => {
  const buffers = await checkIfAnyBuffersExist();
  if (buffers.length > 0) {
    console.log("Buffers already exist");

    return buffers;
  }

  for (let i = 0; i < inputs.length; i++) {
    const buffer = await createSpeechFile(inputs[i]);

    console.log(`Created speech file for move ${i + 1}`);
    buffers.push(buffer);
  }

  // save the buffers to the audio directory
  for (let i = 0; i < buffers.length; i++) {
    const outputPath = path.resolve(`${PATH_TO_MOVES_OUTPUT}/move-${i}.mp3`);
    await fs.promises.writeFile(outputPath, buffers[i]);
  }

  return buffers;
};

function createSilence(durationMs, outputPath) {
  return new Promise((resolve, reject) => {
    const durationSeconds = (durationMs / 1000).toFixed(3); // Format duration to 3 decimal places
    const command = `ffmpeg -y -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -t ${durationSeconds} -acodec libmp3lame -q:a 9 "${outputPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error generating silence:", stderr);
        return reject(error);
      }
      resolve(outputPath);
    });
  });
}

async function main(inputs) {
  // given inputs as an array of strings, create a speech file for each input

  // delete the existing combined audio file
  const combinedFilePath = path.resolve(`${PATH_TO_MOVES_OUTPUT}/combined.mp3`);
  if (fs.existsSync(combinedFilePath)) {
    await fs.promises.unlink(combinedFilePath);
  }

  const silenceFilePath = path.resolve(`${PATH_TO_MOVES_OUTPUT}/silence.mp3`);
  if (fs.existsSync(silenceFilePath)) {
    await fs.promises.unlink(silenceFilePath);
  }

  const buffers = await createBuffers(inputs);
  console.log("Created " + buffers.length + " buffers");

  // create an audio file that has the duration of BAR_DELAYms between each move
  const combinedBuffers = [];
  const silencePath = path.resolve(`${PATH_TO_MOVES_OUTPUT}/silence.mp3`);
  await createSilence(BAR_DELAY, silencePath);
  const silenceBuffer = await fs.promises.readFile(silencePath);

  for (const buffer of buffers) {
    combinedBuffers.push(buffer);

    combinedBuffers.push(silenceBuffer);
  }

  // delete the silence file
  await fs.promises.unlink(silencePath);

  const outputPath = path.resolve(`${PATH_TO_MOVES_OUTPUT}/combined.mp3`);
  const combinedBuffer = Buffer.concat(combinedBuffers);
  await fs.promises.writeFile(outputPath, combinedBuffer);
  console.log("Combined all buffers into one audio file");
}

fs.promises
  .readFile(PATH_TO_MOVES, "utf8")
  .then((data) => {
    const moves = JSON.parse(data);
    main(moves);
  })
  .catch((error) => {
    console.error(error);
  });
