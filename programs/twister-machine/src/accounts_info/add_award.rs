use crate::prelude::*;

#[derive(Accounts)]
#[instruction(award_id: u8, new_award: Award)]
pub struct AddAward<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut,
        constraint = machine.load()?.awards.index == award_id @ TwisterError::InvalidAwardId,
    )]
    pub machine: AccountLoader<'info, TwisterMachine>,
    #[account(init,
        seeds = [machine.key().as_ref(), (award_id as u32).to_le_bytes().as_ref()],
        bump,
        payer = authority,
        token::authority = machine,
        token::mint = mint,
    )]
    pub award: Account<'info, TokenAccount>,
    #[account(mut,
        constraint = token.mint == mint.key() @ TwisterError::InvalidAwardMint,
        constraint = token.amount >= new_award.total_amount() @ TwisterError::InsufficientTokenAmount,
    )]
    pub token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
