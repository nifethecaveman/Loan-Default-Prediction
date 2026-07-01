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

        features = np.array([[
            data['loannumber_x'],
            data['loanamount_x'],
            data['totaldue_x'],
            data['termdays_x'],
            data['bank_account_type'],
            data['bank_name_clients'],
            data['employment_status_clients'],
            data['level_of_education_clients'],
            data['loannumber_y'],
            data['loanamount_y'],
            data['totaldue_y'],
            data['termdays_y'],
            data['age'],
            data['interest_rate'],
            data['daily_payment'],
            data['is_repeat_borrower'],
            data['prev_loan_amount']
        ]])

        probability = float(model.predict_proba(features)[0][1])
        risk_score = round(probability * 100, 2)

        return jsonify({
            'default_risk': risk_score,
            'risk_level': 'High Risk' if risk_score < 75 else 'Low Risk'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)