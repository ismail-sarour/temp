import React from "react";
import AIDashboard from "../components/agents-ia/AIDashboard";

const AgentsIA = () => {
  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        background: "#f6f5f2",
      }}
    >
      <AIDashboard />
    </div>
  );
};

export default AgentsIA;
