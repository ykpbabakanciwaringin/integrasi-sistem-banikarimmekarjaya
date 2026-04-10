// path: components/shared/logo-header.tsx
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoHeaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  mode?: "light" | "dark"; // dark mode untuk sidebar admin
}

export function LogoHeader({
  className,
  size = "md",
  mode = "light",
}: LogoHeaderProps) {
  // Ukuran Logo Dinamis
  const dimensions = {
    sm: { width: 40, height: 40, title: "text-lg", sub: "text-[10px]" },
    md: { width: 60, height: 60, title: "text-2xl", sub: "text-xs" },
    lg: { width: 80, height: 80, title: "text-3xl", sub: "text-sm" },
  };

  const { width, height, title, sub } = dimensions[size];

  // Warna Teks berdasarkan mode
  const titleColor = mode === "light" ? "text-ykp-700" : "text-white";
  const subColor = mode === "light" ? "text-gold-600" : "text-gold-400";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative shrink-0">
        <Image
          src="/images/logo-ykp.png"
          alt="Logo YKP"
          width={width}
          height={height}
          className="object-contain"
          priority
          unoptimized // <--- PERBAIKAN: Menambahkan ini agar tidak kena error 400 di VPS
        />
      </div>
      <div className="flex flex-col font-bold leading-tight">
        <span className={cn(title, titleColor, "font-serif tracking-tight")}>
          YAYASAN
        </span>
        <span className={cn(sub, subColor, "uppercase tracking-wider")}>
          Kebajikan Pesantren
        </span>
        <span className={cn(sub, subColor, "uppercase tracking-wider")}>
          Babakan Ciwaringin Cirebon
        </span>
      </div>
    </div>
  );
}
