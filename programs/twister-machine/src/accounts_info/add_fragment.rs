use crate::prelude::*;

#[derive(Accounts)]
pub struct AddFragment<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub machine: AccountLoader<'info, TwisterMachine>,
}
