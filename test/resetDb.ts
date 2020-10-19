import { EntityManager } from 'mikro-orm';

// resets the test database
export async function resetDb (em: EntityManager): Promise<void> {
  const connection = em.getConnection();
  await connection.execute('DELETE FROM "HolderApp";');
  await connection.execute('DELETE FROM "PresentationRequest";');
  await connection.execute('DELETE FROM "SharedCredential";');
  await connection.execute('DELETE FROM "IssuedCredential";');
  await connection.execute('DELETE FROM "Issuer";');
  await connection.execute('DELETE FROM "Verifier";');
  await connection.execute('DELETE FROM "User";');
  await connection.execute('DELETE FROM "Company";');
}
