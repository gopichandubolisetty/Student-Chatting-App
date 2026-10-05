import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const AdminLogin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/admin/request-otp', { email: email.trim() });
      toast.success('OTP sent (check your email).');
      navigate('/admin/otp', { state: { email: email.trim() } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
              <span className="text-amber-950 font-bold text-xl">🛡</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
            <p className="text-gray-400 text-sm mt-1">CampusConnect Administration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@university.ac.in"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                required
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {submitting ? <Spinner size="sm" /> : null}
              {submitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-xs mt-6">
            Student?{' '}
            <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Student Login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
