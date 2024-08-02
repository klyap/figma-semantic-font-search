const axios = require("axios");
const { getUniqueFontNames } = require("../app/utils.ts");

async function fetchFontSpecimens() {
  const fontNames = getUniqueFontNames();
  // this doesn't exist on google https://fonts.google.com/metadata/fonts/Academy+Engraved+LET
  // fontNames = ["Arapey", "Academy Engraved LET", "Inter"]
  console.log(fontNames);
  const fontSpecimens = {};
  const missingFontSpecimens = [];

  const maxLen = fontNames.length;
  for (let i = 0; i < maxLen; i++) {
    const fontName = fontNames[i];
    const formattedName = fontName.replace(/ /g, "+");
    const url = `https://fonts.google.com/metadata/fonts/${formattedName}`;

    try {
      const response = await axios.get(url);
      // console.log("----------")
      const data = JSON.parse(response.data.replace(")]}'\n", ""));
      const cleanDesc = data.description.replace(/<p>|<\/p>|\n/g, "");
      const conciseData = {
        description: cleanDesc,
        category: data.category,
      };
      fontSpecimens[fontName] = conciseData;
    } catch (error) {
      missingFontSpecimens.push(fontName);
      console.error(`Failed to fetch the specimen for font: ${fontName}`);
    }
  }

  return { fontSpecimens, missingFontSpecimens };
}

fetchFontSpecimens().then(({ fontSpecimens, missingFontSpecimens }) => {
  const fs = require("fs");
  console.log(fontSpecimens);
  fs.writeFileSync(
    "fonts-metadata.js",
    "export const fontMedata = " + JSON.stringify(fontSpecimens, null, 2),
  );
  fs.writeFileSync(
    "missing-fonts.js",
    JSON.stringify(missingFontSpecimens, null, 2),
  );
});
