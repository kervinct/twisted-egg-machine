use crate::prelude::*;

#[derive(Accounts)]
pub struct AirdropFragment<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut,
        seeds = [user.key().as_ref(), GeneralAccount::SEEDS],
        bump,
        constraint = general.authority == user.key(),
    )]
    pub general: Account<'info, GeneralAccount>,
    /// CHECK:
    pub user: AccountInfo<'info>,
}
