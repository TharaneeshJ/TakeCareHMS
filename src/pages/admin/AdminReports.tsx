import { Download, Activity } from 'lucide-react';
import { useData, LoadingState } from '../../hooks/useData';
import { getAdminStats, getActivityLogs } from '../../lib/dataService';

export function AdminReports() {
  const { data: stats, loading: statsLoading } = useData(() => getAdminStats(), []);
  const { data: logs, loading: logsLoading } = useData(() => getActivityLogs(undefined, 20), []);

  if (statsLoading || logsLoading) return <LoadingState />;

  const kpis = [
    { label: 'Total Patients', value: String(stats?.totalPatients ?? 0) },
    { label: 'Active Doctors', value: String(stats?.totalDoctors ?? 0) },
    { label: 'Bed Occupancy', value: `${stats?.occupiedBeds ?? 0}/${stats?.totalBeds ?? 0}` },
    { label: 'Total Revenue', value: `₹${((stats?.todayRevenue ?? 0) / 100000).toFixed(2)}L` },
  ];

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Metric,Value\n" + 
      kpis.map(k => `"${k.label}","${k.value}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "admin_reports_summary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReport = (reportType: string) => {
    alert(`Generating ${reportType} report... This feature would connect to a PDF generation service in a full production environment.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Reports & Logs</h1>
        <button className="btn btn-secondary" onClick={handleExportCSV}><Download size={16} /> Export</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {kpis.map(k => (
          <div key={k.label} className="card" style={{ textAlign: 'center' }}>
            <div className="stat-number" style={{ fontSize: 28 }}>{k.value}</div>
            <div className="stat-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} color="#2563EB" />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Recent System Activity</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>User ID</th>
                <th>Action</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#737373' }}>
                    No recent activity found.
                  </td>
                </tr>
              ) : (
                (logs ?? []).map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td style={{ color: '#525252', fontSize: 13 }}>{log.user_id.substring(0, 8)}...</td>
                    <td style={{ fontWeight: 500 }}>{log.action}</td>
                    <td>{log.description ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', marginBottom: 16 }}>Generate Reports</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['Patient Summary', 'Financial Report', 'Appointment Analytics', 'Ward Occupancy'].map(r => (
            <button key={r} className="btn btn-secondary" onClick={() => handleGenerateReport(r)}>{r}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
