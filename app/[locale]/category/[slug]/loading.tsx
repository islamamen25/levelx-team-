export default function CategoryLoading() {
  return (
    <div className="bg-white pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-10 space-y-6 animate-pulse">
        {/* Breadcrumb */}
        <div className="flex gap-2 items-center">
          <div className="h-4 w-10 rounded bg-gray-100" />
          <div className="h-4 w-3 rounded bg-gray-100" />
          <div className="h-4 w-32 rounded bg-gray-100" />
        </div>
        {/* Header */}
        <div className="flex items-baseline justify-between">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-100" />
        </div>
        {/* Grid */}
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-16 rounded bg-gray-100" />
                <div className="h-4 w-full rounded bg-gray-200" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
