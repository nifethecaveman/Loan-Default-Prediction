import { useState } from "react";
import axios from "axios";

function App() {
  const [formData, setFormData] = useState({
    loannumber_x: "",
    loanamount_x: "",
    totaldue_x: "",
    termdays_x: "",
    bank_account_type: "",
    bank_name_clients: "",
    employment_status_clients: "",
    level_of_education_clients: "",
    loannumber_y: "",
    loanamount_y: "",
    totaldue_y: "",
    termdays_y: "",
    age: "",
    interest_rate: "",
    daily_payment: "",
    is_repeat_borrower: "",
    prev_loan_amount: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        formData
      );
      setResult(response.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Loan Default Prediction</h1>
      <p>Enter borrower details to predict default risk</p>

      {Object.keys(formData).map((key) => (
        <div key={key} style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>
            {key.replace(/_/g, " ").toUpperCase()}
          </label>
          <input
            type="number"
            name={key}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        style={{ width: "100%", padding: "12px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", fontSize: "16px", cursor: "pointer", marginTop: "10px" }}
      >
        {loading ? "Predicting..." : "Predict Default Risk"}
      </button>

      {result && (
        <div style={{ marginTop: "24px", padding: "20px", borderRadius: "8px", background: result.risk_level === "Low Risk" ? "#dcfce7" : "#fee2e2", textAlign: "center" }}>
          <h2>{result.risk_level}</h2>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>
            Repayment Probability: {result.default_risk}%
          </p>
        </div>
      )}
    </div>
  );
}

export default App;