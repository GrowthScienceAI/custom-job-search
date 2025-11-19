import Link from "next/link";
import { Search } from "lucide-react";

export function Header() {
    return (
        <header className="border-b bg-white">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
                    <Search className="h-6 w-6" />
                    <span>JobSearch</span>
                </Link>
                <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
                    <Link href="/" className="hover:text-blue-600">
                        Search
                    </Link>
                    <Link href="/dashboard" className="hover:text-blue-600">
                        My Jobs
                    </Link>
                </nav>
            </div>
        </header>
    );
}
