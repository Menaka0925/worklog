import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { RecordEntry } from '../../types/record';
import type { FollowUpItem } from '../../types/followup';
import {
  getTodayDateString,
  formatDateParts,
  createDateString,
  MONTHS_ABBR,
} from '../../utils/dateUtils';

interface CalendarGridProps {
  entries: RecordEntry[];
  followUps?: FollowUpItem[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  entries,
  followUps = [],
  selectedDate,
  onSelectDate,
}) => {
  const todayStr = getTodayDateString();
  const dateParts = useMemo(() => formatDateParts(selectedDate), [selectedDate]);

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isMonthPickerOpen &&
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(target)
      ) {
        setIsMonthPickerOpen(false);
      }
      if (
        isYearPickerOpen &&
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(target)
      ) {
        setIsYearPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMonthPickerOpen, isYearPickerOpen]);

  // Year options: 2024 to 2050 inclusive
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = 2024; y <= 2050; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // Map total activities and follow-ups count by date: { 'YYYY-MM-DD': number }
  const entryCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) {
      map[e.activity_date] = (map[e.activity_date] || 0) + 1;
    }
    for (const f of followUps) {
      if (f.due_date) {
        map[f.due_date] = (map[f.due_date] || 0) + 1;
      }
    }
    return map;
  }, [entries, followUps]);

  // Navigation handlers
  const handlePrevMonth = () => {
    let newYear = dateParts.year;
    let newMonth = dateParts.monthIndex - 1;
    if (newMonth < 0) {
      newMonth = 11;
      newYear = Math.max(2024, newYear - 1);
    }
    const newDate = createDateString(newYear, newMonth, dateParts.dayNumber);
    onSelectDate(newDate);
  };

  const handleNextMonth = () => {
    let newYear = dateParts.year;
    let newMonth = dateParts.monthIndex + 1;
    if (newMonth > 11) {
      newMonth = 0;
      newYear = Math.min(2050, newYear + 1);
    }
    const newDate = createDateString(newYear, newMonth, dateParts.dayNumber);
    onSelectDate(newDate);
  };

  const handleSelectMonth = (monthIdx: number) => {
    const newDate = createDateString(dateParts.year, monthIdx, dateParts.dayNumber);
    onSelectDate(newDate);
    setIsMonthPickerOpen(false);
  };

  const handleSelectYear = (year: number) => {
    const newDate = createDateString(year, dateParts.monthIndex, dateParts.dayNumber);
    onSelectDate(newDate);
    setIsYearPickerOpen(false);
  };

  const handleGoToToday = () => {
    onSelectDate(todayStr);
    setIsMonthPickerOpen(false);
    setIsYearPickerOpen(false);
  };

  // Calendar cells for current month
  const firstDayOfWeek = new Date(dateParts.year, dateParts.monthIndex, 1).getDay(); // 0 = Sun
  const daysInCurrentMonth = new Date(dateParts.year, dateParts.monthIndex + 1, 0).getDate();

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarCells: (string | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    calendarCells.push(createDateString(dateParts.year, dateParts.monthIndex, d));
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E9E3] p-4 sm:p-5 shadow-2xs">
      {/* Month & Year Navigation Bar: < 02 Nov 2026 > */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E9E3]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Previous Month Arrow */}
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-[#E5E9E3] text-[#252B27] hover:bg-[#E8F0E8] hover:text-[#244735] transition-colors cursor-pointer"
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Date Display with Clickable Month and Year Selectors */}
          <div className="relative flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F7F9F5] border border-[#E5E9E3] text-xs sm:text-sm font-bold text-[#252B27]">
            <span>{dateParts.day}</span>

            {/* Clickable Month Abbr */}
            <div className="relative" ref={monthDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsMonthPickerOpen(!isMonthPickerOpen);
                  setIsYearPickerOpen(false);
                }}
                className="px-1 py-0.5 rounded hover:bg-[#E8F0E8] hover:text-[#244735] cursor-pointer transition-colors"
                title="Select month"
              >
                {dateParts.monthAbbr}
              </button>

              {/* Month Selector Popover */}
              {isMonthPickerOpen && (
                <div className="absolute left-0 mt-2 z-40 w-56 bg-white rounded-xl border border-[#E5E9E3] shadow-lg p-3 text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#737C74] mb-2">
                    Select Month
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTHS_ABBR.map((abbr, idx) => {
                      const isSelected = idx === dateParts.monthIndex;
                      return (
                        <button
                          key={abbr}
                          type="button"
                          onClick={() => handleSelectMonth(idx)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#244735] text-white'
                              : 'text-[#252B27] hover:bg-[#E8F0E8] hover:text-[#244735]'
                          }`}
                        >
                          {abbr}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-2 mt-2 border-t border-[#E5E9E3] flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={handleGoToToday}
                      className="text-[#315C46] font-semibold hover:underline cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMonthPickerOpen(false)}
                      className="text-[#737C74] hover:text-[#252B27] cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clickable Year */}
            <div className="relative" ref={yearDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsYearPickerOpen(!isYearPickerOpen);
                  setIsMonthPickerOpen(false);
                }}
                className="px-1 py-0.5 rounded hover:bg-[#E8F0E8] hover:text-[#244735] cursor-pointer transition-colors"
                title="Select year (2024 - 2050)"
              >
                {dateParts.year}
              </button>

              {/* Year Selector Popover */}
              {isYearPickerOpen && (
                <div className="absolute left-0 mt-2 z-40 w-56 bg-white rounded-xl border border-[#E5E9E3] shadow-lg p-3 text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#737C74] mb-2">
                    Select Year (2024–2050)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto pr-1">
                    {yearOptions.map((y) => {
                      const isSelected = y === dateParts.year;
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => handleSelectYear(y)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#244735] text-white'
                              : 'text-[#252B27] hover:bg-[#E8F0E8] hover:text-[#244735]'
                          }`}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-2 mt-2 border-t border-[#E5E9E3] flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={handleGoToToday}
                      className="text-[#315C46] font-semibold hover:underline cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsYearPickerOpen(false)}
                      className="text-[#737C74] hover:text-[#252B27] cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Month Arrow */}
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-[#E5E9E3] text-[#252B27] hover:bg-[#E8F0E8] hover:text-[#244735] transition-colors cursor-pointer"
            title="Next month"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Indicator */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-[#737C74]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F5F3E9] border border-[#E5E9E3]" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#244735]" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#315C46]" />
            <span>Has Records</span>
          </div>
        </div>
      </div>

      {/* Week Day Column Labels */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mt-3 text-center">
        {weekDays.map((wd) => (
          <div
            key={wd}
            className="text-[11px] font-semibold text-[#737C74] py-1 uppercase tracking-wider"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Grid Date Cells */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mt-1">
        {calendarCells.map((dateStr, idx) => {
          if (!dateStr) {
            return (
              <div
                key={`empty-${idx}`}
                className="h-14 sm:h-16 md:h-18 rounded-lg bg-[#F7F9F5]/40 border border-transparent"
              />
            );
          }

          const cellDayNumber = parseInt(dateStr.split('-')[2], 10);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const count = entryCountMap[dateStr] || 0;

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`h-14 sm:h-16 md:h-18 rounded-lg border p-1.5 flex flex-col justify-between transition-all cursor-pointer select-none text-left ${
                isSelected
                  ? 'bg-[#244735] text-white border-[#244735] shadow-xs'
                  : isToday
                  ? 'bg-[#F5F3E9] text-[#252B27] border-[#E5E9E3] hover:border-[#477A61]'
                  : 'bg-white hover:bg-[#F7F9F5] border-[#E5E9E3] hover:border-[#477A61] text-[#252B27]'
              }`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold leading-none ${
                    isSelected ? 'text-white' : isToday ? 'text-[#244735]' : 'text-[#252B27]'
                  }`}
                >
                  {cellDayNumber}
                </span>

                {/* Multiple Records Pill Indicator */}
                {count > 1 && (
                  <span
                    className={`text-[10px] font-semibold px-1 py-0.2 rounded leading-tight ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#E8F0E8] text-[#244735] border border-[#C9DBCC]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>

              {/* Record Dot Indicator */}
              <div className="flex items-center justify-end">
                {count === 1 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-[#315C46]'
                    }`}
                    title="1 recorded activity"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
