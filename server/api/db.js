import pkg from 'pg';
const { Pool } = pkg;

export default new Pool({

  user: "imageapp",
  host: "db",
  database: "imageapp",
  password: "password",
  port: 5432
});
