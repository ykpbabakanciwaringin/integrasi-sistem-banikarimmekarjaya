// path: components/dashboard/footer.tsx
import packageInfo from "../../../package.json";

export function Footer() {
  // Membaca versi secara otomatis dari package.json
  const appVersion = packageInfo.version || "1.0.0";

  return (
    <footer className="w-full border-t bg-white py-4 px-6">
      <div className="flex flex-col items-center justify-between gap-2 md:flex-row text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} Yayasan Kebajikan Pesantren. All
          rights reserved.
        </p>
        <p className="text-xs font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shadow-sm">
          Versi {appVersion}
        </p>
      </div>
    </footer>
  );
}