import { Migration } from 'mikro-orm';

export class Migration20200828230614 extends Migration {
  async up (): Promise<void> {
    this.addSql('create table "IssuedCredential" ("uuid" uuid not null, "createdAt" timestamptz(6) not null, "updatedAt" timestamptz(6) not null, "userUuid" uuid not null, "issuerUuid" uuid not null, "credential" jsonb not null);');
    this.addSql('alter table "IssuedCredential" add constraint "IssuedCredential_pkey" primary key ("uuid");');

    this.addSql('alter table "IssuedCredential" add constraint "issuedcredential_useruuid_foreign" foreign key ("userUuid") references "User" ("uuid") on update cascade;');
    this.addSql('alter table "IssuedCredential" add constraint "issuedcredential_issueruuid_foreign" foreign key ("issuerUuid") references "Issuer" ("uuid") on update cascade;');
  }

  async down (): Promise<void> {
    this.addSql('drop table "IssuedCredential";');
  }
}
