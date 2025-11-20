import { useState } from "react";
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ReactDatePicker() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  return (
    <div>
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat={"MM/DD/YYYY"}
      />
    </div>
  );
}
