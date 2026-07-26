"use client";

import * as contract from "contract";
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signTransaction as freighterSign,
} from "@stellar/freighter-api";
import { networks } from "contract";

const RPC_URL = "https://soroban-testnet.stellar.org";
const { networkPassphrase, contractId } = networks.testnet;

function getClient(publicKey: string) {
  return new contract.Client({
    contractId,
    networkPassphrase,
    rpcUrl: RPC_URL,
    publicKey,
    signTransaction: (txXdr: string, opts?: { networkPassphrase?: string; address?: string }) =>
      freighterSign(txXdr, { networkPassphrase: opts?.networkPassphrase ?? networkPassphrase }),
  });
}

export async function connectWallet(): Promise<string> {
  const conn = await isConnected();
  if (!conn.isConnected) throw new Error("Freighter not installed");

  const allowed = await isAllowed();
  if (!allowed.isAllowed) {
    await requestAccess();
  }

  const { address } = await getAddress();
  return address;
}

export async function getConnectedAddress(): Promise<string | null> {
  try {
    const conn = await isConnected();
    if (!conn.isConnected) return null;
    const allowed = await isAllowed();
    if (!allowed.isAllowed) return null;
    const { address } = await getAddress();
    return address;
  } catch {
    return null;
  }
}

export async function initializeElection(
  caller: string,
  candidates: string[]
) {
  const client = getClient(caller);
  const tx = await client.initialize(
    { candidates },
    { publicKey: caller }
  );
  return tx.signAndSend();
}

export async function vote(caller: string, candidate: string) {
  const client = getClient(caller);
  const tx = await client.vote(
    { voter: caller, candidate },
    { publicKey: caller }
  );
  return tx.signAndSend();
}

export async function getVotes(candidate: string) {
  const client = getClient("");
  const tx = await client.get_votes({ candidate });
  const result = await tx.simulate();
  return result.result;
}

export async function getCandidates(): Promise<string[]> {
  const client = getClient("");
  const tx = await client.get_candidates();
  const result = await tx.simulate();
  return result.result;
}
