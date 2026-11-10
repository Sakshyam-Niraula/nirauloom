import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

interface ReportModalProps {
  creationId: string;
  creationName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  creationId,
  creationName,
  isOpen,
  onClose,
}) => {
  const { submitReport } = usePlatform();
  const [reason, setReason] = useState('Broken link or unreachable site');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await submitReport(creationId, reason, details);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-forest-900 border border-sand-200/20 p-6 shadow-glass text-sand-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-sand-300 hover:text-sand-100 rounded-lg hover:bg-forest-800"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-sand-100">Report Received</h3>
            <p className="text-xs text-sand-300/70">
              Thank you for keeping NIRAULOOM safe and trustworthy. Our moderation team has been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-sand-100">Report Creation</h3>
                <p className="text-xs text-sand-300/60 truncate max-w-[260px]">{creationName}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sand-200 mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-forest-950 border border-sand-200/20 rounded-lg text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
              >
                <option value="Broken link or unreachable site">Broken link or unreachable site</option>
                <option value="Malicious, phishing, or malware">Malicious, phishing, or malware</option>
                <option value="Misleading description or fake product">Misleading description or fake product</option>
                <option value="Inappropriate or offensive content">Inappropriate or offensive content</option>
                <option value="Copyright or intellectual property claim">Copyright or intellectual property claim</option>
                <option value="Spam or duplicate submission">Spam or duplicate submission</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sand-200 mb-1">Additional Details (Optional)</label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any context that will help our review team..."
                className="w-full px-3 py-2 bg-forest-950 border border-sand-200/20 rounded-lg text-xs text-sand-100 placeholder-sand-300/40 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-sand-300 hover:text-sand-100 hover:bg-forest-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
