"use client";

import * as React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
}

export function DatePicker({ date, setDate }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "d MMMM yyyy", { locale: tr })
          ) : (
            <span>Tarih seçin</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            if (selectedDate) {
              // Seçilen tarihi yerel saat dilimine göre ayarla
              const localDate = new Date(selectedDate);
              localDate.setHours(12, 0, 0, 0);
              const offset = localDate.getTimezoneOffset();
              localDate.setMinutes(localDate.getMinutes() + offset);
              setDate(localDate);
            } else {
              setDate(undefined);
            }
          }}
          initialFocus
          locale={tr}
        />
      </PopoverContent>
    </Popover>
  );
} 