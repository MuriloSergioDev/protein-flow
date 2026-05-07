import Image from "next/image";

export function AppLogo({ height = 24 }: { height?: number }) {
  const width = Math.round(height * (8 / 3));
  return (
    <>
      <Image
        src="/protein-flow-logo-helix.png"
        alt="ProteinFlow"
        width={width}
        height={height}
        style={{ height, width: "auto" }}
        className="dark:hidden"
        priority
      />
      <Image
        src="/protein-flow-logo-helix-white.png"
        alt="ProteinFlow"
        width={width}
        height={height}
        style={{ height, width: "auto" }}
        className="hidden dark:block"
        priority
      />
    </>
  );
}
