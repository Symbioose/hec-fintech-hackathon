/**
 * Webi Spider Logo
 * Geometric 8-leg spider — single colored stroke, glyph-like.
 * Used in sidebar, login, and brand contexts.
 */
export function SpiderLogo({
  size = 32,
  color = "currentColor",
  strokeWidth = 1.4,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* Body — solid ellipse, slightly vertical */}
      <ellipse cx="16" cy="16" rx="3.2" ry="3.8" fill={color} />

      {/* 8 legs — angular, radiating */}
      <g
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* Left side (4 legs) */}
        <path d="M13.2 13.4 L8 10 L4.5 11.5" />
        <path d="M13 15.5 L7 14.5 L3.5 15.5" />
        <path d="M13 17 L7 18.5 L3.5 18" />
        <path d="M13.2 18.8 L8 22 L4.5 21" />

        {/* Right side (4 legs) */}
        <path d="M18.8 13.4 L24 10 L27.5 11.5" />
        <path d="M19 15.5 L25 14.5 L28.5 15.5" />
        <path d="M19 17 L25 18.5 L28.5 18" />
        <path d="M18.8 18.8 L24 22 L27.5 21" />
      </g>

      {/* Eyes — tiny dots on the body */}
      <circle cx="14.5" cy="14.5" r="0.55" fill={color === "currentColor" ? "#000" : "#000"} opacity={0.85} />
      <circle cx="17.5" cy="14.5" r="0.55" fill={color === "currentColor" ? "#000" : "#000"} opacity={0.85} />
    </svg>
  );
}
