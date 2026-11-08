"use client";

import { useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER" | "VIEWER";
  joinedDate: string;
}

interface ActivePat {
  id: string;
  name: string;
  prefix: string;
  createdDate: string;
}

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "usr_paddy",
    name: "Paddy",
    email: "paddy@paddy-systems.com",
    role: "OWNER",
    joinedDate: "Jan 2026",
  },
  {
    id: "usr_sally",
    name: "Sally Smith",
    email: "sally@paddy-systems.com",
    role: "OWNER",
    joinedDate: "Mar 2026",
  },
  {
    id: "usr_alex",
    name: "Alex Dev",
    email: "alex@paddy-systems.com",
    role: "MEMBER",
    joinedDate: "Feb 2026",
  },
  {
    id: "usr_sam",
    name: "Sam QA",
    email: "sam@paddy-systems.com",
    role: "VIEWER",
    joinedDate: "Mar 2026",
  },
];

const INITIAL_PATS: ActivePat[] = [
  {
    id: "pat_ci_deployer",
    name: "GitHub Actions CI",
    prefix: "pst_live_89a1b...",
    createdDate: "2 days ago",
  },
];

export default function TeamDashboardPage() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [pats, setPats] = useState<ActivePat[]>(INITIAL_PATS);
  const [newPatName, setNewPatName] = useState("");
  const [issuedToken, setIssuedToken] = useState<string | null>(null);

  const updateRole = (id: string, newRole: "OWNER" | "MEMBER" | "VIEWER") => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)),
    );
  };

  const createPat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatName.trim()) return;

    const fakeToken = `pst_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const newRecord: ActivePat = {
      id: `pat_${Date.now()}`,
      name: newPatName,
      prefix: `${fakeToken.slice(0, 13)}...`,
      createdDate: "Just now",
    };

    setPats((prev) => [newRecord, ...prev]);
    setIssuedToken(fakeToken);
    setNewPatName("");
  };

  const revokePat = (id: string) => {
    setPats((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-12">
      {/* Team Members Section */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Team & Permissions
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your organization members and their role-based access control
            (RBAC).
          </p>
        </div>

        <div className="border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-900/60 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-zinc-900/30">
                  <td className="py-4 px-4 font-semibold text-white">
                    <div>{member.name}</div>
                    <div className="text-xs text-zinc-500 font-normal">
                      {member.email}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        member.role === "OWNER"
                          ? "bg-purple-950 text-purple-400 border border-purple-800"
                          : member.role === "MEMBER"
                            ? "bg-blue-950 text-blue-400 border border-blue-800"
                            : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs text-zinc-500">
                    {member.joinedDate}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {member.role !== "OWNER" && (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          updateRole(
                            member.id,
                            e.target.value as "OWNER" | "MEMBER" | "VIEWER",
                          )
                        }
                        className="bg-zinc-900 border border-zinc-800 rounded text-xs px-2 py-1 text-zinc-300 focus:outline-none"
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Personal Access Tokens Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Personal Access Tokens (PAT)
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Authenticate the Relay CLI and CI/CD pipelines without browser
            logins.
          </p>
        </div>

        {issuedToken && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-sm">
            <div className="font-semibold text-emerald-300 mb-1">
              Token generated successfully!
            </div>
            <p className="text-xs text-emerald-400/90 mb-2">
              Make sure to copy this token now. You will not be able to see it
              again.
            </p>
            <div className="p-2 bg-black/60 rounded font-mono text-xs text-emerald-200 select-all break-all">
              {issuedToken}
            </div>
            <button
              type="button"
              onClick={() => setIssuedToken(null)}
              className="mt-3 text-xs px-2 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded"
            >
              Done
            </button>
          </div>
        )}

        <form onSubmit={createPat} className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Token description (e.g. My Laptop CLI)"
            value={newPatName}
            onChange={(e) => setNewPatName(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold transition-colors shrink-0"
          >
            Create Token
          </button>
        </form>

        <div className="border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-900/60 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Token Name</th>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {pats.map((pat) => (
                <tr key={pat.id} className="hover:bg-zinc-900/30">
                  <td className="py-4 px-4 font-semibold text-white">
                    {pat.name}
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-zinc-400">
                    {pat.prefix}
                  </td>
                  <td className="py-4 px-4 text-xs text-zinc-500">
                    {pat.createdDate}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => revokePat(pat.id)}
                      className="px-2.5 py-1 text-xs rounded bg-zinc-900 hover:bg-rose-950 text-rose-400 border border-zinc-800 transition-colors"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
