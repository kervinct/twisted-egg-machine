use crate::prelude::*;

pub const MAX_AWARDS: usize = 100;
pub const MAX_FRAGMENTS: usize = 30;
pub const AWARD_RATE_DENOMINATOR: u32 = 10000;
pub const DEFAULT_FRAGMENT_ID: u64 = 0;
pub const DEFAULT_LIMIT: u16 = 10;

#[account(zero_copy)]
#[derive(Debug, AnchorDeserialize, AnchorSerialize)]
#[repr(C)]
pub struct TwisterMachine {
    pub nonce: u8,
    pub status: MachineStatus,
    pub default_limit: u16,
    padding: [u8; 4],
    pub rand_seed: u64,
    pub machine_id: u64,
    pub price: u64,
    // which fragment used for filling
    pub filling_fragment_id: u64,
    pub activate_at: i64,
    pub stop_at: i64,
    // always wallet address
    pub beneficiary: Pubkey,
    // which token for payment, native-sol or some other token
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub awards: Awards,
    pub fragments: Fragments,
}

impl Default for TwisterMachine {
    fn default() -> Self {
        Self {
            nonce: 0,
            status: MachineStatus::default(),
            default_limit: 0,
            padding: [0xAA; 4],
            rand_seed: 0,
            machine_id: 0,
            price: 0,
            filling_fragment_id: DEFAULT_FRAGMENT_ID,
            activate_at: 0,
            stop_at: 0,
            beneficiary: Pubkey::default(),
            mint: Pubkey::default(),
            authority: Pubkey::default(),
            awards: Awards::default(),
            fragments: Fragments::default(),
        }
    }
}
impl TwisterMachine {
    pub const LEN: usize = std::mem::size_of::<Self>();

    pub const SEEDS: &'static [u8] = b"twister";

    #[inline(always)]
    pub fn total_quota(&self) -> u32 {
        self.awards.total_quota() + self.fragments.total_quota()
    }
    #[inline(always)]
    pub fn total_rate(&self) -> u32 {
        self.awards.total_rate() + self.fragments.total_rate()
    }
    #[inline(always)]
    pub fn is_valid_machine(&self) -> bool {
        self.total_quota() != 0
            && self.total_rate() != 0
            && self.total_rate() <= AWARD_RATE_DENOMINATOR
    }
    pub fn find_award_mut_by_choice(&mut self, choice: u32) -> (u8, &mut Award) {
        self.awards.find_award_mut_by_choice(choice)
    }
    pub fn find_fragment_mut_by_choice(&mut self, choice: u32) -> Option<&mut Fragment> {
        self.fragments
            .find_fragment_mut_by_choice(self.awards.total_rate(), choice)
    }
}

#[derive(Debug, Clone, Copy, AnchorDeserialize, AnchorSerialize)]
pub enum PaymentType {
    Paid,
    Fragment { id: u64 },
}

#[derive(Debug, Clone, Copy, AnchorDeserialize, AnchorSerialize)]
#[repr(u8)]
pub enum MachineStatus {
    Uninitialized,
    Initialized,
    Activated,
    Closed,
}
impl Default for MachineStatus {
    fn default() -> Self {
        MachineStatus::Uninitialized
    }
}

#[derive(Debug, Clone, Copy, AnchorDeserialize, AnchorSerialize)]
#[repr(C)]
pub struct Awards {
    pub awards: [Award; MAX_AWARDS],
    pub index: u8,
    padding: [u8; 7],
}
impl Default for Awards {
    fn default() -> Self {
        Self {
            awards: [Award::default(); MAX_AWARDS],
            index: 0,
            padding: [0; 7],
        }
    }
}
impl Awards {
    pub fn push(&mut self, award: Award) -> bool {
        if (self.index as usize) < MAX_AWARDS {
            self.awards[self.index as usize] = award;
            self.index += 1;

            return true;
        }
        false
    }
    #[inline(always)]
    pub fn is_empty(&self) -> bool {
        self.index == 0
    }
    pub fn total_quota(&self) -> u32 {
        self.awards
            .iter()
            .take(self.index as usize)
            .fold(0, |acc, award| acc + award.quota as u32)
    }
    pub fn total_rate(&self) -> u32 {
        self.awards
            .iter()
            .take(self.index as usize)
            .fold(0, |acc, award| acc + award.rate_numerator as u32)
    }
    pub fn find_award(&self, id: u8) -> Option<&Award> {
        if id < self.index {
            return Some(&self.awards[id as usize]);
        }
        None
    }
    pub fn find_award_mut(&mut self, id: u8) -> Option<&mut Award> {
        if id < self.index {
            return Some(&mut self.awards[id as usize]);
        }
        None
    }
    pub fn find_award_mut_by_choice(&mut self, choice: u32) -> (u8, &mut Award) {
        let mut index = 0;
        let mut rate = 0;
        self.awards
            .iter()
            .take(self.index as usize)
            .take_while(|award| {
                rate += award.rate_numerator as u32;
                if rate > choice {
                    return false;
                }
                index += 1;
                true
            })
            .last();
        (index, &mut self.awards[index as usize])
    }
}
#[derive(Debug, Clone, Copy, Default, AnchorDeserialize, AnchorSerialize)]
#[repr(C)]
pub struct Award {
    pub amount: u64,
    pub quota: u16,
    pub rate_numerator: u16,
    padding: [u8; 4],
}
impl Award {
    pub fn total_amount(&self) -> u64 {
        self.amount.checked_mul(self.quota as u64).unwrap()
    }
    pub fn is_empty(&self) -> bool {
        self.quota == 0
    }
    pub fn decr(&mut self) -> bool {
        if self.quota > 0 {
            self.quota -= 1;
            return true;
        }
        false
    }
}

#[derive(Debug, Clone, Copy, AnchorDeserialize, AnchorSerialize)]
#[repr(C)]
pub struct Fragments {
    pub fragments: [Fragment; MAX_FRAGMENTS],
    pub index: u8,
    padding: [u8; 7],
}
impl Default for Fragments {
    fn default() -> Self {
        Self {
            index: 0,
            fragments: [Fragment::default(); MAX_FRAGMENTS],
            padding: [0; 7],
        }
    }
}
impl Fragments {
    pub fn push(&mut self, fragment: Fragment) -> bool {
        if (self.index as usize) < MAX_FRAGMENTS {
            self.fragments[self.index as usize] = fragment;
            self.index += 1;
            return true;
        }
        false
    }
    pub fn is_empty(&self) -> bool {
        self.index == 0
    }
    pub fn total_quota(&self) -> u32 {
        self.fragments
            .iter()
            .take(self.index as usize)
            .fold(0, |acc, fragment| acc + fragment.quota as u32)
    }
    pub fn total_rate(&self) -> u32 {
        self.fragments
            .iter()
            .take(self.index as usize)
            .fold(0, |acc, fragment| acc + fragment.rate_numerator as u32)
    }
    pub fn find_fragment(&self, id: u64) -> Option<&Fragment> {
        self.fragments
            .iter()
            .take(self.index as usize)
            .find(|fragment| fragment.id == id)
    }
    pub fn find_fragment_mut(&mut self, id: u64) -> Option<&mut Fragment> {
        self.fragments
            .iter_mut()
            .take(self.index as usize)
            .find(|fragment| fragment.id == id)
    }
    pub fn find_fragment_mut_by_choice(
        &mut self,
        awards_rate: u32,
        choice: u32,
    ) -> Option<&mut Fragment> {
        if choice >= self.total_rate() + awards_rate {
            return None;
        }
        let mut index = 0;
        let mut rate = awards_rate;
        self.fragments
            .iter()
            .take(self.index as usize)
            .take_while(|fragment| {
                rate += fragment.rate_numerator as u32;
                if rate > choice {
                    return false;
                }
                index += 1;
                true
            })
            .last();
        Some(&mut self.fragments[index])
    }
}
#[derive(Debug, Clone, Copy, AnchorDeserialize, AnchorSerialize)]
#[repr(C)]
pub struct Fragment {
    // fragment id.
    pub id: u64,
    // curr fragment balance.
    pub quota: u16,
    // exchange rate, while in special account, the limit is always zero.
    pub limit: u16,
    pub rate_numerator: u16,
    padding: [u8; 2],
}
impl Fragment {
    pub fn new(id: u64) -> Self {
        Self {
            id,
            ..Default::default()
        }
    }
    pub fn new_with_limit(id: u64, limit: u16) -> Self {
        Self {
            id,
            limit,
            ..Default::default()
        }
    }
    pub fn decr(&mut self) -> bool {
        if self.quota > 0 {
            self.quota -= 1;
            return true;
        }
        false
    }
}
impl Default for Fragment {
    fn default() -> Self {
        Self {
            id: 0,
            quota: 0,
            limit: 10,
            rate_numerator: 0,
            padding: [0; 2],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    pub fn test_machine_size() {
        assert_eq!(std::mem::size_of::<TwisterMachine>(), TwisterMachine::LEN);
    }
    #[test]
    pub fn test_find_award_mut() {
        let mut awards = Awards::default();
        awards.push(Award {
            amount: 10,
            quota: 100,
            rate_numerator: 5,
            ..Default::default()
        });
        awards.push(Award {
            amount: 5,
            quota: 200,
            rate_numerator: 10,
            ..Default::default()
        });

        let mut award = awards.find_award_mut_by_choice(95);
        assert_eq!(award.1.amount, 10);
        assert_eq!(award.1.quota, 100);

        award = awards.find_award_mut_by_choice(105);
        assert_eq!(award.1.amount, 5);
        assert_eq!(award.1.quota, 200);
    }

    #[test]
    pub fn test_find_fragment_mut() {
        let mut fragments = Fragments::default();
        fragments.push(Fragment {
            id: 1,
            quota: 100,
            limit: 5,
            rate_numerator: 5,
            ..Default::default()
        });
        fragments.push(Fragment {
            id: 2,
            quota: 200,
            limit: 10,
            rate_numerator: 10,
            ..Default::default()
        });
        fragments.push(Fragment {
            id: 3,
            quota: 300,
            limit: 15,
            rate_numerator: 15,
            ..Default::default()
        });

        let mut fragment = fragments.find_fragment_mut_by_choice(15, 19).unwrap();
        assert_eq!(fragment.id, 1);
        assert_eq!(fragment.quota, 100);

        fragment = fragments.find_fragment_mut_by_choice(15, 20).unwrap();
        assert_eq!(fragment.id, 2);
        assert_eq!(fragment.quota, 200);

        fragment = fragments.find_fragment_mut_by_choice(15, 44).unwrap();
        assert_eq!(fragment.id, 3);
        assert_eq!(fragment.quota, 300);

        let fragment = fragments.find_fragment_mut_by_choice(15, 45);
        assert!(fragment.is_none());
    }

    #[test]
    pub fn test_find_fragment_with_default() {
        let mut fragments = Fragments::default();
        fragments.push(Fragment {
            id: 0,
            quota: 100,
            limit: 10,
            rate_numerator: 5,
            ..Default::default()
        });
        fragments.push(Fragment {
            id: 1,
            quota: 500,
            limit: 3,
            rate_numerator: 500,
            ..Default::default()
        });

        let mut fragment = fragments.find_fragment_mut_by_choice(100, 105);
        assert!(fragment.is_some());
        assert_eq!(fragment.unwrap().id, 1);

        fragment = fragments.find_fragment_mut_by_choice(100, 605);
        assert!(fragment.is_none());

        let fragment = fragments.find_fragment(DEFAULT_FRAGMENT_ID);
        assert!(fragment.is_some());
        assert_eq!(fragment.unwrap().id, DEFAULT_FRAGMENT_ID);
        assert_eq!(fragment.unwrap().quota, 100);
        assert_eq!(fragment.unwrap().limit, 10);
    }

    #[test]
    pub fn test_find_fragment_with_default_fragment_as_filling() {
        let fragments = Fragments::default();

        assert!(fragments.find_fragment(DEFAULT_FRAGMENT_ID).is_none());
        assert_eq!(fragments.total_quota(), 0);
        assert_eq!(fragments.total_rate(), 0);
    }

    #[test]
    pub fn test_find_award_with_empty() {
        let mut awards = Awards::default();
        awards.push(Award {
            amount: 10,
            quota: 100,
            rate_numerator: 5,
            ..Default::default()
        });
        awards.push(Award {
            amount: 5,
            quota: 0,
            rate_numerator: 10,
            ..Default::default()
        });
        awards.push(Award {
            amount: 1,
            quota: 200,
            rate_numerator: 10,
            ..Default::default()
        });

        let mut award = awards.find_award_mut_by_choice(4);
        assert_eq!(award.0, 0);
        assert_eq!(award.1.amount, 10);
        assert_eq!(award.1.quota, 100);

        award = awards.find_award_mut_by_choice(5);
        assert_eq!(award.0, 1);
        assert_eq!(award.1.amount, 5);
        assert_eq!(award.1.quota, 0);
    }
}
