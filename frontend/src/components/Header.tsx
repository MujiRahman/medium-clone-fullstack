import Link from "next/link";
import { HeaderNav } from "./HeaderNav";
import { SearchAutocomplete } from "./SearchAutocomplete";

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6 gap-4">
        
        {/* Left Section: Logo & Search */}
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight shrink-0">
            Medium Clone
          </Link>
          <div className="hidden sm:block flex-1 max-w-xs">
            <SearchAutocomplete />
          </div>
        </div>

        {/* Right Section: Navigation & Dropdown */}
        <div className="shrink-0 flex items-center">
          <HeaderNav />
        </div>
        
      </div>
    </header>
  );
}
