import React from "react";

const CrmAnalyticsDashboard = React.lazy(() => import("../../CrmAnalyticsDashboard").then(m => ({ default: m.CrmAnalyticsDashboard })));

interface UsersTabProps {
  usersList: any[];
  orders: any[];
  activityLogsList: any[];
  reviewsList: any[];
  courses: any[];
  allCartItemsList: any[];
  blogsList: any[];
  handleStartEditUser: (u: any) => void;
  handleToggleDisableUser: (st: any) => void;
  handleDeleteUserDoc: (st: any) => void;
  setViewingCrmUser: (u: any) => void;
  triggerCrmHistoricalBackfill: () => void;
  backfillingProgress: boolean;
  showToast: (msg: string) => void;
}

export const UsersTab: React.FC<UsersTabProps> = (props) => {
  return (
    <div id="admin-users-tab">
      <React.Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400 font-mono">Loading dynamic CRM analytics sub-systems...</div>}>
        <CrmAnalyticsDashboard {...props} />
      </React.Suspense>
    </div>
  );
};
