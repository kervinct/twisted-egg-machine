use crate::prelude::*;

#[derive(Accounts)]
pub struct CreateGeneralAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK:
    pub user: AccountInfo<'info>,
    #[account(init, payer = authority, space = 8 + GeneralAccount::LEN,
        seeds = [user.key().as_ref(), GeneralAccount::SEEDS],
        bump,
    )]
    pub general: Account<'info, GeneralAccount>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
