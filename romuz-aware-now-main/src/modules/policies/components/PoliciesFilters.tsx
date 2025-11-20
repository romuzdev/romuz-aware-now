import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/core/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover";
import { Calendar } from "@/core/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface PolicyFilters {
  search: string;
  status: string;
  category: string;
  owner: string;
  lastReviewFrom: Date | null;
  lastReviewTo: Date | null;
  nextReviewFrom: Date | null;
  nextReviewTo: Date | null;
}

interface PoliciesFiltersProps {
  filters: PolicyFilters;
  onFiltersChange: (filters: PolicyFilters) => void;
  categories: string[];
  owners: string[];
}

export function PoliciesFilters({
  filters,
  onFiltersChange,
  categories,
  owners,
}: PoliciesFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof PolicyFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "",
      category: "",
      owner: "",
      lastReviewFrom: null,
      lastReviewTo: null,
      nextReviewFrom: null,
      nextReviewTo: null,
    });
    setShowAdvanced(false);
  };

  const activeFiltersCount = [
    filters.search,
    filters.status,
    filters.category,
    filters.owner,
    filters.lastReviewFrom,
    filters.lastReviewTo,
    filters.nextReviewFrom,
    filters.nextReviewTo,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in code or title..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status */}
        <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Category */}
        <Select value={filters.category} onValueChange={(v) => updateFilter("category", v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 px-1.5">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
          <p className="text-sm font-medium">Advanced Filters</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Owner */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Owner
              </label>
              <Select value={filters.owner} onValueChange={(v) => updateFilter("owner", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Last Review From */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Last Review From
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.lastReviewFrom && "text-muted-foreground"
                    )}
                  >
                    {filters.lastReviewFrom
                      ? format(filters.lastReviewFrom, "yyyy-MM-dd")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.lastReviewFrom || undefined}
                    onSelect={(date) => updateFilter("lastReviewFrom", date || null)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Last Review To */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Last Review To
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.lastReviewTo && "text-muted-foreground"
                    )}
                  >
                    {filters.lastReviewTo
                      ? format(filters.lastReviewTo, "yyyy-MM-dd")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.lastReviewTo || undefined}
                    onSelect={(date) => updateFilter("lastReviewTo", date || null)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Next Review From */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Next Review From
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.nextReviewFrom && "text-muted-foreground"
                    )}
                  >
                    {filters.nextReviewFrom
                      ? format(filters.nextReviewFrom, "yyyy-MM-dd")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.nextReviewFrom || undefined}
                    onSelect={(date) => updateFilter("nextReviewFrom", date || null)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Next Review To */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Next Review To
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.nextReviewTo && "text-muted-foreground"
                    )}
                  >
                    {filters.nextReviewTo
                      ? format(filters.nextReviewTo, "yyyy-MM-dd")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.nextReviewTo || undefined}
                    onSelect={(date) => updateFilter("nextReviewTo", date || null)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
