use crate::prelude::*;

#[derive(Accounts)]
pub struct AirdropSpecialFragment<'info> {
    /// CHECK:
    #[account(mut)]
    pub authority: Signer<'info>,
    pub machine: AccountLoader<'info, TwisterMachine>,
    #[account(mut,
        seeds = [machine.key().as_ref(), user.key().as_ref(), SpecialAccount::SEEDS],
        bump,
        constraint = special.authority == user.key(),
    )]
    pub special: Account<'info, SpecialAccount>,
    /// CHECK:
    pub user: AccountInfo<'info>,
}
