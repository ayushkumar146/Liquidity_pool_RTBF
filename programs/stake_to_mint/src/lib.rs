use anchor_lang::prelude::*;

declare_id!("6UcxQHi1hZZFr2MixGdXJR6oVvJ7FHL3bGVM89YiAzMV");

#[program]
pub mod stake_to_mint {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
