import React, { useEffect, useState } from "react";
import { Layout, Select, Table, Switch, Card, DatePicker, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import "./Admin.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Header, Content } = Layout;
const { Option } = Select;

const Admin = ({ token, status, handleSubscribe, setToken, setLoginStatus, setStatus }) => {
  const [hierarchyData, setHierarchyData] = useState({});
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const navigate = useNavigate();

  useEffect(() => {
    fetchHierarchyData();
    // eslint-disable-next-line
  }, []);

  const fetchHierarchyData = async () => {
    try {
      const response = await axios.get(
        "https://2631998197dd.ngrok-free.app/api/get_departments"
      );
      if (response.status === 200) {
        const department = Object.keys(response.data);
        if (department.length > 0) {
          setSelectedDept(department[0]);
          const teams = Array.isArray(response.data[department[0]])
            ? response.data[department[0]]
            : [];
          if (teams.length > 0) {
            setSelectedTeam(teams[0]);
            fetchMembers(department[0], teams[0], startDate, endDate);
          }
        }
        setHierarchyData(response.data);
      }
    } catch (err) {
      console.error("❌ Error fetching hierarchy data:", err);
    }
  };

  const handleDeptChange = (value) => {
    setSelectedDept(value);
    setSelectedTeam(null);
    setMembers([]);
  };

  const handleTeamChange = (value) => {
    setSelectedTeam(value);
    if (startDate && endDate) {
      fetchMembers(selectedDept, value, startDate, endDate);
    }
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (selectedDept && selectedTeam && date && endDate) {
      fetchMembers(selectedDept, selectedTeam, date, endDate);
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    if (selectedDept && selectedTeam && startDate && date) {
      fetchMembers(selectedDept, selectedTeam, startDate, date);
    }
  };

  const fetchMembers = async (department, team, start, end) => {
    try {
      const response = await axios.post(
        "https://2631998197dd.ngrok-free.app/api/get_department_team_members",
        {
          department,
          team,
          startDate: start.format("YYYY-MM-DD"),
          endDate: end.format("YYYY-MM-DD"),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setMembers(
          response.data.data.map((member, index) => ({
            key: index,
            name: member.name,
            enabled: member.admin_monitor,
            averageStay: member.averageDwellTime,
            systemId: member.system_id,
          }))
        );
      }
    } catch (err) {
      console.error("❌ Error fetching members:", err);
    }
  };

  // --- KEEP YOUR ROBUST LOGOUT LOGIC HERE ---
  const handleLogout = async () => {
    await axios.post("https://40da073dfe40.ngrok-free.app/logout", {
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
    navigate("/");
  };

  const handleToggleNotification = async (systemId, enabled) => {
    try {
      await axios.post(
        "https://2631998197dd.ngrok-free.app/api/update_notification_status",
        { system_id: systemId, enabled },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      console.error(`❌ Error updating notification for ${systemId}:`, err);
    }
  };

  const columns = [
    { title: "Member", dataIndex: "name", key: "name" },
    {
      title: "Enable",
      key: "enable",
      render: (_, record) => (
        <Switch
          defaultChecked={record.enabled}
          onChange={(checked) =>
            handleToggleNotification(record.systemId, checked)
          }
        />
      ),
    },
    { title: "Avg Stay", dataIndex: "averageStay", key: "averageStay" },
  ];

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-left">
          <img src="/user.png" alt="Avatar" />
          <span>Admin Dashboard</span>
        </div>
        <Button
          className="logout-icon-btn"
          type="text"
          icon={<LogoutOutlined style={{ fontSize: "20px", color: "white" }} />}
          onClick={handleLogout}
        />
      </Header>

      <Content className="app-content">
        <Card className="selectors-card">
          <div className="selectors">
            <Select
              placeholder="Select Department"
              style={{ width: "100%" }}
              onChange={handleDeptChange}
              value={selectedDept}
            >
              {Object.keys(hierarchyData)?.map((dept) => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Select Team"
              style={{ width: "100%" }}
              onChange={handleTeamChange}
              value={selectedTeam}
              disabled={!selectedDept}
            >
              {selectedDept &&
                Array.isArray(hierarchyData[selectedDept]) &&
                hierarchyData[selectedDept].map((team) => (
                  <Option key={team} value={team}>
                    {team}
                  </Option>
                ))}
            </Select>
          </div>

          <div className="date-range-wrapper">
            <div className="date-picker-item">
              <label className="date-label">Start Date</label>
              <DatePicker
                style={{ width: "100%" }}
                value={startDate}
                onChange={handleStartDateChange}
                format="YYYY-MM-DD"
              />
            </div>
            <div className="date-picker-item">
              <label className="date-label">End Date</label>
              <DatePicker
                style={{ width: "100%" }}
                value={endDate}
                onChange={handleEndDateChange}
                format="YYYY-MM-DD"
              />
            </div>
          </div>
        </Card>

        <div className="table-wrapper">
          <Table
            dataSource={members}
            columns={columns}
            pagination={false}
            scroll={{ x: true }}
            size="middle"
          />
        </div>
      </Content>
    </Layout>
  );
};

export default Admin;
