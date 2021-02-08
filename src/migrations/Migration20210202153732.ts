import { Migration } from 'mikro-orm';

export class Migration20210202153732 extends Migration {
  async up (): Promise<void> {
    this.addSql('alter table "Verifier" drop constraint if exists "Verifier_encryptionPrivateKey_check";');
    this.addSql('alter table "Verifier" alter column "encryptionPrivateKey" type text using ("encryptionPrivateKey"::text);');
    // this.addSql('alter table "Verifier" alter column "encryptionPrivateKey" set not null;');

    // this.addSql('alter table "PresentationRequest" drop constraint if exists "PresentationRequest_deeplink_check";');
    // this.addSql('alter table "PresentationRequest" alter column "deeplink" type jsonb using ("deeplink"::jsonb);');
    // this.addSql('alter table "PresentationRequest" drop constraint if exists "PresentationRequest_data_check";');
    // this.addSql('alter table "PresentationRequest" alter column "data" type jsonb using ("data"::jsonb);');
    // this.addSql('alter table "PresentationRequest" alter column "data" set not null;');
  }
}
