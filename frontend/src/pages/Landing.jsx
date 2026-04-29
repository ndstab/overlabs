import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Hero } from "../components/landing/Hero";
import { Problem } from "../components/landing/Problem";
import { HowItWorks } from "../components/landing/HowItWorks";
import { ExampleEmail } from "../components/landing/ExampleEmail";
import { FinalCTA } from "../components/landing/FinalCTA";
import { Footer } from "../components/landing/Footer";

export function Landing() {
  return (
    <div className="min-h-screen bg-cream-100 text-ink-900">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <ExampleEmail />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-20 border-b border-cream-300/40 bg-cream-100/75 backdrop-blur-md"
    >
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="font-display text-2xl font-semibold text-ink-900 tracking-tight"
        >
          Overlabs
        </Link>
        <nav className="hidden sm:flex items-center gap-8 text-sm text-ink-600">
          <a href="#how" className="hover:text-ink-900 transition-colors">
            How it works
          </a>
          <a href="#example" className="hover:text-ink-900 transition-colors">
            Example
          </a>
        </nav>
        <Link
          to="/generate"
          className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-cream-50 hover:bg-ink-800 transition-colors"
        >
          Try it
        </Link>
      </div>
    </motion.header>
  );
}
