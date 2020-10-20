import { Migration } from 'mikro-orm';

export class Migration20201020213533 extends Migration {
  async up (): Promise<void> {
    this.addSql('alter table "PresentationRequest" add column "verifierInfo" jsonb not null, add column "issuers" jsonb not null, add column "deeplink" varchar(255) not null, add column "qrCode" text not null;');
  }

  async down (): Promise<void> {
    this.addSql('alter table "PresentationRequest" drop column "verifierInfo", drop column "issuers", drop column "deeplink", drop column "qrCode";');
  }
}
