"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function SearchInput() {
    return (
        <div className="relative flex w-full max-w-2xl items-center space-x-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                    type="text"
                    placeholder="Search for jobs (e.g. 'AI Consultant', 'Product Manager')..."
                    className="pl-10 h-12 text-lg"
                />
            </div>
            <Button size="lg" className="h-12 px-8">
                Search
            </Button>
        </div>
    );
}
