### Instructions

Although we are making a twisted egg machine, I just abbreviate it as twister machine, if you have any good advice, just let me know.

1. initialize_twister_machine: Initialize the twister machine.
2. activated_twister_machine: Activate the twister machine (open the activity).
   activate_at: i64, opening time.
   stop_at: i64, termination time.
3. update_awards: Update the probability of winning the prize and adjust the probability.
   index: u8, which prize.
   rate_numerator: u16, probability.
4. add_award: Add a reward and configure the probability.
   award_id: check machine.awards.index.
   award.
5. add_fragment: Add fragments and configure the quantity.
   fragment.
6. withdraw: Withdraw rewards (partially or completely). Can be operated in Initialized/Closed status.
   atype: prize or fragment.
   amount.
7. airdrop_fragment: Add default fragments to a specified user.
   amount.
8. airdrop_special_fragment: Airdrop fragments to a specified user's designated activity account.
   fragment_id.
   amount.
9. create_general_account: Create a general fragment account.
10. create_special_account: Create an activity fragment account.
11. lottery: Draw a lottery. All reward accounts must be created for the user (rewards are issued immediately after the lottery is completed).
12. simple_lottery: Simple lottery, used for lotteries without special requirements.

Since we do not want to make things complicated at begin, I copy the code from lottery function and make a simple_lottery function, perhaps deprecated in a near future.

#### InitializeTwisterMachine

> machine seed: [authority.key, machine_id_as_u64.to_le_bytes(), b"twister"]

| Parameter Name      | Type          | Width      |
| ------------------- | ------------- | ---------- |
| sign_hash           | [u8; 8]       | 8 byte     |
| machine_id          | u64           | 8 byte     |
| nonce               | u8            | 1 byte     |
| random_seed         | u64           | 8 byte     |
| price               | u64           | 8 byte     |
| filling_fragment_id | Option< u64 > | 1 + 8 byte |

filling_fragment_id is configured as the fragment ID used to fill the remaining quantity by default. If only 0 is passed, the default fragment ID (currently 0) will be used. Otherwise, the specified fragment ID will be used as the fill.

| Account        | isSigner | isWritable | Function                |
| -------------- | -------- | ---------- | ----------------------- |
| authority      | true     | true       | Administrator account   |
| beneficiary    |          |            | Receiver account        |
| mint           |          |            | Token type received     |
| machine        |          | true       | Twister machine account |
| system_program |          |            |                         |
| rent           |          |            |                         |

#### ActivatedTwisterMachine

| Parameter Name | Type | Width  |
| -------------- | ---- | ------ |
| sign_hash      |      |        |
| activate_at    | i64  | 8 byte |
| stop_at        | i64  | 8 byte |

The two \*\_at fields are the start and end time in seconds timestamp. Front-end developers should note to use new Date().getTime() / 1000.

| Account   | isSigner | isWritable | Function                |
| --------- | -------- | ---------- | ----------------------- |
| authority | true     | true       | Administrator account   |
| machine   |          | true       | Twister machine account |
| clock     |          |            |                         |

#### AddAward

> award seed：[machine.key, award_id_as_u32.to_le_bytes()]

| Parameter Name | Type   | Width  |
| -------------- | ------ | ------ |
| sign_hash      |        |        |
| award_id       | u8     | 1 byte |
| amount         | u64    | 8 byte |
| quota          | u16    | 2 byte |
| rate_numerator | u16    | 2 byte |
| padding        | [0; 4] | 4 byte |

The award_id is independent for each twister machine and must be counted from 0 to 99 (i.e. a total of 100 prizes).

The rate_numerator is the probability of winning a single prize. If the amount of the prize is set to 20 and the quota is set to 10, then the actual prize pool is 200. The rate_numerator sets the numerator of the probability of winning per quota (the denominator is fixed at 10000), and the maximum precision supported is ten thousandths. For example, setting it to 1 is actually 1/10000, and decimals are not allowed.

| Account        | isSigner | isWritable | Function                                     |
| -------------- | -------- | ---------- | -------------------------------------------- |
| authority      | true     | true       | Administrator                                |
| machine        |          | true       | twister machine account                      |
| award          |          | true       | Token account for the prize (transfer in)    |
| token          |          | true       | Administrator's token account (transfer out) |
| mint           |          |            | token mint                                   |
| system_program |          |            |                                              |
| token_program  |          |            |                                              |
| rent           |          |            |                                              |

The award account only needs to calculate the address and pass it in, and the contract will be responsible for initialization and transfer. Continuing with the previous example, if the prize amount is 20 and the quota is 10, a total of 200 tokens will be transferred.

#### UpdateAward

The UpdateAwards function is only used to update the probability of winning a prize.

| Parameter Name     | Type | Width  |
| ------------------ | ---- | ------ |
| sign_hash          |      |        |
| award_id           | u8   | 1 byte |
| new_rate_numerator | u16  | 2 byte |

| Account   | isSigner | isWritable | Function                |
| --------- | -------- | ---------- | ----------------------- |
| authority | true     | true       | Administrator account   |
| machine   |          | true       | Twister machine account |

#### Withdraw

The Withdraw function can only be executed when the twister machine is in an Initialized or Closed state, and it is used to withdraw all the tokens from the award account corresponding to a certain award_id.

Note that the atype parameter should be set to "prize" in order to withdraw tokens from the award account.

| Parameter Name | Type | Width  |
| -------------- | ---- | ------ |
| sign_hash      |      |        |
| award_id       | u8   | 1 byte |

| Account       | isSigner | isWritable | Function                                    |
| ------------- | -------- | ---------- | ------------------------------------------- |
| authority     | true     | true       | Administrator account                       |
| machine       |          | true       | Twister machine account                     |
| award         |          | true       | Token account for the prize (transfer out)  |
| token         |          | true       | Administrator's token account (transfer in) |
| token_program |          |            |                                             |
| clock         |          |            |                                             |

#### AddFragment

| Parameter Name | Type   | Width  |
| -------------- | ------ | ------ |
| sign_hash      |        |        |
| id             | u64    | 8 byte |
| quota          | u16    | 2 byte |
| limit          | u16    | 2 byte |
| padding        | [0; 4] | 4 byte |

Front-end developers should note that the id must be a number obtained from the backend, representing the fragment type. It can exist across different activities and is not used as an index key for fragments. By default, the platform fragment ID should be 0.

| Account   | isSigner | isWritable | Function                |
| --------- | -------- | ---------- | ----------------------- |
| authority | true     | true       | Administrator account   |
| machine   |          | true       | Twister machine account |

The default platform fragments do not need to be configured and will automatically be used to fill the probability. The activity-related fragments are not allowed to exceed the theoretical maximum number of fragments. The theoretical maximum number of fragments is calculated as follows:

theory_supply = awards_total_quota() / awards_total_rate_numerator \* 10000 - awards_total_quota()

awards_total_rate_numerator = sum(award.quota \* award.rate_numerator)

such as USDC amount=100，quota=10，rate_numerator=10（as for 0.1%），USDT amount=20，quota=20，rate_numerator=50（as for 0.5%）

so $theory\_supply = (10 + 20) / (10*10 + 20*50) * 10000 - (10 + 20)= 243$，the result should be rounded up to the nearest whole number.

#### AirdropFragment

The airdrop_fragment function is used to airdrop the default platform fragments to a user at any time. The fragments can exist across different activities.

Note that the amount parameter should be set to the number of fragments to airdrop. The default fragment ID should be used when transferring the fragments to the user's account.

| Parameter Name | Type | Width  |
| -------------- | ---- | ------ |
| sign_hash      |      |        |
| amount         | u16  | 2 byte |

| Account   | isSigner | isWritable | Function                 |
| --------- | -------- | ---------- | ------------------------ |
| authority | true     | true       | Administrator account    |
| general   |          | true       | General fragment account |
| user      |          |            | User account             |

#### AirdropSpecialFragment

The function can only be used to airdrop fragments to a specified user's designated activity account after the activity has been activated.

| Parameter Name | Type | Width  |
| -------------- | ---- | ------ |
| sign_hash      |      |        |
| fragment_id    | u64  | 8 byte |
| amount         | u16  | 2 byte |

| Account   | isSigner | isWritable | Function                |
| --------- | -------- | ---------- | ----------------------- |
| authority | true     | true       | Administrator account   |
| machine   |          |            | Twister machine account |

#### CreateGeneralAccount

> general seed: [user.key, b"general"]

| Parameter Name | Type | Width |
| -------------- | ---- | ----- |
| sign_hash      |      |       |

The general fragment account can exist across different activities, and can be created by someone else on behalf of a user. Before performing any platform fragment airdrops or twisted on, it is necessary to check whether the user has this account.

If the user creates the account themselves, it is only necessary to ensure that the authority field is the same as the user's public key.

| Account        | isSigner | isWritable | Function                 |
| -------------- | -------- | ---------- | ------------------------ |
| authority      | true     | true       | Payment account          |
| user           |          |            | Account owner            |
| general        |          | true       | General fragment account |
| system_program |          |            |                          |
| rent           |          |            |                          |

#### CreateSpecialAccount

> special seed: [machine.key, user.key, b"special"]

| Parameter Name | Type | Width |
| -------------- | ---- | ----- |
| sign_hash      |      |       |

| Account        | isSigner | isWritable | Function                  |
| -------------- | -------- | ---------- | ------------------------- |
| authority      | true     | true       | Payment account           |
| machine        |          |            | Twister machine account   |
| user           |          |            | Account owner             |
| special        |          | true       | Activity fragment account |
| system_program |          |            |                           |
| rent           |          |            |                           |

#### Lottery

| Parameter Name | Type | Width      |
| -------------- | ---- | ---------- |
| sign_hash      |      |            |
| payment_type   | enum | 1 - 9 byte |

```rust
pub enum PaymentType {
    Paid,
    Fragment {
        id: u64,
    },
}
```

The payment_type parameter can have two values:

1. If it is constructed directly as [0], it means that payment is made according to the set payment method.
2. If it is constructed as [1].concat(u64.to_le_bytes()), it means that the specified fragments will be used for payment.

The contract will execute according to the configuration and may reject the transaction. The front-end should perform fragment balance verification on the client side to ensure that the user has sufficient fragments to make the payment.

| Account          | isSigner | isWritable | Function                           |
| ---------------- | -------- | ---------- | ---------------------------------- |
| authority        | true     | true       | User account                       |
| payable          |          | true       | Payment account                    |
| beneficiary      |          | true       | Receiver account                   |
| machine          |          | true       | Twister machine account            |
| general          |          | true       | General fragment account           |
| special          |          | true       | Activity fragment account          |
| system_program   |          |            |                                    |
| token_program    |          |            |                                    |
| clock            |          |            |                                    |
| awards（series） |          | true       | Continuous prize accounts          |
| tokens（series） |          | true       | Continuous prize receiver accounts |

1. The authority is responsible for paying the on-chain transaction fees.
2. The payable parameter is the user's wallet address or token account address.
3. The beneficiary parameter is the beneficiary address in the machine account.
4. The general and special accounts are assumed to exist, so the front-end should check if they exist before calling this instruction. If they do not exist, the corresponding creation instruction should be called before this one.
5. The awards parameter is a list of token account addresses for the prizes configured for the twister machine in this activity. If there are multiple prizes, they should be listed in order.
6. The tokens parameter is a list of token account addresses for receiving the tokens won for each prize. If two prize tokens are the same, the same receiving token account address should be used for both.

#### SimpleLottery

| Parameter Name | Type | Width      |
| -------------- | ---- | ---------- |
| sign_hash      |      |            |
| payment_type   | enum | 1 - 9 byte |

| Account          | isSigner | isWritable | Function                           |
| ---------------- | -------- | ---------- | ---------------------------------- |
| authority        | true     | true       | User account                       |
| payable          |          | true       | Payment account                    |
| beneficiary      |          | true       | Receiver account                   |
| machine          |          | true       | Twister machine account            |
| general          |          | true       | General fragment account           |
| system_program   |          |            |                                    |
| token_program    |          |            |                                    |
| clock            |          |            |                                    |
| awards（series） |          | true       | Continuous prize accounts          |
| tokens（series） |          | true       | Continuous prize receiver accounts |

This function just remove the special account, and the special account do not need to be created first.
