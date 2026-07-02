import { useState } from "react";
import axios from "axios";
import { ShieldCheck } from "lucide-react";

const bankAccountTypes = ["Current", "Other", "savings", "Unknown"];

const bankNames = [
  "Access Bank", "Diamond Bank", "EcoBank", "FCMB", "Fidelity Bank",
  "First Bank", "GT Bank", "Heritage Bank", "Keystone Bank", "Skye Bank",
  "Stanbic IBTC", "Standard Chartered", "Sterling Bank", "UBA",
  "Union Bank", "Unity Bank", "Unknown", "Wema Bank", "Zenith Bank"
];

const employmentStatuses = [
  "Contract", "Permanent", "Retired", "Self-Employed",
  "Student", "Unemployed", "Unknown"
];

const educationLevels = [
  "Graduate", "Post-Graduate", "Primary", "Secondary", "Unknown"
];

const hiddenFields = ["totaldue_x", "daily_payment", "totaldue_y", "prev_loan_amount"];

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

  const categoricalFields = {
    bank_account_type: bankAccountTypes,
    bank_name_clients: bankNames,
    employment_status_clients: employmentStatuses,
    level_of_education_clients: educationLevels,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: parseFloat(value) };

    // Auto-calculate totaldue_x
    if (name === 'loanamount_x' || name === 'interest_rate') {
      if (updated.loanamount_x && updated.interest_rate) {
        updated.totaldue_x = updated.loanamount_x * (1 + updated.interest_rate);
      }
    }

    // Auto-calculate daily_payment
    if (name === 'loanamount_x' || name === 'interest_rate' || name === 'termdays_x') {
      if (updated.totaldue_x && updated.termdays_x > 0) {
        updated.daily_payment = updated.totaldue_x / updated.termdays_x;
      }
    }

    // Auto-calculate totaldue_y
    if (name === 'loanamount_y') {
      if (updated.loanamount_y && updated.interest_rate) {
        updated.totaldue_y = updated.loanamount_y * (1 + updated.interest_rate);
      }
      updated.prev_loan_amount = updated.loanamount_y;
    }

    setFormData(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await axios.post("https://loan-default-prediction-44j9.onrender.com/predict", formData);
      setResult(response.data);
    } catch(error){
      console.error(error);
    }
    setLoading(false);
  };

  const fieldLabels = {
  loannumber_x: "Loan Number",
  loanamount_x: "Loan Amount (₦)",
  totaldue_x: "Total Amount Due (₦)",
  termdays_x: "Loan Term (Days)",
  loannumber_y: "Previous Loan Number",
  loanamount_y: "Previous Loan Amount (₦)",
  totaldue_y: "Previous Total Amount Due (₦)",
  termdays_y: "Previous Loan Term (Days)",
  age: "Age",
  interest_rate: "Interest Rate (e.g. 0.15)",
  daily_payment: "Daily Payment (₦)",
  is_repeat_borrower: "Repeat Borrower (1=Yes, 0=No)",
  prev_loan_amount: "Previous Loan Amount (₦)",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-blue-600" size={36} />
          <h1 className="text-3xl font-bold text-gray-900">
            Loan Default Prediction
          </h1>
        </div>
        <p className="text-gray-500 mb-8">
          Enter borrower details to predict default risk
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(formData).map((key) => 
            hiddenFields.includes(key) ? null : categoricalFields[key] ? (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1 tracking-wide">
                  {fieldLabels[key] || key.replace(/_/g, " ").toUpperCase()}
                </label>
                <select
                  name={key}
                  onChange={handleChange}
                  defaultValue=""
                  className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="" disabled className="text-base text-gray-40">Select...</option>
                  {categoricalFields[key].map((label, index) => (
                    <option key={index} value={index} className="text-base py-2">
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1 tracking-wide">
                  {fieldLabels[key] || key.replace(/_/g, " ").toUpperCase()}
                </label>
                <input
                  type="number"
                  name={key}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              )
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? "Predicting..." : "Predict Default Risk"}
          </button>

          {result && (
            <div
              className={`mt-6 p-6 rounded-xl text-center ${
              result.risk_level === "Low Risk"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
              }`}
            >
              <h2
                className={`text-xl font-bold ${
                result.risk_level === "Low Risk" ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.risk_level}
              </h2>
              <p className="text-3xl font-extrabold text-gray-800 mt-2">
                {result.default_risk}%  
              </p>
              <p className="text-gray-500 text-sm mt-1">Repayment Probability</p>
            </div>
          )}
        </div>
    </div>
  );
}

export default App;