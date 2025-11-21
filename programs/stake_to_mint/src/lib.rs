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

    pub fn test_accounts(ctx: Context<TestAccounts>) -> Result<()> {
        msg!("=== Account Test ===");
        msg!("User: {}", ctx.accounts.user.key());
        msg!("User token account: {}", ctx.accounts.user_token_account.key());
        msg!("User token mint: {}", ctx.accounts.user_token_mint.key());
        msg!("Staking token account: {}", ctx.accounts.staking_token_account.key());
        msg!("Liability mint: {}", ctx.accounts.liability_mint.key());
        msg!("User liability account: {}", ctx.accounts.user_liability_account.key());
        msg!("Token program: {}", ctx.accounts.token_program.key());
        msg!("=== All accounts passed! ===");
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

        // Use bump from the PDA derivation
        let bump = ctx.bumps.liability_account;

        // Mint liability tokens to user
        let seeds = &[b"liability".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.liability_mint.to_account_info(),
            to: ctx.accounts.user_liability_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
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
        
        // Store bump if this is first initialization
        if ctx.accounts.liability_account.bump == 0 {
            ctx.accounts.liability_account.bump = bump;
        }

        msg!("Staked {} tokens, minted {} liability tokens", amount, liability_amount);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SayHello {}

#[derive(Accounts)]
pub struct TestAccounts<'info> {
    pub user: Signer<'info>,
    /// CHECK: Testing
    pub user_token_account: AccountInfo<'info>,
    /// CHECK: Testing
    pub user_token_mint: AccountInfo<'info>,
    /// CHECK: Testing
    pub staking_token_account: AccountInfo<'info>,
    /// CHECK: Testing
    pub liability_mint: AccountInfo<'info>,
    /// CHECK: Testing
    pub user_liability_account: AccountInfo<'info>,
    /// CHECK: Testing
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    // Removed - we don't actually need this for regular transfer
    // pub user_token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub staking_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"liability"],
        bump,
        space = 8 + 8 + 8 + 1
    )]
    pub liability_account: Account<'info, LiabilityAccount>,

    #[account(mut)]
    pub liability_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_liability_account: Account<'info, TokenAccount>,

    /// CHECK: Mint authority PDA
    #[account(
        seeds = [b"liability"],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct LiabilityAccount {
    pub total_staked: u64,
    pub last_updated: i64,
    pub bump: u8,
}