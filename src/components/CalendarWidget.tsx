'use client';

import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type CalendarEvent = {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  title: string;
  subtitle?: string;
  colorClass?: string; // e.g., 'bg-emerald-500 text-white'
  rpe?: number;
};

interface CalendarWidgetProps {
  events: CalendarEvent[];
  onDayClick?: (dateString: string) => void;
  selectedDate?: string;
}

export default function CalendarWidget({ events, onDayClick, selectedDate }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // weekStartsOn: 1 means Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950">
        <h2 className="text-xl font-bold text-white capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 border-b border-neutral-800 bg-neutral-900/50">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day, i) => {
          const dayEvents = events.filter(e => {
            const eventDate = parseISO(e.date);
            return isSameDay(eventDate, day);
          });

          return (
            <div 
              key={day.toString() + i} 
              onClick={() => onDayClick && onDayClick(format(day, 'yyyy-MM-dd'))}
              className={`min-h-[100px] sm:min-h-[120px] p-2 border-b border-r border-neutral-800/50 transition-all cursor-pointer ${
                !isSameMonth(day, monthStart) ? 'bg-neutral-950/40 text-neutral-600' : 'bg-neutral-900 text-neutral-300'
              } hover:bg-neutral-800/60 ${selectedDate === format(day, 'yyyy-MM-dd') ? 'ring-2 ring-inset ring-blue-500 bg-blue-900/10' : ''}`}
            >
              <div className="flex justify-end">
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isSameDay(day, new Date()) ? 'bg-emerald-500 text-white' : ''
                }`}>
                  {format(day, dateFormat)}
                </span>
              </div>
              
              <div className="mt-2 flex flex-col gap-1 overflow-y-auto max-h-[70px] sm:max-h-[90px] scrollbar-hide [&::-webkit-scrollbar]:hidden">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    className={`px-1 sm:px-2 py-1 text-[10px] sm:text-xs rounded-md ${event.colorClass || 'bg-blue-500/20 text-blue-400 border border-blue-500/20'} w-full overflow-hidden flex flex-col gap-0.5`}
                    title={event.title + (event.subtitle ? ` - ${event.subtitle}` : '') + (event.rpe ? ` - RPE: ${event.rpe}/10` : '')}
                  >
                    <span className="font-bold block truncate w-full">{event.title}</span>
                    {event.subtitle && <span className="text-[9px] sm:text-[10px] opacity-90 block truncate w-full">{event.subtitle}</span>}
                    {event.rpe && (
                      <span className="text-[9px] sm:text-[10px] font-bold px-1 py-0.5 bg-black/30 rounded w-fit truncate max-w-full">
                        RPE: {event.rpe}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
