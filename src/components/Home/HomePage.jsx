import React, { useState, useEffect } from "react";
import dayjs from "dayjs"; // <-- added
import Date from "../Date/Date";
import Data from "../Data/Data";
import SelectControls from "../Select";
import "./HomePage.css";
import { Layout, theme } from "antd"; // removed Button, Space
import { LogoutOutlined } from "@ant-design/icons";
import axios from "axios";

const { Header, Content, Footer } = Layout;

function HomePage({ token, status, handleSubscribe, setToken, setLoginStatus, setStatus }) {
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [activeLearningOption, setActiveLearningOption] = useState(undefined); // no default
  const [gateOptions, setGateOptions] = useState([]); // options fetched from backend
  const {
    token: { borderRadiusLG },
  } = theme.useToken();



  // Robust logout logic
  const handleLogout = async () => {
    await axios.post("https://backend.schmidvision.com/api/logout_mobile", {
      username: token,
    });
    setToken(null);
    setLoginStatus(false);
    setStatus("Enable Push Notifications");
    localStorage.removeItem("loginStatus");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
  };


  const fetchFromBackend = async (dates, option) => {
    const { startDate, endDate } = dates || dateRange;

    // guard: don't call backend when dates are missing -> avoids 400
    if (!startDate || !endDate) {
      console.warn("fetchFromBackend: missing startDate or endDate, skipping request");
      return;
    }

    const username = localStorage.getItem("username");
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      console.log("Fetching data with:", { startDate, endDate, gate: option || activeLearningOption });
      const response = await axios.post(
        "https://backend.schmidvision.com/api/active_learning_mobile",
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
            "https://backend.schmidvision.com/api/check_reset_elgibility",
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

  // fetch select options from backend (run on mount and when token changes)
  useEffect(() => {
    const fetchGateOptions = async () => {
      try {
        const resp = await axios.post("https://backend.schmidvision.com/api/gates", {});
        if (resp.status === 200 && resp.data && resp.data.success) {
          let gatesRaw = resp.data.gates;
          if (gatesRaw && !Array.isArray(gatesRaw) && typeof gatesRaw === "object") {
            gatesRaw = Object.values(gatesRaw);
          }
          const gates = Array.isArray(gatesRaw) ? gatesRaw : [];
          const opts = gates.map((g) =>
            typeof g === "string"
              ? { label: g, value: g }
              : { label: g.name || g.label || String(g.id ?? g.value), value: g.id ?? g.value ?? g.name }
          );
          setGateOptions(opts);

          // Set first gate if not already set
          if (!activeLearningOption && opts.length > 0) {
            setActiveLearningOption(opts[0].value);
          }
        } else {
          setGateOptions([]);
        }
      } catch (err) {
        setGateOptions([]);
      }
    };
    fetchGateOptions();
  
  }, [token]);


  useEffect(() => {
    if (gateOptions.length === 0) return;

    if ((!activeLearningOption || activeLearningOption === undefined) && gateOptions.length > 0) {
      const firstVal = gateOptions[0].value;
      setActiveLearningOption(firstVal);


      if (dateRange?.startDate && dateRange?.endDate) {
        fetchFromBackend(dateRange, firstVal);
      }
    }
  
  }, [gateOptions]);

  // When user picks date range (Date component updates dateRange), fetch if gate selected
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (
      activeLearningOption &&
      dateRange?.startDate &&
      dateRange?.endDate &&
      accessToken
    ) {
      fetchFromBackend(dateRange, activeLearningOption);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLearningOption, dateRange]);

  // handler called when SelectControls changes
  const handleSelectChange = (val) => {
    setActiveLearningOption(val);
    // send selected value + current dateRange to backend
    fetchFromBackend(dateRange, val);
  };

  return (
    <Layout hasSider>
      <Layout>
        <Header className="header">
          <div className="header-left">
            <img src="/user.png" alt="Avatar" className="header-logo" />
            <span className="header-title">My App</span>
          </div>
          <button className="logout-icon-btn" onClick={handleLogout}>
            <LogoutOutlined style={{ fontSize: "18px", color: "white" }} />
          </button>
        </Header>

        <Content style={{ marginTop: 64, overflow: "initial" }}>
          <div style={{ paddingTop: 4, textAlign: "center", background: " #f5f6fa", borderRadius: borderRadiusLG }}>
            <Date fetchFromBackend={fetchFromBackend} setDateRange={setDateRange} />
          </div>

          {/* pass value and handler so select sends option -> backend with dateRange */}
          <div style={{ paddingTop: 1, textAlign: "center", background: " #f5f6fa", borderRadius: borderRadiusLG }}>
            <SelectControls
              value={activeLearningOption}
              onChange={handleSelectChange}
              options={gateOptions} /* populated from backend */
              placeholder="Choose scope"
            />
          </div>

          <div style={{ paddingTop: 1, textAlign: "center", background: " #f5f6fa", borderRadius: borderRadiusLG }}>
            <Data data={data} onRefresh={() => fetchFromBackend(dateRange, activeLearningOption)} />
          </div>
        </Content>

        <Footer style={{ textAlign: "center" }} />
      </Layout>
    </Layout>
  );
}

export default HomePage;