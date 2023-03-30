use crate::prelude::*;

#[derive(Accounts)]
pub struct CreateSpecialAccount<'info> {
    /// CHECK:
    #[account(mut)]
    pub authority: Signer<'info>,
    pub machine: AccountLoader<'info, TwisterMachine>,
    /// CHECK:
    pub user: AccountInfo<'info>,
    #[account(init, payer = authority, space = 8 + SpecialAccount::LEN,
        seeds = [machine.key().as_ref(), user.key().as_ref(), SpecialAccount::SEEDS],
        bump,
    )]
    pub special: Account<'info, SpecialAccount>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
