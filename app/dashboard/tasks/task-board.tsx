"use client";

import { useState } from "react";
import { Plus, CheckCircle, Circle, Clock, Trash2 } from "lucide-react";
import { addTask, completeTask, deleteTask } from "./actions";
import { toast } from "sonner";

export function TaskBoard({ activeTasks, completedTasks }: { activeTasks: any[], completedTasks: any[] }) {
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd(formData: FormData) {
    try {
      const res = await addTask(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setIsAdding(false);
      toast.success("Task created successfully");
    } catch (e) {
      toast.error("Failed to create task");
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await deleteTask(taskId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Task deleted");
    } catch (e) {
      toast.error("Failed to delete task");
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-6 shrink-0 pt-4">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] text-white text-sm font-semibold tracking-wider uppercase px-4 py-2 rounded flex items-center gap-2 hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {isAdding && (
         <div className="bg-[#111820] border border-[#1a2332] rounded-md p-5 mb-6">
           <form action={handleAdd} className="flex flex-col gap-4">
             <input autoFocus type="text" name="title" required placeholder="Task title..." className="w-full bg-[#080b10] border border-[#1a2332] rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]" />
             <input type="text" name="description" placeholder="Description (optional)" className="w-full bg-[#080b10] border border-[#1a2332] rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]" />
             <div className="flex gap-4">
               <select name="priority" className="bg-[#080b10] border border-[#1a2332] rounded-md px-3 py-2 text-sm text-primary focus:outline-none">
                 <option value="low">Low Priority</option>
                 <option value="medium">Medium Priority</option>
                 <option value="high">High Priority</option>
               </select>
             </div>
             <div className="flex gap-2 justify-end">
               <button type="button" onClick={() => setIsAdding(false)} className="text-sm text-muted hover:text-primary px-3 py-1">Cancel</button>
               <button type="submit" className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Save Task</button>
             </div>
           </form>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-[#111820] border border-[#1a2332] rounded-md p-5 min-h-[300px] flex flex-col">
          <h3 className="font-bold text-primary mb-4">Active Backlog</h3>
          {activeTasks.length === 0 ? (
            <div className="flex-1 border border-dashed border-[#1a2332] rounded bg-[#080b10] flex items-center justify-center p-8">
               <p className="text-sm text-muted">No active tasks. Free day!</p>
            </div>
          ) : (
             <div className="flex flex-col gap-3">
               {activeTasks.map(t => (
                 <div key={t.id} className="border border-[#1a2332] bg-[#080b10] rounded p-4 flex gap-3 group">
                   <button onClick={() => completeTask(t.id)} className="text-muted group-hover:text-[#10b981] mt-0.5 transition-colors">
                     <Circle className="w-5 h-5" />
                   </button>
                   <div className="flex flex-col flex-1">
                     <div className="flex items-center justify-between">
                       <span className="font-medium text-sm text-primary">{t.title}</span>
                       {t.priority === 'high' && <span className="text-xs text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded border border-[#ef4444]/20 uppercase">High</span>}
                       {t.priority === 'low' && <span className="text-xs text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/20 uppercase">Low</span>}
                     </div>
                     {t.description && <p className="text-xs text-muted mt-1">{t.description}</p>}
                     <div className="flex gap-2 items-center mt-2">
                       <Clock className="w-3 h-3 text-muted" />
                       <span className="text-[10px] text-muted tracking-wider uppercase font-mono">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</span>
                     </div>
                   </div>
                   <button onClick={() => handleDeleteTask(t.id)} className="text-muted hover:text-[#ef4444] transition-colors mt-0.5 ml-2 shrink-0">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               ))}
             </div>
          )}
        </div>

        <div className="bg-[#111820] border border-[#1a2332] rounded-md p-5 min-h-[300px] flex flex-col">
          <h3 className="font-bold text-[#10b981] uppercase tracking-wider text-sm mb-4">Archive Completed</h3>
          {completedTasks.length === 0 ? (
            <div className="flex-1 border border-dashed border-[#1a2332] rounded bg-[#080b10] flex items-center justify-center p-8">
               <p className="text-sm text-[#10b981]/70">No completed archive rows.</p>
            </div>
          ) : (
             <div className="flex flex-col gap-3 opacity-60">
               {completedTasks.map(t => (
                 <div key={t.id} className="border border-[#1a2332] bg-[#080b10] rounded p-4 flex gap-3">
                   <CheckCircle className="w-5 h-5 text-[#10b981]" />
                   <div className="flex flex-col flex-1">
                     <span className="font-medium text-sm text-primary line-through">{t.title}</span>
                     <div className="flex gap-2 items-center mt-2">
                       <Clock className="w-3 h-3 text-muted" />
                       <span className="text-[10px] text-muted tracking-wider uppercase font-mono">Completed {t.completed_at ? new Date(t.completed_at).toLocaleDateString() : '—'}</span>
                     </div>
                   </div>
                   <button onClick={() => handleDeleteTask(t.id)} className="text-muted hover:text-[#ef4444] transition-colors mt-0.5 ml-2 shrink-0">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
