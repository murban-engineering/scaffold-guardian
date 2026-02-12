import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const DashboardCalendar = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  // Monday = 0 ... Sunday = 6
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="min-w-[220px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-white/50">{year}</span>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="rounded p-0.5 hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={nextMonth} className="rounded p-0.5 hover:bg-white/10">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {DAYS.map((d) => (
          <span key={d} className="font-medium text-white/40">
            {d}
          </span>
        ))}
        {cells.map((d, i) => (
          <span
            key={i}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
              d === null
                ? ""
                : isToday(d)
                  ? "bg-primary font-bold text-white"
                  : "text-white/80 hover:bg-white/10"
            }`}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DashboardCalendar;
