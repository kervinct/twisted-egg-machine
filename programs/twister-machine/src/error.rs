use crate::prelude::*;

#[error_code]
pub enum TwisterError {
    #[msg("Invalid Time")]
    InvalidTime,
    #[msg("Invalid Fragment Id")]
    InvalidFragmentId,
    #[msg("Invalid Award Id")]
    InvalidAwardId,
    #[msg("Not Enough Fragment")]
    NotEnoughFragment,
    #[msg("Invalid Instruction")]
    InvalidInstruction,
    #[msg("Invalid Award Account")]
    InvalidAwardAccount,
    #[msg("Invalid User Account")]
    InvalidUserAccount,
    #[msg("Mismatched Payment Account")]
    MismatchedPaymentAccount,
    #[msg("Payable Not Enough Balance")]
    PayableNotEnoughBalance,
    #[msg("Fragment Is Filling Fragment")]
    FragmentIsFilling,
    #[msg("Too Many Awards")]
    TooManyAwards,
    #[msg("Invalid Award Mint")]
    InvalidAwardMint,
    #[msg("Insufficient Token Amount")]
    InsufficientTokenAmount,
    #[msg("Fragment Already Exists")]
    FragmentAlreadyExists,
    #[msg("Too Many Fragments")]
    TooManyFragments,
    #[msg("Invalid Twister Machine Status")]
    InvalidTwisterMachineStatus,
    #[msg("Invalid Award")]
    InvalidAward,
    #[msg("Invalid Fragment")]
    InvalidFragment,
    #[msg("Invalid Payable Account")]
    InvalidPayableAccount,
    #[msg("Invalid Beneficiary Account")]
    InvalidBeneficiaryAccount,
    #[msg("Invalid Special Account")]
    InvalidSpecialAccount,
    #[msg("Sold out")]
    SoldOut,
}
