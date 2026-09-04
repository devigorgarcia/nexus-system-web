import Image from "next/image";

type NexusMarkProps = {
  className?: string;
  decorative?: boolean;
};

export function NexusMark({ className, decorative = true }: NexusMarkProps) {
  return (
    <Image
      src="/nexus-mark.png"
      alt={decorative ? "" : "Nexus"}
      width={256}
      height={256}
      priority
      className={className}
    />
  );
}
