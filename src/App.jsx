import React, { useEffect, useState } from "react";
import SensorChart from "./SensorChat";
import { db, ref, onValue, update, get } from "./firebase";
import Modal from "./Modal"; // Import Modal Component
import "./App.css";
import "./SensorChart.css";

function App() {
  const [sensorData, setSensorData] = useState({});
  const [historicalData, setHistoricalData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalParam, setModalParam] = useState("");
  const [modalValue, setModalValue] = useState("");

  useEffect(() => {
    // Fetch real-time sensor data
    const sensorRef = ref(db, "sensor");
    onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        setSensorData((prev) => ({
          ...prev,
          ...snapshot.val(),
        }));
      }
    });

    // Fetch real-time pump state
    const pumpRef = ref(db, "pump_state");
    onValue(pumpRef, (snapshot) => {
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
  }, []);

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

  return (
    <div className="container">
      {/* Dashboard container */}
      <div className="dashboard">
        <h1>🌿 Hydroponics Monitoring</h1>
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
