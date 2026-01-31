use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod reality_check {
    use super::*;

    /// Registers an image on-chain by storing its hash and IPFS CID.
    /// The account is a PDA derived from ["image", image_hash].
    pub fn register_image(
        ctx: Context<RegisterImage>,
        image_hash: String,
        ipfs_cid: String,
    ) -> Result<()> {
        let image_state = &mut ctx.accounts.image_state;
        let clock = Clock::get()?;

        // Validate inputs
        require!(image_hash.len() == 64, ErrorCode::InvalidHashLength);
        require!(ipfs_cid.len() <= 100, ErrorCode::InvalidCidLength);

        // Set the state
        image_state.author = ctx.accounts.author.key();
        image_state.timestamp = clock.unix_timestamp;
        image_state.image_hash = image_hash;
        image_state.ipfs_cid = ipfs_cid;

        msg!("Image registered successfully!");
        msg!("Author: {}", image_state.author);
        msg!("Timestamp: {}", image_state.timestamp);
        msg!("Hash: {}", image_state.image_hash);

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(image_hash: String, ipfs_cid: String)]
pub struct RegisterImage<'info> {
    #[account(
        init,
        payer = author,
        space = 8 + ImageState::INIT_SPACE,
        seeds = [b"image", image_hash.as_bytes()],
        bump
    )]
    pub image_state: Account<'info, ImageState>,

    #[account(mut)]
    pub author: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct ImageState {
    /// The wallet address of the image author
    pub author: Pubkey,
    /// Unix timestamp when the image was registered
    pub timestamp: i64,
    /// SHA-256 hash of the image (64 hex characters)
    #[max_len(64)]
    pub image_hash: String,
    /// IPFS Content Identifier for the image
    #[max_len(100)]
    pub ipfs_cid: String,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Image hash must be exactly 64 characters (SHA-256 hex)")]
    InvalidHashLength,
    #[msg("IPFS CID must be 100 characters or less")]
    InvalidCidLength,
}
