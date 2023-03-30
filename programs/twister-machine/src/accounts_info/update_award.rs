use crate::prelude::*;

#[derive(Accounts)]
pub struct UpdateAward<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub machine: AccountLoader<'info, TwisterMachine>,
}
