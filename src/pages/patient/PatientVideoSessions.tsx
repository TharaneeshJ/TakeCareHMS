import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import {
  getVideoSessions,
  createVideoSession,
  getAllDoctors
} from '../../lib/dataService';

export function PatientVideoSessions() {
  const { user } = useAuth();
  const nav = useNavigate();

  const { data: sessions, loading, refetch } = useData(
    () =>
      user?.id
        ? getVideoSessions({ patient_id: user.id })
        : Promise.resolve([]),
    [user?.id]
  );

  const { data: doctors } = useData(
    () => getAllDoctors(),
    []
  );

  const [bookModal, setBookModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData(e.target as HTMLFormElement);

    try {
      await createVideoSession({
        patient_id: user!.id,
        doctor_id: fd.get('doctorId') as string,
        scheduled_at: `${fd.get('date')}T${fd.get('time')}:00`,
      });

      setBookModal(false);
      setSuccessMsg('Video consultation booked!');

      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);

      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const upcoming = (sessions ?? []).filter(
    (s) => s.status === 'scheduled'
  );

  const past = (sessions ?? []).filter(
    (s) => s.status === 'completed'
  );

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#0A0A0A',
            letterSpacing: '-0.025em',
          }}
        >
          Video Consultations
        </h1>

        <button
          className="btn btn-green"
          onClick={() => setBookModal(true)}
        >
          <Video size={16} />
          Book Session
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            padding: 16,
            background: '#F0FDF4',
            color: '#16A34A',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <div
          className="card"
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div
            className="icon-box"
            style={{ background: '#EFF6FF' }}
          >
            <Video color="#2563EB" />
          </div>

          <div>
            <div className="stat-number">
              {upcoming.length}
            </div>
            <div className="stat-label">
              Upcoming
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div
            className="icon-box"
            style={{ background: '#F0FDF4' }}
          >
            <Clock color="#16A34A" />
          </div>

          <div>
            <div className="stat-number">
              {past.length}
            </div>
            <div className="stat-label">
              Completed
            </div>
          </div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid #F5F5F5',
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#0A0A0A',
              }}
            >
              Upcoming Sessions
            </div>
          </div>

          {upcoming.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 24px',
                borderBottom: '1px solid #F5F5F5',
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#0A0A0A',
                  }}
                >
                  {s.doctor?.full_name ?? 'Doctor'}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: '#525252',
                  }}
                >
                  {new Date(s.scheduled_at).toLocaleString()}
                </div>
              </div>

              <button
                className="btn btn-green"
                onClick={() => nav(`/video-room/${s.id}`)}
              >
                Join Meeting
              </button>
            </div>
          ))}
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <EmptyState
          title="No video consultations"
          subtitle="Book a video session with your doctor."
        />
      )}

      {bookModal && (
        <div
          className="modal-overlay"
          onClick={() => setBookModal(false)}
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                Book Video Consultation
              </div>

              <button
                className="btn-ghost"
                onClick={() => setBookModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleBook}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div>
                <label className="input-label">
                  Doctor
                </label>

                <select
                  name="doctorId"
                  className="input"
                  required
                >
                  <option value="">
                    Select doctor...
                  </option>

                  {(doctors ?? []).map((d) => (
                    <option
                      key={d.id}
                      value={d.id}
                    >
                      {d.full_name} — {d.doctor_profile?.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                }}
              >
                <div>
                  <label className="input-label">
                    Date
                  </label>

                  <input
                    name="date"
                    type="date"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="input-label">
                    Time
                  </label>

                  <input
                    name="time"
                    type="time"
                    className="input"
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBookModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-green"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}