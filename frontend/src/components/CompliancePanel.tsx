import React from 'react';
import jsPDF from 'jspdf';
import { ShieldAlert } from 'lucide-react';
import { ComplianceEvaluation } from '../types';

interface AlertRow {
  id: number;
  created_at: string;
  mine_site: string;
  shift_name: string;
  rule_code: string;
  measured_value: number;
  threshold: number;
  decision: string;
  reason: string;
}

interface CompliancePanelProps {
  evaluation: ComplianceEvaluation | null;
  alerts: AlertRow[];
  mineSite: string;
  shiftName: string;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({ evaluation, alerts, mineSite, shiftName }) => {
  const exportAudit = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.text('MOIL DGMS shift compliance audit', 14, 18);
    doc.setFontSize(10);
    doc.text(`${mineSite} · ${shiftName}`, 14, 26);
    doc.text(`Decision: ${evaluation?.decision ?? 'PENDING'} · ${evaluation?.checked_at ?? ''}`, 14, 32);
    let y = 42;
    const rows = evaluation?.checks?.length ? evaluation.checks.map(c => ({
      rule_code: c.rule_code,
      measured_value: c.measured_value,
      threshold: c.threshold,
      decision: c.decision,
      reason: c.reason,
      created_at: evaluation.checked_at
    })) : alerts;
    rows.forEach((row) => {
      const line = `${row.rule_code}: ${row.decision} · measured ${row.measured_value} vs ${row.threshold}. ${row.reason}`;
      const split = doc.splitTextToSize(line, 180);
      doc.text(split, 14, y);
      y += split.length * 5 + 3;
      if (y > 270) {
        doc.addPage();
        y = 18;
      }
    });
    doc.save(`MOIL-DGMS-Audit-${mineSite}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <ShieldAlert className="w-4 h-4" />
            DGMS compliance · {mineSite}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Halt open-pit blasting when rainfall is at least 25 mm/hr or bench moisture is at least 45%.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-black text-sm ${evaluation?.decision === 'HALT' ? 'text-rose-400' : 'text-emerald-400'}`}>
            {evaluation?.decision ?? 'WAITING'}
          </span>
          <button onClick={exportAudit} className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg">
            Export audit PDF
          </button>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="text-left p-2">Time</th>
              <th className="text-left p-2">Rule</th>
              <th className="text-left p-2">Measured</th>
              <th className="text-left p-2">Limit</th>
              <th className="text-left p-2">Action</th>
              <th className="text-left p-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(alert => (
              <tr key={alert.id} className="border-t border-slate-800">
                <td className="p-2 font-mono">{alert.created_at.slice(0, 19)}</td>
                <td className="p-2">{alert.rule_code}</td>
                <td className="p-2">{alert.measured_value}</td>
                <td className="p-2">{alert.threshold}</td>
                <td className={`p-2 font-bold ${alert.decision === 'HALT' ? 'text-rose-400' : 'text-emerald-400'}`}>{alert.decision}</td>
                <td className="p-2 text-slate-300">{alert.reason}</td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td className="p-3 text-slate-500" colSpan={6}>No compliance checks logged for this mine yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
