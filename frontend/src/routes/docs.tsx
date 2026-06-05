import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [{ title: "API Docs — AgriVision" }, { name: "description", content: "Diagnose plant images programmatically. Pay-per-scan." }] }),
  component: Docs,
});

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/diagnose`;

function Docs() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-sm text-muted-foreground">Diagnose plant images programmatically. Pay-per-scan.</p>
      </div>

      <Section title="Endpoint">
        <code className="block bg-card border border-border rounded-lg p-3 text-sm break-all">POST {ENDPOINT}</code>
      </Section>

      <Section title="Headers">
        <code className="block bg-card border border-border rounded-lg p-3 text-sm">x-api-key: av_xxxxxxxxxxxxxxxx<br/>Content-Type: application/json</code>
      </Section>

      <Section title="Body">
        <pre className="bg-card border border-border rounded-lg p-3 text-xs overflow-x-auto">{`{
  "image_base64": "<base64 of jpg/png>",
  "crop": "maize"   // optional
}`}</pre>
      </Section>

      <Section title="Response">
        <pre className="bg-card border border-border rounded-lg p-3 text-xs overflow-x-auto">{`{
  "species": "maize",
  "disease": "leaf_blight",
  "health": 0.42,
  "treatment": "Spray Neem oil (10ml/L) every 7 days...",
  "water_ml": 250
}`}</pre>
      </Section>

      <Section title="cURL">
        <pre className="bg-card border border-border rounded-lg p-3 text-xs overflow-x-auto">{`B64=$(base64 -w0 leaf.jpg)
curl -X POST '${ENDPOINT}' \\
  -H 'x-api-key: av_YOUR_KEY' \\
  -H 'Content-Type: application/json' \\
  -d "{\\"image_base64\\":\\"$B64\\",\\"crop\\":\\"maize\\"}"`}</pre>
      </Section>

      <Section title="JavaScript">
        <pre className="bg-card border border-border rounded-lg p-3 text-xs overflow-x-auto">{`const b64 = await fileToBase64(file);
const res = await fetch('${ENDPOINT}', {
  method: 'POST',
  headers: { 'x-api-key': 'av_YOUR_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ image_base64: b64, crop: 'maize' })
});
if (res.status === 402) console.log('Top up your balance');
const json = await res.json();`}</pre>
      </Section>

      <Section title="Errors">
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li><b>401</b> — invalid or missing <code>x-api-key</code></li>
          <li><b>402</b> — Payment Required (balance is $0)</li>
          <li><b>400</b> — invalid body</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: any) {
  return <div><h2 className="font-display text-xl font-semibold mb-2">{title}</h2>{children}</div>;
}
