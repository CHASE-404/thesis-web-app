import React, { useEffect, useState } from "react";
import { db, ref, get } from "./firebase";

const Modal = ({ showModal, closeModal, param, value }) => {
  const [pastValue, setPastValue] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parameter data definitions
  const parameterData = {
    "Air Temperature": {
      optimalRange: "22°C - 32°C",
      implications: {
        satisfactory: "The air temperature is within the optimal range for plant growth.",
        tooHigh: "Temperature is too high. This causes heat stress, reduced growth, and increased evaporation.",
        tooLow: "Temperature is too low. This causes slowed metabolism and poor nutrient absorption."
      },
      actions: {
        tooHigh: "Increase shading, improve ventilation, use misting or evaporative cooling.",
        tooLow: "Insulate the hydroponic setup, use a greenhouse or heating pads."
      },
      importance: "Temperature affects plant growth rate, nutrient uptake, and photosynthesis efficiency."
    },
    "Humidity": {
      optimalRange: "55% - 75%",
      implications: {
        satisfactory: "The humidity level is within the optimal range for plant growth.",
        tooHigh: "Humidity is too high. This encourages mold, fungi, and root diseases.",
        tooLow: "Humidity is too low. This causes increased water loss and slower growth."
      },
      actions: {
        tooHigh: "Improve airflow, reduce misting, use a dehumidifier.",
        tooLow: "Use misting, increase water surface area, or install a humidifier."
      },
      importance: "Controls transpiration rate and prevents plant dehydration. Pechay prefers moderate humidity."
    },
    "pH Level": {
      optimalRange: "5.5 - 6.5",
      implications: {
        satisfactory: "The pH level is within the optimal range for nutrient absorption.",
        tooHigh: "pH is too high. This causes nutrient deficiencies (iron, manganese, phosphorus).",
        tooLow: "pH is too low. This causes toxicity of some nutrients and root damage."
      },
      actions: {
        tooHigh: "Add pH Down (phosphoric acid or citric acid).",
        tooLow: "Add pH Up (potassium hydroxide or lime solution)."
      },
      importance: "Determines nutrient availability. Incorrect pH locks out essential nutrients."
    },
    "Total Dissolved Solids": {
      optimalRange: "800 - 1400 ppm",
      implications: {
        satisfactory: "The TDS level is within the optimal range for plant nutrition.",
        tooHigh: "TDS is too high. This risks over-fertilization and root burn.",
        tooLow: "TDS is too low. This causes nutrient deficiency and slow growth."
      },
      actions: {
        tooHigh: "Dilute with fresh water, flush system.",
        tooLow: "Add nutrient solution gradually."
      },
      importance: "Indicates nutrient concentration in water, essential for plant health."
    },
    "Water Temperature": {
      optimalRange: "18°C - 24°C",
      implications: {
        satisfactory: "The water temperature is within the optimal range for root health.",
        tooHigh: "Water temperature is too high. This reduces dissolved oxygen levels and promotes root rot and pathogens.",
        tooLow: "Water temperature is too low. This slows plant metabolism, reduces nutrient uptake, and stunts root growth."
      },
      actions: {
        tooHigh: "Shade the reservoir.",
        tooLow: "Use a water heater or insulate the reservoir."
      },
      importance: "Regulates root zone temperature, influences oxygen availability, nutrient uptake, and microbial activity."
    }
  };

  // Determine status and get appropriate messages
  const getStatus = (param, value) => {
    if (!parameterData[param]) return { status: "unknown", implication: "Unknown parameter" };
    
    let status = "unknown";
    let implication = "";
    let action = "";

    // Parse the value to a number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (param === "Air Temperature") {
      if (numValue >= 22 && numValue <= 32) {
        status = "satisfactory";
        implication = parameterData[param].implications.satisfactory;
      } else if (numValue > 32) {
        status = "tooHigh";
        implication = parameterData[param].implications.tooHigh;
        action = parameterData[param].actions.tooHigh;
      } else {
        status = "tooLow";
        implication = parameterData[param].implications.tooLow;
        action = parameterData[param].actions.tooLow;
      }
    } else if (param === "Humidity") {
      if (numValue >= 55 && numValue <= 75) {
        status = "satisfactory";
        implication = parameterData[param].implications.satisfactory;
      } else if (numValue > 75) {
        status = "tooHigh";
        implication = parameterData[param].implications.tooHigh;
        action = parameterData[param].actions.tooHigh;
      } else {
        status = "tooLow";
        implication = parameterData[param].implications.tooLow;
        action = parameterData[param].actions.tooLow;
      }
    } else if (param === "pH Level") {
      if (numValue >= 5.5 && numValue <= 6.5) {
        status = "satisfactory";
        implication = parameterData[param].implications.satisfactory;
      } else if (numValue > 6.5) {
        status = "tooHigh";
        implication = parameterData[param].implications.tooHigh;
        action = parameterData[param].actions.tooHigh;
      } else {
        status = "tooLow";
        implication = parameterData[param].implications.tooLow;
        action = parameterData[param].actions.tooLow;
      }
    } else if (param === "Total Dissolved Solids") {
      if (numValue === 0) {
        status = "error";
        implication = "TDS reading is zero. The sensor may be faulty, not properly submerged in water, or there might be an issue with the code.";
        action = "Try putting the sensor in water. If the reading remains at zero, check the sensor connections or replace it.";
      } else if (numValue >= 800 && numValue <= 1400) {
        status = "satisfactory";
        implication = parameterData[param].implications.satisfactory;
      } else if (numValue > 1400) {
        status = "tooHigh";
        implication = parameterData[param].implications.tooHigh;
        action = parameterData[param].actions.tooHigh;
      } else {
        status = "tooLow";
        implication = parameterData[param].implications.tooLow;
        action = parameterData[param].actions.tooLow;
      }
    } else if (param === "Water Temperature") {
      if (numValue >= 18 && numValue <= 24) {
        status = "satisfactory";
        implication = parameterData[param].implications.satisfactory;
      } else if (numValue > 24) {
        status = "tooHigh";
        implication = parameterData[param].implications.tooHigh;
        action = parameterData[param].actions.tooHigh;
      } else {
        status = "tooLow";
        implication = parameterData[param].implications.tooLow;
        action = parameterData[param].actions.tooLow;
      }
    }

    return { status, implication, action };
  };

  useEffect(() => {
    if (param) {
      const historyRef = ref(db, `history`);
      get(historyRef).then((snapshot) => {
        if (snapshot.exists()) {
          // Extract the most recent record for the given param
          const records = snapshot.val();
          const lastRecord = records ? Object.values(records).pop() : null;
          if (lastRecord && lastRecord[param] !== undefined) {
            setPastValue(lastRecord[param]);
          }
        }
        setLoading(false);
      });
    }
  }, [param]);

  if (!showModal) return null;

  const { status, implication, action } = getStatus(param, value);
  const paramInfo = parameterData[param] || {};
  
 
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{param}</h2>               
        {param === "Water Pump" ? (
          // Special display for Water Pump
          <div className="modal-section">
            <h3>Current State:</h3>
            <p className="pump-state">{value}</p>
          </div>
        ) : (
          // Regular display for other parameters
          <>
            <div className="modal-section">
              <h3>Current Value:</h3>
              <p className={`value ${status}`}>{value} {param === "Air Temperature" || param === "Water Temperature" ? "°C" : 
                                                param === "Humidity" ? "%" : 
                                                param === "Total Dissolved Solids" ? "ppm" : ""}</p>
              <p className="optimal-range">Optimal Range: {paramInfo.optimalRange || "N/A"}</p>
            </div>
            
            <div className="modal-section">
              <h3>Implication:</h3>
              <p className={`status-indicator ${status}`}>
                {status === "satisfactory" ? "✅ Satisfactory" : "❌ Not Satisfactory"}
              </p>
              <p>{implication}</p>
              {action && (
                <div className="action">
                  <h4>Recommended Action:</h4>
                  <p>{action}</p>
                </div>
              )}
            </div>
            
            <div className="modal-section">
              <h3>Importance in Hydroponics:</h3>
              <p>{paramInfo.importance || "Information not available"}</p>
            </div>
            
          </>
        )}
        <button className="close-button" onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default Modal;