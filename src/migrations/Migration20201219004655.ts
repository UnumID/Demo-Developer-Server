import { Migration } from 'mikro-orm';

export class Migration20201219004655 extends Migration {
  async up (): Promise<void> {
    this.addSql('create table "Username" ("uuid" uuid not null, "createdAt" timestamptz(6) not null, "updatedAt" timestamptz(6) not null, "username" varchar(255) not null);');
    this.addSql('alter table "Username" add constraint "Username_pkey" primary key ("uuid");');
    this.addSql('create index "Username_username_index" on "Username" ("username");');
    this.addSql('alter table "Username" add constraint "Username_username_unique" unique ("username");');
  }

  async down (): Promise<void> {
    this.addSql('drop table "Username";');
  }
}
