use clap::Parser;

#[tokio::main]
async fn main() {
    if let Err(e) = try_main().await {
        eprintln!("{}", e);
        std::process::exit(-1);
    }
}

type DynError = Box<dyn std::error::Error>;

#[derive(Parser, Debug)]
#[clap(bin_name = "cargo xtask")]
enum Cli {
    Sqlx(sqlx_cli::Opt),
}

async fn try_main() -> Result<(), DynError> {
    let cli = Cli::parse();
    match cli {
        Cli::Sqlx(opt) => sqlx_cli::run(opt).await?,
    }

    Ok(())
}
