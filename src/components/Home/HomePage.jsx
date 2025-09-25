import React, { useState } from "react";
import Date from "../Date/Date";
import Data from "../Data/Data";
import "./HomePage.css";
import { Layout, theme } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import axios from "axios";

const { Header, Content, Footer } = Layout;

function HomePage({ token, status, handleSubscribe, setToken, setLoginStatus, setStatus }) {
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  // Robust logout logic
  const handleLogout = async () => {
    await axios.post("https://587dbd329342.ngrok-free.app/logout", {
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
        "https://2631998197dd.ngrok-free.app/api/active_learning_mobile",
        { startDate, endDate },
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
            "https://2631998197dd.ngrok-free.app/api/check_reset_elgibility",
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
          {/* <div className="flex justify-center mt-4">
            <button
              onClick={() => handleSubscribe(token)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {status}
              <span className="text-xs text-gray-200 ml-2">(Push Notifications)</span>
            </button>
          </div> */}
        </Content>

        <Footer style={{ textAlign: "center" }} />
      </Layout>
    </Layout>
  );
}

export default HomePage;