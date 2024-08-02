export const ListItem = ({
  fontName,
  onSetFont,
}: {
  fontName: string;
  onSetFont: (fontName: string) => void;
}) => {
  return (
    <div
      className="font-row"
      data-content={fontName}
      style={{ fontFamily: `${fontName}, sans-serif` }}
      onClick={() => onSetFont(fontName)}
    >
      {fontName}
    </div>
  );
};
