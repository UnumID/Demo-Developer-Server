import { Migration } from 'mikro-orm';

export class Migration20210202035900 extends Migration {
  async up (): Promise<void> {
    this.addSql('alter table "Verifier" add column "encryptionPrivateKey" text;');

    // this.addSql('alter table "PresentationRequest" drop constraint if exists "PresentationRequest_deeplink_check";');
    // this.addSql('alter table "PresentationRequest" alter column "deeplink" type jsonb using ("deeplink"::jsonb);');
    // this.addSql('alter table "PresentationRequest" drop constraint if exists "PresentationRequest_data_check";');
    // this.addSql('alter table "PresentationRequest" alter column "data" type jsonb using ("data"::jsonb);');
    // this.addSql('alter table "PresentationRequest" alter column "data" set not null;');
  }
}
