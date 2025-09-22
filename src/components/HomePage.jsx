function HomePage({ token, status, handleSubscribe, setToken, setLoginStatus, setStatus }) {
  const handleLogout = async () => {
    await fetch("https://670fb4cf3274.ngrok-free.app/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setToken(null);
    setLoginStatus("");
    setStatus("Enable Push Notifications");
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={() => handleSubscribe(token)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
      >
        {status}
      </button>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full"
      >
        Logout
      </button>
    </div>
  );
}

export default HomePage;