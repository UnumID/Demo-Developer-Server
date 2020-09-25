import { Migration } from 'mikro-orm';

export class Migration20200925225556 extends Migration {
  async up (): Promise<void> {
    this.addSql('create table "SharedCredential" ("uuid" uuid not null, "createdAt" timestamptz(6) not null, "updatedAt" timestamptz(6) not null, "userUuid" uuid not null, "issuerUuid" uuid not null, "verifierUuid" uuid not null, "credential" jsonb not null);');
    this.addSql('alter table "SharedCredential" add constraint "SharedCredential_pkey" primary key ("uuid");');

    this.addSql('alter table "SharedCredential" add constraint "sharedcredential_useruuid_foreign" foreign key ("userUuid") references "User" ("uuid") on update cascade;');
    this.addSql('alter table "SharedCredential" add constraint "sharedcredential_issueruuid_foreign" foreign key ("issuerUuid") references "Issuer" ("uuid") on update cascade;');
    this.addSql('alter table "SharedCredential" add constraint "sharedcredential_verifieruuid_foreign" foreign key ("verifierUuid") references "Verifier" ("uuid") on update cascade;');
  }

  async down (): Promise<void> {
    this.addSql('drop table "SharedCredential";');
  }
}
