use crate::prelude::*;

#[account]
#[derive(Debug, Default)]
pub struct GeneralAccount {
    pub authority: Pubkey,
    pub amount: u16,
}
impl GeneralAccount {
    pub const LEN: usize = 32 + 2;
    pub const SEEDS: &'static [u8] = b"general";
}

#[cfg(test)]
mod tests {}
