// src/pages/PlannerPage.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'; // Removed where as it wasn't used
import { useAuthState } from 'react-firebase-hooks/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const processUserPlanCallable = httpsCallable(functions, 'processUserPlan');

const PlannerPage = () => {
  const [user, loading, error] = useAuthState(auth);
  const [planInput, setPlanInput] = useState('');
  const [plans, setPlans] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (user) {
      setFetchError('');
      const userPlansCollectionRef = collection(db, 'plans', user.uid, 'userPlans');
      const q = query(userPlansCollectionRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPlans = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlans(fetchedPlans);
      }, (err) => {
        console.error("Error fetching plans:", err);
        setFetchError("Failed to load plans. Please try again.");
      });

      return () => unsubscribe();
    } else {
      setPlans([]);
    }
  }, [user]);

  const handleAddPlan = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!planInput.trim() || !user) {
      setSubmitError("Please enter a plan and ensure you are logged in.");
      return;
    }

    setSubmitLoading(true);
    try {
      const result = await processUserPlanCallable({ planInput });
      console.log("Cloud Function response:", result.data);
      if (result.data.status === 'success') {
        alert('Plan processed by AI and saved!');
        setPlanInput('');
      } else {
        setSubmitError(result.data.message || 'Failed to process plan via AI.');
      }
    } catch (err) {
      console.error("Error calling Cloud Function:", err);
      const errorMessage = err.message || "An unexpected error occurred while contacting the AI service.";
      setSubmitError(`Failed to process plan: ${errorMessage}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div style={plannerStyles.loading}>Loading planner...</div>;
  }

  if (error) {
    return <div style={plannerStyles.error}>Error: {error.message}</div>;
  }

  if (!user) {
    return <div style={plannerStyles.noUser}>Please log in to use the AI Day Planner.</div>;
  }

  return (
    <div style={plannerStyles.container}>
      <h2 style={plannerStyles.title}>AI Smart Day Planner</h2>
      <p style={plannerStyles.description}>Tell your LIFE OS about your plans for the day/week. The AI will help organize them.</p>

      <form onSubmit={handleAddPlan} style={plannerStyles.form}>
        <textarea
          style={plannerStyles.textarea}
          placeholder="e.g., Tomorrow morning I need to review for my exam at 9 AM and then have a call with my manager at 11:30 AM. In the evening, I want to go for a run."
          value={planInput}
          onChange={(e) => setPlanInput(e.target.value)}
          rows="4"
        ></textarea>
        <button type="submit" style={plannerStyles.button} disabled={submitLoading}>
          {submitLoading ? 'Processing with AI...' : 'Add Plan with AI'}
        </button>
        {submitError && <p style={plannerStyles.error}>{submitError}</p>}
      </form>

      {fetchError && <p style={plannerStyles.error}>{fetchError}</p>}

      <div style={plannerStyles.plansList}>
        <h3 style={plannerStyles.listTitle}>Your AI-Organized Plans:</h3>
        {plans.length === 0 ? (
          <p style={plannerStyles.noPlans}>No plans added yet. Start by typing above!</p>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} style={plannerStyles.planItem}>
              <p style={plannerStyles.rawInputText}>
                <strong>Your Input:</strong> {plan.rawInput}
              </p>
              {plan.parsedSchedule && Array.isArray(plan.parsedSchedule) && plan.parsedSchedule.length > 0 ? (
                <div style={plannerStyles.parsedScheduleContainer}>
                  <strong>AI-Parsed Schedule:</strong>
                  {plan.parsedSchedule.map((item, index) => (
                    <div key={index} style={plannerStyles.parsedScheduleItem}>
                      <p><strong>Time:</strong> {item.time}</p>
                      <p><strong>Description:</strong> {item.description}</p>
                      <p><strong>Category:</strong> {item.category}</p>
                      <p><strong>Priority:</strong> {item.priority}</p>
                    </div>
                  ))}
                </div>
              ) : plan.parsedSchedule && plan.parsedSchedule.error ? (
                <p style={plannerStyles.parseError}>AI Parsing Error: {plan.parsedSchedule.raw}</p>
              ) : (
                <p style={plannerStyles.noParsedSchedule}>No AI-parsed schedule available.</p>
              )}
              <p style={plannerStyles.planMeta}>
                Added on: {plan.timestamp ? new Date(plan.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const plannerStyles = {
  container: {
    padding: '30px',
    backgroundColor: 'var(--background-dark)', // Use global background
    color: 'var(--text-light)', // Use global text color
    minHeight: 'calc(100vh - 60px)', // Adjust for potential header/footer
    maxWidth: '900px', // Constrain width
    margin: '0 auto', // Center content
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
    backgroundColor: 'var(--surface-dark)', // Card background
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
    backgroundColor: 'var(--background-dark)', // Darker input background
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
  plansList: {
    width: '100%',
  },
  listTitle: {
    fontSize: '1.8em',
    color: 'var(--text-light)',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
  },
  planItem: {
    backgroundColor: 'var(--surface-dark)', // Card background
    padding: '25px',
    marginBottom: '20px',
    borderRadius: '15px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    borderLeft: '5px solid var(--primary-purple)', // Accent border
    color: 'var(--text-light)',
  },
  rawInputText: {
    fontSize: '1em',
    marginBottom: '15px',
    color: 'var(--text-secondary)',
    borderBottom: '1px dashed var(--border-color)',
    paddingBottom: '10px',
  },
  parsedScheduleContainer: {
    marginTop: '15px',
  },
  parsedScheduleItem: {
    backgroundColor: 'var(--background-dark)', // Even darker for nested items
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '10px',
    fontSize: '0.95em',
    color: 'var(--text-light)',
  },
  noParsedSchedule: {
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    marginTop: '15px',
    borderTop: '1px dashed var(--border-color)',
    paddingTop: '15px',
  },
  parseError: {
    color: 'var(--accent-red)',
    marginTop: '15px',
    borderTop: '1px dashed var(--border-color)',
    paddingTop: '15px',
    fontSize: '0.95em',
  },
  planMeta: {
    fontSize: '0.9em',
    color: 'var(--text-secondary)',
    marginTop: '20px',
    textAlign: 'right',
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
  noPlans: {
    textAlign: 'center',
    fontSize: '1em',
    color: 'var(--text-secondary)',
    padding: '20px',
    backgroundColor: 'var(--surface-dark)',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  }
};

export default PlannerPage;