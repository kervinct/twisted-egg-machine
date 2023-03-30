use crate::prelude::*;

#[derive(Accounts)]
pub struct SimpleLottery<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: wallet address or some token account
    #[account(mut)]
    pub payable: AccountInfo<'info>,
    /// CHECK: wallet address or some token account
    #[account(mut)]
    pub beneficiary: AccountInfo<'info>,
    #[account(mut,
        constraint = machine.load()?.awards.total_quota() > 0 @ TwisterError::SoldOut,
        constraint = machine.load()?.filling_fragment_id == DEFAULT_FRAGMENT_ID @ TwisterError::InvalidInstruction,
    )]
    pub machine: AccountLoader<'info, TwisterMachine>,
    #[account(mut, constraint = general.authority == authority.key())]
    pub general: Account<'info, GeneralAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
    // awards token accounts

    // user token accounts
}
