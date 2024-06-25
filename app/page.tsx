"use client";

import { figmaAPI } from "@/lib/figmaAPI";
import { getTextForSelection } from "@/lib/getTextForSelection";
import { getTextOffset } from "@/lib/getTextOffset";
import { CompletionRequestBody } from "@/lib/types";
import { useState } from "react";
import { z } from "zod";
import { ListItem } from "./ListItem";
import { Search, Sparkles } from 'lucide-react';
import { getFontCSSUrl, getUniqueFontNames } from "./utils";
import { figmaFonts } from "./figma-fonts";

// This function calls our API and lets you read each character as it comes in.
// To change the prompt of our AI, go to `app/api/completion.ts`.
async function streamAIResponse(body: z.infer<typeof CompletionRequestBody>) {
  const resp = await fetch("/api/completion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const reader = resp.body?.pipeThrough(new TextDecoderStream()).getReader();

  if (!reader) {
    throw new Error("Error reading response");
  }

  return reader;
}

export default function Plugin() {
  const [completion, setCompletion] = useState("");
  const [results, setResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("searchTerm", searchTerm)
    // const results = await search(searchTerm);
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: searchTerm }),
    });

    if (response.ok) {
      const data = await response.json();
      setResults(data.data);
    } else {
      console.error('Search request failed');
    }
  };

  // This function calls our API and handles the streaming response.
  // This ends up building the text up and using React state to update the UI.
  const onStreamToIFrame = async () => {
    setCompletion("");
    const layers = await getTextForSelection();

    if (!layers.length) {
      figmaAPI.run(async (figma) => {
        figma.notify(
          "Please select a layer with text in it to generate a poem.",
          { error: true },
        );
      });
      return;
    }

    const reader = await streamAIResponse({
      layers,
    });

    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      text += value;
      setCompletion(text);
    }
  };

  // This is the same as above, but instead of updating React state, it adds the
  // text to the Figma canvas.
  const onStreamToCanvas = async () => {
    const layers = await getTextForSelection();

    if (!layers.length) {
      figmaAPI.run(async (figma) => {
        figma.notify(
          "Please select a layer with text in it to generate a poem.",
          { error: true },
        );
      });
      return;
    }

    const reader = await streamAIResponse({
      layers,
    });

    let text = "";
    let nodeID: string | null = null;
    const textPosition = await getTextOffset();

    const createOrUpdateTextNode = async () => {
      // figmaAPI.run is a helper that lets us run code in the figma plugin sandbox directly
      // from the iframe without having to post messages back and forth. For more info,
      // see /lib/figmaAPI.ts
      //
      // It is important to note that any variables that this function closes over must be
      // specified in the second argument to figmaAPI.run. This is because the code is actually
      // run in the figma plugin sandbox, not in the iframe.
      nodeID = await figmaAPI.run(
        async (figma, { nodeID, text, textPosition }) => {
          let node = figma.getNodeById(nodeID ?? "");

          // If the node doesn't exist, create it and position it to the right of the selection.
          if (!node) {
            node = figma.createText();
            node.x = textPosition?.x ?? 0;
            node.y = textPosition?.y ?? 0;
          }

          if (node.type !== "TEXT") {
            return "";
          }

          const oldHeight = node.height;

          await figma.loadFontAsync({ family: "Inter", style: "Medium" });
          node.fontName = { family: "Inter", style: "Medium" };

          node.characters = text;

          // Scroll and zoom to the node if it's height changed (ex we've added a new line).
          // We only do this when the height changes to reduce flickering.
          if (oldHeight !== node.height) {
            figma.viewport.scrollAndZoomIntoView([node]);
          }

          return node.id;
        },
        { nodeID, text, textPosition },
      );
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      text += value;
      await createOrUpdateTextNode();
    }
  };

  const onSetFont = async (fontName: string, fontStyle: string) => {
    console.log("fontName", fontName)
    const layers = await getTextForSelection();

    if (!layers.length) {
      figmaAPI.run(async (figma) => {
        figma.notify(
          "Please select a layer with text in it.",
          { error: true },
        );
      });
      return;
    }

    // const reader = await streamAIResponse({
    //   layers,
    // });

    let text = "";
    let nodeID: string | null = null;
    const textPosition = await getTextOffset();

    const createOrUpdateTextNode = async (fontName: string, fontStyle: string) => {
      // figmaAPI.run is a helper that lets us run code in the figma plugin sandbox directly
      // from the iframe without having to post messages back and forth. For more info,
      // see /lib/figmaAPI.ts
      //
      // It is important to note that any variables that this function closes over must be
      // specified in the second argument to figmaAPI.run. This is because the code is actually
      // run in the figma plugin sandbox, not in the iframe.
      console.log("createOrUpdateTextNode fontName", fontName)

      nodeID = await figmaAPI.run(
        async (figma, { nodeID, text, textPosition, fontName, fontStyle }) => {
          // let node = figma.getNodeById(nodeID ?? "");
          let nodeId = null;
          figma.currentPage.selection.forEach(
            async node => {
              if (node.type === 'TEXT') {
                const oldHeight = node.height;

                await figma.loadFontAsync({ family: fontName, style: fontStyle });
                node.fontName = { family: fontName, style: fontStyle };

                // Scroll and zoom to the node if it's height changed (ex we've added a new line).
                // We only do this when the height changes to reduce flickering.
                // if (oldHeight !== node.height) {
                //   figma.viewport.scrollAndZoomIntoView([node]);
                // }

                nodeId = node.id;
              }
            }
          )
          return nodeId
        },
        { nodeID, text, textPosition, fontName, fontStyle },
      );
    };
    await createOrUpdateTextNode(fontName, fontStyle);
  };

  return (
    <div className="absolute w-full bg-white border">
      <link href={getFontCSSUrl()} rel="stylesheet"></link>
      <div className="p-2 border-b">
        <div className="flex items-center p-1">
          <Sparkles className="h-4 w-4 text-gray-400 mr-2" />

          <input
            type="text"
            placeholder="Search fonts"
            className="w-full outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ul className="max-h-90 overflow-auto">
        <div className="h-2"></div>
        {getUniqueFontNames().map((fontObj) => {
          const name = fontObj;
          const fontsWithPlain = ["Al Bayan", "Academy Engraved LET", "Party LET", "Savoye LET"]
          const style = fontsWithPlain.includes(name) ? "Plain" : "Regular";
          // const name = fontObj.fontName.family;
          // const style = fontObj.fontName.style;
          return (
            <li
              key={name}
              className={`text-lg px-4 hover:bg-gray-100 cursor-pointer `}
              data-content={name}
              style={{ fontFamily: `${name}` }}
              onClick={() => onSetFont(name, style)}
            >
              <div className="flex items-center justify-between">
                <span>{name}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  );
}
