import { useState } from "react";

function LoginPage({ setToken, setLoginStatus, handleSubscribe }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginStatus("Logging in...");
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isAndroid = /Android/.test(navigator.userAgent);
      let platform = 'web';
      if (isIOS) {
        platform = 'ios';
      } else if (isAndroid) {
        platform = 'android';
      }
      const res = await fetch("https://8c3e60ce26e2.ngrok-free.app/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, platform }),
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      setToken(data.token);
      setLoginStatus("Logged in!");
      await handleSubscribe(data.token);
    } catch (err) {
      setLoginStatus("Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Login
      </button>
    </form>
  );
}

export default LoginPage;
