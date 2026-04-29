export function Footer() {
  return (
    <footer className="border-t border-cream-300/60 bg-cream-50">
      <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-500">
        <div className="sm:flex-1 w-full text-left">
          <p className="font-display text-lg font-semibold text-ink-700">
            Overlabs
          </p>
        </div>

        <div className="sm:flex-1 w-full text-center">
          <p className="text-sm leading-relaxed">
            Built by{" "}
            <a
              href="https://github.com/ndstab"
              target="_blank"
              rel="noreferrer"
              className="text-ink-700 hover:text-accent transition-colors font-medium"
            >
              ndstab
            </a>
          </p>
        </div>

        <div className="sm:flex-1 w-full text-right">
          <p className="text-sm leading-relaxed">
            A small tool for students who'd rather work in labs than write cold emails.
          </p>
        </div>
      </div>
    </footer>
  );
}
