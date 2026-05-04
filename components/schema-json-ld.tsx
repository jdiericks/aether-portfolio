import { serializeJsonLd } from "@/lib/json-ld";

export function JsonLd({ data, schema }: { data?: unknown; schema?: unknown }) {
  const value = data ?? schema;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }}
    />
  );
}

export function JsonLdScript({ data, schema }: { data?: unknown; schema?: unknown }) {
  return <JsonLd data={data ?? schema} />;
}
