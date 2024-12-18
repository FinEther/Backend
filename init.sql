DO $$ BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'projet_python_user') THEN
      CREATE DATABASE projet_python_user;
   END IF;
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'projet_python_bank') THEN
      CREATE DATABASE projet_python_bank;
   END IF;
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'projet_python_accounts') THEN
      CREATE DATABASE projet_python_accounts;
   END IF;
EXCEPTION
   WHEN OTHERS THEN
      RAISE NOTICE 'Error creating databases: %', SQLERRM;
END $$;
