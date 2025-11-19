"use server";

import { Job } from "@/components/search/JobCard";
import { mockJobs } from "@/lib/data/mockJobs";

export interface SearchFilters {
    category?: string[];
    location?: string[];
    experienceLevel?: string[];
}

export async function searchJobs(query: string, filters?: SearchFilters): Promise<Job[]> {
    // Fetch from APIs in parallel
    const [remotiveResults, jobicyResults] = await Promise.allSettled([
        fetchRemotiveJobs(query),
        fetchJobicyJobs(query)
    ]);

    const remotiveJobs = remotiveResults.status === 'fulfilled' ? remotiveResults.value : [];
    const jobicyJobs = jobicyResults.status === 'fulfilled' ? jobicyResults.value : [];

    // Process Mock Jobs
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

    // Combine Results
    let results = [...localResults, ...remotiveJobs, ...jobicyJobs];

    // Apply Filters
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

    // Deduplicate
    results = deduplicateJobs(results);

    // Rank
    results = rankJobs(results, query);

    return results;
}

async function fetchRemotiveJobs(query: string): Promise<Job[]> {
    try {
        const url = query
            ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`
            : `https://remotive.com/api/remote-jobs?limit=20`;

        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return [];

        const data = await res.json();
        if (!data.jobs) return [];

        return data.jobs.slice(0, 20).map((job: any) => ({
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
    } catch (error) {
        console.error("Error fetching from Remotive:", error);
        return [];
    }
}

async function fetchJobicyJobs(query: string): Promise<Job[]> {
    try {
        // Jobicy doesn't support direct text search well, so we fetch recent jobs and filter manually if needed
        // or use their tag search if the query matches a known tag.
        // For simplicity and robustness, we'll fetch the latest 50 jobs.
        const url = `https://jobicy.com/api/v2/remote-jobs?count=50`;

        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return [];

        const data = await res.json();
        if (!data.jobs) return [];

        let jobs = data.jobs.map((job: any) => ({
            id: `jobicy-${job.id}`,
            title: job.jobTitle,
            company: job.companyName,
            location: job.jobGeo || "Remote",
            salary: job.jobType ? job.jobType[0] : undefined, // Jobicy puts type (Full-time) here usually
            postedDate: new Date(job.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            description: job.jobDescription ? job.jobDescription.replace(/<[^>]*>?/gm, '').slice(0, 300) + "..." : "No description available.",
            sourceBoard: "Jobicy",
            tags: [...(job.jobIndustry || []), ...(job.jobType || []), job.jobLevel].filter(Boolean),
            url: job.url
        }));

        // Manual filtering for Jobicy since API doesn't support broad text search
        if (query) {
            const lowerQuery = query.toLowerCase();
            jobs = jobs.filter((job: Job) =>
                job.title.toLowerCase().includes(lowerQuery) ||
                job.company.toLowerCase().includes(lowerQuery) ||
                job.description.toLowerCase().includes(lowerQuery)
            );
        }

        return jobs;
    } catch (error) {
        console.error("Error fetching from Jobicy:", error);
        return [];
    }
}

function deduplicateJobs(jobs: Job[]): Job[] {
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

function rankJobs(jobs: Job[], query: string): Job[] {
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
