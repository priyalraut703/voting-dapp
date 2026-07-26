#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec};

#[contracttype]
pub enum DataKey {
    Candidates,
    Votes,
    Voters,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn initialize(env: Env, candidates: Vec<String>) {
        env.storage().instance().set(&DataKey::Candidates, &candidates);
        env.storage().instance().set(&DataKey::Votes, &Map::<String, u32>::new(&env));
        env.storage().instance().set(&DataKey::Voters, &Map::<Address, bool>::new(&env));
    }

    pub fn vote(env: Env, voter: Address, candidate: String) {
        voter.require_auth();

        let mut voters: Map<Address, bool> = env.storage().instance().get(&DataKey::Voters).unwrap();
        assert!(!voters.get(voter.clone()).unwrap_or(false), "already voted");

        let candidates: Vec<String> = env.storage().instance().get(&DataKey::Candidates).unwrap();
        assert!(candidates.contains(candidate.clone()), "invalid candidate");

        let mut votes: Map<String, u32> = env.storage().instance().get(&DataKey::Votes).unwrap();
        let count = votes.get(candidate.clone()).unwrap_or(0);
        votes.set(candidate, count + 1);
        voters.set(voter, true);

        env.storage().instance().set(&DataKey::Votes, &votes);
        env.storage().instance().set(&DataKey::Voters, &voters);
    }

    pub fn get_votes(env: Env, candidate: String) -> u32 {
        let votes: Map<String, u32> = env.storage().instance().get(&DataKey::Votes).unwrap();
        votes.get(candidate).unwrap_or(0)
    }

    pub fn get_candidates(env: Env) -> Vec<String> {
        env.storage().instance().get(&DataKey::Candidates).unwrap()
    }
}

mod test;
