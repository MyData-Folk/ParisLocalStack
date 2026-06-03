import { useState } from "react";
import type { LucideIcon } from "lucide-react";

type GuestCardImageProps = {
  src?: string;
  alt: string;
  fallbackIcon: LucideIcon;
  iconTileClassName: string;
  iconClassName?: string;
  className?: string;
  rounded?: "top" | "all";
};

export function GuestCardImage({ src, alt, fallbackIcon: Fallback, iconTileClassName, iconClassName = "h-7 w-7", className, rounded = "all" }: GuestCardImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const radiusClass = rounded === "top" ? "rounded-t-3xl" : "rounded-3xl";

  if (showImage) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${radiusClass} h-40 w-full object-cover ${className ?? ""}`.trim()}
      />
    );
  }

  return (
    <div className={`${radiusClass} flex h-40 w-full items-center justify-center ${iconTileClassName} ${className ?? ""}`.trim()}>
      <Fallback className={iconClassName} aria-hidden="true" />
    </div>
  );
}
