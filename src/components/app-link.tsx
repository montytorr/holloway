"use client";
import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useOptionalNavigationFeedback } from "./navigation-feedback";

// Fetch dynamic operator pages on intent rather than prefetching every visible row.
export default function AppLink(props: ComponentProps<typeof NextLink>) {
  const feedback = useOptionalNavigationFeedback();
  return (
    <NextLink
      prefetch={false}
      {...props}
      onNavigate={(event) => {
        let cancelled = false;
        props.onNavigate?.({
          preventDefault: () => {
            cancelled = true;
            event.preventDefault();
          },
        });
        if (cancelled) return;
        const destination =
          typeof props.href === "string"
            ? new URL(props.href, window.location.href)
            : null;
        if (
          !destination ||
          destination.pathname + destination.search !==
            window.location.pathname + window.location.search
        )
          feedback?.begin(destination?.href);
      }}
    />
  );
}
export { useLinkStatus } from "next/link";
