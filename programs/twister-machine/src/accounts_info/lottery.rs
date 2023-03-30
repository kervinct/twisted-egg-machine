use crate::prelude::*;

#[derive(Accounts)]
pub struct Lottery<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK:
    #[account(mut)]
    pub payable: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub beneficiary: AccountInfo<'info>,
    #[account(mut,
        constraint = machine.load()?.awards.total_quota() > 0 @ TwisterError::SoldOut,
    )]
    pub machine: AccountLoader<'info, TwisterMachine>,
    #[account(mut, constraint = general.authority == authority.key())]
    pub general: Account<'info, GeneralAccount>,
    #[account(mut, constraint = special.authority == authority.key())]
    pub special: Account<'info, SpecialAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
    // awards token accounts

    // user token accounts
}
