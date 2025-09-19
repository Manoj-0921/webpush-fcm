import { useState } from "react";
import { subscribeToPush } from "./main.jsx";
import LoginPage from "./components/LoginPage.jsx";
import HomePage from "./components/HomePage.jsx";

import "./App.css";

function App() {
  const [status, setStatus] = useState("Enable Push Notifications");
  const [token, setToken] = useState(null);
  const [loginStatus, setLoginStatus] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-4">
          React PWA Push Demo
        </h1>
        {!token ? (
          <LoginPage
            setToken={setToken}
            setLoginStatus={setLoginStatus}
            handleSubscribe={handleSubscribe}
          />
        ) : (
          <HomePage
            token={token}
            status={status}
            handleSubscribe={handleSubscribe}
            setToken={setToken}
            setLoginStatus={setLoginStatus}
            setStatus={setStatus}
          />
        )}
        {loginStatus && <div className="text-sm text-center text-gray-500 mt-4">{loginStatus}</div>}
      </div>
    </div>
  );
}

export default App;
