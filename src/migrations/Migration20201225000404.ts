import { Migration } from 'mikro-orm';

export class Migration20201225000404 extends Migration {
  async up (): Promise<void> {
    this.addSql('alter table "PresentationRequest" add column "data" jsonb;');
  }

  async down (): Promise<void> {
    this.addSql('alter table "PresentationRequest" drop column "data";');
  }
}
