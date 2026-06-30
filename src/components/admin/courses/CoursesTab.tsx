import React from "react";
import { Trash, Plus, BookOpen, Edit } from "lucide-react";
import { Course } from "../../../types";

interface CoursesTabProps {
  courses: Course[];
  handleDeleteAllCourses: () => void;
  resetCourseFormState: () => void;
  setShowCourseModal: (show: boolean) => void;
  handleSeedCourses: () => void;
  startEditCourse: (course: Course) => void;
  handleDeleteCourse: (id: string) => void;
}

export const CoursesTab: React.FC<CoursesTabProps> = ({
  courses,
  handleDeleteAllCourses,
  resetCourseFormState,
  setShowCourseModal,
  handleSeedCourses,
  startEditCourse,
  handleDeleteCourse
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="admin-courses-tab">
      {/* Header management block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Active Curriculums</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Total listed courses on active marketplace directories.</p>
        </div>
        <div className="flex items-center space-x-2">
          {courses.length > 0 && (
            <button
              onClick={handleDeleteAllCourses}
              className="border border-red-500/30 text-red-500 bg-red-500/5 dark:bg-red-500/15 hover:bg-red-500/25 font-display font-medium text-xs py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all shadow-md active:scale-95 duration-200 animate-in fade-in"
              title="Clear complete courses catalog"
            >
              <Trash className="w-4 h-4 shrink-0" />
              <span>Delete All Courses</span>
            </button>
          )}
          <button
            onClick={() => {
              resetCourseFormState();
              setShowCourseModal(true);
            }}
            className="bg-[#F5B300] hover:bg-[#F5B300]/90 text-black font-display font-bold text-xs py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-all shadow-md active:scale-95 duration-200"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Insert Program</span>
          </button>
        </div>
      </div>

      {/* Listed Courses Table/Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-brand-border bg-white dark:bg-[#121212] rounded-3xl space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-neutral-900 dark:text-white">Your catalog is currently empty</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
              Write your first future-ready syllabus manually by clicking <strong>"Insert Program"</strong> above, or instantly feed starter courses to the live database below.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleSeedCourses}
              className="bg-brand-gold text-black font-display font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl hover:bg-gold hover:shadow-lg hover:shadow-brand-gold/20 active:scale-95 transition-all duration-200"
            >
              🚀 Seed Starter Catalog Now
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id}
              className="p-5 border border-neutral-200 dark:border-brand-border bg-white dark:bg-[#151515] rounded-2xl flex gap-4 overflow-hidden relative group"
            >
              {/* Left side Thumbnail */}
              <div className="w-24 h-24 rounded-lg bg-neutral-900 overflow-hidden shrink-0 border border-brand-border/40">
                <img 
                  src={course.thumbnail || undefined} 
                  alt={course.title}
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Metadata */}
              <div className="flex-grow min-w-0 pr-12 space-y-1.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[8.5px] font-mono tracking-widest bg-brand-gold/10 text-brand-gold font-bold px-2 py-0.5 rounded uppercase">
                    {course.category}
                  </span>
                  <h4 className="font-display text-sm font-bold truncate text-neutral-900 dark:text-white leading-snug">
                    {course.title}
                  </h4>
                  <p className="text-[10px] text-neutral-500 line-clamp-2">
                    {course.description}
                  </p>
                </div>
                <span className="font-display text-xs font-bold text-brand-gold font-mono block">
                  ₹{course.price.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Edit Delete Action cluster */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <button
                  onClick={() => startEditCourse(course)}
                  className="p-1.5 bg-neutral-100 dark:bg-brand-border hover:text-brand-gold rounded-lg transition-colors text-neutral-400"
                  title="Edit modules"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCourse(course.id || "")}
                  className="p-1.5 bg-neutral-100 dark:bg-brand-border hover:text-red-500 rounded-lg transition-colors text-neutral-400"
                  title="Delete syllabus"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
