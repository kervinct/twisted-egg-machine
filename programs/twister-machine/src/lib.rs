mod accounts_info;
mod error;
mod event;
mod state;
mod utils;

mod prelude {
    pub use anchor_lang::prelude::*;
    pub use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
    pub use borsh::{BorshDeserialize, BorshSerialize};
    pub use rand::prelude::*;
    pub use rand_chacha::ChaCha12Rng;
    pub use solana_program::{
        program::{invoke_signed_unchecked, invoke_unchecked},
        program_pack::Pack,
        system_instruction,
    };
    pub use spl_token::{
        instruction as token_instruction, native_mint::ID as NATIVE_MINT_ID,
        state::Account as RawTokenAccount,
    };

    pub(crate) use crate::accounts_info::*;
    pub(crate) use crate::error::*;
    pub(crate) use crate::event::*;
    pub(crate) use crate::state::*;
    pub(crate) use crate::utils::*;
}

use prelude::*;
use solana_security_txt::security_txt;

security_txt! {
    // required fields
    name: "Twister Machine",
    project_url: "",
    contacts: "",
    policy: ""
}

declare_id!("398PJRUrjm2HvxmVVF2AcbpGjCJgfr9pAuv6a6P6QNy2");

#[program]
pub mod twister_machine {
    use super::*;

    pub fn initialize_twister_machine(
        ctx: Context<InitializeTwisterMachine>,
        machine_id: u64,
        nonce: u8,
        rand_seed: u64,
        price: u64,
        default_limit: u16,
        filling_fragment_id: u64,
    ) -> Result<()> {
        let machine = &mut ctx.accounts.machine.load_init()?;

        machine.nonce = nonce;
        machine.rand_seed = rand_seed;
        machine.default_limit = if default_limit == 0 {
            DEFAULT_LIMIT
        } else {
            default_limit
        };
        machine.price = price;
        machine.machine_id = machine_id;
        machine.filling_fragment_id = filling_fragment_id;
        machine.beneficiary = *ctx.accounts.beneficiary.key;
        machine.authority = *ctx.accounts.authority.key;
        machine.mint = ctx.accounts.mint.key();
        machine.status = MachineStatus::Initialized;

        msg!("Initialized machine with id: {}", machine_id);

        Ok(())
    }

    #[access_control(activate_time_check(ctx.accounts.clock.unix_timestamp, activate_at, stop_at))]
    pub fn activated_twister_machine(
        ctx: Context<ActivatedTwisterMachine>,
        activate_at: i64,
        stop_at: i64,
    ) -> Result<()> {
        let machine = &mut ctx.accounts.machine.load_mut()?;

        machine.activate_at = activate_at;
        machine.stop_at = stop_at;
        machine.status = MachineStatus::Activated;

        msg!("Activated machine id: {}", machine.machine_id);
        Ok(())
    }

    pub fn update_award(
        ctx: Context<UpdateAward>,
        award_id: u8,
        rate_numerator: u16,
    ) -> Result<()> {
        let machine = &mut ctx.accounts.machine.load_mut()?;

        let award = machine
            .awards
            .find_award_mut(award_id)
            .ok_or(if cfg!(feature = "dev") {
                error!(TwisterError::InvalidAwardId)
            } else {
                TwisterError::InvalidAwardId.into()
            })?;

        award.rate_numerator = rate_numerator;

        if !machine.is_valid_machine() {
            return if cfg!(feature = "dev") {
                err!(TwisterError::InvalidAward)
            } else {
                Err(TwisterError::InvalidAward.into())
            };
        }
        Ok(())
    }

    #[access_control(is_valid_award(&award))]
    pub fn add_award(ctx: Context<AddAward>, _award_id: u8, award: Award) -> Result<()> {
        msg!("Adding award: {:?}", award);
        let machine = &mut ctx.accounts.machine.load_mut()?;

        if !machine.awards.push(award) {
            return if cfg!(feature = "dev") {
                err!(TwisterError::TooManyAwards)
            } else {
                Err(TwisterError::TooManyAwards.into())
            };
        }
        if !machine.is_valid_machine() {
            return if cfg!(feature = "dev") {
                err!(TwisterError::InvalidAward)
            } else {
                Err(TwisterError::InvalidAward.into())
            };
        }

        let cpi_accounts = Transfer {
            from: ctx.accounts.token.to_account_info(),
            to: ctx.accounts.award.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, award.total_amount())?;

        Ok(())
    }
    #[access_control(is_valid_fragment(&fragment))]
    pub fn add_fragment(ctx: Context<AddFragment>, fragment: Fragment) -> Result<()> {
        let machine = &mut ctx.accounts.machine.load_mut()?;
        if machine.fragments.find_fragment(fragment.id).is_some() {
            return if cfg!(feature = "dev") {
                err!(TwisterError::FragmentAlreadyExists)
            } else {
                Err(TwisterError::FragmentAlreadyExists.into())
            };
        }
        if machine.filling_fragment_id == fragment.id {
            return if cfg!(feature = "dev") {
                err!(TwisterError::FragmentIsFilling)
            } else {
                Err(TwisterError::FragmentIsFilling.into())
            };
        }

        if !machine.fragments.push(fragment) {
            return if cfg!(feature = "dev") {
                err!(TwisterError::TooManyFragments)
            } else {
                Err(TwisterError::TooManyFragments.into())
            };
        }
        if !machine.is_valid_machine() {
            return if cfg!(feature = "dev") {
                err!(TwisterError::InvalidFragment)
            } else {
                Err(TwisterError::InvalidFragment.into())
            };
        }

        Ok(())
    }

    pub fn airdrop_fragment(ctx: Context<AirdropFragment>, amount: u16) -> Result<()> {
        let general = &mut ctx.accounts.general;
        general.amount += amount;

        msg!(
            "Airdropped {} default fragments to {}",
            amount,
            ctx.accounts.user.key()
        );
        Ok(())
    }

    pub fn airdrop_special_fragment(
        ctx: Context<AirdropSpecialFragment>,
        fragment_id: u64,
        amount: u16,
    ) -> Result<()> {
        if fragment_id == DEFAULT_FRAGMENT_ID {
            return if cfg!(feature = "dev") {
                err!(TwisterError::InvalidFragmentId)
            } else {
                Err(TwisterError::InvalidFragmentId.into())
            };
        }
        let machine = &ctx.accounts.machine.load()?;
        let _ = machine
            .fragments
            .find_fragment(fragment_id)
            .ok_or(if cfg!(feature = "dev") {
                error!(TwisterError::InvalidFragmentId)
            } else {
                TwisterError::InvalidFragmentId.into()
            })?;

        let special = &mut ctx.accounts.special;
        let fragment =
            special
                .fragments
                .find_fragment_mut(fragment_id)
                .ok_or(if cfg!(feature = "dev") {
                    error!(TwisterError::InvalidFragmentId)
                } else {
                    TwisterError::InvalidFragmentId.into()
                })?;
        fragment.quota += amount;

        msg!(
            "Airdropped {} special fragments {} to {}",
            amount,
            fragment_id,
            ctx.accounts.user.key()
        );
        Ok(())
    }

    pub fn create_general_account(ctx: Context<CreateGeneralAccount>) -> Result<()> {
        let general = &mut ctx.accounts.general;
        general.authority = ctx.accounts.user.key().clone();
        general.amount = 0;

        msg!("Created general account for {}", ctx.accounts.user.key());
        Ok(())
    }

    #[access_control(is_valid_machine(&ctx))]
    pub fn create_special_account(ctx: Context<CreateSpecialAccount>) -> Result<()> {
        let machine = &ctx.accounts.machine.load()?;
        let special = &mut ctx.accounts.special;
        special.authority = ctx.accounts.user.key().clone();
        special.fragments = Fragments::default();

        let fragments = machine.fragments;
        for idx in 0..fragments.index {
            let Fragment { id, .. } = fragments.fragments[idx as usize];
            special.fragments.push(Fragment::new(id));
        }

        if machine.filling_fragment_id != DEFAULT_FRAGMENT_ID {
            special.fragments.push(Fragment::new_with_limit(
                machine.filling_fragment_id,
                machine.default_limit,
            ));
        }

        msg!("Created special account for {}", ctx.accounts.user.key());
        Ok(())
    }

    /// the machine with only default fragments
    pub fn simple_lottery<'info>(
        ctx: Context<'_, '_, '_, 'info, SimpleLottery<'info>>,
        payment: PaymentType,
    ) -> Result<()> {
        let machine = &mut ctx.accounts.machine.load_mut()?;
        valid_time_check(
            ctx.accounts.clock.unix_timestamp,
            machine.activate_at,
            machine.stop_at,
        )?;
        let machine_key = ctx.accounts.machine.key().clone();
        let machine_default_limit = machine.default_limit;
        let awards_len = machine.awards.index as usize;

        let mut rng = ChaCha12Rng::seed_from_u64(machine.rand_seed);
        let awards_rate = machine.awards.total_rate();
        let choice = rng.gen_range(0..AWARD_RATE_DENOMINATOR);
        machine.rand_seed = rng.next_u64();

        match payment {
            PaymentType::Paid => {
                if machine.mint == NATIVE_MINT_ID {
                    if ctx.accounts.authority.key != ctx.accounts.payable.key
                        || ctx.accounts.beneficiary.key != &machine.beneficiary
                    {
                        return if cfg!(feature = "dev") {
                            err!(TwisterError::MismatchedPaymentAccount)
                        } else {
                            Err(TwisterError::MismatchedPaymentAccount.into())
                        };
                    }
                    let sys_transfer_ix = system_instruction::transfer(
                        &ctx.accounts.payable.key(),
                        &machine.beneficiary,
                        machine.price,
                    );
                    solana_program::program::invoke_signed(
                        &sys_transfer_ix,
                        &[
                            ctx.accounts.payable.to_account_info(),
                            ctx.accounts.beneficiary.to_account_info(),
                        ],
                        &[],
                    )?;
                    msg!(
                        "Paid {} native sol to {}",
                        machine.price,
                        machine.beneficiary
                    );
                } else {
                    let payer_token_data =
                        &ctx.accounts.payable.try_borrow_data().map_err(|_| {
                            if cfg!(feature = "dev") {
                                error!(TwisterError::InvalidPayableAccount)
                            } else {
                                TwisterError::InvalidPayableAccount.into()
                            }
                        })?;
                    let beneficiary_token_data =
                        &ctx.accounts.beneficiary.try_borrow_data().map_err(|_| {
                            if cfg!(feature = "dev") {
                                error!(TwisterError::InvalidBeneficiaryAccount)
                            } else {
                                TwisterError::InvalidBeneficiaryAccount.into()
                            }
                        })?;
                    let payable =
                        RawTokenAccount::unpack_from_slice(payer_token_data).map_err(|_| {
                            if cfg!(feature = "dev") {
                                error!(TwisterError::InvalidPayableAccount)
                            } else {
                                TwisterError::InvalidPayableAccount.into()
                            }
                        })?;
                    let beneficiary = RawTokenAccount::unpack_from_slice(beneficiary_token_data)
                        .map_err(|_| {
                            if cfg!(feature = "dev") {
                                error!(TwisterError::InvalidBeneficiaryAccount)
                            } else {
                                TwisterError::InvalidBeneficiaryAccount.into()
                            }
                        })?;
                    if payable.mint != machine.mint {
                        return if cfg!(feature = "dev") {
                            err!(TwisterError::MismatchedPaymentAccount)
                        } else {
                            Err(TwisterError::MismatchedPaymentAccount.into())
                        };
                    }
                    if payable.amount < machine.price {
                        return if cfg!(feature = "dev") {
                            err!(TwisterError::PayableNotEnoughBalance)
                        } else {
                            Err(TwisterError::PayableNotEnoughBalance.into())
                        };
                    }
                    if beneficiary.mint != machine.mint || beneficiary.owner != machine.beneficiary
                    {
                        return if cfg!(feature = "dev") {
                            err!(TwisterError::MismatchedPaymentAccount)
                        } else {
                            Err(TwisterError::MismatchedPaymentAccount.into())
                        };
                    }
                    let ix = token_instruction::transfer(
                        &spl_token::ID,
                        ctx.accounts.payable.key,
                        ctx.accounts.beneficiary.key,
                        ctx.accounts.authority.key,
                        &[],
                        machine.price,
                    )?;
                    invoke_unchecked(
                        &ix,
                        &[
                            ctx.accounts.payable.to_account_info(),
                            ctx.accounts.beneficiary.to_account_info(),
                            ctx.accounts.authority.to_account_info(),
                        ],
                    )?;
                    msg!(
                        "Paid {} token {} to {}",
                        machine.price,
                        machine.mint,
                        machine.beneficiary
                    );
                }
            }
            PaymentType::Fragment { id } => {
                // balance checked already
                if id != DEFAULT_FRAGMENT_ID {
                    return if cfg!(feature = "dev") {
                        err!(TwisterError::InvalidFragmentId)
                    } else {
                        Err(TwisterError::InvalidFragmentId.into())
                    };
                }
                let general = &mut ctx.accounts.general;
                general.amount -= machine_default_limit as u16;
                msg!("Paid Default Fragment");
            }
        }
        if choice < awards_rate {
            // Award
            let (position, award) = machine.find_award_mut_by_choice(choice);

            // check the award's quota is not zero
            // if award's quota is zero, then transfer filling fragment to them
            // here filling fragment always be default fragment
            if award.quota == 0 {
                return transfer_default_fragment_and_emit(
                    &mut ctx.accounts.general,
                    ctx.accounts.authority.key().clone(),
                );
            }
            // subtract the award
            award.quota -= 1;
            let transfer_amount = award.amount;
            let (ref award_account_key, _) = Pubkey::find_program_address(
                &[&machine_key.as_ref(), &(position as u32).to_le_bytes()[..]],
                &crate::id(),
            );

            // get awards account and receiver token account
            let accounts = ctx.remaining_accounts;

            let award_account = accounts
                .get(position as usize)
                .ok_or(if cfg!(feature = "dev") {
                    error!(TwisterError::InvalidInstruction)
                } else {
                    TwisterError::InvalidInstruction.into()
                })?
                .clone();
            let token_account = accounts
                .get(position as usize + awards_len)
                .ok_or(if cfg!(feature = "dev") {
                    error!(TwisterError::InvalidInstruction)
                } else {
                    TwisterError::InvalidInstruction.into()
                })?
                .clone();

            // check if the award_account is valid
            if award_account_key != award_account.key {
                return if cfg!(feature = "dev") {
                    err!(TwisterError::InvalidAwardAccount)
                } else {
                    Err(TwisterError::InvalidAwardAccount.into())
                };
            }
            if !award_account.is_writable {
                return if cfg!(feature = "dev") {
                    err!(TwisterError::InvalidInstruction)
                } else {
                    Err(TwisterError::InvalidInstruction.into())
                };
            }

            // check if the token_account is valid
            if !token_account.is_writable {
                return if cfg!(feature = "dev") {
                    err!(TwisterError::InvalidInstruction)
                } else {
                    Err(TwisterError::InvalidInstruction.into())
                };
            }

            // check the award token account owner and balance
            let award_account_token = RawTokenAccount::unpack_from_slice(
                &award_account.try_borrow_data()?[..],
            )
            .map_err(|_| {
                if cfg!(feature = "dev") {
                    error!(TwisterError::InvalidAwardAccount)
                } else {
                    TwisterError::InvalidAwardAccount.into()
                }
            })?;
            if award_account_token.owner != machine_key || award_account_token.amount < award.amount
            {
                return if cfg!(feature = "dev") {
                    err!(TwisterError::InvalidAwardAccount)
                } else {
                    Err(TwisterError::InvalidAwardAccount.into())
                };
            }

            // check the user token account owner
            let user_account_token = RawTokenAccount::unpack_from_slice(
                &token_account.try_borrow_data()?[..],
            )
            .map_err(|_| {
                if cfg!(feature = "dev") {
                    error!(TwisterError::InvalidUserAccount)
                } else {
                    TwisterError::InvalidUserAccount.into()
                }
            })?;
            if &user_account_token.owner != ctx.accounts.authority.key {
                return if cfg!(feature = "dev") {
                    err!(TwisterError::InvalidUserAccount)
                } else {
                    Err(TwisterError::InvalidUserAccount.into())
                };
            }

            let machine_owner = machine.authority.clone();
            let machine_nonce = machine.nonce;
            let machine_id = machine.machine_id;
            let seeds = &[
                &machine_owner.as_ref(),
                &machine_id.to_le_bytes()[..],
                TwisterMachine::SEEDS,
                &[machine_nonce],
            ];
            let signer = &[&seeds[..]];
            let ix = token_instruction::transfer(
                &spl_token::ID,
                award_account.key,
                token_account.key,
                &machine_key,
                &[],
                transfer_amount,
            )?;
            invoke_signed_unchecked(
                &ix,
                &[
                    award_account.to_account_info().clone(),
                    token_account.to_account_info().clone(),
                    ctx.accounts.machine.to_account_info().clone(),
                ],
                signer,
            )?;

            emit!(LotteryEvent {
                winner: ctx.accounts.authority.key().clone(),
                id: position as u64,
                ltype: AwardType::Award,
                label: "Award".to_string(),
            });
        } else {
            // Fragment, always DEFAULT_FRAGMENT_ID
            transfer_default_fragment_and_emit(
                &mut ctx.accounts.general,
                ctx.accounts.authority.key().clone(),
            )?;
        }
        Ok(())
    }
    /// The machine with extra fragments
    pub fn lottery<'info>(
        ctx: Context<'_, '_, '_, 'info, Lottery<'info>>,
        payment: PaymentType,
    ) -> Result<()> {
        let machine = &mut ctx.accounts.machine.load_mut()?;
        valid_time_check(
            ctx.accounts.clock.unix_timestamp,
            machine.activate_at,
            machine.stop_at,
        )?;
        let machine_key = ctx.accounts.machine.key().clone();
        let machine_filling_fragment_id = machine.filling_fragment_id;
        let machine_default_limit = machine.default_limit;
        let awards_len = machine.awards.index as usize;

        let mut rng = ChaCha12Rng::seed_from_u64(machine.rand_seed);
        let total_awards = machine.awards.total_rate();
        let choice = rng.gen_range(0..AWARD_RATE_DENOMINATOR);
        machine.rand_seed = rng.next_u64();

        match payment {
            PaymentType::Paid => {
                if machine.mint == NATIVE_MINT_ID {
                    if ctx.accounts.authority.key != ctx.accounts.payable.key
                        || ctx.accounts.beneficiary.key != &machine.beneficiary
                    {
                        return if cfg!(feature = "dev") {
                            err!(TwisterError::MismatchedPaymentAccount)
                        } else {
                            Err(TwisterError::MismatchedPaymentAccount.into())
                        };
                    }
                    let sys_transfer_ix = system_instruction::transfer(
                        &ctx.accounts.payable.key(),
                        &machine.beneficiary,
                        machine.price,
                    );
                    solana_program::program::invoke_signed(
                        &sys_transfer_ix,
                        &[
                            ctx.accounts.payable.to_account_info(),
                            ctx.accounts.beneficiary.to_account_info(),
                        ],
                        &[],
                    )?;
                    msg!(
                        "Paid {} native sol to {}",
                        machine.price as f64 / 1e9,
                        machine.beneficiary
                    );
                } else {
                    let payer_token_data =
                        &ctx.accounts.payable.try_borrow_data().map_err(|_| {
                            if cfg!(feature = "dev") {
                                error!(TwisterError::InvalidPayableAccount)
                            } else {
                                TwisterError::InvalidPayableAccount.into()
                            }
                        })?;
                    let beneficiary_token_data =
                        &ctx.accounts.beneficiary.try_borrow_data().map_err(|_| {
                            if cfg!(feature = "dev") {
                                error!(TwisterError::InvalidBeneficiaryAccount)
                            } else {
                                TwisterError::InvalidBeneficiaryAccount.into()
                            }
                        })?;
                    let payable =
                        RawTokenAccount::unpack_from_slice(payer_token_data).map_err(|_| {
                            if cfg!(feature = "dev") {
                                error!(TwisterError::InvalidPayableAccount)
                            } else {
                                TwisterError::InvalidPayableAccount.into()
                            }
                        })?;
                    let beneficiary = RawTokenAccount::unpack_from_slice(beneficiary_token_data)
                        .map_err(|_| {
                            if cfg!(feature = "dev") {
                                error!(TwisterError::InvalidBeneficiaryAccount)
                            } else {
                                TwisterError::InvalidBeneficiaryAccount.into()
                            }
                        })?;
                    if payable.mint != machine.mint {
                        return if cfg!(feature = "dev") {
                            err!(TwisterError::MismatchedPaymentAccount)
                        } else {
                            Err(TwisterError::MismatchedPaymentAccount.into())
                        };
                    }
                    if payable.amount < machine.price {
                        return if cfg!(feature = "dev") {
                            err!(TwisterError::PayableNotEnoughBalance)
                        } else {
                            Err(TwisterError::PayableNotEnoughBalance.into())
                        };
                    }
                    if beneficiary.mint != machine.mint || beneficiary.owner != machine.beneficiary
                    {
                        return if cfg!(feature = "dev") {
                            err!(TwisterError::MismatchedPaymentAccount)
                        } else {
                            Err(TwisterError::MismatchedPaymentAccount.into())
                        };
                    }
                    let ix = token_instruction::transfer(
                        &spl_token::ID,
                        ctx.accounts.payable.key,
                        ctx.accounts.beneficiary.key,
                        ctx.accounts.authority.key,
                        &[],
                        machine.price,
                    )?;
                    invoke_unchecked(
                        &ix,
                        &[
                            ctx.accounts.payable.to_account_info(),
                            ctx.accounts.beneficiary.to_account_info(),
                            ctx.accounts.authority.to_account_info(),
                        ],
                    )?;
                    msg!(
                        "Paid {} token {} to {}",
                        machine.price as f64 / 1e6,
                        machine.mint,
                        machine.beneficiary
                    );
                }
            }
            PaymentType::Fragment { id } => {
                // balance checked already
                if id == DEFAULT_FRAGMENT_ID {
                    let general = &mut ctx.accounts.general;
                    match machine.fragments.find_fragment(id) {
                        Some(fragment) => {
                            if general.amount < fragment.limit {
                                return if cfg!(feature = "dev") {
                                    err!(TwisterError::NotEnoughFragment)
                                } else {
                                    Err(TwisterError::NotEnoughFragment.into())
                                };
                            }
                            general.amount -= fragment.limit;
                        }
                        None => {
                            if general.amount < machine_default_limit {
                                return if cfg!(feature = "dev") {
                                    err!(TwisterError::NotEnoughFragment)
                                } else {
                                    Err(TwisterError::NotEnoughFragment.into())
                                };
                            }
                            general.amount -= machine_default_limit;
                        }
                    }
                    msg!("Paid Default Fragment");
                } else {
                    let special = &mut ctx.accounts.special;
                    // first get users fragment
                    let special_fragment = special.fragments.find_fragment_mut(id).ok_or(
                        if cfg!(feature = "dev") {
                            error!(TwisterError::InvalidFragmentId)
                        } else {
                            TwisterError::InvalidFragmentId.into()
                        },
                    )?;
                    // check the id if is filling fragment id and balance is enough
                    if id == machine_filling_fragment_id {
                        if special_fragment.quota < machine_default_limit {
                            return if cfg!(feature = "dev") {
                                err!(TwisterError::NotEnoughFragment)
                            } else {
                                Err(TwisterError::NotEnoughFragment.into())
                            };
                        }
                        special_fragment.quota -= machine_default_limit;
                    } else {
                        let fragment = machine.fragments.find_fragment(id).ok_or(
                            if cfg!(feature = "dev") {
                                error!(TwisterError::InvalidFragmentId)
                            } else {
                                TwisterError::InvalidFragmentId.into()
                            },
                        )?;
                        if special_fragment.quota < fragment.limit {
                            return if cfg!(feature = "dev") {
                                err!(TwisterError::NotEnoughFragment)
                            } else {
                                Err(TwisterError::NotEnoughFragment.into())
                            };
                        }
                        special_fragment.quota -= fragment.limit;
                    }
                    msg!("Paid Special Fragment {}", id);
                }
            }
        }
        if choice < total_awards {
            // Award
            let (position, award) = machine.find_award_mut_by_choice(choice);

            // if award is not zero, then transfer it to user
            if award.decr() {
                let transfer_amount = award.amount;
                let (ref award_account_key, _) = Pubkey::find_program_address(
                    &[&machine_key.as_ref(), &(position as u32).to_le_bytes()[..]],
                    &crate::id(),
                );

                // get awards account and receiver token account
                let accounts = ctx.remaining_accounts;

                let award_account = accounts
                    .get(position as usize)
                    .ok_or(if cfg!(feature = "dev") {
                        error!(TwisterError::InvalidInstruction)
                    } else {
                        TwisterError::InvalidInstruction.into()
                    })?
                    .clone();
                let token_account = accounts
                    .get(position as usize + awards_len)
                    .ok_or(if cfg!(feature = "dev") {
                        error!(TwisterError::InvalidInstruction)
                    } else {
                        TwisterError::InvalidInstruction.into()
                    })?
                    .clone();

                // check if the award_account is valid
                if award_account_key != award_account.key {
                    return if cfg!(feature = "dev") {
                        err!(TwisterError::InvalidAwardAccount)
                    } else {
                        Err(TwisterError::InvalidAwardAccount.into())
                    };
                }
                if !award_account.is_writable {
                    return if cfg!(feature = "dev") {
                        err!(TwisterError::InvalidInstruction)
                    } else {
                        Err(TwisterError::InvalidInstruction.into())
                    };
                }

                // check if the token_account is valid
                if !token_account.is_writable {
                    return if cfg!(feature = "dev") {
                        err!(TwisterError::InvalidInstruction)
                    } else {
                        Err(TwisterError::InvalidInstruction.into())
                    };
                }

                // check the award token account owner and balance
                let award_account_token =
                    RawTokenAccount::unpack_from_slice(&award_account.try_borrow_data()?[..])
                        .map_err(|_| {
                            if cfg!(feature = "dev") {
                                error!(TwisterError::InvalidAwardAccount)
                            } else {
                                TwisterError::InvalidAwardAccount.into()
                            }
                        })?;
                if award_account_token.owner != machine_key
                    || award_account_token.amount < award.amount
                {
                    return if cfg!(feature = "dev") {
                        err!(TwisterError::InvalidAwardAccount)
                    } else {
                        Err(TwisterError::InvalidAwardAccount.into())
                    };
                }

                // check user token account's owner
                let user_account_token =
                    RawTokenAccount::unpack_from_slice(&token_account.try_borrow_data()?[..])
                        .map_err(|_| {
                            if cfg!(feature = "dev") {
                                error!(TwisterError::InvalidUserAccount)
                            } else {
                                TwisterError::InvalidUserAccount.into()
                            }
                        })?;
                if &user_account_token.owner != ctx.accounts.authority.key {
                    return if cfg!(feature = "dev") {
                        err!(TwisterError::InvalidUserAccount)
                    } else {
                        Err(TwisterError::InvalidUserAccount.into())
                    };
                }

                let machine_owner = machine.authority.clone();
                let machine_nonce = machine.nonce;
                let machine_id = machine.machine_id;
                let seeds = &[
                    &machine_owner.as_ref(),
                    &machine_id.to_le_bytes()[..],
                    TwisterMachine::SEEDS,
                    &[machine_nonce],
                ];
                let signer = &[&seeds[..]];
                let ix = token_instruction::transfer(
                    &spl_token::ID,
                    award_account.key,
                    token_account.key,
                    &machine_key,
                    &[],
                    transfer_amount,
                )?;
                invoke_signed_unchecked(
                    &ix,
                    &[
                        award_account.to_account_info().clone(),
                        token_account.to_account_info().clone(),
                        ctx.accounts.machine.to_account_info().clone(),
                    ],
                    signer,
                )?;

                emit!(LotteryEvent {
                    winner: ctx.accounts.authority.key().clone(),
                    id: position as u64,
                    ltype: AwardType::Award,
                    label: "Award".to_string(),
                });
            // else transfer the filling fragment to user
            } else {
                transfer_fragment_and_emit(
                    machine_filling_fragment_id,
                    &mut ctx.accounts.general,
                    &mut ctx.accounts.special,
                    ctx.accounts.authority.key().clone(),
                )?;
            }
        } else {
            // check the choice fragment id
            match machine.find_fragment_mut_by_choice(choice) {
                Some(fragment) => {
                    // decrement the fragment quota, if is enough, then transfer it to user
                    if fragment.decr() {
                        transfer_fragment_and_emit(
                            fragment.id,
                            &mut ctx.accounts.general,
                            &mut ctx.accounts.special,
                            ctx.accounts.authority.key().clone(),
                        )?;
                    } else {
                        // fragment quota is zero, then transfer the filling fragment to user
                        transfer_fragment_and_emit(
                            machine_filling_fragment_id,
                            &mut ctx.accounts.general,
                            &mut ctx.accounts.special,
                            ctx.accounts.authority.key().clone(),
                        )?;
                    }
                }
                None => {
                    // curtain is the filling fragment
                    // still need to check whether the fragment is default fragment
                    transfer_fragment_and_emit(
                        machine_filling_fragment_id,
                        &mut ctx.accounts.general,
                        &mut ctx.accounts.special,
                        ctx.accounts.authority.key().clone(),
                    )?;
                    // for filling fragment, we do not need to minus quota, cause we don't saved it in fragment list
                }
            }
        }
        Ok(())
    }

    #[access_control(is_invalid_machine(&ctx))]
    pub fn withdraw(ctx: Context<Withdraw>, award_id: u8) -> Result<()> {
        let balance;
        {
            let machine = &mut ctx.accounts.machine.load_mut()?;
            let award =
                machine
                    .awards
                    .find_award_mut(award_id)
                    .ok_or(if cfg!(feature = "dev") {
                        error!(TwisterError::InvalidAwardId)
                    } else {
                        TwisterError::InvalidAwardId.into()
                    })?;
            balance = award.total_amount();
            if balance == 0 {
                return if cfg!(feature = "dev") {
                    err!(TwisterError::InvalidAwardId)
                } else {
                    Err(TwisterError::InvalidAwardId.into())
                };
            }
            award.quota = 0;
        }
        let machine = &ctx.accounts.machine.load()?;
        let machine_authority = machine.authority.clone();
        let machine_id = machine.machine_id;
        let machine_nonce = machine.nonce;

        let seeds = &[
            &machine_authority.as_ref(),
            &machine_id.to_le_bytes()[..],
            TwisterMachine::SEEDS,
            &[machine_nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.award.to_account_info(),
            to: ctx.accounts.token.to_account_info(),
            authority: ctx.accounts.machine.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, balance)?;

        msg!("Withdraw award {}", award_id);
        Ok(())
    }
}
