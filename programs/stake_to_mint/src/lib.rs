use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer, MintTo};

declare_id!("BootCCPwrDw4VQorf7UCibk1HSjbWRDRDTWizRPiCyb");

#[program]
pub mod stake_to_mint {
    use super::*;

    pub fn say_hello(_ctx: Context<SayHello>) -> Result<()> {
        msg!("Ayush's first program");
        Ok(())
    }

    pub fn stake_tokens(ctx: Context<StakeTokens>, amount: u64) -> Result<()> {
        let clock = Clock::get()?;
        let user = &ctx.accounts.user;

        // Transfer user's tokens to staking vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.staking_token_account.to_account_info(),
            authority: user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Calculate liability tokens (simple 1:1 for now)
        let liability_amount = amount;

        // Use bump directly from the account struct
        let bump = ctx.accounts.liability_account.bump;

        // Mint liability tokens to user
        let seeds = &[b"liability".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.liability_mint.to_account_info(),
            to: ctx.accounts.user_liability_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(), // FIX: pass AccountInfo
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );

        token::mint_to(cpi_ctx, liability_amount)?;

        // Update staking account
        ctx.accounts.liability_account.total_staked += amount;
        ctx.accounts.liability_account.last_updated = clock.unix_timestamp;

        msg!("Staked {} tokens, minted {} liability tokens", amount, liability_amount);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SayHello {}

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub staking_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = user,
        seeds = [b"liability"],
        bump,
        space = 8 + 8 + 8
    )]
    pub liability_account: Account<'info, LiabilityAccount>,

    #[account(mut)]
    pub liability_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_liability_account: Account<'info, TokenAccount>,

    /// CHECK: Mint authority PDA
    pub mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct LiabilityAccount {
    pub total_staked: u64,
    pub last_updated: i64,
    pub bump: u8, // store bump here to access easily
}
