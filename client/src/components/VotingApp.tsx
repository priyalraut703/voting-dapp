"use client";

import { useState, useEffect, useCallback } from "react";
import {
  connectWallet,
  getConnectedAddress,
  initializeElection,
  vote,
  getVotes,
  getCandidates,
} from "@/hooks/contract";

export default function VotingApp() {
  const [address, setAddress] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [newCandidate, setNewCandidate] = useState("");
  const [initializing, setInitializing] = useState(false);
  const [votingFor, setVotingFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const cands = await getCandidates();
      setCandidates(cands);

      const voteMap: Record<string, number> = {};
      for (const c of cands) {
        voteMap[c] = await getVotes(c);
      }
      setVotes(voteMap);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Error(Contract, WasmNotFound") || msg.includes("Could not retrieve") || msg.includes("ContractNotFound")) {
        setCandidates([]);
        setVotes({});
      } else {
        setError("Failed to load candidates: " + msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getConnectedAddress().then((addr) => {
      if (addr) {
        setAddress(addr);
        loadCandidates();
      } else {
        setLoading(false);
      }
    });
  }, [loadCandidates]);

  async function handleConnect() {
    try {
      setError(null);
      const addr = await connectWallet();
      setAddress(addr);
      loadCandidates();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet");
    }
  }

  async function handleInitialize() {
    if (!address || !newCandidate.trim()) return;
    const names = newCandidate
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    try {
      setInitializing(true);
      setError(null);
      await initializeElection(address, names);
      setNewCandidate("");
      await loadCandidates();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to initialize");
    } finally {
      setInitializing(false);
    }
  }

  async function handleVote(candidate: string) {
    if (!address) return;
    try {
      setVotingFor(candidate);
      setError(null);
      await vote(address, candidate);
      await loadCandidates();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to vote");
    } finally {
      setVotingFor(null);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">
          Soroban Voting
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Decentralized voting on Stellar testnet
        </p>
      </div>

      {/* Wallet */}
      {!address ? (
        <div className="flex justify-center mb-8">
          <button
            onClick={handleConnect}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Connect Freighter Wallet
          </button>
        </div>
      ) : (
        <div className="mb-6 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-mono text-zinc-600 dark:text-zinc-300 text-center truncate">
          {address}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Initialize Election */}
      {address && candidates.length === 0 && !loading && (
        <div className="mb-8 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold mb-4">Start an Election</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Enter candidate names separated by commas
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCandidate}
              onChange={(e) => setNewCandidate(e.target.value)}
              placeholder="Alice, Bob, Charlie"
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && handleInitialize()}
            />
            <button
              onClick={handleInitialize}
              disabled={initializing || !newCandidate.trim()}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {initializing ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && address && (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      )}

      {/* Vote Cards */}
      {candidates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Candidates</h2>
          <div className="grid gap-4">
            {candidates.map((c) => (
              <div
                key={c}
                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div>
                  <span className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    {c}
                  </span>
                  <span className="ml-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {votes[c] ?? 0} votes
                  </span>
                </div>
                {address && (
                  <button
                    onClick={() => handleVote(c)}
                    disabled={votingFor !== null}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {votingFor === c ? "Voting..." : "Vote"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
