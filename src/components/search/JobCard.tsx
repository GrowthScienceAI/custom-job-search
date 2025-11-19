"use client";

import { useState, useEffect } from "react";
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
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        // Check if job is already saved
        const saved = localStorage.getItem("savedJobs");
        if (saved) {
            try {
                const savedJobs = JSON.parse(saved);
                setIsSaved(savedJobs.some((saved: any) => saved.id === job.id));
            } catch (error) {
                console.error("Error checking saved jobs:", error);
            }
        }
    }, [job.id]);

    const toggleSave = () => {
        const saved = localStorage.getItem("savedJobs");
        let savedJobs = saved ? JSON.parse(saved) : [];

        if (isSaved) {
            // Remove from saved
            savedJobs = savedJobs.filter((saved: any) => saved.id !== job.id);
        } else {
            // Add to saved
            savedJobs.push({
                ...job,
                savedAt: new Date().toISOString(),
                status: "saved",
            });
        }

        localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
        setIsSaved(!isSaved);
    };

    // Validate URL and provide fallback
    const getJobUrl = () => {
        if (!job.url) return "#";

        try {
            // Check if URL is valid
            new URL(job.url);
            return job.url;
        } catch {
            // If invalid, fallback to job board homepage
            const boardUrls: Record<string, string> = {
                "Remotive": "https://remotive.com",
                "Jobicy": "https://jobicy.com",
                "Arbeitnow": "https://www.arbeitnow.com",
                "The Muse": "https://www.themuse.com/jobs",
                "Adzuna": "https://www.adzuna.com/jobs",
                "Mock Jobs": "#",
            };
            return boardUrls[job.sourceBoard] || "#";
        }
    };

    const jobUrl = getJobUrl();
    const isValidUrl = jobUrl !== "#";

    return (
        <div className="group relative flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        {job.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-700">{job.company}</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className={isSaved ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"}
                    onClick={toggleSave}
                >
                    <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
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
                {isValidUrl ? (
                    <Button size="sm" className="gap-2" asChild>
                        <a href={jobUrl} target="_blank" rel="noopener noreferrer">
                            View on {job.sourceBoard} <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                ) : (
                    <Button size="sm" variant="outline" disabled className="gap-2">
                        URL Not Available
                    </Button>
                )}
            </div>
        </div>
    );
}
