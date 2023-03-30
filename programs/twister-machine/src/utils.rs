use crate::prelude::*;

pub fn valid_time_check(now: i64, start: i64, stop: i64) -> Result<()> {
    if now < start || now > stop {
        msg!("curr: {}, start: {}, stop: {}", now, start, stop);
        return if cfg!(feature = "dev") {
            err!(TwisterError::InvalidTime)
        } else {
            Err(TwisterError::InvalidTime.into())
        };
    }
    Ok(())
}

pub fn activate_time_check(curr: i64, activate_at: i64, stop_at: i64) -> Result<()> {
    if activate_at < curr || stop_at < curr || stop_at < activate_at {
        return if cfg!(feature = "dev") {
            err!(TwisterError::InvalidInstruction)
        } else {
            Err(TwisterError::InvalidInstruction.into())
        };
    }
    Ok(())
}

pub fn is_valid_machine(ctx: &Context<CreateSpecialAccount>) -> Result<()> {
    let machine = &ctx.accounts.machine.load()?;
    match machine.status {
        MachineStatus::Activated => Ok(()),
        _ => {
            if cfg!(feature = "dev") {
                err!(TwisterError::InvalidTwisterMachineStatus)
            } else {
                Err(TwisterError::InvalidTwisterMachineStatus.into())
            }
        }
    }
}

pub fn is_invalid_machine(ctx: &Context<Withdraw>) -> Result<()> {
    let machine = &ctx.accounts.machine.load()?;
    match machine.status {
        MachineStatus::Activated => {
            let now = ctx.accounts.clock.unix_timestamp;
            if now < machine.stop_at {
                return if cfg!(feature = "dev") {
                    err!(TwisterError::InvalidTwisterMachineStatus)
                } else {
                    Err(TwisterError::InvalidTwisterMachineStatus.into())
                };
            }
        }
        _ => {}
    }
    Ok(())
}

pub fn is_valid_award(award: &Award) -> Result<()> {
    if award.quota == 0 || award.rate_numerator == 0 {
        return if cfg!(feature = "dev") {
            err!(TwisterError::InvalidAward)
        } else {
            Err(TwisterError::InvalidAward.into())
        };
    }
    Ok(())
}

pub fn is_valid_fragment(fragment: &Fragment) -> Result<()> {
    if fragment.quota == 0 || fragment.rate_numerator == 0 {
        return if cfg!(feature = "dev") {
            err!(TwisterError::InvalidFragment)
        } else {
            Err(TwisterError::InvalidFragment.into())
        };
    }
    Ok(())
}

pub fn transfer_fragment_and_emit(
    fragment_id: u64,
    general: &mut Account<GeneralAccount>,
    special: &mut Account<SpecialAccount>,
    winner: Pubkey,
) -> Result<()> {
    if fragment_id == DEFAULT_FRAGMENT_ID {
        general.amount += 1;
    } else {
        let special_fragment = special
            .fragments
            .find_fragment_mut(fragment_id)
            .ok_or(error!(TwisterError::InvalidFragmentId))?;
        special_fragment.quota += 1;
    }
    emit!(LotteryEvent {
        winner,
        id: fragment_id,
        ltype: AwardType::Fragment,
        label: "Fragment".to_string(),
    });
    Ok(())
}

pub fn transfer_default_fragment_and_emit(
    general: &mut Account<GeneralAccount>,
    winner: Pubkey,
) -> Result<()> {
    general.amount += 1;
    emit!(LotteryEvent {
        winner,
        id: DEFAULT_FRAGMENT_ID,
        ltype: AwardType::Fragment,
        label: "Fragment".to_string(),
    });
    Ok(())
}
