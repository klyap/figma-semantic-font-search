import { NextRequest, NextResponse } from 'next/server'
import { fontMetadata } from '../../fonts-metadata'

type FontMetadata = {
  description: string,
  category: string
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

  // @ts-ignore
  const matchingFonts = Object.keys(fontMetadata).filter((fontName: string) => fontMetadata[fontName].category === text);
  return NextResponse.json(matchingFonts);
}