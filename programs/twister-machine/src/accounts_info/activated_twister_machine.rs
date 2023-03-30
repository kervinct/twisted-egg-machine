use crate::prelude::*;

#[derive(Accounts)]
pub struct ActivatedTwisterMachine<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub machine: AccountLoader<'info, TwisterMachine>,
    pub clock: Sysvar<'info, Clock>,
}
