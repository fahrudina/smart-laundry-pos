import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const presetRanges = [
    {
      label: 'Today',
      range: {
        from: new Date(),
        to: new Date()
      }
    },
    {
      label: 'Yesterday',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 1)),
        to: new Date(new Date().setDate(new Date().getDate() - 1))
      }
    },
    {
      label: 'Last 7 days',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date()
      }
    },
    {
      label: 'Last 30 days',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date()
      }
    },
    {
      label: 'This month',
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
      }
    },
    {
      label: 'Last month',
      range: (() => {
        const today = new Date();
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          from: firstDayLastMonth,
          to: lastDayLastMonth
        };
      })()
    }
  ];

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    onDateRangeChange(preset.range);
    setIsOpen(false);
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  <div className="border-r p-3">
                    <div className="text-sm font-medium mb-2">Quick Select</div>
                    <div className="space-y-1">
                      {presetRanges.map((preset, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-8"
                          onClick={() => handlePresetClick(preset)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          onDateRangeChange({ from: range.from, to: range.to });
                          setIsOpen(false);
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Reset button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateRangeChange({
              from: new Date(new Date().setDate(new Date().getDate() - 7)),
              to: new Date()
            })}
          >
            Reset to Last 7 Days
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};