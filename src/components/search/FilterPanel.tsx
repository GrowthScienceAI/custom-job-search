"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

export function FilterPanel() {
    return (
        <div className="w-64 space-y-8">
            <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Job Category</h3>
                <div className="space-y-3">
                    {["AI Consulting/Research", "Product Management", "Digital Marketing", "General"].map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                            <Checkbox id={`category-${category}`} />
                            <Label htmlFor={`category-${category}`}>{category}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Location</h3>
                <div className="space-y-3">
                    {["Remote", "Milwaukee", "National"].map((location) => (
                        <div key={location} className="flex items-center space-x-2">
                            <Checkbox id={`location-${location}`} />
                            <Label htmlFor={`location-${location}`}>{location}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Experience Level</h3>
                <div className="space-y-3">
                    {["Entry Level", "Mid-Level", "Senior", "Executive"].map((level) => (
                        <div key={level} className="flex items-center space-x-2">
                            <Checkbox id={`level-${level}`} />
                            <Label htmlFor={`level-${level}`}>{level}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <Button variant="outline" className="w-full">
                Reset Filters
            </Button>
        </div>
    );
}
