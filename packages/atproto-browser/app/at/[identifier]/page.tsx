import { getAtUriPath, isNotNull, utcDateFormatter } from "@/lib/util";
import Link from "next/link";
import { Fragment, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { z } from "zod";
import { DidDoc, DidHandle } from "../_lib/did-components";
import { resolveIdentity } from "@/lib/atproto-server";
import { AtUri } from "@atproto/syntax";
import { DidCollections } from "../_lib/collection-server";

export default async function IdentifierPage({
  params,
}: {
  params: { identifier: string };
}) {
  const identityResult = await resolveIdentity(params.identifier);
  if (!identityResult.success) {
    return <div>{identityResult.error}</div>;
  }

  return (
    <>
      <h1>
        <DidHandle did={identityResult.didDocument.id} />
      </h1>

      <h2>Collections</h2>
      <DidCollections identifier={identityResult.didDocument.id} />

      <h2>DID Doc</h2>
      <DidDoc did={identityResult.didDocument.id} />

      <Suspense fallback={<p>Loading history...</p>}>
        <ErrorBoundary fallback={<p>Failed to fetch history.</p>}>
          <h2>History</h2>
          <DidHistory identifier={params.identifier} />
        </ErrorBoundary>
      </Suspense>
    </>
  );
}

async function DidHistory({ identifier }: { identifier: string }) {
  const identity = await resolveIdentity(identifier);
  if (!identity.success) {
    throw new Error(identity.error);
  }
  const did = identity.didDocument.id;

  const response = await fetch(`https://plc.directory/${did}/log/audit`);
  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.statusText}`);
  }

  const auditLog = PlcLogAuditResponse.parse(await response.json());

  return (
    <ol>
      {auditLog.map((previous, index) => {
        const previousOperation = previous.operation;
        if (previousOperation.type !== "plc_operation") {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <li key={index}>
              Change created at {utcDateFormatter.format(previous.createdAt)}{" "}
              (UTC) of type &quot;{previousOperation.type}&quot;.
            </li>
          );
        }
        const entry = auditLog[index + 1];
        if (!entry) {
          return null;
        }
        const entryOperation = entry.operation;
        if (entryOperation.type !== "plc_operation") {
          return null;
        }

        const alsoKnownAsAdded = entryOperation.alsoKnownAs.filter(
          (x) => !previousOperation.alsoKnownAs.includes(x),
        );
        const alsoKnownAsRemoved = previousOperation.alsoKnownAs.filter(
          (x) => !entryOperation.alsoKnownAs.includes(x),
        );

        const servicesChanged = Object.entries(entryOperation.services)
          .map(([id, service]) => {
            const previousService = previousOperation.services[id];
            if (!previousService) return null;
            return {
              id,
              type:
                service.type !== previousService.type
                  ? {
                      from: previousService.type,
                      to: service.type,
                    }
                  : null,
              endpoint:
                service.endpoint !== previousService.endpoint
                  ? {
                      from: previousService.endpoint,
                      to: service.endpoint,
                    }
                  : null,
            };
          })
          .filter(isNotNull);

        const servicesAdded = Object.entries(entryOperation.services).filter(
          ([id]) => !previousOperation.services[id],
        );
        const servicesRemoved = Object.entries(
          previousOperation.services,
        ).filter(([id]) => !entryOperation.services[id]);

        const rotationKeysAdded = entryOperation.rotationKeys.filter(
          (x) => !previousOperation.rotationKeys.includes(x),
        );
        const rotationKeysRemoved = previousOperation.rotationKeys.filter(
          (x) => !entryOperation.rotationKeys.includes(x),
        );

        const verificationMethodsChanged = Object.entries(
          entryOperation.verificationMethods,
        )
          .map(([id, key]) => {
            const previousKey = previousOperation.verificationMethods[id];
            if (!previousKey) return null;
            if (key === previousKey) return null;
            return {
              id,
              from: previousKey,
              to: key,
            };
          })
          .filter(isNotNull);
        const verificationMethodsAdded = Object.entries(
          entryOperation.verificationMethods,
        ).filter(([id]) => !previousOperation.verificationMethods[id]);
        const verificationMethodsRemoved = Object.entries(
          previousOperation.verificationMethods,
        ).filter(([id]) => !entryOperation.verificationMethods[id]);

        return (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>
            <p>
              Change created at {utcDateFormatter.format(entry.createdAt)} (UTC)
            </p>
            <ul>
              {alsoKnownAsAdded.length === 1 &&
              alsoKnownAsRemoved.length === 1 ? (
                <li>
                  Alias changed from{" "}
                  <Link href={getAtUriPath(new AtUri(alsoKnownAsRemoved[0]!))}>
                    {alsoKnownAsRemoved[0]}
                  </Link>{" "}
                  to{" "}
                  <Link href={getAtUriPath(new AtUri(alsoKnownAsAdded[0]!))}>
                    {alsoKnownAsAdded[0]}
                  </Link>
                </li>
              ) : (
                <>
                  {alsoKnownAsAdded.length > 0 && (
                    <li>
                      Alias added:{" "}
                      {alsoKnownAsAdded.flatMap((aka) => [
                        <Link key={aka} href={getAtUriPath(new AtUri(aka))}>
                          {aka}
                        </Link>,
                        ", ",
                      ])}
                    </li>
                  )}
                  {alsoKnownAsRemoved.length > 0 && (
                    <li>
                      Alias removed:{" "}
                      {alsoKnownAsRemoved.flatMap((aka) => [
                        <Link key={aka} href={getAtUriPath(new AtUri(aka))}>
                          {aka}
                        </Link>,
                        ", ",
                      ])}
                    </li>
                  )}
                </>
              )}
              {servicesChanged.length > 0 &&
                servicesChanged.map((service) => (
                  <Fragment key={service.id}>
                    {!!service.type && (
                      <li key={service.id}>
                        Service &quot;{service.id}&quot; changed type from
                        &quot;
                        {service.type.from}&quot; to &quot;{service.type.to}
                        &quot;
                      </li>
                    )}
                    {!!service.endpoint && (
                      <li key={service.id}>
                        Service &quot;{service.id}&quot; changed endpoint from{" "}
                        <a href={service.endpoint.from}>
                          {service.endpoint.from}
                        </a>{" "}
                        to{" "}
                        <a href={service.endpoint.to}>{service.endpoint.to}</a>
                      </li>
                    )}
                  </Fragment>
                ))}
              {servicesAdded.length > 0 && (
                <li>
                  Services added:{" "}
                  {servicesAdded.flatMap(([id, service]) => [
                    <Link key={id} href={service.endpoint}>
                      {id} ({service.type})
                    </Link>,
                    ", ",
                  ])}
                </li>
              )}
              {servicesRemoved.length > 0 && (
                <li>
                  Services removed:{" "}
                  {servicesRemoved.flatMap(([id, service]) => [
                    <Link key={id} href={service.endpoint}>
                      {id} ({service.type})
                    </Link>,
                    ", ",
                  ])}
                </li>
              )}
              {rotationKeysAdded.length > 0 && (
                <li>
                  Rotation keys added:{" "}
                  {rotationKeysAdded.flatMap((key) => [
                    <code key={key}>{key}</code>,
                    ", ",
                  ])}
                </li>
              )}
              {rotationKeysRemoved.length > 0 && (
                <li>
                  Rotation keys removed:{" "}
                  {rotationKeysRemoved.flatMap((key) => [
                    <code key={key}>{key}</code>,
                    ", ",
                  ])}
                </li>
              )}
              {verificationMethodsChanged.length > 0 &&
                verificationMethodsChanged.map((method) => (
                  <li key={method.id}>
                    Verification method &quot;{method.id}&quot; changed from{" "}
                    <code>{method.from}</code> to <code>{method.to}</code>
                  </li>
                ))}
              {verificationMethodsAdded.length > 0 && (
                <li>
                  Verification methods added:{" "}
                  {verificationMethodsAdded.flatMap(([id, key]) => [
                    <Fragment key={id}>
                      <code>{key}</code> (&quot;{id}&quot;)
                    </Fragment>,
                    ", ",
                  ])}
                </li>
              )}
              {verificationMethodsRemoved.length > 0 && (
                <li>
                  Verification methods removed:{" "}
                  {verificationMethodsRemoved.flatMap(([id, key]) => [
                    <Fragment key={id}>
                      <code>{key}</code> (&quot;{id}&quot;)
                    </Fragment>,
                    ", ",
                  ])}
                </li>
              )}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

const PlcLogAuditResponse = z.array(
  z.object({
    createdAt: z
      .string()
      .datetime()
      .transform((x) => new Date(x)),
    operation: z.union([
      z.object({
        type: z.literal("plc_operation"),
        sig: z.string(),
        prev: z.string().nullable(),
        services: z.record(
          z.object({
            type: z.string(),
            endpoint: z.string(),
          }),
        ),
        alsoKnownAs: z.array(z.string()),
        rotationKeys: z.array(z.string()),
        verificationMethods: z.record(z.string()),
      }),
      z.object({
        type: z.literal("create"),
        signingKey: z.string(),
        recoveryKey: z.string(),
        handle: z.string(),
        service: z.string(),
      }),
      z.object({
        type: z.literal("plc_tombstone"),
      }),
    ]),
  }),
);
