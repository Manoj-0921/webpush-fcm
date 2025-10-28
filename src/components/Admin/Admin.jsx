import React, { useEffect, useState } from "react";
import { Layout, Select, Table, Switch, Card, DatePicker, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import "./Admin.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Header, Content } = Layout;
const { Option } = Select;

const Admin = ({
  token,
  status,
  handleSubscribe,
  setToken,
  setLoginStatus,
  setStatus,
}) => {
  const [hierarchyData, setHierarchyData] = useState({});
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedTeam, setSelectedTeam] = useState("All");
  const [members, setMembers] = useState([]);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [doorMappings, setDoorMappings] = useState([]);
  const [selectedDoor, setSelectedDoor] = useState(null);
  // Add these after your existing useState declarations
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editTime, setEditTime] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHierarchyData();
    fetchDoorMappings();
    // eslint-disable-next-line
  }, []);

  const fetchHierarchyData = async () => {
    try {
      // POST with empty body and proper config (backend returns [hierarchyData])
      const response = await axios.post(
        "https://backend.schmidvision.com/api/get_departments",
        {}, // empty body
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(response.data, "response");
      if (response.status === 200) {
        // backend returns an array with hierarchy object: [hierarchyData]
        const respData =
          Array.isArray(response.data) &&
          response.data.length &&
          typeof response.data[0] === "object"
            ? response.data[0]
            : response.data && typeof response.data === "object"
            ? response.data
            : {};

        // collect all unique teams across departments
        const allTeamsSet = new Set();
        Object.keys(respData).forEach((d) => {
          const teams = Array.isArray(respData[d]) ? respData[d] : [];
          teams.forEach((t) => allTeamsSet.add(t));
        });
        const allTeams = Array.from(allTeamsSet);

        // Build new hierarchy including "All" entry
        const newResp = { All: allTeams, ...respData };

        // Ensure each department/team list includes "All" as first option
        Object.keys(newResp).forEach((k) => {
          if (!Array.isArray(newResp[k])) newResp[k] = [];
          if (!newResp[k].includes("All")) newResp[k].unshift("All");
        });

        setHierarchyData(newResp);

        // set defaults
        const departments = Object.keys(newResp);
        if (departments.length > 0) {
          const firstDept = departments[0];
          setSelectedDept(firstDept);

          const teams = Array.isArray(newResp[firstDept])
            ? newResp[firstDept]
            : [];
          if (teams.length > 0) {
            setSelectedTeam(teams[0]);
            // fetch members: if "All" selected, send nulls so backend can handle appropriately
            if (teams[0] === "All") {
              fetchMembers(null, null, startDate, endDate);
            } else {
              fetchMembers(firstDept, teams[0], startDate, endDate);
            }
          }
        }
      }
    } catch (err) {
      console.error("❌ Error fetching hierarchy data:", err);
    }
  };

  const fetchDoorMappings = async () => {
    try {
      const response = await axios.post(
        "https://backend.schmidvision.com/fastapi/door-access/admin/get-door-mappings",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data, "door mappings response");
      if (response.data.success) {
        setDoorMappings(response.data.door_mappings);
        // Set first door as default selected
        if (response.data.door_mappings.length > 0) {
          setSelectedDoor(response.data.door_mappings[0]);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching door mappings:", err);
    }
  };
  // Add these before the return statement
  const handleEditClick = () => {
    setIsEditingTime(true);
    setEditTime(selectedDoor?.unlock_time || 0);
  };

  const handleSaveTime = async () => {
    if (!selectedDoor) return;

    try {
      console.log("Updating unlock time:", {
        index: selectedDoor.index,
        door_name: selectedDoor.door_name,
        unlock_time: String(editTime),
      });

      await axios.post(
        "https://backend.schmidvision.com/fastapi/door-access/admin/unlock-door",
        {
          index: selectedDoor.index,
          door_name: selectedDoor.door_name,
          unlock_time: String(editTime),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state
      setDoorMappings((prev) =>
        prev.map((door) =>
          door.index === selectedDoor.index
            ? { ...door, unlock_time: editTime }
            : door
        )
      );
      setSelectedDoor((prev) => ({ ...prev, unlock_time: editTime }));
      setIsEditingTime(false);
    } catch (err) {
      console.error("❌ Error updating unlock time:", err);
    }
  };

  const handleDeptChange = (value) => {
    setSelectedDept(value);
    // default team to "All" if available
    setSelectedTeam("All");
    setMembers([]);
    // immediately fetch members for the new department (All => all teams)
    if (value === "All") {
      fetchMembers(null, null, startDate, endDate);
    } else {
      const teams = Array.isArray(hierarchyData[value])
        ? hierarchyData[value]
        : [];
      const teamToFetch = teams && teams.length ? teams[0] : null;
      setSelectedTeam(teamToFetch || "All");
      if (teamToFetch === "All" || teamToFetch === null) {
        fetchMembers(value, null, startDate, endDate);
      } else {
        fetchMembers(value, teamToFetch, startDate, endDate);
      }
    }
  };

  const handleTeamChange = (value) => {
    setSelectedTeam(value);
    if (startDate && endDate) {
      if (selectedDept === "All") {
        // dept = all, team selection applies across all departments
        fetchMembers(null, value === "All" ? null : value, startDate, endDate);
      } else {
        fetchMembers(
          selectedDept,
          value === "All" ? null : value,
          startDate,
          endDate
        );
      }
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
    // send null/undefined for department/team when "All" selected so backend can return aggregated data
    const deptToSend = department || undefined;
    const teamToSend = team || undefined;

    console.log(
      deptToSend,
      teamToSend,
      start.format("YYYY-MM-DD: HH:mm:ss"),
      end.format("YYYY-MM-DD: HH:mm:ss"),
      "fetchMembers params"
    );
    try {
      const response = await axios.post(
        "https://backend.schmidvision.com/api/get_department_team_members",
        {
          department: deptToSend,
          team: teamToSend,
          startDate: start.format("YYYY-MM-DD : HH:mm:ss"),
          endDate: end.format("YYYY-MM-DD : HH:mm:ss"),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data, "members response");
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
    await axios.post("https://backend.schmidvision.com/api/logout_mobile", {
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
        "https://backend.schmidvision.com/api/update_notification_status",
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

  const handleDoorSelect = (doorName) => {
    const door = doorMappings.find((d) => d.door_name === doorName);
    setSelectedDoor(door || null);
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
            <label style={{ fontWeight: "500", marginTop: "2px" }}>
              Deapartment
            </label>
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
            <label>Team</label>
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

        <Card className="door-control-card">
          <div className="selectors" style={{ marginBottom: 0 }}>
            <Select
              placeholder="Select Gate"
              style={{ flex: 1, minWidth: 200 }}
              value={selectedDoor?.door_name}
              onChange={handleDoorSelect}
            >
              {doorMappings.map((door) => (
                <Option key={door.door_name} value={door.door_name}>
                  {door.door_name}
                </Option>
              ))}
            </Select>

            {isEditingTime ? (
              <div style={{ flex: 1, minWidth: 200, display: "flex", gap: 8 }}>
                <input
                  type="number"
                  value={editTime}
                  onChange={(e) => setEditTime(Number(e.target.value))}
                  style={{
                    flex: 1,
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid #d9d9d9",
                  }}
                />
                <Button type="primary" onClick={handleSaveTime}>
                  Save
                </Button>
              </div>
            ) : (
              <Button
                type="primary"
                onClick={handleEditClick}
                style={{ flex: 1, minWidth: 200 }}
              >
                Unlock: {selectedDoor?.unlock_time || 0} seconds
              </Button>
            )}
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
