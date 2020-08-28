import { Migration } from 'mikro-orm';

export class Migration20200828020147 extends Migration {
  async up (): Promise<void> {
    this.addSql('create table "User" ("uuid" uuid not null, "createdAt" timestamptz(6) not null, "updatedAt" timestamptz(6) not null, "name" varchar(255) not null, "did" varchar(255) null, "companyUuid" uuid not null);');
    this.addSql('alter table "User" add constraint "User_pkey" primary key ("uuid");');

    this.addSql('alter table "User" add constraint "user_companyuuid_foreign" foreign key ("companyUuid") references "Company" ("uuid") on update cascade;');
  }

  async down (): Promise<void> {
    this.addSql('drop table "User";');
  }
}
