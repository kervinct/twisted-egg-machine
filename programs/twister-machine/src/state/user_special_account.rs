use crate::prelude::*;
#[account]
#[derive(Debug, Default)]
pub struct SpecialAccount {
    pub authority: Pubkey,
    pub fragments: Fragments,
}
impl SpecialAccount {
    pub const LEN: usize = std::mem::size_of::<Self>();
    pub const SEEDS: &'static [u8] = b"special";
}
