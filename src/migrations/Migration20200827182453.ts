import { Migration } from 'mikro-orm';

export class Migration20200827182453 extends Migration {
  async up (): Promise<void> {
    this.addSql('create table "Company" ("uuid" uuid not null, "createdAt" timestamptz(6) not null, "updatedAt" timestamptz(6) not null, "unumIdApiKey" varchar(255) not null, "unumIdCustomerUuid" uuid not null, "name" varchar(255) not null);');
    this.addSql('alter table "Company" add constraint "Company_pkey" primary key ("uuid");');
  }

  async down (): Promise<void> {
    this.addSql('drop table "Company";');
  }
}
