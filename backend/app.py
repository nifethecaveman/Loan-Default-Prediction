from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

model = joblib.load('loan_default_model.pkl')

@app.route('/')
def home():
    return jsonify({'message': 'Loan Default Prediction API is running'})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        loannumber = data['loannumber']
        loanamount = data['loanamount']
        totaldue = data['totaldue']
        termdays = data['termdays']
        bank_account_type = data['bank_account_type']
        bank_name_clients = data['bank_name_clients']
        employment_status_clients = data['employment_status_clients']
        level_of_education_clients = data['level_of_education_clients']
        age = data['age']
        num_previous_loans = data.get('num_previous_loans', 0) or 0
        avg_previous_loanamount = data.get('avg_previous_loanamount', 0) or 0
        max_previous_loanamount = data.get('max_previous_loanamount', 0) or 0
        avg_previous_totaldue = data.get('avg_previous_totaldue', 0) or 0
        avg_previous_termdays = data.get('avg_previous_termdays', 0) or 0

        interest_rate = (totaldue - loanamount) / loanamount if loanamount else 0
        daily_payment = totaldue / termdays if termdays else 0
        is_repeat_borrower = int(num_previous_loans > 0)
        loan_growth = loanamount / (avg_previous_loanamount + 1)
        debt_ratio = totaldue / (loanamount + 1)
        loan_per_day = loanamount / (termdays + 1)
        first_time_large_loan = int(loannumber == 1 and loanamount > 30000)
        young_large_loan = int(age < 25 and loanamount > 20000)
        very_young = int(age < 22)
        loan_jump = int(loanamount > avg_previous_loanamount * 2 and avg_previous_loanamount > 0)

        risky_statuses = [0, 4, 5, 6]  # Contract, Student, Unemployed, Unknown
        no_income_flag = int(employment_status_clients in [4, 5, 6])
        high_loan_risky_employment = int(employment_status_clients in risky_statuses and loanamount > 30000)

        low_edu_statuses = [2, 3, 4]  # Primary, Secondary, Unknown
        low_edu_large_loan = int(level_of_education_clients in low_edu_statuses and loanamount > 30000)
        educated_but_unemployed = int(level_of_education_clients in [0, 1] and employment_status_clients in [4, 5, 6])
        educated_employed = int(level_of_education_clients in [0, 1] and employment_status_clients in [1, 3])

        composite_risk = (
            no_income_flag + very_young + high_loan_risky_employment +
            first_time_large_loan + low_edu_large_loan
        )

        print("DEBUG - values received/calculated:")
        print(f"loannumber={loannumber}, loanamount={loanamount}, totaldue={totaldue}, termdays={termdays}")
        print(f"interest_rate={interest_rate}, daily_payment={daily_payment}")
        print(f"num_previous_loans={num_previous_loans}, avg_previous_loanamount={avg_previous_loanamount}")
        print(f"avg_previous_totaldue={avg_previous_totaldue}")

        features = np.array([[
            loannumber, loanamount, totaldue, termdays,
            bank_account_type, bank_name_clients,
            employment_status_clients, level_of_education_clients,
            num_previous_loans, avg_previous_loanamount, max_previous_loanamount,
            avg_previous_totaldue, avg_previous_termdays,
            age, interest_rate, daily_payment, is_repeat_borrower,
            loan_growth, debt_ratio, loan_per_day,
            first_time_large_loan, young_large_loan, very_young, loan_jump,
            no_income_flag, high_loan_risky_employment, low_edu_large_loan,
            educated_but_unemployed, educated_employed, composite_risk
        ]])

        probability = float(model.predict_proba(features)[0][1])
        risk_score = round(probability * 100, 2)

        # ---- Override layer ----
        override_reason = None
        unknown_info_count = int(bank_name_clients == 16) + int(level_of_education_clients == 4) + int(bank_account_type == 3)
        is_low_education = level_of_education_clients in low_edu_statuses
        is_risky_employment = employment_status_clients in risky_statuses
        is_large_loan = loanamount > 30000
        is_very_young = age < 20 and loanamount > 20000
        is_first_time = loannumber == 1

        if unknown_info_count >= 2 and is_large_loan and is_first_time:
            override_reason = "Insufficient borrower information for a large first-time loan"
        elif is_risky_employment and is_low_education and is_large_loan:
            override_reason = "Contract employment and lower education level increase risk for this loan amount" if employment_status_clients == 0 else "Unstable employment and lower education level increase risk for this loan amount"
        elif employment_status_clients == 0 and is_large_loan:
            override_reason = "Contract employment carries higher default risk for larger loan amounts"
        elif is_risky_employment and is_large_loan:
            override_reason = "Loan amount is high relative to employment status"
        elif is_low_education and is_large_loan:
            override_reason = "Loan amount is high relative to education level"
        elif is_very_young:
            override_reason = "Large loan amount for a very young borrower"
        elif loanamount > 60000 and (is_risky_employment or is_low_education or is_very_young):
            override_reason = "Large loan amount combined with other risk factors"

        override_risk = override_reason is not None
        risk_level = 'High Risk' if (risk_score < 75 or override_risk) else 'Low Risk'

        return jsonify({
            'default_risk': risk_score,
            'risk_level': risk_level,
            'override_reason': override_reason
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)