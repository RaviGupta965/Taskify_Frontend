import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import TaskCard from "../components/Taskcard.jsx";
import { Plus, User, ListChecks, Flag } from "lucide-react";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useLocation } from "react-router-dom";

const socket = io("https://taskify-backend-o0m0.onrender.com", {
  auth: { token: localStorage.getItem("token") },
});

export default function Board() {
  const { name, id } = useParams();
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [newTasks, setNewTasks] = useState({
    Todo: { title: "", description: "" },
    "In Progress": { title: "", description: "" },
    Done: { title: "", description: "" },
  });

  const [assignedTo, setAssignedTo] = useState({
    Todo: "",
    "In Progress": "",
    Done: "",
  });

  const [priorities, setPriorities] = useState({
    Todo: "",
    "In Progress": "",
    Done: "",
  });
  const location = useLocation();
  const token = localStorage.getItem("token");

  const handleEdit = (task) => {
    setEditingTask(task);
    setNewTasks((prev) => ({
      ...prev,
      [task.status]: {
        title: task.title,
        description: task.description || "",
      },
    }));
    setAssignedTo((prev) => ({
      ...prev,
      [task.status]: task.assignedTo?._id || "",
    }));
    setPriorities((prev) => ({
      ...prev,
      [task.status]: task.priority,
    }));
  };

  const fetchTasks = async (projectId) => {
    if (!projectId || !token) return;

    try {
      const res = await axios.get(
        `https://taskify-backend-o0m0.onrender.com/api/tasks/project/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTasks(res.data);
    } catch (err) {
      console.error("ERROR :: WHILE FETCHING TASKS",err);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    try {
      await axios.patch(
        `https://taskify-backend-o0m0.onrender.com/api/tasks/${draggableId}`,
        {
          status: destination.droppableId,
          version: tasks.find((t) => t._id === draggableId).version,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socket.emit("task-change", id);
      await fetchTasks(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await axios.delete(
        `https://taskify-backend-o0m0.onrender.com/api/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      socket.emit("task-change", id);
      await fetchTasks(id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async (id) => {
    const res = await axios.get(
      `https://taskify-backend-o0m0.onrender.com/api/projects/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setMembers(res.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await fetchTasks(id);
        await fetchMembers(id);
      } catch (err) {
        console.error("Init error:", err);
      }
    };

    init(); // Run async logic

    socket.emit("joinProject", id);

    const handleTaskUpdate = async () => {
      await fetchTasks(id);
    };

    socket.on("task-updated", handleTaskUpdate);

    return () => {
      socket.emit("leaveProject", id);
      socket.off("task-updated", handleTaskUpdate);
    };
  }, [id, location.key]);

  const handleCreateTask = async (status) => {
    const { title, description } = newTasks[status];
    const assigned = assignedTo[status];
    const priority = priorities[status];

    if (!title.trim() || !priority) return;
    try {
      if (editingTask) {
        await axios.patch(
          `https://taskify-backend-o0m0.onrender.com/api/tasks/${editingTask._id}`,
          {
            title,
            description,
            status,
            priority,
            assignedTo: assigned,
            projectId: id,
            version: editingTask.version,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEditingTask(null);
      } else {
        await axios.post(
          `https://taskify-backend-o0m0.onrender.com/api/tasks`,
          {
            title,
            description,
            status,
            priority,
            assignedTo: assigned,
            projectId: id,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      setNewTasks((prev) => ({
        ...prev,
        [status]: { title: "", description: "" },
      }));
      setAssignedTo((prev) => ({ ...prev, [status]: "" }));
      setPriorities((prev) => ({ ...prev, [status]: "" }));
      await fetchTasks(id);
      socket.emit("task-change", id);
    } catch (err) {
      console.error(err);
    }
  };

  const grouped = {
    Todo: tasks.filter((t) => t.status === "Todo"),
    "In Progress": tasks.filter((t) => t.status === "In Progress"),
    Done: tasks.filter((t) => t.status === "Done"),
  };

  const columnColors = {
    Todo: "bg-blue-100",
    "In Progress": "bg-yellow-100",
    Done: "bg-green-100",
  };

  // Smart Assign Functionality

  const handleSmartAssign = async (status) => {
    const { title, description } = newTasks[status];
    const priority = priorities[status];

    if (!title.trim() || !priority) return;

    try {
      const res = await axios.post(
        `https://taskify-backend-o0m0.onrender.com/api/smart/`,
        {
          title,
          description,
          priority,
          status,
          projectId: id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchTasks();
      setNewTasks((prev) => ({
        ...prev,
        [status]: { title: "", description: "" },
      }));
      setPriorities((prev) => ({ ...prev, [status]: "" }));
      socket.emit("task-change", id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      const res = await axios.post(
        `https://taskify-backend-o0m0.onrender.com/api/projects/${id}/invite`,
        { email: inviteEmail },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setInviteMsg("Invitation sent successfully!");
      setInviteEmail("");
      await fetchMembers(id);
    } catch (err) {
      console.error(err);
      setInviteMsg("Failed to send invite. Check email or try again.");
    }
  };

  return (
    <>
      {/* Invite Section */}
      <div className="bg-white p-4 rounded shadow mb-6 max-w-xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Invite User to Project</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter email to invite"
            className="border px-3 py-2 rounded w-full"
          />
          <button
            onClick={handleInvite}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          >
            Invite
          </button>
        </div>
        {inviteMsg && (
          <p className="mt-2 text-sm text-green-600">{inviteMsg}</p>
        )}
      </div>

      <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-2xl font-bold">Board: {name}</h1>
        <Link to={`/project/${id}/activity`}>
          <button className="text-sm underline text-blue-600 hover:text-blue-800">
            View Activity Log
          </button>
        </Link>
      </div>
      {/* Task Section */}
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-8 text-center">
          📋 Project Board
        </h1>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {["Todo", "In Progress", "Done"].map((status) => (
              <div
                key={status}
                className={`rounded-lg p-4 shadow border ${columnColors[status]} flex flex-col`}
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <ListChecks size={20} /> {status}
                </h2>

                <input
                  value={newTasks[status].title}
                  onChange={(e) =>
                    setNewTasks((prev) => ({
                      ...prev,
                      [status]: {
                        ...prev[status],
                        title: e.target.value,
                      },
                    }))
                  }
                  placeholder="Task title"
                  className="border px-3 py-2 rounded mb-2 w-full"
                />

                <textarea
                  value={newTasks[status].description}
                  onChange={(e) =>
                    setNewTasks((prev) => ({
                      ...prev,
                      [status]: {
                        ...prev[status],
                        description: e.target.value,
                      },
                    }))
                  }
                  placeholder="Description"
                  className="border px-3 py-2 rounded mb-2 w-full resize-none"
                />

                <div className="flex items-center gap-2 mb-2">
                  <Flag size={16} className="text-gray-500" />
                  <select
                    value={priorities[status]}
                    onChange={(e) =>
                      setPriorities((prev) => ({
                        ...prev,
                        [status]: e.target.value,
                      }))
                    }
                    className="border px-3 py-2 rounded w-full"
                  >
                    <option value="">Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-gray-500" />
                  <select
                    value={assignedTo[status]}
                    onChange={(e) =>
                      setAssignedTo((prev) => ({
                        ...prev,
                        [status]: e.target.value,
                      }))
                    }
                    className="border px-3 py-2 rounded w-full"
                  >
                    <option value="">Assign to</option>
                    {members.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.username}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleCreateTask(status)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full flex items-center justify-center gap-2 mb-4"
                >
                  <Plus size={18} /> Add Task
                </button>
                <button
                  onClick={() => handleSmartAssign(status)}
                  className="bg-green-500 text-white px-4 py-2 rounded w-full mb-2 hover:bg-green-600"
                >
                  Smart Assign
                </button>
                <Droppable droppableId={status}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-col gap-2 min-h-[150px] bg-white rounded p-2" // optional: set min-height
                    >
                      {grouped[status].map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </>
  );
}
