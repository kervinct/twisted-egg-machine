use crate::prelude::*;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub machine: AccountLoader<'info, TwisterMachine>,
    #[account(mut)]
    pub award: Account<'info, TokenAccount>,
    #[account(mut)]
    pub token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}
