import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBQ5GN4HK33KOX4Z3EMDBJ43YMUK3XRLTGBW7EMIVZLLILDEVFHOPVBL",
  }
} as const

export type DataKey = {tag: "Candidates", values: void} | {tag: "Votes", values: void} | {tag: "Voters", values: void};

export interface Client {
  /**
   * Construct and simulate a vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  vote: ({voter, candidate}: {voter: string, candidate: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_votes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_votes: ({candidate}: {candidate: string}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({candidates}: {candidates: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_candidates transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_candidates: (options?: MethodOptions) => Promise<AssembledTransaction<Array<string>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAACkNhbmRpZGF0ZXMAAAAAAAAAAAAAAAAABVZvdGVzAAAAAAAAAAAAAAAAAAAGVm90ZXJzAAA=",
        "AAAAAAAAAAAAAAAEdm90ZQAAAAIAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAAAAAAJY2FuZGlkYXRlAAAAAAAAEAAAAAA=",
        "AAAAAAAAAAAAAAAJZ2V0X3ZvdGVzAAAAAAAAAQAAAAAAAAAJY2FuZGlkYXRlAAAAAAAAEAAAAAEAAAAE",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAKY2FuZGlkYXRlcwAAAAAD6gAAABAAAAAA",
        "AAAAAAAAAAAAAAAOZ2V0X2NhbmRpZGF0ZXMAAAAAAAAAAAABAAAD6gAAABA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    vote: this.txFromJSON<null>,
        get_votes: this.txFromJSON<u32>,
        initialize: this.txFromJSON<null>,
        get_candidates: this.txFromJSON<Array<string>>
  }
}