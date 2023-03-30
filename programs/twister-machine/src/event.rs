use crate::prelude::*;

#[event]
pub struct LotteryEvent {
    pub winner: Pubkey,
    pub id: u64,
    pub ltype: AwardType,
    #[index]
    pub label: String,
}

#[derive(Debug, AnchorDeserialize, AnchorSerialize)]
#[repr(u8)]
pub enum AwardType {
    Award,
    Fragment,
}
