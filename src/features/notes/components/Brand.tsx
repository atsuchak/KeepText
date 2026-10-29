import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="KeepText home">
      <Image src="/assets/keeptext-favicon/android-chrome-192x192.png" alt="" width={32} height={32} />
      <span><span className="brand-keep">Keep</span><span className="brand-text">Text</span></span>
    </Link>
  );
}
