const PALETTE = [
  { bg: "#313d9e", fg: "#ffffff" }, // indigo / white
  { bg: "#c1dbe8", fg: "#1d2050" }, // pastel blue / navy
  { bg: "#8890d8", fg: "#ffffff" }, // periwinkle / white
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash;
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const { bg, fg } = PALETTE[hashName(name) % PALETTE.length];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-medium"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: bg,
        color: fg,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
