"use client";

import { useState, useEffect } from "react";
import { Job, JobCard } from "@/components/search/JobCard";
import { Button } from "@/components/ui/Button";

type JobStatus = "saved" | "applied" | "interviewing" | "rejected" | "offer";

interface SavedJob extends Job {
    savedAt: string;
    status: JobStatus;
    notes?: string;
}

export default function DashboardPage() {
    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
    const [activeTab, setActiveTab] = useState<"saved" | "applied">("saved");

    useEffect(() => {
        // Load saved jobs from localStorage
        const stored = localStorage.getItem("savedJobs");
        if (stored) {
            try {
                setSavedJobs(JSON.parse(stored));
            } catch (error) {
                console.error("Error loading saved jobs:", error);
            }
        }
    }, []);

    const filteredJobs = savedJobs.filter((job) => {
        if (activeTab === "saved") return job.status === "saved";
        return job.status !== "saved"; // Applied, interviewing, rejected, offer
    });

    const clearAll = () => {
        if (confirm("Are you sure you want to clear all saved jobs?")) {
            localStorage.removeItem("savedJobs");
            setSavedJobs([]);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Jobs</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Track your saved jobs and application progress
                </p>
            </div>

            <div className="mb-6 flex items-center justify-between">
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === "saved" ? "default" : "outline"}
                        onClick={() => setActiveTab("saved")}
                    >
                        Saved Jobs ({savedJobs.filter(j => j.status === "saved").length})
                    </Button>
                    <Button
                        variant={activeTab === "applied" ? "default" : "outline"}
                        onClick={() => setActiveTab("applied")}
                    >
                        Applied ({savedJobs.filter(j => j.status !== "saved").length})
                    </Button>
                </div>
                {savedJobs.length > 0 && (
                    <Button variant="outline" onClick={clearAll}>
                        Clear All
                    </Button>
                )}
            </div>

            {filteredJobs.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-gray-500 dark:text-gray-400">
                        {activeTab === "saved"
                            ? "No saved jobs yet. Start searching and save jobs you're interested in!"
                            : "No applications tracked yet. Mark jobs as applied to see them here."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredJobs.map((job) => (
                        <div key={job.id} className="relative">
                            <JobCard job={job} />
                            <div className="absolute right-6 top-6 flex gap-2">
                                {job.status !== "saved" && (
                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
