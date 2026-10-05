import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Generic CRUD Table ───────────────────────────────────────────────────────

const CrudTable = ({ title, columns, data, loading, onAdd, onEdit, onDelete, renderRow }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <button
        onClick={onAdd}
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
      >
        <span>+</span> Add
      </button>
    </div>
    {loading ? (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    ) : data.length === 0 ? (
      <div className="text-center py-12 text-gray-600">No records found.</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 uppercase text-xs tracking-wider">
              {columns.map((col) => (
                <th key={col} className="px-6 py-3 text-left font-medium">
                  {col}
                </th>
              ))}
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item._id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                {renderRow(item)}
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-medium px-2 py-1 rounded hover:bg-indigo-500/10 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(item._id)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ isActive }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
    }`}
  >
    {isActive ? 'Active' : 'Inactive'}
  </span>
);

// ─── Main AdminDashboard ──────────────────────────────────────────────────────

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subjects');

  // ── Subjects ──
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectModal, setSubjectModal] = useState({ open: false, editing: null });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', isActive: true });
  const [subjectSubmitting, setSubjectSubmitting] = useState(false);

  // ── Slots ──
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotModal, setSlotModal] = useState({ open: false, editing: null });
  const [slotForm, setSlotForm] = useState({ label: '', timing: '', isActive: true });
  const [slotSubmitting, setSlotSubmitting] = useState(false);

  // ── Faculty ──
  const [faculty, setFaculty] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultyModal, setFacultyModal] = useState({ open: false, editing: null });
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', isActive: true });
  const [facultySubmitting, setFacultySubmitting] = useState(false);

  // ── Rooms ──
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // ── Message Feed ──
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomMessages, setRoomMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // ─── Fetch functions ───────────────────────────────────────────────────────

  const fetchSubjects = useCallback(async () => {
    setSubjectsLoading(true);
    try {
      const res = await api.get('/admin/subjects');
      setSubjects(res.data.data);
    } catch { toast.error('Failed to load subjects.'); }
    finally { setSubjectsLoading(false); }
  }, []);

  const fetchSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const res = await api.get('/admin/slots');
      setSlots(res.data.data);
    } catch { toast.error('Failed to load slots.'); }
    finally { setSlotsLoading(false); }
  }, []);

  const fetchFaculty = useCallback(async () => {
    setFacultyLoading(true);
    try {
      const res = await api.get('/admin/faculty');
      setFaculty(res.data.data);
    } catch { toast.error('Failed to load faculty.'); }
    finally { setFacultyLoading(false); }
  }, []);

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const res = await api.get('/admin/rooms');
      setRooms(res.data.data);
    } catch { toast.error('Failed to load rooms.'); }
    finally { setRoomsLoading(false); }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  useEffect(() => {
    if (activeTab === 'slots' && slots.length === 0) fetchSlots();
    if (activeTab === 'faculty' && faculty.length === 0) fetchFaculty();
    if (activeTab === 'rooms') fetchRooms();
  }, [activeTab]);

  // ─── Subject CRUD ──────────────────────────────────────────────────────────

  const openSubjectModal = (item = null) => {
    setSubjectForm(item ? { name: item.name, code: item.code, isActive: item.isActive } : { name: '', code: '', isActive: true });
    setSubjectModal({ open: true, editing: item });
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    setSubjectSubmitting(true);
    try {
      if (subjectModal.editing) {
        await api.put(`/admin/subjects/${subjectModal.editing._id}`, subjectForm);
        toast.success('Subject updated.');
      } else {
        await api.post('/admin/subjects', subjectForm);
        toast.success('Subject created.');
      }
      setSubjectModal({ open: false, editing: null });
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save subject.');
    } finally {
      setSubjectSubmitting(false);
    }
  };

  const handleSubjectDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      toast.success('Subject deleted.');
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  // ─── Slot CRUD ─────────────────────────────────────────────────────────────

  const openSlotModal = (item = null) => {
    setSlotForm(item ? { label: item.label, timing: item.timing, isActive: item.isActive } : { label: '', timing: '', isActive: true });
    setSlotModal({ open: true, editing: item });
  };

  const handleSlotSubmit = async (e) => {
    e.preventDefault();
    setSlotSubmitting(true);
    try {
      if (slotModal.editing) {
        await api.put(`/admin/slots/${slotModal.editing._id}`, slotForm);
        toast.success('Slot updated.');
      } else {
        await api.post('/admin/slots', slotForm);
        toast.success('Slot created.');
      }
      setSlotModal({ open: false, editing: null });
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slot.');
    } finally {
      setSlotSubmitting(false);
    }
  };

  const handleSlotDelete = async (id) => {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await api.delete(`/admin/slots/${id}`);
      toast.success('Slot deleted.');
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  // ─── Faculty CRUD ──────────────────────────────────────────────────────────

  const openFacultyModal = (item = null) => {
    setFacultyForm(item ? { name: item.name, email: item.email, isActive: item.isActive } : { name: '', email: '', isActive: true });
    setFacultyModal({ open: true, editing: item });
  };

  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    setFacultySubmitting(true);
    try {
      if (facultyModal.editing) {
        await api.put(`/admin/faculty/${facultyModal.editing._id}`, facultyForm);
        toast.success('Faculty updated.');
      } else {
        await api.post('/admin/faculty', facultyForm);
        toast.success('Faculty created.');
      }
      setFacultyModal({ open: false, editing: null });
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save faculty.');
    } finally {
      setFacultySubmitting(false);
    }
  };

  const handleFacultyDelete = async (id) => {
    if (!window.confirm('Delete this faculty?')) return;
    try {
      await api.delete(`/admin/faculty/${id}`);
      toast.success('Faculty deleted.');
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  // ─── Room messages ─────────────────────────────────────────────────────────

  const viewRoomMessages = async (room) => {
    setSelectedRoom(room);
    setMessagesLoading(true);
    setActiveTab('messages');
    try {
      const res = await api.get(`/admin/rooms/${room.roomId}/messages`);
      setRoomMessages(res.data.data);
    } catch {
      toast.error('Failed to load messages.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Soft-delete this message?')) return;
    try {
      await api.delete(`/admin/messages/${messageId}`);
      toast.success('Message deleted.');
      setRoomMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true } : m))
      );
    } catch {
      toast.error('Failed to delete message.');
    }
  };

  // ─── Tabs config ───────────────────────────────────────────────────────────

  const tabs = [
    { key: 'subjects', label: '📚 Subjects' },
    { key: 'slots', label: '🕐 Slots' },
    { key: 'faculty', label: '👩‍🏫 Faculty' },
    { key: 'rooms', label: '🏠 Rooms' },
    ...(selectedRoom ? [{ key: 'messages', label: `💬 ${selectedRoom.subject?.name}` }] : []),
  ];

  // ─── Input styles ──────────────────────────────────────────────────────────

  const inputCls = 'w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1.5';
  const checkboxRowCls = 'flex items-center gap-2 mt-1';

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage subjects, slots, faculty, and rooms.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── SUBJECTS ── */}
        {activeTab === 'subjects' && (
          <>
            <CrudTable
              title="Subjects"
              columns={['Name', 'Code', 'Status', 'Created By']}
              data={subjects}
              loading={subjectsLoading}
              onAdd={() => openSubjectModal()}
              onEdit={openSubjectModal}
              onDelete={handleSubjectDelete}
              renderRow={(item) => (
                <>
                  <td className="px-6 py-3 text-white font-medium">{item.name}</td>
                  <td className="px-6 py-3 text-gray-300 font-mono text-xs">{item.code}</td>
                  <td className="px-6 py-3"><StatusBadge isActive={item.isActive} /></td>
                  <td className="px-6 py-3 text-gray-400">{item.createdBy?.name || '—'}</td>
                </>
              )}
            />
            <Modal
              isOpen={subjectModal.open}
              onClose={() => setSubjectModal({ open: false, editing: null })}
              title={subjectModal.editing ? 'Edit Subject' : 'Add Subject'}
            >
              <form onSubmit={handleSubjectSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Subject Name</label>
                  <input type="text" className={inputCls} value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className={labelCls}>Subject Code</label>
                  <input type="text" className={inputCls} value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} required />
                </div>
                <div className={checkboxRowCls}>
                  <input type="checkbox" id="subjectActive" checked={subjectForm.isActive}
                    onChange={(e) => setSubjectForm({ ...subjectForm, isActive: e.target.checked })}
                    className="accent-indigo-500" />
                  <label htmlFor="subjectActive" className="text-sm text-gray-300">Active</label>
                </div>
                <button type="submit" disabled={subjectSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {subjectSubmitting && <Spinner size="sm" />}
                  {subjectModal.editing ? 'Update Subject' : 'Create Subject'}
                </button>
              </form>
            </Modal>
          </>
        )}

        {/* ── SLOTS ── */}
        {activeTab === 'slots' && (
          <>
            <CrudTable
              title="Slots"
              columns={['Label', 'Timing', 'Status']}
              data={slots}
              loading={slotsLoading}
              onAdd={() => openSlotModal()}
              onEdit={openSlotModal}
              onDelete={handleSlotDelete}
              renderRow={(item) => (
                <>
                  <td className="px-6 py-3 text-white font-medium">{item.label}</td>
                  <td className="px-6 py-3 text-gray-300">{item.timing}</td>
                  <td className="px-6 py-3"><StatusBadge isActive={item.isActive} /></td>
                </>
              )}
            />
            <Modal
              isOpen={slotModal.open}
              onClose={() => setSlotModal({ open: false, editing: null })}
              title={slotModal.editing ? 'Edit Slot' : 'Add Slot'}
            >
              <form onSubmit={handleSlotSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Slot Label (e.g. "Slot A1")</label>
                  <input type="text" className={inputCls} value={slotForm.label}
                    onChange={(e) => setSlotForm({ ...slotForm, label: e.target.value })} required />
                </div>
                <div>
                  <label className={labelCls}>Timing (e.g. "08:00 – 09:00")</label>
                  <input type="text" className={inputCls} value={slotForm.timing}
                    onChange={(e) => setSlotForm({ ...slotForm, timing: e.target.value })} required />
                </div>
                <div className={checkboxRowCls}>
                  <input type="checkbox" id="slotActive" checked={slotForm.isActive}
                    onChange={(e) => setSlotForm({ ...slotForm, isActive: e.target.checked })}
                    className="accent-indigo-500" />
                  <label htmlFor="slotActive" className="text-sm text-gray-300">Active</label>
                </div>
                <button type="submit" disabled={slotSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {slotSubmitting && <Spinner size="sm" />}
                  {slotModal.editing ? 'Update Slot' : 'Create Slot'}
                </button>
              </form>
            </Modal>
          </>
        )}

        {/* ── FACULTY ── */}
        {activeTab === 'faculty' && (
          <>
            <CrudTable
              title="Faculty"
              columns={['Name', 'Email', 'Status']}
              data={faculty}
              loading={facultyLoading}
              onAdd={() => openFacultyModal()}
              onEdit={openFacultyModal}
              onDelete={handleFacultyDelete}
              renderRow={(item) => (
                <>
                  <td className="px-6 py-3 text-white font-medium">{item.name}</td>
                  <td className="px-6 py-3 text-gray-300">{item.email}</td>
                  <td className="px-6 py-3"><StatusBadge isActive={item.isActive} /></td>
                </>
              )}
            />
            <Modal
              isOpen={facultyModal.open}
              onClose={() => setFacultyModal({ open: false, editing: null })}
              title={facultyModal.editing ? 'Edit Faculty' : 'Add Faculty'}
            >
              <form onSubmit={handleFacultySubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input type="text" className={inputCls} value={facultyForm.name}
                    onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" className={inputCls} value={facultyForm.email}
                    onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })} required />
                </div>
                <div className={checkboxRowCls}>
                  <input type="checkbox" id="facultyActive" checked={facultyForm.isActive}
                    onChange={(e) => setFacultyForm({ ...facultyForm, isActive: e.target.checked })}
                    className="accent-indigo-500" />
                  <label htmlFor="facultyActive" className="text-sm text-gray-300">Active</label>
                </div>
                <button type="submit" disabled={facultySubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {facultySubmitting && <Spinner size="sm" />}
                  {facultyModal.editing ? 'Update Faculty' : 'Create Faculty'}
                </button>
              </form>
            </Modal>
          </>
        )}

        {/* ── ROOMS MONITOR ── */}
        {activeTab === 'rooms' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Active Rooms Monitor</h2>
              <button onClick={fetchRooms}
                className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                ↻ Refresh
              </button>
            </div>
            {roomsLoading ? (
              <div className="flex items-center justify-center py-12"><Spinner /></div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12 text-gray-600">No active rooms.</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {rooms.map((room) => (
                  <div key={room._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                    <div>
                      <p className="text-white font-medium">
                        {room.subject?.name} · {room.slot?.label}
                      </p>
                      <p className="text-gray-400 text-sm mt-0.5">
                        {room.faculty?.name} · <span className="font-mono text-xs text-gray-600">{room.roomId}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white font-semibold">{room.participantCount}</p>
                        <p className="text-gray-500 text-xs">online</p>
                      </div>
                      <button
                        onClick={() => viewRoomMessages(room)}
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/30 hover:border-indigo-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                      >
                        View Feed
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGE FEED ── */}
        {activeTab === 'messages' && selectedRoom && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-800">
              <button onClick={() => setActiveTab('rooms')}
                className="text-gray-400 hover:text-white transition-colors text-sm">
                ← Back to Rooms
              </button>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {selectedRoom.subject?.name} · {selectedRoom.slot?.label}
                </h2>
                <p className="text-gray-500 text-xs">{selectedRoom.faculty?.name} · {selectedRoom.roomId}</p>
              </div>
            </div>
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12"><Spinner /></div>
            ) : roomMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-600">No messages in this room.</div>
            ) : (
              <div className="divide-y divide-gray-800 max-h-[60vh] overflow-y-auto">
                {roomMessages.map((msg) => (
                  <div key={msg._id} className={`px-6 py-3 flex items-start justify-between gap-4 ${msg.isDeleted ? 'opacity-40' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-indigo-400 font-medium text-sm">{msg.senderName}</span>
                        <span className="text-gray-600 text-xs">
                          {new Date(msg.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {msg.isDeleted ? (
                        <p className="text-gray-600 italic text-sm">Message deleted</p>
                      ) : (
                        <>
                          {msg.text && <p className="text-gray-200 text-sm break-words">{msg.text}</p>}
                          {msg.imageUrl && (
                            <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                              <img src={msg.imageUrl} alt="Message image" className="mt-1 h-20 rounded-lg object-cover" />
                            </a>
                          )}
                        </>
                      )}
                    </div>
                    {!msg.isDeleted && (
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="flex-shrink-0 text-red-500 hover:text-red-400 text-xs font-medium px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
