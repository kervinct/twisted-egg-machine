use crate::prelude::*;

#[derive(Accounts)]
#[instruction(machine_id: u64)]
pub struct InitializeTwisterMachine<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: always a wallet address, not a token account
    /// if mint is native_sol, then validate the lottery beneficiary equals to this
    /// else if mint is some other token
    /// then load the lottery beneficiary as token account and validate the owner equals to this
    pub beneficiary: AccountInfo<'info>,
    // mint is native_sol or some other mint
    // if native_sol, then try system_instruction::transfer
    // else try token_program::transfer
    pub mint: Account<'info, Mint>,
    #[account(init,
        seeds = [authority.key().as_ref(), machine_id.to_le_bytes().as_ref(), TwisterMachine::SEEDS],
        bump,
        payer = authority,
        space = 8 + TwisterMachine::LEN,
    )]
    pub machine: AccountLoader<'info, TwisterMachine>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
