import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import Date from "../Date/Date";
import Data from "../Data/Data";
import SelectControls from "../Select";
import { Layout, theme, Card } from "antd";
import axios from "axios";

const { Content } = Layout;

const UserProfile = ({ token }) => {
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [activeLearningOption, setActiveLearningOption] = useState(undefined);
  const [gateOptions, setGateOptions] = useState([]);

  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  const fetchFromBackend = async (dates, option) => {
    const { startDate, endDate } = dates || dateRange;

    // guard: don't call backend when dates are missing -> avoids 400
    if (!startDate || !endDate) {
      console.warn(
        "fetchFromBackend: missing startDate or endDate, skipping request"
      );
      return;
    }

    const username = localStorage.getItem("username");
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      console.log("Fetching data with:", {
        startDate,
        endDate,
        gate: option || activeLearningOption,
      });
      const response = await axios.post(
        "https://panchajanya.schmidvision.com/api/active_learning_mobile",
        { startDate, endDate, gate: option || activeLearningOption }, // send option
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        setData(response.data.dailyRecords || []);
      }
    } catch (error) {
      if (error.response && error.response.status === 403 && refreshToken) {
        try {
          const refreshResponse = await axios.post(
            "https://panchajanya.schmidvision.com/api/check_reset_elgibility",
            { username, refreshToken }
          );

          if (
            refreshResponse.status === 200 &&
            refreshResponse.data.accessToken
          ) {
            localStorage.setItem(
              "accessToken",
              refreshResponse.data.accessToken
            );
            return fetchFromBackend(dates); // Retry with new token
          } else {
            throw new Error(
              "Refresh token invalid or missing access token in response."
            );
          }
        } catch (refreshError) {
          alert("Session expired. Please login again.");
          setToken(null);
          setLoginStatus(false);
          setStatus("Enable Push Notifications");
          localStorage.removeItem("loginStatus");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("role");
          localStorage.removeItem("username");
        }
      } else {
        let message = "❌ An unexpected error occurred";
        if (error.response) {
          message = `🚫 Server Error: ${error.response.status}\n${
            error.response.data?.error || error.response.statusText
          }`;
        } else if (error.request) {
          message = "error: No response from the server.";
        } else {
          message = `⚠️ Error: ${error.message}`;
        }
        alert(message);
      }
    }
  };
  useEffect(() => {
    const fetchGateOptions = async () => {
      try {
        const resp = await axios.post(
          "https://panchajanya.schmidvision.com/api/gates",
          {}
        );
        if (resp.status === 200 && resp.data && resp.data.success) {
          let gatesRaw = resp.data.gates;
          if (
            gatesRaw &&
            !Array.isArray(gatesRaw) &&
            typeof gatesRaw === "object"
          ) {
            gatesRaw = Object.values(gatesRaw);
          }
          const gates = Array.isArray(gatesRaw) ? gatesRaw : [];
          const opts = gates.map((g) =>
            typeof g === "string"
              ? { label: g, value: g }
              : {
                  label: g.name || g.label || String(g.id ?? g.value),
                  value: g.id ?? g.value ?? g.name,
                }
          );
          setGateOptions(opts);
          if (!activeLearningOption && opts.length > 0) {
            setActiveLearningOption(opts[0].value);
          }
        }
      } catch (err) {
        console.error("❌ Error fetching gate options:", err);
        setGateOptions([]);
      }
    };
    fetchGateOptions();
  }, []);

  useEffect(() => {
    if (gateOptions.length === 0) return;

    if (!activeLearningOption && gateOptions.length > 0) {
      const firstVal = gateOptions[0].value;
      setActiveLearningOption(firstVal);

      if (dateRange?.startDate && dateRange?.endDate) {
        fetchFromBackend(dateRange, firstVal);
      }
    }
  }, [gateOptions]);

  useEffect(() => {
    if (activeLearningOption && dateRange?.startDate && dateRange?.endDate) {
      fetchFromBackend(dateRange, activeLearningOption);
    }
  }, [activeLearningOption, dateRange]);

  const handleSelectChange = (val) => {
    setActiveLearningOption(val);
    fetchFromBackend(dateRange, val);
  };

  return (
    <>
      <Card>
        <div
          style={{
            paddingTop: 4,
            textAlign: "center",
            borderRadius: borderRadiusLG,
          }}
        >
          <Date
            fetchFromBackend={fetchFromBackend}
            setDateRange={setDateRange}
          />
        </div>

        <div
          style={{
            paddingTop: 16,
            textAlign: "center",
            borderRadius: borderRadiusLG,
          }}
        >
          <SelectControls
            value={activeLearningOption}
            onChange={handleSelectChange}
            options={gateOptions}
            placeholder="Choose scope"
          />
        </div>

        <Data
          data={data}
          onRefresh={() => fetchFromBackend(dateRange, activeLearningOption)}
        />
      </Card>
    </>
  );
};

export default UserProfile;
