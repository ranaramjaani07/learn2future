import React from "react";

const SuccessStoriesAdmin = React.lazy(() => import("../../SuccessStoriesAdmin").then(m => ({ default: m.SuccessStoriesAdmin })));

export const PortfoliosTab: React.FC = () => {
  return (
    <div id="admin-portfolios-tab">
      <React.Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400 font-mono">Loading portfolio registry...</div>}>
        <SuccessStoriesAdmin />
      </React.Suspense>
    </div>
  );
};
