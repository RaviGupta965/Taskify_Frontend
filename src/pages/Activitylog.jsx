import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
export default function ActivityLog() {
  const { id } = useParams(); // project ID
  const [logs, setLogs] = useState([]);
  const token = localStorage.getItem("token");
  const navigate=useNavigate();
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(
          `https://taskify-backend-o0m0.onrender.com/api/activity/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchLogs();
  }, [id]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:underline mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </button>
      <h1 className="text-2xl font-bold mb-6">Activity Log for the Board are:</h1>
      {logs.length === 0 ? (
        <p className="text-gray-500 italic">No activity yet.</p>
      ) : (
        <ul className="space-y-4">
          {logs.map((log) => (
            <li
              key={log._id}
              className="bg-white p-4 rounded shadow flex flex-col md:flex-row md:items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{log.user?.username}</span>
              </div>
              <div className="text-gray-600">{log.details}</div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-2 md:mt-0">
                <Clock className="w-4 h-4" />
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
