import React, { useState } from "react";
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
  const [activeLearningOption, setActiveLearningOption] = useState("main"); // default selection
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  // Robust logout logic
  const handleLogout = async () => {
    await axios.post("https://7b2983718e7a.ngrok-free.app/api/logout_mobile", {
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
  // now accepts optional `option` and sends it to backend
  const fetchFromBackend = async (dates, option) => {
    const username = localStorage.getItem("username");
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const { startDate, endDate } = dates || dateRange;

    try {
      const response = await axios.post(
        "https://7b2983718e7a.ngrok-free.app/api/active_learning_mobile",
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
            "https://7b2983718e7a.ngrok-free.app/api/check_reset_elgibility",
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
              options={[
                { label: "Main ", value: "main" },
                { label: "Dept", value: "dept" },
                { label: "Common", value: "common" },
              ]}
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