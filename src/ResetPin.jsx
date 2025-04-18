import React, { useState } from 'react';
import { auth, db } from './firebase';
import { ref, update, get, set } from 'firebase/database';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import './ResetPin.css';

function ResetPin({ onBack, onComplete }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'verification', or 'newPin'
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');

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

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      const email = formatPhoneToEmail(phoneNumber);
      
      // Check if user exists in Firebase
      const userRef = ref(db, 'users');
      const snapshot = await get(userRef);
      let userExists = false;
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.phoneNumber === phoneNumber) {
            userExists = true;
          }
        });
      }
      
      if (!userExists) {
        setError('No account found with this phone number.');
        return;
      }
      
      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedCode(code);
      
      console.log('Verification code:', code);
      
      // Display the code in the UI for testing purposes
      setMessage(`Verification code sent! use this code: ${code}`);
      setStep('verification');
    } catch (error) {
      console.error('Error sending verification code:', error);
      setError('Failed to send verification code. Please check your phone number and try again.');
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    
    // For demo purposes, we'll accept any code
    // In a real app, you would verify against the code sent via SMS
    if (verificationCode === simulatedCode) {
      setMessage('Phone number verified successfully!');
      setStep('newPin');
    } else {
      setError('Invalid verification code. Please try again.');
    }
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (newPin !== confirmPin) {
      setError('PINs do not match. Please try again.');
      return;
    }
    
    if (newPin.length < 4 || newPin.length > 6) {
      setError('PIN must be between 4 and 6 digits.');
      return;
    }
    
    try {
      const email = formatPhoneToEmail(phoneNumber);
  
      // Find the user in the database to confirm they exist
      const userRef = ref(db, 'users');
      const snapshot = await get(userRef);
  
      let userId = null;
  
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.phoneNumber === phoneNumber) {
            userId = childSnapshot.key;
          }
        });
      }
  
      if (!userId) {
        setError('User not found. Please try again.');
        return;
      }
      
      // First, store the reset information in the database
      const resetRef = ref(db, `pin_resets/${userId}`);
      await set(resetRef, {
        newPin: newPin,
        phoneNumber: phoneNumber,
        timestamp: new Date().toISOString(),
        applied: false
      });

      // For this demo, we'll tell the user to use their new PIN
      setMessage('PIN reset successful! You can now log in with your new PIN.');
      
      // After a short delay, redirect to login
      setTimeout(() => {
        onComplete();
      }, 3000);
    } catch (error) {
      console.error('Error updating PIN:', error);
      setError('Failed to update PIN. Please try again.');
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h2>🌿 Hydroponics Monitoring</h2>
        <h3>Forgot Your PIN?</h3>
        <p className="reset-description">
          Enter your phone number to receive a verification code via SMS.
        </p>
        
        {step === 'phone' && (
          <form onSubmit={handleSendCode}>
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
                Enter the phone number you used to register
              </small>
            </div>
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}
            <button type="submit" className="reset-button">Send Verification Code</button>
            <button type="button" className="back-button" onClick={onBack}>
              Back to Login
            </button>
          </form>
        )}
        
        {step === 'verification' && (
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter the code from SMS"
                required
              />
              <small className="phone-hint">
                Enter the 6-digit code sent to your phone
              </small>
            </div>
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}
            <button type="submit" className="reset-button">Verify Code</button>
            <button 
              type="button" 
              className="back-button"
              onClick={() => setStep('phone')}
            >
              Back
            </button>
          </form>
        )}
        
        {step === 'newPin' && (
          <form onSubmit={handleUpdatePin}>
            <div className="form-group">
              <label>New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="6"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter new 4-6 digit PIN"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="6"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm your new PIN"
                required
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}
            <button type="submit" className="reset-button">Update PIN</button>
            <button 
              type="button" 
              className="back-button"
              onClick={() => setStep('verification')}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPin;