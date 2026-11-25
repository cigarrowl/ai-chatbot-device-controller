export function ApprovalCard({ approval, onApprove, onReject }: {
  approval: { description: string };
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="my-6 border border-orange-200 bg-orange-50 rounded-2xl p-5 shadow-sm max-w-xl mx-auto">
      <div className="flex items-start gap-3">
        <div className="text-orange-500 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <div>
          <h3 className="font-semibold text-orange-800 text-sm mb-1">Action Requires Approval</h3>
          <p className="text-sm text-orange-700/80 mb-4">{approval.description}</p>
          <div className="flex gap-3">
            <button onClick={onApprove} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
              Approve
            </button>
            <button onClick={onReject} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}