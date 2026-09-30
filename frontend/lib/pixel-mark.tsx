// Marca "IT-" em pixel-art usada para gerar os ícones do app (app/icon.tsx e app/apple-icon.tsx).
const MAP = [
  "###.#####...",
  ".#....#.....",
  ".#....#...##",
  ".#....#.....",
  "###...#.....",
]

export function PixelMark({ size }: { size: number }) {
  const cols = MAP[0].length
  const cell = Math.floor((size * 0.68) / cols)
  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#030304",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: Math.max(2, Math.round(size * 0.035)),
          background: "#f0185f",
        }}
      />
      {MAP.map((row, r) => (
        <div key={r} style={{ display: "flex" }}>
          {row.split("").map((c, i) => (
            <div
              key={i}
              style={{
                width: cell,
                height: cell,
                background: c === "#" ? (i >= 10 ? "#f0185f" : i >= 4 ? "#2fe6f2" : "#f4f4f6") : "transparent",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
