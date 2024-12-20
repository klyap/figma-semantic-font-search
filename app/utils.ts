import { figmaFonts } from "./figma-fonts";

export const getFontCSSUrl = (fontName: any) => {
  const fontNamesFull = fontName || getUniqueFontNames();
  // Doesn't work after a certain number of fonts somehow, so limiting to 50 for now
  const fontNames = fontNamesFull.slice(0, 200);

  console.log("fontNames", fontNames)
  let fontURLParams = fontNames.map((name: string) => {
    let formattedName = name.replace(/ /g, "+");
    return `family=${formattedName}`;
  });
  return `https://fonts.googleapis.com/css2?${fontURLParams.join(
    "&",
  )}&display=swap`;
};

export const getUniqueFontNames = () => {
  // @ts-ignore
  const fontNames = figmaFonts.map((font) => font.fontName.family);
  const uniqueFontNames = fontNames.filter(
    (value, index, self) => self.indexOf(value) === index,
  );

  const filteredFontNames = uniqueFontNames.filter(
    (name) => !name.startsWith(".") && !name.startsWith("?"),
  );
  return filteredFontNames;
};
