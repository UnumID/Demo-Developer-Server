import { Migration } from 'mikro-orm';

export class Migration20201015014740 extends Migration {
  async up (): Promise<void> {
    this.addSql('alter table "Verifier" add column "url" varchar(255);');

    this.addSql('update "Verifier" set "url" = \'https://customer-api.dev-unumid.org/presentation\' where "url" is null;');

    this.addSql('alter table "Verifier" alter column "url" set not null;');

    this.addSql('create table "PresentationRequest" ("uuid" uuid not null, "createdAt" timestamptz(6) not null, "updatedAt" timestamptz(6) not null, "credentialRequests" json not null, "proof" jsonb not null, "metadata" jsonb null, "verifierUuid" uuid not null);');
    this.addSql('alter table "PresentationRequest" add constraint "PresentationRequest_pkey" primary key ("uuid");');

    this.addSql('alter table "PresentationRequest" add constraint "presentationrequest_verifieruuid_foreign" foreign key ("verifierUuid") references "Verifier" ("uuid") on update cascade;');
  }

  async down (): Promise<void> {
    this.addSql('drop table "PresentationRequest";');

    this.addSql('alter table "Verifier" drop column "url";');
  }
}
