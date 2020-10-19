import { Migration } from 'mikro-orm';

export class Migration20201019222906 extends Migration {
  async up (): Promise<void> {
    this.addSql('alter table "Issuer" drop column "uriScheme";');
  }

  async down (): Promise<void> {
    this.addSql('alter table "Issuer" add column "uriScheme" varchar(255);');
  }
}
