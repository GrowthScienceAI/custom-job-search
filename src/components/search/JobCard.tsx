import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Heart, ExternalLink } from "lucide-react";

export interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    postedDate: string;
    description: string;
    sourceBoard: string;
    tags: string[];
    url: string;
}

interface JobCardProps {
    job: Job;
}

export function JobCard({ job }: JobCardProps) {
    return (
        <div className="group relative flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        {job.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-700">{job.company}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                    <Heart className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{job.location}</Badge>
                {job.salary && <Badge variant="secondary">{job.salary}</Badge>}
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                    {job.sourceBoard}
                </Badge>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>

            <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-500">{job.postedDate}</span>
                <Button size="sm" className="gap-2" asChild>
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                        Apply Now <ExternalLink className="h-4 w-4" />
                    </a>
                </Button>
            </div>
        </div>
    );
}
