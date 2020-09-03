import { Migration } from 'mikro-orm';

export class Migration20200903013259 extends Migration {
  async up (): Promise<void> {
    this.addSql('create table "Verifier" ("uuid" uuid not null, "createdAt" timestamptz(6) not null, "updatedAt" timestamptz(6) not null, "did" varchar(255) not null, "privateKey" text not null, "authToken" text not null, "name" varchar(255) not null, "companyUuid" uuid not null);');
    this.addSql('alter table "Verifier" add constraint "Verifier_pkey" primary key ("uuid");');

    this.addSql('alter table "Verifier" add constraint "verifier_companyuuid_foreign" foreign key ("companyUuid") references "Company" ("uuid") on update cascade;');
  }

  async down (): Promise<void> {
    this.addSql('drop table "Verifier";');
  }
}
