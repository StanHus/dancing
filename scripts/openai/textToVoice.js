const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const dotenv = require("dotenv");

const BAR_DELAY = 1000;
const PATH_TO_MOVES = path.resolve("./src/data/moves/moves.json");
const PATH_TO_MOVES_OUTPUT = path.resolve("./src/data/audio");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createSpeechFile(input, index) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  const outputPath = path.resolve(`${PATH_TO_MOVES_OUTPUT}/move-${index}.mp3`);
  await fs.promises.writeFile(outputPath, buffer);
}

async function main(inputs) {
  // given inputs as an array of strings, create a speech file for each input
  for (let i = 0; i < inputs.length; i++) {
    await createSpeechFile(inputs[i], i);
    console.log(`Created speech file for move ${i + 1}`);
  }
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
