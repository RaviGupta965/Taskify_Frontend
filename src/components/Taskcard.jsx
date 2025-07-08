import React from "react";
import { Pencil, Trash2 } from "lucide-react";

function TaskCard({ task, onEdit, onDelete }) {
  return (
    <div className="border p-3 rounded mb-2 shadow-sm bg-white flex justify-between items-start">
      <div>
        <p className="font-semibold">{task.title}</p>
        <p className="text-sm text-gray-500">
          Assigned to: {task.assignedTo?.username || "Unassigned"}
        </p>
        <p className="text-xs text-black font-bold italic">
          {task.description}
        </p>
        <p className="text-xs text-gray-400 italic">
          Priority: {task.priority}
        </p>
      </div>
      <div className="flex gap-2 mt-1">
        <button onClick={() => onEdit(task)}>
          <Pencil size={16} className="text-blue-600" />
        </button>
        <button onClick={() => onDelete(task._id)}>
          <Trash2 size={16} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
