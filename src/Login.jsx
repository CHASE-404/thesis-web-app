import React, { useState } from 'react';
import { auth, db, ref, update } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import ResetPin from './ResetPin';
import './Login.css';

function Login({ onLogin }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [showResetPin, setShowResetPin] = useState(false);
  
  // Format phone number to email format for Firebase Auth
  const formatPhoneToEmail = (number) => {
    // Remove any non-digit characters
    const digits = number.replace(/\D/g, '');
    
    // If it starts with 0, assume it's a Philippine number and replace with 63
    if (digits.startsWith('0')) {
      return '63' + digits.substring(1) + '@hydro.app';
    }
    
    // If it might already have the country code
    if (digits.startsWith('63')) {
      return digits + '@hydro.app';
    }
    
    // Default case
    return '63' + digits + '@hydro.app';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const email = formatPhoneToEmail(phoneNumber);
      
      // For login, we use the standard email/password auth with PIN as password
      await signInWithEmailAndPassword(auth, email, pin);
      onLogin();
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Login failed. Please check your phone number and PIN.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!userName) {
      setError('Please enter your name');
      return;
    }
    
    try {
      const email = formatPhoneToEmail(phoneNumber);
      
      // Create user with email (phone) and PIN as password
      const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
      
      // Update the user profile with the display name
      await updateProfile(userCredential.user, {
        displayName: userName
      });
      
      // Store additional user data in the database
      const userRef = ref(db, `users/${userCredential.user.uid}`);
      await update(userRef, {
        name: userName,
        phoneNumber: phoneNumber,
        createdAt: new Date().toISOString()
      });
      
      onLogin();
    } catch (error) {
      console.error('Error signing up:', error);
      setError('Sign up failed. This phone number might already be registered.');
    }
  };

  const toggleAuthMode = () => {
    setIsNewUser(!isNewUser);
    setError('');
  };

  if (showResetPin) {
    return (
      <ResetPin 
        onBack={() => setShowResetPin(false)} 
        onComplete={() => setShowResetPin(false)}
      />
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🌿 Hydroponics Monitoring</h2>
        <h3>{isNewUser ? 'Sign Up' : 'Login'}</h3>
        
        {isNewUser ? (
          <form onSubmit={handleSignUp}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09XXXXXXXXX or 639XXXXXXXX"
                required
              />
              <small className="phone-hint">
                Enter your number with or without the leading zero
              </small>
            </div>
            <div className="form-group">
              <label>PIN Code</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="6"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Create a 4-6 digit PIN"
                required
              />
              <small className="phone-hint">
                Use a 4-6 digit number you can easily remember
              </small>
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button">Complete Sign Up</button>
            
            <p className="auth-toggle">
              Already have an account?
              <button 
                type="button" 
                className="toggle-button" 
                onClick={toggleAuthMode}
              >
                Login
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09XXXXXXXXX or 639XXXXXXXX"
                required
              />
            </div>
            <div className="form-group">
              <label>PIN Code</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="6"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
                required
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button">Login</button>
            
            <div className="auth-options">
              <p className="auth-toggle">
                Don't have an account?
                <button 
                  type="button" 
                  className="toggle-button" 
                  onClick={toggleAuthMode}
                >
                  Sign Up
                </button>
              </p>
              <p className="forgot-pin">
                <button 
                  type="button" 
                  className="toggle-button" 
                  onClick={() => setShowResetPin(true)}
                >
                  Forgot PIN?
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;