import { Migration } from 'mikro-orm';

export class Migration20210617203817 extends Migration {
  async up (): Promise<void> {
    this.addSql('alter table "PresentationRequest" add column "id" varchar(255) not null;');
  }
}
