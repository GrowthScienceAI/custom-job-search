"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

interface FilterPanelProps {
    selectedCategories: string[];
    selectedLocations: string[];
    selectedLevels: string[];
    onCategoryChange: (category: string) => void;
    onLocationChange: (location: string) => void;
    onLevelChange: (level: string) => void;
    onReset: () => void;
}

export function FilterPanel({
    selectedCategories,
    selectedLocations,
    selectedLevels,
    onCategoryChange,
    onLocationChange,
    onLevelChange,
    onReset,
}: FilterPanelProps) {
    return (
        <div className="w-64 space-y-8">
            <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Job Category</h3>
                <div className="space-y-3">
                    {["AI Consulting/Research", "Product Management", "Digital Marketing", "General"].map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                                id={`category-${category}`}
                                checked={selectedCategories.includes(category)}
                                onCheckedChange={() => onCategoryChange(category)}
                            />
                            <Label htmlFor={`category-${category}`} className="cursor-pointer">{category}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Location</h3>
                <div className="space-y-3">
                    {["Remote", "Milwaukee", "National"].map((location) => (
                        <div key={location} className="flex items-center space-x-2">
                            <Checkbox
                                id={`location-${location}`}
                                checked={selectedLocations.includes(location)}
                                onCheckedChange={() => onLocationChange(location)}
                            />
                            <Label htmlFor={`location-${location}`} className="cursor-pointer">{location}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Experience Level</h3>
                <div className="space-y-3">
                    {["Entry Level", "Mid-Level", "Senior", "Executive"].map((level) => (
                        <div key={level} className="flex items-center space-x-2">
                            <Checkbox
                                id={`level-${level}`}
                                checked={selectedLevels.includes(level)}
                                onCheckedChange={() => onLevelChange(level)}
                            />
                            <Label htmlFor={`level-${level}`} className="cursor-pointer">{level}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={onReset}>
                Reset Filters
            </Button>
        </div>
    );
}
