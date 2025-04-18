import React, { useEffect, useState } from "react";
import SensorChart from "./SensorChat";
import { db, ref, onValue, update, get, auth } from "./firebase";
import Modal from "./Modal"; 
import Login from "./Login";
import "./App.css";
import "./SensorChart.css";
import { initNotifications, addNotificationClickListener, 
         removeNotificationListeners, checkReadingsAndNotify } from "./notification";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [sensorData, setSensorData] = useState({});
  const [historicalData, setHistoricalData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalParam, setModalParam] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const optimalRanges = {
    air_temp: { min: 22, max: 32, name: "Air Temperature" },
    humidity: { min: 55, max: 75, name: "Humidity" },
    water_temp: { min: 18, max: 24, name: "Water Temperature" },
    tds: { min: 800, max: 1400, name: "Total Dissolved Solids" },
    ph: { min: 5.5, max: 6.5, name: "pH Level" },
  };

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Initialize notifications
  useEffect(() => {
    const setupNotifications = async () => {
      const permissionGranted = await initNotifications();
      setNotificationsEnabled(permissionGranted);
      
      if (permissionGranted) {
        addNotificationClickListener(({ param, value }) => {
          openModal(param, value);
        });
      }
    };
    
    setupNotifications();
    
    return () => {
      removeNotificationListeners();
    };
  }, []);

  useEffect(() => {
    if (!user) return; // Only fetch data if user is authenticated
    
    // Fetch real-time sensor data
    const sensorRef = ref(db, "sensor");
    const sensorUnsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const newData = snapshot.val();
        setSensorData((prev) => {
          const updatedData = { ...prev, ...newData };
          
          // Check readings and send notifications if needed
          if (notificationsEnabled) {
            checkReadingsAndNotify(updatedData, optimalRanges);
          }
          
          return updatedData;
        });
      }
    });

    // Fetch real-time pump state
    const pumpRef = ref(db, "pump_state");
    const pumpUnsubscribe = onValue(pumpRef, (snapshot) => {
      if (snapshot.exists()) {
        const pumpStateValue = snapshot.val().pump_state;
        setSensorData((prev) => ({
          ...prev,
          pump_state: pumpStateValue,
        }));
      }
    });

    // Fetch historical data
    const historyRef = ref(db, "history");
    get(historyRef).then((snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = snapshot.val();
        setHistoricalData(fetchedData);
      }
    });
    
    // Clean up listeners when component unmounts or user logs out
    return () => {
      sensorUnsubscribe();
      pumpUnsubscribe();
    };
  }, [notificationsEnabled, user]);

  const openModal = (param, value) => {
    setModalParam(param);
    setModalValue(value);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const HandlePumpOn = () => {
    const pumpRef = ref(db, "pump_state");
    update(pumpRef, { pump_state: 1 })
      .then(() => {
        console.log("Pump state updated to: ON");
      })
      .catch((error) => {
        console.error("Error updating pump state: ", error);
      });
  };

  const HandlePumpOff = () => {
    const pumpRef = ref(db, "pump_state");
    update(pumpRef, { pump_state: 0 })
      .then(() => {
        console.log("Pump state updated to: OFF");
      })
      .catch((error) => {
        console.error("Error updating pump state: ", error);
      });
  };

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        console.log("User signed out successfully");
        // Clear any user-specific data
        setSensorData({});
        setHistoricalData([]);
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
      });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={() => console.log("User logged in successfully")} />;
  }

  return (
    <div className="container">  
      {/* User header at the top */}
      <div className="user-header">
        <div className="welcome-section">
          <span className="welcome-text">
            Welcome, {user.displayName || 'User'}
          </span>
        </div>
        <div className="logout-section">
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>
      
      {/* Dashboard container */}
      <div className="dashboard">
        <div className="app-title">
          <h1>🌿 Hydroponics Monitoring</h1>
        </div>
        <h2>📡 LoRa Real-time Data</h2>

        <div className="cards-container">
          <div className="card" onClick={() => openModal("Air Temperature", sensorData.air_temp)}>
            <h3>🌡️ Air Temp</h3>
            <p>{sensorData.air_temp} °C</p>
          </div>
          <div className="card" onClick={() => openModal("Humidity", sensorData.humidity)}>
            <h3>💧 Humidity</h3>
            <p>{sensorData.humidity} %</p>
          </div>
          <div className="card" onClick={() => openModal("Water Temperature", sensorData.water_temp)}>
            <h3>🌊 Water Temp</h3>
            <p>{sensorData.water_temp} °C</p>
          </div>
          <div className="card" onClick={() => openModal("Total Dissolved Solids", sensorData.tds)}>
            <h3>🧪 Total Dissolved Solution</h3>
            <p>{sensorData.tds} ppm</p>
          </div>
          <div className="card" onClick={() => openModal("pH Level", sensorData.ph)}>
            <h3>⚗️ pH Level</h3>
            <p>{sensorData.ph}</p>
          </div>
          <div className="card" onClick={() => openModal("Water Pump", sensorData.pump_state === 1 ? "ON" : "OFF")}>
            <h3>💡 Water Pump</h3>
            <p>{sensorData.pump_state === 1 ? "ON" : "OFF"}</p>
          </div>
        </div>

        <div className="pump-control">
          {sensorData.pump_state === 1 ? (
            <button onClick={HandlePumpOff} className="pump-button">
              Turn Off Pump
            </button>
          ) : (
            <button onClick={HandlePumpOn} className="pump-button">
              Turn On Pump
            </button>
          )}
        </div>
      </div>

      {/* Separate chart container */}
      <div className="chart-section">
        <SensorChart historicalData={historicalData} />
      </div>

      <Modal
        showModal={showModal}
        closeModal={closeModal}
        param={modalParam}
        value={modalValue}
      />
    </div>
  );
}

export default App;