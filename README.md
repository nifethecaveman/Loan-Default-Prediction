# Loan Default Prediction

A full-stack machine learning web application that predicts whether a borrower will default on a loan, built using real Nigerian lending data from OneFi/Data Science Nigeria.

## Project Overview

This project combines data science and software development to build an end-to-end loan default prediction system. A trained XGBoost model is served via a Flask REST API and consumed by a React frontend.

## Features

- Predicts loan repayment probability based on borrower details
- Returns a risk level (Low Risk / High Risk) with repayment probability score
- Built with real Nigerian microfinance data
- Clean React UI with dropdowns for categorical fields

## Tech Stack

Frontend: React.js, Tailwind CSS, Axios

Backend: Python, Flask, Flask-CORS

Machine Learning: XGBoost, Scikit-learn, Imbalanced-learn (SMOTE)

Data Analysis: Pandas, NumPy, Matplotlib, Seaborn

## Model Performance

| Model | ROC-AUC |
|---|---|
| Logistic Regression | 0.60 |
| Random Forest | 0.83 |
| XGBoost (baseline) | 0.89 |
| XGBoost (tuned) | 0.91 |

## Dataset

Data Science Nigeria / OneFi Loan Default Prediction dataset from Zindi Africa.
Download from: https://zindi.africa/competitions/data-science-nigeria-challenge-1-loan-default-prediction

The dataset contains three files merged on customerid:
- trainperf.csv — loan performance and target variable
- traindemographics.csv — borrower demographic information
- trainprevloans.csv — previous loan history

## Project Structure