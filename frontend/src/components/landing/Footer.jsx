export function Footer() {
  return (
    <footer className="border-t border-cream-300/60 bg-cream-50">
      <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-500">
        <p className="font-display text-base font-semibold text-ink-700">
          Overlabs
        </p>
        <p className="text-xs">
          A small tool for students who'd rather work in labs than write cold emails.
        </p>
      </div>
    </footer>
  );
}
