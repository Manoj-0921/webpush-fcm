import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { subscribeToPush } from "./main.jsx";
import LoginPage from "./components/LoginPage.jsx";
import HomePage from "./components/Home/HomePage.jsx";
import Admin from "./components/Admin/Admin.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./App.css";

function AppRoutes({ token, setToken, status, setStatus, loginStatus, setLoginStatus, role, setRole, handleSubscribe }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          !token ? (
            <LoginPage
              setToken={setToken}
              setLoginStatus={setLoginStatus}
              handleSubscribe={handleSubscribe}
              setRole={setRole}
            />
          ) : role === "admin" ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/home" replace />
          )
        }
      />
      <Route
        path="/admin"
        element={
          token && role === "admin" ? (
            <Admin
              token={token}
              status={status}
              handleSubscribe={handleSubscribe}
              setToken={setToken}
              setLoginStatus={setLoginStatus}
              setStatus={setStatus}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/home"
        element={
          token && role !== "admin" ? (
            <HomePage
              token={token}
              status={status}
              handleSubscribe={handleSubscribe}
              setToken={setToken}
              setLoginStatus={setLoginStatus}
              setStatus={setStatus}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  const [status, setStatus] = useState("Enable Push Notifications");
  const [token, setToken] = useState(localStorage.getItem("username") || null);
  const [loginStatus, setLoginStatus] = useState(localStorage.getItem("loginStatus") === "true");
  const [role, setRole] = useState(localStorage.getItem("role") || "");

  const handleSubscribe = async (tokenToUse) => {
    if (!tokenToUse) {
      console.log("No token available for subscription.");
      return;
    }
    setStatus("Subscribing...");
    try {
      await subscribeToPush(tokenToUse);
      setStatus("Subscribed!");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <>
      <BrowserRouter>
        <AppRoutes
          token={token}
          setToken={setToken}
          status={status}
          setStatus={setStatus}
          loginStatus={loginStatus}
          setLoginStatus={setLoginStatus}
          role={role}
          setRole={setRole}
          handleSubscribe={handleSubscribe}
        />
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={true} />
    </>
  );
}

export default App;