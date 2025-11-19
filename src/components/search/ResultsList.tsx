import { Job, JobCard } from "@/components/search/JobCard";

interface ResultsListProps {
    jobs: Job[];
}

export function ResultsList({ jobs }: ResultsListProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {jobs.length} Results Found
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Sorted by: <span className="font-medium text-gray-900 dark:text-white">Relevance</span>
                </div>
            </div>
            <div className="grid gap-4">
                {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}
            </div>
        </div>
    );
}
