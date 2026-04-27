import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Settings, Users, MonitorUp, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../hooks/useData';
import { getVideoSessions, updateVideoSession } from '../lib/dataService';

export function VideoRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const [timer, setTimer] = useState(0);

  // Fetch the video session details
  const { data: sessions } = useData(
    () => user?.id ? getVideoSessions(user.role === 'doctor' ? { doctor_id: user.id } : { patient_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );

  const session = (sessions ?? []).find(s => s.id === id);
  const otherPerson = user?.role === 'doctor'
    ? (session?.patient?.full_name ?? 'Patient')
    : (session?.doctor?.full_name ?? 'Doctor');

  // Simulate join delay
  useEffect(() => {
    const t = setTimeout(() => setJoined(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Timer
  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [joined]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const leaveMeeting = async () => {
    if (session?.id) {
      try {
        await updateVideoSession(session.id, {
          status: 'completed',
          ended_at: new Date().toISOString(),
          duration_minutes: Math.ceil(timer / 60),
        });
      } catch (err) { console.error(err); }
    }
    if (user?.role === 'doctor') nav('/doctor/video-sessions');
    else nav('/patient/video-sessions');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0A0A', zIndex: 100, display: 'flex', flexDirection: 'column', color: 'white' }}>
      {/* Top Header */}
      <header style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #2A2A2A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>Consultation: {otherPerson}</span>
          <span style={{ fontSize: 13, color: '#A3A3A3', background: '#1A1A1A', padding: '2px 8px', borderRadius: 4 }}>{formatTime(timer)}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, color: '#A3A3A3' }}>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><Users size={20} /></button>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><Settings size={20} /></button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: 24, display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'center' }}>
          {/* Main Video */}
          <div style={{ flex: 1, maxWidth: 800, aspectRatio: '16/9', background: '#1A1A1A', borderRadius: 16, position: 'relative', overflow: 'hidden', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!joined ? (
              <div style={{ textAlign: 'center', color: '#A3A3A3' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 600, color: 'white' }}>
                  {otherPerson.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>Waiting for {otherPerson} to join...</div>
              </div>
            ) : (
              <>
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 600 }}>
                    {otherPerson.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 6, fontSize: 13, backdropFilter: 'blur(4px)' }}>
                  {otherPerson}
                </div>
              </>
            )}
          </div>

          {/* Self Video */}
          <div style={{ width: 240, aspectRatio: '16/9', background: '#1A1A1A', borderRadius: 12, position: 'absolute', bottom: 100, right: chatOpen ? 340 : 24, border: '1px solid #2A2A2A', overflow: 'hidden', transition: 'right 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!videoOn ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600 }}>
                  {user?.initials}
                </div>
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0f3460 0%, #533483 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600 }}>
                  {user?.initials}
                </div>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 4, fontSize: 11, backdropFilter: 'blur(4px)' }}>
              You
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {chatOpen && (
          <div style={{ width: 320, borderLeft: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', background: '#111' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Meeting Chat</div>
              <button style={{ background: 'none', border: 'none', color: '#A3A3A3', cursor: 'pointer' }} onClick={() => setChatOpen(false)}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, textAlign: 'center', color: '#A3A3A3' }}>Chat started</div>
              <div style={{ alignSelf: 'flex-start', background: '#1A1A1A', padding: '8px 12px', borderRadius: 8, maxWidth: '85%' }}>
                <div style={{ fontSize: 11, color: '#A3A3A3', marginBottom: 4 }}>{otherPerson}</div>
                <div style={{ fontSize: 14 }}>Hello, can you hear me?</div>
              </div>
              <div style={{ alignSelf: 'flex-end', background: '#2563EB', padding: '8px 12px', borderRadius: 8, maxWidth: '85%' }}>
                <div style={{ fontSize: 14 }}>Yes, loud and clear.</div>
              </div>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #2A2A2A' }}>
              <input type="text" placeholder="Type a message..." style={{ width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 12px', color: 'white', outline: 'none' }} />
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderTop: '1px solid #2A2A2A', background: '#111' }}>
        <button onClick={() => setMicOn(!micOn)} style={{ width: 48, height: 48, borderRadius: '50%', background: micOn ? '#2A2A2A' : '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button onClick={() => setVideoOn(!videoOn)} style={{ width: 48, height: 48, borderRadius: '50%', background: videoOn ? '#2A2A2A' : '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button style={{ width: 48, height: 48, borderRadius: '50%', background: '#2A2A2A', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MonitorUp size={20} />
        </button>
        <button onClick={() => setChatOpen(!chatOpen)} style={{ width: 48, height: 48, borderRadius: '50%', background: chatOpen ? '#2563EB' : '#2A2A2A', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={20} />
        </button>
        <button onClick={leaveMeeting} style={{ width: 64, height: 48, borderRadius: 24, background: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 16 }}>
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
