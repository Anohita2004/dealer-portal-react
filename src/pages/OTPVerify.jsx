import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function OTPVerify({ userId }) {
  const { verifyOTP } = useContext(AuthContext);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await verifyOTP(userId, otp);
      navigate("/dashboard"); // ✅ user now logged in
    } catch (err) {
      setError(err.response?.data?.error || "OTP verification failed");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h2>Verify OTP</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <form onSubmit={handleVerify}>
        <input
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
}
