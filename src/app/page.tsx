"use client";

import { useState, useEffect } from "react";
import { SearchInput } from "@/components/search/SearchInput";
import { FilterPanel } from "@/components/search/FilterPanel";
import { ResultsList } from "@/components/search/ResultsList";
import { Job } from "@/components/search/JobCard";
import { searchJobs } from "@/lib/search/searchEngine";

export default function Home() {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const results = await searchJobs(query);
        setJobs(results);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchJobs();
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col items-center space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Search 60+ Job Boards. <span className="text-blue-600">Once.</span>
        </h1>
        <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          Stop opening 20 tabs. Find the best AI, Product, and Marketing jobs from across the web in one place.
        </p>
        <div className="w-full max-w-2xl pt-4">
          {/* We need to lift the state up from SearchInput or pass a callback */}
          {/* For this prototype, I'll modify SearchInput to accept props or just use a simple input here for now if SearchInput is complex */}
          {/* Actually, let's just use the SearchInput component but we need to wire it up. 
              I'll update SearchInput to accept an onChange prop or similar. 
              For now, I'll wrap it or just use a simple input to demonstrate the flow if SearchInput is strictly UI.
              Wait, SearchInput has its own Input component. I should probably make SearchInput controlled.
          */}
          <div className="relative flex w-full items-center space-x-2">
            <input
              type="text"
              placeholder="Search for jobs (e.g. 'AI Consultant', 'Product Manager')..."
              className="flex h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="inline-flex h-12 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white ring-offset-background transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden lg:block">
          <FilterPanel />
        </aside>
        <main className="flex-1">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : (
            <ResultsList jobs={jobs} />
          )}
        </main>
      </div>
    </div>
  );
}
