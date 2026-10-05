import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const AdminOTP = () => {
  const { fetchMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const inputRefs = useRef([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/admin/login', { replace: true });
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatCountdown = () => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // OTP input handling — auto-advance
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/admin/verify-otp', { email, otp: otpString });
      await fetchMe();
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/admin/request-otp', { email });
      toast.success('New OTP sent!');
      setCountdown(300);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      toast.error('Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
              <span className="text-2xl">✉️</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Enter OTP</h1>
            <p className="text-gray-400 text-sm mt-1">
              Sent to <span className="text-amber-400 font-medium">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input boxes */}
            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  disabled={submitting}
                />
              ))}
            </div>

            {/* Countdown */}
            <p className="text-center text-sm text-gray-500">
              {countdown > 0 ? (
                <>OTP expires in <span className="text-amber-400 font-mono">{formatCountdown()}</span></>
              ) : (
                <span className="text-red-400">OTP expired</span>
              )}
            </p>

            <button
              type="submit"
              disabled={submitting || otp.join('').length !== 6}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {submitting ? <Spinner size="sm" /> : null}
              {submitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleResend}
              disabled={resending || countdown > 240}
              className="text-sm text-gray-500 hover:text-amber-400 disabled:text-gray-700 disabled:cursor-not-allowed transition-colors"
            >
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          </div>

          <p className="text-center text-gray-600 text-xs mt-4">
            <Link to="/admin/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              ← Back to email entry
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminOTP;
