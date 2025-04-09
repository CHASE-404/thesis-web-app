import React, { useEffect, useState } from "react";
import { db, ref, get } from "./firebase"; // Use get method to fetch data

const Modal = ({ showModal, closeModal, param, value, implication }) => {
  const [pastValue, setPastValue] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{param}</h2>
        <p>Value: {value}</p>
        <p>Implication: {implication}</p>
        <p>What does it mean: "Placeholder text for now"</p>
        <p>
          Past Value: {loading ? "Loading..." : pastValue ?? "No past record available"}
        </p>
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default Modal;
