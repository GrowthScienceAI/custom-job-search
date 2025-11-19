"use server";

import { Job } from "@/components/search/JobCard";
import { mockJobs } from "@/lib/data/mockJobs";

export interface SearchFilters {
    category?: string[];
    location?: string[];
    experienceLevel?: string[];
}

export async function searchJobs(query: string, filters?: SearchFilters): Promise<Job[]> {
    // 1. Fetch from Remotive API
    let remotiveJobs: Job[] = [];
    try {
        const url = query
            ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`
            : `https://remotive.com/api/remote-jobs?limit=20`;

        const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
        if (res.ok) {
            const data = await res.json();
            if (data.jobs) {
                remotiveJobs = data.jobs.slice(0, 20).map((job: any) => ({
                    id: `remotive-${job.id}`,
                    title: job.title,
                    company: job.company_name,
                    location: job.candidate_required_location,
                    salary: job.salary || undefined,
                    postedDate: new Date(job.publication_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                    description: job.description ? job.description.replace(/<[^>]*>?/gm, '').slice(0, 300) + "..." : "No description available.",
                    sourceBoard: "Remotive",
                    tags: job.tags || [],
                    url: job.url
                }));
            }
        }
    } catch (error) {
        console.error("Error fetching from Remotive:", error);
    }

    // 2. Process Mock Jobs
    let localResults = [...mockJobs];
    if (query) {
        const lowerQuery = query.toLowerCase();
        localResults = localResults.filter(
            (job) =>
                job.title.toLowerCase().includes(lowerQuery) ||
                job.company.toLowerCase().includes(lowerQuery) ||
                job.description.toLowerCase().includes(lowerQuery) ||
                job.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
    }

    // 3. Combine Results
    let results = [...localResults, ...remotiveJobs];

    // 4. Apply Filters
    if (filters?.category && filters.category.length > 0) {
        results = results.filter((job) =>
            filters.category!.some((cat) =>
                job.tags.some(tag => tag.toLowerCase().includes(cat.toLowerCase())) ||
                job.title.toLowerCase().includes(cat.toLowerCase())
            )
        );
    }

    if (filters?.location && filters.location.length > 0) {
        results = results.filter((job) =>
            filters.location!.some((loc) => job.location.toLowerCase().includes(loc.toLowerCase()))
        );
    }

    // 5. Deduplicate
    results = deduplicateJobs(results);

    // 6. Rank
    results = rankJobs(results, query);

    return results;
}

export function deduplicateJobs(jobs: Job[]): Job[] {
    const seen = new Set<string>();
    return jobs.filter((job) => {
        const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

export function rankJobs(jobs: Job[], query: string): Job[] {
    if (!query) return jobs;

    const lowerQuery = query.toLowerCase();

    return jobs.sort((a, b) => {
        const scoreA = calculateScore(a, lowerQuery);
        const scoreB = calculateScore(b, lowerQuery);
        return scoreB - scoreA;
    });
}

function calculateScore(job: Job, query: string): number {
    let score = 0;
    if (job.title.toLowerCase().includes(query)) score += 10;
    if (job.company.toLowerCase().includes(query)) score += 5;
    if (job.description.toLowerCase().includes(query)) score += 2;
    // Boost mock jobs slightly to keep them visible as "featured" examples
    if (!job.id.startsWith('remotive-')) score += 1;
    return score;
}
