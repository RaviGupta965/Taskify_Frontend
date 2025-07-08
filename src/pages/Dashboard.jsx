import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ConstructionIcon, Trash } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [title, setTitle] = useState("");
  const [id,setid]=useState('')
  const [name,setname]=useState('')
  const user = JSON.parse(localStorage.getItem("user_data"));
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!user || !token) return navigate("/");
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await axios.get(
        "https://taskify-backend-o0m0.onrender.com/api/projects",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBoards(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBoard = async () => {
    if (!title.trim()) return setError("Board title cannot be empty.");
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(
        "https://taskify-backend-o0m0.onrender.com/api/projects",
        { name: title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBoards((prev) => [...prev, res.data]);
      setTitle("");
      setSuccess("Board created successfully.");
    } catch (err) {
      setError("Failed to create board.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    try {
      await axios.delete(
        `https://taskify-backend-o0m0.onrender.com/api/projects/${boardId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
    } catch (err) {
      console.error("Failed to delete board:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {user.username}
        </h1>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New board title"
          className="border px-4 py-2 rounded w-full"
        />
        <button
          onClick={handleCreateBoard}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-2">{success}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {boards.map((board) => (
          <div
            key={board._id}
            className="relative bg-white shadow p-4 rounded hover:bg-blue-50 transition cursor-pointer group"
            onClick={() => navigate(`/board/${board.name}/${board._id}`)}
          >
            <h2 className="text-xl font-semibold text-gray-800">{board.name}</h2>
            <p className="text-sm text-gray-500">
              Created by: {board.members[0]?.username}
            </p>

            {/* Delete button - show only to the creator */}
            {board.owner === user.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteBoard(board._id);
                }}
                className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:text-red-600 hover:bg-gray-100 transition"
                title="Delete Board"
              >
                <Trash className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
