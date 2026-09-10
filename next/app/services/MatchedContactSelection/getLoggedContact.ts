interface ContactMatch {
  readonly id?: string;
}

interface LogMatch {
  readonly contact?: string | { readonly id?: string };
  readonly contactId?: string;
  readonly type?: string;
}

function isLogMatch(match: unknown): match is LogMatch {
  return Boolean(match && typeof match === "object");
}

function getLoggedContactId(match: LogMatch): string | undefined {
  if (typeof match.contact === "string") {
    return match.contact;
  }
  return match.contact?.id ?? match.contactId;
}

/** Resolves the contact referenced by the first real CRM log match. */
export function getLoggedContact<T extends ContactMatch>(
  logMatches: readonly unknown[] | undefined,
  contactMatches: readonly T[] | undefined
): T | undefined {
  if (!contactMatches?.length) {
    return undefined;
  }
  for (const logMatch of logMatches ?? []) {
    if (!isLogMatch(logMatch) || logMatch.type === "status") {
      continue;
    }
    const contactId = getLoggedContactId(logMatch);
    const contact = contactMatches.find(({ id }) => id === contactId);
    if (contact) {
      return contact;
    }
  }
  return undefined;
}
