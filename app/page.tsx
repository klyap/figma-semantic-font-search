"use client";

import { figmaAPI } from "@/lib/figmaAPI";
import { getTextForSelection } from "@/lib/getTextForSelection";
import { getTextOffset } from "@/lib/getTextOffset";
import { CompletionRequestBody } from "@/lib/types";
import { useState } from "react";
import { ListItem } from "./ListItem";
import { Search, Sparkles } from "lucide-react";
import { getFontCSSUrl, getUniqueFontNames } from "./utils";
import { figmaFonts } from "./figma-fonts";

export default function Plugin() {
  const [completion, setCompletion] = useState("");
  const [results, setResults] = useState(getUniqueFontNames());
  const [searchTerm, setSearchTerm] = useState("");
  const debounce = (func: any, delay: number) => {
    let debounceTimer: any;
    return function () {
      // @ts-ignore
      const context: any = this;
      const args: any = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  };

  const handleSearch = debounce(async (searchTerm: string) => {
    console.log("searchTerm", searchTerm);

    if (searchTerm == "") {
      setResults(getUniqueFontNames());
    } else {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchTerm }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setResults(data);
      } else {
        console.error("Search request failed");
      }
    }
  }, 300);

  const handleFilter = async (searchTerm: string) => {
    console.log("searchTerm", searchTerm);
    if (searchTerm == "All") {
      setResults(getUniqueFontNames());
    } else {
      const response = await fetch("/api/filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchTerm }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setResults(data);
      } else {
        console.error("Search request failed");
      }
    }
  };

  const onSetFont = async (fontName: string, fontStyle: string) => {
    const layers = await getTextForSelection();

    if (!layers.length) {
      figmaAPI.run(async (figma) => {
        figma.notify("Please select a layer with text in it.", { error: true });
      });
      return;
    }

    let nodeID: string | null = null;

    const createOrUpdateTextNode = async (
      fontName: string,
      fontStyle: string,
    ) => {
      // figmaAPI.run is a helper that lets us run code in the figma plugin sandbox directly
      // from the iframe without having to post messages back and forth. For more info,
      // see /lib/figmaAPI.ts
      //
      // It is important to note that any variables that this function closes over must be
      // specified in the second argument to figmaAPI.run. This is because the code is actually
      // run in the figma plugin sandbox, not in the iframe.

      nodeID = await figmaAPI.run(
        async (figma, { fontName, fontStyle }) => {
          // let node = figma.getNodeById(nodeID ?? "");
          let nodeId = null;
          figma.currentPage.selection.forEach(async (node) => {
            if (node.type === "TEXT") {
              await figma.loadFontAsync({ family: fontName, style: fontStyle });
              console.log("figma.loadFontAsync", {
                family: fontName,
                style: fontStyle,
              });
              node.fontName = { family: fontName, style: fontStyle };

              nodeId = node.id;
            }
          });
          return nodeId;
        },
        { fontName, fontStyle },
      );
    };

    await createOrUpdateTextNode(fontName, fontStyle);
  };

  const fontCategories = [
    "Sans Serif",
    "Serif",
    "Display",
    "Monospace",
    "Handwriting",
  ];

  return (
    <div className="absolute w-full bg-white border">
      <link href={getFontCSSUrl(results)} rel="stylesheet"></link>
      <div className="p-2 border-b">
        <div className="flex items-center p-1">
          <Sparkles className="h-4 w-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by vibe"
            className="w-full outline-none"
            value={searchTerm}
            onChange={async (e) => {
              setSearchTerm(e.target.value);
              // @ts-ignore
              await handleSearch(e.target.value);
            }}
          />
        </div>
      </div>
      <div className="flex space-x-2 mt-2 pb-2 border-b">
        <select
          className="mx-2 py-1 w-full"
          onChange={(e) => handleFilter(e.target.value)}
        >
          <option value={"All"} key={"All"}>
            {"All categories"}
          </option>
          {fontCategories.map((categoryName) => (
            <option value={categoryName} key={categoryName}>
              {categoryName}
            </option>
          ))}
        </select>
      </div>
      <ul className="max-h-90 overflow-auto pb-2">
        <div className="h-2"></div>
        {results.map((fontObj) => {
          const name = fontObj;
          const fontsWithPlain = [
            "Al Bayan",
            "Academy Engraved LET",
            "Party LET",
            "Savoye LET",
          ];
          let style = name.toLowerCase().includes(" mono")
            ? "monospace"
            : fontsWithPlain.includes(name)
              ? "Plain"
              : "Regular";
          // const name = fontObj.fontName.family;
          // const style = fontObj.fontName.style;
          return (
            <li
              key={name}
              className={`text-lg px-4 hover:bg-gray-100 cursor-pointer `}
              data-content={name}
              style={{ fontFamily: `${name}, ${style}` }}
              onClick={() => onSetFont(name, style)}
            >
              <div className="flex items-center justify-between">
                <span>{name}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
