import { LocalIndex } from "vectra";
import path from "path";
import fs from "fs";
import { promisify } from "util";

import { fileURLToPath } from "url";
import { dirname } from "path";

import { fontMetadata } from "../app/fonts-metadata.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const index = new LocalIndex(path.join(__dirname, "..", "vectra-embeddings"));

import { pipeline } from "@xenova/transformers";
const generateEmbedding = await pipeline(
  "feature-extraction",
  "Supabase/gte-small",
);

async function getVector(text) {
  // Generate a vector using Transformers.js
  const output = await generateEmbedding(text, {
    pooling: "mean",
    normalize: true,
  });

  // Extract the embedding output
  const embedding = Array.from(output.data);
  return embedding;
}

async function addItem(text) {
  await index.insertItem({
    vector: await getVector(text),
    metadata: { text },
  });
}

async function addItemWithMetadata(text, metadata) {
  const vector = await getVector(text);
  // console.log("typeof vector[0]", typeof vector[0])
  if (typeof vector[0] !== "number") {
    console.log("---ERROR", vector);
    throw vector;
  }
  await index.insertItem({
    vector: await getVector(text),
    metadata: metadata,
  });
}

async function query(text) {
  const vector = await getVector(text);
  const results = await index.queryItems(vector, 5);
  console.log("------ querying: ", text);
  if (results.length > 0) {
    for (const result of results) {
      console.log(`[${result.score}] ${result.item.metadata.description}`);
    }
  } else {
    console.log(`No results found.`);
  }
}

function continueDataAtId(dataList, id) {
  const i = dataList.findIndex((element) => element.id === id);
  return i;
}

function objectToArray(obj) {
  const resultArray = Object.keys(obj).map((key) => {
    return {
      name: key,
      description: obj[key].description,
      category: obj[key].category,
    };
  });
  return resultArray;
}

async function loadData() {
  try {
    const jsonData = objectToArray(fontMetadata);
    // const jsonShort = [jsonData[0], jsonData[1], jsonData[3]]

    const startIndex = 0;
    // const startIndex = continueDataAtId(jsonData, 22751) + 1
    // console.log("_------START INDEX", startIndex, jsonData.length)
    for (let i = startIndex; i < jsonData.length; i++) {
      const item = jsonData[i];
      console.log("item", item);
      console.log("--name", item.name);
      const embeddedText = item.description;
      console.log(embeddedText);

      await addItemWithMetadata(embeddedText, item);
    }
  } catch (e) {
    console.log(e);
  }
}

export default async function main() {
  if (!(await index.isIndexCreated())) {
    await index.createIndex();
    // await index.deleteIndex
  }

  await loadData();
  // await removeItem();

  // await addItem('apple');
  // await addItem('oranges');
  // await addItem('red');
  // await addItem('blue');
}

// main();
await query("geometric with sharp angles");
