## Setup

1. Install diesel cli

   ```
   cargo install diesel_cli --no-default-features --features sqlite
   ```

2. Create the database.

   ```
   diesel setup
   ```

3. Run sql migrations

   ```
   diesel migration run
   ```
