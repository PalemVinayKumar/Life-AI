// src/pages/ExpensePage.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore'; // Removed where as it wasn't used
import { useAuthState } from 'react-firebase-hooks/auth';

const ExpensePage = () => {
  const [user, loading, error] = useAuthState(auth);
  const [smsInput, setSmsInput] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const parseUpiSms = (sms) => {
    let amount = 0;
    let merchant = 'Unknown';
    let transactionType = 'Debit';
    let notes = sms;

    const amountMatch = sms.match(/Rs\.?\s*([\d,]+\.?\d*)/i);
    if (amountMatch && amountMatch[1]) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    const debitCreditMatch = sms.match(/(debited|credited)/i);
    if (debitCreditMatch && debitCreditMatch[1].toLowerCase() === 'credited') {
      transactionType = 'Credit';
    }

    const commonMerchants = ['Swiggy', 'Zomato', 'Paytm', 'PhonePe', 'GPay', 'Netflix', 'Amazon', 'Flipkart', 'BigBazaar', 'DMart', 'Petrol', 'Groceries', 'Uber', 'Ola', 'Spotify', 'YouTube', 'Rent'];
    for (const m of commonMerchants) {
      if (sms.toLowerCase().includes(m.toLowerCase())) {
        merchant = m;
        break;
      }
    }

    const forToMatch = sms.match(/(?:for|to)\s+([A-Za-z0-9\s]+?)(?:\.|$|UPI|Ref|A\/c)/i);
    if (merchant === 'Unknown' && forToMatch && forToMatch[1]) {
        merchant = forToMatch[1].trim();
    }

    let category = 'Uncategorized';
    if (['Swiggy', 'Zomato'].some(m => merchant.includes(m))) category = 'Food & Dining';
    else if (['Paytm', 'PhonePe', 'GPay'].some(m => merchant.includes(m)) || sms.toLowerCase().includes('upi')) category = 'Payments';
    else if (['Netflix', 'Spotify', 'YouTube'].some(m => merchant.includes(m))) category = 'Subscriptions';
    else if (['Amazon', 'Flipkart'].some(m => merchant.includes(m))) category = 'Shopping';
    else if (sms.toLowerCase().includes('petrol') || ['Uber', 'Ola'].some(m => merchant.includes(m))) category = 'Transport';
    else if (sms.toLowerCase().includes('groceries') || ['BigBazaar', 'DMart'].some(m => merchant.includes(m))) category = 'Groceries';
    else if (sms.toLowerCase().includes('rent')) category = 'Housing';
    // Add more rules here

    return {
      rawSms: sms,
      amount: amount,
      merchant: merchant,
      transactionType: transactionType,
      category: category,
      timestamp: new Date(),
    };
  };

  useEffect(() => {
    if (user) {
      setFetchError('');
      const userExpensesCollectionRef = collection(db, 'expenses', user.uid, 'userExpenses');
      const q = query(userExpensesCollectionRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedExpenses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExpenses(fetchedExpenses);
      }, (err) => {
        console.error("Error fetching expenses:", err);
        setFetchError("Failed to load expenses. Please try again.");
      });

      return () => unsubscribe();
    } else {
      setExpenses([]);
    }
  }, [user]);

  const handleProcessSms = async (e) => {
    e.preventDefault();
    if (!smsInput.trim() || !user) {
      alert("Please paste an SMS message and ensure you are logged in.");
      return;
    }

    setSubmitLoading(true);
    try {
      const parsedExpense = parseUpiSms(smsInput);
      const userExpensesCollectionRef = collection(db, 'expenses', user.uid, 'userExpenses');
      await addDoc(userExpensesCollectionRef, parsedExpense);
      setSmsInput('');
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Failed to add expense. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div style={expenseStyles.loading}>Loading expense tracker...</div>;
  }

  if (error) {
    return <div style={expenseStyles.error}>Error: {error.message}</div>;
  }

  if (!user) {
    return <div style={expenseStyles.noUser}>Please log in to use the Expense Tracker.</div>;
  }

  return (
    <div style={expenseStyles.container}>
      <h2 style={expenseStyles.title}>Expense & Bill Brain</h2>
      <p style={expenseStyles.description}>
        Paste your UPI/transaction SMS messages below to automatically track expenses.
      </p>

      <form onSubmit={handleProcessSms} style={expenseStyles.form}>
        <textarea
          style={expenseStyles.textarea}
          placeholder="Paste your transaction SMS here, e.g.:
          'Rs.150.00 debited from your A/c XXXX for Swiggy. Ref No. 123456789. Avl Bal Rs. 5000.00.'
          'Your A/c XXXX is credited with Rs. 2000.00 from PAYTM. UPI Ref 987654321.'
          "
          value={smsInput}
          onChange={(e) => setSmsInput(e.target.value)}
          rows="6"
        ></textarea>
        <button type="submit" style={expenseStyles.button} disabled={submitLoading}>
          {submitLoading ? 'Processing...' : 'Process SMS'}
        </button>
      </form>

      {fetchError && <p style={expenseStyles.error}>{fetchError}</p>}

      <div style={expenseStyles.expensesList}>
        <h3 style={expenseStyles.listTitle}>Your Expenses:</h3>
        {expenses.length === 0 ? (
          <p style={expenseStyles.noExpenses}>No expenses tracked yet. Paste an SMS above!</p>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} style={{
              ...expenseStyles.expenseItem,
              borderLeftColor: expense.transactionType === 'Debit' ? 'var(--accent-red)' : 'var(--accent-green)'
            }}>
              <p style={expenseStyles.expenseAmount}>
                <span style={{ color: expense.transactionType === 'Debit' ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 'bold' }}>
                  {expense.transactionType === 'Debit' ? '-' : '+'}{' '}Rs. {expense.amount ? expense.amount.toFixed(2) : 'N/A'}
                </span>
              </p>
              <p style={expenseStyles.expenseDetails}>
                <strong>{expense.merchant}</strong> - {expense.category}
              </p>
              <p style={expenseStyles.expenseMeta}>
                {new Date(expense.timestamp.seconds * 1000).toLocaleString()}
              </p>
              <p style={expenseStyles.rawSmsDisplay}>
                 Raw SMS: "{expense.rawSms}"
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const expenseStyles = {
  container: {
    padding: '30px',
    backgroundColor: 'var(--background-dark)',
    color: 'var(--text-light)',
    minHeight: 'calc(100vh - 60px)',
    maxWidth: '900px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2.5em',
    color: 'var(--primary-purple)',
    marginBottom: '10px',
    textAlign: 'center',
  },
  description: {
    fontSize: '1.1em',
    color: 'var(--text-secondary)',
    marginBottom: '30px',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'var(--surface-dark)',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '40px',
    border: '1px solid var(--border-color)',
  },
  textarea: {
    width: '100%',
    padding: '15px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '1em',
    minHeight: '120px',
    resize: 'vertical',
    fontFamily: 'inherit',
    backgroundColor: 'var(--background-dark)',
    color: 'var(--text-light)',
  },
  button: {
    backgroundColor: 'var(--primary-purple)',
    color: 'white',
    padding: '12px 25px',
    borderRadius: '8px',
    fontSize: '1.1em',
    fontWeight: 'bold',
  },
  expensesList: {
    width: '100%',
  },
  listTitle: {
    fontSize: '1.8em',
    color: 'var(--text-light)',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
  },
  expenseItem: {
    backgroundColor: 'var(--surface-dark)',
    padding: '25px',
    marginBottom: '20px',
    borderRadius: '15px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    borderLeftWidth: '5px', // Use borderLeftColor dynamically
    borderLeftStyle: 'solid',
    color: 'var(--text-light)',
  },
  expenseAmount: {
    fontSize: '1.4em',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  expenseDetails: {
    fontSize: '1.1em',
    color: 'var(--text-light)',
    marginBottom: '5px',
  },
  expenseMeta: {
    fontSize: '0.9em',
    color: 'var(--text-secondary)',
    marginTop: '10px',
    textAlign: 'right',
  },
  rawSmsDisplay: {
    fontSize: '0.8em',
    color: 'var(--text-secondary)',
    marginTop: '15px',
    borderTop: '1px dashed var(--border-color)',
    paddingTop: '10px',
    wordBreak: 'break-word',
  },
  loading: {
    textAlign: 'center',
    fontSize: '1.5em',
    marginTop: '50px',
    color: 'var(--text-light)',
  },
  error: {
    textAlign: 'center',
    fontSize: '1.1em',
    marginTop: '20px',
    color: 'var(--accent-red)',
  },
  noUser: {
    textAlign: 'center',
    fontSize: '1.1em',
    marginTop: '50px',
    color: 'var(--text-secondary)',
  },
  noExpenses: {
    textAlign: 'center',
    fontSize: '1em',
    color: 'var(--text-secondary)',
    padding: '20px',
    backgroundColor: 'var(--surface-dark)',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  }
};

export default ExpensePage;