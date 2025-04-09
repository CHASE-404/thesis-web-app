// src/App.jsx
import React, { useEffect, useState } from "react";
import { db, ref, onValue, update, get } from "./firebase";
import Modal from "./Modal"; // Import Modal Component
import "./App.css";

function App() {
  const [sensorData, setSensorData] = useState({});
  const [historicalData, setHistoricalData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalParam, setModalParam] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [modalImplication, setModalImplication] = useState("");

  useEffect(() => {
    // Fetch real-time sensor data
    const sensorRef = ref(db, "sensor");
    onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        setSensorData(snapshot.val());
      }
    });

    // Fetch historical data for charting
    const historyRef = ref(db, "history");
    get(historyRef).then((snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = snapshot.val();
        setHistoricalData(fetchedData); // Set data directly
      }
    });
  }, []);

  const getImplication = (param, value) => {
    switch (param) {
      case "air_temp":
        if (value < 20) return "❌ Too Low – Use heating.";
        if (value > 35) return "❌ Too High – Ventilate or mist.";
        return "✅ Satisfactory";
      case "humidity":
        if (value < 50) return "❌ Too Low – Mist or humidify.";
        if (value > 80) return "❌ Too High – Improve airflow.";
        return "✅ Satisfactory";
      case "ph":
        if (value < 5.5) return "❌ Too Low – Add pH Up.";
        if (value > 6.5) return "❌ Too High – Add pH Down.";
        return "✅ Satisfactory";
      case "tds":
        if (value < 800) return "❌ Too Low – Add nutrients.";
        if (value > 1400) return "❌ Too High – Dilute solution.";
        return "✅ Satisfactory";
      case "water_temp":
        if (value < 16) return "❌ Too Low – Use heater.";
        if (value > 26) return "❌ Too High – Cool water.";
        return "✅ Satisfactory";
      default:
        return "⚠️ N/A";
    }
  };

  const openModal = (param, value) => {
    const implication = getImplication(param, value);
    setModalParam(param);
    setModalValue(value);
    setModalImplication(implication);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Handle turning the pump on
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

  // Handle turning the pump off
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
      <div className="dashboard">
        <h1>🌿 Hydroponics Monitoring</h1>
        <h2>📡 LoRa Real-time Data</h2>

        <div className="cards-container">
          <div className="card" onClick={() => openModal("Air Temp", sensorData.air_temp)}>
            <h3>🌡️ Air Temp</h3>
            <p>{sensorData.air_temp} °C</p>
          </div>
          <div className="card" onClick={() => openModal("Humidity", sensorData.humidity)}>
            <h3>💧 Humidity</h3>
            <p>{sensorData.humidity} %</p>
          </div>
          <div className="card" onClick={() => openModal("Water Temp", sensorData.water_temp)}>
            <h3>🌊 Water Temp</h3>
            <p>{sensorData.water_temp} °C</p>
          </div>
          <div className="card" onClick={() => openModal("TDS", sensorData.tds)}>
            <h3>🧪 Total Dissolved Solution</h3>
            <p>{sensorData.tds} ppm</p>
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
      <Modal
        showModal={showModal}
        closeModal={closeModal}
        param={modalParam}
        value={modalValue}
        implication={modalImplication}
      />
    </div>
  );
}

export default App;
