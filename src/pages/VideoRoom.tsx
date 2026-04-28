import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import type { DailyCall } from '@daily-co/daily-js';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../hooks/useData';
import { getVideoSessions, updateVideoSession } from '../lib/dataService';
import { createOrGetRoom } from '../lib/dailyService';
import { LogOut } from 'lucide-react';

export function VideoRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const callContainerRef = useRef<HTMLDivElement>(null);
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('Joining consultation...');

  const { data: sessions } = useData(
    () => user?.id ? getVideoSessions(user.role === 'doctor' ? { doctor_id: user.id } : { patient_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );

  const session = (sessions ?? []).find(s => s.id === id);

  const leaveCall = useCallback(async () => {
    if (callFrame) {
      callFrame.leave();
      callFrame.destroy();
      setCallFrame(null);
    }

    // Mark as completed if doctor leaves (or anyone leaves, based on requirements)
    if (session?.id) {
      try {
        await updateVideoSession(session.id, {
          status: 'completed',
          ended_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to update session status', err);
      }
    }

    if (user?.role === 'doctor') nav('/doctor/video-sessions');
    else nav('/patient/video-sessions');
  }, [callFrame, session, user, nav]);

  useEffect(() => {
    if (!session || !user || !callContainerRef.current) return;
    if (callFrame) return; // Already initialized

    let frame: DailyCall | null = null;

    const initDaily = async () => {
      try {
        setLoadingMsg('Setting up secure room...');
        const roomUrl = await createOrGetRoom(session.id);

        frame = DailyIframe.createFrame(callContainerRef.current!, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '12px',
          },
          showLeaveButton: true,
        });

        setCallFrame(frame);

        frame.on('left-meeting', leaveCall);

        setLoadingMsg('Joining room...');
        await frame.join({
          url: roomUrl,
          userName: user.name,
        });

        // Mark as in_progress when successfully joined
        if (session.status === 'scheduled') {
          await updateVideoSession(session.id, { status: 'in_progress', started_at: new Date().toISOString() });
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to join video call');
      }
    };

    initDaily();

    return () => {
      if (frame) {
        frame.destroy();
      }
    };
  }, [session, user, leaveCall]);

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', color: 'white' }}>
        <h2 style={{ color: '#EF4444' }}>Error joining meeting</h2>
        <p style={{ color: '#A3A3A3', marginBottom: 24 }}>{error}</p>
        <button className="btn btn-blue" onClick={() => nav(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0A0A', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #2A2A2A', background: '#111' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>Live Consultation</span>
        </div>
        <button
          onClick={leaveCall}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
        >
          <LogOut size={16} /> Exit Meeting
        </button>
      </header>

      {/* Video Container */}
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {!callFrame && (
          <div style={{ color: '#A3A3A3', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="spinner" style={{ width: 32, height: 32, border: '3px solid #2A2A2A', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div>{loadingMsg}</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        <div ref={callContainerRef} style={{ width: '100%', height: '100%', maxWidth: 1200, background: '#1A1A1A', borderRadius: 12, overflow: 'hidden', border: '1px solid #2A2A2A', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
      </div>
    </div>
  );
}
