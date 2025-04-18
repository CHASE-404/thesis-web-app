import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { ref, update, get, remove, set } from 'firebase/database';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, updatePassword } from 'firebase/auth';
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
    
    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be between 4 and 6 digits');
      return;
    }
    
    try {
      const email = formatPhoneToEmail(phoneNumber);
      
      // Check if there's a pending reset for this phone number
      const resetsRef = ref(db, 'pin_resets');
      const resetSnapshot = await get(resetsRef);
      
      let resetUserId = null;
      let resetData = null;
      
      if (resetSnapshot.exists()) {
        resetSnapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          if (data.phoneNumber === phoneNumber && !data.applied) {
            resetUserId = childSnapshot.key;
            resetData = data;
          }
        });
      }
      
      // If there's a pending reset, try to sign in with the new PIN
      if (resetData && pin === resetData.newPin) {
        try {
          // Try to sign in with the new PIN
          const userCredential = await signInWithEmailAndPassword(auth, email, pin);
          
          // If successful, mark the reset as applied and remove it
          if (resetUserId) {
            await remove(ref(db, `pin_resets/${resetUserId}`));
          }
          
          onLogin();
          return;
        } catch (newPinError) {
          // If signing in with the new PIN fails, we need to update the auth record
          console.error('Error signing in with new PIN:', newPinError);
          
          // We'll try a different approach below
        }
      }
      
      // Try to sign in with the provided PIN (could be old or new)
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pin);
        
        // If login is successful and there's a pending reset,
        // update the password to the new PIN
        if (resetData && resetUserId) {
          try {
            await updatePassword(userCredential.user, resetData.newPin);
            await remove(ref(db, `pin_resets/${resetUserId}`));
            alert('Your PIN has been updated successfully! Please use your new PIN next time.');
          } catch (updateError) {
            console.error('Error updating PIN:', updateError);
          }
        }
        
        onLogin();
      } catch (signInError) {
        // If regular sign-in fails and there's a pending reset, we need to handle it differently
        if (resetData && resetUserId) {
          setError('Please use your new PIN to log in. If you\'re having trouble, please contact support.');
        } else {
          // Normal error handling
          if (signInError.code === 'auth/user-not-found') {
            setError('No account found with this phone number. Please sign up first.');
          } else if (signInError.code === 'auth/wrong-password') {
            setError('Incorrect PIN. Please try again.');
          } else {
            setError('Login failed. Please check your phone number and PIN.');
          }
        }
      }
    } catch (error) {
      console.error('Error in login process:', error);
      setError('An unexpected error occurred. Please try again later.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!userName) {
      setError('Please enter your name');
      return;
    }
    
    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be between 4 and 6 digits');
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
      if (error.code === 'auth/email-already-in-use') {
        setError('This phone number is already registered. Please login instead.');
      } else {
        setError('Sign up failed. Please try again with a different phone number.');
      }
    }
  };

  const toggleAuthMode = () => {
    setIsNewUser(!isNewUser);
    setError('');
    setPhoneNumber('');
    setPin('');
    setUserName('');
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
                This will be used to access your account
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
            <button type="submit" className="login-button">Create Account</button>
            
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
              <small className="phone-hint">
                Enter the phone number you registered with
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
                  Create Account
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