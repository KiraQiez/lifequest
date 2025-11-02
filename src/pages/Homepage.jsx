import Head from "../components/Head";
import Navi from "../components/Navi";
import GroupMembersCard from "../components/GroupMembersCard";
import { useEffect, useState } from "react";
import Navigate from "../components/Navigate";
import Settle from "../components/Settle";



export default function Homepage() {
  // Safer parsing → NaN if missing
  const groupId = parseInt(localStorage.getItem("groupId") || "", 10);
  const memberId = parseInt(localStorage.getItem("memberId") || "", 10);
  const storedUserName = localStorage.getItem("username") || "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [group, setGroup] = useState(null);

  const [members, setMembers] = useState([]);   

  const API = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    if (Number.isNaN(groupId) || Number.isNaN(memberId)) {
      setErr("Missing groupId/memberId in localStorage.");
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const [gRes, mRes] = await Promise.all([
          fetch(`${API}/api/v1/groups/${groupId}`, { signal: ctrl.signal }),
          fetch(`${API}/api/v1/groupMember/members/by-group/${groupId}`, { signal: ctrl.signal }),
        ]);

        if (!gRes.ok) throw new Error(`Failed to load group (${gRes.status})`);
        if (!mRes.ok) throw new Error(`Failed to load members (${mRes.status})`);


        const g = await gRes.json();
        const mem = await mRes.json();


        // Normalize members → [{id,name}]

        const uiMembers = Array.isArray(mem)
          ? mem.map((m, idx) => {
              const id = Number(m.memberId ?? m.id ?? m.member_id ?? idx + 1);
              let name = String(m.username ?? m.name ?? m.userName ?? `Member ${idx + 1}`);
              // Capitalize first letter of each word
              name = name
                .toLowerCase()
                .replace(/\b\w/g, (ch) => ch.toUpperCase());
              return { id, name };
            })
          : [];


        // Determine current user's name
        const me = uiMembers.find((m) => m.id === memberId);

        setGroup(g);
        setMembers(uiMembers);


      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [groupId, memberId, storedUserName]);

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col">
      <Head />

      <main className="flex-1 px-5 pt-20 pb-28 text-slate-800 max-w-md mx-auto w-full">
        {loading && <div className="text-sm text-slate-500">Loading…</div>}

        {err && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        {!loading && !err && group && (
          <>


            <GroupMembersCard
              groupName={group.name}
              groupCode={group.code}
              members={members}
            />



          </>
        )}

        {!loading && !err && !group && (
          <div className="text-sm text-slate-500">Group not found.</div>
        )}
        <Settle />
      </main>
      
      <Navi members={members} />
      <Navigate />
            
    </div>
  );
}
