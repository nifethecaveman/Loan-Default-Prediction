import { useState } from "react";
import axios from "axios";
import { ShieldCheck } from "lucide-react";

const bankAccountTypes = ["Current", "Other", "Savings", "Unknown"];

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

const fieldLabels = {
  loannumber: "Loan Number",
  loanamount: "Loan Amount (₦)",
  termdays: "Loan Term (Days)",
  bank_account_type: "Bank Account Type",
  bank_name_clients: "Bank Name",
  employment_status_clients: "Employment Status",
  level_of_education_clients: "Education Level",
  age: "Age",
  interest_rate: "Interest Rate (e.g. 0.15)",
  num_previous_loans: "Number of Previous Loans",
  avg_previous_loanamount: "Average Previous Loan Amount (₦)",
  max_previous_loanamount: "Largest Previous Loan Amount (₦)",
  avg_previous_termdays: "Average Previous Loan Term (Days)",
};

// Fields calculated automatically, not shown to the user directly
const hiddenFields = ["totaldue", "daily_payment", "avg_previous_totaldue"];

function App() {
  const [formData, setFormData] = useState({
    loannumber: "",
    loanamount: "",
    totaldue: 0,
    termdays: "",
    bank_account_type: "",
    bank_name_clients: "",
    employment_status_clients: "",
    level_of_education_clients: "",
    age: "",
    interest_rate: 0.15,
    daily_payment: 0,
    num_previous_loans: "",
    avg_previous_loanamount: "",
    max_previous_loanamount: "",
    avg_previous_totaldue: 0,
    avg_previous_termdays: "",
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

    // Auto-calculate totaldue and daily_payment from loan amount, interest rate, term
    if (name === "loanamount" || name === "interest_rate" || name === "termdays") {
      if (updated.loanamount && updated.interest_rate) {
        updated.totaldue = updated.loanamount * (1 + updated.interest_rate);
      }
      if (updated.totaldue && updated.termdays > 0) {
        updated.daily_payment = updated.totaldue / updated.termdays;
      }
    }

    // Auto-calculate avg_previous_totaldue from avg previous loan amount + same interest rate
    if (name === "avg_previous_loanamount" || name === "interest_rate") {
      if (updated.avg_previous_loanamount && updated.interest_rate) {
        updated.avg_previous_totaldue = updated.avg_previous_loanamount * (1 + updated.interest_rate);
      }
    }

    setFormData(updated);
  };

  const handleSubmit = async () => {
    // Validation: age vs education plausibility
    const minAgeForEducation = {
      1: 23, // Post-Graduate
      0: 21, // Graduate
    };
    const requiredAge = minAgeForEducation[formData.level_of_education_clients];
    if (requiredAge && formData.age < requiredAge) {
      alert("Age seems too young for the selected education level. Please double check the entries.");
      return;
    }

    // Validation: previous loan history consistency
    const hasPreviousLoan = formData.num_previous_loans > 0 || formData.avg_previous_loanamount > 0;
    if (hasPreviousLoan && formData.num_previous_loans === 0) {
      alert("Previous loan amount was entered but number of previous loans is 0. Please correct this.");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await axios.post("http://127.0.0.1:5000/predict", formData);
      setResult(response.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
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
          {Object.keys(formData).map((key) => {
            if (hiddenFields.includes(key)) return null;

            if (categoricalFields[key]) {
              return (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 tracking-wide">
                    {fieldLabels[key] || key.replace(/_/g, " ").toUpperCase()}
                  </label>
                  <select
                    name={key}
                    onChange={handleChange}
                    defaultValue=""
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="" disabled>Select...</option>
                    {categoricalFields[key].map((label, index) => (
                      <option key={index} value={index} className="text-lg py-2">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1 tracking-wide">
                  {fieldLabels[key] || key.replace(/_/g, " ").toUpperCase()}
                </label>
                <input
                    type="number"
                    step="0.01"
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
              </div>
            );
          })}
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
            <p className="text-gray-500 text-sm mt-1">Model Confidence Score</p>

            {result.override_reason && (
              <p className="text-sm text-red-600 mt-3 font-medium">
                ⚠ {result.override_reason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;