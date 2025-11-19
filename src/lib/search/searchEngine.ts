"use server";

import { Job } from "@/components/search/JobCard";

export interface SearchFilters {
    category?: string[];
    location?: string[];
    experienceLevel?: string[];
}

export async function searchJobs(query: string, filters?: SearchFilters): Promise<Job[]> {
    // Fetch from all APIs in parallel
    const [
        remotiveResults,
        jobicyResults,
        arbeitnowResults,
        museResults,
        adzunaResults,
        jsearchResults,
        joobleResults,
        himalayasResults
    ] = await Promise.allSettled([
        fetchRemotiveJobs(query),
        fetchJobicyJobs(query),
        fetchArbeitnowJobs(query),
        fetchMuseJobs(query),
        fetchAdzunaJobs(query),
        fetchJSearchJobs(query),
        fetchJoobleJobs(query),
        fetchHimalayasJobs(query)
    ]);

    const remotiveJobs = remotiveResults.status === 'fulfilled' ? remotiveResults.value : [];
    const jobicyJobs = jobicyResults.status === 'fulfilled' ? jobicyResults.value : [];
    const arbeitnowJobs = arbeitnowResults.status === 'fulfilled' ? arbeitnowResults.value : [];
    const museJobs = museResults.status === 'fulfilled' ? museResults.value : [];
    const adzunaJobs = adzunaResults.status === 'fulfilled' ? adzunaResults.value : [];
    const jsearchJobs = jsearchResults.status === 'fulfilled' ? jsearchResults.value : [];
    const joobleJobs = joobleResults.status === 'fulfilled' ? joobleResults.value : [];
    const himalayasJobs = himalayasResults.status === 'fulfilled' ? himalayasResults.value : [];

    // Combine Results (only real API jobs, no mock data)
    let results = [
        ...remotiveJobs,
        ...jobicyJobs,
        ...arbeitnowJobs,
        ...museJobs,
        ...adzunaJobs,
        ...jsearchJobs,
        ...joobleJobs,
        ...himalayasJobs
    ];

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

async function fetchArbeitnowJobs(query: string): Promise<Job[]> {
    try {
        const url = `https://www.arbeitnow.com/api/job-board-api`;

        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return [];

        const data = await res.json();
        if (!data.data) return [];

        let jobs = data.data.map((job: any) => ({
            id: `arbeitnow-${job.slug}`,
            title: job.title,
            company: job.company_name,
            location: job.location || "Remote",
            salary: undefined,
            postedDate: new Date(job.created_at * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            description: job.description ? job.description.replace(/<[^>]*>?/gm, '').slice(0, 300) + "..." : "No description available.",
            sourceBoard: "Arbeitnow",
            tags: [...(job.tags || []), ...(job.job_types || [])].filter(Boolean),
            url: job.url
        }));

        // Manual filtering since API doesn't support search
        if (query) {
            const lowerQuery = query.toLowerCase();
            jobs = jobs.filter((job: Job) =>
                job.title.toLowerCase().includes(lowerQuery) ||
                job.company.toLowerCase().includes(lowerQuery) ||
                job.description.toLowerCase().includes(lowerQuery) ||
                job.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
            );
        }

        return jobs.slice(0, 20);
    } catch (error) {
        console.error("Error fetching from Arbeitnow:", error);
        return [];
    }
}

async function fetchMuseJobs(query: string): Promise<Job[]> {
    try {
        const apiKey = process.env.THE_MUSE_API_KEY;
        if (!apiKey) {
            console.warn("The Muse API key not found. Skipping The Muse jobs.");
            return [];
        }

        const searchQuery = query || "remote";
        const url = `https://www.themuse.com/api/public/jobs?page=0&descending=true&api_key=${apiKey}&page=0`;

        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return [];

        const data = await res.json();
        if (!data.results) return [];

        let jobs = data.results.map((job: any) => ({
            id: `muse-${job.id}`,
            title: job.name,
            company: job.company?.name || "Unknown Company",
            location: job.locations?.[0]?.name || "Remote",
            salary: undefined,
            postedDate: new Date(job.publication_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            description: job.contents ? job.contents.slice(0, 300) + "..." : "No description available.",
            sourceBoard: "The Muse",
            tags: job.categories?.map((cat: any) => cat.name) || [],
            url: job.refs?.landing_page || `https://www.themuse.com/jobs/${job.id}`
        }));

        // Filter by query
        if (query) {
            const lowerQuery = query.toLowerCase();
            jobs = jobs.filter((job: Job) =>
                job.title.toLowerCase().includes(lowerQuery) ||
                job.company.toLowerCase().includes(lowerQuery) ||
                job.description.toLowerCase().includes(lowerQuery)
            );
        }

        return jobs.slice(0, 20);
    } catch (error) {
        console.error("Error fetching from The Muse:", error);
        return [];
    }
}

async function fetchAdzunaJobs(query: string): Promise<Job[]> {
    try {
        const appId = process.env.ADZUNA_APP_ID;
        const appKey = process.env.ADZUNA_APP_KEY;

        if (!appId || !appKey) {
            console.warn("Adzuna API credentials not found. Skipping Adzuna jobs.");
            return [];
        }

        const searchQuery = encodeURIComponent(query || "remote");
        const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=${searchQuery}`;

        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return [];

        const data = await res.json();
        if (!data.results) return [];

        return data.results.map((job: any) => ({
            id: `adzuna-${job.id}`,
            title: job.title,
            company: job.company?.display_name || "Unknown Company",
            location: job.location?.display_name || "Remote",
            salary: job.salary_min && job.salary_max
                ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max / 1000)}k`
                : undefined,
            postedDate: new Date(job.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            description: job.description ? job.description.slice(0, 300) + "..." : "No description available.",
            sourceBoard: "Adzuna",
            tags: job.category?.label ? [job.category.label] : [],
            url: job.redirect_url
        })).slice(0, 20);
    } catch (error) {
        console.error("Error fetching from Adzuna:", error);
        return [];
    }
}

async function fetchJSearchJobs(query: string): Promise<Job[]> {
    try {
        const rapidApiKey = process.env.RAPID_API_KEY;

        if (!rapidApiKey) {
            console.warn("RapidAPI key not found. Skipping JSearch jobs.");
            return [];
        }

        const searchQuery = encodeURIComponent(query || "remote");
        const url = `https://jsearch.p.rapidapi.com/search?query=${searchQuery}&page=1&num_pages=1`;

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            },
            next: { revalidate: 3600 }
        });

        if (!res.ok) return [];

        const data = await res.json();
        if (!data.data) return [];

        return data.data.slice(0, 20).map((job: any) => ({
            id: `jsearch-${job.job_id}`,
            title: job.job_title,
            company: job.employer_name || "Unknown Company",
            location: job.job_city && job.job_state
                ? `${job.job_city}, ${job.job_state}`
                : job.job_country || "Remote",
            salary: job.job_min_salary && job.job_max_salary
                ? `$${Math.round(job.job_min_salary / 1000)}k - $${Math.round(job.job_max_salary / 1000)}k`
                : undefined,
            postedDate: job.job_posted_at_datetime_utc
                ? new Date(job.job_posted_at_datetime_utc).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : "Recently",
            description: job.job_description
                ? job.job_description.replace(/<[^>]*>?/gm, '').slice(0, 300) + "..."
                : "No description available.",
            sourceBoard: `JSearch (${job.job_publisher || 'Multiple'})`,
            tags: job.job_employment_type ? [job.job_employment_type] : [],
            url: job.job_apply_link || job.job_google_link || "#"
        }));
    } catch (error) {
        console.error("Error fetching from JSearch:", error);
        return [];
    }
}

async function fetchJoobleJobs(query: string): Promise<Job[]> {
    try {
        const joobleKey = process.env.JOOBLE_API_KEY;

        if (!joobleKey) {
            console.warn("Jooble API key not found. Skipping Jooble jobs.");
            return [];
        }

        const url = `https://jooble.org/api/${joobleKey}`;
        const searchQuery = query || "remote";

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                keywords: searchQuery,
                location: ""
            }),
            next: { revalidate: 3600 }
        });

        if (!res.ok) return [];

        const data = await res.json();
        if (!data.jobs) return [];

        return data.jobs.slice(0, 20).map((job: any) => ({
            id: `jooble-${job.id || Math.random()}`,
            title: job.title,
            company: job.company || "Unknown Company",
            location: job.location || "Remote",
            salary: job.salary || undefined,
            postedDate: job.updated
                ? new Date(job.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : "Recently",
            description: job.snippet
                ? job.snippet.replace(/<[^>]*>?/gm, '').slice(0, 300) + "..."
                : "No description available.",
            sourceBoard: "Jooble",
            tags: job.type ? [job.type] : [],
            url: job.link || "#"
        }));
    } catch (error) {
        console.error("Error fetching from Jooble:", error);
        return [];
    }
}

async function fetchHimalayasJobs(query: string): Promise<Job[]> {
    try {
        // Himalayas API is free without a key
        const url = `https://himalayas.app/jobs/api`;

        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return [];

        const data = await res.json();
        if (!data) return [];

        let jobs = Array.isArray(data) ? data : (data.jobs || []);

        // Filter by query if provided
        if (query) {
            const lowerQuery = query.toLowerCase();
            jobs = jobs.filter((job: any) =>
                job.title?.toLowerCase().includes(lowerQuery) ||
                job.company?.toLowerCase().includes(lowerQuery) ||
                job.description?.toLowerCase().includes(lowerQuery)
            );
        }

        return jobs.slice(0, 20).map((job: any) => ({
            id: `himalayas-${job.id || job.slug}`,
            title: job.title,
            company: job.company || "Unknown Company",
            location: job.location || "Remote",
            salary: job.salary_min && job.salary_max
                ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max / 1000)}k`
                : undefined,
            postedDate: job.published_at
                ? new Date(job.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : "Recently",
            description: job.description
                ? job.description.slice(0, 300) + "..."
                : "No description available.",
            sourceBoard: "Himalayas",
            tags: job.tags || [],
            url: job.url || `https://himalayas.app/jobs/${job.slug}`
        }));
    } catch (error) {
        console.error("Error fetching from Himalayas:", error);
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
    if (!query) {
        // Sort by date when no query
        return jobs.sort((a, b) => {
            const dateA = new Date(a.postedDate).getTime();
            const dateB = new Date(b.postedDate).getTime();
            return dateB - dateA; // Newest first
        });
    }

    const lowerQuery = query.toLowerCase();

    return jobs.sort((a, b) => {
        const scoreA = calculateEnhancedScore(a, lowerQuery);
        const scoreB = calculateEnhancedScore(b, lowerQuery);
        return scoreB - scoreA;
    });
}

function calculateEnhancedScore(job: Job, query: string): number {
    // Multi-factor scoring based on PRD:
    // - Keyword Match (40%)
    // - Board Specialty (20%)
    // - Freshness (20%)
    // - Source Quality (10%)
    // - Engagement Signals (10%) - placeholder for now

    const keywordScore = calculateKeywordScore(job, query);
    const boardSpecialtyScore = calculateBoardSpecialtyScore(job, query);
    const freshnessScore = calculateFreshnessScore(job.postedDate);
    const sourceQualityScore = calculateSourceQualityScore(job.sourceBoard);
    const engagementScore = 50; // Neutral score for now (future: user behavior)

    const finalScore = (
        (0.40 * keywordScore) +
        (0.20 * boardSpecialtyScore) +
        (0.20 * freshnessScore) +
        (0.10 * sourceQualityScore) +
        (0.10 * engagementScore)
    );

    return finalScore;
}

function calculateKeywordScore(job: Job, query: string): number {
    let score = 0;

    // Title match (weighted 3x more than description)
    if (job.title.toLowerCase().includes(query)) {
        score += 60; // Title is most important
    }

    // Company match
    if (job.company.toLowerCase().includes(query)) {
        score += 10;
    }

    // Description match
    if (job.description.toLowerCase().includes(query)) {
        score += 20;
    }

    // Tags/skills match
    const matchingTags = job.tags.filter(tag =>
        tag.toLowerCase().includes(query) || query.includes(tag.toLowerCase())
    ).length;
    score += Math.min(matchingTags * 5, 10); // Cap at 10 points for tag matches

    return Math.min(score, 100); // Cap at 100
}

function calculateBoardSpecialtyScore(job: Job, query: string): number {
    // Categorize boards by specialty
    const aiBoards = ['Remotive', 'Himalayas'];
    const pmBoards = ['The Muse'];
    const marketingBoards = ['Jobicy'];
    const generalBoards = ['Adzuna', 'Arbeitnow', 'Jooble'];
    // JSearch is multi-source (LinkedIn, Indeed, Glassdoor, etc.)
    const multiSourceBoards = /JSearch/i;

    const isAIQuery = /ai|machine learning|ml|data science|artificial intelligence/i.test(query);
    const isPMQuery = /product manager|pm|product|scrum|agile/i.test(query);
    const isMarketingQuery = /marketing|seo|growth|content/i.test(query);

    // Check if it's a multi-source board (JSearch)
    if (multiSourceBoards.test(job.sourceBoard)) {
        return 90; // High score for aggregator that includes LinkedIn/Indeed
    }

    if (isAIQuery && aiBoards.includes(job.sourceBoard)) {
        return 100;
    }
    if (isPMQuery && pmBoards.includes(job.sourceBoard)) {
        return 100;
    }
    if (isMarketingQuery && marketingBoards.includes(job.sourceBoard)) {
        return 100;
    }
    if (generalBoards.includes(job.sourceBoard)) {
        return 40; // Lower score for general boards
    }

    return 70; // Secondary category match
}

function calculateFreshnessScore(postedDate: string): number {
    // Exponential decay: 100 * e^(-0.05 * days_old)
    try {
        const posted = new Date(postedDate);
        const now = new Date();
        const daysOld = Math.max(0, Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24)));

        const score = 100 * Math.exp(-0.05 * daysOld);
        return Math.max(5, Math.min(100, score)); // Clamp between 5-100
    } catch {
        return 50; // Default if date parsing fails
    }
}

function calculateSourceQualityScore(sourceBoard: string): number {
    // Tier 1: Multi-source aggregators (LinkedIn, Indeed, Glassdoor, ZipRecruiter)
    if (/JSearch/i.test(sourceBoard)) return 100;

    // Tier 2: Specialized, curated boards
    const tier2 = ['Remotive', 'The Muse', 'Himalayas'];
    if (tier2.includes(sourceBoard)) return 95;

    // Tier 3: Well-established specialty boards
    const tier3 = ['Jobicy', 'Arbeitnow', 'Jooble'];
    if (tier3.includes(sourceBoard)) return 85;

    // Tier 4: API-integrated platforms
    const tier4 = ['Adzuna'];
    if (tier4.includes(sourceBoard)) return 75;

    // Default
    return 60;
}
