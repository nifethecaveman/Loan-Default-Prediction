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

        # Base features
        loannumber_x = data['loannumber_x']
        loanamount_x = data['loanamount_x']
        totaldue_x = data['totaldue_x']
        termdays_x = data['termdays_x']
        bank_account_type = data['bank_account_type']
        bank_name_clients = data['bank_name_clients']
        employment_status_clients = data['employment_status_clients']
        level_of_education_clients = data['level_of_education_clients']
        loannumber_y = data['loannumber_y']
        loanamount_y = data['loanamount_y'] or 0
        totaldue_y = data['totaldue_y'] or 0
        termdays_y = data['termdays_y']
        age = data['age']
        interest_rate = data['interest_rate']
        daily_payment = data['daily_payment']
        is_repeat_borrower = data['is_repeat_borrower']
        prev_loan_amount = data['prev_loan_amount']

        # Engineered features
        young_large_loan = int(age < 25 and loanamount_x > 20000)
        very_young = int(age < 22)
        first_time_large_loan = int(loannumber_x == 1 and loanamount_x > 30000)
        loan_growth = loanamount_x / (loanamount_y + 1)
        prev_repayment_ratio = loanamount_y / (totaldue_y + 1)
        debt_ratio = totaldue_x / (loanamount_x + 1)
        loan_per_day = loanamount_x / (termdays_x + 1)
        loan_jump = int(loanamount_x > loanamount_y * 2 and loanamount_y > 0)

        risky_employment = int(employment_status_clients in [4, 5, 6])
        no_income_flag = risky_employment
        high_loan_risky_employment = int(risky_employment and loanamount_x > 30000)

        low_edu_large_loan = int(level_of_education_clients in [2, 3, 4] and loanamount_x > 30000)
        educated_but_unemployed = int(level_of_education_clients in [0, 1] and employment_status_clients in [4, 5, 6])
        educated_employed = int(level_of_education_clients in [0, 1] and employment_status_clients in [1, 3])

        composite_risk = (
            no_income_flag +
            very_young +
            high_loan_risky_employment +
            first_time_large_loan +
            low_edu_large_loan
        )

        features = np.array([[
            loannumber_x, loanamount_x, totaldue_x, termdays_x,
            bank_account_type, bank_name_clients,
            employment_status_clients, level_of_education_clients,
            loannumber_y, loanamount_y, totaldue_y, termdays_y,
            age, interest_rate, daily_payment, is_repeat_borrower,
            prev_loan_amount,
            young_large_loan, very_young, first_time_large_loan,
            loan_growth, prev_repayment_ratio, debt_ratio,
            loan_per_day, loan_jump, no_income_flag,
            high_loan_risky_employment, low_edu_large_loan,
            educated_but_unemployed, educated_employed, composite_risk
        ]])

        probability = float(model.predict_proba(features)[0][1])
        risk_score = round(probability * 100, 2)

        # Rule-based override for cases the model handles poorly
        override_risk = False
        override_reason = None

        if risky_employment and loanamount_x > 30000:
            override_risk = True
            override_reason = "Loan amount is high relative to employment status"
        elif age < 20 and loanamount_x > 20000:
            override_risk = True
            override_reason = "Large loan amount for a very young borrower"
        elif loanamount_x > 60000:
            override_risk = True
            override_reason = "Loan amount is outside the typical lending range seen in training data"

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