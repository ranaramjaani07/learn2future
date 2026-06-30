import React from "react";
import { Trash, Mail } from "lucide-react";
import { ContactMessage } from "../../../types";

interface ContactsTabProps {
  contactMsgs: ContactMessage[];
  handleDeleteAllContacts: () => void;
  handleDeleteContact: (id: string) => void;
}

export const ContactsTab: React.FC<ContactsTabProps> = ({
  contactMsgs,
  handleDeleteAllContacts,
  handleDeleteContact
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="admin-contacts-tab">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Active Support Inbox</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Total submitted feedback and support request tickets.</p>
        </div>
        {contactMsgs.length > 0 && (
          <button
            onClick={handleDeleteAllContacts}
            className="border border-red-500/30 text-red-500 bg-red-500/5 dark:bg-red-500/15 hover:bg-red-500/25 font-display font-medium text-xs py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all shadow-md active:scale-95 duration-200 animate-in fade-in"
            title="Clear complete support inbox"
          >
            <Trash className="w-4 h-4 shrink-0" />
            <span>Delete All Tickets</span>
          </button>
        )}
      </div>

      {contactMsgs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-brand-border bg-[#151515] rounded-2xl space-y-3">
          <Mail className="w-10 h-10 text-neutral-500 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-400">Support Inbox Empty</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">No help desk tickets have been logged on the website yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contactMsgs.map((ticket) => (
            <div 
              key={ticket.id}
              className="p-6 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl flex flex-col justify-between space-y-4 relative"
            >
              <div className="space-y-3 pr-8">
                <div className="space-y-1">
                  <span className="block text-[8.5px] font-mono tracking-widest text-[#F5B300] uppercase font-bold">
                    Subject: {ticket.subject}
                  </span>
                  <h4 className="font-display font-bold text-sm text-neutral-900 dark:text-white leading-snug">
                    {ticket.name}
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono block select-all">{ticket.email}</span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans border-t dark:border-neutral-900/50 pt-2 break-words">
                  {ticket.message}
                </p>
              </div>

              {/* Delete Ticket button */}
              <button
                onClick={() => handleDeleteContact(ticket.id || "")}
                className="absolute top-4 right-4 p-1.5 bg-neutral-100 dark:bg-brand-border hover:text-red-500 rounded-lg text-neutral-400 transition-colors"
                title="Delete ticket entry"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
