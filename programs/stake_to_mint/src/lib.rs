use anchor_lang::prelude::*;

declare_id!("BootCCPwrDw4VQorf7UCibk1HSjbWRDRDTWizRPiCyb");

#[program]
pub mod stake_to_mint {
    use super::*;

    pub fn say_hello(_ctx: Context<SayHello>) -> Result<()> {
        msg!("Ayush's first program");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SayHello {}
