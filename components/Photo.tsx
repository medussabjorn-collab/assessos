type Ratio = "wide" | "square" | "tall";

export function PhotoBand({
  src,
  alt,
  ratio = "wide",
  className = "",
}: {
  src: string;
  alt: string;
  ratio?: Ratio;
  className?: string;
}) {
  return (
    <div className={`photo-band photo-${ratio} ${className}`.trim()}>
      {/* Static export: next/image adds no benefit here, plain img keeps it simple. */}
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}
