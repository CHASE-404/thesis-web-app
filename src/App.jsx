import { useEffect, useState } from "react";
import { db, ref, onValue } from "./firebase";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// ... (imports remain the same)

function App() {
  const [sensorData, setSensorData] = useState({});
  const [historyData, setHistoryData] = useState({});
  const [timeRange, setTimeRange] = useState("day");

  useEffect(() => {
    const sensorRef = ref(db, "sensor");
    onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        setSensorData(snapshot.val());
      }
    });

    const historyRef = ref(db, "history");
    onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        setHistoryData(snapshot.val());
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

  const getChartData = (timeRange) => {
    const labels = [];
    const data = {
      air_temp: [],
      humidity: [],
      water_temp: [],
      ph: [],
      tds: [],
    };

    const sortedHistory = Object.entries(historyData).sort(
      ([a], [b]) => Number(a) - Number(b)
    );

    sortedHistory.forEach(([timestamp, record]) => {
      const date = new Date(Number(timestamp) * 1000);
      const label = timeRange === "day" ? date.toLocaleDateString() : `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!labels.includes(label)) labels.push(label);

      data.air_temp.push(record.air_temp);
      data.humidity.push(record.humidity);
      data.water_temp.push(record.water_temp);
      data.ph.push(record.ph);
      data.tds.push(record.tds);
    });

    return {
      labels,
      datasets: [
        { label: "Air Temp (°C)", data: data.air_temp, borderColor: "#FF6347", fill: false },
        { label: "Humidity (%)", data: data.humidity, borderColor: "#1E90FF", fill: false },
        { label: "Water Temp (°C)", data: data.water_temp, borderColor: "#32CD32", fill: false },
        { label: "pH Level", data: data.ph, borderColor: "#FFD700", fill: false },
        { label: "TDS (ppm)", data: data.tds, borderColor: "#8A2BE2", fill: false },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Historical Data (${timeRange})`,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: timeRange === "day" ? "Date" : "Month/Year",
        },
      },
      y: {
        title: {
          display: true,
          text: "Value",
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="container">
      <div className="dashboard">
        <h1>🌿 Hydroponics Monitoring</h1>
        <h2>📡 LoRa Real-time Data</h2>

        <div className="data-parameters">
          <div className="parameter"><span>🌡️ Air Temp:</span><span>{sensorData.air_temp} °C</span></div>
          <div className="parameter"><span>💧 Humidity:</span><span>{sensorData.humidity} %</span></div>
          <div className="parameter"><span>🌊 Water Temp:</span><span>{sensorData.water_temp} °C</span></div>
          <div className="parameter"><span>⚖️ pH Level:</span><span>{sensorData.ph}</span></div>
          <div className="parameter"><span>🧪 TDS:</span><span>{sensorData.tds} ppm</span></div>
          <div className="parameter"><span>💡 Pump:</span><span>{sensorData.pump_state === 1 ? "ON" : "OFF"}</span></div>
        </div>

        {/* Implications Table */}
        <h3 style={{ marginTop: "25px" }}>📊 Parameter Implications</h3>
        <table className="implications-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Implication</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Air Temp</td><td>{sensorData.air_temp} °C</td><td>{getImplication("air_temp", sensorData.air_temp)}</td></tr>
            <tr><td>Humidity</td><td>{sensorData.humidity} %</td><td>{getImplication("humidity", sensorData.humidity)}</td></tr>
            <tr><td>Water Temp</td><td>{sensorData.water_temp} °C</td><td>{getImplication("water_temp", sensorData.water_temp)}</td></tr>
            <tr><td>pH</td><td>{sensorData.ph}</td><td>{getImplication("ph", sensorData.ph)}</td></tr>
            <tr><td>TDS</td><td>{sensorData.tds} ppm</td><td>{getImplication("tds", sensorData.tds)}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="historical-data">
        <h2>📜 Historical Data</h2>
        <div className="time-range-selector">
          <button onClick={() => setTimeRange("day")}>Day</button>
          <button onClick={() => setTimeRange("week")}>Week</button>
          <button onClick={() => setTimeRange("month")}>Month</button>
        </div>
        <div className="chart-container">
          <Line data={getChartData(timeRange)} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default App;