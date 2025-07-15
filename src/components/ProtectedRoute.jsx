// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase/config'; // Import the auth object
import { onAuthStateChanged } from 'firebase/auth';
import { Navigate } from 'react-router-dom'; // For redirection

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Clean up the subscription when the component unmounts
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading authentication...</div>; // Simple loading indicator
  }

  // If user is not logged in, redirect to the login page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is logged in, render the children components
  return children;
};

export default ProtectedRoute;