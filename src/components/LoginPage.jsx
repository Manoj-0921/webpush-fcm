import { useState } from "react";
import axios from "axios";
import { Form, Input, Button, Typography } from "antd";
import { UserOutlined, LockOutlined, BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const { Title, Text } = Typography;

function LoginPage({ setToken, setLoginStatus, handleSubscribe, setRole }) {
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("default");
  const navigate = useNavigate();

  const enableNotifications = async () => {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === "granted") {
        window.location.reload();
      } else {
        window.alert("🚫 Notification permission denied");
      }
    } else {
      window.alert(
        "✅ Notification permission already " + Notification.permission
      );
    }
  };

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isAndroid = /Android/.test(navigator.userAgent);
      let platform = 'web';
      if (isIOS) {
        platform = 'ios';
      } else if (isAndroid) {
        platform = 'android';
      }
      const res = await axios.post("https://587dbd329342.ngrok-free.app/login", {
        username: values.username,
        password: values.password,
        platform,
      });
      const data = res.data;
      setToken(data.username);
      setLoginStatus(true);
      setRole(data.role);
      await handleSubscribe(values.username);

      // Store in localStorage
      localStorage.setItem("loginStatus", true);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username);

      // Navigate based on role
      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setLoginStatus(false); // <-- set to false on failure
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
