import { Application } from '../src/declarations';

// resets the test database
export async function resetDb (app: Application): Promise<void> {
  const { em } = app.mikro;
  const connection = em.getConnection();
  await connection.execute('DELETE FROM "Issuer";');
  await connection.execute('DELETE FROM "User";');
  await connection.execute('DELETE FROM "Company";');
}
