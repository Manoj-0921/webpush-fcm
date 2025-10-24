import { useState, useEffect } from "react";
import axios from "axios";
import { Form, Input, Button, Typography, Alert } from "antd"; // <-- import Alert
import { UserOutlined, LockOutlined, BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const { Title, Text } = Typography;

function LoginPage({ setToken, setLoginStatus, handleSubscribe, setRole }) {
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("default");
  const [error, setError] = useState("");

  // Automatically clear error after 2 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const enableNotifications = async () => {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === "granted") {
        window.location.reload();
      } else {
        setError("🚫 Notification permission denied");
      }
    } 
  };

  const handleLogin = async (values) => {
    if (Notification.permission !== "granted") {
      setError("Please enable notifications before logging in.");
      return;
    }
    setLoading(true);
    setError(""); // clear previous error
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isAndroid = /Android/.test(navigator.userAgent);
      let platform = 'web';
      if (isIOS) {
        platform = 'ios';
      } else if (isAndroid) {
        platform = 'android';
      }
      const res = await axios.post("https://backend.schmidvision.com/api/login_mobile", {
        username: values.username,
        password: values.password,
        platform,
      });
      const data = res.data;

      // Store tokens and user info in localStorage BEFORE subscribing
      localStorage.setItem("loginStatus", true);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username);

      // Subscribe to push (wait for it to finish)
      await handleSubscribe(values.username);

      // Now update state and navigate
      setToken(data.username);
      setLoginStatus(true);
      setRole(data.role);

      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("User not found. Please check your username and password.");
      } else {
        setError("Login failed. Please try again.");
      }
      setLoginStatus(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="login-container">
        <div className="header-container">
          <Title level={2} className="title">
            Welcome Back
          </Title>
          <Text className="subtitle" type="secondary">
            Sign in to continue
          </Text>
        </div>
        {/* Show error message if exists */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          name="login"
          layout="vertical"
          onFinish={handleLogin}
          requiredMark={false}
          className="form-container"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please enter your username" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your username"
              autoCapitalize="none"
              size="large"
            />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              size="large"
            />
          </Form.Item>
          {permissionStatus !== "granted" && (
            <Button
              icon={<BellOutlined />}
              block
              style={{ backgroundColor: "#ffb347", marginBottom: "10px" }}
              onClick={enableNotifications}
            >
              Enable Notifications
            </Button>
          )}
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            size="large"
          >
            Sign In
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default LoginPage;
