import { Job } from "@/components/search/JobCard";
import { mockJobs } from "@/lib/data/mockJobs";

export interface SearchFilters {
    category?: string[];
    location?: string[];
    experienceLevel?: string[];
}

export async function searchJobs(query: string, filters?: SearchFilters): Promise<Job[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    let results = [...mockJobs];

    // Filter by query
    if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(
            (job) =>
                job.title.toLowerCase().includes(lowerQuery) ||
                job.company.toLowerCase().includes(lowerQuery) ||
                job.description.toLowerCase().includes(lowerQuery) ||
                job.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
    }

    // Filter by category (mock implementation)
    if (filters?.category && filters.category.length > 0) {
        // In a real app, we would check against job.category
        // For now, we'll check if any tag matches the category
        results = results.filter((job) =>
            filters.category!.some((cat) => job.tags.includes(cat))
        );
    }

    // Filter by location
    if (filters?.location && filters.location.length > 0) {
        results = results.filter((job) =>
            filters.location!.some((loc) => job.location.includes(loc))
        );
    }

    // Deduplicate
    results = deduplicateJobs(results);

    // Rank
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
    return score;
}
