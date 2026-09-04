type NexusMarkProps = {
  className?: string;
  decorative?: boolean;
};

export function NexusMark({ className, decorative = true }: NexusMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Nexus"}
    >
      <path
        fill="#C45C26"
        d="M10 6h15v26l17-26h12v52H39V32L22 58H10V6z"
      />
    </svg>
  );
}
