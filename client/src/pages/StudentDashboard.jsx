import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import api from '../services/api';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [slots, setSlots] = useState([]);
  const [faculty, setFaculty] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);

  // Load subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/student/subjects');
        setSubjects(res.data.data);
      } catch {
        toast.error('Failed to load subjects.');
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  // Load slots when subject changes
  useEffect(() => {
    if (!selectedSubject) {
      setSlots([]);
      setSelectedSlot('');
      setSelectedFaculty('');
      return;
    }
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.get('/student/slots');
        setSlots(res.data.data);
      } catch {
        toast.error('Failed to load slots.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedSubject]);

  // Load faculty when slot changes
  useEffect(() => {
    if (!selectedSlot) {
      setFaculty([]);
      setSelectedFaculty('');
      return;
    }
    const fetchFaculty = async () => {
      setLoadingFaculty(true);
      try {
        const res = await api.get('/student/faculty');
        setFaculty(res.data.data);
      } catch {
        toast.error('Failed to load faculty.');
      } finally {
        setLoadingFaculty(false);
      }
    };
    fetchFaculty();
  }, [selectedSlot]);

  const handleJoinRoom = async () => {
    if (!selectedSubject || !selectedSlot || !selectedFaculty) {
      toast.error('Please select Subject, Slot, and Faculty.');
      return;
    }
    setJoiningRoom(true);
    try {
      const res = await api.post('/rooms/find-or-create', {
        subjectId: selectedSubject,
        slotId: selectedSlot,
        facultyId: selectedFaculty,
      });
      const roomId = res.data.data.roomId;
      navigate(`/room/${roomId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join room.');
    } finally {
      setJoiningRoom(false);
    }
  };

  const subjectName = subjects.find((s) => s._id === selectedSubject)?.name;
  const slotLabel = slots.find((s) => s._id === selectedSlot)?.label;
  const facultyName = faculty.find((f) => f._id === selectedFaculty)?.name;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join a Discussion Room</h1>
          <p className="text-gray-400">
            Select your Subject, Slot, and Faculty to enter the chat room for your class.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          {/* Subject dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              1. Select Subject
            </label>
            {loadingSubjects ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-3">
                <Spinner size="sm" /> Loading subjects...
              </div>
            ) : (
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedSlot('');
                  setSelectedFaculty('');
                }}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">— Select a subject —</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Slot dropdown */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${selectedSubject ? 'text-gray-300' : 'text-gray-600'}`}>
              2. Select Slot
            </label>
            {loadingSlots ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-3">
                <Spinner size="sm" /> Loading slots...
              </div>
            ) : (
              <select
                value={selectedSlot}
                onChange={(e) => {
                  setSelectedSlot(e.target.value);
                  setSelectedFaculty('');
                }}
                disabled={!selectedSubject}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">— Select a slot —</option>
                {slots.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.label} ({s.timing})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Faculty dropdown */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${selectedSlot ? 'text-gray-300' : 'text-gray-600'}`}>
              3. Select Faculty
            </label>
            {loadingFaculty ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-3">
                <Spinner size="sm" /> Loading faculty...
              </div>
            ) : (
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                disabled={!selectedSlot}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">— Select faculty —</option>
                {faculty.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Room preview */}
          {selectedSubject && selectedSlot && selectedFaculty && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-indigo-300 text-sm font-medium mb-1">Room Preview</p>
              <p className="text-white font-semibold">
                {subjectName} · {slotLabel} · {facultyName}
              </p>
            </div>
          )}

          {/* Join button */}
          <button
            onClick={handleJoinRoom}
            disabled={!selectedSubject || !selectedSlot || !selectedFaculty || joiningRoom}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {joiningRoom ? <Spinner size="sm" /> : null}
            {joiningRoom ? 'Joining...' : '🚀 Join Chat Room'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
