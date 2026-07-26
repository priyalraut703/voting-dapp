#![cfg(test)]
use super::*;
use soroban_sdk::{vec, Address, Env, String};
use soroban_sdk::testutils::Address as _;

#[test]
fn test_initialize_and_get_candidates() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let cands = vec![
        &env,
        String::from_str(&env, "Alice"),
        String::from_str(&env, "Bob"),
        String::from_str(&env, "Charlie"),
    ];
    client.initialize(&cands);

    let result = client.get_candidates();
    assert_eq!(result.len(), 3);
    assert!(result.contains(String::from_str(&env, "Alice")));
    assert!(result.contains(String::from_str(&env, "Bob")));
    assert!(result.contains(String::from_str(&env, "Charlie")));
}

#[test]
fn test_vote_and_get_votes() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let cands = vec![&env, String::from_str(&env, "Alice"), String::from_str(&env, "Bob")];
    client.initialize(&cands);

    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);

    client.vote(&voter1, &String::from_str(&env, "Alice"));
    client.vote(&voter2, &String::from_str(&env, "Alice"));

    assert_eq!(client.get_votes(&String::from_str(&env, "Alice")), 2);
    assert_eq!(client.get_votes(&String::from_str(&env, "Bob")), 0);
}

#[test]
#[should_panic(expected = "already voted")]
fn test_cannot_vote_twice() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let cands = vec![&env, String::from_str(&env, "Alice")];
    client.initialize(&cands);

    let voter = Address::generate(&env);
    client.vote(&voter, &String::from_str(&env, "Alice"));
    client.vote(&voter, &String::from_str(&env, "Alice"));
}

#[test]
#[should_panic(expected = "invalid candidate")]
fn test_vote_invalid_candidate() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let cands = vec![&env, String::from_str(&env, "Alice")];
    client.initialize(&cands);

    let voter = Address::generate(&env);
    client.vote(&voter, &String::from_str(&env, "Eve"));
}

#[test]
fn test_get_votes_before_any_votes() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let cands = vec![&env, String::from_str(&env, "Alice")];
    client.initialize(&cands);

    assert_eq!(client.get_votes(&String::from_str(&env, "Alice")), 0);
}

#[test]
fn test_voting_across_multiple_candidates() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let cands = vec![&env, String::from_str(&env, "X"), String::from_str(&env, "Y"), String::from_str(&env, "Z")];
    client.initialize(&cands);

    let v1 = Address::generate(&env);
    let v2 = Address::generate(&env);
    let v3 = Address::generate(&env);

    client.vote(&v1, &String::from_str(&env, "X"));
    client.vote(&v2, &String::from_str(&env, "Y"));
    client.vote(&v3, &String::from_str(&env, "X"));

    assert_eq!(client.get_votes(&String::from_str(&env, "X")), 2);
    assert_eq!(client.get_votes(&String::from_str(&env, "Y")), 1);
    assert_eq!(client.get_votes(&String::from_str(&env, "Z")), 0);
}
