import React, { useState } from "react";
import Date from "../Date/Date";
import Data from "../Data/Data";
import "./HomePage.css";
import { Layout, theme, Select } from "antd"; // removed Button, Space
import { LogoutOutlined } from "@ant-design/icons";
import axios from "axios";

const { Header, Content, Footer } = Layout;

function HomePage({ token, status, handleSubscribe, setToken, setLoginStatus, setStatus }) {
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [activeLearningOption, setActiveLearningOption] = useState(""); // <-- new state
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  // Robust logout logic
  const handleLogout = async () => {
    await axios.post("https://40da073dfe40.ngrok-free.app/api/logout_mobile", {
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

  // Data fetching logic with token refresh
  const fetchFromBackend = async (dates) => {
    const username = localStorage.getItem("username");
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const { startDate, endDate } = dates;

    try {
      const response = await axios.post(
        "https://40da073dfe40.ngrok-free.app/api/active_learning_mobile",
        { startDate, endDate, option: activeLearningOption || undefined }, // include option
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
            "https://40da073dfe40.ngrok-free.app/api/check_reset_elgibility",
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

  const handleOptionChange = (val) => {
    setActiveLearningOption(val);
    // auto-apply when option changed
    fetchFromBackend(dateRange);
  };

  const handleClearOption = () => {
    setActiveLearningOption("");
    setData([]); // clear UI values (adjust if you prefer re-fetch)
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
          <div
            style={{
              paddingTop: 4,
              textAlign: "center",
              background: " #f5f6fa",
              borderRadius: borderRadiusLG,
            }}
          >
            <Date
              fetchFromBackend={fetchFromBackend}
              setDateRange={setDateRange}
            />
          </div>

          {/* responsive select controls placed below Date section */}
          <div className="select-controls">
            <Select
              value={activeLearningOption || undefined}
              onChange={handleOptionChange}
              placeholder="Active Learning"
              allowClear
              style={{ minWidth: 160, maxWidth: 300, width: "40%" }}
              options={[
                { label: "All", value: "all" },
                { label: "2", value: "2" },
                { label: "3", value: "3" },
              ]}
            />
          </div>

          <div
            style={{
              paddingTop: 1,
              textAlign: "center",
              background: " #f5f6fa",
              borderRadius: borderRadiusLG,
            }}
          >
            <Data data={data} onRefresh={() => fetchFromBackend(dateRange)} />
          </div>
        </Content>

        <Footer style={{ textAlign: "center" }} />
      </Layout>
    </Layout>
  );
}

export default HomePage;