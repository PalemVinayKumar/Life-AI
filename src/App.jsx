// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'; // Added useLocation
import { auth } from './firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Pages and Components
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import PlannerPage from './pages/PlannerPage';
import ExpensePage from './pages/ExpensePage';

// Main App Component with new layout
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={appStyles.loading}>Loading application...</div>;
  }

  return (
    <Router>
      <AppLayout user={user}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage user={user} /></ProtectedRoute>} />
          <Route path="/planner" element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><ExpensePage /></ProtectedRoute>} />
          {/* Add more protected routes for other features here */}
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;

// AppLayout Component (New for the sidebar and main content structure)
const AppLayout = ({ children, user }) => {
  const location = useLocation(); // Hook to get current path
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Optionally redirect to login or home after logout
    } catch (error) {
      console.error("Logout error:", error.message);
      alert("Failed to log out.");
    }
  };

  // Only show sidebar if user is logged in AND not on auth page
  const showSidebar = user && location.pathname !== '/auth';

  return (
    <div style={appStyles.container}>
      {showSidebar && (
        <div style={appStyles.sidebar}>
          <div style={appStyles.sidebarHeader}>
            <h2 style={appStyles.logo}>LIFE OS</h2>
          </div>
          <nav style={appStyles.navbarNav}>
            <Link to="/" style={appStyles.navLink(location.pathname === '/')}>Dashboard</Link>
            <Link to="/planner" style={appStyles.navLink(location.pathname === '/planner')}>AI Day Planner</Link>
            <Link to="/expenses" style={appStyles.navLink(location.pathname === '/expenses')}>Expense Tracker</Link>
            {/* Add more navigation links here for new features */}
            {/* <Link to="/meals" style={appStyles.navLink(location.pathname === '/meals')}>Meal & Grocery</Link> */}
            {/* <Link to="/health" style={appStyles.navLink(location.pathname === '/health')}>Health Tracker</Link> */}
          </nav>
          {user && (
            <div style={appStyles.sidebarFooter}>
              <div style={appStyles.userInfo}>
                <span style={appStyles.userAvatar}>{user.email ? user.email[0].toUpperCase() : 'U'}</span>
                <span style={appStyles.userEmail}>{user.email}</span>
              </div>
              <button onClick={handleLogout} style={appStyles.logoutButton}>
                Logout
              </button>
            </div>
          )}
        </div>
      )}
      <main style={appStyles.mainContent(showSidebar)}>
        {children}
      </main>
    </div>
  );
};

// HomePage (minimal, will serve as the "Dashboard" similar to OKYAI's main screen)
const HomePage = ({ user }) => {
  return (
    <div style={homePageStyles.container}>
      <h1 style={homePageStyles.greeting}>Good Morning, {user.email.split('@')[0]}!</h1>
      <p style={homePageStyles.welcomeText}>Welcome to your personal Day-to-Day Copilot.</p>

      {/* Services Section (placeholder) */}
      <div style={homePageStyles.section}>
        <h2 style={homePageStyles.sectionTitle}>Services</h2>
        <div style={homePageStyles.servicesGrid}>
          <div style={homePageStyles.serviceCard}>AI Chat</div>
          <div style={homePageStyles.serviceCard}>PDF Analysis</div>
          <div style={homePageStyles.serviceCard}>Writing Assistant</div>
          <div style={homePageStyles.serviceCard}>Ideation</div>
          <div style={homePageStyles.serviceCard}>Lifestyle</div>
        </div>
      </div>

      {/* Automation Section (placeholder, can link to Planner/Expenses) */}
      <div style={homePageStyles.section}>
        <h2 style={homePageStyles.sectionTitle}>Automation</h2>
        <div style={homePageStyles.automationGrid}>
          <Link to="/planner" style={homePageStyles.automationCard}>
            <h3>AI Day Planning</h3>
            <p>Generate your daily schedule based on your input.</p>
            <button style={{...homePageStyles.automationButton, backgroundColor: 'var(--primary-purple)'}}>Go to Planner</button>
          </Link>
          <Link to="/expenses" style={homePageStyles.automationCard}>
            <h3>Expense Tracking</h3>
            <p>Track your spending via UPI SMS simulation.</p>
            <button style={{...homePageStyles.automationButton, backgroundColor: 'var(--primary-purple)'}}>Go to Expenses</button>
          </Link>
          {/* Add more automation cards as you build features */}
          {/* <div style={homePageStyles.automationCard}>
            <h3>Groceries List</h3>
            <p>Automate your grocery shopping list.</p>
            <button style={homePageStyles.automationButton}>Generate</button>
          </div> */}
        </div>
      </div>

      {/* Automation Recent Chats (placeholder) */}
      <div style={homePageStyles.section}>
        <h2 style={homePageStyles.sectionTitle}>Recent Interactions</h2>
        <div style={homePageStyles.recentChats}>
          <p style={homePageStyles.recentChatItem}>• Processed "Wedding, test, meeting" plan.</p>
          <p style={homePageStyles.recentChatItem}>• Tracked "Swiggy dinner" expense.</p>
          {/* Dynamically load recent interactions here from Firestore */}
        </div>
      </div>
    </div>
  );
};


// UI Styles
const sidebarWidth = '250px';

const appStyles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--background-dark)',
  },
  sidebar: {
    width: sidebarWidth,
    backgroundColor: 'var(--surface-dark)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.2)',
    position: 'fixed', // Fixed sidebar
    height: '100%', // Full height
  },
  sidebarHeader: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border-color)',
  },
  logo: {
    color: 'var(--primary-purple)',
    fontSize: '2em',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 0,
  },
  navbarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexGrow: 1, // Pushes footer to bottom
  },
  navLink: (isActive) => ({
    color: isActive ? 'var(--text-light)' : 'var(--text-secondary)',
    backgroundColor: isActive ? 'var(--primary-purple)' : 'transparent',
    padding: '12px 15px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '1.05em',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    fontWeight: isActive ? 'bold' : 'normal',
    ':hover': {
        backgroundColor: isActive ? 'var(--primary-purple-hover)' : 'rgba(255, 255, 255, 0.08)',
        color: 'var(--text-light)',
    }
  }),
  sidebarFooter: {
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userAvatar: {
    backgroundColor: 'var(--primary-purple)',
    color: 'white',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '1.2em',
    fontWeight: 'bold',
  },
  userEmail: {
    color: 'var(--text-light)',
    fontSize: '0.9em',
  },
  logoutButton: {
    backgroundColor: 'var(--accent-red)',
    color: 'white',
    padding: '8px 15px',
    borderRadius: '5px',
    fontSize: '0.9em',
  },
  mainContent: (showSidebar) => ({
    flexGrow: 1,
    padding: '30px',
    marginLeft: showSidebar ? sidebarWidth : '0', // Adjust margin based on sidebar visibility
    transition: 'margin-left 0.3s ease',
  }),
  loading: {
    textAlign: 'center',
    fontSize: '1.5em',
    marginTop: '50px',
    color: 'var(--text-light)',
  },
};

const homePageStyles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  greeting: {
    fontSize: '2.8em',
    color: 'var(--text-light)',
    marginBottom: '5px',
  },
  welcomeText: {
    fontSize: '1.2em',
    color: 'var(--text-secondary)',
    marginBottom: '40px',
  },
  section: {
    marginBottom: '50px',
  },
  sectionTitle: {
    fontSize: '1.8em',
    color: 'var(--text-light)',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '20px',
  },
  serviceCard: {
    backgroundColor: 'var(--surface-dark)',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '1.1em',
    fontWeight: 'bold',
    color: 'var(--primary-purple)',
    border: '1px solid var(--border-color)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
    }
  },
  automationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '25px',
  },
  automationCard: {
    backgroundColor: 'var(--surface-dark)',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid var(--primary-purple)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    color: 'var(--text-light)',
    textDecoration: 'none',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
    },
    '& h3': {
        margin: '0 0 10px 0',
        color: 'var(--primary-purple)',
        fontSize: '1.4em',
    },
    '& p': {
        color: 'var(--text-secondary)',
        fontSize: '0.95em',
        marginBottom: '20px',
    }
  },
  automationButton: {
    backgroundColor: 'var(--primary-purple)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    marginTop: 'auto', // Pushes button to bottom of card
    alignSelf: 'flex-start',
  },
  recentChats: {
    backgroundColor: 'var(--surface-dark)',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
  },
  recentChatItem: {
    fontSize: '0.95em',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  }
};