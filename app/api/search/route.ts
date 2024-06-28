// import { createClient } from '@supabase/supabase-js';

import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore
import PipelineSingleton from './pipeline.ts';
import { fontMetadata } from '@/app/fonts-metadata.js';

async function getEmbeddings(text: string) {
  //When called for the first time,
  // this will load the pipeline and cache it for future use.
  // @ts-ignore
  const embeddings = await PipelineSingleton.getInstance();
  const result = await embeddings(text, {
    pooling: 'mean',
    normalize: true,
  });
  console.log(result);
  return Array.from(result.data);
}

const getMockEmbeddings = (text: string) => {
  // @ts-ignore
  return Object.keys(fontMetadata).filter(fontName => fontMetadata[fontName].description.includes(text))
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

  // const queryEmbedding = await getEmbeddings(text);
  const queryEmbedding = getMockEmbeddings(text) || [];
  console.log(queryEmbedding)

  // const supabaseUrl = process.env.SUPABASE_URL || "";
  // const supabaseKey = process.env.SUPABASE_KEY || "";
  // const supabase = createClient(supabaseUrl, supabaseKey);

  // const documents = await supabase.rpc('match_documents', {
  //   query_embedding: queryEmbedding, // Pass the embedding you want to compare
  //   match_threshold: 0.6, // Choose an appropriate threshold for your data
  //   match_count: 20, // Choose the number of matches
  // });

  // console.log("documents", documents)
  // console.log(documents.map((row: Document) => `${row.affinity_org_name}, ${row.affinity_note_content}`))
  // return documents;


  return NextResponse.json({ data: queryEmbedding });
}