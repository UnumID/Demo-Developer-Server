import { Migration } from 'mikro-orm';

export class Migration20201019165650 extends Migration {
  async up (): Promise<void> {
    this.addSql('create table "HolderApp" ("uuid" uuid not null, "createdAt" timestamptz(6) not null, "updatedAt" timestamptz(6) not null, "uriScheme" varchar(255) not null, "apiKey" varchar(255) not null, "name" varchar(255) not null, "company" uuid not null);');
    this.addSql('alter table "HolderApp" add constraint "HolderApp_pkey" primary key ("uuid");');

    this.addSql('alter table "HolderApp" add constraint "holderapp_company_foreign" foreign key ("company") references "Company" ("uuid") on update cascade;');
  }

  async down (): Promise<void> {
    this.addSql('drop table "HolderApp";');
  }
}
