/**
 * DocumentsFilters Component
 * 
 * Provides filtering controls for the documents list
 */

import { Input } from "@/core/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Button } from "@/core/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { Calendar } from "@/core/components/ui/calendar";
import { Search, Calendar as CalendarIcon, X } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface DocumentFilters {
  search: string;
  doc_type: string;
  status: string;
  date_from?: string;
  date_to?: string;
}

interface DocumentsFiltersProps {
  filters: DocumentFilters;
  onFiltersChange: (filters: DocumentFilters) => void;
}

const DOC_TYPES = [
  { value: "all", label: "All Types" },
  { value: "policy", label: "Policy" },
  { value: "procedure", label: "Procedure" },
  { value: "guideline", label: "Guideline" },
  { value: "form", label: "Form" },
  { value: "report", label: "Report" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "archived", label: "Archived" },
];

export function DocumentsFilters({ filters, onFiltersChange }: DocumentsFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.date_from ? new Date(filters.date_from) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.date_to ? new Date(filters.date_to) : undefined
  );

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const handleDateRangeChange = (from?: Date, to?: Date) => {
    setDateFrom(from);
    setDateTo(to);
    onFiltersChange({
      ...filters,
      date_from: from ? format(from, "yyyy-MM-dd") : undefined,
      date_to: to ? format(to, "yyyy-MM-dd") : undefined,
    });
  };

  const clearDateRange = () => {
    handleDateRangeChange(undefined, undefined);
  };

  const setQuickDateRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    handleDateRangeChange(from, to);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-background">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Document Type Filter */}
      <Select
        value={filters.doc_type || "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, doc_type: value === "all" ? "" : value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          {DOC_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

        {/* Status Filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value === "all" ? "" : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <div className="p-4 border rounded-lg bg-background space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Date Range</label>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateRange}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickDateRange(7)}
            className="text-xs"
          >
            Last 7 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickDateRange(30)}
            className="text-xs"
          >
            Last 30 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickDateRange(90)}
            className="text-xs"
          >
            Last 90 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickDateRange(365)}
            className="text-xs"
          >
            Last Year
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* From Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(date) => handleDateRangeChange(date, dateTo)}
                disabled={(date) => dateTo ? date > dateTo : date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* To Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(date) => handleDateRangeChange(dateFrom, date)}
                disabled={(date) => 
                  dateFrom ? date < dateFrom || date > new Date() : date > new Date()
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {dateFrom && dateTo && (
          <p className="text-xs text-muted-foreground text-center">
            Showing documents from {format(dateFrom, "MMM dd, yyyy")} to {format(dateTo, "MMM dd, yyyy")}
          </p>
        )}
      </div>
    </div>
  );
}
