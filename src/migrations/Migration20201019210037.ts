import { Migration } from 'mikro-orm';

export class Migration20201019210037 extends Migration {
  async up (): Promise<void> {
    this.addSql('alter table "PresentationRequest" add column "holderAppUuid" uuid not null;');

    this.addSql('alter table "PresentationRequest" add constraint "presentationrequest_holderappuuid_foreign" foreign key ("holderAppUuid") references "HolderApp" ("uuid") on update cascade;');
  }

  async down (): Promise<void> {
    this.addSql('alter table "PresentationRequest" drop column "holderAppUuid";');
  }
}
