import { Download } from 'lucide-react';
import { useData, LoadingState } from '../../hooks/useData';
import { getAdminStats } from '../../lib/dataService';

export function AdminReports() {
  const { data: stats, loading } = useData(() => getAdminStats(), []);

  if (loading) return <LoadingState />;

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
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Reports</h1>
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
