
import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore
import PipelineSingleton from './pipeline.ts';
import embeddedData from '../../../vectra-embeddings/index.json'
import similarity from 'compute-cosine-similarity'

async function getEmbeddingVector(text: string) {
  //When called for the first time,
  // this will load the pipeline and cache it for future use.
  // @ts-ignore
  const embeddings = await PipelineSingleton.getInstance();
  const result = await embeddings(text, {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(result.data);
}

async function search(query: string) {

  const queryVector = await getEmbeddingVector(query)
  // @ts-ignore
  const embeddings = embeddedData.items;
  const uniqueEmbeddings = uniqueFontNames(embeddings);
  // @ts-ignore
  let results = []

  // We need to await the promises returned by map before sorting
  console.log("uniqueEmbeddings leng", uniqueEmbeddings.length)
  const sortedList = await Promise.all(uniqueEmbeddings.map(async (a: any) => {
    if (Array.isArray(a.vector)) {
      // @ts-ignore
      const score = await similarity(queryVector, a.vector) || 0;
      const scoredMeta = { ...a.metadata, score }
      return { ...a, metadata: scoredMeta }
    }
  }))
  console.log("sortedList len", sortedList.length)

  sortedList.sort((a: any, b: any) => {
    return b.metadata.score - a.metadata.score
  });

  console.log("sortedList sorted len", sortedList.length)

  // @ts-ignore
  results = sortedList.filter((item: any) => item.metadata.score > 0.8);
  console.log("results filtered len", results.length)

  return results
}

const uniqueFontNames = (fonts: EmbeddingData[]) => {
  const uniqueFonts: EmbeddingData[] = [];
  const fontNames: string[] = [];

  fonts.forEach((font) => {
    if (!fontNames.includes(font.metadata.name)) {
      fontNames.push(font.metadata.name);
      uniqueFonts.push(font);
    }
  });

  return uniqueFonts;
};

type FontMeta = {
  name: string,
  description: string,
  category: string
}

type EmbeddingData = {
  id: string,
  metadata: FontMeta,
  vector: number[]
}

export async function POST(request: NextRequest) {
  // const text = request.nextUrl.searchParams.get('text');
  const req = await request.json()
  const text = req.query
  console.log(req, text)
  if (!text) {
    return NextResponse.json({
      error: 'Missing text parameter',
    }, { status: 400 });
  }

  const results = await search(text);
  const nameList = results.map((obj: EmbeddingData) => obj.metadata.name)
  // console.log(nameList)
  return NextResponse.json(nameList);
}