# Developer Demo Server
> A demo application which serves as both and [Issuer](https://docs.unum.id/terminology#issuer) and [Verifier](https://docs.unum.id/terminology#verifier). It is an interactive technical walkthrough that explains how the Unum ID platform works.

Information about the Unum ID demo ecosystem can be found in our [documentation](https://docs.unum.id/#demos).
## API/Fucntionality

### Company
- represents a Customer that has already been created in the SaaS
- Create a Company by posting to `/company`

```typescript
{
  name: string; // customer/company name
  unumIdApiKey: string; // the customer Api Key
  unumIdCustomerUuid: string; // customer uuid
}
```

### HolderApp
POST `/holderApp` calls the SaaS api to create a HolderApp

```typescript
{
  uriScheme: string;
  apiKey: string; // the Holder Api Key to create the HolderApp
  name: string;
  companyUuid: string; // company corresponding to the Customer the HolderApp belongs to
}
```

### Credential
POST `/credenial` calls the Issuer Server App to issue a Credential

```typescript
{
  userUuid: string; // user corresponding to the Subject of the Credential
  issuerUuid: string; // issuer to issue the Credential as
  claims: { [key: string]: any }; // Credential data
  type: string; // Credential type
}
```

### Issuer
POST `/issuer` calls the Issuer Server App to register an Issuer

```typescript
{
  name: string;
  issuerApiKey: string; // Issuer Api Key to register the Issuer
  companyUuid: string; // company corresponding to the Customer to create the Issuer as
}
```

### PresentationRequest
POST `/presentationRequest` calls the Verifier Server App to send a PresentationRequest
```typescript
{
  verifierUuid: string; // verifier to send the request as
  issuerUuid: string; // issuer to request credentials from
  credentialTypes: string[]; // credential types to request
  holderAppUuid: string; // HolderApp to send request to
}
```

### Presentation
POST `/presentation` verifies a Presentation or NoPresentation
Presentation
```typescript
{
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  verifiableCredential: Credential[];
  uuid: string;
  type: ['VerifiablePresentation'];
  proof: Proof;
  presentationRequestUuid: string;
}
```

NoPresentation
```typescript
{
  presentationRequestUuid: string;
  holder: string;
  proof: Proof;
  type: ['NoPresentation']
}
```

### User
- Represents a Subject that has already been created in the SaaS
- create a User by POSTing to `/user`

```typescript
{
  did: string; // the Subject did
  name: string; // whatever name you want
  companyUuid: string; // Company corresponding to the Customer the Subject belongs to
}
```

### Verifier
POST `/verifier` calls the Verifier Server App to register a Verifier

```typescript
{
  name: string;
  companyUuid: string; // Company corresponding to the Customer registering the Verifier
  verifierApiKey: string; // Verifier Api Key to register the Verifier
  url: string; // url to post Presentations to for this Verifier (/presentation endpoint)
}
```

## Release Instructions
### Dev
Just merging changes to `main` will trigger automated deployments to dev.

### Sandbox
To release version of this project to sandbox push a tag with a preceding `v`. This will trigger an automated deployment to sandbox.