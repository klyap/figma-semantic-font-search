import { NextRequest, NextResponse } from "next/server";
import { fontMetadata } from "../../fonts-metadata.mjs";

type FontMetadata = {
  description: string;
  category: string;
};

export async function POST(request: NextRequest) {
  // const text = request.nextUrl.searchParams.get('text');
  const req = await request.json();
  const category = req.query;
  console.log(req, category);
  if (!category) {
    return NextResponse.json(
      {
        error: "Missing category parameter",
      },
      { status: 400 },
    );
  }

  // @ts-ignore
  const matchingFonts = Object.keys(fontMetadata).filter(
    // @ts-ignore
    (fontName: string) => fontMetadata[fontName].category === category,
  );
  return NextResponse.json(matchingFonts);
}
