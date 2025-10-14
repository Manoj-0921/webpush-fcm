import React, { useState, useEffect } from "react";
import { Card, DatePicker } from "antd";
import dayjs from "dayjs";
import "./Date.css";

const Date = ({ fetchFromBackend, setDateRange }) => {
  const [startDate, setStartDate] = useState(dayjs().startOf("day"));
  const [endDate, setEndDate] = useState(dayjs().endOf("day"));
  const [activeTab, setActiveTab] = useState("today");

  const handleShortcutClick = (type) => {
    setActiveTab(type);
    const today = dayjs();
    if (type === "today") {
      setStartDate(today.startOf("day"));
      setEndDate(today.endOf("day"));
    } else if (type === "week") {
      setStartDate(today.subtract(6, "day").startOf("day"));
      setEndDate(today.endOf("day"));
    } else if (type === "month") {
      setStartDate(today.subtract(29, "day").startOf("day"));
      setEndDate(today.endOf("day"));
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      const range = {
        startDate: startDate.format("YYYY-MM-DD HH:mm:ss"),
        endDate: endDate.format("YYYY-MM-DD HH:mm:ss"),
      };
      setDateRange(range); // only update parent's date range — DO NOT call fetchFromBackend here
    }
  }, [startDate, endDate, setDateRange]);

  return (
    <div className="date-selector-container1">
      {/* Shortcut Tabs Card */}
      <div className="custom-card shortcut-tabs-card">
        <div className="shortcut-tabs">
          <button
            className={`shortcut-tab${activeTab === "today" ? " active" : ""}`}
            onClick={() => handleShortcutClick("today")}
          >
            Today
          </button>
          <button
            className={`shortcut-tab${activeTab === "week" ? " active" : ""}`}
            onClick={() => handleShortcutClick("week")}
          >
            Week
          </button>
          <button
            className={`shortcut-tab${activeTab === "month" ? " active" : ""}`}
            onClick={() => handleShortcutClick("month")}
          >
            Month
          </button>
        </div>
      </div>

      {/* Date Pickers Card */}
      <div className="custom-card date-pickers-card">
        <div className="date-row">
          <div className="date-column">
            <label className="date-label">Start Date</label>
            <DatePicker
              className="range-picker"
              value={startDate}
              onChange={setStartDate}
            />
          </div>
          <div className="date-column">
            <label className="date-label">End Date</label>
            <DatePicker
              className="range-picker"
              value={endDate}
              onChange={setEndDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Date;
