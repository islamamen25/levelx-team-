import { Link } from "@/i18n/navigation";

export default function CategoryNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 pt-[6.5rem]">
      <p className="text-5xl font-bold text-[var(--color-iron)]">404</p>
      <h1 className="text-xl font-semibold text-[var(--color-ceramic)]">Category not found</h1>
      <p className="text-sm text-[var(--color-slate)]">
        This category may have been removed or is currently hidden.
      </p>
      <Link
        href="/"
        className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold text-white
                   bg-[var(--color-ceramic)] hover:opacity-80 transition-opacity"
      >
        Back to home
      </Link>
    </div>
  );
}
