// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { auth } from './firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import HomePage from './pages/HomePage';
import PlannerPage from './pages/PlannerPage';
import ExpensePage from './pages/ExpensePage';
import SettingsPage from './pages/SettingsPage';
import AuthDetails from './components/AuthDetails'; // Assuming this component exists for sign out etc.
import ProtectedRoute from './components/ProtectedRoute'; // Assuming this component exists
import AIChatPage from './pages/AIChatPage'; // <-- NEW IMPORT

// Main App Component
function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

// Layout Component (contains Navbar and routes)
function AppLayout() {
  const [user, loading, error] = useAuthState(auth);
  const location = useLocation(); // To get current path for active link styling

  // Define styles directly within the component for easier management
  const appStyles = {
    appContainer: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--background-dark)',
      color: 'var(--text-light)',
      fontFamily: 'Inter, sans-serif',
    },
    sidebar: {
      width: '250px',
      backgroundColor: 'var(--surface-dark)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
      borderRight: '1px solid var(--border-color)',
      position: 'sticky', // Makes sidebar stick on scroll
      top: 0,
      height: '100vh', // Ensures sidebar takes full height
      overflowY: 'auto', // Scrollable sidebar if content overflows
    },
    logo: {
      fontSize: '1.8em',
      fontWeight: 'bold',
      color: 'var(--primary-purple)',
      marginBottom: '30px',
      textAlign: 'center',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '15px',
    },
    navbarNav: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      flexGrow: 1, // Pushes AuthDetails to the bottom
    },
    navLink: (isActive) => ({
      color: isActive ? 'var(--accent-red)' : 'var(--text-light)',
      textDecoration: 'none',
      padding: '12px 15px',
      borderRadius: '8px',
      backgroundColor: isActive ? 'var(--primary-purple-faded)' : 'transparent',
      fontWeight: isActive ? 'bold' : 'normal',
      transition: 'background-color 0.3s ease, color 0.3s ease',
      '&:hover': {
        backgroundColor: 'var(--primary-purple-faded)',
      },
    }),
    contentArea: {
      flexGrow: 1,
      padding: '0px', // Pages will handle their own padding
    },
    authDetailsContainer: {
      marginTop: 'auto', // Pushes AuthDetails to the bottom of the sidebar
      paddingTop: '20px',
      borderTop: '1px solid var(--border-color)',
    },
    mainContent: {
      flex: 1, // Takes up remaining space
      overflowY: 'auto', // Allows content to scroll
      padding: '20px',
    }
  };

  if (loading) {
    return (
      <div style={{...appStyles.appContainer, justifyContent: 'center', alignItems: 'center', fontSize: '1.5em', color: 'var(--text-light)'}}>
        Loading application...
      </div>
    );
  }

  // If user is not logged in, only show sign-in/sign-up pages
  if (!user) {
    return (
      <div style={appStyles.mainContent}>
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          {/* Redirect any other path to sign-in if not authenticated */}
          <Route path="*" element={<SignInPage />} />
        </Routes>
      </div>
    );
  }

  // If user is logged in, show full layout with sidebar
  return (
    <div style={appStyles.appContainer}>
      {/* Sidebar */}
      <nav style={appStyles.sidebar}>
        <div style={appStyles.logo}>LIFE OS</div>
        <div style={appStyles.navbarNav}>
          <Link to="/" style={appStyles.navLink(location.pathname === '/')}>Dashboard</Link>
          <Link to="/planner" style={appStyles.navLink(location.pathname === '/planner')}>AI Day Planner</Link>
          <Link to="/expenses" style={appStyles.navLink(location.pathname === '/expenses')}>Expense Tracker</Link>
          <Link to="/chat" style={appStyles.navLink(location.pathname === '/chat')}>AI Chat</Link> {/* <-- NEW LINK */}
          <Link to="/settings" style={appStyles.navLink(location.pathname === '/settings')}>Settings</Link>
        </div>
        <div style={appStyles.authDetailsContainer}>
          <AuthDetails /> {/* Displays user info and sign out button */}
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={appStyles.contentArea}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/planner" element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><ExpensePage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><AIChatPage /></ProtectedRoute>} /> {/* <-- NEW ROUTE */}
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          {/* Fallback for unknown routes - redirects to dashboard if logged in */}
          <Route path="*" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

// HomePage Component (defined here for completeness, assuming it was already in App.jsx)
function HomePage() {
  const homePageStyles = {
    homeContainer: {
      padding: '30px',
      backgroundColor: 'var(--background-dark)',
      color: 'var(--text-light)',
      minHeight: 'calc(100vh - 60px)', // Adjust for potential header/footer
      maxWidth: '1200px', // Max width for content
      margin: '0 auto', // Center content
    },
    header: {
      marginBottom: '40px',
      textAlign: 'center',
    },
    welcomeText: {
      fontSize: '3em',
      color: 'var(--primary-purple)',
      marginBottom: '10px',
    },
    subHeaderText: {
      fontSize: '1.2em',
      color: 'var(--text-secondary)',
    },
    section: {
      marginBottom: '50px',
    },
    sectionTitle: {
      fontSize: '2em',
      color: 'var(--text-light)',
      marginBottom: '25px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '10px',
    },
    automationGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '25px',
    },
    automationCard: {
      backgroundColor: 'var(--surface-dark)',
      padding: '25px',
      borderRadius: '15px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
      textAlign: 'center',
      border: '1px solid var(--border-color)',
      textDecoration: 'none', // For Link component
      color: 'inherit', // For Link component
      transition: 'transform 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-5px)',
      },
    },
    automationButton: {
      marginTop: '15px',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      backgroundColor: 'var(--primary-purple)',
      color: 'white',
      cursor: 'pointer',
      fontSize: '1em',
      transition: 'background-color 0.3s ease',
      '&:hover': {
        backgroundColor: 'var(--primary-purple-darker)',
      },
    },
    servicesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '20px',
    },
    serviceCard: {
      backgroundColor: 'var(--surface-dark)',
      padding: '20px',
      borderRadius: '15px',
      boxShadow: '0 5px 10px rgba(0, 0, 0, 0.15)',
      textAlign: 'center',
      fontSize: '1.1em',
      fontWeight: 'bold',
      color: 'var(--primary-purple)',
      border: '1px solid var(--border-color)',
      transition: 'transform 0.2s ease-in-out',
      textDecoration: 'none', // For Link component
      '&:hover': {
        transform: 'translateY(-3px)',
        backgroundColor: 'var(--primary-purple-faded)',
      },
    }
  };

  return (
    <div style={homePageStyles.homeContainer}>
      <header style={homePageStyles.header}>
        <h1 style={homePageStyles.welcomeText}>Welcome to LIFE OS!</h1>
        <p style={homePageStyles.subHeaderText}>Your personal AI-powered operating system for life.</p>
      </header>

      {/* Automation Section */}
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
          <Link to="/chat" style={homePageStyles.automationCard}> {/* New card for chat */}
            <h3>AI Conversation</h3>
            <p>Talk to your personal AI assistant.</p>
            <button style={{...homePageStyles.automationButton, backgroundColor: 'var(--primary-purple)'}}>Start Chat</button>
          </Link>
          {/* Placeholder for more automation features */}
          <div style={homePageStyles.automationCard}>
            <h3>Health & Fitness</h3>
            <p>Track your wellness and fitness goals.</p>
            <button style={homePageStyles.automationButton}>Coming Soon</button>
          </div>
          <div style={homePageStyles.automationCard}>
            <h3>Meal & Grocery Planning</h3>
            <p>Plan your meals and generate grocery lists.</p>
            <button style={homePageStyles.automationButton}>Coming Soon</button>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div style={homePageStyles.section}>
        <h2 style={homePageStyles.sectionTitle}>Services</h2>
        <div style={homePageStyles.servicesGrid}>
          <Link to="/chat" style={homePageStyles.serviceCard}>AI Chat</Link> {/* Added Link */}
          <div style={homePageStyles.serviceCard}>PDF Analysis</div> {/* Will link this later */}
          <div style={homePageStyles.serviceCard}>Writing Assistant</div>
          <div style={homePageStyles.serviceCard}>Ideation</div>
          <div style={homePageStyles.serviceCard}>Lifestyle</div>
          <div style={homePageStyles.serviceCard}>Research</div>
        </div>
      </div>
    </div>
  );
}


export default App;