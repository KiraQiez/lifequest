import { useNavigate } from "react-router-dom";
import { useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function GroupCard({
  id,
  name,
  description,
  memberCount = 1,
  avatars = [],
}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

const handleClick = async () => {
  if (busy) return;
  setBusy(true);
  try {
    localStorage.setItem("groupId", String(id));

    const userId = String(localStorage.getItem("userId"));
    if (!userId) throw new Error("Not logged in");

    const res = await fetch(`${API}/api/v1/groupMember/getMemberID/${id}/${userId}`);
    if (!res.ok) throw new Error(`Failed to load member ID (${res.status})`);

    const data = await res.json();
 
    const memberId = data?.memberId ?? data;

    if (memberId == null || isNaN(memberId)) {
      throw new Error("Server did not return a valid memberId");
    }

    localStorage.setItem("memberId", String(memberId));
    navigate("/home");
  } catch (e) {
    console.error(e);
  } finally {
    setBusy(false);
  }
};


  return (
    <div
      onClick={handleClick}
      role="button"
      className="group relative overflow-hidden rounded-xl border border-yellow-200 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
      aria-disabled={busy}
    >
      <div className="absolute inset-0 bg-linear-to-r from-yellow-100/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-yellow-800 truncate max-w-[70%]">
            {name}
          </h2>
          <span className="text-xs font-medium text-yellow-900 bg-yellow-100 px-3 py-1 rounded-full">
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
        </div>

        {description && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{description}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-yellow-700">
            {busy ? "Opening…" : "View Group →"}
          </span>

          <div className="flex -space-x-2">
            {(avatars.length ? avatars.slice(0, 3) : [
              "https://randomuser.me/api/portraits/women/12.jpg",
              "https://randomuser.me/api/portraits/men/22.jpg",
              "https://randomuser.me/api/portraits/women/33.jpg",
            ]).map((src, i) => (
              <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-white" />
            ))}
            {memberCount > 3 && (
              <div className="w-8 h-8 rounded-full bg-yellow-200 text-yellow-800 flex items-center justify-center text-xs font-semibold border-2 border-white">
                +{memberCount - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
