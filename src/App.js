import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import PlayerButton from './components/PlayerButton';
import { players } from './data/team-info';
import "./styles/table.css";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Card } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';

function App() {
  const playerButtonsPerRow = 6;
  const [activePlayers, setActivePlayers] = useState(() => {
    const saved = localStorage.getItem("hofActivePlayers");
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedTeam, setSelectedTeam] = useState(() => {
    const saved = localStorage.getItem("hofSelectedTeam");
    return saved ? JSON.parse(saved) : '';
  });
  const [actionLog, setActionLog] = useState(() => {
    const saved = localStorage.getItem("hofPlayerActionLog");
    return saved ? JSON.parse(saved) : [];
  });
  const [impactLog, setImpactLog] = useState([])

  const teams = useMemo(() => {
    return [...new Set(players.map(player => player.team))];
  }, []);

  // Set default team on initial render and store logs
  useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0]);
    }
  }, [teams, selectedTeam]);
  
  useEffect(() => {
    localStorage.setItem("hofActivePlayers", JSON.stringify(activePlayers));
  }, [activePlayers]);

  useEffect(() => {
    localStorage.setItem("hofSelectedTeam", JSON.stringify(selectedTeam));
  }, [selectedTeam]);

  useEffect(() => {
    localStorage.setItem("hofPlayerActionLog", JSON.stringify(actionLog));
  }, [actionLog]);

  const togglePlayer = (id) => {
    const newStatus = !activePlayers[id];
    const player = players.find(p => p.id === id);

    // Update player status
    setActivePlayers((prev) => ({
      ...prev,
      [id]: newStatus,
    }));

    // Log the toggle action
    const logEntry = {
      playerId: id,
      number: player.number,
      subject: player.subject,
      action: newStatus ? 'ON' : 'OFF',
      time: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).replace(/,/, '')
    };

    setActionLog((prev) => [logEntry, ...prev]);
  };

  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
  };

  const toggleAllOff = () => {
    const now = new Date().toLocaleString();
    const updatedStatus = { ...activePlayers };
    const newLogs = [];
  
    for (const [id, isActive] of Object.entries(activePlayers)) {
      if (isActive) {
        updatedStatus[id] = false;
  
        const player = players.find(p => Number(p.id) === Number(id));
        if (player) {
          newLogs.push({
            playerId: id,
            number: player.number,
            subject: player.subject,
            action: "OFF",
            time: now,
          });
        }
      }
    }

    setActivePlayers(updatedStatus);
    setActionLog(prev => [...newLogs, ...prev]);
  };

  const teamPlayers = players.filter(p => p.team === selectedTeam);
  const rows = [];
  for (let i = 0; i < teamPlayers.length; i += playerButtonsPerRow) {
    rows.push(teamPlayers.slice(i, i + playerButtonsPerRow));
  }

  const exportToCSV = () => {
    if (actionLog.length === 0) return;

    // CSV header
    const headers = ["jersey_number", "subject", "action", "time"];
    
    // Convert log to CSV rows
    const rows = actionLog.map(entry => [entry.number, entry.subject, entry.action, entry.time]);

    // Build CSV content
    const csvContent =
      [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(","))
        .join("\n");

    // Create Blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `player_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // add functions to upload test logs
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row) => ({
          number: row.jersey_number,
          subject: row.subject,
          action: row.action,
          time: row.time,
          playerId: row.playerId || `${row.number}_${row.time}` // fallback ID
        }));
  
        setActionLog((prev) => [...prev, ...parsed]);
      },
      error: (err) => {
        console.error("CSV parse error:", err);
      }
    });
  };

  // add functions to upload test logs
  const handleImpactCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log(results.data);
        const parsed = results.data.map((row) => ({
          number: row["Jersey #"],
          impact: row["Peak Linear Acceleration (PLA, g)"],
          time: `${row["Date"]} ${row["Local Time"]}`,
          playerId: row.playerId || `${row["Jersey #"]}_${row["Local Time"]}` // fallback ID
        }));
  
        setImpactLog((prev) => [...prev, ...parsed]);
        console.log(impactLog)
      },
      error: (err) => {
        console.error("CSV parse error:", err);
      }
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <Navbar expand="lg" className="bg-body-secondary" data-bs-theme="dark">
        <Container fluid>
          <Navbar.Brand href="#">STAR Lab: Player Activity Tracker</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav
              className="me-auto my-2 my-lg-0"
              style={{ maxHeight: '100px' }}
              navbarScroll
            >
              <label>
                Select Team:
                <select value={selectedTeam} onChange={handleTeamChange} style={{ marginLeft: '10px' }}>
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </label>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Card bg='tertiary' data-bs-theme="dark" style={{marginTop: "12px"}}>
        <Card.Title style={{padding: "12px"}}>Active Player Selection:</Card.Title>
        <Card.Body>
          <Container style={{marginTop: "12px"}}>
          {rows.map((row, rowIndex) => (
              <Row key={rowIndex} className="mb-3">
                {row.map((playerData, playerButtonIndex) => (
                  <Col key={playerButtonIndex} xs={2}>
                    <PlayerButton
                      key={playerData.id}
                      player={playerData}
                      isActive={!!activePlayers[playerData.id]}
                      onToggle={togglePlayer}
                    />
                  </Col>
                ))}
              </Row>
            ))}
          </Container>
          <Button
            variant='outline-danger'
            onClick={toggleAllOff}
            style={{ width: "100%" }}
          >
            De-Activate All Active Players
          </Button>
        </Card.Body>
      </Card>

      <Card bg='tertiary' data-bs-theme="dark" style={{marginTop: "12px"}}>
        <Card.Title style={{padding: "12px"}}>Player Activity Log:</Card.Title>
        <Card.Body>
          <Button onClick={exportToCSV} variant='outline-light'>
            Export to CSV
          </Button>
          <Button
            variant='outline-danger'
            onClick={() => {
              setActionLog([]);
              setActivePlayers({});
              localStorage.removeItem("playerActionLog");
            }}
            style={{ marginLeft: '10px', marginTop: '4px' }}
          >
            Clear Log
          </Button>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            style={{ marginTop: '4px', visibility: 'hidden' }}
          />
          <input
            type="file"
            accept=".csv"
            onChange={handleImpactCSVUpload}
            style={{ marginTop: '4px', visibility: 'hidden' }}
          />
          <div className="table-container">
            <table border="1" cellPadding="8" style={{ marginTop: '10px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Player #</th>
                  <th>Subject ID</th>
                  <th>Action</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {actionLog.map((entry, idx) => (
                  <tr key={idx}>
                    <td>{entry.number}</td>
                    <td>{entry.subject}</td>
                    <td>{entry.action}</td>
                    <td>{entry.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default App;