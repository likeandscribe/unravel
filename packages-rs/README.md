## Setup

1. Declare the database URL

   ```
   export DATABASE_URL="sqlite://${PWD}/drainpipe.db"
   ```

2. Create the database.

   ```
   cargo xtask sqlx db create
   ```

3. Run sql migrations

   ```
   cargo xtask sqlx migrate run
   ```
